import re
from dataclasses import dataclass
from typing import Dict, List

from agent.extractor_agent import Tracer, get_env_value, get_track_decorator, get_tracer
from constants.app_defaults import (
    DEFAULT_GUARDRAIL_BLOCKLIST,
    DEFAULT_GUARDRAIL_REPLACEMENT,
)


@dataclass
class GuardrailConfig:
    blocked_terms: List[str]
    replacement_text: str


class GuardrailAgent:
    def __init__(self, tracer: Tracer, config: GuardrailConfig) -> None:
        self.tracer = tracer
        self.config = config

    @get_track_decorator()
    def enforce(self, content: str) -> Dict[str, str]:
        violations = []

        if re.search(r"\b(stock|crypto|bitcoin|ethereum)\b", content, re.I):
            violations.append("Speculative assets mentioned")

        if re.search(r"\bleverage|options|futures\b", content, re.I):
            violations.append("High-risk financial instruments")
        self.tracer.log_step(
        "guardrail_evaluation",
        {"violations": violations},
        )

        if violations:
            return {
            "status": "blocked",
            "content": self.config.replacement_text,
            "violations": violations,
        }

        return {"status": "allowed", "content": content}

def load_guardrail_from_env() -> GuardrailAgent:
    raw = get_env_value("GUARDRAIL_BLOCKLIST", default=",".join(DEFAULT_GUARDRAIL_BLOCKLIST))
    blocked_terms = [term.strip() for term in re.split(r"[,\n]+", raw) if term.strip()]
    replacement_text = get_env_value("GUARDRAIL_REPLACEMENT", default=DEFAULT_GUARDRAIL_REPLACEMENT)
    config = GuardrailConfig(blocked_terms=blocked_terms, replacement_text=replacement_text)
    return GuardrailAgent(get_tracer(), config)
