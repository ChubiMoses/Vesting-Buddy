from opik import track

@track(name="extractor_eval")
def extractor_eval(paystub, expected):
    matched = 0
    total = 0

    for k, v in expected.items():
        total += 1
        if abs(float(paystub.get(k, 0)) - float(v)) < 1e-2:
            matched += 1

    consistency_warning = (
        paystub["gross_pay"]
        - paystub.get("total_taxes", 0)
        - paystub.get("total_deductions", 0)
        != paystub["net_pay"]
    )

    return {
        "score": matched / max(total, 1),
        "details": {
            "matched_fields": matched,
            "consistency_warning": consistency_warning,
            "confidence": paystub.get("_extraction_confidence", 1.0),
        },
    }
