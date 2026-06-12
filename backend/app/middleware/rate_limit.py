from fastapi import HTTPException
from upstash_redis.asyncio import Redis
from app.config import settings

def get_redis() -> Redis:
    return Redis(
        url=settings.upstash_redis_rest_url,
        token=settings.upstash_redis_rest_token,
    )

async def check_rate_limit(api_key: str) -> None:
    """
    Token bucket rate limiter using Upstash Redis.
    Each API key gets N requests per minute.
    Bucket refills automatically when the Redis key expires (60s TTL).
    """
    r = get_redis()
    key = f"ratelimit:{api_key}"
    limit = settings.rate_limit_per_minute

    lua_script = """
local key = KEYS[1]
local limit = tonumber(ARGV[1])

local current = redis.call('GET', key)

if current == false then
    redis.call('SET', key, limit - 1)
    redis.call('EXPIRE', key, 60)
    return limit - 1
end

current = tonumber(current)

if current <= 0 then
    return -1
end

redis.call('DECR', key)
return current - 1
"""

    # upstash-redis eval signature: eval(script, keys=[...], args=[...])
    remaining = await r.eval(lua_script, keys=[key], args=[str(limit)])
    remaining = int(remaining)

    if remaining < 0:
        raise HTTPException(
            status_code=429,
            headers={"Retry-After": "60"},
            detail={
                "error": "rate_limit_exceeded",
                "message": f"Rate limit of {limit} requests/minute exceeded",
                "retry_after_seconds": 60,
            }
        )