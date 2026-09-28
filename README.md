# DEALMIND

**The procurement agent that remembers every negotiation.**

DEALMIND gives procurement teams a persistent, Hindsight-backed memory of
every vendor negotiation — then uses that experience to recommend better
strategy, assist live during negotiations, and get smarter after every
outcome.

> No prior negotiations? Generic advice: *"try asking for a discount."*
> Three prior negotiations in memory? *"Apex has accepted ₹84–86 twice using
> volume commitment and Net 45 terms — open at ₹80."*
> That shift is the entire product.

## The Core Loop

```
REMEMBER → RECALL → REASON → NEGOTIATE → LEARN
```

## How Hindsight & AI are Used

- **SQL / Database**: Stores structured negotiation facts (vendors, quotes, final prices, dates, delivery stats).
- **Hindsight**: Stores and semantically retrieves experiential memory and learned context (vendor tactics, accepted payment terms, delivery reliability notes).
- **AI Engine**: Combines recalled Hindsight experiences with structured facts to generate evidence-backed negotiation briefs and real-time counter-offer suggestions.

## Quick start

### 1. Backend (FastAPI + SQLite)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # optional: add GROQ_API_KEY / HINDSIGHT_API_KEY

python -m seed.seed_data        # seeds 10 vendors + 70 historical negotiations
uvicorn app.main:app --reload   # http://localhost:8000
```

API docs: http://localhost:8000/docs

### 2. Frontend (React + TypeScript + Vite + Tailwind)

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm run dev                     # http://localhost:5173
```

### 3. Or with Docker

```bash
docker compose up --build
```

## Zero-config by design

- **No Hindsight account needed.** `HINDSIGHT_API_KEY` unset -> DEALMIND uses
  its own local, SQLite-backed, Hindsight-compatible memory store
  (`app/hindsight/local_store.py`). Set the key in `.env` to point at real
  Hindsight Cloud instead — nothing else changes.
- **No LLM key needed.** `GROQ_API_KEY` unset -> negotiation briefs and chat
  replies are generated from deterministic templates instead of an LLM call.
  The *numbers* (target price, counter-offer, walk-away) are always computed
  deterministically either way — the LLM, when configured, only phrases the
  rationale in natural language.

## What's inside

| Screen | What it does |
|---|---|
| **Dashboard** | Active negotiations, vendor count, recent deals, recent learning |
| **Vendors** | Every vendor DEALMIND has memory for, with live behavioral scores |
| **Vendor Profile** | Price/payment/volume flexibility, delivery reliability, "What DEALMIND Learned," full negotiation history |
| **Negotiate** | The core flow: quote -> AI-generated brief with evidence -> live "what should I say next" chat -> save outcome |
| **Memory Explorer** | Every Hindsight memory record, searchable and filterable by vendor/type |

## Project structure

```
DEALMIND/
├── backend/     FastAPI + SQLite + Hindsight-compatible memory + agents
├── frontend/    React + TypeScript + Vite + Tailwind
├── docs/        architecture.md, hindsight.md, demo.md
├── docker-compose.yml
└── LICENSE
```

Full architecture diagram: `docs/architecture.md`.

## Tech stack

React · TypeScript · Vite · Tailwind · FastAPI · SQLAlchemy · SQLite ·
Hindsight (local-compatible store, swappable for Hindsight Cloud) · Groq
(optional)

## What this intentionally does NOT do

No ERP, invoice processing, supplier onboarding, purchase-order management,
payment processing, or real email/WhatsApp integration. One workflow, done
well: **quote in, evidence-backed strategy and negotiation assistance out,
smarter every time.**

## License

MIT — see `LICENSE`.
