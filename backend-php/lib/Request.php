<?php

class Request
{
    private static ?array $bodyCache = null;

    /** Body JSON parseado como array asociativo. Nunca null (array vacío si no hay body o es inválido). */
    public static function body(): array
    {
        if (self::$bodyCache === null) {
            $raw = file_get_contents('php://input');
            $decoded = $raw !== false && $raw !== '' ? json_decode($raw, true) : null;
            self::$bodyCache = is_array($decoded) ? $decoded : [];
        }
        return self::$bodyCache;
    }

    public static function query(string $key, $default = null)
    {
        return $_GET[$key] ?? $default;
    }
}
