from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

# These are heavy objects — initialise once at module level
# First import takes ~3 seconds while spaCy model loads
# Every subsequent call is instant
print("Loading Presidio PII engine...")
_analyzer = AnalyzerEngine()
_anonymizer = AnonymizerEngine()
print("Presidio PII engine ready.")

# Entity types we care about
# Add or remove based on your compliance requirements
ENTITIES_TO_DETECT = [
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "CREDIT_CARD",
    "US_SSN",
    "IP_ADDRESS",
    "URL",
]

def redact_pii(text: str) -> tuple[str, bool]:
    """
    Scan text for PII and replace each found entity with a typed placeholder.
    
    Returns:
        (redacted_text, pii_was_found)
    
    Example:
        Input:  "My email is john@gmail.com and my SSN is 123-45-6789"
        Output: ("My email is <EMAIL_ADDRESS> and my SSN is <US_SSN>", True)
    """
    results = _analyzer.analyze(
        text=text,
        entities=ENTITIES_TO_DETECT,
        language="en",
    )

    if not results:
        return text, False

    # Replace each detected entity with [ENTITY_TYPE]
    anonymized = _anonymizer.anonymize(
        text=text,
        analyzer_results=results,
        
    )

    return anonymized.text, True