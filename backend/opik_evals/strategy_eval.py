from opik import track

@track(name="strategist_eval")
def strategist_eval(output, expected):
    metrics = output["leaked_value"]
    score = 1.0

    if metrics["gap_rate"] < expected["min_gap_rate"]:
        score -= 0.5

    if metrics["annual_opportunity_cost"] < expected["min_annual_opportunity"]:
        score -= 0.5

    return {
        "score": max(score, 0),
        "details": {
            "gap_rate": metrics["gap_rate"],
            "annual_opportunity_cost": metrics["annual_opportunity_cost"],
        },
    }
