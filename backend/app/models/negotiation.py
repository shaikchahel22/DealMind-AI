from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Negotiation(Base):
    __tablename__ = "negotiations"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)

    product = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)

    initial_price = Column(Float, nullable=False)
    final_price = Column(Float, nullable=True)

    payment_terms = Column(String, nullable=True)
    delivery_days = Column(Integer, nullable=True)

    tactic = Column(String, nullable=True)
    outcome = Column(String, default="in_progress")

    quality_score = Column(Float, nullable=True)
    delivery_on_time = Column(Integer, nullable=True)

    strategy_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    vendor = relationship("Vendor", back_populates="negotiations")
    messages = relationship("NegotiationMessage", back_populates="negotiation", cascade="all, delete-orphan")


class NegotiationMessage(Base):
    __tablename__ = "negotiation_messages"

    id = Column(Integer, primary_key=True, index=True)
    negotiation_id = Column(Integer, ForeignKey("negotiations.id"), nullable=False)
    sender = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    negotiation = relationship("Negotiation", back_populates="messages")
