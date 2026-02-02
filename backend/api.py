"""
FastAPI backend for Vesting Buddy.
Run: uvicorn api:app --reload (from backend dir) or uvicorn api:app --reload --app-dir backend
Production: set BACKEND_CORS_ORIGINS; frontend uses NEXT_PUBLIC_BACKEND_URL.
Chat model: set GEMINI_CHAT_MODEL (e.g. gemini-2.0-flash) or falls back to GEMINI_MODEL.
"""
import json
import os
import ssl
import urllib.error
import urllib.request
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from app import configure_opik
from config_loader import load_env
from constants.app_defaults import DEFAULT_POLICY_QUESTION
from constants.chat_prompt import VESTING_BUDDY_CHAT_SYSTEM_PROMPT
from utils.url_download import download_url_to_temp


def _ensure_env() -> None:
    load_env(os.path.join(os.path.dirname(__file__), ".env"))
    configure_opik()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _ensure_env()
    yield


app = FastAPI(title="Vesting Buddy API", lifespan=lifespan)

origins = os.getenv("BACKEND_CORS_ORIGINS", "*").strip()
if origins == "*":
    allow_origins = ["*"]
else:
    allow_origins = [o.strip() for o in origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RuntimeError)
def runtime_error_handler(request, exc: RuntimeError):
    raise HTTPException(status_code=502, detail=str(exc))


class FileUrlRequest(BaseModel):
    file_url: HttpUrl


class PolicyAnswerRequest(BaseModel):
    handbook_url: HttpUrl
    question: str = DEFAULT_POLICY_QUESTION


class AnalyzeRequest(BaseModel):
    paystub_url: HttpUrl
    handbook_url: HttpUrl
    rsu_url: HttpUrl | None = None
    policy_question: str | None = None


class ChatRequest(BaseModel):
    message: str
    context: str | None = None


def _gemini_chat(message: str, system_prompt: str, context: ssl.SSLContext | None) -> str:
    api_key = os.getenv("GEMINI_API_KEY") or ""
    base_url = (os.getenv("GEMINI_BASE_URL") or "").rstrip("/")
    model = os.getenv("GEMINI_CHAT_MODEL") or os.getenv("GEMINI_MODEL") or "gemini-2.0-flash"
    timeout = int(os.getenv("GEMINI_TIMEOUT_SECONDS") or "60")
    if not api_key or not base_url:
        raise RuntimeError("GEMINI_API_KEY and GEMINI_BASE_URL are required for chat")
    url = f"{base_url}/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": message}]}],
        "generationConfig": {"temperature": 0.7},
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        if context is None:
            resp = urllib.request.urlopen(req, timeout=timeout)
        else:
            resp = urllib.request.urlopen(req, timeout=timeout, context=context)
        with resp as r:
            body = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Chat request failed: {e.code} {err_body}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Chat request failed: {e.reason}") from e
    candidates = body.get("candidates") or []
    if not candidates:
        raise RuntimeError("Chat response missing candidates")
    parts = (candidates[0].get("content") or {}).get("parts") or []
    if not parts:
        raise RuntimeError("Chat response missing content parts")
    return (parts[0].get("text") or "").strip()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/extract/paystub")
def extract_paystub(body: FileUrlRequest) -> dict[str, Any]:
    from agent.extractor_agent import load_extractor_from_env

    path = None
    try:
        path = download_url_to_temp(str(body.file_url))
        agent = load_extractor_from_env()
        return agent.extract_from_file(path)
    finally:
        if path and os.path.isfile(path):
            try:
                os.unlink(path)
            except OSError:
                pass


@app.post("/extract/rsu")
def extract_rsu(body: FileUrlRequest) -> dict[str, Any]:
    from agent.extractor_agent import load_extractor_from_env
    from constants.app_defaults import RSU_SCHEMA_FIELDS

    path = None
    try:
        path = download_url_to_temp(str(body.file_url))
        agent = load_extractor_from_env()
        return agent.extract_from_file(path, schema_fields=RSU_SCHEMA_FIELDS)
    finally:
        if path and os.path.isfile(path):
            try:
                os.unlink(path)
            except OSError:
                pass


@app.post("/policy/answer")
def policy_answer(body: PolicyAnswerRequest) -> dict[str, Any]:
    from agent.policy_scout_agent import load_policy_scout_from_env

    path = None
    try:
        path = download_url_to_temp(str(body.handbook_url))
        policy = load_policy_scout_from_env(handbook_path=path)
        return policy.answer(body.question)
    finally:
        if path and os.path.isfile(path):
            try:
                os.unlink(path)
            except OSError:
                pass


@app.post("/analyze")
def analyze(body: AnalyzeRequest) -> dict[str, Any]:
    from agent.extractor_agent import load_extractor_from_env
    from agent.guardrail_agent import load_guardrail_from_env
    from agent.policy_scout_agent import load_policy_scout_from_env
    from agent.strategist_agent import load_strategist_from_env
    from constants.app_defaults import DEFAULT_POLICY_QUESTION, RSU_SCHEMA_FIELDS

    paystub_path = None
    handbook_path = None
    rsu_path = None
    question = body.policy_question or DEFAULT_POLICY_QUESTION
    try:
        paystub_path = download_url_to_temp(str(body.paystub_url))
        handbook_path = download_url_to_temp(str(body.handbook_url))
        if body.rsu_url:
            rsu_path = download_url_to_temp(str(body.rsu_url))

        extractor = load_extractor_from_env()
        policy = load_policy_scout_from_env(handbook_path=handbook_path)
        strategist = load_strategist_from_env()
        guardrail = load_guardrail_from_env()

        paystub = extractor.extract_from_file(paystub_path)
        rsu_data = None
        if rsu_path:
            rsu_data = extractor.extract_from_file(rsu_path, schema_fields=RSU_SCHEMA_FIELDS)
        policy_answer = policy.answer(question)
        strategist_output = strategist.synthesize(paystub, policy_answer, rsu_data=rsu_data)
        guarded = guardrail.enforce(strategist_output["recommendation"])

        return {
            "question": question,
            "paystub": paystub,
            "policy": policy_answer,
            "leaked_value": strategist_output.get("leaked_value"),
            "reasoning": strategist_output.get("reasoning"),
            "action_plan": strategist_output.get("action_plan"),
            "recommendation": guarded["content"],
            "guardrail_status": guarded["status"],
        }
    finally:
        for p in (paystub_path, handbook_path, rsu_path):
            if p and os.path.isfile(p):
                try:
                    os.unlink(p)
                except OSError:
                    pass


@app.post("/chat")
def chat(body: ChatRequest) -> dict[str, str]:
    from agent.extractor_agent import build_ssl_context

    system_prompt = VESTING_BUDDY_CHAT_SYSTEM_PROMPT
    if body.context and body.context.strip():
        system_prompt = system_prompt + "\n\nRelevant user data:\n" + body.context.strip()
    ctx = build_ssl_context()
    reply = _gemini_chat(body.message, system_prompt, ctx)
    return {"reply": reply}
