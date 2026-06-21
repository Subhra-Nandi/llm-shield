
FROM python:3.11-slim

WORKDIR /app

# Combine system installation and cache cleanup in a single layer to save disk/RAM footprint
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Use --no-cache-dir and limit pip's memory allocation 
RUN pip install --no-cache-dir --network-timeout 100 -r requirements.txt

# Download Spacy model without keeping extraction caches
RUN python -m spacy download en_core_web_lg --no-cache-dir

# Pre-download the HuggingFace transformer pipeline securely
RUN python -c "from transformers import pipeline; pipeline('text-classification', model='protectai/deberta-v3-base-prompt-injection-v2', device=-1)"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]