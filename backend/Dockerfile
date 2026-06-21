FROM python:3.11-slim

WORKDIR /app

# Install system utilities safely
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Path-independent copy pattern
COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --network-timeout 100 -r /app/requirements.txt

RUN python -m spacy download en_core_web_lg --no-cache-dir

RUN python -c "from transformers import pipeline; pipeline('text-classification', model='protectai/deberta-v3-base-prompt-injection-v2', device=-1)"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]