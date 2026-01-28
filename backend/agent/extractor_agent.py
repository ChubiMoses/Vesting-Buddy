import base64
import json
import mimetypes
import os
import ssl
import urllib.error
import urllib.request
import warnings
from dataclasses import dataclass
from typing import Any, Dict, Iterable, Tuple

try:
    warnings.filterwarnings(
        "ignore",
        message="Core Pydantic V1 functionality isn't compatible with Python 3.14 or greater.",
        module="opik\\.rest_api\\.core\\.pydantic_utilities",
    )
    from opik import track as opik_track
except Exception:
    opik_track = None

from constants.app_defaults import (
    DEFAULT_EXTRACT_PROMPT_PREFIX,
    DEFAULT_EXTRACT_PROMPT_SUFFIX,
    DEFAULT_SCHEMA_FIELDS,
)


@dataclass
class ExtractorConfig:
    api_key: str
    model: str
    timeout_seconds: int
    api_version: str
    base_url: str


# Return Opik track decorator or a no-op decorator
def get_track_decorator():
    if os.getenv("OPIK_TRACK_DISABLE", "").lower() in {"1", "true", "yes"}:
        def decorator(func):
            return func
        return decorator
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


def build_ssl_context() -> ssl.SSLContext | None:
    cafile = os.getenv("SSL_CERT_FILE") or os.getenv("REQUESTS_CA_BUNDLE")
    try:
        import certifi

        cafile = certifi.where()
    except Exception:
        pass
    if cafile:
        return ssl.create_default_context(cafile=cafile)
    return None


class GeminiClient:
    def __init__(self, config: ExtractorConfig) -> None:
        self.config = config

    # Send the request to Gemini
    def generate_content(self, payload: Dict[str, Any]) -> str:
        context = build_ssl_context()
        try:
            return self._send_request(
                self._build_url(self.config.api_version, self.config.model),
                payload,
                context,
            )
        except urllib.error.HTTPError as exc:
            if exc.code == 404 and self.config.api_version == "v1beta":
                try:
                    return self._send_request(
                        self._build_url("v1", self.config.model),
                        payload,
                        context,
                    )
                except urllib.error.HTTPError as fallback_exc:
                    return self._attempt_with_fallback_model(
                        "v1", payload, context, fallback_exc
                    )
            if exc.code == 404:
                return self._attempt_with_fallback_model(
                    self.config.api_version, payload, context, exc
                )
            body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Extractor request failed: {exc.code} {body}") from exc

    def _build_url(self, version: str, model: str) -> str:
        return (
            f"{self.config.base_url}/{version}/models/"
            f"{model}:generateContent?key={self.config.api_key}"
        )

    def _send_request(
        self,
        url: str,
        payload: Dict[str, Any],
        context: ssl.SSLContext | None,
    ) -> str:
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        if context is None:
            response = urllib.request.urlopen(
                request, timeout=self.config.timeout_seconds
            )
        else:
            response = urllib.request.urlopen(
                request, timeout=self.config.timeout_seconds, context=context
            )
        with response as resp:
            return resp.read().decode("utf-8")

    def _attempt_with_fallback_model(
        self,
        version: str,
        payload: Dict[str, Any],
        context: ssl.SSLContext | None,
        original_exc: urllib.error.HTTPError,
    ) -> str:
        fallback_model = self._select_fallback_model(version, context)
        if not fallback_model:
            body = original_exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Extractor request failed: {original_exc.code} {body}"
            ) from original_exc
        try:
            return self._send_request(
                self._build_url(version, fallback_model),
                payload,
                context,
            )
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Extractor request failed: {exc.code} {body}") from exc

    def _select_fallback_model(
        self, version: str, context: ssl.SSLContext | None
    ) -> str | None:
        models = self._list_models(version, context)
        for model in models:
            methods = (
                model.get("supportedGenerationMethods")
                or model.get("supportedMethods")
                or []
            )
            if "generateContent" in methods:
                name = model.get("name") or ""
                return name.split("/", 1)[-1] if "/" in name else name
        return None

    def _list_models(
        self, version: str, context: ssl.SSLContext | None
    ) -> list[Dict[str, Any]]:
        url = (
            f"{self.config.base_url}/{version}/models"
            f"?key={self.config.api_key}"
        )
        request = urllib.request.Request(url, method="GET")
        if context is None:
            response = urllib.request.urlopen(
                request, timeout=self.config.timeout_seconds
            )
        else:
            response = urllib.request.urlopen(
                request, timeout=self.config.timeout_seconds, context=context
            )
        with response as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        return payload.get("models") or []


class ExtractorAgent:
    def __init__(self, client: GeminiClient, tracer: Tracer) -> None:
        self.client = client
        self.tracer = tracer

    def _preview(self, text: str, max_len: int = 400) -> str:
        if not text:
            return ""
        return text[:max_len] + ("…" if len(text) > max_len else "")

    # Run the extraction pipeline for a file
    @get_track_decorator()
    def extract_from_file(self, file_path: str, schema_fields: Iterable[Tuple[str, str]] | None = None) -> Dict[str, Any]:
        # Check for specific mocks based on filename
        fname = os.path.basename(file_path).lower()
        if "paystub" in fname:
            mock_payload = os.getenv("EXTRACT_MOCK_PAYSTUB")
        elif any(k in fname for k in ("rsu", "stock", "grant", "equity")):
            mock_payload = os.getenv("EXTRACT_MOCK_RSU")
        else:
            mock_payload = None
            
        # Fallback to generic mock
        if not mock_payload:
            mock_payload = os.getenv("EXTRACT_MOCK_JSON")
            
        if mock_payload:
            self.tracer.log_step("extract_mock_used", {"file_path": file_path})
            return json.loads(mock_payload)
            
        self.tracer.log_step("guess_mime_type", {"file_path": file_path})
        mime_type = guess_mime_type(file_path)
        self.tracer.log_step("mime_type_resolved", {"mime_type": mime_type})
        data = read_file_base64(file_path)
        approx_bytes = (len(data) * 3) // 4
        self.tracer.log_step(
            "file_loaded",
            {"base64_length": len(data), "approx_size_bytes": approx_bytes, "mime_type": mime_type},
        )
        fields = schema_fields or get_schema_fields()
        prompt_text = build_prompt_text(fields)
        self.tracer.log_step(
            "extract_prompt_preview",
            {"length": len(prompt_text), "preview": self._preview(prompt_text)},
        )
        request_body = build_request(mime_type, data, fields)
        self.tracer.log_step(
            "request_built", {"schema_fields": len(fields)}
        )
        response_text = self.client.generate_content(request_body)
        self.tracer.log_step(
            "response_received",
            {"response_length": len(response_text), "preview": self._preview(response_text)},
        )
        result = parse_response(response_text)
        self.tracer.log_step(
            "response_parsed",
            {"result_keys": sorted(result.keys()), "result_preview": self._preview(json.dumps(result))},
        )
        return result


# Build the Gemini request payload
def build_request(mime_type: str, base64_data: str, schema_fields: Iterable[Tuple[str, str]] | None = None) -> Dict[str, Any]:
    fields = schema_fields or get_schema_fields()
    prompt = {"text": build_prompt_text(fields)}
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
        "generationConfig": {"temperature": 0},
    }


# Build the extraction prompt text
def build_prompt_text(schema_fields: Iterable[Tuple[str, str]]) -> str:
    schema_items = ", ".join(
        f"\"{name}\": {field_type}|null" for name, field_type in schema_fields
    )
    prompt_prefix = get_env_value("EXTRACT_PROMPT_PREFIX", default=DEFAULT_EXTRACT_PROMPT_PREFIX)
    prompt_suffix = get_env_value("EXTRACT_PROMPT_SUFFIX", default=DEFAULT_EXTRACT_PROMPT_SUFFIX)
    return f"{prompt_prefix} " + "{" + schema_items + "}" + prompt_suffix


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
    api_key = get_env_value("GEMINI_API_KEY", required=True)
    model = get_env_value("GEMINI_MODEL", required=True)
    timeout = int(get_env_value("GEMINI_TIMEOUT_SECONDS", required=True))
    api_version = get_env_value("GEMINI_API_VERSION", required=True)
    base_url = get_env_value("GEMINI_BASE_URL", required=True)
    config = ExtractorConfig(
        api_key=api_key,
        model=model,
        timeout_seconds=timeout,
        api_version=api_version,
        base_url=base_url,
    )
    return ExtractorAgent(GeminiClient(config), get_tracer())


def get_env_value(name: str, required: bool = False, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if required and not value:
        raise RuntimeError(f"{name} is required")
    return value or ""


def get_schema_fields() -> Tuple[Tuple[str, str], ...]:
    raw = os.getenv("SCHEMA_FIELDS_JSON")
    if raw:
        data = json.loads(raw)
        return tuple((item[0], item[1]) for item in data)
    return DEFAULT_SCHEMA_FIELDS
