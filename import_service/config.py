import os

CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL   = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080/api")
IMPORT_PUBLIC_URL = os.getenv("IMPORT_PUBLIC_URL", "http://localhost:8081")
IMPORT_UPLOAD_DIR = os.getenv("IMPORT_UPLOAD_DIR", "uploads/imported_images")
