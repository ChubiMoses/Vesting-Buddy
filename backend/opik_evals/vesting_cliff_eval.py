from opik import track

@track(name="vesting_cliff_eval")
def vesting_cliff_eval(policy_text: str, expected: dict):
    """
    Evaluates whether a vesting cliff is correctly detected.
    """

    text = (policy_text or "").lower()

    has_cliff = "cliff" in text
    has_date = expected.get("date", "").lower() in text if expected.get("date") else True

    score = 1.0 if has_cliff and has_date else 0.0

    return {
        "score": score,
        "details": {
            "cliff_detected": has_cliff,
            "date_detected": has_date,
            "expected_date": expected.get("date"),
        },
    }
