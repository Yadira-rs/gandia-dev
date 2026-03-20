"""api/routes/score.py"""
from fastapi import APIRouter, Depends
from api.middleware.auth import require_auth
from anomaly.scorer import scorer

router = APIRouter(prefix="/score", tags=["Score"])


@router.get("/{rancho_id}")
async def get_score(
    rancho_id: str,
    _auth = Depends(require_auth),
):
    """
    Score sanitario 0-100 con breakdown.
    Fuente de verdad del sistema — reemplaza el cálculo frontend.
    """
    return scorer.calcular(rancho_id)
