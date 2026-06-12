import httpx
from app.llm.gpt import call_gpt4o

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
            print("GPT-4o timeout")
            _record_failure()
        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500:
                print(f"GPT-4o {e.response.status_code} error")
                _record_failure()
            else:
                raise
    else:
        print("Circuit breaker OPEN")

    # Gemini fallback disabled until quota resets
    # Re-enable by importing and calling call_gemini here
    raise Exception("GPT-4o unavailable and Gemini quota exhausted — try again later")