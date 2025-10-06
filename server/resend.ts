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

export async function sendVerificationEmail(to: string, verificationCode: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Código de verificación - HomesApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Bienvenido a HomesApp</h2>
          <p>Gracias por registrarte en nuestra plataforma de gestión inmobiliaria.</p>
          <p>Tu código de verificación es:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${verificationCode}</span>
            </div>
          </div>
          <p>Ingresa este código en la página de verificación para activar tu cuenta.</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Este código expirará en 15 minutos.</p>
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

export async function sendLeadVerificationEmail(to: string, firstName: string, verificationLink: string) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Confirma tu interés - HomesApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Hola ${firstName},</h2>
          <p>Gracias por tu interés en nuestras propiedades.</p>
          <p>Para poder ponernos en contacto contigo y enviarte información sobre propiedades que te puedan interesar, por favor confirma tu correo electrónico:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Confirmar correo electrónico
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
          <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">${verificationLink}</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">Si no solicitaste información sobre propiedades, puedes ignorar este email.</p>
        </div>
      `,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending lead verification email:', error);
    throw error;
  }
}

export async function sendDuplicateLeadNotification(
  to: string,
  sellerName: string,
  leadName: string,
  newSellerName: string,
  propertiesOffered: string[]
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const propertiesList = propertiesOffered.length > 0
      ? `<ul>${propertiesOffered.map(p => `<li>${p}</li>`).join('')}</ul>`
      : '<p>No has ofrecido propiedades a este lead aún.</p>';
    
    const result = await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Notificación: Lead duplicado detectado - HomesApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Lead Duplicado Detectado</h2>
          <p>Hola ${sellerName},</p>
          <p>Te informamos que el lead <strong>${leadName}</strong> que registraste anteriormente ha sido registrado nuevamente por <strong>${newSellerName}</strong>.</p>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>Propiedades que has ofrecido a este lead:</strong></p>
            ${propertiesList}
          </div>
          
          <p>Como fuiste el primero en registrar este lead, mantiene tu seguimiento y comisión potencial.</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Ingresa al sistema para ver más detalles.</p>
        </div>
      `,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending duplicate lead notification:', error);
    throw error;
  }
}

export async function sendOwnerReferralVerificationEmail(
  to: string,
  ownerFirstName: string,
  sellerName: string,
  propertyAddress: string,
  verificationLink: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Confirma tu referido de propiedad - HomesApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Hola ${ownerFirstName},</h2>
          <p><strong>${sellerName}</strong> te ha referido a HomesApp como propietario interesado en enlistar tu propiedad.</p>
          
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1e293b;"><strong>Propiedad:</strong></p>
            <p style="margin: 5px 0;">${propertyAddress}</p>
          </div>
          
          <p>Para confirmar tu interés en enlistar tu propiedad con HomesApp, por favor haz clic en el siguiente enlace:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Confirmar interés en enlistar propiedad
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
          <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">${verificationLink}</p>
          
          <p><strong>Beneficios de enlistar con HomesApp:</strong></p>
          <ul>
            <li>Exposición a miles de clientes potenciales</li>
            <li>Gestión profesional de tu propiedad</li>
            <li>Proceso de renta o venta simplificado</li>
            <li>Comisión competitiva del 20%</li>
          </ul>
          
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">Si no estás interesado en enlistar tu propiedad, puedes ignorar este email.</p>
        </div>
      `,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending owner referral verification email:', error);
    throw error;
  }
}

export async function sendOwnerReferralApprovedNotification(
  to: string,
  sellerName: string,
  ownerName: string,
  propertyAddress: string,
  commissionAmount: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to,
      subject: '¡Comisión de referido aprobada! - HomesApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">¡Felicitaciones ${sellerName}!</h2>
          <p>Tu comisión por referido de propietario ha sido aprobada.</p>
          
          <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46;"><strong>Detalles del referido:</strong></p>
            <p style="margin: 10px 0; color: #065f46;"><strong>Propietario:</strong> ${ownerName}</p>
            <p style="margin: 5px 0; color: #065f46;"><strong>Propiedad:</strong> ${propertyAddress}</p>
            <p style="margin: 10px 0; color: #065f46; font-size: 20px;"><strong>Comisión aprobada: $${commissionAmount}</strong></p>
          </div>
          
          <p>La comisión será procesada en el siguiente ciclo de pagos.</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Gracias por tu esfuerzo en traer nuevos propietarios a HomesApp.</p>
        </div>
      `,
    });
    
    return result;
  } catch (error) {
    console.error('Error sending owner referral approved notification:', error);
    throw error;
  }
}
