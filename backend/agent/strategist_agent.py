import json
import os
import re
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
            "policy_conflicts": policy_answer.get("conflicts"),
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
        return {
            "raw": answer_text,
            "match_percent": None,
            "match_up_to_percent": None,
            "vesting_schedule": None,
        }


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
    tiers = []
    tier_metadata = None
    if (match_rate == 0 or match_up_to == 0) and policy.get("raw"):
        extracted = extract_match_from_raw(policy.get("raw") or "")
        match_rate = match_rate or extracted.get("match_percent", 0.0)
        match_up_to = match_up_to or extracted.get("match_up_to_percent", 0.0)
        tiers = extracted.get("tiers", [])
        tier_metadata = extracted
    tiers_present = bool(tiers)
    if tiers_present:
        max_match_percent = tier_metadata.get("max_match_percent", 0.0)
        max_contribution_percent = tier_metadata.get("max_contribution_percent", 0.0)
        current_match_percent = compute_match_from_tiers(contribution_rate, tiers)
        gap_rate = max(max_contribution_percent - contribution_rate, 0.0)
        annual_opportunity = gross_pay * max(max_match_percent - current_match_percent, 0.0) * periods_per_year(paystub=paystub)
        match_rate = max_match_percent / max_contribution_percent if max_contribution_percent else 0.0
        match_up_to = max_contribution_percent
        annual_opportunity_cost = round(annual_opportunity, 2)
    else:
        gap_rate = max(match_up_to - contribution_rate, 0.0)
        annual_opportunity_cost = round(gross_pay * gap_rate * match_rate * estimate_periods_per_year(paystub), 2)
    periods = estimate_periods_per_year(paystub)
    return {
        "gross_pay": gross_pay,
        "current_401k": current_401k,
        "current_401k_rate": round(contribution_rate, 4),
        "match_rate": round(match_rate, 4),
        "match_up_to": round(match_up_to, 4),
        "gap_rate": round(gap_rate, 4),
        "annual_opportunity_cost": annual_opportunity_cost,
        "pay_periods_per_year": periods,
        "policy_missing_match": (match_rate == 0 or match_up_to == 0) and not tiers_present,
        "tiers_present": tiers_present,
    }


def build_reasoning(metrics: Dict[str, Any]) -> List[str]:
    if metrics.get("tiers_present"):
        return [
            f"User gross per period: {metrics['gross_pay']}.",
            f"Current 401k rate: {metrics['current_401k_rate'] * 100:.2f}%. Tiered match detected up to {metrics['match_up_to'] * 100:.2f}%.",
            f"Gap rate: {metrics['gap_rate'] * 100:.2f}%. Annual opportunity cost: {metrics['annual_opportunity_cost']}.",
        ]
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
    conflicts = output.get("policy_conflicts")
    if metrics["policy_missing_match"]:
        catch = "Policy match data not found. Unable to quantify missed employer match."
        if conflicts:
            catch = f"{catch} Conflicting policies detected."
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
        if conflicts:
            catch = f"{catch} Conflicting policies detected."
        if metrics.get("tiers_present"):
            math = (
                f"Gross per period: ${metrics['gross_pay']:.2f}; "
                f"Current 401k rate: {metrics['current_401k_rate'] * 100:.2f}%; "
                f"Tiered match up to {metrics['match_up_to'] * 100:.2f}%; "
                f"Gap: {metrics['gap_rate'] * 100:.2f}%; "
                f"Annual opportunity cost: ${metrics['annual_opportunity_cost']:.2f}."
            )
        else:
            math = (
                f"Gross per period: ${metrics['gross_pay']:.2f}; "
                f"Current 401k rate: {metrics['current_401k_rate'] * 100:.2f}%; "
                f"Match policy: {metrics['match_rate'] * 100:.2f}% up to {metrics['match_up_to'] * 100:.2f}%; "
                f"Gap: {metrics['gap_rate'] * 100:.2f}%; "
                f"Annual opportunity cost: ${metrics['annual_opportunity_cost']:.2f}."
            )
    plan = "\n".join(f"- {step}" for step in steps[:3])
    return f"The Catch: {catch}\nThe Math: {math}\nAction Plan:\n{plan}"


def extract_match_from_raw(raw_text: str) -> Dict[str, float]:
    text = raw_text.lower()
    tiers = []
    for rate, limit in re.findall(r"match\s+(\d+(?:\.\d+)?)\s*%\s+of\s+the\s+first\s+(\d+(?:\.\d+)?)\s*%", text):
        tiers.append((to_percent(rate), to_percent(limit)))
    for rate, limit in re.findall(r"match\s+(\d+(?:\.\d+)?)\s*%\s+of\s+the\s+next\s+(\d+(?:\.\d+)?)\s*%", text):
        tiers.append((to_percent(rate), to_percent(limit)))
    cap_match = re.search(r"capped at\s+(\d+(?:\.\d+)?)\s*%", text)
    max_match_percent = to_percent(cap_match.group(1)) if cap_match else 0.0
    max_contribution_percent = sum(limit for _, limit in tiers)
    if tiers and max_match_percent == 0.0:
        max_match_percent = sum(rate * limit for rate, limit in tiers)
    return {
        "match_percent": 1.0 if max_contribution_percent else 0.0,
        "match_up_to_percent": max_contribution_percent,
        "tiers": tiers,
        "max_match_percent": max_match_percent,
        "max_contribution_percent": max_contribution_percent,
    }


def compute_match_from_tiers(contribution_rate: float, tiers: List[tuple[float, float]]) -> float:
    remaining = max(contribution_rate, 0.0)
    match_percent = 0.0
    for rate, limit in tiers:
        if remaining <= 0:
            break
        applied = min(remaining, limit)
        match_percent += applied * rate
        remaining -= applied
    return match_percent


def periods_per_year(paystub: Dict[str, Any]) -> int:
    return estimate_periods_per_year(paystub)


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
