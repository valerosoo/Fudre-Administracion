<?php

/** Replica parse_json_from_response de import_service/main.py (mismo orden de intentos). */
class JsonExtractor
{
    public static function extract(string $text): array
    {
        $text = trim($text);

        $direct = json_decode($text, true);
        if ($direct !== null) {
            return $direct;
        }

        if (preg_match('/```(?:json)?\s*(\[.*?\]|\{.*?\})\s*```/s', $text, $m)) {
            $decoded = json_decode($m[1], true);
            if ($decoded !== null) {
                return $decoded;
            }
        }

        foreach (['/\[.*\]/s', '/\{.*\}/s'] as $pattern) {
            if (preg_match($pattern, $text, $m)) {
                $decoded = json_decode($m[0], true);
                if ($decoded !== null) {
                    return $decoded;
                }
            }
        }

        throw new RuntimeException('No se pudo parsear JSON de la respuesta: ' . mb_substr($text, 0, 500));
    }
}
