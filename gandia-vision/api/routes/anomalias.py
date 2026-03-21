"""api/routes/anomalias.py"""
from fastapi import APIRouter, Depends, Body
from api.middleware.auth import require_auth
from db.repositories.anomalias import anomalias_repo

router = APIRouter(prefix="/anomalias", tags=["Anomalías"])


@router.get("/{rancho_id}")
async def get_anomalias(
    rancho_id: str,
    activas: bool = True,
    _auth = Depends(require_auth),
):
    if activas:
        return anomalias_repo.anomalias_activas(rancho_id)
    return anomalias_repo.anomalias_activas(rancho_id)


@router.patch("/{anomalia_id}/resolver")
async def resolver_anomalia(
    anomalia_id: str,
    resuelto_por: str = Body(..., embed=True),
    _auth = Depends(require_auth),
):
    anomalias_repo.resolver(anomalia_id, resuelto_por)
    return {"ok": True}
