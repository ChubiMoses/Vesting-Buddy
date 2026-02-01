import json
import os
import sys
import opik
from opik.evaluation import evaluate_prompt
from opik.evaluation.metrics import Contains

# Ensure backend modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from constants.app_defaults import (
    DEFAULT_EXTRACT_PROMPT_PREFIX,
    DEFAULT_EXTRACT_PROMPT_SUFFIX,
    DEFAULT_SCHEMA_FIELDS,
)

def build_prompt_text():
    # Helper to reconstruct the prompt logic from ExtractorAgent
    schema_items = ", ".join(
        f"\"{name}\": {field_type}|null" for name, field_type in DEFAULT_SCHEMA_FIELDS
    )
    return f"{DEFAULT_EXTRACT_PROMPT_PREFIX} " + "{" + schema_items + "}" + DEFAULT_EXTRACT_PROMPT_SUFFIX

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
        
    print(f"🚀 Starting Extractor Agent Prompt Eval using {model_name}")

    dataset_name = "Extractor_Prompt_Eval"
    dataset = client.get_or_create_dataset(dataset_name)
    
    # Load dataset from JSONL
    # Path: ../datasets/extractor.jsonl
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "extractor.jsonl")
    if os.path.exists(dataset_path):
        with open(dataset_path, "r") as f:
            items = [json.loads(line) for line in f]
        dataset.insert(items)
    else:
        print(f"Warning: Dataset file not found at {dataset_path}")

    base_prompt = build_prompt_text()
    prompt_template = (
        f"{base_prompt}\n\n"
        "Document Text:\n{{input}}"
    )

    evaluate_prompt(
        dataset=dataset,
        messages=[
            {"role": "user", "content": prompt_template},
        ],
        model=model_name,
        experiment_name="extractor_prompt_eval",
        scoring_metrics=[
            Contains(reference="gross_pay", name="Contains Gross Pay"),
        ]
    )

if __name__ == "__main__":
    run_eval()