import httpx
from app.config import settings

OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"

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

async def call_openrouter(messages: list[dict]) -> tuple[dict, str]:
    """
    Call the best currently available free model on OpenRouter.
    openrouter/free dynamically routes to whichever top open-source
    model is free at this moment — no hardcoded model slug needed.
    Returns (response_dict, actual_model_name_used).
    """
    client = get_client()

    payload = {
        "model": "openrouter/auto",   # auto picks best free model available
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
    actual_model = data.get("model", "openrouter-free")
    return data, actual_model