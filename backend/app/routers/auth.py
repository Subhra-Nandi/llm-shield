from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import User
from app.config import settings

router = APIRouter(prefix="/auth")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()

# --- Models ---

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# --- JWT helpers ---

def create_token(user_id: str, expires_minutes: int = 60 * 24) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expires_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
) -> str:
    return verify_token(credentials.credentials)

# --- Routes ---

@router.post("/signup")
async def signup(req: SignupRequest):
    async with AsyncSessionLocal() as session:
        existing = await session.execute(
            select(User).where(User.email == req.email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
        user = User(
            name=req.name,
            email=req.email,
            password_hash=pwd_context.hash(req.password),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}

@router.post("/login")
async def login(req: LoginRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == req.email)
        )
        user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == req.email)
        )
        user = result.scalar_one_or_none()
    if not user:
        return {"message": "If that email exists, a reset link has been sent"}
    reset_token = create_token(user.id, expires_minutes=30)
    print(f"RESET TOKEN for {req.email}: {reset_token}")
    return {
        "message": "If that email exists, a reset link has been sent",
        "dev_token": reset_token
    }

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    user_id = verify_token(req.token)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.password_hash = pwd_context.hash(req.new_password)
        session.add(user)
        await session.commit()
    return {"message": "Password reset successfully"}

@router.get("/me")
async def me(user_id: str = Depends(get_current_user)):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "name": user.name, "email": user.email}