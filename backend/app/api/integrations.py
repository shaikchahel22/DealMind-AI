from fastapi import APIRouter,Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.agents.llm_client import llm_status
from app.hindsight.client import memory_status,get_hindsight
router=APIRouter(prefix="/api/integrations",tags=["integrations"])
@router.get("/status")
def integration_status(db:Session=Depends(get_db)):
    database={"status":"connected","error":None}
    try: db.execute(text("SELECT 1"))
    except Exception as exc: database={"status":"error","error":str(exc)}
    hindsight=memory_status()
    if hindsight["active"]:
        try: hindsight.update(get_hindsight(db).check_connection())
        except Exception as exc: hindsight.update({"status":"error","error":str(exc)})
    else: hindsight["status"]="local" if hindsight["mode"]=="local-hindsight-compatible-store" else "error"
    result={"overall":"ok","database":database,"hindsight":hindsight,"llm":llm_status()}
    if any(v.get("error") for v in result.values() if isinstance(v,dict)): result["overall"]="degraded"
    return result
