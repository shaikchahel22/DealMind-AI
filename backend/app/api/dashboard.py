from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.vendor import Vendor
from app.models.negotiation import Negotiation
from app.models.memory import MemoryRecord
from app.schemas import DashboardStats, NegotiationOut, MemoryOut
from app.hindsight.client import get_hindsight, is_remote

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db)):
    active = db.query(Negotiation).filter(Negotiation.outcome == "in_progress").count()
    vendor_count = db.query(Vendor).count()
    negotiation_count = db.query(Negotiation).count()
    
    hindsight = get_hindsight(db)
    memory_count = hindsight.total_count()
    if is_remote():
        try:
            recalled = hindsight.recall(query="negotiation history experience tactic outcome", limit=50)
            recent_learnings = []
            for r in recalled[:6]:
                meta = r.get("metadata", {})
                recent_learnings.append(
                    MemoryOut(
                        id=r.get("id", str(hash(r.get("content", "")))),
                        vendor_id=int(meta.get("vendor_id")) if meta.get("vendor_id") and str(meta.get("vendor_id")).isdigit() else None,
                        negotiation_id=int(meta.get("negotiation_id")) if meta.get("negotiation_id") and str(meta.get("negotiation_id")).isdigit() else None,
                        kind=meta.get("kind", "learning"),
                        content=r.get("content", ""),
                        confidence=float(meta.get("confidence", 0.75)),
                        created_at=datetime.utcnow(),
                    )
                )
        except Exception:
            recent_learnings = []
    else:
        recent_m = db.query(MemoryRecord).order_by(MemoryRecord.created_at.desc()).limit(6).all()
        recent_learnings = [MemoryOut.model_validate(m) for m in recent_m]

    recent_n = db.query(Negotiation).order_by(Negotiation.created_at.desc()).limit(6).all()

    return DashboardStats(
        active_negotiations=active,
        vendor_count=vendor_count,
        negotiation_count=negotiation_count,
        memory_insight_count=memory_count,
        recent_negotiations=[
            NegotiationOut(
                id=n.id, vendor_id=n.vendor_id, vendor_name=n.vendor.name if n.vendor else None,
                product=n.product, quantity=n.quantity, initial_price=n.initial_price,
                final_price=n.final_price, payment_terms=n.payment_terms, delivery_days=n.delivery_days,
                tactic=n.tactic, outcome=n.outcome, quality_score=n.quality_score,
                delivery_on_time=n.delivery_on_time, created_at=n.created_at, closed_at=n.closed_at,
            ) for n in recent_n
        ],
        recent_learnings=recent_learnings,
    )

