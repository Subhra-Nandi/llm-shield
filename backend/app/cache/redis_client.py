from upstash_redis.asyncio import Redis
from app.config import settings

_redis_client: Redis | None = None

def get_redis() -> Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = Redis(
            url=settings.upstash_redis_rest_url,
            token=settings.upstash_redis_rest_token,
        )
    return _redis_client

async def close_redis():
    global _redis_client
    _redis_client = None