"""The core DEALMIND pipeline: Retrieve -> Analyze -> Plan -> (LLM phrase).

This is intentionally rule-based at its core (see NOTE below) -- an LLM is
layered on top only to phrase the rationale in natural language. That keeps
the negotiation math reliable, testable, and independent of any LLM being
configured at all.
"""
import json
import statistics
from typing import Optional

from sqlalchemy.orm import Session

from app.models.vendor import Vendor
from app.models.negotiation import Negotiation
from app.hindsight.client import get_hindsight
from app.agents import llm_client


def _closed_negotiations(db: Session, vendor_id: int) -> list[Negotiation]:
    return (
        db.query(Negotiation)
        .filter(Negotiation.vendor_id == vendor_id, Negotiation.final_price.isnot(None))
        .order_by(Negotiation.created_at.desc())
        .all()
    )


def _tactic_success_rates(history: list[Negotiation]) -> dict:
    tally: dict[str, list[int]] = {}
    for n in history:
        if not n.tactic:
            continue
        tally.setdefault(n.tactic, [0, 0])
        tally[n.tactic][1] += 1
        if n.outcome == "successful":
            tally[n.tactic][0] += 1
    return {t: {"wins": w, "total": tot, "rate": (w / tot if tot else 0)} for t, (w, tot) in tally.items()}


def build_negotiation_brief(db: Session, vendor: Vendor, product: str, quantity: int, quoted_price: float) -> dict:
    """Retrieve -> Analyze -> Plan. Returns a fully structured brief dict
    that the frontend renders directly (see NegotiationBrief.tsx)."""

    # 1. RETRIEVE -- pull relevant experiences from Hindsight
    hindsight = get_hindsight(db)
    memories = hindsight.recall(query=f"{vendor.name} {product} price tactic payment delivery", vendor_id=vendor.id, limit=8)
    memory_snippets = [getattr(m, "content", None) or m.get("content", "") for m in memories]

    # 2. ANALYZE -- structured historical facts from the negotiation ledger
    history = _closed_negotiations(db, vendor.id)
    final_prices = [n.final_price for n in history if n.final_price]
    tactic_rates = _tactic_success_rates(history)
    best_tactic = max(tactic_rates.items(), key=lambda kv: (kv[1]["rate"], kv[1]["total"]))[0] if tactic_rates else None
    accepted_terms = [n.payment_terms for n in history if n.payment_terms]
    common_terms = statistics.mode(accepted_terms) if accepted_terms else "Net 30"
    late_deliveries = sum(1 for n in history if n.delivery_on_time == 0)
    risk = "high" if late_deliveries >= 2 else ("medium" if late_deliveries == 1 else "low")

    # 3. PLAN -- deterministic target math
    if final_prices:
        hist_min, hist_max = min(final_prices), max(final_prices)
        hist_avg = round(statistics.mean(final_prices), 2)
        target_min = round(min(hist_min, quoted_price * 0.92), 2)
        target_max = round(min(hist_max, quoted_price * 0.97), 2)
        if target_max < target_min:
            target_max = target_min
        opening_counter = round(target_min * 0.95, 2)
        walk_away = round(min(hist_avg * 1.05, quoted_price), 2)
        evidence_count = len(history)
        confidence = "high" if evidence_count >= 3 else ("medium" if evidence_count >= 1 else "low")
    else:
        # Cold-start vendor -- no history yet. Fall back to a generic
        # 8-12% anchor off the quote so the product still works day one.
        target_min = round(quoted_price * 0.88, 2)
        target_max = round(quoted_price * 0.94, 2)
        opening_counter = round(quoted_price * 0.83, 2)
        walk_away = round(quoted_price * 0.97, 2)
        evidence_count = 0
        confidence = "low"
        hist_avg = None

    tactic = best_tactic or "volume_commitment"
    tactic_evidence = tactic_rates.get(tactic)

    structured = {
        "vendor_id": vendor.id,
        "vendor_name": vendor.name,
        "product": product,
        "quantity": quantity,
        "quoted_price": quoted_price,
        "historical_min": min(final_prices) if final_prices else None,
        "historical_max": max(final_prices) if final_prices else None,
        "historical_avg": hist_avg,
        "target_min": target_min,
        "target_max": target_max,
        "opening_counter": opening_counter,
        "walk_away": walk_away,
        "recommended_tactic": tactic,
        "tactic_evidence": tactic_evidence,
        "payment_terms_suggestion": common_terms,
        "delivery_risk": risk,
        "evidence_count": evidence_count,
        "confidence": confidence,
        "memory_snippets": memory_snippets[:5],
    }

    # 4. Phrase the rationale (LLM if available, deterministic template otherwise)
    structured["rationale"] = _phrase_rationale(structured)
    return structured


def _phrase_rationale(s: dict) -> str:
    if s["evidence_count"] == 0:
        template = (
            f"No prior negotiations on file with {s['vendor_name']} yet, so this opening brief uses a "
            f"conservative anchor off their quote. Once this negotiation closes, DEALMIND will have real "
            f"evidence to work from next time."
        )
    else:
        tev = s["tactic_evidence"]
        tactic_line = (
            f"'{s['recommended_tactic'].replace('_', ' ')}' worked in {tev['wins']}/{tev['total']} past "
            f"negotiations" if tev else f"'{s['recommended_tactic'].replace('_', ' ')}' is the strongest tactic on file"
        )
        template = (
            f"Based on {s['evidence_count']} past negotiation(s), {s['vendor_name']}'s final price has ranged "
            f"{s['historical_min']}-{s['historical_max']} (avg {s['historical_avg']}). {tactic_line}. "
            f"Recommending a target of {s['target_min']}-{s['target_max']} with an opening counter of "
            f"{s['opening_counter']} and {s['payment_terms_suggestion']} payment terms."
        )

    if llm_client.llm_available():
        llm_out = llm_client.generate(
            system_prompt=(
                "You are DEALMIND, a procurement negotiation strategist. Rewrite the given negotiation "
                "brief rationale in 2-3 crisp sentences for a procurement manager. Never invent numbers "
                "that are not present in the input -- only rephrase. No markdown, no bullet points."
            ),
            user_prompt=json.dumps(s),
        )
        if llm_out:
            return llm_out
    return template
