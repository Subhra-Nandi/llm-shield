import re
from transformers import pipeline

# ── Stage 1: regex patterns ───────────────────────────────────────────────
# Compiled once at module load — reusing compiled regex is ~10x faster
# than re.search(pattern, text) on every call
INJECTION_PATTERNS = re.compile(
    r"(?:"
    r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?"
    r"|disregard\s+(?:your|all)\s+(?:instructions?|rules?|guidelines?)"
    r"|you\s+are\s+now\s+(?:a\s+)?(?:DAN|jailbreak|evil|unrestricted|freed)"
    r"|act\s+as\s+(?:if\s+)?(?:you\s+(?:were|are)\s+)?(?:an?\s+)?(?:evil|unfiltered|uncensored|unrestricted)"
    r"|reveal\s+(?:your\s+)?(?:system\s+prompt|instructions?|guidelines?)"
    r"|forget\s+(?:all\s+)?(?:your\s+)?(?:previous\s+)?(?:instructions?|training|rules?)"
    r"|pretend\s+(?:you\s+(?:have\s+no|don'?t\s+have)\s+(?:restrictions?|rules?|guidelines?))"
    r"|override\s+(?:your\s+)?(?:safety|ethical|content)\s+(?:filters?|guidelines?|rules?)"
    r")",
    re.IGNORECASE,
)

# ── Stage 2: ML classifier ────────────────────────────────────────────────
# Loads ~400MB model on first import — done once at startup
# protectai/deberta-v3-base-prompt-injection-v2 is trained specifically
# to detect prompt injection attacks — not a generic classifier
print("Loading injection detection model...")
_classifier = pipeline(
    "text-classification",
    model="protectai/deberta-v3-base-prompt-injection-v2",
    device=-1,          # -1 = CPU. Change to 0 if you have a GPU
    truncation=True,
    max_length=512,
)
print("Injection detection model ready.")

ML_THRESHOLD = 0.85     # confidence above which we block


def is_injection(text: str) -> tuple[bool, str]:
    """
    Two-stage injection detection.
    Stage 1 (regex): catches 90% of attacks in <1ms
    Stage 2 (ML):    catches sophisticated attacks in ~50-200ms on CPU
    
    Returns:
        (is_injection, reason)
    
    Example:
        "ignore all previous instructions" → (True, "regex")
        "What is Python?"                  → (False, "clean")
    """
    # Stage 1: fast regex check
    if INJECTION_PATTERNS.search(text):
        print(f"Injection blocked (regex): {text[:80]}")
        return True, "regex_match"

    # Stage 2: ML classifier — only runs if regex passes
    result = _classifier(text)[0]
    label = result["label"]     # "INJECTION" or "SAFE"
    score = result["score"]     # confidence 0.0 to 1.0

    print(f"Injection ML check: label={label} score={score:.4f}")

    if label == "INJECTION" and score >= ML_THRESHOLD:
        print(f"Injection blocked (ML, confidence={score:.2f}): {text[:80]}")
        return True, f"ml_classifier_{score:.2f}"

    return False, "clean"