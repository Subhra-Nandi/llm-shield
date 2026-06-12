import time
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import verify_api_key
from app.middleware.rate_limit import check_rate_limit
from app.llm.router import call_llm_with_fallback
from app.cache.semantic import embed_text, search_cache, store_in_cache
from app.security.pii import redact_pii
from app.security.injection import is_injection
from app.observability.logger import log_request

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

    # ── STEP 1: rate limiting ─────────────────────────────────────────────
    # Runs first — cheapest check, no ML, no DB, just Redis
    await check_rate_limit(api_key)

    # ── STEP 2: extract user message ──────────────────────────────────────
    user_messages = [m for m in request.messages if m.role == "user"]
    if not user_messages:
        raise HTTPException(status_code=400, detail="No user message found")
    prompt_text = user_messages[-1].content

    # ── STEP 3: PII redaction ─────────────────────────────────────────────
    redacted_prompt, pii_found = redact_pii(prompt_text)
    if pii_found:
        print(f"PII redacted. Original: {prompt_text[:80]}")
        print(f"PII redacted. Cleaned:  {redacted_prompt[:80]}")
        messages = list(request.messages)
        messages[-1] = Message(role="user", content=redacted_prompt)
    else:
        messages = list(request.messages)

    # ── STEP 4: injection detection ───────────────────────────────────────
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

    # ── STEP 5: embed ─────────────────────────────────────────────────────
    query_embedding = await embed_text(redacted_prompt)

    # ── STEP 6: cache check ───────────────────────────────────────────────
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

    # ── STEP 7: call LLM (with automatic failover) ────────────────────────
    try:
        messages_as_dicts = [m.model_dump() for m in messages]
        llm_response, provider_used = await call_llm_with_fallback(
            messages_as_dicts,
            model=request.model,
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={"error": "upstream_error", "message": str(e)}
        )

    # ── STEP 8: store in cache ────────────────────────────────────────────
    await store_in_cache(redacted_prompt, query_embedding, llm_response)

    # ── STEP 9: extract token usage ───────────────────────────────────────
    usage = llm_response.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)
    actual_model = llm_response.get("model", request.model)

    latency_ms = int((time.monotonic() - start) * 1000)

    # ── STEP 10: async log ────────────────────────────────────────────────
    background_tasks.add_task(
        log_request,
        api_key_id=api_key,
        model=actual_model,
        provider_used=provider_used,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        latency_ms=latency_ms,
        cache_hit=False,
        was_blocked=False,
        pii_detected=pii_found,
    )

    llm_response["shield"] = {
        "latency_ms": latency_ms,
        "cache_hit": False,
        "pii_redacted": pii_found,
        "provider": provider_used,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
    }
    return llm_response