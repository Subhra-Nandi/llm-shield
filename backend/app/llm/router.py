import httpx
from app.llm.gpt import call_gpt4o
from app.llm.qwen import call_qwen

_failure_count = 0
_circuit_open = False
MAX_FAILURES = 3

def _record_failure():
    global _failure_count, _circuit_open
    _failure_count += 1
    if _failure_count >= MAX_FAILURES:
        _circuit_open = True
        print(f"Circuit breaker OPENED after {_failure_count} failures")

def _record_success():
    global _failure_count, _circuit_open
    _failure_count = 0
    _circuit_open = False

async def call_llm_with_fallback(
    messages: list[dict],
    model: str = "gpt-4o",
) -> tuple[dict, str]:
    global _circuit_open

    if not _circuit_open:
        try:
            response = await call_gpt4o(messages, model)
            _record_success()
            return response, "gpt-4o"

        except httpx.TimeoutException:
            print("GPT-4o timeout — falling back to OpenRouter Free")
            _record_failure()

        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500:
                print(f"GPT-4o {e.response.status_code} — falling back to OpenRouter Free")
                _record_failure()
            else:
                raise

        except Exception as e:
            print(f"GPT-4o error: {e} — falling back to OpenRouter Free")
            _record_failure()
    else:
        print("Circuit breaker OPEN — routing directly to OpenRouter Free")

    # Fallback to OpenRouter
    response = await call_qwen(messages, model)
    
    # 💡 Dynamically extract the exact model OpenRouter chose for the free tier
    actual_fallback_model = response.get("model", "openrouter-free-fallback")
    
    return response, actual_fallback_model