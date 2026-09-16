<?php

class Auth
{
    public static function login(string $email, string $password): string
    {
        if (strcasecmp($email, ADMIN_EMAIL) !== 0 || !password_verify($password, ADMIN_PASSWORD_HASH)) {
            throw new UnauthorizedException('Email o contraseña incorrectos');
        }

        $token = bin2hex(random_bytes(32));
        $expiresAt = (new DateTime())->modify('+' . SESSION_LIFETIME_DAYS . ' days')->format('Y-m-d H:i:s');

        $stmt = Database::get()->prepare(
            'INSERT INTO admin_sessions (token, expires_at) VALUES (:token, :expires_at)'
        );
        $stmt->execute(['token' => $token, 'expires_at' => $expiresAt]);

        return $token;
    }

    public static function logout(string $token): void
    {
        $stmt = Database::get()->prepare('DELETE FROM admin_sessions WHERE token = :token');
        $stmt->execute(['token' => $token]);
    }

    /** Lanza UnauthorizedException si el request no trae un token válido y vigente. */
    public static function requireAuth(): void
    {
        $token = self::extractToken();
        if ($token === null) {
            throw new UnauthorizedException('No autenticado');
        }

        $stmt = Database::get()->prepare(
            'SELECT id FROM admin_sessions WHERE token = :token AND expires_at > NOW()'
        );
        $stmt->execute(['token' => $token]);
        if ($stmt->fetch() === false) {
            throw new UnauthorizedException('Sesión inválida o expirada');
        }
    }

    private static function extractToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if ($header === '' && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $header = $headers['Authorization'] ?? '';
        }
        if (preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }
}
