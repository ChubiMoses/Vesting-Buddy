import os
import sys

from agent.extractor_agent import load_extractor_from_env
from agent.guardrail_agent import load_guardrail_from_env
from agent.policy_scout_agent import load_policy_scout_from_env
from agent.strategist_agent import load_strategist_from_env
from app import configure_opik, load_env


def resolve_file_path(args: list[str]) -> str:
    if len(args) > 2 and args[2]:
        return args[2]
    env_path = os.getenv("EXTRACT_FILE_PATH")
    if env_path:
        return env_path
    raise RuntimeError("Provide a file path argument or EXTRACT_FILE_PATH")


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
    file_path = resolve_file_path(sys.argv)
    extractor = load_extractor_from_env()
    policy = load_policy_scout_from_env()
    strategist = load_strategist_from_env()
    guardrail = load_guardrail_from_env()
    paystub = extractor.extract_from_file(file_path)
    policy_answer = policy.answer(question)
    strategist_output = strategist.synthesize(paystub, policy_answer)
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
    metrics = result.get("leaked_value") or {}
    steps = result.get("action_plan") or []
    lines = [
        "🤖 Vesting Buddy Crew Assembled 🤖",
        "🧮 Calculation Steps",
        f"1) Gross per period: {format_currency(metrics.get('gross_pay'))}",
        f"2) Current 401k rate: {format_percent(metrics.get('current_401k_rate'))}",
        f"3) Match policy: {format_percent(metrics.get('match_rate'))} up to {format_percent(metrics.get('match_up_to'))}",
        f"4) Gap rate: {format_percent(metrics.get('gap_rate'))}",
        f"5) Annual opportunity cost: {format_currency(metrics.get('annual_opportunity_cost'))}",
        "",
        "🎯 3-Step Action Plan",
    ]
    for index, step in enumerate(steps[:3], start=1):
        lines.append(f"{index}. {step}")
    return "\n".join(lines)


if __name__ == "__main__":
    result = run()
    print(format_output(result))
