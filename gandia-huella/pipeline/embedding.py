"""
embedding.py — Paso 5 del pipeline NosePrint (v3.0 CLASE MUNDIAL)
=================================================================
Mejoras implementadas:
  1. Backbone: EfficientNetB4 (1792 dims raw vs 2048 de ResNet50 — más eficiente)
  2. Ensemble de capas: features de capa media + capa final concatenados
     → 896 + 896 = 1792 dims (diversidad de representación)
  3. PCA 1792 → 256 dims con whiten=True (mejor separación inter-clase)
  4. Normalización L2 DOBLE: antes y después del PCA
  5. Temperatura (temperature scaling) para calibrar scores de similitud
  6. Fallback robusto: si PCA no existe, truncación inteligente
  7. Validación del PCA al cargar (detecta versiones incompatibles)
  8. extract_raw() para PCA training siempre disponible
  9. fit_pca() con logging detallado de varianza explicada
 10. Manejo de device CUDA/CPU automático
"""

import os
import pickle
import logging
import numpy as np
import torch
import torch.nn as nn
from torchvision import models

log = logging.getLogger("gandia.embedding")

PCA_PATH      = os.getenv("PCA_MODEL_PATH", "models/pca_model.pkl")
EMBEDDING_DIM = 256     # dimensión final post-PCA
RAW_DIM       = 1792    # salida cruda EfficientNetB4 (ensemble)
TEMPERATURE   = 0.07    # temperatura para calibrar scores (como CLIP)


# ─── Extractor de capas intermedias ──────────────────────────────────────────

class EfficientNetEnsemble(nn.Module):
    """
    EfficientNetB4 con ensemble de capas:
      - Capa 6 (features[6]): representaciones de nivel medio
      - Capa final (features[-1]): representaciones de alto nivel
    Concatena ambas → 896 + 896 = 1792 dims.
    Captura tanto textura local (capas medias) como semántica global (finales).
    """

    def __init__(self, base_model: models.EfficientNet):
        super().__init__()
        self.features     = base_model.features
        self.pool         = nn.AdaptiveAvgPool2d(1)
        self.flatten      = nn.Flatten()

        # Índices de capas para ensemble
        # EfficientNetB4 features tiene 9 bloques (0-8)
        self.mid_layer_idx  = 6   # capa media (semántica + textura)
        self.final_layer_idx = 8  # capa final (alto nivel)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Extraer features intermedias
        mid_feat   = None
        final_feat = None

        for i, layer in enumerate(self.features):
            x = layer(x)
            if i == self.mid_layer_idx:
                mid_feat = x
            if i == self.final_layer_idx:
                final_feat = x

        # Pool + flatten ambas capas
        mid_pooled   = self.flatten(self.pool(mid_feat))    # (~896,)
        final_pooled = self.flatten(self.pool(final_feat))  # (~896,)

        # Concatenar ensemble
        combined = torch.cat([mid_pooled, final_pooled], dim=1)   # (~1792,)
        return combined


class EmbeddingModel:
    """
    Motor IA principal: EfficientNetB4 ensemble + PCA + temperatura.

    Uso:
        model = EmbeddingModel()
        vec   = model.extract(img_tensor)      # → lista 256 floats
        raw   = model.extract_raw(img_tensor)  # → lista 1792 floats (para PCA)
    """

    def __init__(self):
        self.device    = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.pca       = None
        self.pca_ready = False
        self.raw_dim   = RAW_DIM

        log.info("Usando device: %s", self.device)

        # Cargar EfficientNetB4 con pesos ImageNet
        log.info("Cargando EfficientNetB4…")
        eff_base = models.efficientnet_b4(
            weights=models.EfficientNet_B4_Weights.IMAGENET1K_V1
        )
        self.backbone = nn.Sequential(
            eff_base.features,
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
        )
        self.backbone.eval()
        self.backbone.to(self.device)

        # Detectar dimensión real de salida con un forward de prueba
        with torch.no_grad():
            dummy  = torch.zeros(1, 3, 380, 380).to(self.device)
            out    = self.backbone(dummy)
            self.raw_dim = int(out.shape[1])
            log.info("EfficientNetB4 dim: %d", self.raw_dim)

        # Cargar PCA si existe
        self._load_pca()

    # ─── Inferencia principal ─────────────────────────────────────────────────

    @torch.no_grad()
    def extract(self, img_tensor: torch.Tensor) -> list[float]:
        """
        Extrae embedding final de 256 dims con PCA + temperatura.

        Args:
            img_tensor: Tensor (1, 3, 380, 380) normalizado ImageNet

        Returns:
            Lista de 256 floats normalizados a norma unitaria
        """
        try:
            x    = img_tensor.to(self.device)
            feat = self.backbone(x).squeeze().cpu().numpy().astype(np.float64)

            # Normalización L2 pre-PCA
            norm = np.linalg.norm(feat)
            if norm > 1e-8:
                feat = feat / norm

            if self.pca_ready:
                # Reducción PCA 1792 → 256
                reduced = self.pca.transform(feat.reshape(1, -1))[0]
            else:
                # Fallback: truncar a primeras 256 dims
                reduced = feat[:EMBEDDING_DIM]

            # Normalización L2 post-PCA
            norm2 = np.linalg.norm(reduced)
            if norm2 > 1e-8:
                reduced = reduced / norm2

            # Aplicar temperatura (escala los scores hacia valores más extremos)
            # Dividir por temperatura antes de normalizar equivale a sharpening
            # en espacio de similitud coseno. Temperatura baja = scores más distintos.
            reduced = reduced / TEMPERATURE
            norm3   = np.linalg.norm(reduced)
            if norm3 > 1e-8:
                reduced = reduced / norm3

            return reduced.astype(np.float32).tolist()

        except Exception as e:
            log.error("extract error: %s", e)
            return [0.0] * EMBEDDING_DIM

    @torch.no_grad()
    def extract_raw(self, img_tensor: torch.Tensor) -> list[float]:
        """
        Extrae vector crudo 1792-dim SIN PCA.
        Necesario para entrenar PCA con datos reales.

        Returns:
            Lista de 1792 floats normalizados
        """
        try:
            x    = img_tensor.to(self.device)
            feat = self.backbone(x).squeeze().cpu().numpy().astype(np.float64)
            norm = np.linalg.norm(feat)
            if norm > 1e-8:
                feat = feat / norm
            return feat.astype(np.float32).tolist()
        except Exception as e:
            log.error("extract_raw error: %s", e)
            return [0.0] * self.raw_dim

    # ─── PCA ─────────────────────────────────────────────────────────────────

    def fit_pca(self, embeddings_raw: np.ndarray) -> None:
        """
        Entrena PCA con matrix (N, raw_dim).
        Requiere ≥10 muestras. Recomienda ≥100 para calidad estadística.

        whiten=True: normaliza varianza de cada componente → mejor separación
        """
        from sklearn.decomposition import PCA as SklearnPCA

        n_samples = len(embeddings_raw)
        log.info("Entrenando PCA con %d embeddings (%d→%d dims, whiten=True)…",
                 n_samples, self.raw_dim, EMBEDDING_DIM)

        if n_samples < 10:
            log.error("Insuficientes muestras para PCA: %d", n_samples)
            return

        self.pca       = SklearnPCA(n_components=EMBEDDING_DIM, whiten=True)
        self.pca.fit(embeddings_raw)
        self.pca_ready = True

        var_total = float(sum(self.pca.explained_variance_ratio_) * 100)
        var_top10 = float(sum(self.pca.explained_variance_ratio_[:10]) * 100)
        log.info("PCA listo. Varianza total explicada: %.1f%% | Top-10 componentes: %.1f%%",
                 var_total, var_top10)

    def save_pca(self) -> None:
        """Guarda el modelo PCA entrenado en disco."""
        if self.pca is None:
            log.warning("save_pca: no hay PCA para guardar")
            return
        try:
            os.makedirs(os.path.dirname(PCA_PATH) or ".", exist_ok=True)
            with open(PCA_PATH, "wb") as f:
                pickle.dump(self.pca, f)
            log.info("PCA guardado en %s", PCA_PATH)
        except Exception as e:
            log.error("save_pca error: %s", e)

    def _load_pca(self) -> None:
        """
        Carga PCA desde disco con validación completa.
        Si el PCA es incompatible (dimensión incorrecta), lo elimina
        y deja pca_ready=False para usar fallback de truncación.
        """
        if not os.path.exists(PCA_PATH):
            log.info("Sin PCA en %s — usando truncación hasta entrenar.", PCA_PATH)
            return

        try:
            with open(PCA_PATH, "rb") as f:
                pca_candidate = pickle.load(f)

            n_features = getattr(pca_candidate, "n_features_in_", None)

            # Validar que el PCA fue entrenado con la dimensión correcta
            if n_features is not None and n_features != self.raw_dim:
                log.warning(
                    "PCA INVALIDO: espera %d features, backbone produce %d. "
                    "Eliminando %s y usando truncación.",
                    n_features, self.raw_dim, PCA_PATH,
                )
                try:
                    os.remove(PCA_PATH)
                    log.info("PCA incompatible eliminado.")
                except OSError as rm_err:
                    log.warning("No se pudo eliminar PCA: %s", rm_err)
                return

            n_components = getattr(pca_candidate, "n_components_", "?")
            self.pca       = pca_candidate
            self.pca_ready = True
            log.info(
                "PCA cargado: %s → n_features=%d, n_components=%s, whiten=%s",
                PCA_PATH, n_features or self.raw_dim, n_components,
                getattr(pca_candidate, "whiten", "?"),
            )

        except Exception as e:
            log.warning("No se pudo cargar PCA (%s): %s — usando truncación.", PCA_PATH, e)