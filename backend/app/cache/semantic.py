import json
import hashlib
import numpy as np
from openai import AsyncOpenAI
from app.config import settings
from app.cache.redis_client import get_redis

_embed_client: AsyncOpenAI | None = None

def get_embed_client() -> AsyncOpenAI:
    global _embed_client
    if _embed_client is None:
        _embed_client = AsyncOpenAI(
            base_url="https://models.inference.ai.azure.com",
            api_key=settings.github_pat,
        )
    return _embed_client

async def embed_text(text: str) -> list[float]:
    client = get_embed_client()
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding

def cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    dot = np.dot(va, vb)
    norm = np.linalg.norm(va) * np.linalg.norm(vb)
    if norm == 0:
        return 0.0
    return float(dot / norm)

def make_cache_key(text: str) -> str:
    return "cache:" + hashlib.sha256(text.encode()).hexdigest()[:32]

async def search_cache(query_embedding: list[float]) -> dict | None:
    r = get_redis()
    threshold = settings.cache_similarity_threshold

    keys = await r.keys("cache:*")
    if not keys:
        print("Cache is empty")
        return None

    best_score = 0.0
    best_response = None

    for key in keys:
        raw = await r.hget(key, "embedding")
        if raw is None:
            continue

        stored_embedding = json.loads(raw)
        score = cosine_similarity(query_embedding, stored_embedding)

        if score > best_score:
            best_score = score
            if score >= threshold:
                response_raw = await r.hget(key, "response")
                if response_raw:
                    best_response = json.loads(response_raw)

    if best_response and best_score >= threshold:
        print(f"Cache hit! similarity={best_score:.4f}")
        return best_response

    print(f"Cache miss. Best similarity={best_score:.4f}")
    return None

async def store_in_cache(prompt: str, embedding: list[float], response: dict):
    r = get_redis()
    key = make_cache_key(prompt)

    await r.hset(key, values={
        "embedding": json.dumps(embedding),
        "response":  json.dumps(response),
        "prompt":    prompt[:200],
    })
    await r.expire(key, settings.cache_ttl_seconds)
    print(f"Stored in cache: {key}")