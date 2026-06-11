from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import proxy
from app.llm.gpt import close_client
from app.cache.redis_client import close_redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("LLM-Shield proxy starting up...")
    yield
    print("LLM-Shield shutting down...")
    await close_client()
    await close_redis()

app = FastAPI(
    title="LLM-Shield",
    description="Semantic proxy and observability layer for LLM APIs",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proxy.router)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.2.0"}

@app.get("/debug/config")
async def debug_config():
    from app.config import settings
    return {
        "shield_master_key": settings.shield_master_key,
        "github_pat_set": bool(settings.github_pat),
        "redis_url_set": bool(settings.upstash_redis_rest_url),
        "cache_threshold": settings.cache_similarity_threshold,
    }