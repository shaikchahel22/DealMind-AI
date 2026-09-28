import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models  # noqa: F401 -- registers models on Base before create_all
from app.api import vendors, negotiations, memory, dashboard, demo

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DEALMIND API",
    description="AI procurement strategist with persistent, Hindsight-backed negotiation memory.",
    version="0.1.0",
)

origins_env = os.getenv("CORS_ORIGINS", "")
parsed_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]
origins = list(set(parsed_origins + default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vendors.router)
app.include_router(negotiations.router)
app.include_router(memory.router)
app.include_router(dashboard.router)
app.include_router(demo.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "product": "DEALMIND"}
