from fastapi import APIRouter
from sqlalchemy import select, func, Integer
from sqlalchemy.sql.expression import cast
from app.db.session import AsyncSessionLocal
from app.db.models import Request

router = APIRouter()

@router.get("/stats")
async def get_stats():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(
                func.count(Request.id).label("total_requests"),
                func.sum(cast(Request.cache_hit, Integer)).label("cache_hits"),
                func.sum(Request.cost_usd).label("total_cost_usd"),
                func.avg(Request.latency_ms).label("avg_latency_ms"),
                func.sum(cast(Request.was_blocked, Integer)).label("total_blocked"),
                func.sum(cast(Request.pii_detected, Integer)).label("total_pii_detected"),
            )
        )
        row = result.one()

    total = row.total_requests or 0
    hits = int(row.cache_hits or 0)

    return {
        "total_requests": total,
        "cache_hits": hits,
        "cache_hit_rate": round((hits / total * 100), 1) if total > 0 else 0,
        "total_cost_usd": round(float(row.total_cost_usd or 0), 6),
        "avg_latency_ms": round(float(row.avg_latency_ms or 0), 1),
        "total_blocked": int(row.total_blocked or 0),
        "total_pii_detected": int(row.total_pii_detected or 0),
    }