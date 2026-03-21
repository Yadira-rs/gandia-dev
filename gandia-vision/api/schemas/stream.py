"""api/schemas/stream.py"""
from pydantic import BaseModel, Field
from typing import Optional


class FrameRequest(BaseModel):
    camara_id:         str
    corral_id:         str
    rancho_id:         str
    session_id:        str
    frame_b64:         str              = Field(..., description="Frame JPEG en base64")
    n_vacas_esperadas: int              = 0


class StreamStartRequest(BaseModel):
    camara_id:         str
    corral_id:         str
    rancho_id:         str
    rtsp_url:          str
    fps_target:        int              = Field(default=10, ge=1, le=30)
    n_vacas_esperadas: int              = 0


class StreamStopRequest(BaseModel):
    camara_id: str


class DeteccionResponse(BaseModel):
    tracks:           list
    conteos:          dict
    latencia_ms:      int
    anomalias_nuevas: list
    modelo_version:   str
