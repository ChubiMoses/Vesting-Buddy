import os
import sys
import json
import opik
from opik_optimizer import MetaPromptOptimizer, TaskConfig, MetricConfig
from opik.evaluation.metrics import LevenshteinRatio

# Ensure backend modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from constants.app_defaults import (
    DEFAULT_STRATEGIST_PROMPT_PREFIX,
    DEFAULT_STRATEGIST_PROMPT_SUFFIX,
)

def run_optimization():
    # Model setup
    base_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    if "1.5-flash" in base_model:
         base_model = "gemini-2.0-flash"
    
    if not base_model.startswith("gemini/"):
        model_name = f"gemini/{base_model}"
    else:
        model_name = base_model

    print(f"🚀 Starting Strategist Prompt Optimization using {model_name}")

    # Prepare prompt template
    # Strategist takes "input_payload" which contains combined data
    full_prompt_template = (
        f"{DEFAULT_STRATEGIST_PROMPT_PREFIX}\n\n"
        "Data:\n{{input_payload}}\n\n"
        f"{DEFAULT_STRATEGIST_PROMPT_SUFFIX}"
    )

    # Define TaskConfig
    task_config = TaskConfig(
        instruction_prompt=full_prompt_template,
        use_chat_prompt=True,
        input_dataset_fields=["input_payload"],
        output_dataset_field="expected_output", # Assuming this exists in dataset
    )

    # Get the dataset
    client = opik.Opik()
    dataset_name = "Strategist_Prompt_Eval"
    dataset = client.get_or_create_dataset(dataset_name)
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "strategist.jsonl")
    
    if os.path.exists(dataset_path):
        with open(dataset_path, "r") as f:
            items = [json.loads(line) for line in f]
        try:
            if len(dataset.get_items()) == 0:
                 dataset.insert(items)
        except Exception as e:
            print(f"Note: Dataset insertion check failed or skipped: {e}")

    # Define MetricConfig
    metric_config = MetricConfig(
        metric=LevenshteinRatio(),
        inputs={
            "reference": "expected_output",
            "output": "output"
        }
    )

    # Run the optimization
    optimizer = MetaPromptOptimizer(
        model=model_name,
        reasoning_model=model_name,
        max_rounds=2,
        num_prompts_per_round=2,
        num_threads=4,
        project_name="vbuddy_optimization"
    )

    print("Starting optimization loop...")
    try:
        result = optimizer.optimize_prompt(
            dataset=dataset,
            metric_config=metric_config,
            task_config=task_config,
            n_samples=5,
        )
        print("\nOptimization Complete!")
        if hasattr(result, "display"):
            result.display()
        else:
            print(f"Result: {result}")
    except Exception as e:
        print(f"Optimization failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_optimization()
