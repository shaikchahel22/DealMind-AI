import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.models.vendor import Vendor

# Use a separate test database
os.environ["DATABASE_URL"] = "sqlite:///./test_dealmind.db"
import app.hindsight.client as hindsight_module
hindsight_module.HINDSIGHT_API_KEY = None
hindsight_module.is_remote = lambda: False

engine = create_engine("sqlite:///./test_dealmind.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Ensure starting clean
    db.query(Vendor).delete()
    db.commit()
    
    # STEP 1: Start with a known vendor
    v = Vendor(name="Test Vendor", category="software")
    db.add(v)
    db.commit()
    db.refresh(v)
    db.close()
    
    yield
    Base.metadata.drop_all(bind=engine)

def test_deterministic_learning_loop():
    db = TestingSessionLocal()
    v = db.query(Vendor).first()
    
    # STEP 2: Create negotiation A
    payload_a = {
        "vendor_id": v.id,
        "product": "Cloud Service",
        "quantity": 100,
        "quoted_price": 120.0
    }
    resp_a = client.post("/api/negotiations", json=payload_a)
    assert resp_a.status_code == 201
    neg_a = resp_a.json()
    assert neg_a["evidence_count"] == 0
    
    # STEP 3: Save a successful outcome using tactic volume_commitment
    outcome_a = {
        "final_price": 100.0,
        "payment_terms": "Net 30",
        "tactic": "volume_commitment",
        "outcome": "successful",
        "delivery_on_time": True
    }
    resp_outcome_a = client.post(f"/api/negotiations/{neg_a['negotiation_id']}/outcome", json=outcome_a)
    assert resp_outcome_a.status_code == 200
    
    # STEP 4: Verify the outcome is written to Local Hindsight
    memories_resp = client.get(f"/api/memory?vendor_id={v.id}")
    assert memories_resp.status_code == 200
    memories = memories_resp.json()
    assert len(memories) > 0
    
    # STEP 5: Create negotiation B with the same vendor
    payload_b = {
        "vendor_id": v.id,
        "product": "Cloud Service",
        "quantity": 100,
        "quoted_price": 120.0
    }
    resp_b = client.post("/api/negotiations", json=payload_b)
    neg_b = resp_b.json()
    
    # STEP 6 & 7: Verify Hindsight recalls negotiation A, uses experience
    assert neg_b["evidence_count"] == 1
    assert neg_b["recommended_tactic"] == "volume_commitment"
    assert "tactic_evidence" in neg_b
    
    # STEP 8: Save an unsuccessful outcome for tactic Y
    outcome_b = {
        "final_price": 120.0,
        "tactic": "time_pressure",
        "outcome": "unsuccessful",
    }
    client.post(f"/api/negotiations/{neg_b['negotiation_id']}/outcome", json=outcome_b)
    
    # STEP 9: Create negotiation C
    payload_c = {
        "vendor_id": v.id,
        "product": "Cloud Service",
        "quantity": 100,
        "quoted_price": 120.0
    }
    resp_c = client.post("/api/negotiations", json=payload_c)
    neg_c = resp_c.json()
    
    # STEP 10: Verify the strategy differentiates tactic outcomes
    assert neg_c["evidence_count"] == 2
    # It should still recommend volume_commitment because it worked, whereas time_pressure failed.
    assert neg_c["recommended_tactic"] == "volume_commitment"
