from typing import Dict, Any, List

REQUIRED_NUMERIC_FIELDS = [
    "gross_pay",
    "base_pay",
    "net_pay",
]

def validate_extraction(data: Dict[str, Any]) -> List[str]:
    errors = []

    gross = to_float(data.get("gross_pay") or data.get("base_pay"))
    net = to_float(data.get("net_pay"))

    if gross <= 0:
        errors.append("Gross pay missing or invalid")

    if net < 0:
        errors.append("Net pay negative")

    if gross and net and net > gross:
        errors.append("Net pay exceeds gross pay")

    return errors


def to_float(value: Any) -> float:
    try:
        return float(str(value).replace(",", "").replace("$", ""))
    except Exception:
        return 0.0
