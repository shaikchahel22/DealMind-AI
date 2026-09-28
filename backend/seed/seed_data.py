"""Seeds DEALMIND with vendors + historical negotiations + Hindsight
memory so a judge opening the demo sees a believable memory base instead
of an empty system (per the project blueprint, section 28).

Run with:  python -m seed.seed_data
"""
import random
from datetime import datetime, timedelta

from app.database import Base, engine, SessionLocal
from app.models.vendor import Vendor
from app.models.negotiation import Negotiation
from app.agents.learning_agent import learn_from_outcome

random.seed(42)

VENDOR_PROFILES = [
    # name, category, price_flex(0-1 higher=more discount given), payment_flex, volume_sens, delivery_rel, best_tactic
    ("Apex Industrial Supplies", "Industrial Bearings", 0.85, 0.6, 0.9, 0.85, "volume_commitment"),
    ("Nova Components", "Electronic Components", 0.35, 0.85, 0.3, 0.92, "payment_terms"),
    ("Vertex Packaging", "Packaging Materials", 0.55, 0.3, 0.4, 0.65, "long_term_contract"),
    ("PrimeSteel Manufacturing", "Raw Steel", 0.4, 0.5, 0.7, 0.8, "volume_commitment"),
    ("Orbit Logistics", "Freight & Logistics", 0.3, 0.7, 0.35, 0.88, "long_term_contract"),
    ("Zenith Electronics", "Circuit Components", 0.5, 0.4, 0.6, 0.75, "volume_commitment"),
    ("Global Bearings Co.", "Industrial Bearings", 0.6, 0.55, 0.8, 0.7, "volume_commitment"),
    ("Metro Chemicals", "Industrial Chemicals", 0.25, 0.6, 0.2, 0.95, "payment_terms"),
    ("Summit Plastics", "Plastic Components", 0.45, 0.45, 0.5, 0.6, "competitor_reference"),
    ("Harbor Fasteners", "Fasteners & Hardware", 0.65, 0.5, 0.75, 0.82, "volume_commitment"),
]

PRODUCTS = {
    "Industrial Bearings": ["Industrial Bearings", "Ball Bearings", "Roller Bearings"],
    "Electronic Components": ["Microcontrollers", "PCB Connectors", "Sensors"],
    "Packaging Materials": ["Corrugated Boxes", "Shrink Wrap", "Pallet Wrap"],
    "Raw Steel": ["Steel Coils", "Steel Sheets", "Rebar"],
    "Freight & Logistics": ["Freight Contract", "Warehousing Contract"],
    "Circuit Components": ["Resistor Packs", "Capacitor Packs", "IC Chips"],
    "Industrial Chemicals": ["Industrial Solvents", "Adhesives"],
    "Plastic Components": ["Injection-Molded Housings", "Plastic Fasteners"],
    "Fasteners & Hardware": ["Bolts", "Hex Nuts", "Anchor Bolts"],
}

TACTICS = ["volume_commitment", "payment_terms", "long_term_contract", "competitor_reference", "direct_discount", "urgency"]
PAYMENT_TERMS = ["Net 30", "Net 45", "Net 60"]


def tactic_for(vendor_best_tactic: str) -> str:
    # Weighted so the vendor's "best" tactic shows up often enough to be
    # learnable, but not every single time -- otherwise there's nothing
    # for the Learning Agent to discover.
    if random.random() < 0.55:
        return vendor_best_tactic
    return random.choice(TACTICS)


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Vendor).count() > 0:
        print("Vendors already seeded -- skipping. Delete dealmind.db to reseed from scratch.")
        db.close()
        return

    total_negotiations = 0
    for name, category, price_flex, payment_flex, volume_sens, delivery_rel, best_tactic in VENDOR_PROFILES:
        vendor = Vendor(name=name, category=category, contact_name=f"{name.split()[0]} Sales Team", best_tactic=best_tactic)
        db.add(vendor)
        db.commit()
        db.refresh(vendor)

        category_base_prices = {
            "Industrial Bearings": 10000.0,
            "Electronic Components": 500.0,
            "Packaging Materials": 150.0,
            "Raw Steel": 45000.0,
            "Freight & Logistics": 25000.0,
            "Circuit Components": 800.0,
            "Industrial Chemicals": 12000.0,
            "Plastic Components": 350.0,
            "Fasteners & Hardware": 120.0,
        }
        n_negotiations = random.randint(5, 9)
        base_price = category_base_prices.get(category, 5000.0)
        days_ago = 200

        for i in range(n_negotiations):
            product = random.choice(PRODUCTS[category])
            quantity = random.choice([1000, 2000, 5000, 8000, 10000, 15000])
            quoted = round(base_price * random.uniform(0.98, 1.05), 2)
            tactic = tactic_for(best_tactic)

            is_best_tactic = tactic == best_tactic
            success_chance = price_flex if is_best_tactic else price_flex * 0.5
            successful = random.random() < max(0.2, min(0.95, success_chance + 0.15))

            if successful:
                discount = price_flex * random.uniform(0.6, 1.0) * (1.2 if is_best_tactic else 0.7)
                final = round(quoted * (1 - min(0.35, discount * 0.35)), 2)
            else:
                final = round(quoted * random.uniform(0.97, 1.0), 2)

            payment_terms = random.choice(PAYMENT_TERMS) if random.random() < payment_flex + 0.2 else "Net 30"
            delivery_days = random.randint(7, 30)
            on_time = 1 if random.random() < delivery_rel else 0
            quality = round(random.uniform(3.5, 5.0), 1)

            created = datetime.utcnow() - timedelta(days=days_ago)
            days_ago -= random.randint(15, 30)

            n = Negotiation(
                vendor_id=vendor.id, product=product, quantity=quantity,
                initial_price=quoted, final_price=final, payment_terms=payment_terms,
                delivery_days=delivery_days, tactic=tactic,
                outcome="successful" if successful else "unsuccessful",
                quality_score=quality, delivery_on_time=on_time,
                created_at=created, closed_at=created + timedelta(days=random.randint(1, 5)),
            )
            db.add(n)
            db.commit()
            db.refresh(n)

            learn_from_outcome(db, n)
            total_negotiations += 1

        print(f"Seeded {n_negotiations} negotiations for {name}")

    db.close()
    print(f"\nDone. {len(VENDOR_PROFILES)} vendors, {total_negotiations} historical negotiations, "
          f"and matching Hindsight memory records created.")


if __name__ == "__main__":
    run()
