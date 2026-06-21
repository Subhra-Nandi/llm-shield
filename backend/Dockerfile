FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++ curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --timeout 100 -r requirements.txt

# Force spacy to clear its download cache immediately
RUN python -m spacy download en_core_web_lg && rm -rf /root/.cache/pip

# Pre-download the HuggingFace model and clear the temporary downloads folder right after
RUN python -c "from transformers import pipeline; pipeline('text-classification', model='protectai/deberta-v3-base-prompt-injection-v2', device=-1)" && rm -rf /root/.cache/huggingface/hub/tmp

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
