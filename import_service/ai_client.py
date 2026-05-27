import requests
import json
from config import AI_PROVIDER, OLLAMA_BASE_URL, OLLAMA_MODEL, CLAUDE_API_KEY, CLAUDE_MODEL


class OllamaClient:
    """Cliente para Ollama (local, gratuito). Requiere tener Ollama corriendo."""

    def complete(self, prompt: str) -> str:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=300,
        )
        response.raise_for_status()
        return response.json()["response"]


class ClaudeClient:
    """Cliente para Claude API (pago). Requiere ANTHROPIC_API_KEY."""

    def __init__(self):
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
        except ImportError:
            raise RuntimeError("Instalá el paquete: pip install anthropic")

    def complete(self, prompt: str) -> str:
        message = self.client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text


def get_ai_client():
    if AI_PROVIDER == "ollama":
        return OllamaClient()
    elif AI_PROVIDER == "claude":
        return ClaudeClient()
    else:
        raise ValueError(f"AI_PROVIDER inválido: '{AI_PROVIDER}'. Usá 'ollama' o 'claude'.")
