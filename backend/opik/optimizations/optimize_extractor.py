import os
import sys
import json
import opik
# ChatPrompt is not available in installed version 0.7.1, using TaskConfig/MetricConfig
from opik_optimizer import MetaPromptOptimizer, TaskConfig, MetricConfig
from opik.evaluation.metrics import LevenshteinRatio

# Ensure backend modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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

def run_optimization():
    # Load env vars if not set (assuming running via python directly, but .env should be sourced)
    
    # Model setup
    base_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    if "1.5-flash" in base_model:
         base_model = "gemini-2.0-flash"
    
    if not base_model.startswith("gemini/"):
        model_name = f"gemini/{base_model}"
    else:
        model_name = base_model

    print(f"🚀 Starting Extractor Prompt Optimization using {model_name}")

    # Prepare system instruction + user template
    # Since opik-optimizer 0.7.1 puts everything in 'prompt' for evaluation (system_prompt=None),
    # we combine them.
    system_prompt = build_prompt_text()
    full_prompt_template = f"{system_prompt}\n\nDocument Text:\n{{input}}"

    # Define TaskConfig
    task_config = TaskConfig(
        instruction_prompt=full_prompt_template,
        use_chat_prompt=False, # Treats instruction_prompt as a template with placeholders
        input_dataset_fields=["input"],
        output_dataset_field="expected_output",
    )

    # Get the dataset
    client = opik.Opik()
    dataset_name = "Extractor_Prompt_Eval"
    dataset = client.get_or_create_dataset(dataset_name)
    # Path: ../datasets/extractor.jsonl (from opik/optimizations/optimize_extractor.py)
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "extractor.jsonl")
    
    if os.path.exists(dataset_path):
        with open(dataset_path, "r") as f:
            items = [json.loads(line) for line in f]
        try:
            # Only insert if empty to avoid duplicates, or Opik handles it
            if len(dataset.get_items()) == 0:
                 dataset.insert(items)
        except Exception as e:
            print(f"Note: Dataset insertion check failed or skipped: {e}")

    # Define MetricConfig
    # Maps 'reference' arg of LevenshteinRatio.score to dataset field 'expected_output'
    # Maps 'output' arg of LevenshteinRatio.score to LLM output (implicitly handled as 'output' by optimizer?)
    # Based on meta_prompt_optimizer.py, the evaluated task returns dictionary with key 'output'.
    # MetricConfig.inputs expects map: argument_name -> dataset_field_or_output_key
    # We assume 'output' key in inputs maps to LLM output.
    metric_config = MetricConfig(
        metric=LevenshteinRatio(),
        inputs={
            "reference": "expected_output",
            "output": "output" # Maps to the LLM output key 'output'
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
        # Result might be OptimizationResult object or something else
        # Check if it has display method
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
