from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vendor import Vendor
from app.models.memory import MemoryRecord
from app.hindsight.client import get_hindsight, is_remote, memory_mode
from app.schemas import MemoryOut

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("", response_model=list[MemoryOut])
def list_memory(vendor_id: int | None = None, kind: str | None = None, q: str = "", limit: int = 50, db: Session = Depends(get_db)):
    """Powers the Memory Explorer screen. Searches whichever Hindsight
    backend is active (local or remote) and normalizes the response."""
    hindsight = get_hindsight(db)
    if is_remote():
        results = hindsight.recall(query=q, vendor_id=vendor_id, kind=kind, limit=limit)
        from datetime import datetime
        mapped = []
        for r in results:
            meta = r.get("metadata", {})
            mapped.append({
                "id": r.get("id", str(hash(r.get("content", "")))),
                "vendor_id": meta.get("vendor_id"),
                "negotiation_id": meta.get("negotiation_id"),
                "kind": meta.get("kind", ""),
                "content": r.get("content", ""),
                "confidence": meta.get("confidence", 0.75),
                "created_at": datetime.utcnow()
            })
        return mapped
    records = hindsight.recall(query=q, vendor_id=vendor_id, kind=kind, limit=limit)
    return [MemoryOut.model_validate(r) for r in records]


@router.get("/status")
def memory_status(db: Session = Depends(get_db)):
    """Returns the memory backend status and a truthful record count."""
    hindsight = get_hindsight(db)
    if is_remote():
        cloud_count = hindsight.total_count()
        return {
            "backend": memory_mode(),
            "total_records": cloud_count,
            "note": "Connected to Hindsight Cloud."
        }
    total = hindsight.total_count()
    return {
        "backend": memory_mode(),
        "total_records": total,
        "note": "Using the built-in SQLite memory store. This is not Hindsight Cloud.",
    }
