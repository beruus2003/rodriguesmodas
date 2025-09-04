// server/email.service.ts
import nodemailer from 'nodemailer';

// Pega as credenciais que configuramos na Render
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const frontendUrl = process.env.FRONTEND_URL;

if (!emailUser || !emailPass || !frontendUrl) {
  console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.warn("!!! Variáveis de ambiente de e-mail não configuradas !!!");
  console.warn("!!! O envio de e-mail de verificação não funcionará    !!!");
  console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
}

// Configura o "carteiro" para usar o Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

// Função que cria e envia o e-mail de verificação
export async function sendVerificationEmail(to: string, token: string) {
  if (!emailUser || !emailPass || !frontendUrl) {
    console.log(`Simulando envio de e-mail para ${to} com token ${token}`);
    return;
  }

  const verificationLink = `${frontendUrl}/verificar-conta?token=${token}`;

  const mailOptions = {
    from: `"Rodrigues Modas" <${emailUser}>`,
    to: to,
    subject: 'Bem-vinda! Confirme seu e-mail na Rodrigues Modas',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #653F25;">Bem-vinda à Rodrigues Modas!</h2>
        <p>Estamos muito felizes por ter você conosco. Para começar a usar sua conta, por favor, confirme seu endereço de e-mail clicando no botão abaixo:</p>
        <a href="${verificationLink}" style="background-color: #653F25; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Confirmar Meu E-mail
        </a>
        <p>Se o botão não funcionar, você pode copiar e colar o seguinte link no seu navegador:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>Se você não criou esta conta, por favor, ignore este e-mail.</p>
        <p>Atenciosamente,<br>Equipe Rodrigues Modas</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`E-mail de verificação enviado para ${to}`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail de verificação para ${to}:`, error);
  }
}
