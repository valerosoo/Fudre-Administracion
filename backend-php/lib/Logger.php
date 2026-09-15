<?php

class Logger
{
    private static function write(string $level, string $message): void
    {
        if (!is_dir(LOGS_DIR)) {
            mkdir(LOGS_DIR, 0755, true);
        }
        $line = sprintf('[%s] %s: %s%s', date('Y-m-d H:i:s'), strtoupper($level), $message, PHP_EOL);
        file_put_contents(LOGS_DIR . '/app.log', $line, FILE_APPEND);
    }

    public static function info(string $message): void
    {
        self::write('info', $message);
    }

    public static function warn(string $message): void
    {
        self::write('warn', $message);
    }

    public static function error(string $message): void
    {
        self::write('error', $message);
    }
}
