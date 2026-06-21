import re
import os

INJECTION_PATTERNS = re.compile(
    r"(?:"
    r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?"
    r"|disregard\s+(?:your|all)\s+(?:instructions?|rules?|guidelines?)"
    r"|you\s+are\s+now\s+(?:a\s+)?(?:DAN|jailbreak|evil|unrestricted|freed)"
    r"|act\s+as\s+(?:if\s+)?(?:you\s+(?:were|are)\s+)?(?:an?\s+)?(?:evil|unfiltered|uncensored)"
    r"|reveal\s+(?:your\s+)?(?:system\s+prompt|instructions?|guidelines?)"
    r"|forget\s+(?:all\s+)?(?:your\s+)?(?:previous\s+)?(?:instructions?|training|rules?)"
    r"|pretend\s+(?:you\s+have\s+no|you\s+don.?t\s+have)\s+(?:restrictions?|rules?)"
    r"|override\s+(?:your\s+)?(?:safety|ethical|content)\s+(?:filters?|guidelines?|rules?)"
    r")",
    re.IGNORECASE,
)

USE_ML_CLASSIFIER = os.getenv("USE_ML_CLASSIFIER", "true").lower() == "true"

_classifier = None

def _load_classifier():
    global _classifier
    if _classifier is None:
        from transformers import pipeline
        print("Loading injection detection model...")
        _classifier = pipeline(
            "text-classification",
            model="protectai/deberta-v3-base-prompt-injection-v2",
            device=-1,
            truncation=True,
            max_length=512,
        )
        print("Injection detection model ready.")
    return _classifier

if USE_ML_CLASSIFIER:
    _load_classifier()

ML_THRESHOLD = 0.85

def is_injection(text: str) -> tuple[bool, str]:
    if INJECTION_PATTERNS.search(text):
        print(f"Injection blocked (regex): {text[:80]}")
        return True, "regex_match"

    if USE_ML_CLASSIFIER:
        classifier = _load_classifier()
        result = classifier(text)[0]
        label = result["label"]
        score = result["score"]
        print(f"Injection ML check: label={label} score={score:.4f}")
        if label == "INJECTION" and score >= ML_THRESHOLD:
            print(f"Injection blocked (ML, confidence={score:.2f}): {text[:80]}")
            return True, f"ml_classifier_{score:.2f}"

    return False, "clean"
