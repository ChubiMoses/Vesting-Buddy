import os
import sys
import json
import opik
from opik_optimizer import MetaPromptOptimizer, TaskConfig, MetricConfig
from opik.evaluation.metrics import LevenshteinRatio

# Ensure backend modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

def run_optimization():
    # Model setup
    base_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    if "1.5-flash" in base_model:
         base_model = "gemini-2.0-flash"
    
    if not base_model.startswith("gemini/"):
        model_name = f"gemini/{base_model}"
    else:
        model_name = base_model

    print(f"🚀 Starting Guardrail Prompt Optimization using {model_name}")

    # Prepare prompt template with hardcoded blocklist for optimization context
    full_prompt_template = (
        "You are a content safety guardrail. "
        "Specific blocked terms are: apple, tesla, bitcoin. "
        "Specific blocked topics are: financial advice, stock picking, crypto speculation. "
        "Check the following content for any blocked terms or topics. "
        "If found, return status 'blocked' and list violations. "
        "If safe, return status 'allowed'. "
        "Return JSON: {{\"status\": \"allowed\"|\"blocked\", \"violations\": [\"...\"]}}\n\n"
        "Content:\n{{input}}"
    )

    # Define TaskConfig
    task_config = TaskConfig(
        instruction_prompt=full_prompt_template,
        use_chat_prompt=False,
        input_dataset_fields=["input"],
        output_dataset_field="expected_output",
    )

    # Get the dataset
    client = opik.Opik()
    dataset_name = "Guardrail_Prompt_Eval"
    dataset = client.get_or_create_dataset(dataset_name)
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "guardrail.jsonl")
    
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
        max_rounds=1,
        num_prompts_per_round=1,
        num_threads=2,
        project_name="vbuddy_optimization"
    )

    print("Starting optimization loop...")
    try:
        result = optimizer.optimize_prompt(
            dataset=dataset,
            metric_config=metric_config,
            task_config=task_config,
            n_samples=3,
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
