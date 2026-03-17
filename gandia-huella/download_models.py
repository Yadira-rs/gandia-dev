"""
download_models.py — Pre-descarga modelos en tiempo de build.
Railway ejecuta esto durante el build para que no descargue al arrancar..
"""
import torch
from torchvision import models

print("Pre-descargando EfficientNetB4...", flush=True)
models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.IMAGENET1K_V1)
print("✅ EfficientNetB4 descargado y cacheado", flush=True)