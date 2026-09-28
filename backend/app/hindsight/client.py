"""Single memory adapter with explicit local vs Hindsight Cloud modes."""
import asyncio,os
from importlib.util import find_spec
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.hindsight.local_store import LocalHindsightStore
load_dotenv()
MEMORY_MODE=os.getenv("MEMORY_MODE","local").strip().lower()
HINDSIGHT_API_KEY=os.getenv("HINDSIGHT_API_KEY","").strip()
HINDSIGHT_BASE_URL=os.getenv("HINDSIGHT_BASE_URL","https://api.hindsight.vectorize.io").strip()
HINDSIGHT_BANK_ID=os.getenv("HINDSIGHT_BANK_ID",os.getenv("HINDSIGHT_COLLECTION","dealmind-negotiations")).strip()
REMOTE_CLIENT_AVAILABLE=find_spec("hindsight_client") is not None
class HindsightConfigurationError(RuntimeError): pass
def is_remote(): return MEMORY_MODE=="hindsight"
def memory_mode(): return "hindsight-cloud" if is_remote() else "local-hindsight-compatible-store"
def memory_status():
    configured=bool(HINDSIGHT_API_KEY); sdk_available=REMOTE_CLIENT_AVAILABLE; active=is_remote(); error=None
    if MEMORY_MODE not in {"local","hindsight"}: error="MEMORY_MODE must be 'local' or 'hindsight'."
    elif active and not configured: error="MEMORY_MODE=hindsight requires HINDSIGHT_API_KEY."
    elif active and not sdk_available: error="MEMORY_MODE=hindsight requires the hindsight-client package."
    return {"mode":memory_mode() if error is None else "invalid","configured":configured,"sdk_available":sdk_available,"active":active and error is None,"bank_id":HINDSIGHT_BANK_ID,"base_url":HINDSIGHT_BASE_URL,"error":error}
class RemoteHindsightClient:
    def __init__(self):
        if not HINDSIGHT_API_KEY: raise HindsightConfigurationError("HINDSIGHT_API_KEY is required when MEMORY_MODE=hindsight.")
        if not REMOTE_CLIENT_AVAILABLE: raise HindsightConfigurationError("hindsight-client is not installed. Run pip install -r requirements.txt.")
        from hindsight_client import Hindsight
        self._client=Hindsight(api_key=HINDSIGHT_API_KEY,base_url=HINDSIGHT_BASE_URL)
    def remember(self,content,kind,vendor_id=None,negotiation_id=None,data=None,confidence=.75):
        tags=[kind]+([f"vendor_{vendor_id}"] if vendor_id is not None else [])
        metadata={"kind":str(kind),"vendor_id":str(vendor_id) if vendor_id is not None else "","negotiation_id":str(negotiation_id) if negotiation_id is not None else "","confidence":str(confidence),"created_at":__import__("datetime").datetime.utcnow().isoformat()}
        if data: metadata.update({k:str(v) for k,v in data.items()})
        try: return self._client.retain(bank_id=HINDSIGHT_BANK_ID,content=content,tags=tags,metadata=metadata,document_id=f"negotiation-{negotiation_id}-{kind}" if negotiation_id is not None else None)
        except Exception as exc: raise RuntimeError(f"Hindsight retain failed: {exc}") from exc
    def recall(self,query="",vendor_id=None,kind=None,limit=10):
        tags=([kind] if kind else [])+([f"vendor_{vendor_id}"] if vendor_id is not None else [])
        try:
            resp=self._client.recall(bank_id=HINDSIGHT_BANK_ID,query=query.strip() or "negotiation history experience",tags=tags or None,tags_match="all_strict" if tags else "any")
            out=[]
            for r in resp.results:
                txt=getattr(r,"text",None) or getattr(r,"content","") or ""
                out.append({"id":getattr(r,"id",None) or str(hash(txt)),"content":txt,"metadata":getattr(r,"metadata",{}) or {}})
            return out[:limit]
        except Exception as exc: raise RuntimeError(f"Hindsight recall failed: {exc}") from exc
    def total_count(self):
        try:
            mems=self._client.list_memories(bank_id=HINDSIGHT_BANK_ID)
            return int(getattr(mems,"total",len(getattr(mems,"items",[]))))
        except Exception as exc: raise RuntimeError(f"Hindsight count failed: {exc}") from exc
    def check_connection(self):
        try: return {"status":"connected","total_records":self.total_count(),"error":None}
        except Exception as exc: return {"status":"error","total_records":None,"error":str(exc)}
    def delete_negotiation_memory(self,negotiation_id):
        try: [asyncio.run(self._client.documents.delete_document(HINDSIGHT_BANK_ID,f"negotiation-{negotiation_id}-{kind}")) for kind in ("negotiation_experience","payment_pattern","outcome","tactic","vendor_knowledge")]
        except Exception as exc:
            if "404" not in str(exc): raise RuntimeError(f"Hindsight demo reset failed: {exc}") from exc
def get_hindsight(db:Session):
    if is_remote():
        status=memory_status()
        if status["error"]: raise HindsightConfigurationError(status["error"])
        return RemoteHindsightClient()
    return LocalHindsightStore(db)
