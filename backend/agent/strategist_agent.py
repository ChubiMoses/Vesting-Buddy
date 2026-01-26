import json
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List

from agent.extractor_agent import (
    ExtractorConfig,
    GeminiClient,
    Tracer,
    get_env_value,
    get_tracer,
)


@dataclass
class StrategistConfig:
    prompt_prefix: str
    prompt_suffix: str


class StrategistAgent:
    def __init__(self, client: GeminiClient, tracer: Tracer, config: StrategistConfig) -> None:
        self.client = client
        self.tracer = tracer
        self.config = config

    def synthesize(self, paystub_data: Dict[str, Any], policy_answer: Dict[str, Any]) -> Dict[str, Any]:
        self.tracer.log_step("strategist_input_received", {"paystub_keys": sorted(paystub_data.keys())})
        policy = parse_policy_answer(policy_answer.get("answer"))
        self.tracer.log_step("strategist_policy_parsed", {"policy_keys": sorted(policy.keys())})
        metrics = compute_leaked_value(paystub_data, policy)
        self.tracer.log_step("strategist_metrics_computed", metrics)
        steps = build_action_plan(metrics, policy)
        reasoning = build_reasoning(metrics)
        output = {
            "leaked_value": metrics,
            "reasoning": reasoning,
            "action_plan": steps,
        }
        use_llm = os.getenv("STRATEGIST_USE_LLM", "").lower() in {"1", "true", "yes"}
        if use_llm:
            prompt = build_prompt(self.config.prompt_prefix, paystub_data, policy_answer, self.config.prompt_suffix)
            self.tracer.log_step("strategist_prompt_built", {"length": len(prompt)})
            response_text = self.client.generate_content(build_request(prompt))
            self.tracer.log_step("strategist_response_received", {"length": len(response_text)})
            output["recommendation"] = extract_text_response(response_text)
        else:
            output["recommendation"] = format_recommendation(output)
        return output


def build_request(prompt: str) -> Dict[str, Any]:
    return {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {"temperature": 0},
    }


def extract_text_response(response_text: str) -> str:
    payload = json.loads(response_text)
    candidates = payload.get("candidates") or []
    if not candidates:
        raise RuntimeError("Strategist response missing candidates")
    content = candidates[0].get("content") or {}
    parts = content.get("parts") or []
    if not parts:
        raise RuntimeError("Strategist response missing content parts")
    return parts[0].get("text") or ""


def build_prompt(prefix: str, paystub_data: Dict[str, Any], policy_answer: Dict[str, Any], suffix: str) -> str:
    payload = json.dumps(
        {"paystub": paystub_data, "policy": policy_answer},
        ensure_ascii=False,
    )
    return f"{prefix}\n\nData:\n{payload}\n\n{suffix}".strip()


def parse_policy_answer(answer_text: str | None) -> Dict[str, Any]:
    if not answer_text:
        return {}
    try:
        return json.loads(answer_text)
    except Exception:
        return {"raw": answer_text}


def to_float(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    try:
        cleaned = str(value).replace(",", "").replace("$", "").strip()
        return float(cleaned)
    except Exception:
        return 0.0


def to_percent(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value) / 100 if float(value) > 1 else float(value)
    text = str(value).strip().replace("%", "")
    return to_percent(to_float(text))


def parse_date(value: Any) -> datetime | None:
    if not value:
        return None
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(value), fmt)
        except Exception:
            continue
    return None


def estimate_periods_per_year(paystub: Dict[str, Any]) -> int:
    start = parse_date(paystub.get("pay_period_start"))
    end = parse_date(paystub.get("pay_period_end"))
    if not start or not end:
        return 12
    days = abs((end - start).days) + 1
    if days <= 8:
        return 52
    if days <= 16:
        return 26
    if days <= 23:
        return 24
    return 12


def compute_leaked_value(paystub: Dict[str, Any], policy: Dict[str, Any]) -> Dict[str, Any]:
    gross_pay = to_float(paystub.get("gross_pay") or paystub.get("base_pay"))
    pre_tax = to_float(paystub.get("pre_tax_401k"))
    roth = to_float(paystub.get("roth_401k"))
    current_401k = pre_tax + roth
    contribution_rate = (current_401k / gross_pay) if gross_pay else 0.0
    match_rate = to_percent(policy.get("match_percent"))
    match_up_to = to_percent(policy.get("match_up_to_percent"))
    gap_rate = max(match_up_to - contribution_rate, 0.0)
    periods = estimate_periods_per_year(paystub)
    annual_opportunity = gross_pay * gap_rate * match_rate * periods
    return {
        "gross_pay": gross_pay,
        "current_401k": current_401k,
        "current_401k_rate": round(contribution_rate, 4),
        "match_rate": round(match_rate, 4),
        "match_up_to": round(match_up_to, 4),
        "gap_rate": round(gap_rate, 4),
        "annual_opportunity_cost": round(annual_opportunity, 2),
        "pay_periods_per_year": periods,
        "policy_missing_match": policy.get("match_percent") in (None, "") or policy.get("match_up_to_percent") in (None, ""),
    }


def build_reasoning(metrics: Dict[str, Any]) -> List[str]:
    return [
        f"User gross per period: {metrics['gross_pay']}.",
        f"Current 401k rate: {metrics['current_401k_rate'] * 100:.2f}%. Match policy: {metrics['match_rate'] * 100:.0f}% up to {metrics['match_up_to'] * 100:.0f}%.",
        f"Gap rate: {metrics['gap_rate'] * 100:.2f}%. Annual opportunity cost: {metrics['annual_opportunity_cost']}.",
    ]


def build_action_plan(metrics: Dict[str, Any], policy: Dict[str, Any]) -> List[str]:
    actions = []
    if metrics["policy_missing_match"]:
        actions.append("Confirm the employer match formula in the benefits handbook.")
    elif metrics["gap_rate"] > 0:
        actions.append(
            f"Increase 401k contributions by {metrics['gap_rate'] * 100:.2f}% to reach the full match."
        )
    else:
        actions.append("Your 401k contributions already capture the full match.")
    vesting = policy.get("vesting_schedule")
    if vesting:
        actions.append(f"Confirm vesting schedule: {vesting}.")
    else:
        actions.append("Confirm the vesting schedule in the benefits handbook.")
    actions.append("If eligible, review HSA or IRA contributions to improve tax efficiency.")
    return actions


def format_recommendation(output: Dict[str, Any]) -> str:
    metrics = output["leaked_value"]
    steps = output["action_plan"]
    if metrics["policy_missing_match"]:
        catch = "Policy match data not found. Unable to quantify missed employer match."
        math = (
            f"Gross per period: {metrics['gross_pay']:.2f}. "
            f"Current 401k rate: {metrics['current_401k_rate'] * 100:.2f}%. "
            "Match policy: not found."
        )
    else:
        catch = (
            f"Estimated annual missed match: ${metrics['annual_opportunity_cost']:.2f} "
            f"based on a {metrics['gap_rate'] * 100:.2f}% contribution gap."
        )
        math = (
            f"Gross per period: ${metrics['gross_pay']:.2f}; "
            f"Current 401k rate: {metrics['current_401k_rate'] * 100:.2f}%; "
            f"Match policy: {metrics['match_rate'] * 100:.2f}% up to {metrics['match_up_to'] * 100:.2f}%; "
            f"Gap: {metrics['gap_rate'] * 100:.2f}%; "
            f"Annual opportunity cost: ${metrics['annual_opportunity_cost']:.2f}."
        )
    plan = "\n".join(f"- {step}" for step in steps[:3])
    return f"The Catch: {catch}\nThe Math: {math}\nAction Plan:\n{plan}"


def load_strategist_from_env() -> StrategistAgent:
    prompt_prefix = get_env_value("STRATEGIST_PROMPT_PREFIX", required=True)
    prompt_suffix = get_env_value("STRATEGIST_PROMPT_SUFFIX", default="")
    config = StrategistConfig(prompt_prefix=prompt_prefix, prompt_suffix=prompt_suffix)
    client = GeminiClient(load_gemini_config())
    return StrategistAgent(client, get_tracer(), config)


def load_gemini_config() -> ExtractorConfig:
    return ExtractorConfig(
        api_key=get_env_value("GEMINI_API_KEY", required=True),
        model=get_env_value("GEMINI_MODEL", required=True),
        timeout_seconds=int(get_env_value("GEMINI_TIMEOUT_SECONDS", required=True)),
        api_version=get_env_value("GEMINI_API_VERSION", required=True),
        base_url=get_env_value("GEMINI_BASE_URL", required=True),
    )
