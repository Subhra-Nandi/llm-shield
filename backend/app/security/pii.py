from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

print("Loading Presidio PII engine...")
_analyzer = AnalyzerEngine()
_anonymizer = AnonymizerEngine()
print("Presidio PII engine ready.")

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
    results = _analyzer.analyze(
        text=text,
        entities=ENTITIES_TO_DETECT,
        language="en",
    )
    if not results:
        return text, False
    anonymized = _anonymizer.anonymize(text=text, analyzer_results=results)
    return anonymized.text, True
