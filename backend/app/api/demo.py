"""Demo Mode API -- thin wrapper around the existing negotiation pipeline.

All endpoints here re-use the REAL Hindsight retain/recall path.
Demo-specific logic:
  - using a dedicated demo vendor "Apex Demo Corp"
  - exposing a POST /api/demo/reset endpoint so the demo can be restarted cleanly (resetting memories to 0) to clearly demonstrate BEFORE MEMORY vs AFTER MEMORY.

No fake memory is ever written. No production data is touched.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vendor import Vendor
from app.models.negotiation import Negotiation, NegotiationMessage
from app.models.memory import MemoryRecord

router = APIRouter(prefix="/api/demo", tags=["demo"])

# ── Demo scenario constants (single source of truth) ─────────────────────────
DEMO_VENDOR_NAME = "Apex Demo Corp"
DEMO_PRODUCT = "Industrial Bearings"
DEMO_QUANTITY = 5000
DEMO_QUOTED_PRICE = 10000.0
DEMO_TARGET_PRICE = 8500.0
DEMO_TACTIC = "volume_commitment"
DEMO_PAYMENT = "Net 45"


def _get_or_create_demo_vendor(db: Session) -> Vendor:
    vendor = (
        db.query(Vendor)
        .filter(Vendor.name == DEMO_VENDOR_NAME)
        .first()
    )
    if not vendor:
        vendor = Vendor(
            name=DEMO_VENDOR_NAME,
            category="Industrial Components",
            contact_name="Sarah Jenkins",
            price_flexibility=0.5,
            payment_flexibility=0.5,
            volume_sensitivity=0.5,
            delivery_reliability=0.9,
            quality_score=4.0,
            best_tactic=None,
        )
        db.add(vendor)
        db.commit()
        db.refresh(vendor)
    return vendor


@router.get("/scenario")
def get_demo_scenario(db: Session = Depends(get_db)):
    """Returns the canonical demo scenario constants and the Apex Demo vendor id."""
    vendor = _get_or_create_demo_vendor(db)

    return {
        "vendor_id": vendor.id,
        "vendor_name": DEMO_VENDOR_NAME,
        "product": DEMO_PRODUCT,
        "quantity": DEMO_QUANTITY,
        "quoted_price": DEMO_QUOTED_PRICE,
        "target_price": DEMO_TARGET_PRICE,
        "tactic": DEMO_TACTIC,
        "payment": DEMO_PAYMENT,
        "outcome": "successful",
        "vendor_negotiation_count": len(vendor.negotiations),
        "vendor_best_tactic": vendor.best_tactic,
    }


@router.post("/reset")
def reset_demo(db: Session = Depends(get_db)):
    """Resets the demo vendor state by clearing its past negotiations and Hindsight memories.

    This ensures that Step 1 ("BEFORE MEMORY") always starts with 0 memories recalled,
    providing a crystal-clear contrast with Step 4 ("AFTER MEMORY").
    """
    vendor = _get_or_create_demo_vendor(db)

    # Delete memory records for demo vendor
    db.query(MemoryRecord).filter(MemoryRecord.vendor_id == vendor.id).delete()

    # Get negotiation IDs to delete associated messages
    neg_ids = [n.id for n in vendor.negotiations]
    if neg_ids:
        db.query(NegotiationMessage).filter(NegotiationMessage.negotiation_id.in_(neg_ids)).delete(synchronize_session=False)
        db.query(Negotiation).filter(Negotiation.vendor_id == vendor.id).delete(synchronize_session=False)

    # Reset vendor profile stats to baseline
    vendor.price_flexibility = 0.5
    vendor.payment_flexibility = 0.5
    vendor.volume_sensitivity = 0.5
    vendor.best_tactic = None

    db.commit()
    db.refresh(vendor)

    return {
        "status": "reset",
        "vendor_id": vendor.id,
        "vendor_name": DEMO_VENDOR_NAME,
        "vendor_negotiation_count": 0,
    }
