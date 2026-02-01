import json
import os
import sys
import opik
from opik.evaluation import evaluate
from opik.evaluation.metrics import BaseMetric
from opik.evaluation.metrics.score_result import ScoreResult

# Ensure backend modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.guardrail_agent import load_guardrail_from_env

# Custom metric for Guardrail
class GuardrailStatusMetric(BaseMetric):
    def __init__(self, name: str = "Guardrail Status Match"):
        super().__init__(name=name)

    def score(self, status: str, expected_status: str, **kwargs) -> ScoreResult:
        # Check if status matches
        match = (status == expected_status)
        reason = f"Expected {expected_status}, got {status}"
        
        return ScoreResult(
            value=1.0 if match else 0.0,
            name=self.name,
            reason=reason
        )

def run_eval():
    client = opik.Opik()
    
    print("🚀 Starting Guardrail Agent Eval")

    dataset_name = "Guardrail_Eval"
    dataset = client.get_or_create_dataset(dataset_name)
    
    # Load dataset
    # Path: ../datasets/guardrail.jsonl
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "datasets", "guardrail.jsonl")
    if os.path.exists(dataset_path):
        with open(dataset_path, "r") as f:
            items = [json.loads(line) for line in f]
        # Map dataset items to expected Opik format if needed, 
        # but evaluate() handles dicts well if keys match task args
        dataset.insert(items)
    else:
        print(f"Warning: Dataset file not found at {dataset_path}")
        return

    # Initialize Agent
    agent = load_guardrail_from_env()

    # Define the task function
    def guardrail_task(input_item):
        return agent.enforce(input_item["input"])

    # Run evaluation
    evaluate(
        dataset=dataset,
        task=guardrail_task,
        experiment_name="guardrail_logic_eval",
        scoring_metrics=[
            GuardrailStatusMetric(),
        ]
    )

if __name__ == "__main__":
    run_eval()