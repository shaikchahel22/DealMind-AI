"""Optional Groq LLM call, used to turn a structured strategy into natural
negotiation language (the brief's rationale text and chat replies).

DEALMIND never lets the LLM invent numbers -- targets, counters and
walk-away prices are always computed deterministically in
strategy_agent.py from Hindsight evidence. The LLM is only asked to
phrase that structured decision in plain English, and if no GROQ_API_KEY
is configured, a template-based fallback produces the same shape of
output so the whole product works with zero API keys.
"""
import os
import json
import httpx

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def llm_available() -> bool:
    return bool(GROQ_API_KEY)


def generate(system_prompt: str, user_prompt: str, max_tokens: int = 400) -> str | None:
    """Returns None on any failure or missing key so callers can fall back."""
    if not GROQ_API_KEY:
        return None
    try:
        resp = httpx.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": max_tokens,
                "temperature": 0.4,
            },
            timeout=15.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except (httpx.HTTPError, KeyError, IndexError, json.JSONDecodeError) as exc:
        print(f"[groq] generation failed, falling back to template: {exc}")
        return None
