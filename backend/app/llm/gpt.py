import httpx
from app.config import settings

AZURE_ENDPOINT = "https://models.inference.ai.azure.com/chat/completions"

# Reusable async client — created once, shared across all requests
# Never create httpx.AsyncClient() inside the handler — that opens a new
# TCP connection for every request which is slow and wasteful
_client: httpx.AsyncClient | None = None

def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            
            timeout=httpx.Timeout(30.0, connect=5.0),
            headers={
                "Authorization": f"Bearer {settings.github_pat}",
                "Content-Type": "application/json",
            }
        )
    return _client

async def close_client():
    global _client
    if _client:
        await _client.aclose()
        _client = None

async def call_gpt4o(messages: list[dict], model: str = "gpt-4o") -> dict:
    client = get_client()

    payload = {
        "model": model,
        "messages": messages,
    }

    response = await client.post(AZURE_ENDPOINT, json=payload)

    if response.status_code != 200:
        raise httpx.HTTPStatusError(
            f"GPT-4o returned {response.status_code}: {response.text}",
            request=response.request,
            response=response,
        )

    return response.json()