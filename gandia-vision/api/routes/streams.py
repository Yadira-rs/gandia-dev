"""
api/routes/streams.py
Endpoints de procesamiento de video.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from loguru import logger

from api.schemas.stream  import FrameRequest, StreamStartRequest, StreamStopRequest, DeteccionResponse
from api.middleware.auth import require_auth

router = APIRouter(prefix="/streams", tags=["Streams"])


@router.post("/frame", response_model=DeteccionResponse)
async def procesar_frame(
    body: FrameRequest,
    background_tasks: BackgroundTasks,
    _auth = Depends(require_auth),
):
    """
    Procesa un frame individual (JPEG en base64).
    Útil para uploads manuales o cámaras sin RTSP.
    """
    try:
        from workers.task_frame import procesar_frame as task
        result = task.delay(
            frame_b64         = body.frame_b64,
            camara_id         = body.camara_id,
            corral_id         = body.corral_id,
            rancho_id         = body.rancho_id,
            session_id        = body.session_id,
            n_vacas_esperadas = body.n_vacas_esperadas,
        )
        data = result.get(timeout=30)
        return data
    except Exception as e:
        logger.error(f"Error en /frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
async def iniciar_stream(
    body: StreamStartRequest,
    _auth = Depends(require_auth),
):
    """
    Inicia el procesamiento continuo de un stream RTSP.
    El worker Celery corre en RunPod de forma asíncrona.
    """
    from db.repositories.detecciones import detecciones_repo
    from workers.task_stream import iniciar_stream as task

    session = detecciones_repo.crear_session(
        rancho_id     = body.rancho_id,
        camara_id     = body.camara_id,
        corral_id     = body.corral_id,
        fps_target    = body.fps_target,
        modelo_version= "yolov11n-gandia-1.0",
    )
    session_id = session.get("id")

    task.delay(
        camara_id         = body.camara_id,
        corral_id         = body.corral_id,
        rancho_id         = body.rancho_id,
        rtsp_url          = body.rtsp_url,
        fps_target        = body.fps_target,
        n_vacas_esperadas = body.n_vacas_esperadas,
    )

    logger.info(f"Stream iniciado: {body.camara_id} | session={session_id}")
    return {"ok": True, "session_id": session_id}


@router.post("/stop")
async def detener_stream(
    body: StreamStopRequest,
    _auth = Depends(require_auth),
):
    """Detiene un stream activo."""
    from workers.task_stream import detener_stream as task
    result = task.delay(camara_id=body.camara_id)
    return result.get(timeout=10)
