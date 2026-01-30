from opik import track

@track(name="policy_eval")
def policy_eval(policy, expected):
    score = 1.0

    if policy.get("confidence") != expected["confidence"]:
        score -= 0.5

    if policy.get("conflicts") != expected["conflicts"]:
        score -= 0.5

    section_ok = "Section 4.2" in policy.get("answer", "")

    if not section_ok:
        score -= 0.5

    return {
        "score": max(score, 0),
        "details": {
            "confidence": policy.get("confidence"),
            "conflicts": policy.get("conflicts"),
            "section_4_2_found": section_ok,
        },
    }
