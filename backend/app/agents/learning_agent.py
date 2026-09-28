"""Runs after a negotiation outcome is recorded. Writes new experience to
Hindsight and updates the vendor's derived behavioral profile -- this is
the 'Learn' step that closes the Remember -> Recall -> Reason -> Negotiate
-> Learn loop.
"""
from sqlalchemy.orm import Session

from app.models.vendor import Vendor
from app.models.negotiation import Negotiation
from app.hindsight.client import get_hindsight


def learn_from_outcome(db: Session, negotiation: Negotiation) -> list[str]:
    vendor: Vendor = negotiation.vendor
    hindsight = get_hindsight(db)
    written: list[str] = []

    discount_pct = None
    if negotiation.initial_price and negotiation.final_price:
        discount_pct = round((1 - negotiation.final_price / negotiation.initial_price) * 100, 1)

    # -- negotiation_experience --
    if negotiation.outcome == "successful":
        content = (
            f"{vendor.name} accepted {negotiation.final_price} per unit "
            f"(from a {negotiation.initial_price} quote, ~{discount_pct}% off) "
            f"for {negotiation.quantity} units of {negotiation.product} using the "
            f"'{(negotiation.tactic or 'unspecified').replace('_', ' ')}' tactic"
            + (f", accepting {negotiation.payment_terms}." if negotiation.payment_terms else ".")
        )
    else:
        content = (
            f"{vendor.name} did not respond well to the '{(negotiation.tactic or 'unspecified').replace('_', ' ')}' "
            f"tactic on {negotiation.product} -- final outcome was unsuccessful. Try a different approach next time."
        )
    hindsight.remember(
        content=content, kind="negotiation_experience", vendor_id=vendor.id,
        negotiation_id=negotiation.id,
        data={"tactic": negotiation.tactic, "outcome": negotiation.outcome, "discount_pct": discount_pct},
        confidence=0.9,
    )
    written.append(content)

    # -- payment_pattern --
    if negotiation.payment_terms:
        content = f"{vendor.name} accepted {negotiation.payment_terms} payment terms on this order."
        hindsight.remember(content=content, kind="payment_pattern", vendor_id=vendor.id, negotiation_id=negotiation.id, confidence=0.8)
        written.append(content)

    # -- delivery outcome --
    if negotiation.delivery_on_time is not None:
        content = (
            f"{vendor.name} delivered on time." if negotiation.delivery_on_time
            else f"{vendor.name} delivered late on this order -- factor delivery risk into future terms."
        )
        hindsight.remember(content=content, kind="outcome", vendor_id=vendor.id, negotiation_id=negotiation.id, confidence=0.85)
        written.append(content)

    # -- tactic memory --
    if negotiation.tactic:
        content = (
            f"Tactic '{negotiation.tactic.replace('_', ' ')}' was "
            f"{'successful' if negotiation.outcome == 'successful' else 'unsuccessful'} with {vendor.name}."
        )
        hindsight.remember(content=content, kind="tactic", vendor_id=vendor.id, negotiation_id=negotiation.id, confidence=0.85)
        written.append(content)

    _recompute_vendor_profile(db, vendor)
    return written


def _recompute_vendor_profile(db: Session, vendor: Vendor) -> None:
    """Aggregate closed negotiations into the vendor's summary profile
    fields used on the Vendor Profile screen."""
    history = [n for n in vendor.negotiations if n.final_price is not None]
    if not history:
        return

    successful = [n for n in history if n.outcome == "successful"]
    discounts = [
        (1 - n.final_price / n.initial_price) for n in history if n.initial_price and n.final_price
    ]
    if discounts:
        vendor.price_flexibility = round(min(1.0, max(0.0, sum(discounts) / len(discounts) * 4)), 2)

    volume_wins = [n for n in history if n.tactic == "volume_commitment" and n.outcome == "successful"]
    vendor.volume_sensitivity = round(min(1.0, len(volume_wins) / max(1, len(history))), 2)

    payment_flex = sum(1 for n in history if n.payment_terms and "45" in (n.payment_terms or ""))
    vendor.payment_flexibility = round(min(1.0, payment_flex / max(1, len(history))), 2)

    on_time = [n for n in history if n.delivery_on_time is not None]
    if on_time:
        vendor.delivery_reliability = round(sum(1 for n in on_time if n.delivery_on_time) / len(on_time), 2)

    quality_scores = [n.quality_score for n in history if n.quality_score is not None]
    if quality_scores:
        vendor.quality_score = round(sum(quality_scores) / len(quality_scores), 2)

    tally: dict[str, list[int]] = {}
    for n in history:
        if not n.tactic:
            continue
        tally.setdefault(n.tactic, [0, 0])
        tally[n.tactic][1] += 1
        if n.outcome == "successful":
            tally[n.tactic][0] += 1
    if tally:
        vendor.best_tactic = max(tally.items(), key=lambda kv: (kv[1][0] / kv[1][1], kv[1][1]))[0]

    db.add(vendor)
    db.commit()
