"""api/routes/detecciones.py"""
from fastapi import APIRouter, Depends, Query
from api.middleware.auth import require_auth
from db.repositories.detecciones import detecciones_repo

router = APIRouter(prefix="/detecciones", tags=["Detecciones"])


@router.get("/{corral_id}")
async def get_detecciones(
    corral_id: str,
    limite: int = Query(default=100, le=500),
    _auth = Depends(require_auth),
):
    return detecciones_repo.ultimas_detecciones(corral_id, limite)


@router.get("/tracks/{session_id}")
async def get_tracks(
    session_id: str,
    _auth = Depends(require_auth),
):
    return detecciones_repo.tracks_activos(session_id)
