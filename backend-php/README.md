# Fudre Backend PHP

Backend plano en PHP (sin framework, sin Composer) pensado para correr en hosting
compartido con cPanel. Reemplaza al backend Java (Spring Boot) y al `import_service`
Python — ver `../.claude/plans/concurrent-wobbling-sketch.md` (o el mensaje del
asistente que armó este backend) para el detalle de decisiones de arquitectura.

## Requisitos del hosting

- PHP 8.0+ con extensiones: `pdo_mysql`, `curl`, `zip`, `simplexml`, `gd` o `fileinfo` (estándar en cualquier cPanel).
- MySQL + phpMyAdmin.
- Apache con soporte de `.htaccess` (`mod_rewrite`) — estándar en cPanel.
- **No requiere** Terminal/SSH ni Composer.

## Primer deploy

1. **Base de datos**: en phpMyAdmin, crear una base de datos y correr `db/schema.sql` una sola vez (o, si ya existe la base del backend Java, solo crear la tabla `admin_sessions` — está al final del archivo).
2. **Config**: copiar `config.example.php` a `config.php` y completar:
   - Credenciales de MySQL (las mismas que configuraste en cPanel → "Bases de datos MySQL").
   - `ADMIN_PASSWORD_HASH`: generar localmente con PHP:
     ```
     php -r "echo password_hash('tu-password', PASSWORD_BCRYPT), PHP_EOL;"
     ```
   - `WEBHOOK_SECRET`: generar con `php -r "echo bin2hex(random_bytes(24)), PHP_EOL;"` y configurar esa misma URL con `?secret=...` en el panel de webhooks de Tiendanube.
   - `CORS_ALLOWED_ORIGIN`: el dominio exacto donde vayas a servir el frontend (sin barra final).
   - `SERVER_BASE_URL`: la URL pública de este backend (donde vive `index.php`).
   - Credenciales de Tiendanube, Anthropic (Claude) y SMTP.
3. **Subir archivos**: por FTP o el File Manager de cPanel, subir toda la carpeta `backend-php/` a donde quieras exponerla (ej. un subdominio `api.tudominio.com` apuntando a esta carpeta, o `tudominio.com/api/`).
4. **Permisos**: asegurar que `uploads/` y `logs/` sean escribibles por PHP (normalmente 755 alcanza en cPanel).
5. Probar `GET /health` → debería responder `{"status":"ok"}`.

## PHPMailer (email de bienvenida de la encuesta)

El envío de mail usa SMTP con autenticación (Gmail), que `mail()` nativo de PHP no soporta
bien. Para que funcione de verdad, hay que "vendorear" PHPMailer a mano (sin Composer):

1. Descargar el ZIP de la última release desde `https://github.com/PHPMailer/PHPMailer/releases`.
2. Extraer y copiar la carpeta `src/` a `backend-php/vendor-manual/PHPMailer/src/` (deben quedar `PHPMailer.php`, `SMTP.php`, `Exception.php` ahí adentro).
3. Listo — `lib/Mailer.php` lo detecta automáticamente. Si no está presente, cae a `mail()` nativo sin autenticación (probablemente no entregue a Gmail, pero no rompe el resto de la app).

## Notas sobre paridad con el backend Java

- El contrato de API (paths, campos JSON, formatos de fecha, enums) se mantiene igual para no romper el frontend existente.
- El patrón "local primero, Tiendanube best-effort" se mantiene: cualquier fallo de Tiendanube se loguea en `logs/app.log` y nunca bloquea la operación local.
- El import de PDF ya no pre-extrae texto/tablas ni imágenes embebidas (como hacía `pdfplumber`/`PyMuPDF` en Python) — se manda el PDF entero a Claude, que lo lee nativamente. Los `.xlsx` se leen con un parser propio minimalista (sin librerías externas); los `.xls` binarios legados no están soportados, pedir exportar a `.xlsx` o `.csv`.
- `/api/members` y sus sub-rutas quedan **sin login** a pedido explícito del usuario (la página `/survey` del frontend es pública/demo y los usa) — todo el resto del panel sí exige `Authorization: Bearer <token>`.

## Login

- `POST /auth/login` `{"password": "..."}` → `{"token": "..."}`.
- Mandar `Authorization: Bearer <token>` en todos los demás requests (el frontend ya lo hace automáticamente).
- `POST /auth/logout` invalida el token actual.
