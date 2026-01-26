import json
import os
import sys

from agent.policy_scout_agent import load_policy_scout_from_env
from app import configure_opik, load_env
from constants.app_defaults import DEFAULT_POLICY_QUESTION


def resolve_question(args: list[str]) -> str:
    if len(args) > 1 and args[1]:
        return args[1]
    env_question = os.getenv("POLICY_QUESTION")
    if env_question:
        return env_question
    return DEFAULT_POLICY_QUESTION


def run() -> dict:
    load_env(os.path.join(os.path.dirname(__file__), ".env"))
    configure_opik()
    question = resolve_question(sys.argv)
    agent = load_policy_scout_from_env()
    return agent.answer(question)


if __name__ == "__main__":
    result = run()
    output = json.dumps(result, ensure_ascii=False)
    print("🧭 Policy Scout Online 🧭")
    print("📘 Handbook checked. Here’s the scoop:")
    print(output)
