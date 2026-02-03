"""
Vercel entrypoint: FastAPI app at api:app.
Vercel looks for app at index.py, app.py, or server.py by default.
"""
from api import app
