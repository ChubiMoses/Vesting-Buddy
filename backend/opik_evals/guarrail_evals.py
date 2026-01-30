from opik import track

@track(name="guardrail_eval")
def guardrail_eval(result, expected):
    status = result.get("guardrail_status")

    score = 1.0 if status == expected["expected_status"] else 0.0

    return {
        "score": score,
        "details": {
            "status": status,
            "expected": expected["expected_status"],
        },
    }
