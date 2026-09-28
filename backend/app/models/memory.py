from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from datetime import datetime
from app.database import Base


class MemoryRecord(Base):
    """Local, Hindsight-API-compatible memory store.

    Every row is one 'experience' -- the same shape DEALMIND would write to
    Hindsight Cloud via app/hindsight/client.py. Kept in the same SQLite DB
    for a zero-config demo; set HINDSIGHT_API_KEY in .env to write to real
    Hindsight instead (see app/hindsight/client.py for the toggle).
    """
    __tablename__ = "memory_records"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True, index=True)
    negotiation_id = Column(Integer, ForeignKey("negotiations.id"), nullable=True)

    kind = Column(String, nullable=False)   # vendor_knowledge | negotiation_experience | payment_pattern | outcome | tactic
    content = Column(Text, nullable=False)  # natural-language "experience" sentence
    data_json = Column(Text, nullable=True)
    confidence = Column(Float, default=0.7)

    created_at = Column(DateTime, default=datetime.utcnow)
