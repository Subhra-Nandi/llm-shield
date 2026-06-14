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
}

DEFAULT_PRICE = {
    "input":  Decimal("0.000005"),
    "output": Decimal("0.000015"),
}

def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> Decimal:
    # Free tier models and cache hits cost $0
    if "free" in model.lower() or model == "cache" or model == "blocked":
        return Decimal("0.0")

    price = PRICE_TABLE.get(model, DEFAULT_PRICE)
    return (
        Decimal(prompt_tokens) * price["input"] +
        Decimal(completion_tokens) * price["output"]
    )