import anthropic
from config import CLAUDE_API_KEY, CLAUDE_MODEL


class ClaudeClient:
    def __init__(self):
        if not CLAUDE_API_KEY:
            raise RuntimeError("Falta configurar ANTHROPIC_API_KEY")
        self.client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)

    def complete(self, prompt: str, attachments: list[dict] | None = None) -> str:
        content = []
        for attachment in attachments or []:
            label = attachment.get("label")
            if label:
                content.append({"type": "text", "text": label})
            content.append(self._to_content_block(attachment))
        content.append({"type": "text", "text": prompt})

        message = self.client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            messages=[{"role": "user", "content": content}],
        )
        return "\n".join(
            block.text for block in message.content
            if getattr(block, "type", None) == "text"
        )

    def _to_content_block(self, attachment: dict) -> dict:
        source = {
            "type": "base64",
            "media_type": attachment["media_type"],
            "data": attachment["data"],
        }
        if attachment["type"] == "document":
            return {"type": "document", "source": source}
        return {"type": "image", "source": source}


def get_ai_client() -> ClaudeClient:
    return ClaudeClient()
