from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import proxy, stats, auth
from app.llm.gpt import close_client
from app.cache.redis_client import close_redis
from app.db.session import create_tables, close_db
from app.observability.metrics import metrics_asgi_app
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("LLM-Shield proxy starting up...")
    await create_tables()
    yield
    print("LLM-Shield shutting down...")
    await close_client()
    await close_redis()
    await close_db()

app = FastAPI(
    title="LLM-Shield",
    description="Semantic proxy and observability layer for LLM APIs",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend domain in production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/metrics", metrics_asgi_app)
app.include_router(proxy.router)
app.include_router(stats.router)
app.include_router(auth.router)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

@app.get("/debug/config")
async def debug_config():
    from app.config import settings
    return {
        "shield_master_key": settings.shield_master_key,
        "github_pat_set": bool(settings.github_pat),
        "redis_url_set": bool(settings.upstash_redis_rest_url),
        "database_url_set": bool(settings.database_url),
        "cache_threshold": settings.cache_similarity_threshold,
    }