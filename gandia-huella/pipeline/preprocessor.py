"""
preprocessor.py — Paso 3 del pipeline NosePrint (v3.0 CLASE MUNDIAL)
=====================================================================
Mejoras implementadas:
  1. CLAHE agresivo (clipLimit=3.0) para campo real (barro, sombras, sol)
  2. Banco Gabor completo (8 orientaciones × 4 frecuencias) para micro-surcos
  3. Normalización por zonas (9 zonas) — cada región del morro normalizada por separado
  4. Sharpening adaptativo — refuerza bordes sin introducir ruido
  5. Equalización de iluminación por canal antes del tensor IA
  6. Transform para EfficientNetB4 (380×380 nativo)
  7. Transform adicional para ResNet50 (fallback 224×224)
  8. Manejo robusto de errores — nunca falla, siempre devuelve algo útil
  9. Logging detallado para diagnóstico
 10. Conversión a float32 explícita en todos los pasos intermedios

SALIDAS:
  img_gray   → numpy uint8 256×256 — para motor fingerprint CV
  img_tensor → torch.Tensor (1,3,380,380) — para EfficientNetB4
"""

import cv2
import numpy as np
import torch
import logging
from torchvision import transforms

log = logging.getLogger("gandia.preprocessor")

TARGET_SIZE       = 256    # tamaño para fingerprint
EFFICIENTNET_SIZE = 380    # tamaño nativo EfficientNetB4

# ─── Transforms ───────────────────────────────────────────────────────────────

_efficientnet_transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((EFFICIENTNET_SIZE, EFFICIENTNET_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std= [0.229, 0.224, 0.225]),
])

_resnet_transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std= [0.229, 0.224, 0.225]),
])


# ─── Banco Gabor completo ─────────────────────────────────────────────────────

def _build_gabor_bank() -> list[np.ndarray]:
    """
    Construye banco de filtros Gabor.
    8 orientaciones × 4 frecuencias = 32 filtros.
    Captura micro-surcos biométricos en todas las direcciones.
    """
    filters = []
    orientations = np.linspace(0, np.pi, 8, endpoint=False)
    wavelengths  = [4.0, 6.0, 8.0, 12.0]
    sigma        = 3.0
    gamma        = 0.5

    for theta in orientations:
        for lam in wavelengths:
            kernel = cv2.getGaborKernel(
                (21, 21), sigma, float(theta), float(lam), gamma, 0, ktype=cv2.CV_32F
            )
            # Normalizar kernel para que no cambie la brillo media
            kernel -= kernel.mean()
            filters.append(kernel)

    return filters

# Precalcular banco al cargar el módulo
_GABOR_BANK = _build_gabor_bank()


def _gabor_enhance(gray: np.ndarray) -> np.ndarray:
    """
    Aplica banco Gabor completo y extrae energía acumulada.
    Resalta micro-surcos del morro en todas las orientaciones.
    Mezcla 55% original + 45% realce para preservar textura base.
    """
    gray_f   = gray.astype(np.float32)
    enhanced = np.zeros_like(gray_f)

    for kernel in _GABOR_BANK:
        response  = cv2.filter2D(gray_f, cv2.CV_32F, kernel)
        enhanced += np.abs(response)

    # Normalizar a rango 0-255
    if enhanced.max() > enhanced.min():
        enhanced = cv2.normalize(enhanced, None, 0, 255, cv2.NORM_MINMAX)
    enhanced = enhanced.astype(np.uint8)

    # Mezclar: conservar textura original + amplificar micro-surcos
    result = cv2.addWeighted(gray, 0.55, enhanced, 0.45, 0)
    return result


# ─── Normalización por zonas ──────────────────────────────────────────────────

def _normalize_by_zones(gray: np.ndarray, zones: int = 3) -> np.ndarray:
    """
    Divide la imagen en zones×zones bloques y aplica CLAHE por separado.
    Corrige variaciones de iluminación locales (sombras parciales, manchas).
    """
    h, w    = gray.shape
    bh, bw  = h // zones, w // zones
    result  = gray.copy()
    clahe_z = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))

    for i in range(zones):
        for j in range(zones):
            y1 = i * bh
            y2 = (i + 1) * bh if i < zones - 1 else h
            x1 = j * bw
            x2 = (j + 1) * bw if j < zones - 1 else w
            result[y1:y2, x1:x2] = clahe_z.apply(gray[y1:y2, x1:x2])

    return result


# ─── Sharpening adaptativo ────────────────────────────────────────────────────

def _adaptive_sharpen(gray: np.ndarray) -> np.ndarray:
    """
    Sharpening unsharp mask adaptativo.
    Solo refuerza bordes donde la varianza local es alta (zona de textura útil).
    Evita amplificar ruido en zonas lisas.
    """
    blurred = cv2.GaussianBlur(gray.astype(np.float32), (5, 5), 1.5)
    detail  = gray.astype(np.float32) - blurred

    # Máscara de varianza local — solo aplicar donde hay textura
    var_map = cv2.boxFilter((detail**2), -1, (9, 9))
    var_map = np.clip(var_map / (var_map.max() + 1e-6), 0, 1).astype(np.float32)

    # Agregar detalle ponderado por varianza
    sharpened = gray.astype(np.float32) + 0.4 * detail * var_map
    sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)
    return sharpened


# ─── Ecualización de iluminación por canal ────────────────────────────────────

def _equalize_channels(img_bgr: np.ndarray) -> np.ndarray:
    """
    Ecualiza cada canal BGR por separado con CLAHE suave.
    Reduce el efecto de iluminación no uniforme en la imagen a color.
    """
    clahe_c = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
    result  = img_bgr.copy()
    for c in range(3):
        result[:, :, c] = clahe_c.apply(img_bgr[:, :, c])
    return result


# ─── Pipeline principal ───────────────────────────────────────────────────────

def preprocess(img_bgr: np.ndarray) -> dict:
    """
    Pipeline completo de preprocesamiento.

    Args:
        img_bgr: imagen BGR recortada de la región del morro (cualquier tamaño)

    Returns:
        {
            "img_gray":       numpy uint8 (256,256)     — para fingerprint CV
            "img_tensor":     torch.Tensor (1,3,380,380) — para EfficientNetB4
            "img_tensor_224": torch.Tensor (1,3,224,224) — fallback ResNet50
        }

    Nunca lanza excepción — devuelve imagen en negro si hay error grave.
    """
    try:
        # ── Validar entrada ──────────────────────────────────────────────────
        if img_bgr is None or img_bgr.size == 0:
            log.warning("preprocess: imagen vacía recibida, usando fallback")
            img_bgr = np.zeros((256, 256, 3), dtype=np.uint8)

        # ── 1. Redimensionar a 256×256 ───────────────────────────────────────
        img_resized = cv2.resize(img_bgr, (TARGET_SIZE, TARGET_SIZE),
                                 interpolation=cv2.INTER_AREA)

        # ── 2. CLAHE global agresivo — para campo (barro, sombras, sol) ──────
        gray_raw  = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
        clahe_g   = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        gray_clahe = clahe_g.apply(gray_raw)

        # ── 3. Normalización por zonas (3×3 = 9 zonas) ───────────────────────
        gray_zoned = _normalize_by_zones(gray_clahe, zones=3)

        # ── 4. Realce Gabor — resalta micro-surcos biométricos ───────────────
        gray_gabor = _gabor_enhance(gray_zoned)

        # ── 5. Sharpening adaptativo — refuerza bordes útiles ────────────────
        gray_sharp = _adaptive_sharpen(gray_gabor)

        # ── 6. Suavizado final ligero — reduce ruido residual ─────────────────
        gray_final = cv2.GaussianBlur(gray_sharp, (3, 3), 0.5)

        # ── 7. Ecualización de canales para la red neuronal ───────────────────
        img_eq  = _equalize_channels(img_resized)
        img_rgb = cv2.cvtColor(img_eq, cv2.COLOR_BGR2RGB)

        # ── 8. Tensor EfficientNetB4 (380×380) ───────────────────────────────
        tensor_380 = _efficientnet_transform(img_rgb).unsqueeze(0)

        # ── 9. Tensor ResNet50 fallback (224×224) ────────────────────────────
        tensor_224 = _resnet_transform(img_rgb).unsqueeze(0)

        return {
            "img_gray":       gray_final,   # numpy uint8 (256,256)
            "img_tensor":     tensor_380,   # Tensor (1,3,380,380)
            "img_tensor_224": tensor_224,   # Tensor (1,3,224,224)
        }

    except Exception as e:
        log.error("preprocess error: %s — usando fallback en negro", e)
        fallback_gray   = np.zeros((TARGET_SIZE, TARGET_SIZE), dtype=np.uint8)
        fallback_tensor = torch.zeros(1, 3, EFFICIENTNET_SIZE, EFFICIENTNET_SIZE)
        fallback_224    = torch.zeros(1, 3, 224, 224)
        return {
            "img_gray":       fallback_gray,
            "img_tensor":     fallback_tensor,
            "img_tensor_224": fallback_224,
        }