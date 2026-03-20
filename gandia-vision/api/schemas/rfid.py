"""api/schemas/rfid.py"""
from pydantic import BaseModel
from typing import Optional


class RFIDEventoRequest(BaseModel):
    arete:     str
    corral_id: str
    rancho_id: str
    tipo:      str      = "lectura"   # entrada | salida | lectura
    lector_id: Optional[str] = None


class RFIDEventoResponse(BaseModel):
    evento_id: Optional[str]
    matched:   bool
    animal_id: Optional[str] = None
