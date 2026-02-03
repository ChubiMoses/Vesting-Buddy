import json
import os
import sys
import opik
from opik.evaluation import evaluate_prompt
from opik.evaluation.metrics import Hallucination

# Ensure backend modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from constants.app_defaults import (
    DEFAULT_POLICY_PROMPT_PREFIX,
    DEFAULT_POLICY_PROMPT_SUFFIX,
)

def run_eval():
    client = opik.Opik()
    
    # Model setup
    base_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    if "1.5-flash" in base_model:
         base_model = "gemini-2.0-flash"
    if not base_model.startswith("gemini/"):
        model_name = f"gemini/{base_model}"
    else:
        model_name = base_model
        
    print(f"🚀 Starting Policy Scout Agent Prompt Eval using {model_name}")

    dataset_name = "Policy_Scout_Prompt_Eval"
    dataset = client.get_or_create_dataset(dataset_name)
    
    # Load dataset from JSONL
    # Path: ../datasets/policy_scout.jsonl
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "policy_scout.jsonl")
    if os.path.exists(dataset_path):
        with open(dataset_path, "r") as f:
            items = [json.loads(line) for line in f]
        dataset.insert(items)
    else:
        print(f"Warning: Dataset file not found at {dataset_path}")

    prompt_template = (
        f"{DEFAULT_POLICY_PROMPT_PREFIX}\n\n"
        "Question:\n{{input}}\n\n"
        "Context:\n{{context}}\n\n"
        f"{DEFAULT_POLICY_PROMPT_SUFFIX}"
    )

    evaluate_prompt(
        dataset=dataset,
        messages=[
            {"role": "user", "content": prompt_template},
        ],
        model=model_name,
        experiment_name="policy_scout_prompt_eval",
        scoring_metrics=[
            Hallucination(model=model_name),
        ]
    )

if __name__ == "__main__":
    run_eval()