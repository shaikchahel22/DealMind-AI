import os
from pathlib import Path
os.environ["DATABASE_URL"]="sqlite:///./test_fresh_dealmind.db"
os.environ["MEMORY_MODE"]="local"
os.environ["LLM_MODE"]="deterministic"
os.environ["AUTO_SEED"]="true"
db_path=Path("test_fresh_dealmind.db")
if db_path.exists(): db_path.unlink()
from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_fresh_database_complete_negotiation_flow():
    assert client.get("/api/health").status_code==200
    vendors=client.get("/api/vendors"); assert vendors.status_code==200 and len(vendors.json())>=1
    status=client.get("/api/integrations/status"); assert status.status_code==200
    assert status.json()["hindsight"]["mode"]=="local-hindsight-compatible-store"
    assert status.json()["llm"]["mode"]=="deterministic"
    reset=client.post("/api/demo/reset"); assert reset.status_code==200
    body=client.get("/api/demo/scenario").json(); vendor_id=body["vendor_id"]
    brief=client.post("/api/negotiations",json={"vendor_id":vendor_id,"product":body["product"],"quantity":body["quantity"],"quoted_price":body["quoted_price"]})
    assert brief.status_code==201 and brief.json()["target_min"]>0
    neg_id=brief.json()["negotiation_id"]
    chat=client.post(f"/api/negotiations/{neg_id}/chat",json={"vendor_message":"We can do $9200 per unit if you confirm today."})
    assert chat.status_code==200 and chat.json()["suggested_response"]
    outcome=client.post(f"/api/negotiations/{neg_id}/outcome",json={"final_price":body["target_price"],"payment_terms":body["payment"],"tactic":body["tactic"],"outcome":"successful","quality_score":4.5,"delivery_on_time":True})
    assert outcome.status_code==200
    memories=client.get(f"/api/memory?vendor_id={vendor_id}"); assert memories.status_code==200 and len(memories.json())>=1
    second=client.post("/api/negotiations",json={"vendor_id":vendor_id,"product":body["product"],"quantity":body["quantity"],"quoted_price":body["quoted_price"]})
    assert second.status_code==201 and second.json()["evidence_count"]>=1
    stats=client.get("/api/dashboard").json(); assert stats["negotiation_count"]>=2 and stats["successful_negotiation_count"]>=1 and stats["success_rate"]>0
def teardown_module():
    if db_path.exists(): db_path.unlink()
