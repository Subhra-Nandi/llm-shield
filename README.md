<div align="center">

# 🛡️ LLM-Shield

### A Production-Grade Semantic Proxy & Observability Layer for LLM APIs

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python)](https://python.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://docker.com)
[![Railway](https://img.shields.io/badge/Deployed-Railway-0B0D0E?style=flat&logo=railway)](https://railway.app)

**Live Demo:** [https://llm-shield-five.vercel.app](https://llm-shield-five.vercel.app)  
**API Docs:** [https://llm-shield-production.up.railway.app/docs](https://llm-shield-production.up.railway.app/docs)

</div>

---

## 🧠 What is LLM-Shield?

Most companies integrate LLMs by calling OpenAI directly — no visibility into costs, no protection against attacks, no resilience when the API goes down.

**LLM-Shield is the intelligent middleware layer that sits between your application and any LLM.** It looks exactly like the OpenAI API to your app — you change one URL and get caching, security, observability, and failover for free.

```
Your App → LLM-Shield → GPT-4o
                ↓
        Semantic Cache (Redis)
        PII Redaction (Presidio)
        Injection Detection (DeBERTa-v3)
        Rate Limiting (Token Bucket)
        Failover (OpenRouter)
        Observability (Postgres + Prometheus)
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔄 **Semantic Caching** | Cosine similarity on embeddings — "What is ML?" and "Explain machine learning" return the same cached answer |
| 🔒 **PII Redaction** | Microsoft Presidio strips emails, phones, SSNs, credit cards before they reach the LLM |
| 🛡️ **Prompt Injection Detection** | Two-stage: regex catches obvious attacks in <1ms, DeBERTa-v3 ML classifier catches sophisticated ones |
| ⚡ **Token Bucket Rate Limiting** | Per API key, atomic Lua script in Redis — no race conditions |
| 🔁 **Circuit Breaker Failover** | GPT-4o down? Automatically routes to OpenRouter free tier |
| 📊 **Full Observability** | Every request logged to Postgres — cost, latency, tokens, cache hits, PII flags |
| 📈 **Prometheus Metrics** | `/metrics` endpoint with counters and histograms for Grafana dashboards |
| 🔐 **JWT Authentication** | Signup, login, forgot password, password reset |

---

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────┐
│   React App  │────▶│              LLM-Shield Proxy             │
│   (Vercel)  │     │                                          │
└─────────────┘     │  Auth → Rate Limit → PII → Injection     │
                    │  → Exact Cache → Semantic Cache → LLM    │
                    └──────────┬──────────────────┬────────────┘
                               │                  │
                    ┌──────────▼──────┐  ┌────────▼────────┐
                    │  Upstash Redis  │  │  Neon Postgres   │
                    │  (Cache + Rate) │  │  (Request Logs)  │
                    └─────────────────┘  └─────────────────┘
                               │
                    ┌──────────▼──────────────────┐
                    │         LLM Router           │
                    │  GPT-4o ──────▶ OpenRouter   │
                    │  (Primary)     (Failover)    │
                    └─────────────────────────────┘
```

---

## 🚀 Performance Benchmarks

Tested with Locust — 20 concurrent users, 60 second run.

| Request Type | p50 | p95 | Cost |
|---|---|---|---|
| Exact cache hit | ~400ms | ~800ms | **$0.00** |
| Semantic cache hit | ~1200ms | ~2000ms | **$0.00** |
| GPT-4o call (cache miss) | ~8000ms | ~12000ms | ~$0.001 |
| `/health` endpoint | 4ms | 12ms | $0.00 |

> **Cost reduction:** At 1000 req/day with 60% cache hit rate → saves ~$0.60/day → **~$220/year**

---

## 🛠️ Tech Stack

**Backend**
- **FastAPI** — async Python web framework
- **SQLAlchemy + asyncpg** — async Postgres ORM
- **Upstash Redis** — serverless Redis for caching and rate limiting
- **Neon Postgres** — serverless Postgres for request logging

**AI / ML**
- **OpenAI Embeddings** (`text-embedding-3-small`) — semantic similarity
- **Microsoft Presidio + spaCy** — PII detection and anonymization
- **HuggingFace DeBERTa-v3** — prompt injection classification
- **GPT-4o via GitHub Models** — primary LLM
- **OpenRouter** — free-tier LLM failover

**Frontend**
- **React + Vite** — SPA framework
- **Framer Motion** — page transitions and animations
- **Recharts** — live metrics dashboard
- **Lucide React** — icons

**Infrastructure**
- **Railway** — backend deployment (Docker)
- **Vercel** — frontend deployment
- **Prometheus** — metrics collection
- **GitHub Actions** — CI/CD pipeline

---

## ⚙️ How It Works — Request Lifecycle

Every request through LLM-Shield passes through a pipeline of guards:

```
1. Auth middleware        → validates JWT or API key
2. Rate limiter           → token bucket per key (Redis Lua script, atomic)
3. Regex injection check  → catches obvious attacks in <1ms
4. Exact cache lookup     → SHA-256 hash → Redis lookup (skips ML + PII)
5. PII redaction          → Presidio scans and masks personal data
6. ML injection check     → DeBERTa-v3 catches sophisticated attacks
7. Semantic cache         → embedding cosine similarity ≥ 0.92 → cache hit
8. LLM router             → GPT-4o with circuit breaker → OpenRouter fallback
9. Async logger           → Postgres + Prometheus (never blocks response)
```

---

## 📦 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (optional)

### Backend

```bash
git clone https://github.com/YOURUSERNAME/llm-shield
cd llm-shield/backend

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
python -m spacy download en_core_web_lg

cp .env.example .env
# Fill in your API keys in .env

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd llm-shield/frontend
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev
```

Open `http://localhost:5173` — create an account and start chatting.

### Docker (full stack)

```bash
docker-compose up --build
# API:        http://localhost:8000
# Frontend:   http://localhost:5173
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3000
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `GITHUB_PAT` | GitHub PAT for GPT-4o via GitHub Models | ✅ |
| `SHIELD_MASTER_KEY` | Master API key for proxy access | ✅ |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | ✅ |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint | ✅ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | ✅ |
| `DATABASE_URL` | PostgreSQL connection string (asyncpg) | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API key for LLM failover | ✅ |
| `RATE_LIMIT_PER_MINUTE` | Requests per minute per API key | ✅ |
| `USE_ML_CLASSIFIER` | Enable DeBERTa ML injection detection | Optional |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | ✅ |

---

## 📡 API Reference

### Authentication
```
POST /auth/signup          Create account
POST /auth/login           Sign in, receive JWT
POST /auth/forgot-password Request password reset
POST /auth/reset-password  Reset with token
GET  /auth/me              Get current user
```

### Proxy
```
POST /v1/chat/completions  OpenAI-compatible chat endpoint
```

### Observability
```
GET  /health               Health check
GET  /stats                Aggregate request statistics
GET  /metrics              Prometheus metrics
```

---

## 🔐 Security Features

### PII Redaction
Before any prompt reaches the LLM, Presidio scans for and replaces:
- Email addresses → `<EMAIL_ADDRESS>`
- Phone numbers → `<PHONE_NUMBER>`
- Credit cards → `<CREDIT_CARD>`
- SSN → `<US_SSN>`
- IP addresses → `<IP_ADDRESS>`

### Prompt Injection Detection
Two-stage pipeline:
1. **Regex** — compiled patterns catch `"ignore all previous instructions"`, `"you are now DAN"` etc. in <1ms
2. **DeBERTa-v3** — fine-tuned ML classifier from ProtectAI catches novel jailbreak attempts

### Rate Limiting
Token bucket algorithm implemented with Redis Lua scripts for atomic operations. Prevents race conditions that would allow burst bypass.

---

## 📊 Observability

Every request writes a row to Postgres:

```sql
SELECT
    api_key_id,
    COUNT(*) as requests,
    SUM(cost_usd) as total_cost,
    AVG(latency_ms) as avg_latency,
    SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits
FROM requests
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY api_key_id
ORDER BY total_cost DESC;
```

Prometheus counters exposed at `/metrics`:
- `shield_requests_total` — labeled by provider, cache_hit, blocked
- `shield_latency_seconds` — histogram with p50/p95/p99
- `shield_cost_usd_total` — running cost counter
- `shield_pii_detections_total` — PII events
- `shield_injection_blocks_total` — blocked attacks

---

## 🧪 Testing

```bash
cd backend

# Unit tests
pytest tests/ -v --cov=app --cov-report=term

# Load test (requires uvicorn running)
locust -f tests/locustfile.py --headless -u 20 -r 5 --run-time 60s \
  --host http://localhost:8000 --csv=tests/results
```

---

## 🚢 Deployment

### Backend (Railway)
1. Connect GitHub repo to Railway
2. Set root directory to `backend`
3. Railway auto-detects Dockerfile
4. Add environment variables in Railway dashboard
5. Deploy — Railway builds and runs the container

### Frontend (Vercel)
1. Import GitHub repo to Vercel
2. Set framework to Vite, root to `frontend`
3. Add `VITE_API_URL=https://your-railway-url.up.railway.app`
4. Deploy — Vercel builds and serves globally

---

## 💡 Key Engineering Decisions

**Why semantic caching over exact matching?**  
Exact string matching misses equivalent questions. Embedding-based cosine similarity catches semantic duplicates, reducing LLM calls by 30-60% in practice.

**Why a two-stage injection detector?**  
The ML model takes 1200ms on CPU per request. Running it after an exact cache check means cached requests (the majority after warmup) skip the ML entirely — dropping p50 latency from 2400ms to 400ms.

**Why token bucket over fixed window rate limiting?**  
Token bucket allows controlled bursting while maintaining average rate limits. The Lua script implementation ensures atomicity across concurrent requests without distributed locking overhead.

**Why OpenRouter over a fixed fallback model?**  
OpenRouter's `/auto` endpoint dynamically selects the best available free model, making the failover resilient to individual model deprecations and quota changes.

---

## 📁 Project Structure

```
llm-shield/
├── backend/
│   ├── app/
│   │   ├── middleware/      # Auth, rate limiting
│   │   ├── security/        # PII redaction, injection detection
│   │   ├── cache/           # Semantic cache, Redis client
│   │   ├── llm/             # GPT-4o, OpenRouter, circuit breaker
│   │   ├── observability/   # Logging, metrics, cost calculation
│   │   ├── db/              # SQLAlchemy models, session
│   │   └── routers/         # API endpoints
│   ├── tests/               # pytest + Locust load tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/           # Chat, Dashboard, Keys, Auth pages
│       ├── components/      # Layout, ProtectedRoute
│       ├── context/         # AuthContext
│       └── api/             # Axios client
├── docker-compose.yml
├── prometheus.yml
└── README.md
```

---

## 🤝 Contributing

Pull requests welcome. For major changes open an issue first.

---

## 📄 License

MIT

---

<div align="center">
Built with ❤️ as a portfolio project demonstrating production-grade backend engineering.
<br>
<strong>Concepts:</strong> Reverse proxies · Semantic search · ML inference · Distributed caching · Observability · Resilience patterns
</div>