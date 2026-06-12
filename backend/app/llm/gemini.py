import google.generativeai as genai
from app.config import settings

# Configure once at module level
genai.configure(api_key=settings.gemini_api_key)
_model = genai.GenerativeModel("gemini-1.5-flash")


def _openai_to_gemini_messages(messages: list[dict]) -> list[dict]:
    """
    Convert OpenAI message format to Gemini format.

    OpenAI:  [{"role": "user", "content": "hello"}]
    Gemini:  [{"role": "user", "parts": [{"text": "hello"}]}]

    Note: Gemini uses "model" not "assistant" for the AI role.
    """
    converted = []
    for m in messages:
        role = m["role"]
        if role == "system":
            # Gemini doesn't have a system role — prepend as user message
            converted.append({
                "role": "user",
                "parts": [{"text": f"[System instruction]: {m['content']}"}]
            })
        elif role == "assistant":
            converted.append({
                "role": "model",          # Gemini calls it "model" not "assistant"
                "parts": [{"text": m["content"]}]
            })
        else:
            converted.append({
                "role": "user",
                "parts": [{"text": m["content"]}]
            })
    return converted


def _gemini_to_openai_response(gemini_resp, original_model: str) -> dict:
    """
    Normalize Gemini response to look exactly like OpenAI's response format.
    This is the adapter pattern — the rest of the codebase never knows
    which provider actually answered.
    """
    text = gemini_resp.candidates[0].content.parts[0].text
    prompt_tokens = gemini_resp.usage_metadata.prompt_token_count
    completion_tokens = gemini_resp.usage_metadata.candidates_token_count

    return {
        "id": "gemini-fallback",
        "object": "chat.completion",
        "model": "gemini-1.5-flash",
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": text,
            },
            "finish_reason": "stop",
        }],
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
        }
    }


async def call_gemini(messages: list[dict], original_model: str = "gpt-4o") -> dict:
    """Call Gemini and return OpenAI-format response."""
    gemini_messages = _openai_to_gemini_messages(messages)
    response = await _model.generate_content_async(gemini_messages)
    return _gemini_to_openai_response(response, original_model)