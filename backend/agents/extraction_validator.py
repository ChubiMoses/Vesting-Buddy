from typing import Dict, Any, List, Tuple

REQUIRED_NUMERIC_FIELDS = [
    "gross_pay",
    "base_pay",
    "net_pay",
]

def validate_extraction(data: Dict[str, Any], fields: Any = None) -> Tuple[bool, List[str]]:
    errors = []

    # If fields provided, check if we should validate paystub fields
    should_validate_paystub = True
    if fields:
        field_names = {f[0] for f in fields}
        if "gross_pay" not in field_names and "base_pay" not in field_names:
            should_validate_paystub = False

    if should_validate_paystub:
        gross = to_float(data.get("gross_pay") or data.get("base_pay"))
        net = to_float(data.get("net_pay"))

        if gross <= 0:
            errors.append("Gross pay missing or invalid")

        if net < 0:
            errors.append("Net pay negative")

        if gross and net and net > gross:
            errors.append("Net pay exceeds gross pay")

    return len(errors) == 0, errors


def to_float(value: Any) -> float:
    try:
        return float(str(value).replace(",", "").replace("$", ""))
    except Exception:
        return 0.0
