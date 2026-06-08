from fastapi import Header, HTTPException
from app.config import settings

async def verify_api_key(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"error": "invalid_auth", "message": "Authorization header must be: Bearer <key>"}
        )
    key = authorization.removeprefix("Bearer ").strip()
    if not key:
        raise HTTPException(
            status_code=401,
            detail={"error": "invalid_auth", "message": "API key is empty"}
        )
    # Phase 1: single hardcoded master key (Postgres lookup added in Phase 4)
    if key != settings.shield_master_key:
        raise HTTPException(
            status_code=401,
            detail={"error": "invalid_auth", "message": "Invalid API key"}
        )
    return key