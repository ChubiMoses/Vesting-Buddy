import config_loader
import os
import sys

from agent.extractor_agent import get_track_decorator, get_tracer, load_extractor_from_env
from agent.guardrail_agent import load_guardrail_from_env
from agent.policy_scout_agent import load_policy_scout_from_env
from agent.strategist_agent import load_strategist_from_env
from app import configure_opik
from constants.app_defaults import DEFAULT_POLICY_QUESTION
from utils.asset_picker import pick_documents


def resolve_question(args: list[str]) -> str:
    # Resolve question from CLI args or defaults
    if len(args) > 1 and args[1]:
        return args[1]
    env_question = os.getenv("POLICY_QUESTION")
    if env_question:
        return env_question
    return DEFAULT_POLICY_QUESTION


@get_track_decorator()
def run() -> dict:
    # Orchestrate the multi-agent workflow
    configure_opik()
    tracer = get_tracer()
    question = resolve_question(sys.argv)
    asset_dir = os.path.join(os.path.dirname(__file__), "assets")
    print("🔎 Scanning assets folder...")
    tracer.log_step("assets_scan_started", {"asset_dir": asset_dir})
    try:
        paystub_path, handbook_path = pick_documents(asset_dir)
    except RuntimeError as exc:
        tracer.log_step("assets_scan_failed", {"error": str(exc)})
        print(f"❌ {exc}")
        raise
    print(f"✅ Found paystub: {os.path.basename(paystub_path)}")
    print(f"✅ Found handbook: {os.path.basename(handbook_path)}")
    tracer.log_step(
        "assets_selected",
        {"paystub": os.path.basename(paystub_path), "handbook": os.path.basename(handbook_path)},
    )
    extractor = load_extractor_from_env()
    policy = load_policy_scout_from_env(handbook_path=handbook_path)
    strategist = load_strategist_from_env()
    guardrail = load_guardrail_from_env()
    print("📄 Reading paystub...")
    tracer.log_step("paystub_read_started", {"file": paystub_path})
    paystub = extractor.extract_from_file(paystub_path)
    print("📘 Reading handbook and extracting match policy...")
    tracer.log_step("policy_read_started", {"file": handbook_path})
    policy_answer = policy.answer(question)
    print("🧮 Computing leaked value...")
    tracer.log_step("strategist_started", {"question": question})
    strategist_output = strategist.synthesize(paystub, policy_answer)
    print("🛡️ Running safety checks...")
    tracer.log_step("guardrail_started", {})
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


@get_track_decorator()
def format_output(result: dict) -> str:
    # Render the final terminal summary
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
    try:
        import opik
        opik.flush_tracker()
    except Exception:
        pass
