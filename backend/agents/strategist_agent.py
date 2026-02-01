import json
import os
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List

from agents.extractor_agent import (
    ExtractorConfig,
    GeminiClient,
    Tracer,
    get_env_value,
    get_track_decorator,
    get_tracer,
)
from constants.app_defaults import (
    DEFAULT_STRATEGIST_PROMPT_PREFIX,
    DEFAULT_STRATEGIST_PROMPT_SUFFIX,
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

    def _preview(self, text: str, max_len: int = 400) -> str:
        if not text:
            return ""
        return text[:max_len] + ("…" if len(text) > max_len else "")

    @get_track_decorator()
    def synthesize(self, paystub_data: Dict[str, Any], policy_answer: Dict[str, Any], rsu_data: Dict[str, Any] | None = None) -> Dict[str, Any]:
        self.tracer.log_step("strategist_input_received", {"paystub_keys": sorted(paystub_data.keys())})
        policy = parse_policy_answer(policy_answer.get("answer"))
        self.tracer.log_step("strategist_policy_parsed", {"policy_keys": sorted(policy.keys())})
        metrics = compute_leaked_value(paystub_data, policy)
        metrics["employee_name"] = paystub_data.get("employee_name", "Employee")
        
        # Paystub Verification
        paystub_verification = verify_paystub_math(paystub_data)
        metrics["paystub_verification"] = paystub_verification
        
        # RSU Analysis
        rsu_analysis = analyze_rsu(rsu_data) if rsu_data else None

        self.tracer.log_step("strategist_metrics_computed", metrics)
        steps = build_action_plan(metrics, policy)
        reasoning = build_reasoning(metrics)
        output = {
            "leaked_value": metrics,
            "reasoning": reasoning,
            "action_plan": steps,
            "policy_conflicts": policy_answer.get("conflicts"),
            "rsu_analysis": rsu_analysis,
        }
        use_llm = os.getenv("STRATEGIST_USE_LLM", "").lower() in {"1", "true", "yes"}
        if use_llm:
            prompt = build_prompt(self.config.prompt_prefix, paystub_data, policy_answer, self.config.prompt_suffix)
            if rsu_data:
                prompt += f"\n\nRSU Data:\n{json.dumps(rsu_data, ensure_ascii=False)}"
            self.tracer.log_step("strategist_prompt_built", {"length": len(prompt)})
            self.tracer.log_step("strategist_prompt_preview", {"preview": self._preview(prompt), "full_prompt": prompt})
            response_text = self.client.generate_content(build_request(prompt))
            self.tracer.log_step("strategist_response_received", {"length": len(response_text), "full_response": response_text})
            output["recommendation"] = extract_text_response(response_text)
            self.tracer.log_step(
                "strategist_recommendation_preview",
                {"preview": self._preview(output["recommendation"]), "full_recommendation": output["recommendation"]},
            )
        else:
            output["recommendation"] = format_recommendation(output)
            self.tracer.log_step(
                "strategist_recommendation_preview",
                {"preview": self._preview(output["recommendation"]), "full_recommendation": output["recommendation"]},
            )
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
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d", "%B %d, %Y", "%b %d, %Y"):
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
        "tiers": tiers,
    }


def build_reasoning(metrics: Dict[str, Any]) -> List[Dict[str, str]]:
    return [
        {
            "assumption": "Pay frequency inferred from pay period dates",
            "calculation": f"{metrics['pay_periods_per_year']} pay periods/year",
            "result": "Used to annualize opportunity cost",
        },
        {
            "assumption": "Employer match formula",
            "calculation": f"{metrics['match_rate']*100:.2f}% up to {metrics['match_up_to']*100:.2f}%",
            "result": f"Contribution gap {metrics['gap_rate']*100:.2f}%",
        },
        {
            "assumption": "Annualized missed value",
            "calculation": "gross × gap × match × periods",
            "result": f"${metrics['annual_opportunity_cost']:.2f}",
        },
    ]



def build_action_plan(metrics: Dict[str, Any], policy: Dict[str, Any]) -> List[Dict[str, Any]]:
    actions = []

    if metrics["policy_missing_match"]:
        actions.append({
            "action": "Confirm employer match policy",
            "impact": "high",
            "effort": "medium",
        })
    elif metrics["gap_rate"] > 0:
        actions.append({
            "action": f"Increase 401k contribution by {metrics['gap_rate']*100:.2f}%",
            "impact": "high",
            "effort": "low",
        })

    actions.append({
        "action": "Confirm vesting schedule",
        "impact": "medium",
        "effort": "low",
    })

    actions.append({
        "action": "Review HSA eligibility for tax savings",
        "impact": "medium",
        "effort": "medium",
    })

    return sorted(actions, key=lambda x: (x["impact"], x["effort"]))


def format_recommendation(output: Dict[str, Any]) -> str:
    metrics = output["leaked_value"]
    steps = output["action_plan"]
    conflicts = output.get("policy_conflicts")
    rsu_analysis = output.get("rsu_analysis")
    paystub_verification = metrics.get("paystub_verification")

    # Extract first name
    full_name = metrics.get("employee_name", "User")
    name = full_name.split()[0] if full_name else "User"

    sections = []

    # Calculate Total Value Identified
    match_value = metrics.get('annual_opportunity_cost', 0.0)
    rsu_value = 0.0
    if rsu_analysis and rsu_analysis.get("days_remaining", 0) <= 90:
        rsu_value = rsu_analysis.get('value_estimate', 0.0)
    
    total_saved = match_value + rsu_value
    
    if total_saved > 0:
        sections.append(f"💰 Amount Saved: ${total_saved:,.2f} (Total value identified)")

    # 1. RSU Section (Urgent)
    if rsu_analysis and rsu_analysis.get("days_remaining", 0) <= 90:
        vest_date = rsu_analysis["next_vesting_date"]
        days = rsu_analysis["days_remaining"]
        shares = rsu_analysis["shares"]
        # Assuming a placeholder value or if we had a price
        value_estimate = rsu_analysis.get('value_estimate', 0.0)
        stock_price = rsu_analysis.get('stock_price', 0.0)
        value_msg = f"${value_estimate:,.2f}" if value_estimate > 0 else "Y$"
        price_note = f" (estimated at ${stock_price:.2f}/share)" if stock_price > 0 else ""
        
        rsu_msg = (
            f"You have a {shares:.0f}-share vesting cliff approaching on {vest_date}. "
            f"By remaining with the company for {days} additional days, you will secure equity valued at approximately {value_msg}{price_note}."
        )
        sections.append(f"🚨 Urgent Strategic Alert:\n{rsu_msg}")

    # 2. Paystub Verification
    if paystub_verification:
        status = paystub_verification["status"]
        if status == "incorrect":
            sections.append(f"⚠️ Payroll Integrity Check: {paystub_verification['message']}")
        elif status == "correct":
            sections.append("✅ Payroll Integrity Check: Verified. Net pay accurately reflects gross income less taxes and deductions.")

    # 3. Match Verdict
    if metrics["policy_missing_match"]:
        verdict = f"{name}, we could not verify your employer match policy in the provided documents. To ensure you are not leaving capital on the table, we must locate this information."
        if conflicts:
            verdict += " Note: Conflicting policy data was detected."
        math = (
            f"Gross per period: ${metrics['gross_pay']:.2f}\n"
            f"Current 401k rate: {metrics['current_401k_rate'] * 100:.2f}%\n"
            "Match policy: Not found in documents"
        )
    else:
        monthly_gain = metrics['annual_opportunity_cost'] / 12
        gap_percent = metrics['gap_rate'] * 100
        current_percent = metrics['current_401k_rate'] * 100
        target_percent = current_percent + gap_percent

        # Calculate ROI
        annual_cost = metrics['gross_pay'] * metrics['gap_rate'] * metrics['pay_periods_per_year']
        roi = (metrics['annual_opportunity_cost'] / annual_cost * 100) if annual_cost > 0 else 0

        if metrics['gap_rate'] > 0:
            verdict = (
                f"{name}, you are currently contributing {current_percent:.1f}%. "
                f"By increasing your contribution to {target_percent:.1f}%, you will unlock an additional "
                f"${monthly_gain:.0f}/month in employer matching. "
                f"This represents an immediate {roi:.0f}% return on your investment."
            )
        else:
            verdict = (
                f"{name}, excellent work. You are contributing {current_percent:.1f}%, which captures the full employer match. "
                "You are maximizing this risk-free return on capital."
            )

        if conflicts:
            verdict += " Note: Conflicting policies detected."

        if metrics.get("tiers_present"):
            tier_lines = []
            for i, (rate, limit) in enumerate(metrics['tiers']):
                prefix = "First" if i == 0 else "Next"
                tier_lines.append(f"  - {rate*100:.0f}% match on {prefix} {limit*100:.1f}% of salary")
            tier_str = "\n".join(tier_lines)

            math = (
                f"Gross per period: ${metrics['gross_pay']:.2f}\n"
                f"Current 401k rate: {metrics['current_401k_rate'] * 100:.2f}%\n"
                f"Match Structure:\n{tier_str}\n"
                f"Gap to max match: {metrics['gap_rate'] * 100:.2f}%\n"
                f"Annual opportunity cost: ${metrics['annual_opportunity_cost']:.2f}"
            )
        else:
            math = (
                f"Gross per period: ${metrics['gross_pay']:.2f}\n"
                f"Current 401k rate: {metrics['current_401k_rate'] * 100:.2f}%\n"
                f"Match policy: {metrics['match_rate'] * 100:.0f}% match up to {metrics['match_up_to'] * 100:.1f}% of salary\n"
                f"Gap: {metrics['gap_rate'] * 100:.2f}%\n"
                f"Annual opportunity cost: ${metrics['annual_opportunity_cost']:.2f}"
            )

    sections.append(f"💼 Executive Summary: {verdict}")
    sections.append(f"📊 Financial Impact Analysis:\n{math}")

    plan = "\n".join(f"- {step['action']}" for step in steps[:3])
    sections.append(f"🚀 Strategic Roadmap:\n{plan}")
    
    return "\n\n".join(sections)


def verify_paystub_math(paystub: Dict[str, Any]) -> Dict[str, Any]:
    gross = to_float(paystub.get("gross_pay") or paystub.get("base_pay"))
    net = to_float(paystub.get("net_pay"))
    taxes = to_float(paystub.get("total_taxes"))
    deductions = to_float(paystub.get("total_deductions"))
    
    if taxes == 0 and deductions == 0:
        return {"status": "unknown", "message": "Missing tax/deduction data for verification"}
        
    calculated_net = gross - taxes - deductions
    diff = abs(calculated_net - net)
    
    # Allow small rounding differences
    if diff < 1.0:
        return {"status": "correct", "message": "Calculations verified"}
    else:
        # Check if Taxes are already included in Total Deductions
        # Scenario: Deductions = Taxes + Other Deductions
        # If Deductions ~= Taxes + (Gross - Net - Taxes) ... wait, simpler:
        # If Gross - Deductions = Net, then Taxes are likely inside Deductions
        alt_net = gross - deductions
        alt_diff = abs(alt_net - net)
        
        if alt_diff < 1.0:
            return {
                "status": "correct",
                "message": "Calculations verified (Note: Total Deductions appears to include Taxes)"
            }
            
        return {
            "status": "incorrect", 
            "message": f"Gross (${gross:.2f}) - Taxes (${taxes:.2f}) - Deductions (${deductions:.2f}) = ${calculated_net:.2f}, but Net is ${net:.2f}."
        }


def analyze_rsu(rsu_data: Dict[str, Any]) -> Dict[str, Any] | None:
    if not rsu_data:
        return None
    
    date_str = rsu_data.get("next_vesting_date")
    shares = to_float(rsu_data.get("next_vesting_shares"))
    
    if not date_str or not shares:
        return None
        
    vest_date = parse_date(date_str)
    if not vest_date:
        return None
        
    now = datetime.now().date()
    days = (vest_date.date() - now).days
    
    # Attempt to get stock price
    employer = rsu_data.get("employer_name")
    price = to_float(rsu_data.get("current_stock_price"))
    if price == 0:
        price = get_stock_price(employer)
        
    value_estimate = shares * price

    return {
        "next_vesting_date": vest_date.strftime("%B %d, %Y"),
        "days_remaining": days,
        "shares": shares,
        "stock_price": price,
        "value_estimate": value_estimate
    }


def get_stock_price(company_name: str | None = None) -> float:
    # In a real app, this would query a stock API.
    # For this demo/MVP, we mock "Apex Tech Solutions" or provide a default.
    if company_name and "apex" in company_name.lower():
        return 150.00
    # No assumption if unknown
    return 0.0


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
    prompt_prefix = get_env_value("STRATEGIST_PROMPT_PREFIX", default=DEFAULT_STRATEGIST_PROMPT_PREFIX)
    prompt_suffix = get_env_value("STRATEGIST_PROMPT_SUFFIX", default=DEFAULT_STRATEGIST_PROMPT_SUFFIX)
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
