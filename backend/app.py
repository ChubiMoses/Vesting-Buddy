import json
import os
import sys

from agent.extractor_agent import load_extractor_from_env


def load_env(path: str) -> None:
    if not os.path.isfile(path):
        return
    with open(path, "r", encoding="utf-8") as file:
        for raw_line in file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key and key not in os.environ:
                os.environ[key] = value


def configure_opik() -> None:
    try:
        import opik
    except Exception:
        return
    api_key = os.getenv("OPIK_API_KEY")
    workspace = os.getenv("OPIK_WORKSPACE")
    url = os.getenv("OPIK_URL_OVERRIDE")
    use_local = os.getenv("OPIK_USE_LOCAL", "").lower() in {"1", "true", "yes"}
    if api_key or workspace or url or use_local:
        opik.configure(
            api_key=api_key,
            workspace=workspace,
            url=url,
            use_local=use_local,
            automatic_approvals=True,
        )


# Resolve file path from args or env
def resolve_file_path(args: list[str]) -> str:
    if len(args) > 1 and args[1]:
        return args[1]
    env_path = os.getenv("EXTRACT_FILE_PATH")
    if env_path:
        return env_path
    raise RuntimeError("Provide a file path argument or EXTRACT_FILE_PATH")


# Run extractor and return JSON
def run() -> dict:
    load_env(os.path.join(os.path.dirname(__file__), ".env"))
    configure_opik()
    file_path = resolve_file_path(sys.argv)
    agent = load_extractor_from_env()
    return agent.extract_from_file(file_path)


if __name__ == "__main__":
    result = run()
    print(json.dumps(result))
