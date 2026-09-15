<?php

/** Envío de mails. Nunca lanza excepción hacia el caller (best-effort, igual que el original). */
class Mailer
{
    public static function sendSurveyWelcome(array $member): void
    {
        try {
            $firstName = explode(' ', trim($member['name']))[0];
            $subject = "¡Bienvenido/a a Fudre Wine Club, $firstName!";
            self::send($member['email'], $subject, self::buildWelcomeHtml($firstName));
        } catch (Throwable $e) {
            Logger::warn('No se pudo enviar el mail de bienvenida: ' . $e->getMessage());
        }
    }

    private static function send(string $to, string $subject, string $html): void
    {
        $phpMailerPath = __DIR__ . '/../vendor-manual/PHPMailer/src/PHPMailer.php';

        if (is_file($phpMailerPath)) {
            require_once $phpMailerPath;
            require_once __DIR__ . '/../vendor-manual/PHPMailer/src/SMTP.php';
            require_once __DIR__ . '/../vendor-manual/PHPMailer/src/Exception.php';

            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = SMTP_HOST;
            $mail->SMTPAuth = true;
            $mail->Username = SMTP_USER;
            $mail->Password = SMTP_PASS;
            $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = SMTP_PORT;
            $mail->CharSet = 'UTF-8';
            $mail->setFrom(SMTP_FROM_EMAIL, SMTP_FROM_NAME);
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $html;
            $mail->send();
            return;
        }

        // Fallback sin PHPMailer vendoreado: mail() nativo (no soporta auth SMTP real).
        Logger::warn('PHPMailer no está en vendor-manual/PHPMailer — usando mail() nativo sin autenticación SMTP.');
        $headers = "MIME-Version: 1.0\r\nContent-type: text/html; charset=UTF-8\r\nFrom: " . SMTP_FROM_NAME . ' <' . SMTP_FROM_EMAIL . ">\r\n";
        mail($to, $subject, $html, $headers);
    }

    private static function buildWelcomeHtml(string $firstName): string
    {
        return <<<HTML
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb; padding: 40px 0; font-family: Georgia, serif;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden;">
      <tr><td style="background:#111111; padding:24px; text-align:center;">
        <span style="color:#ffffff; letter-spacing:3px; font-size:20px;">FUDRE WINE CLUB</span>
      </td></tr>
      <tr><td style="padding:32px; color:#333333; font-size:16px; line-height:1.6;">
        <p>Hola, <strong>{$firstName}</strong> 🍷</p>
        <p>¡Gracias por completar la encuesta! Nuestro equipo va a revisar tus preferencias y pronto vas a recibir tu primera selección personalizada.</p>
        <hr style="border:none; border-top:1px solid #eee;">
        <p>Cualquier consulta, escribinos. ¡Salud! 🥂</p>
      </td></tr>
      <tr><td style="background:#7F654E; padding:16px; text-align:center; color:#ffffff; font-size:12px;">
        Fudre Wine Club · Argentina
      </td></tr>
    </table>
  </td></tr>
</table>
HTML;
    }
}
