"""Pydantic request/response schemas. Kept as a single flat module -- the
schema surface is small enough that splitting it into schemas/*.py would
just add import overhead for a project this size."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class VendorOut(BaseModel):
    id: int
    name: str
    category: str
    contact_name: Optional[str] = None
    price_flexibility: float
    payment_flexibility: float
    volume_sensitivity: float
    delivery_reliability: float
    quality_score: float
    best_tactic: Optional[str] = None
    negotiation_count: int = 0

    class Config:
        from_attributes = True


class VendorCreate(BaseModel):
    name: str
    category: str
    contact_name: Optional[str] = None


class NegotiationOut(BaseModel):
    id: int
    vendor_id: int
    vendor_name: Optional[str] = None
    product: str
    quantity: int
    initial_price: float
    final_price: Optional[float] = None
    payment_terms: Optional[str] = None
    delivery_days: Optional[int] = None
    tactic: Optional[str] = None
    outcome: str
    quality_score: Optional[float] = None
    delivery_on_time: Optional[int] = None
    created_at: datetime
    closed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NegotiationCreate(BaseModel):
    vendor_id: int
    product: str
    quantity: int = Field(gt=0)
    quoted_price: float = Field(gt=0)


class NegotiationBrief(BaseModel):
    negotiation_id: int
    vendor_id: int
    vendor_name: str
    product: str
    quantity: int
    quoted_price: float
    historical_min: Optional[float] = None
    historical_max: Optional[float] = None
    historical_avg: Optional[float] = None
    target_min: float
    target_max: float
    opening_counter: float
    walk_away: float
    recommended_tactic: str
    tactic_evidence: Optional[dict] = None
    payment_terms_suggestion: str
    delivery_risk: str
    evidence_count: int
    confidence: str
    memory_snippets: list[str] = []
    rationale: str


class ChatMessageIn(BaseModel):
    vendor_message: str


class ChatSuggestionOut(BaseModel):
    vendor_price_mentioned: Optional[float] = None
    suggested_response: str
    reasoning: str
    tactic: str


class OutcomeIn(BaseModel):
    final_price: float
    payment_terms: Optional[str] = None
    delivery_days: Optional[int] = None
    tactic: Optional[str] = None
    outcome: str = Field(pattern="^(successful|unsuccessful)$")
    quality_score: Optional[float] = Field(default=None, ge=0, le=5)
    delivery_on_time: Optional[bool] = None


class MemoryOut(BaseModel):
    id: int | str
    vendor_id: Optional[int] = None
    negotiation_id: Optional[int] = None
    kind: str
    content: str
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    active_negotiations: int
    vendor_count: int
    negotiation_count: int
    successful_negotiation_count: int
    success_rate: float
    total_savings: float
    memory_insight_count: int
    recent_negotiations: list[NegotiationOut]
    recent_learnings: list[MemoryOut]
