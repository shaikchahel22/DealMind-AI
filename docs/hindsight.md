# How Hindsight Powers DEALMIND

DEALMIND's entire value proposition rests on one loop:

```
EXPERIENCE -> REMEMBER -> RECALL -> REASON -> ACT -> LEARN -> (back to REMEMBER)
```

## Where this lives in the code

| Step | File | What happens |
|------|------|---------------|
| REMEMBER | `app/hindsight/client.py`, `app/agents/learning_agent.py` | After a negotiation closes, `learn_from_outcome()` writes 3-4 discrete memory records (negotiation experience, payment pattern, delivery outcome, tactic result) |
| RECALL | `app/hindsight/local_store.py` / `RemoteHindsightClient.recall()` | `build_negotiation_brief()` queries Hindsight for the vendor + product before generating a strategy |
| REASON | `app/agents/strategy_agent.py` | Combines Hindsight's qualitative memory with the structured negotiation ledger (SQL) to compute target price, opening counter, walk-away, tactic, and risk |
| ACT | `app/agents/negotiation_assistant.py` | The live "what should I say next" chat agent turns the strategy into an actual suggested message |
| LEARN | `app/agents/learning_agent.py` | Outcome closes the loop -- writes new memory, recomputes the vendor's derived behavioral profile |

## Two backends, one interface

`app/hindsight/client.py` exposes `get_hindsight(db)` which returns either:

- **`LocalHindsightStore`** (default) -- a SQLite-backed store with the exact same `remember()` / `recall()` interface, so the whole product works with zero external services for local dev, grading, or offline demos.
- **`RemoteHindsightClient`** -- a thin REST adapter for Hindsight Cloud, activated the moment `HINDSIGHT_API_KEY` is set in `.env`. No other file needs to change.

## What gets stored

Every negotiation outcome writes multiple small "experience" records rather than one giant blob, matching the five memory categories from the product blueprint:

- **Negotiation Experience** -- what was quoted, what tactic was used, what the vendor accepted
- **Payment Pattern** -- which payment terms this vendor has accepted
- **Outcome (delivery)** -- on-time / late delivery history
- **Tactic Memory** -- win/loss record per tactic, per vendor

These are retrieved and shown directly in the **Evidence Panel** on the Negotiation Brief and in the **Memory Explorer** screen, so a judge (or a procurement manager) can see exactly what DEALMIND is basing its recommendation on -- nothing is a black box.

## Proving the loop works (manual test)

1. Start a negotiation with a vendor that has no history -> brief shows `confidence: low`, `evidence_count: 0`.
2. Save a **successful** outcome with tactic `volume_commitment`.
3. Start a *second* negotiation with the same vendor -> the brief now cites that negotiation as evidence, recommends `volume_commitment` again, and confidence rises.
4. Save an **unsuccessful** outcome for a different tactic.
5. Start a third negotiation -> DEALMIND still favors the tactic with the better win rate, not the most recent one -- because `_tactic_success_rates()` in `strategy_agent.py` ranks by win rate, not recency.

This is the exact test described in the project blueprint's "Most Important Technical Test" section.
