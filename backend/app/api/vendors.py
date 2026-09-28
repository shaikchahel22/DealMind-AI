from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vendor import Vendor
from app.schemas import VendorOut, VendorCreate

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


def _to_out(v: Vendor) -> VendorOut:
    return VendorOut(
        id=v.id, name=v.name, category=v.category, contact_name=v.contact_name,
        price_flexibility=v.price_flexibility, payment_flexibility=v.payment_flexibility,
        volume_sensitivity=v.volume_sensitivity, delivery_reliability=v.delivery_reliability,
        quality_score=v.quality_score, best_tactic=v.best_tactic,
        negotiation_count=len(v.negotiations),
    )


@router.get("", response_model=list[VendorOut])
def list_vendors(db: Session = Depends(get_db)):
    vendors = db.query(Vendor).order_by(Vendor.name).all()
    return [_to_out(v) for v in vendors]


@router.get("/{vendor_id}", response_model=VendorOut)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    v = db.get(Vendor, vendor_id)
    if not v:
        raise HTTPException(404, "Vendor not found")
    return _to_out(v)


@router.post("", response_model=VendorOut, status_code=201)
def create_vendor(payload: VendorCreate, db: Session = Depends(get_db)):
    if db.query(Vendor).filter(Vendor.name == payload.name).first():
        raise HTTPException(409, "Vendor with this name already exists")
    v = Vendor(name=payload.name, category=payload.category, contact_name=payload.contact_name)
    db.add(v)
    db.commit()
    db.refresh(v)
    return _to_out(v)
