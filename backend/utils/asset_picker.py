import os

from constants.asset_constants import HANDBOOK_KEYWORDS, PAYSTUB_KEYWORDS


def list_asset_files(asset_dir: str) -> list[str]:
    if not os.path.isdir(asset_dir):
        return []
    files = []
    for name in os.listdir(asset_dir):
        path = os.path.join(asset_dir, name)
        if os.path.isfile(path):
            files.append(path)
    return files


def is_supported_asset(path: str) -> bool:
    name = os.path.basename(path).lower()
    return name.endswith((".pdf", ".txt", ".md", ".json"))


def score_filename(path: str, keywords: tuple[str, ...]) -> int:
    name = os.path.basename(path).lower()
    return sum(1 for keyword in keywords if keyword in name)


def pick_best_match(files: list[str], keywords: tuple[str, ...]) -> str | None:
    if not files:
        return None
    ranked = sorted(files, key=lambda path: score_filename(path, keywords), reverse=True)
    if score_filename(ranked[0], keywords) == 0:
        return None
    return ranked[0]


def pick_documents(asset_dir: str) -> tuple[str, str]:
    files = [path for path in list_asset_files(asset_dir) if is_supported_asset(path)]
    if not files:
        raise RuntimeError("Assets folder is empty.")
    paystub = pick_best_match(files, PAYSTUB_KEYWORDS)
    handbook = pick_best_match(files, HANDBOOK_KEYWORDS)
    if not paystub:
        paystub = next(iter(files), None)
    if not handbook:
        handbook = next((path for path in files if path != paystub), paystub)
    if not paystub or not handbook:
        raise RuntimeError("Unable to select paystub and handbook from assets.")
    return paystub, handbook


def pick_paystub(asset_dir: str) -> str:
    files = [path for path in list_asset_files(asset_dir) if is_supported_asset(path)]
    paystub = pick_best_match(files, PAYSTUB_KEYWORDS)
    if paystub:
        return paystub
    if files:
        return files[0]
    raise RuntimeError("No paystub found in assets.")


def pick_handbook(asset_dir: str) -> str:
    files = [path for path in list_asset_files(asset_dir) if is_supported_asset(path)]
    handbook = pick_best_match(files, HANDBOOK_KEYWORDS)
    if handbook:
        return handbook
    if files:
        return files[0]
    raise RuntimeError("No handbook found in assets.")
