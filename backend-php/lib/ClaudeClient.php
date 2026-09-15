<?php

/** Cliente mínimo para la API de mensajes de Anthropic (Claude), vía cURL directo. */
class ClaudeClient
{
    /**
     * @param array[] $attachments cada uno: ['type'=>'document'|'image','media_type'=>string,'data'=>base64,'label'=>?string]
     */
    public static function complete(string $prompt, array $attachments = []): string
    {
        if (ANTHROPIC_API_KEY === '') {
            throw new RuntimeException('Falta configurar ANTHROPIC_API_KEY');
        }

        $content = [];
        foreach ($attachments as $attachment) {
            if (!empty($attachment['label'])) {
                $content[] = ['type' => 'text', 'text' => $attachment['label']];
            }
            $content[] = [
                'type' => $attachment['type'],
                'source' => [
                    'type' => 'base64',
                    'media_type' => $attachment['media_type'],
                    'data' => $attachment['data'],
                ],
            ];
        }
        $content[] = ['type' => 'text', 'text' => $prompt];

        $body = [
            'model' => CLAUDE_MODEL,
            'max_tokens' => 4096,
            'messages' => [
                ['role' => 'user', 'content' => $content],
            ],
        ];

        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'x-api-key: ' . ANTHROPIC_API_KEY,
                'anthropic-version: 2023-06-01',
                'content-type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT => 120,
        ]);

        $responseBody = curl_exec($ch);
        if ($responseBody === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException("Error de red llamando a Claude: $error");
        }
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status >= 400) {
            throw new RuntimeException("Claude respondió $status: $responseBody");
        }

        $decoded = json_decode($responseBody, true);
        $blocks = $decoded['content'] ?? [];
        $texts = [];
        foreach ($blocks as $block) {
            if (($block['type'] ?? '') === 'text') {
                $texts[] = $block['text'];
            }
        }
        return implode("\n", $texts);
    }
}
