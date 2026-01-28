import os

def load_env(path: str = None) -> None:
    """
    Load environment variables from a .env file.
    If path is not provided, defaults to .env in the same directory as this file.
    """
    if path is None:
        path = os.path.join(os.path.dirname(__file__), ".env")

    if not os.path.isfile(path):
        return

    with open(path, "r", encoding="utf-8") as file:
        for raw_line in file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            value = value.strip().strip("\"").strip("'")
            if not key:
                continue
            if value:
                os.environ[key] = value
            elif key not in os.environ:
                os.environ[key] = value

# Automatically load environment variables when this module is imported
load_env()
