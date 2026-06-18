from fastapi import Header, HTTPException
from jose import JWTError, jwt
from app.config import settings

async def verify_api_key(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": "invalid_auth", "message": "Authorization header must be: Bearer <token>"}
        )

    token = authorization.removeprefix("Bearer ").strip()
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail={"error": "invalid_auth", "message": "Token is empty"}
        )

    # Accept master key (for testing / backend clients)
    if token == settings.shield_master_key:
        return token

    # Accept JWT token (for frontend users)
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail={"error": "invalid_auth", "message": "Invalid token"})
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail={"error": "invalid_auth", "message": "Invalid or expired token"}
        )