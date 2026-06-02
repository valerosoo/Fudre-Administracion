import anthropic
from config import CLAUDE_API_KEY, CLAUDE_MODEL


class ClaudeClient:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

    def complete(self, prompt: str) -> str:
        message = self.client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text


def get_ai_client() -> ClaudeClient:
    return ClaudeClient()
