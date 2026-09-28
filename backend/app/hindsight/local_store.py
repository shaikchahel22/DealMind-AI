"""Local, dependency-free stand-in for Hindsight Cloud.

Implements the same two operations DEALMIND needs from Hindsight --
`remember` (write an experience) and `recall` (retrieve relevant
experiences) -- backed by the app's own SQLite database (MemoryRecord
table). This is what powers the demo out-of-the-box with zero external
services. When HINDSIGHT_API_KEY is set, app/hindsight/client.py routes
through RemoteHindsightClient instead, with an identical interface.
"""
import json
import re
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.memory import MemoryRecord

STOPWORDS = {
    "the", "a", "an", "of", "to", "and", "or", "for", "in", "on", "with",
    "at", "is", "was", "were", "be", "been", "this", "that", "it", "as",
    "we", "they", "their", "our", "vendor", "negotiation",
}


def _tokenize(text: str) -> set:
    words = re.findall(r"[a-zA-Z0-9]+", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 2}


class LocalHindsightStore:
    def __init__(self, db: Session):
        self.db = db

    def remember(
        self,
        content: str,
        kind: str,
        vendor_id: Optional[int] = None,
        negotiation_id: Optional[int] = None,
        data: Optional[dict] = None,
        confidence: float = 0.75,
    ) -> MemoryRecord:
        record = MemoryRecord(
            vendor_id=vendor_id,
            negotiation_id=negotiation_id,
            kind=kind,
            content=content,
            data_json=json.dumps(data or {}),
            confidence=confidence,
            created_at=datetime.utcnow(),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def recall(
        self,
        query: str = "",
        vendor_id: Optional[int] = None,
        kind: Optional[str] = None,
        limit: int = 10,
    ) -> list[MemoryRecord]:
        q = self.db.query(MemoryRecord)
        if vendor_id is not None:
            q = q.filter(MemoryRecord.vendor_id == vendor_id)
        if kind is not None:
            q = q.filter(MemoryRecord.kind == kind)
        records = q.order_by(MemoryRecord.created_at.desc()).all()

        if not query.strip():
            return records[:limit]

        query_tokens = _tokenize(query)
        scored = []
        for r in records:
            overlap = len(query_tokens & _tokenize(r.content))
            # Recency nudges ties -- more recent experience wins, mirroring
            # how negotiation behavior can drift over time.
            scored.append((overlap, r.created_at, r))
        scored.sort(key=lambda t: (t[0], t[1]), reverse=True)
        # If nothing matched semantically, still return recent vendor memory
        # rather than an empty result -- an empty brief is a worse demo than
        # a loosely-relevant one.
        top = [r for score, _, r in scored if score > 0] or records
        return top[:limit]

    def all_for_vendor(self, vendor_id: int) -> list[MemoryRecord]:
        return (
            self.db.query(MemoryRecord)
            .filter(MemoryRecord.vendor_id == vendor_id)
            .order_by(MemoryRecord.created_at.desc())
            .all()
        )

    def total_count(self) -> int:
        return self.db.query(MemoryRecord).count()
