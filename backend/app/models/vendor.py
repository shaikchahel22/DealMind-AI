from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    category = Column(String, nullable=False)
    contact_name = Column(String, nullable=True)

    # Behavioral profile -- recomputed by the Learning Agent after every
    # negotiation outcome. These are *derived* summary fields; the real
    # evidence trail lives in Hindsight memory (see app/hindsight/).
    price_flexibility = Column(Float, default=0.5)
    payment_flexibility = Column(Float, default=0.5)
    volume_sensitivity = Column(Float, default=0.5)
    delivery_reliability = Column(Float, default=0.9)
    quality_score = Column(Float, default=4.0)
    best_tactic = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    negotiations = relationship("Negotiation", back_populates="vendor", cascade="all, delete-orphan")
