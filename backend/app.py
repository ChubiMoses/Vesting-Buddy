import config_loader
from config_loader import load_env
import json
import os
import sys
import warnings

from agent.extractor_agent import load_extractor_from_env
from utils.asset_picker import pick_paystub


_OPIK_CONFIGURED = False


def configure_opik() -> None:
    global _OPIK_CONFIGURED
    if os.getenv("OPIK_TRACK_DISABLE", "").lower() in {"1", "true", "yes"}:
        return
    if _OPIK_CONFIGURED:
        return
    try:
        warnings.filterwarnings(
            "ignore",
            message="Core Pydantic V1 functionality isn't compatible with Python 3.14 or greater.",
            module="opik\\.rest_api\\.core\\.pydantic_utilities",
        )
        import opik
    except Exception:
        return
    try:
        from opik import tracing_runtime_config

        if tracing_runtime_config.is_tracing_active():
            _OPIK_CONFIGURED = True
            return
    except Exception:
        pass
    api_key = (os.getenv("OPIK_API_KEY") or "").strip()
    workspace = (os.getenv("OPIK_WORKSPACE") or "").strip()
    project = (os.getenv("OPIK_PROJECT_NAME") or "").strip()
    url = os.getenv("OPIK_URL_OVERRIDE")
    use_local = os.getenv("OPIK_USE_LOCAL", "").lower() in {"1", "true", "yes"}
    if not api_key and not use_local:
        return
    if api_key:
        os.environ["OPIK_API_KEY"] = api_key
    if workspace:
        os.environ.setdefault("OPIK_WORKSPACE_NAME", workspace)
    if project:
        os.environ.setdefault("OPIK_PROJECT_NAME", project)
    if api_key or workspace or url or use_local:
        opik.configure(
            api_key=api_key,
            workspace=workspace,
            url=url,
            use_local=use_local,
            force=True,
            automatic_approvals=True,
        )
        _OPIK_CONFIGURED = True


# Resolve file path from args or env
def resolve_file_path(args: list[str]) -> str:
    if len(args) > 1 and args[1]:
        return args[1]
    env_path = os.getenv("EXTRACT_FILE_PATH")
    if env_path:
        return env_path
    asset_dir = os.path.join(os.path.dirname(__file__), "assets")
    return pick_paystub(asset_dir)


# Run extractor and return JSON
def run() -> dict:
    load_env(os.path.join(os.path.dirname(__file__), ".env"))
    configure_opik()
    file_path = resolve_file_path(sys.argv)
    agent = load_extractor_from_env()
    return agent.extract_from_file(file_path)


if __name__ == "__main__":
    result = run()
    output = json.dumps(result, ensure_ascii=False)
    print("✨ Vesting Buddy Extractor ✨")
    print("📄 Paysub parsed. Here’s the loot:")
    print(output)
