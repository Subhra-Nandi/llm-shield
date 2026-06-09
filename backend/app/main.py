from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import proxy
from app.llm.gpt import close_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing to initialise yet (client is lazy-created on first request)
    print("LLM-Shield proxy starting up...")
    yield
    # Shutdown: cleanly close the httpx connection pool
    print("LLM-Shield shutting down, closing HTTP client...")
    await close_client()

app = FastAPI(
    title="LLM-Shield",
    description="Semantic proxy and observability layer for LLM APIs",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allows the React frontend (Phase 6) to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to specific domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(proxy.router)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}