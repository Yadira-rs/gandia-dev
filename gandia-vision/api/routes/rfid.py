"""api/routes/rfid.py"""
from fastapi import APIRouter, Depends
from api.schemas.rfid    import RFIDEventoRequest, RFIDEventoResponse
from api.middleware.auth import require_auth

router = APIRouter(prefix="/rfid", tags=["RFID"])


@router.post("/evento", response_model=RFIDEventoResponse)
async def recibir_evento_rfid(
    body: RFIDEventoRequest,
    _auth = Depends(require_auth),
):
    """
    Endpoint REST para lecturas RFID.
    Alternativa a MQTT para lectores sin broker.
    """
    from workers.task_rfid import procesar_lectura
    result = procesar_lectura.delay(
        arete     = body.arete,
        corral_id = body.corral_id,
        rancho_id = body.rancho_id,
        tipo      = body.tipo,
        fuente    = "rest",
        lector_id = body.lector_id,
    )
    data = result.get(timeout=10)
    return RFIDEventoResponse(**data)


@router.get("/eventos/{rancho_id}")
async def get_eventos_rfid(
    rancho_id: str,
    _auth = Depends(require_auth),
):
    from db.repositories.rfid import rfid_repo
    return rfid_repo.eventos_por_rancho(rancho_id)
