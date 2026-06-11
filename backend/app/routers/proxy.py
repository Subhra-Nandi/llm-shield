import time
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import verify_api_key
from app.llm.gpt import call_gpt4o
from app.cache.semantic import embed_text, search_cache, store_in_cache
from app.security.pii import redact_pii
from app.security.injection import is_injection
from app.observability.logger import log_request
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
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key),
):
    start = time.monotonic()

    user_messages = [m for m in request.messages if m.role == "user"]
    if not user_messages:
        raise HTTPException(status_code=400, detail="No user message found")
    prompt_text = user_messages[-1].content

    # ── STEP 1: PII redaction ─────────────────────────────────────────────
    redacted_prompt, pii_found = redact_pii(prompt_text)
    if pii_found:
        print(f"PII redacted. Original: {prompt_text[:80]}")
        print(f"PII redacted. Cleaned:  {redacted_prompt[:80]}")
        messages = list(request.messages)
        messages[-1] = Message(role="user", content=redacted_prompt)
    else:
        messages = list(request.messages)

    # ── STEP 2: injection detection ───────────────────────────────────────
    injection_detected, reason = is_injection(prompt_text)
    if injection_detected:
        latency_ms = int((time.monotonic() - start) * 1000)
        background_tasks.add_task(
            log_request,
            api_key_id=api_key,
            model=request.model,
            provider_used="blocked",
            prompt_tokens=0,
            completion_tokens=0,
            latency_ms=latency_ms,
            cache_hit=False,
            was_blocked=True,
            pii_detected=pii_found,
        )
        raise HTTPException(
            status_code=403,
            detail={
                "error": "prompt_injection",
                "message": "Request blocked: prompt injection detected",
                "reason": reason,
            }
        )

    # ── STEP 3: embed ─────────────────────────────────────────────────────
    query_embedding = await embed_text(redacted_prompt)

    # ── STEP 4: cache check ───────────────────────────────────────────────
    cached = await search_cache(query_embedding)
    if cached:
        latency_ms = int((time.monotonic() - start) * 1000)
        background_tasks.add_task(
            log_request,
            api_key_id=api_key,
            model=request.model,
            provider_used="cache",
            prompt_tokens=0,
            completion_tokens=0,
            latency_ms=latency_ms,
            cache_hit=True,
            was_blocked=False,
            pii_detected=pii_found,
        )
        cached["shield"] = {
            "latency_ms": latency_ms,
            "cache_hit": True,
            "pii_redacted": pii_found,
            "provider": "cache",
        }
        return cached

    # ── STEP 5: call GPT-4o ───────────────────────────────────────────────
    try:
        messages_as_dicts = [m.model_dump() for m in messages]
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

    # ── STEP 6: store in cache ────────────────────────────────────────────
    await store_in_cache(redacted_prompt, query_embedding, gpt_response)

    # ── STEP 7: extract token usage ───────────────────────────────────────
    usage = gpt_response.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)
    actual_model = gpt_response.get("model", request.model)

    latency_ms = int((time.monotonic() - start) * 1000)

    # ── STEP 8: log async (never blocks response) ─────────────────────────
    background_tasks.add_task(
        log_request,
        api_key_id=api_key,
        model=actual_model,
        provider_used="gpt-4o",
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        latency_ms=latency_ms,
        cache_hit=False,
        was_blocked=False,
        pii_detected=pii_found,
    )

    gpt_response["shield"] = {
        "latency_ms": latency_ms,
        "cache_hit": False,
        "pii_redacted": pii_found,
        "provider": "gpt-4o",
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
    }
    return gpt_response