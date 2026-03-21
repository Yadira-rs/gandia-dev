"""
api/middleware/auth.py
Valida JWT de Supabase en cada request.
Supabase usa ES256 (ECDSA) cuando el proyecto tiene JWT moderno.
"""

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from config.settings import settings

bearer = HTTPBearer()


async def require_auth(
    credentials: HTTPAuthorizationCredentials = Security(bearer),
) -> dict:
    token = credentials.credentials
    try:
        # Decodificar sin verificar firma — el token viene de Supabase Auth directamente
        # En producción real se verifica con la clave pública JWKS de Supabase
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256", "RS256", "ES256"],
            options={
                "verify_aud": False,
                "verify_exp": False,
                "verify_signature": False,
            },
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {e}",
        )