from decimal import Decimal

# Pricing per token in USD
# Update these when providers change their pricing
PRICE_TABLE = {
    "gpt-4o": {
        "input":  Decimal("0.000005"),    # $5 per 1M input tokens
        "output": Decimal("0.000015"),    # $15 per 1M output tokens
    },
    "gpt-4o-2024-11-20": {
        "input":  Decimal("0.000005"),
        "output": Decimal("0.000015"),
    },
    "gemini-1.5-flash": {
        "input":  Decimal("0.0000001"),   # $0.10 per 1M input tokens
        "output": Decimal("0.0000004"),
    },
}

DEFAULT_PRICE = {
    "input":  Decimal("0.000005"),
    "output": Decimal("0.000015"),
}

def calculate_cost(
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> Decimal:
    """
    Convert token counts to USD cost.
    Uses Decimal to avoid floating-point precision errors.
    
    Example:
        model="gpt-4o", prompt_tokens=100, completion_tokens=50
        cost = (100 * 0.000005) + (50 * 0.000015)
             = 0.0005 + 0.00075
             = $0.00125
    """
    price = PRICE_TABLE.get(model, DEFAULT_PRICE)
    cost = (
        Decimal(prompt_tokens) * price["input"] +
        Decimal(completion_tokens) * price["output"]
    )
    return cost