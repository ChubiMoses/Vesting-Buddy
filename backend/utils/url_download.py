import os
import tempfile
import urllib.error
import urllib.request
from urllib.parse import urlparse


def download_url_to_temp(
    url: str,
    max_size_bytes: int = 20 * 1024 * 1024,
    timeout_seconds: int = 60,
    allowed_schemes: tuple[str, ...] = ("https", "http"),
) -> str:
    """
    Download a URL to a temporary file and return its path.
    Caller is responsible for deleting the file when done.
    """
    parsed = urlparse(url)
    if parsed.scheme not in allowed_schemes:
        raise RuntimeError(f"URL scheme not allowed: {parsed.scheme}")

    path_suffix = os.path.splitext(parsed.path)[1] if parsed.path else ""
    if path_suffix and path_suffix.startswith(".") and len(path_suffix) <= 6:
        suffix = path_suffix
    else:
        suffix = ".bin"

    req = urllib.request.Request(url, headers={"User-Agent": "VestingBuddy-Backend/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
            if resp.length is not None and resp.length > max_size_bytes:
                raise RuntimeError(f"Content length {resp.length} exceeds max {max_size_bytes}")
            total = 0
            chunks = []
            while True:
                chunk = resp.read(64 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_size_bytes:
                    raise RuntimeError(f"Download size exceeds max {max_size_bytes} bytes")
                chunks.append(chunk)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Download failed: HTTP {e.code} {e.reason}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Download failed: {e.reason}") from e

    data = b"".join(chunks)
    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        os.write(fd, data)
    finally:
        os.close(fd)
    return path
