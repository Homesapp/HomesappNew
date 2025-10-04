import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getUncachableResendClient() {
  const { apiKey } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function sendVerificationEmail(to: string, verificationToken: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const verificationUrl = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
    
    const result = await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Verifica tu cuenta - HomesApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Bienvenido a HomesApp</h2>
          <p>Gracias por registrarte en nuestra plataforma de gestión inmobiliaria.</p>
          <p>Para completar tu registro y activar tu cuenta, por favor verifica tu dirección de correo electrónico haciendo clic en el siguiente botón:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verificar mi email
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #64748b; font-size: 12px;">${verificationUrl}</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Este enlace expirará en 24 horas.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">Si no creaste esta cuenta, puedes ignorar este email.</p>
        </div>
      `,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}
