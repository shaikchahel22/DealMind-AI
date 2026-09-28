"""Optional Groq phrasing layer. Decision-critical numbers remain deterministic."""
import os,json,httpx
LLM_MODE=os.getenv("LLM_MODE","deterministic").strip().lower()
GROQ_API_KEY=os.getenv("GROQ_API_KEY","").strip()
GROQ_MODEL=os.getenv("GROQ_MODEL","openai/gpt-oss-120b")
GROQ_URL="https://api.groq.com/openai/v1/chat/completions"
def llm_available(): return LLM_MODE=="groq" and bool(GROQ_API_KEY)
def llm_status():
    error=None
    if LLM_MODE not in {"deterministic","groq"}: error="LLM_MODE must be 'deterministic' or 'groq'."
    elif LLM_MODE=="groq" and not GROQ_API_KEY: error="LLM_MODE=groq requires GROQ_API_KEY."
    active=LLM_MODE=="groq" and bool(GROQ_API_KEY)
    return {"mode":"groq" if active else "deterministic","configured":bool(GROQ_API_KEY),"active":active,"model":GROQ_MODEL if active else None,"error":error}
def generate(system_prompt,user_prompt,max_tokens=400):
    if not llm_available(): return None
    try:
        resp=httpx.post(GROQ_URL,headers={"Authorization":f"Bearer {GROQ_API_KEY}","Content-Type":"application/json"},json={"model":GROQ_MODEL,"messages":[{"role":"system","content":system_prompt},{"role":"user","content":user_prompt}],"max_tokens":max_tokens,"temperature":.4},timeout=15)
        resp.raise_for_status(); return resp.json()["choices"][0]["message"]["content"].strip()
    except (httpx.HTTPError,KeyError,IndexError,json.JSONDecodeError) as exc:
        print(f"[groq] generation failed; deterministic phrasing will be used: {exc}"); return None
