<?php
/**
 * Copiar este archivo como config.php y completar con los valores reales.
 * config.php NO debe subirse a git (agregar a .gitignore).
 */

// ---- Base de datos ----
define('DB_HOST', 'localhost');
define('DB_NAME', 'fudre_admin');
define('DB_USER', 'TU_USUARIO_MYSQL');
define('DB_PASS', 'TU_PASSWORD_MYSQL');

// ---- Autenticación admin (single-user) ----
define('ADMIN_EMAIL', 'TU_EMAIL_ADMIN');
// Generar con: php -r "echo password_hash('tu-password', PASSWORD_BCRYPT), PHP_EOL;"
define('ADMIN_PASSWORD_HASH', '$2y$10$REEMPLAZAR_CON_HASH_REAL');
define('SESSION_LIFETIME_DAYS', 30);

// ---- CORS ----
// Dominio exacto del frontend en producción (sin barra final), ej: https://admin.fudre.com
define('CORS_ALLOWED_ORIGIN', 'http://localhost:5173');

// ---- Tiendanube ----
define('TIENDANUBE_STORE_ID', '');
define('TIENDANUBE_ACCESS_TOKEN', '');
define('TIENDANUBE_USER_AGENT', 'Fudre-Administracion (fran.e.negri@gmail.com)');

// ---- Webhook de Tiendanube ----
// String random largo, se configura como query param ?secret=... en la URL del webhook en Tiendanube.
// Generar con: php -r "echo bin2hex(random_bytes(24)), PHP_EOL;"
define('WEBHOOK_SECRET', 'REEMPLAZAR_CON_STRING_RANDOM');

// ---- Anthropic / Claude (import con IA) ----
define('ANTHROPIC_API_KEY', '');
define('CLAUDE_MODEL', 'claude-sonnet-4-6');

// ---- SMTP (email de bienvenida) ----
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', '');
define('SMTP_PASS', '');
define('SMTP_FROM_EMAIL', '');
define('SMTP_FROM_NAME', 'Fudre Wine Club');

// ---- Archivos / URLs públicas ----
// Base pública de este backend (sin barra final), usada para armar URLs de imágenes.
define('SERVER_BASE_URL', 'http://localhost:8000');
define('UPLOADS_DIR', __DIR__ . '/uploads');
define('LOGS_DIR', __DIR__ . '/logs');
