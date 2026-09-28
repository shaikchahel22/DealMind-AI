# DEALMIND Architecture

```
                         USER (Procurement Manager)
                                   |
                                   v
                     React + TypeScript + Tailwind UI
                        (frontend/, Vite dev server)
                                   |
                                   v  REST (fetch, CORS)
                          FastAPI API Gateway
                            (backend/app/main.py)
                                   |
                 +-----------------+------------------+
                 |                 |                  |
                 v                 v                  v
         Vendor Service    Negotiation Agents   Memory / Dashboard API
        (app/api/vendors)   (app/agents/*)      (app/api/memory,dashboard)
                                   |
                        +----------+-----------+
                        |                      |
                        v                      v
                 HINDSIGHT MEMORY          Groq LLM (optional)
          (app/hindsight/, local or       (app/agents/llm_client.py)
           remote via HINDSIGHT_API_KEY)
                        |
                        v
                 SQLite (dealmind.db)
        vendors | negotiations | negotiation_messages | memory_records
```

## Backend layout

```
backend/
├── app/
│   ├── main.py                # FastAPI app, CORS, router registration
│   ├── database.py            # SQLAlchemy engine/session
│   ├── schemas.py             # Pydantic request/response models
│   ├── models/                # SQLAlchemy ORM models
│   │   ├── vendor.py
│   │   ├── negotiation.py
│   │   └── memory.py
│   ├── api/                   # FastAPI routers (thin -- delegate to agents)
│   │   ├── vendors.py
│   │   ├── negotiations.py
│   │   ├── memory.py
│   │   └── dashboard.py
│   ├── agents/                # The actual "intelligence"
│   │   ├── strategy_agent.py       # Retrieve -> Analyze -> Plan
│   │   ├── negotiation_assistant.py # "what should I say next"
│   │   ├── learning_agent.py       # writes memory + updates vendor profile
│   │   └── llm_client.py           # optional Groq call, graceful fallback
│   └── hindsight/
│       ├── client.py           # local/remote toggle
│       └── local_store.py      # SQLite-backed Hindsight-compatible store
├── seed/seed_data.py          # 10 vendors x 5-9 historical negotiations
└── requirements.txt
```

## Frontend layout

```
frontend/src/
├── pages/
│   ├── Dashboard.tsx
│   ├── Vendors.tsx
│   ├── VendorProfile.tsx
│   ├── Negotiation.tsx        # the core "killer demo" flow
│   └── Memory.tsx             # Memory Explorer
├── components/
│   ├── Layout.tsx
│   ├── NegotiationBrief.tsx
│   ├── EvidencePanel.tsx
│   ├── ChatWindow.tsx
│   ├── VendorCard.tsx
│   ├── MemoryCard.tsx
│   └── ui.tsx                 # shared primitives (Card, Button, Badge, ...)
├── services/api.ts            # typed fetch wrapper for the FastAPI backend
└── types/index.ts
```

## Design principle

The LLM never invents the negotiation numbers. `strategy_agent.py` computes
`target_min/max`, `opening_counter`, and `walk_away` deterministically from
the vendor's historical negotiations in SQL plus Hindsight's qualitative
memory. An LLM (Groq, optional) is only ever asked to *phrase* that already-
computed decision in natural language -- so the product is fully functional,
reliable, and testable with zero API keys configured.
