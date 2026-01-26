import os
import sys
from typing import Iterable

from agent.extractor_agent import load_extractor_from_env
from agent.guardrail_agent import load_guardrail_from_env
from agent.policy_scout_agent import load_policy_scout_from_env
from agent.strategist_agent import load_strategist_from_env
from app import configure_opik, load_env


def list_asset_files(asset_dir: str) -> list[str]:
    if not os.path.isdir(asset_dir):
        return []
    files = []
    for name in os.listdir(asset_dir):
        path = os.path.join(asset_dir, name)
        if os.path.isfile(path):
            files.append(path)
    return files


def score_filename(path: str, keywords: Iterable[str]) -> int:
    name = os.path.basename(path).lower()
    return sum(1 for keyword in keywords if keyword in name)


def pick_best_match(files: list[str], keywords: Iterable[str]) -> str | None:
    if not files:
        return None
    ranked = sorted(files, key=lambda path: score_filename(path, keywords), reverse=True)
    if score_filename(ranked[0], keywords) == 0:
        return None
    return ranked[0]


def pick_documents(asset_dir: str) -> tuple[str, str]:
    files = [path for path in list_asset_files(asset_dir) if is_supported_asset(path)]
    if not files:
        raise RuntimeError("Assets folder is empty.")
    paystub_keywords = ("paystub", "paysub", "stub", "pay")
    handbook_keywords = ("handbook", "benefits", "policy", "employee", "401k")
    paystub = pick_best_match(files, paystub_keywords)
    handbook = pick_best_match(files, handbook_keywords)
    if not paystub:
        paystub = next(iter(files), None)
    if not handbook:
        handbook = next((path for path in files if path != paystub), paystub)
    if not paystub or not handbook:
        raise RuntimeError("Unable to select paystub and handbook from assets.")
    return paystub, handbook


def is_supported_asset(path: str) -> bool:
    name = os.path.basename(path).lower()
    return name.endswith((".pdf", ".txt", ".md", ".json"))


def resolve_question(args: list[str]) -> str:
    if len(args) > 1 and args[1]:
        return args[1]
    env_question = os.getenv("POLICY_QUESTION")
    if env_question:
        return env_question
    raise RuntimeError("Provide a question argument or POLICY_QUESTION")


def run() -> dict:
    load_env(os.path.join(os.path.dirname(__file__), ".env"))
    configure_opik()
    question = resolve_question(sys.argv)
    asset_dir = os.path.join(os.path.dirname(__file__), "assets")
    print("🔎 Scanning assets folder...")
    try:
        paystub_path, handbook_path = pick_documents(asset_dir)
    except RuntimeError as exc:
        print(f"❌ {exc}")
        raise
    print(f"✅ Found paystub: {os.path.basename(paystub_path)}")
    print(f"✅ Found handbook: {os.path.basename(handbook_path)}")
    extractor = load_extractor_from_env()
    policy = load_policy_scout_from_env(handbook_path=handbook_path)
    strategist = load_strategist_from_env()
    guardrail = load_guardrail_from_env()
    print("📄 Reading paystub...")
    paystub = extractor.extract_from_file(paystub_path)
    print("📘 Reading handbook and extracting match policy...")
    policy_answer = policy.answer(question)
    print("🧮 Computing leaked value...")
    strategist_output = strategist.synthesize(paystub, policy_answer)
    print("🛡️ Running safety checks...")
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


def format_currency(value: float | None) -> str:
    if value is None:
        return "N/A"
    return f"${value:,.2f}"


def format_percent(value: float | None) -> str:
    if value is None:
        return "N/A"
    return f"{value * 100:.2f}%"


def format_output(result: dict) -> str:
    recommendation = result.get("recommendation") or ""
    lines = [
        "🤖 Vesting Buddy Crew Assembled 🤖",
        "📌 Fiduciary Summary",
        recommendation.strip(),
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    result = run()
    print(format_output(result))
