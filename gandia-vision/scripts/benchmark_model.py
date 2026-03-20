"""
scripts/benchmark_model.py
Mide FPS real del modelo en el hardware actual.
Ejecutar en RunPod antes de producción.
"""

import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import numpy as np
import cv2
from vision.detector import get_detector


def benchmark(n_frames: int = 200, imgsz: int = 640):
    detector  = get_detector()
    frame     = np.random.randint(0, 255, (imgsz, imgsz, 3), dtype=np.uint8)
    latencias = []

    print(f"Benchmarking {n_frames} frames @ {imgsz}x{imgsz}...")
    print("Calentando modelo (10 frames)...")

    # Warmup
    for _ in range(10):
        detector.detectar(frame)

    # Benchmark real
    t0 = time.perf_counter()
    for i in range(n_frames):
        r = detector.detectar(frame)
        latencias.append(r["latencia_ms"])
        if (i + 1) % 50 == 0:
            print(f"  {i+1}/{n_frames} | latencia={r['latencia_ms']}ms")

    total = time.perf_counter() - t0
    fps   = n_frames / total
    p50   = sorted(latencias)[n_frames // 2]
    p95   = sorted(latencias)[int(n_frames * 0.95)]
    p99   = sorted(latencias)[int(n_frames * 0.99)]

    print(f"\n{'─'*40}")
    print(f"Resultado:")
    print(f"  FPS real:      {fps:.1f}")
    print(f"  Latencia p50:  {p50}ms")
    print(f"  Latencia p95:  {p95}ms")
    print(f"  Latencia p99:  {p99}ms")
    print(f"  Total tiempo:  {total:.1f}s")
    print(f"{'─'*40}")

    if fps >= 10:
        print("✓ Listo para streams @ 10 FPS")
    else:
        print(f"⚠ FPS insuficiente para 10 FPS target ({fps:.1f}fps)")


if __name__ == "__main__":
    benchmark()
