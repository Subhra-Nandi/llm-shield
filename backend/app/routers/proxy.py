import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import verify_api_key
from app.llm.gpt import call_gpt4o
from app.cache.semantic import embed_text, search_cache, store_in_cache
import httpx

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str = "gpt-4o"
    messages: list[Message]
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

@router.post("/v1/chat/completions")
async def proxy_chat(
    request: ChatRequest,
    api_key: str = Depends(verify_api_key),
):
    start = time.monotonic()

    # Extract the last user message — that's what we cache on
    user_messages = [m for m in request.messages if m.role == "user"]
    if not user_messages:
        raise HTTPException(status_code=400, detail="No user message found")
    prompt_text = user_messages[-1].content

    # ── STEP 1: embed the prompt ──────────────────────────────────────────
    # Cheap: ~0.5ms + tiny API call. Much cheaper than a GPT-4o call.
    query_embedding = await embed_text(prompt_text)

    # ── STEP 2: check semantic cache ──────────────────────────────────────
    cached = await search_cache(query_embedding)
    if cached:
        latency_ms = int((time.monotonic() - start) * 1000)
        cached["shield"] = {
            "latency_ms": latency_ms,
            "cache_hit": True,
            "provider": "cache",
        }
        return cached

    # ── STEP 3: cache miss → call GPT-4o ─────────────────────────────────
    try:
        messages_as_dicts = [m.model_dump() for m in request.messages]
        gpt_response = await call_gpt4o(messages_as_dicts, model=request.model)
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail={"error": "upstream_timeout", "message": "GPT-4o did not respond in time"}
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail={"error": "upstream_error", "message": str(e)}
        )

    # ── STEP 4: store in cache for next time ──────────────────────────────
    await store_in_cache(prompt_text, query_embedding, gpt_response)

    latency_ms = int((time.monotonic() - start) * 1000)
    gpt_response["shield"] = {
        "latency_ms": latency_ms,
        "cache_hit": False,
        "provider": "gpt-4o",
    }
    return gpt_response