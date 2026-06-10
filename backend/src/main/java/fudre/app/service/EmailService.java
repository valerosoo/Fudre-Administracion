package fudre.app.service;

import fudre.app.entity.Member;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${fudre.mail.from}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendSurveyWelcome(Member member) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromAddress, "Fudre Wine Club");
            helper.setTo(member.getEmail());
            helper.setSubject("¡Bienvenido/a a Fudre Wine Club, " + member.getName().split(" ")[0] + "!");
            helper.setText(buildHtml(member), true);
            mailSender.send(msg);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            // Log but don't fail the survey submission if email fails
            System.err.println("Error enviando mail de bienvenida a " + member.getEmail() + ": " + e.getMessage());
        }
    }

    private String buildHtml(Member member) {
        String firstName = member.getName().split(" ")[0];
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0;">
                <tr><td align="center">
                  <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

                    <!-- Header -->
                    <tr>
                      <td style="background:#111111;padding:32px 40px;text-align:center;">
                        <h1 style="color:#ffffff;margin:0;font-size:26px;letter-spacing:3px;font-weight:400;">
                          FUDRE WINE CLUB
                        </h1>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 40px 32px;">
                        <p style="font-size:20px;color:#333;margin:0 0 16px;">
                          Hola, <strong>%s</strong> 🍷
                        </p>
                        <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 20px;">
                          Gracias por completar tu encuesta de bienvenida. Ya tenemos todo lo que necesitamos
                          para seleccionar los vinos perfectos para vos cada mes.
                        </p>
                        <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 28px;">
                          Nuestro equipo va a revisar tus preferencias y pronto vas a recibir
                          tu primera selección personalizada de vinos.
                        </p>

                        <!-- Divider -->
                        <hr style="border:none;border-top:1px solid #e8ddd4;margin:0 0 28px;">

                        <p style="font-size:13px;color:#888;line-height:1.6;margin:0;">
                          Si tenés alguna pregunta podés responder este mail o contactarnos directamente.<br>
                          ¡Salud! 🥂
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#7F654E;padding:20px 40px;text-align:center;">
                        <p style="color:#fff;font-size:12px;margin:0;opacity:0.85;">
                          Fudre Wine Club · Argentina
                        </p>
                      </td>
                    </tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(firstName);
    }
}
