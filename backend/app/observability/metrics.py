from prometheus_client import Counter, Histogram, make_asgi_app

# Counters only go up — good for totals
requests_total = Counter(
    "shield_requests_total",
    "Total requests handled by the proxy",
    ["provider", "cache_hit", "blocked"],
)

tokens_total = Counter(
    "shield_tokens_total",
    "Total tokens processed",
    ["type"],   # "prompt" or "completion"
)

cost_total = Counter(
    "shield_cost_usd_total",
    "Total cost in USD",
)

pii_detections_total = Counter(
    "shield_pii_detections_total",
    "Total requests where PII was detected and redacted",
)

injection_blocks_total = Counter(
    "shield_injection_blocks_total",
    "Total requests blocked as prompt injection",
    ["stage"],  # "regex" or "ml_classifier"
)

# Histogram tracks distribution — gives you p50, p95, p99
latency_histogram = Histogram(
    "shield_latency_seconds",
    "Request latency in seconds",
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0],
)

# ASGI app that serves /metrics endpoint for Prometheus to scrape
metrics_asgi_app = make_asgi_app()