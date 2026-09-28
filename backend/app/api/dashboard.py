from fastapi import APIRouter,Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.vendor import Vendor
from app.models.negotiation import Negotiation
from app.models.memory import MemoryRecord
from app.schemas import DashboardStats,NegotiationOut,MemoryOut
from app.hindsight.client import get_hindsight,is_remote
router=APIRouter(prefix="/api/dashboard",tags=["dashboard"])
@router.get("",response_model=DashboardStats)
def dashboard(db:Session=Depends(get_db)):
    all_n=db.query(Negotiation).all(); active=sum(n.outcome=="in_progress" for n in all_n)
    closed=[n for n in all_n if n.outcome in {"successful","unsuccessful"}]; successful=[n for n in closed if n.outcome=="successful"]
    savings=round(sum(max(0,n.initial_price-n.final_price) for n in successful if n.final_price is not None),2); rate=round(len(successful)/len(closed)*100,1) if closed else 0
    h=get_hindsight(db); memory_count=h.total_count()
    if is_remote():
        from datetime import datetime
        recent=[]
        for r in h.recall(query="negotiation history experience tactic outcome",limit=50)[:6]:
            meta=r.get("metadata",{})
            recent.append(MemoryOut(id=r.get("id",str(hash(r.get("content","")))),vendor_id=int(meta["vendor_id"]) if str(meta.get("vendor_id","")).isdigit() else None,negotiation_id=int(meta["negotiation_id"]) if str(meta.get("negotiation_id","")).isdigit() else None,kind=meta.get("kind","learning"),content=r.get("content",""),confidence=float(meta.get("confidence",.75)),created_at=datetime.fromisoformat(meta["created_at"]) if meta.get("created_at") else datetime.utcnow()))
    else: recent=[MemoryOut.model_validate(m) for m in db.query(MemoryRecord).order_by(MemoryRecord.created_at.desc()).limit(6).all()]
    recent_n=db.query(Negotiation).order_by(Negotiation.created_at.desc()).limit(6).all()
    return DashboardStats(active_negotiations=active,vendor_count=db.query(Vendor).count(),negotiation_count=len(all_n),successful_negotiation_count=len(successful),success_rate=rate,total_savings=savings,memory_insight_count=memory_count,
        recent_negotiations=[NegotiationOut(id=n.id,vendor_id=n.vendor_id,vendor_name=n.vendor.name if n.vendor else None,product=n.product,quantity=n.quantity,initial_price=n.initial_price,final_price=n.final_price,payment_terms=n.payment_terms,delivery_days=n.delivery_days,tactic=n.tactic,outcome=n.outcome,quality_score=n.quality_score,delivery_on_time=n.delivery_on_time,created_at=n.created_at,closed_at=n.closed_at) for n in recent_n],recent_learnings=recent)
