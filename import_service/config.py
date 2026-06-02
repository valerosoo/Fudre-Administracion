import os

CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL   = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080/api")
