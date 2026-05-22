import { Resend } from "resend";

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const CLINIC_NAME = "Clínica Colinas";

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error("RESEND_API_KEY environment variable is not configured");
    }
    return new Resend(apiKey);
};

export class EmailService {
    static async sendPasswordResetEmail(
        to: string,
        resetToken: string,
        userName?: string
    ): Promise<void> {
        const resend = getResendClient();
        const resetLink = `${APP_URL}/recuperar-password/nueva?token=${resetToken}`;
        const displayName = userName || to;

        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `Recuperación de contraseña — ${CLINIC_NAME}`,
            html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recuperar contraseña</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f1;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2e1a 0%,#2d4a2d 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#a3e635;letter-spacing:-0.5px;">${CLINIC_NAME}</p>
              <p style="margin:8px 0 0;font-size:13px;color:#86efac;font-weight:500;text-transform:uppercase;letter-spacing:0.1em;">Sistema de Gestión</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;">Recuperar contraseña</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Hola <strong style="color:#111827;">${displayName}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace es válido por <strong style="color:#111827;">1 hora</strong>.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                       style="display:inline-block;background:#65a30d;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:50px;letter-spacing:0.02em;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Link fallback -->
              <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
                <a href="${resetLink}" style="color:#65a30d;word-break:break-all;">${resetLink}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Si no solicitaste este cambio, ignora este correo. Tu contraseña no será modificada.<br />
                Este es un mensaje automático, por favor no respondas a este correo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        });

        if (error) {
            console.error("Error sending password reset email:", error);
            throw new Error("No se pudo enviar el correo de recuperación");
        }
    }
}
