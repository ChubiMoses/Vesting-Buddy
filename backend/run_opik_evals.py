import json
import os

from app import configure_opik, load_env
from crew_app import run as run_pipeline

from opik import track

from opik_evals.extraction_eval import extractor_eval
from opik_evals.policy_eval import policy_eval
from opik_evals.strategy_eval import strategist_eval
from opik_evals.vesting_cliff_eval import vesting_cliff_eval
from opik_evals.guarrail_evals import guardrail_eval

def load_eval_dataset(path: str):
    cases = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            cases.append(json.loads(line))
    return cases


@track(name="vesting-buddy-evaluation-run")
def run_eval_case(case: dict):
    """
    Runs the full Vesting Buddy pipeline once
    and evaluates all agent responsibilities.
    """

    output = run_pipeline()

    results = {}

    if "expected_extraction" in case:
        results["extractor_eval"] = extractor_eval(
            output["paystub"],
            case["expected_extraction"],
        )

    if "expected_policy" in case:
        results["policy_eval"] = policy_eval(
            output["policy"],
            case["expected_policy"],
        )

    if "expected_strategy" in case:
        results["strategist_eval"] = strategist_eval(
            output,
            case["expected_strategy"],
        )

    if "expected_vesting_cliff" in case:
        results["vesting_cliff_eval"] = vesting_cliff_eval(
            output["policy"]["answer"],
            case["expected_vesting_cliff"],
        )

    if "expected_guardrail" in case:
        results["guardrail_eval"] = guardrail_eval(
            output,
            case["expected_guardrail"],
        )

    return results


def main():
    load_env(os.path.join(os.path.dirname(__file__), ".env"))
    configure_opik()

    dataset_path = os.getenv(
        "EVAL_DATASET_PATH",
        "eval_datasets/all_cases.jsonl",
    )

    cases = load_eval_dataset(dataset_path)

    for idx, case in enumerate(cases):
        print(f"🧪 Running eval case {idx + 1}/{len(cases)}")
        run_eval_case(case)


if __name__ == "__main__":
    main()
