FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc g++ curl \
    && rm -rf /var/lib/apt/lists/*

# Use production requirements (no torch/transformers = much smaller image)
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Download small spaCy model only (12MB vs 700MB for lg)
RUN python -m spacy download en_core_web_sm

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]