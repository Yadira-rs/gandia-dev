"""
vision/stream_processor.py
Procesa un stream RTSP continuo frame a frame.
Corre como Celery worker de larga duración en RunPod.
"""

import time
import cv2
import numpy as np
from loguru import logger
from typing import Optional

from vision.detector    import get_detector
from vision.tracker     import GandiaTracker
from vision.analyzer    import BehaviorAnalyzer
from vision.evidence    import evidence_capture
from anomaly.dispatcher import AnomalyDispatcher
from db.repositories.detecciones import detecciones_repo
from db.repositories.rfid        import rfid_repo
from config.settings import settings


class StreamProcessor:
    """
    Procesa un stream de cámara en tiempo real.
    Una instancia por cámara activa.
    """

    def __init__(self, camara_id: str, corral_id: str, rancho_id: str,
                 rtsp_url: str, session_id: str,
                 fps_target: int = 10,
                 n_vacas_esperadas: int = 0):
        self.camara_id          = camara_id
        self.corral_id          = corral_id
        self.rancho_id          = rancho_id
        self.rtsp_url           = rtsp_url
        self.session_id         = session_id
        self.fps_target         = fps_target
        self.n_vacas_esperadas  = n_vacas_esperadas

        self.detector    = get_detector()
        self.tracker     = GandiaTracker(fps=fps_target)
        self.analyzer    = BehaviorAnalyzer(rancho_id=rancho_id)
        self.dispatcher  = AnomalyDispatcher(rancho_id=rancho_id,
                                              corral_id=corral_id)

        self.frames_procesados = 0
        self.t_inicio          = time.time()
        self.running           = False

    def procesar_stream(self) -> None:
        """Loop principal de procesamiento del stream."""
        cap = cv2.VideoCapture(self.rtsp_url)

        if not cap.isOpened():
            logger.error(f"No se pudo abrir stream: {self.rtsp_url}")
            return

        frame_interval = 1.0 / self.fps_target
        t_ultimo_frame = 0

        logger.info(f"Stream iniciado: camara={self.camara_id} @ {self.fps_target}fps")
        self.running = True

        try:
            while self.running:
                ret, frame = cap.read()
                if not ret:
                    logger.warning("Frame perdido, reintentando...")
                    time.sleep(0.5)
                    continue

                # Throttle por FPS target
                ahora = time.time()
                if ahora - t_ultimo_frame < frame_interval:
                    continue
                t_ultimo_frame = ahora

                self._procesar_frame(frame)
                self.frames_procesados += 1

        finally:
            cap.release()
            fps_real = self.frames_procesados / max(time.time() - self.t_inicio, 1)
            detecciones_repo.cerrar_session(
                self.session_id, self.frames_procesados, fps_real
            )
            logger.info(f"Stream cerrado. {self.frames_procesados} frames @ {fps_real:.1f}fps")

    def procesar_frame_unico(self, frame: np.ndarray) -> dict:
        """
        Procesa un solo frame (para el endpoint /streams/frame).
        Retorna resultado completo.
        """
        return self._procesar_frame(frame, guardar=True)

    def detener(self) -> None:
        self.running = False

    # ── Privados ──────────────────────────────────────────────────────────────

    def _procesar_frame(self, frame: np.ndarray, guardar: bool = True) -> dict:
        # 1. Detectar
        resultado_yolo = self.detector.detectar(frame)
        dets_np        = self.detector.detecciones_para_tracker(resultado_yolo)

        # 2. Trackear
        tracks = self.tracker.actualizar(dets_np, frame.shape)

        # 3. Cruzar con RFID
        rfid_recientes = rfid_repo.lecturas_recientes(
            self.corral_id,
            ventana_segundos=settings.yolo_confidence  # reutilizamos settings
        )
        self._cruzar_rfid(tracks, rfid_recientes)

        # 4. Analizar comportamiento
        anomalias_detectadas = self.analyzer.analizar_tracks(
            tracks=tracks,
            n_vacas_esperadas=self.n_vacas_esperadas,
        )

        # 5. Disparar anomalías nuevas (evita duplicados internamente)
        nuevas_anomalias = []
        for a in anomalias_detectadas:
            track = next((t for t in tracks if t["track_id"] == a.get("track_id")), None)
            evidencia = {}
            if track:
                evidencia = evidence_capture.capturar_y_subir(
                    frame, track, self.rancho_id, self.corral_id
                )
            nueva = self.dispatcher.despachar(a, evidencia)
            if nueva:
                nuevas_anomalias.append(nueva)

        # 6. Guardar detección en DB
        conteos = resultado_yolo["conteos"]
        if guardar:
            detecciones_repo.guardar_deteccion(
                session_id        = self.session_id,
                camara_id         = self.camara_id,
                corral_id         = self.corral_id,
                n_vacas           = conteos["cow"],
                n_down            = conteos["cow_down"],
                n_wound           = conteos["wound_suspect"],
                confianza_promedio= resultado_yolo["confianza_promedio"],
                latencia_ms       = resultado_yolo["latencia_ms"],
                modelo_version    = resultado_yolo["modelo_version"],
            )

            for t in tracks:
                centroide = self.tracker.calcular_centroide_hato(tracks)
                dist      = self.tracker.distancia_al_centroide(t, centroide)
                detecciones_repo.upsert_track(
                    session_id   = self.session_id,
                    track_id_local = t["track_id"],
                    corral_id    = self.corral_id,
                    pos_x        = t["pos_x"],
                    pos_y        = t["pos_y"],
                    velocidad    = t["velocidad_actual"],
                    tiempo_inmovil = t["tiempo_inmovil_seg"],
                    dist_centroide = dist,
                    clase        = t["clase"],
                    confianza    = t["confianza"],
                    animal_id    = t.get("animal_id"),
                )

        return {
            "tracks":            tracks,
            "conteos":           conteos,
            "latencia_ms":       resultado_yolo["latencia_ms"],
            "anomalias_nuevas":  nuevas_anomalias,
            "modelo_version":    resultado_yolo["modelo_version"],
        }

    def _cruzar_rfid(self, tracks: list[dict], rfid_recientes: list) -> None:
        """
        Intenta emparejar tracks con lecturas RFID recientes por proximidad temporal.
        Asigna animal_id al track si hay match.
        """
        for rfid in rfid_recientes:
            animal_id = rfid.get("animal_id")
            if not animal_id:
                continue
            # Por ahora asigna al primer track sin animal_id
            # TODO: mejorar con posición del lector RFID
            for track in tracks:
                if track.get("animal_id") is None:
                    track["animal_id"] = animal_id
                    self.tracker.asignar_rfid(track["track_id"], animal_id)
                    break
