import base64
import json
import mimetypes
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Iterable, Tuple

try:
    from opik import track as opik_track
except Exception:
    opik_track = None


DEFAULT_MODEL = "gemini-1.5-flash"

SCHEMA_FIELDS: Tuple[Tuple[str, str], ...] = (
    ("employee_name", "string"),
    ("employer_name", "string"),
    ("pay_period_start", "string"),
    ("pay_period_end", "string"),
    ("pay_date", "string"),
    ("base_pay", "number"),
    ("gross_pay", "number"),
    ("net_pay", "number"),
    ("pre_tax_401k", "number"),
    ("roth_401k", "number"),
    ("employer_match_limit", "number"),
    ("ytd_gross_pay", "number"),
    ("ytd_pre_tax_401k", "number"),
    ("ytd_roth_401k", "number"),
    ("ytd_employer_match", "number"),
    ("currency", "string"),
    ("notes", "string"),
)


@dataclass
class ExtractorConfig:
    api_key: str
    model: str = DEFAULT_MODEL
    timeout_seconds: int = 60


# Return Opik track decorator or a no-op decorator
def get_track_decorator():
    if opik_track is None:
        def decorator(func):
            return func
        return decorator
    return opik_track()


class Tracer:
    # Log a step for tracing
    def log_step(self, name: str, payload: Dict[str, Any]) -> None:
        _ = (name, payload)
        return None


class OpikTracer(Tracer):
    # Log a step via Opik tracking
    @get_track_decorator()
    def log_step(self, name: str, payload: Dict[str, Any]) -> None:
        _ = (name, payload)
        return None


class NoopTracer(Tracer):
    # Log a step without side effects
    def log_step(self, name: str, payload: Dict[str, Any]) -> None:
        _ = (name, payload)
        return None


# Choose Opik or no-op tracer
def get_tracer() -> Tracer:
    if opik_track is None:
        return NoopTracer()
    return OpikTracer()


class GeminiClient:
    def __init__(self, config: ExtractorConfig) -> None:
        self.config = config

    # Send the request to Gemini
    def generate_content(self, payload: Dict[str, Any]) -> str:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.config.model}:generateContent?key={self.config.api_key}"
        )
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.config.timeout_seconds) as resp:
                return resp.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Extractor request failed: {exc.code} {body}") from exc


class ExtractorAgent:
    def __init__(self, client: GeminiClient, tracer: Tracer) -> None:
        self.client = client
        self.tracer = tracer

    # Run the extraction pipeline for a file
    @get_track_decorator()
    def extract_from_file(self, file_path: str) -> Dict[str, Any]:
        self.tracer.log_step("guess_mime_type", {"file_path": file_path})
        mime_type = guess_mime_type(file_path)
        self.tracer.log_step("mime_type_resolved", {"mime_type": mime_type})
        data = read_file_base64(file_path)
        self.tracer.log_step("file_loaded", {"base64_length": len(data)})
        request_body = build_request(mime_type, data)
        self.tracer.log_step("request_built", {"schema_fields": len(SCHEMA_FIELDS)})
        response_text = self.client.generate_content(request_body)
        self.tracer.log_step("response_received", {"response_length": len(response_text)})
        result = parse_response(response_text)
        self.tracer.log_step("response_parsed", {"result_keys": sorted(result.keys())})
        return result


# Build the Gemini request payload
def build_request(mime_type: str, base64_data: str) -> Dict[str, Any]:
    prompt = {"text": build_prompt_text(SCHEMA_FIELDS)}
    return {
        "contents": [
            {
                "role": "user",
                "parts": [
                    prompt,
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64_data,
                        }
                    },
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0,
            "responseMimeType": "application/json",
        },
    }


# Build the extraction prompt text
def build_prompt_text(schema_fields: Iterable[Tuple[str, str]]) -> str:
    schema_items = ", ".join(
        f"\"{name}\": {field_type}|null" for name, field_type in schema_fields
    )
    return (
        "You are an extraction agent. Convert the document into JSON only, "
        "matching this schema and using null when unavailable: "
        "{" + schema_items + "}"
    )


# Parse Gemini response into JSON
def parse_response(response_text: str) -> Dict[str, Any]:
    payload = json.loads(response_text)
    candidates = payload.get("candidates") or []
    if not candidates:
        raise RuntimeError("Extractor response missing candidates")
    content = candidates[0].get("content") or {}
    parts = content.get("parts") or []
    if not parts:
        raise RuntimeError("Extractor response missing content parts")
    text = parts[0].get("text") or ""
    extracted = extract_json(text)
    return json.loads(extracted)


# Extract JSON object from text response
def extract_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError("Extractor response did not contain JSON")
    return text[start : end + 1]


# Resolve a file's MIME type
def guess_mime_type(file_path: str) -> str:
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or "application/octet-stream"


# Read a file and return base64 string
def read_file_base64(file_path: str) -> str:
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


# Build an extractor agent using env configuration
def load_extractor_from_env() -> ExtractorAgent:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is required")
    model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
    timeout = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "60"))
    config = ExtractorConfig(api_key=api_key, model=model, timeout_seconds=timeout)
    return ExtractorAgent(GeminiClient(config), get_tracer())
