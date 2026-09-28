import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vendor import Vendor
from app.models.negotiation import Negotiation, NegotiationMessage
from app.schemas import (
    NegotiationOut, NegotiationCreate, NegotiationBrief,
    ChatMessageIn, ChatSuggestionOut, OutcomeIn,
)
from app.agents.strategy_agent import build_negotiation_brief
from app.agents.negotiation_assistant import suggest_reply
from app.agents.learning_agent import learn_from_outcome

router = APIRouter(prefix="/api/negotiations", tags=["negotiations"])


def _to_out(n: Negotiation) -> NegotiationOut:
    return NegotiationOut(
        id=n.id, vendor_id=n.vendor_id, vendor_name=n.vendor.name if n.vendor else None,
        product=n.product, quantity=n.quantity, initial_price=n.initial_price,
        final_price=n.final_price, payment_terms=n.payment_terms, delivery_days=n.delivery_days,
        tactic=n.tactic, outcome=n.outcome, quality_score=n.quality_score,
        delivery_on_time=n.delivery_on_time, created_at=n.created_at, closed_at=n.closed_at,
    )


@router.get("", response_model=list[NegotiationOut])
def list_negotiations(vendor_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Negotiation)
    if vendor_id is not None:
        q = q.filter(Negotiation.vendor_id == vendor_id)
    items = q.order_by(Negotiation.created_at.desc()).all()
    return [_to_out(n) for n in items]


@router.get("/{negotiation_id}", response_model=NegotiationOut)
def get_negotiation(negotiation_id: int, db: Session = Depends(get_db)):
    n = db.get(Negotiation, negotiation_id)
    if not n:
        raise HTTPException(404, "Negotiation not found")
    return _to_out(n)


@router.post("", response_model=NegotiationBrief, status_code=201)
def start_negotiation(payload: NegotiationCreate, db: Session = Depends(get_db)):
    """Creates a negotiation AND immediately runs the Retrieve -> Analyze
    -> Plan pipeline, returning the negotiation brief. This is the
    'Analyze' button click from the Killer Demo (Scene 1 -> 3)."""
    vendor = db.get(Vendor, payload.vendor_id)
    if not vendor:
        raise HTTPException(404, "Vendor not found")

    n = Negotiation(
        vendor_id=vendor.id, product=payload.product, quantity=payload.quantity,
        initial_price=payload.quoted_price, outcome="in_progress",
    )
    db.add(n)
    db.commit()
    db.refresh(n)

    brief = build_negotiation_brief(db, vendor, payload.product, payload.quantity, payload.quoted_price)
    n.strategy_json = json.dumps(brief)
    n.tactic = brief["recommended_tactic"]
    db.add(n)
    db.commit()

    return NegotiationBrief(negotiation_id=n.id, **brief)


@router.get("/{negotiation_id}/brief", response_model=NegotiationBrief)
def get_brief(negotiation_id: int, db: Session = Depends(get_db)):
    n = db.get(Negotiation, negotiation_id)
    if not n or not n.strategy_json:
        raise HTTPException(404, "Brief not found")
    brief = json.loads(n.strategy_json)
    return NegotiationBrief(negotiation_id=n.id, **brief)


@router.post("/{negotiation_id}/chat", response_model=ChatSuggestionOut)
def chat_turn(negotiation_id: int, payload: ChatMessageIn, db: Session = Depends(get_db)):
    """'What should I say next?' -- the live negotiation workspace."""
    n = db.get(Negotiation, negotiation_id)
    if not n or not n.strategy_json:
        raise HTTPException(404, "Negotiation or brief not found")
    brief = json.loads(n.strategy_json)

    db.add(NegotiationMessage(negotiation_id=n.id, sender="vendor", message=payload.vendor_message))
    db.commit()

    suggestion = suggest_reply(brief, payload.vendor_message, n.quantity)

    db.add(NegotiationMessage(negotiation_id=n.id, sender="dealmind", message=suggestion["suggested_response"]))
    db.commit()

    return ChatSuggestionOut(**suggestion)


@router.get("/{negotiation_id}/messages")
def get_messages(negotiation_id: int, db: Session = Depends(get_db)):
    n = db.get(Negotiation, negotiation_id)
    if not n:
        raise HTTPException(404, "Negotiation not found")
    return [
        {"id": m.id, "sender": m.sender, "message": m.message, "timestamp": m.timestamp}
        for m in sorted(n.messages, key=lambda m: m.timestamp)
    ]


@router.post("/{negotiation_id}/outcome", response_model=NegotiationOut)
def save_outcome(negotiation_id: int, payload: OutcomeIn, db: Session = Depends(get_db)):
    """Closes the negotiation and triggers the Learning Agent -- this is
    the step that writes new experience back to Hindsight."""
    n = db.get(Negotiation, negotiation_id)
    if not n:
        raise HTTPException(404, "Negotiation not found")

    n.final_price = payload.final_price
    n.payment_terms = payload.payment_terms
    n.delivery_days = payload.delivery_days
    n.tactic = payload.tactic or n.tactic
    n.outcome = payload.outcome
    n.quality_score = payload.quality_score
    n.delivery_on_time = None if payload.delivery_on_time is None else int(payload.delivery_on_time)
    n.closed_at = datetime.utcnow()
    db.add(n)
    db.commit()
    db.refresh(n)

    learn_from_outcome(db, n)
    db.refresh(n)
    return _to_out(n)
