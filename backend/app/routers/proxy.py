import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import verify_api_key
from app.llm.gpt import call_gpt4o
import httpx

router = APIRouter()

# --- Request/Response models ---

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str = "gpt-4o"
    messages: list[Message]
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

# --- Route ---

@router.post("/v1/chat/completions")
async def proxy_chat(
    request: ChatRequest,
    api_key: str = Depends(verify_api_key),   # auth runs first, always
):
    start = time.monotonic()

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

    latency_ms = int((time.monotonic() - start) * 1000)

    # Add our own metadata to the response (visible in frontend later)
    gpt_response["shield"] = {
        "latency_ms": latency_ms,
        "cache_hit": False,
        "provider": "gpt-4o",
    }

    return gpt_response