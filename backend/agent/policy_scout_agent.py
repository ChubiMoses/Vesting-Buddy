import json
import os
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

from agent.extractor_agent import (
    ExtractorConfig,
    GeminiClient,
    Tracer,
    get_env_value,
    get_track_decorator,
    get_tracer,
    guess_mime_type,
    read_file_base64,
)
from constants.app_defaults import (
    DEFAULT_POLICY_CHUNK_OVERLAP,
    DEFAULT_POLICY_CHUNK_SIZE,
    DEFAULT_POLICY_PROMPT_PREFIX,
    DEFAULT_POLICY_PROMPT_SUFFIX,
    DEFAULT_POLICY_TOP_K,
)
from constants.policy_constants import BOOSTED_QUERY, KEYWORDS
from utils.asset_picker import pick_handbook


@dataclass
class PolicyScoutConfig:
    handbook_path: str
    top_k: int
    chunk_size: int
    chunk_overlap: int
    prompt_prefix: str
    prompt_suffix: str


class PolicyScoutAgent:
    def __init__(self, client: GeminiClient, tracer: Tracer, config: PolicyScoutConfig) -> None:
        self.client = client
        self.tracer = tracer
        self.config = config

    @get_track_decorator()
    def answer(self, question: str) -> Dict[str, Any]:
        # Locate raw policy text for matching and vesting math
        self.tracer.log_step("policy_question_received", {"question": question})
        mock_response = os.getenv("POLICY_MOCK_RESPONSE")
        if mock_response:
            answer_text = mock_response
            return {
                "question": question,
                "answer": answer_text,
                "sources": [],
                "conflicts": False,
            }
        try:
            text = load_handbook_text(self.config.handbook_path)
            self.tracer.log_step("policy_handbook_loaded", {"characters": len(text)})
            sections, conflicts = find_policy_sections(text)
            self.tracer.log_step(
                "policy_sections_found",
                {"count": len(sections), "conflicts": conflicts},
            )
            if sections:
                answer_text = "\n\n---\n\n".join(sections)
                return {
                    "question": question,
                    "answer": answer_text,
                    "sources": [],
                    "conflicts": conflicts,
                }
            self.tracer.log_step("policy_section_fallback", {"reason": "no sections matched"})
            chunks = chunk_text(text, self.config.chunk_size, self.config.chunk_overlap)
            self.tracer.log_step("policy_chunks_created", {"count": len(chunks)})
            matches = retrieve_chunks(BOOSTED_QUERY, chunks, self.config.top_k)
            self.tracer.log_step("policy_chunks_retrieved", {"count": len(matches)})
            prompt = build_prompt(question, matches, self.config.prompt_prefix, self.config.prompt_suffix)
            self.tracer.log_step("policy_prompt_built", {"length": len(prompt)})
            response_text = self.client.generate_content(build_request(prompt))
            self.tracer.log_step("policy_response_received", {"length": len(response_text)})
            answer_text = extract_text_response(response_text)
            return {
                "question": question,
                "answer": answer_text,
                "sources": matches,
                "conflicts": conflicts,
                "confidence": classify_policy_confidence(sections, conflicts),
            }
        except RuntimeError as exc:
            if not self.config.handbook_path.lower().endswith(".pdf"):
                raise
            if "PDF support requires" not in str(exc):
                raise
            self.tracer.log_step("policy_pdf_fallback", {"reason": str(exc)})
            data = read_file_base64(self.config.handbook_path)
            mime_type = guess_mime_type(self.config.handbook_path)
            prompt = build_direct_prompt(question, self.config.prompt_prefix, self.config.prompt_suffix)
            response_text = self.client.generate_content(build_file_request(prompt, mime_type, data))
            self.tracer.log_step("policy_response_received", {"length": len(response_text)})
            answer_text = extract_text_response(response_text)
            return {
                "question": question,
                "answer": answer_text,
                "sources": [],
                "conflicts": False,
            }


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


def build_file_request(prompt: str, mime_type: str, base64_data: str) -> Dict[str, Any]:
    return {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": mime_type, "data": base64_data}},
                ],
            }
        ],
        "generationConfig": {"temperature": 0},
    }


def extract_text_response(response_text: str) -> str:
    payload = json.loads(response_text)
    candidates = payload.get("candidates") or []
    if not candidates:
        raise RuntimeError("Policy Scout response missing candidates")
    content = candidates[0].get("content") or {}
    parts = content.get("parts") or []
    if not parts:
        raise RuntimeError("Policy Scout response missing content parts")
    return parts[0].get("text") or ""


def build_prompt(question: str, chunks: List[Dict[str, Any]], prefix: str, suffix: str) -> str:
    context = "\n\n".join(
        f"[Chunk {item['index']}] {item['text']}" for item in chunks
    )
    return (
        f"{prefix}\n\nQuestion:\n{question}\n\nContext:\n{context}\n\n{suffix}"
    ).strip()


def build_direct_prompt(question: str, prefix: str, suffix: str) -> str:
    return f"{prefix}\n\nQuestion:\n{question}\n\nUse only the attached document.\n\n{suffix}".strip()


def normalize_tokens(text: str) -> List[str]:
    return [token for token in re.split(r"[^\w]+", text.lower()) if token]



@get_track_decorator()
def find_policy_sections(text: str) -> Tuple[List[str], bool]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return [], False
    sectioned = extract_section_blocks(normalized)
    keyword_hits = [block for block in sectioned if has_keywords(block)]
    if not keyword_hits:
        keyword_hits = extract_keyword_windows(normalized)
    expanded = []
    for block in keyword_hits:
        expanded.append(block.strip())
    unique_sections = list(dict.fromkeys(expanded))
    conflicts = detect_semantic_conflict(unique_sections)
    return unique_sections, conflicts


def has_keywords(text: str) -> bool:
    lowered = text.lower()
    return any(keyword in lowered for keyword in KEYWORDS)


def extract_section_blocks(text: str) -> List[str]:
    pattern = re.compile(r"(section\s+\d+(?:\.\d+)?\s*:\s*)", re.IGNORECASE)
    matches = list(pattern.finditer(text))
    if not matches:
        return []
    blocks = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        blocks.append(text[start:end].strip())
    return blocks


def extract_keyword_windows(text: str) -> List[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    windows = []
    window_size = 3
    for i, sentence in enumerate(sentences):
        if has_keywords(sentence):
            start = max(0, i - 1)
            end = min(len(sentences), i + window_size)
            windows.append(" ".join(sentences[start:end]).strip())
    return windows


def retrieve_chunks(question: str, chunks: List[str], top_k: int) -> List[Dict[str, Any]]:
    query_tokens = normalize_tokens(question)
    if not query_tokens:
        return []
    scored: List[Tuple[int, float, str]] = []
    for index, chunk in enumerate(chunks):
        tokens = normalize_tokens(chunk)
        if not tokens:
            continue
        token_set = set(tokens)
        score = sum(1 for token in query_tokens if token in token_set)
        if score:
            scored.append((index, score / max(len(tokens), 1), chunk))
    scored.sort(key=lambda item: item[1], reverse=True)
    results = []
    for index, score, text in scored[:top_k]:
        results.append({"index": index, "score": score, "text": text})
    return results


def chunk_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    if chunk_size <= 0:
        raise RuntimeError("POLICY_CHUNK_SIZE must be positive")
    if overlap >= chunk_size:
        raise RuntimeError("POLICY_CHUNK_OVERLAP must be smaller than chunk size")
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    base_chunks = recursive_split_text(normalized, chunk_size)
    return apply_overlap(base_chunks, overlap)


def recursive_split_text(text: str, chunk_size: int) -> List[str]:
    if len(text) <= chunk_size:
        return [text]
    separators = ["\n\n", "\n", ". ", " "]
    for sep in separators:
        if sep in text:
            parts = text.split(sep)
            chunks: List[str] = []
            current = ""
            for part in parts:
                part_text = part.strip()
                if not part_text:
                    continue
                candidate = (current + sep + part_text).strip() if current else part_text
                if len(candidate) <= chunk_size:
                    current = candidate
                else:
                    if current:
                        chunks.append(current)
                    if len(part_text) > chunk_size:
                        chunks.extend(recursive_split_text(part_text, chunk_size))
                        current = ""
                    else:
                        current = part_text
            if current:
                chunks.append(current)
            if chunks:
                return chunks
    return [text[:chunk_size]] + recursive_split_text(text[chunk_size:], chunk_size)


def apply_overlap(chunks: List[str], overlap: int) -> List[str]:
    if not chunks or overlap <= 0:
        return chunks
    overlapped = [chunks[0]]
    for chunk in chunks[1:]:
        prefix = overlapped[-1][-overlap:] if len(overlapped[-1]) > overlap else overlapped[-1]
        overlapped.append((prefix + " " + chunk).strip())
    return overlapped


def load_handbook_text(path: str) -> str:
    if not os.path.isfile(path):
        raise RuntimeError(f"Handbook not found: {path}")
    ext = os.path.splitext(path)[1].lower()
    if ext in {".txt", ".md"}:
        return read_text_file(path)
    if ext == ".json":
        return read_json_text(path)
    if ext == ".pdf":
        return read_pdf_text(path)
    return read_text_file(path)


def read_text_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as file:
        try:
            return file.read()
        except UnicodeDecodeError:
            return ""


def read_json_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as file:
        payload = json.load(file)
    if isinstance(payload, dict):
        if "text" in payload and isinstance(payload["text"], str):
            return payload["text"]
        return json.dumps(payload, ensure_ascii=False)
    if isinstance(payload, list):
        return "\n".join(str(item) for item in payload)
    return str(payload)


def read_pdf_text(path: str) -> str:
    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        try:
            import pdfplumber
        except Exception as exc:
            raise RuntimeError("PDF support requires PyPDF2 or pdfplumber") from exc
        text_parts: List[str] = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)


def load_policy_scout_from_env(handbook_path: str | None = None) -> PolicyScoutAgent:
    handbook_path = handbook_path or os.getenv("POLICY_HANDBOOK_PATH")
    if not handbook_path:
        asset_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets")
        handbook_path = pick_handbook(asset_dir)
    top_k = int(get_env_value("POLICY_TOP_K", default=str(DEFAULT_POLICY_TOP_K)))
    chunk_size = int(get_env_value("POLICY_CHUNK_SIZE", default=str(DEFAULT_POLICY_CHUNK_SIZE)))
    chunk_overlap = int(get_env_value("POLICY_CHUNK_OVERLAP", default=str(DEFAULT_POLICY_CHUNK_OVERLAP)))
    prompt_prefix = get_env_value("POLICY_PROMPT_PREFIX", default=DEFAULT_POLICY_PROMPT_PREFIX)
    prompt_suffix = get_env_value("POLICY_PROMPT_SUFFIX", default=DEFAULT_POLICY_PROMPT_SUFFIX)
    config = PolicyScoutConfig(
        handbook_path=handbook_path,
        top_k=top_k,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        prompt_prefix=prompt_prefix,
        prompt_suffix=prompt_suffix,
    )
    client = GeminiClient(load_gemini_config())
    return PolicyScoutAgent(client, get_tracer(), config)


def load_gemini_config() -> ExtractorConfig:
    return ExtractorConfig(
        api_key=get_env_value("GEMINI_API_KEY", required=True),
        model=get_env_value("GEMINI_MODEL", required=True),
        timeout_seconds=int(get_env_value("GEMINI_TIMEOUT_SECONDS", required=True)),
        api_version=get_env_value("GEMINI_API_VERSION", required=True),
        base_url=get_env_value("GEMINI_BASE_URL", required=True),
    )

def classify_policy_confidence(sections: list[str], conflicts: bool) -> str:
    if not sections:
        return "low"
    if conflicts:
        return "medium"
    if len(sections[0]) < 300:
        return "medium"
    return "high"

def detect_semantic_conflict(sections: list[str]) -> bool:
    percents = set(re.findall(r"\d+(\.\d+)?\s*%", " ".join(sections)))
    return len(percents) > 1
