import os

# ── Cambiar esto para alternar entre proveedores ────────────────────────────
# Opciones: "ollama" | "claude"
AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama")

# ── Ollama (local, gratuito) ─────────────────────────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

# ── Claude API (pago, mejor calidad) ────────────────────────────────────────
CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL   = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

# ── Backend de Fudre ────────────────────────────────────────────────────────
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080/api")
