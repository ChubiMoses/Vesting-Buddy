import json
import os
import sys

from agent.extractor_agent import load_extractor_from_env


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
    file_path = resolve_file_path(sys.argv)
    agent = load_extractor_from_env()
    return agent.extract_from_file(file_path)


if __name__ == "__main__":
    result = run()
    print(json.dumps(result))
