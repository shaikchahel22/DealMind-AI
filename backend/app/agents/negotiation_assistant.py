"""'What should I say next?' -- the live negotiation chat agent.

Given the vendor's latest message plus this negotiation's brief and the
vendor's tactic history, suggests the next thing the procurement manager
should say. Deterministic core (pick the tactic + numbers) with optional
LLM phrasing, same pattern as strategy_agent.
"""
import json
import re

from app.agents import llm_client


def suggest_reply(brief: dict, vendor_message: str, quantity: int) -> dict:
    # Pull any price the vendor mentioned out of their message to react to it.
    price_match = re.search(r"[₹$]\s?(\d+(?:\.\d+)?)", vendor_message)
    vendor_price = float(price_match.group(1)) if price_match else None

    tactic = brief.get("recommended_tactic", "volume_commitment")
    bumped_qty = int(quantity * 1.2) if tactic == "volume_commitment" else quantity
    target = brief.get("target_min")
    terms = brief.get("payment_terms_suggestion", "Net 45")

    if tactic == "volume_commitment":
        structured_ask = (
            f"If we increase the order to {bumped_qty} units, can you move to {target} "
            f"per unit with {terms} payment terms?"
        )
    elif tactic == "long_term_contract":
        structured_ask = (
            f"We'd consider a long-term supply agreement at {target} per unit if you can "
            f"commit to {terms} payment terms and on-time delivery."
        )
    else:
        structured_ask = f"Could you move closer to {target} per unit, with {terms} payment terms?"

    evidence_note = None
    if brief.get("tactic_evidence"):
        tev = brief["tactic_evidence"]
        evidence_note = f"{brief['vendor_name']} has accepted this approach in {tev['wins']}/{tev['total']} past negotiations."
    elif brief.get("evidence_count", 0) == 0:
        evidence_note = "No history with this vendor yet -- this is a calibrated opening move, not a proven pattern."

    reasoning = evidence_note or "Recommendation based on available negotiation history."
    if llm_client.llm_available():
        llm_out = llm_client.generate(
            system_prompt=(
                "You are DEALMIND's live negotiation assistant. Given the vendor's last message and a "
                "suggested counter-offer, write ONE short reasoning sentence (why this move) -- do not "
                "restate the counter-offer itself, that is shown separately. No markdown."
            ),
            user_prompt=json.dumps({"vendor_message": vendor_message, "suggested_ask": structured_ask, "evidence": evidence_note}),
            max_tokens=120,
        )
        if llm_out:
            reasoning = llm_out

    return {
        "vendor_price_mentioned": vendor_price,
        "suggested_response": structured_ask,
        "reasoning": reasoning,
        "tactic": tactic,
    }
