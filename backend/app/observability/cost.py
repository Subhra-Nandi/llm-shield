from decimal import Decimal

PRICE_TABLE = {
    "gpt-4o": {
        "input":  Decimal("0.000005"),
        "output": Decimal("0.000015"),
    },
    "gpt-4o-2024-11-20": {
        "input":  Decimal("0.000005"),
        "output": Decimal("0.000015"),
    },
    # You can remove the hardcoded qwen3-235b block since we made it dynamic
}

DEFAULT_PRICE = {
    "input":  Decimal("0.000005"),
    "output": Decimal("0.000015"),
}

def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> Decimal:
    model_lower = model.lower()
    
    # 💡 SMART CATCH: If the model name contains "free" or is explicitly the cache
    if "free" in model_lower or model_lower == "cache":
        return Decimal("0.0")

    # Otherwise, look up the price or use the GPT-4o default
    price = PRICE_TABLE.get(model, DEFAULT_PRICE)
    
    return (
        Decimal(prompt_tokens) * price["input"] +
        Decimal(completion_tokens) * price["output"]
    )