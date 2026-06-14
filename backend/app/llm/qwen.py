import httpx
from app.config import settings

OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

# 💡 BEST PRACTICE: Use the dynamic free router. 
# It guarantees a 100% free model and prevents 404 crashes when models rotate.
# (If you absolutely MUST force a Qwen model, use "qwen/qwen3-coder:free" instead)
FALLBACK_MODEL = "openrouter/free"

_client: httpx.AsyncClient | None = None

def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(30.0, connect=5.0),
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://llm-shield.dev",  
                "X-Title": "LLM-Shield",
            }
        )
    return _client

async def call_qwen(messages: list[dict], original_model: str = "gpt-4o") -> dict:
    """
    Call OpenRouter's free tier. Returns OpenAI-format response.
    """
    client = get_client()

    payload = {
        "model": FALLBACK_MODEL,
        "messages": messages,
    }

    response = await client.post(OPENROUTER_ENDPOINT, json=payload)

    if response.status_code != 200:
        raise httpx.HTTPStatusError(
            f"OpenRouter returned {response.status_code}: {response.text}",
            request=response.request,
            response=response,
        )

    data = response.json()
    # We remove the hardcoded data["model"] = "qwen3-235b" 
    # so we can dynamically return whatever free model OpenRouter actually used!
    return data