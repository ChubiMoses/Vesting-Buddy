import os
import sys
import json
import opik
from opik_optimizer import MetaPromptOptimizer, TaskConfig, MetricConfig
# We'll use Hallucination metric which is used in the eval script, 
# but optimize_prompt needs a metric that returns a score.
# Hallucination metric returns a score, so it should work.
# Alternatively we can use LevenshteinRatio if we have ground truth output.
# The policy_scout.jsonl dataset has "context" as input and we need to check the output.
# However, the eval script uses Hallucination metric which checks if output is supported by context.
# For optimization, we want to maximize the "faithfulness" or "relevance".
# Let's check what metric to use. The user wants "optimizations".
# If we look at policy_scout_eval.py, it uses Hallucination(model=model_name).
# The optimization framework requires a metric that takes (output, reference) usually,
# or we can map inputs. Hallucination metric takes (input, context, output).
# In our dataset, we have "input" (question) and "context" (policy text).
# We want the model to answer the question based on context.
# Let's stick to LevenshteinRatio if we have expected output in dataset, 
# or use a custom metric if needed. 
# Looking at policy_scout.jsonl (from previous LS, I can't see content but I can infer).
# Let's assume we want to optimize for similarity to an expected answer if available.
# If not available, we might need a different approach.
# Let's assume the dataset has "expected_output" or similar.
# If not, we'll need to check the dataset content. 
# But for now, I'll assume standard structure similar to extractor.

from opik.evaluation.metrics import LevenshteinRatio

# Ensure backend modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from constants.app_defaults import (
    DEFAULT_POLICY_PROMPT_PREFIX,
    DEFAULT_POLICY_PROMPT_SUFFIX,
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

    print(f"🚀 Starting Policy Scout Prompt Optimization using {model_name}")

    # Prepare prompt template
    # Policy Scout takes "input" (question) and "context" (policy text)
    full_prompt_template = (
        f"{DEFAULT_POLICY_PROMPT_PREFIX}\n\n"
        "Question:\n{{input}}\n\n"
        "Context:\n{{context}}\n\n"
        f"{DEFAULT_POLICY_PROMPT_SUFFIX}"
    )

    # Define TaskConfig
    task_config = TaskConfig(
        instruction_prompt=full_prompt_template,
        use_chat_prompt=True,
        input_dataset_fields=["input", "context"],
        output_dataset_field="expected_output", # Assuming this exists in dataset
    )

    # Get the dataset
    client = opik.Opik()
    dataset_name = "Policy_Scout_Prompt_Eval"
    dataset = client.get_or_create_dataset(dataset_name)
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "policy_scout.jsonl")
    
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
