import json
import re
from dataclasses import dataclass
from typing import Dict, List, Any

from agents.extractor_agent import (
    Tracer, 
    get_env_value, 
    get_track_decorator, 
    get_tracer,
    GeminiClient,
    ExtractorConfig,
    extract_json
)
from constants.app_defaults import (
    DEFAULT_GUARDRAIL_BLOCKLIST,
    DEFAULT_GUARDRAIL_REPLACEMENT,
    DEFAULT_GUARDRAIL_PROMPT
)


@dataclass
class GuardrailConfig:
    blocked_terms: List[str]
    replacement_text: str
    prompt_template: str = DEFAULT_GUARDRAIL_PROMPT


class GuardrailAgent:
    def __init__(self, client: GeminiClient, tracer: Tracer, config: GuardrailConfig) -> None:
        self.client = client
        self.tracer = tracer
        self.config = config

    @get_track_decorator()
    def enforce(self, content: str) -> Dict[str, Any]:
        violations = []
        
        # 1. Regex check (Fast pass)
        if self.config.blocked_terms:
             pattern = r"\b(" + "|".join(map(re.escape, self.config.blocked_terms)) + r")\b"
             found = re.findall(pattern, content, re.I)
             if found:
                 violations.append(f"Blocked terms detected: {', '.join(set(found))}")

        # 2. LLM Check (Smarter pass)
        # Only run LLM if regex didn't already block it? 
        # Or always run to find "topics" that regex misses?
        # The prompt implies checking for "topics" too.
        # If I want to optimize the LLM prompt, I must run it.
        # But for efficiency, if it's already blocked by regex, maybe skip LLM?
        # However, for the purpose of "optimizing the agent", let's run it 
        # or at least make it capable.
        # If I want to catch "crypto speculation" without the word "bitcoin", I need LLM.
        
        try:
            # Simple formatting
            prompt = self.config.prompt_template.format(
                blocked_terms=", ".join(self.config.blocked_terms),
                blocked_topics="financial advice, stock picking, crypto speculation"
            )
            # Add content to check
            prompt += f"\n\nContent:\n{content}"
            
            request_body = {
                "contents": [{
                    "role": "user",
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {"temperature": 0}
            }
            
            self.tracer.log_step("guardrail_llm_request", {"prompt_len": len(prompt)})
            response_text = self.client.generate_content(request_body)
            self.tracer.log_step("guardrail_llm_response", {"response": response_text})
            
            # Parse response
            try:
                llm_result = json.loads(extract_json(response_text))
                if llm_result.get("status") == "blocked":
                    violations.extend(llm_result.get("violations", []))
            except Exception as e:
                self.tracer.log_step("guardrail_llm_parse_error", {"error": str(e)})
                
        except Exception as e:
            self.tracer.log_step("guardrail_llm_error", {"error": str(e)})

        self.tracer.log_step(
            "guardrail_evaluation",
            {"violations": violations},
        )

        if violations:
            return {
                "status": "blocked",
                "content": self.config.replacement_text,
                "violations": list(set(violations)),
            }

        return {"status": "allowed", "content": content}

def load_guardrail_from_env() -> GuardrailAgent:
    raw = get_env_value("GUARDRAIL_BLOCKLIST", default=",".join(DEFAULT_GUARDRAIL_BLOCKLIST))
    blocked_terms = [term.strip() for term in re.split(r"[,\n]+", raw) if term.strip()]
    replacement_text = get_env_value("GUARDRAIL_REPLACEMENT", default=DEFAULT_GUARDRAIL_REPLACEMENT)
    
    # Load Gemini Config
    # We reuse ExtractorConfig and environment variables
    api_key = get_env_value("GEMINI_API_KEY", required=True)
    model = get_env_value("GEMINI_MODEL", required=True)
    timeout = int(get_env_value("GEMINI_TIMEOUT_SECONDS", required=True))
    api_version = get_env_value("GEMINI_API_VERSION", required=True)
    base_url = get_env_value("GEMINI_BASE_URL", required=True)
    
    gemini_config = ExtractorConfig(
        api_key=api_key,
        model=model,
        timeout_seconds=timeout,
        api_version=api_version,
        base_url=base_url,
    )
    
    config = GuardrailConfig(blocked_terms=blocked_terms, replacement_text=replacement_text)
    return GuardrailAgent(GeminiClient(gemini_config), get_tracer(), config)
