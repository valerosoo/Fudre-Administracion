<?php

class ErrorHandler
{
    public static function register(): void
    {
        set_exception_handler([self::class, 'handle']);
        set_error_handler(function ($severity, $message, $file, $line) {
            throw new ErrorException($message, 0, $severity, $file, $line);
        });
    }

    public static function handle(Throwable $e): void
    {
        if ($e instanceof NotFoundException) {
            Logger::warn($e->getMessage());
            Response::error($e->getMessage(), 404);
            return;
        }
        if ($e instanceof UnauthorizedException) {
            Response::error($e->getMessage(), 401);
            return;
        }
        if ($e instanceof ConflictException) {
            Logger::warn($e->getMessage());
            Response::error($e->getMessage(), 409);
            return;
        }
        if ($e instanceof BusinessException) {
            Logger::warn($e->getMessage());
            Response::error($e->getMessage(), 400);
            return;
        }

        Logger::error($e->getMessage() . "\n" . $e->getTraceAsString());
        Response::error('Error interno del servidor', 500);
    }
}
