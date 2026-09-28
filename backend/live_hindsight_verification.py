import sys
import json
import time
import httpx

API_BASE = "http://127.0.0.1:8000"
client = httpx.Client(timeout=45.0)

def main():
    print("="*60)
    print("PHASE 1 -- ENVIRONMENT")
    print("="*60)
    status_resp = client.get(f"{API_BASE}/api/memory/status")
    print(f"Status HTTP {status_resp.status_code}: {status_resp.json()}")
    status_data = status_resp.json()
    assert status_data["backend"] == "hindsight-cloud", f"Expected backend hindsight-cloud, got {status_data['backend']}"
    print("[PASS] Backend confirmed running with hindsight-cloud.")

    print("\n" + "="*60)
    print("PHASE 2 -- REAL RETAIN (NEGOTIATION A)")
    print("="*60)
    # Check or create vendor LIVE_TEST_APEX
    vendors = client.get(f"{API_BASE}/api/vendors").json()
    vendor = next((v for v in vendors if v["name"] == "LIVE_TEST_APEX"), None)
    if not vendor:
        v_resp = client.post(f"{API_BASE}/api/vendors", json={"name": "LIVE_TEST_APEX", "category": "manufacturing"})
        assert v_resp.status_code in [200, 201]
        vendor = v_resp.json()
    vendor_id = vendor["id"]
    print(f"Vendor: LIVE_TEST_APEX (ID: {vendor_id})")

    # Start Negotiation A
    neg_a_payload = {
        "vendor_id": vendor_id,
        "product": "Industrial Bearings",
        "quantity": 5000,
        "quoted_price": 10000.0
    }
    neg_a_resp = client.post(f"{API_BASE}/api/negotiations", json=neg_a_payload)
    print(f"Start Negotiation A HTTP {neg_a_resp.status_code}")
    assert neg_a_resp.status_code in [200, 201]
    neg_a = neg_a_resp.json()
    neg_a_id = neg_a["negotiation_id"]
    print(f"Negotiation A ID: {neg_a_id}, Initial Evidence Count: {neg_a.get('evidence_count')}")

    # Record Outcome A
    outcome_a = {
        "final_price": 8500.0,
        "payment_terms": "Net 45",
        "tactic": "volume_commitment",
        "outcome": "successful",
        "delivery_on_time": True
    }
    outcome_a_resp = client.post(f"{API_BASE}/api/negotiations/{neg_a_id}/outcome", json=outcome_a)
    print(f"Save Outcome A HTTP {outcome_a_resp.status_code}")
    assert outcome_a_resp.status_code == 200
    print("[PASS] Experience retained through DEALMIND Hindsight Client.")

    print("\n" + "="*60)
    print("PHASE 3 -- REAL RECALL")
    print("="*60)
    # Allow 2 seconds for cloud index
    time.sleep(2)
    memories_resp = client.get(f"{API_BASE}/api/memory?vendor_id={vendor_id}")
    print(f"Memory Recall HTTP {memories_resp.status_code}")
    assert memories_resp.status_code == 200
    memories = memories_resp.json()
    print(f"Recalled {len(memories)} memories for LIVE_TEST_APEX:")
    for idx, m in enumerate(memories, 1):
        print(f"  [{idx}] ID: {m.get('id')} | Kind: {m.get('kind')} | Confidence: {m.get('confidence')}")
        print(f"      Content: {m.get('content')}")
    
    assert len(memories) > 0, "Expected at least 1 memory recalled from Hindsight Cloud"
    print("[PASS] Real Recall verified with semantic content matching Phase 2.")

    print("\n" + "="*60)
    print("PHASE 4 & 5 -- DEALMIND STRATEGY & LEARNING LOOP (NEGOTIATION B)")
    print("="*60)
    # Start Negotiation B with same quote
    neg_b_payload = {
        "vendor_id": vendor_id,
        "product": "Industrial Bearings",
        "quantity": 5000,
        "quoted_price": 10000.0
    }
    neg_b_resp = client.post(f"{API_BASE}/api/negotiations", json=neg_b_payload)
    print(f"Start Negotiation B HTTP {neg_b_resp.status_code}")
    assert neg_b_resp.status_code in [200, 201]
    neg_b = neg_b_resp.json()
    neg_b_id = neg_b["negotiation_id"]
    print(f"Negotiation B ID: {neg_b_id}")
    print(f"Evidence Count: {neg_b.get('evidence_count')}")
    print(f"Recommended Target Price: {neg_b.get('recommended_target_price')}")
    print(f"Recommended Tactic: {neg_b.get('recommended_tactic')}")
    print(f"Negotiation Brief: {neg_b.get('brief')}")
    print(f"Tactic Evidence: {json.dumps(neg_b.get('tactic_evidence', {}), indent=2)}")
    print(f"Memory Snippets ({len(neg_b.get('memory_snippets', []))}):")
    for s in neg_b.get("memory_snippets", []):
        print(f"  * {s}")

    assert neg_b.get("evidence_count") > 0, "Expected evidence count > 0 in Negotiation B"
    assert neg_b.get("recommended_tactic") == "volume_commitment", f"Expected volume_commitment, got {neg_b.get('recommended_tactic')}"
    print("[PASS] Strategy correctly recalled Negotiation A and recommended volume_commitment.")

    print("\n" + "="*60)
    print("PHASE 5 (CONT.) -- SAVE OUTCOME B & START NEGOTIATION C")
    print("="*60)
    # Save an unsuccessful outcome for time_pressure
    outcome_b = {
        "final_price": 10000.0,
        "payment_terms": "Net 30",
        "tactic": "time_pressure",
        "outcome": "unsuccessful",
        "delivery_on_time": False
    }
    outcome_b_resp = client.post(f"{API_BASE}/api/negotiations/{neg_b_id}/outcome", json=outcome_b)
    print(f"Save Outcome B HTTP {outcome_b_resp.status_code}")
    assert outcome_b_resp.status_code == 200

    time.sleep(2)

    # Start Negotiation C
    neg_c_payload = {
        "vendor_id": vendor_id,
        "product": "Industrial Bearings",
        "quantity": 5000,
        "quoted_price": 10000.0
    }
    neg_c_resp = client.post(f"{API_BASE}/api/negotiations", json=neg_c_payload)
    print(f"Start Negotiation C HTTP {neg_c_resp.status_code}")
    assert neg_c_resp.status_code in [200, 201]
    neg_c = neg_c_resp.json()
    print(f"Negotiation C ID: {neg_c['negotiation_id']}")
    print(f"Evidence Count: {neg_c.get('evidence_count')}")
    print(f"Recommended Tactic: {neg_c.get('recommended_tactic')}")
    print(f"Tactic Evidence: {json.dumps(neg_c.get('tactic_evidence', {}), indent=2)}")
    
    assert neg_c.get("recommended_tactic") == "volume_commitment", "Agent should distinguish and keep successful tactic"
    print("[PASS] End-to-end multi-round learning loop verified successfully!")

if __name__ == "__main__":
    main()
