"""Single entry point DEALMIND's agents use to talk to Hindsight.

Two modes, same interface:
  - HINDSIGHT_API_KEY unset  -> LocalHindsightStore (SQLite-backed, offline)
  - HINDSIGHT_API_KEY set    -> RemoteHindsightClient (Hindsight Cloud REST)

Swapping .env is the only change needed to move from local dev to a real
Hindsight Cloud project -- nothing in app/agents/ or app/api/ needs to know
which mode is active.
"""
import os
import json
from importlib.util import find_spec
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

import httpx
from sqlalchemy.orm import Session

from app.hindsight.local_store import LocalHindsightStore

HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY", "").strip()
HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io").strip()
HINDSIGHT_COLLECTION = os.getenv("HINDSIGHT_COLLECTION", "dealmind-negotiations").strip()
REMOTE_CLIENT_AVAILABLE = find_spec("hindsight_client") is not None

if HINDSIGHT_API_KEY and not REMOTE_CLIENT_AVAILABLE:
    print("[hindsight] SDK is unavailable; using the local memory store.")


class RemoteHindsightClient:
    """Thin REST adapter for Hindsight Cloud.

    Endpoint shape follows Hindsight's documented `/v1/collections/{c}/memories`
    write + search pattern. If your Hindsight project uses a different route,
    this is the only file that needs to change.
    """

    def __init__(self):
        from hindsight_client import Hindsight
        self._client = Hindsight(api_key=HINDSIGHT_API_KEY, base_url=HINDSIGHT_BASE_URL)

    def remember(self, content, kind, vendor_id=None, negotiation_id=None, data=None, confidence=0.75):
        tags = [kind]
        if vendor_id:
            tags.append(f"vendor_{vendor_id}")
            
        metadata = {
            "kind": str(kind),
            "vendor_id": str(vendor_id) if vendor_id is not None else "",
            "negotiation_id": str(negotiation_id) if negotiation_id is not None else "",
            "confidence": str(confidence),
        }
        if data:
            for k, v in data.items():
                metadata[k] = str(v)
        try:
            self._client.retain(
                bank_id=HINDSIGHT_COLLECTION,
                content=content,
                tags=tags,
                metadata=metadata,
            )
            return True
        except Exception as exc:
            print(f"[hindsight] remote remember() failed: {exc}")
            return None

    def recall(self, query="", vendor_id=None, kind=None, limit=10):
        tags = []
        if kind:
            tags.append(kind)
        if vendor_id:
            tags.append(f"vendor_{vendor_id}")

        search_query = query.strip() if (query and query.strip()) else "negotiation history experience"

        try:
            resp = self._client.recall(
                bank_id=HINDSIGHT_COLLECTION,
                query=search_query,
                tags=tags if tags else None,
                tags_match="any" if tags else "any",
            )
            results = []
            for r in resp.results:
                text_content = getattr(r, "text", None) or getattr(r, "content", "") or ""
                results.append({
                    "id": getattr(r, "id", None) or str(hash(text_content)),
                    "content": text_content,
                    "metadata": getattr(r, "metadata", {}) or {},
                })
            return results[:limit]
        except Exception as exc:
            print(f"[hindsight] remote recall() failed: {exc}")
            return []

    def total_count(self) -> int:
        try:
            mems = self._client.list_memories(bank_id=HINDSIGHT_COLLECTION)
            return getattr(mems, "total", len(getattr(mems, "items", [])))
        except Exception as exc:
            print(f"[hindsight] remote total_count() failed: {exc}")
            try:
                results = self.recall(query="negotiation history experience tactic outcome", limit=100)
                return len(results)
            except Exception:
                return 0


def get_hindsight(db: Session):
    """Return the active Hindsight-compatible client for this request."""
    if is_remote():
        return RemoteHindsightClient()
    return LocalHindsightStore(db)


def is_remote() -> bool:
    return bool(HINDSIGHT_API_KEY) and REMOTE_CLIENT_AVAILABLE
