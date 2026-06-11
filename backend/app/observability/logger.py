from decimal import Decimal
from datetime import datetime, timezone
from app.db.session import AsyncSessionLocal
from app.db.models import Request
from app.observability.cost import calculate_cost
from app.observability import metrics

async def log_request(
    api_key_id: str,
    model: str,
    provider_used: str,
    prompt_tokens: int,
    completion_tokens: int,
    latency_ms: int,
    cache_hit: bool,
    was_blocked: bool,
    pii_detected: bool,
):
    """
    Write one row to the requests table and update Prometheus counters.
    
    This runs as a FastAPI BackgroundTask — AFTER the response is sent.
    The user never waits for this. It's fire-and-forget logging.
    """
    cost = calculate_cost(model, prompt_tokens, completion_tokens)

    # ── Postgres write ────────────────────────────────────────────────────
    try:
        async with AsyncSessionLocal() as session:
            row = Request(
                api_key_id=api_key_id,
                model=model,
                provider_used=provider_used,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                cost_usd=float(cost),
                latency_ms=latency_ms,
                cache_hit=cache_hit,
                was_blocked=was_blocked,
                pii_detected=pii_detected,
                created_at=datetime.now(timezone.utc),
            )
            session.add(row)
            await session.commit()
    except Exception as e:
        # Never crash the app because logging failed
        # In production: send to error tracking (Sentry etc)
        print(f"WARNING: failed to log request to DB: {e}")

    # ── Prometheus counters ───────────────────────────────────────────────
    try:
        metrics.requests_total.labels(
            provider=provider_used,
            cache_hit=str(cache_hit),
            blocked=str(was_blocked),
        ).inc()

        if not cache_hit:
            metrics.tokens_total.labels(type="prompt").inc(prompt_tokens)
            metrics.tokens_total.labels(type="completion").inc(completion_tokens)
            metrics.cost_total.inc(float(cost))

        metrics.latency_histogram.observe(latency_ms / 1000)

        if pii_detected:
            metrics.pii_detections_total.inc()

    except Exception as e:
        print(f"WARNING: failed to update Prometheus metrics: {e}")