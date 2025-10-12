import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!hostname) {
    console.error('Gmail config error: REPLIT_CONNECTORS_HOSTNAME not found');
    throw new Error('Gmail integration not configured: REPLIT_CONNECTORS_HOSTNAME missing');
  }

  if (!xReplitToken) {
    console.error('Gmail config error: Neither REPL_IDENTITY nor WEB_REPL_RENEWAL found');
    console.error('Environment:', process.env.NODE_ENV);
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('REPL')));
    throw new Error('Gmail integration not configured: Missing authentication token (REPL_IDENTITY or WEB_REPL_RENEWAL)');
  }

  const connectorUrl = 'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail';
  console.log(`Fetching Gmail connection from: ${connectorUrl.replace(/\?.*/, '?...')}`);

  try {
    const response = await fetch(connectorUrl, {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    });

    if (!response.ok) {
      console.error(`Gmail connector API returned ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.error('Response body:', errorText);
      throw new Error(`Gmail connector API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    connectionSettings = data.items?.[0];

    if (!connectionSettings) {
      console.error('No Gmail connection found in API response');
      console.error('Number of items in response:', data.items?.length || 0);
      throw new Error('Gmail not connected - no connection found in Replit');
    }

    const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

    if (!accessToken) {
      console.error('No access token found in connection settings');
      console.error('Available settings keys:', Object.keys(connectionSettings?.settings || {}));
      throw new Error('Gmail not connected - no access token available');
    }

    console.log('Gmail access token retrieved successfully');
    return accessToken;
  } catch (error) {
    console.error('Error fetching Gmail connection:', error);
    throw error;
  }
}

export async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

function createEmailMessage(to: string, subject: string, htmlContent: string): string {
  // Encode subject using RFC 2047 MIME encoded-word format for UTF-8
  const encodedSubject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  
  const emailLines = [
    'From: HomesApp <me>',
    `To: ${to}`,
    'Content-Type: text/html; charset=UTF-8',
    'MIME-Version: 1.0',
    `Subject: ${encodedSubject}`,
    '',
    htmlContent
  ];
  
  const email = emailLines.join('\n');
  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendVerificationEmail(to: string, verificationCode: string) {
  try {
    console.log(`Attempting to send verification email via Gmail to ${to} with code ${verificationCode}`);
    const gmail = await getUncachableGmailClient();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Bienvenido a HomesApp</h2>
        <p>Gracias por registrarte en nuestra plataforma de gestion inmobiliaria.</p>
        <p>Tu codigo de verificacion es:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${verificationCode}</span>
          </div>
        </div>
        <p>Ingresa este codigo en la pagina de verificacion para activar tu cuenta.</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Este codigo expirara en 15 minutos.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">Si no creaste esta cuenta, puedes ignorar este email.</p>
      </div>
    `;
    
    const encodedMessage = createEmailMessage(to, 'Codigo de verificacion - HomesApp', htmlContent);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    console.log('Gmail verification email sent successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending verification email via Gmail:', error);
    throw error;
  }
}

export async function sendLeadVerificationEmail(to: string, firstName: string, verificationLink: string) {
  try {
    const gmail = await getUncachableGmailClient();
    
    const htmlContent = `
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
    `;
    
    const encodedMessage = createEmailMessage(to, 'Confirma tu interés - HomesApp', htmlContent);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    return result.data;
  } catch (error) {
    console.error('Error sending lead verification email via Gmail:', error);
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
    const gmail = await getUncachableGmailClient();
    
    const propertiesList = propertiesOffered.length > 0
      ? `<ul>${propertiesOffered.map(p => `<li>${p}</li>`).join('')}</ul>`
      : '<p>No has ofrecido propiedades a este lead aún.</p>';
    
    const htmlContent = `
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
    `;
    
    const encodedMessage = createEmailMessage(to, 'Notificación: Lead duplicado detectado - HomesApp', htmlContent);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    return result.data;
  } catch (error) {
    console.error('Error sending duplicate lead notification via Gmail:', error);
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
    const gmail = await getUncachableGmailClient();
    
    const htmlContent = `
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
    `;
    
    const encodedMessage = createEmailMessage(to, 'Confirma tu referido de propiedad - HomesApp', htmlContent);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    return result.data;
  } catch (error) {
    console.error('Error sending owner referral verification email via Gmail:', error);
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
    const gmail = await getUncachableGmailClient();
    
    const htmlContent = `
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
    `;
    
    const encodedMessage = createEmailMessage(to, '¡Comisión de referido aprobada! - HomesApp', htmlContent);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    return result.data;
  } catch (error) {
    console.error('Error sending owner referral approved notification via Gmail:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetLink: string
) {
  try {
    console.log(`Attempting to send password reset email via Gmail to ${to}`);
    const gmail = await getUncachableGmailClient();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Restablece tu contraseña</h2>
        <p>Hola ${userName},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña en HomesApp.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Restablecer contraseña
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
        <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">${resetLink}</p>
        
        <p style="color: #dc2626; font-size: 14px; margin-top: 30px;">Este enlace expirará en 1 hora por seguridad.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">Si no solicitaste restablecer tu contraseña, puedes ignorar este email. Tu contraseña no será cambiada.</p>
      </div>
    `;
    
    const encodedMessage = createEmailMessage(to, 'Restablece tu contraseña - HomesApp', htmlContent);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    console.log('Gmail password reset email sent successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending password reset email via Gmail:', error);
    throw error;
  }
}

export async function sendOfferLinkEmail(
  to: string,
  clientName: string,
  propertyTitle: string,
  offerLink: string
) {
  try {
    console.log(`Attempting to send offer link email via Gmail to ${to}`);
    const gmail = await getUncachableGmailClient();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e293b; margin: 0; font-size: 28px;">HomesApp</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Tulum Rental Homes</p>
        </div>
        
        <h2 style="color: #1e293b;">¡Hola ${clientName}!</h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Gracias por tu interés en <strong>${propertyTitle}</strong>. Nos complace que estés considerando esta propiedad para tu próximo hogar en Tulum.
        </p>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Hemos preparado un enlace privado para que puedas completar tu oferta de renta. Este proceso es rápido, seguro y te permitirá expresar tu interés formal en la propiedad.
        </p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${offerLink}" style="background-color: #3b82f6; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
            Completar mi oferta de renta
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
        <p style="color: #3b82f6; font-size: 14px; word-break: break-all; background-color: #f1f5f9; padding: 12px; border-radius: 6px;">${offerLink}</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⏰ Importante:</strong> Este enlace es válido por 24 horas. Completa tu oferta lo antes posible para asegurar tu interés en la propiedad.
          </p>
        </div>
        
        <h3 style="color: #1e293b; margin-top: 30px;">¿Qué incluye la oferta?</h3>
        <ul style="color: #475569; line-height: 1.8;">
          <li>Información personal y profesional</li>
          <li>Monto de renta ofertado y condiciones</li>
          <li>Fecha de ingreso deseada</li>
          <li>Servicios que deseas incluir</li>
        </ul>
        
        <p style="color: #475569; font-size: 16px; margin-top: 25px;">
          Una vez que recibamos tu oferta, nuestro equipo la revisará y te contactará lo antes posible para continuar con el proceso.
        </p>
        
        <div style="border-top: 1px solid #e2e8f0; margin-top: 35px; padding-top: 20px;">
          <p style="color: #64748b; font-size: 13px; margin: 5px 0;">
            Saludos cordiales,<br>
            <strong>El equipo de HomesApp</strong><br>
            Tulum Rental Homes ™
          </p>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; margin-top: 25px;">
          Si no solicitaste este enlace o no estás interesado en la propiedad, puedes ignorar este email de forma segura.
        </p>
      </div>
    `;
    
    const encodedMessage = createEmailMessage(to, `¡Genera tu oferta de renta para ${propertyTitle}! - HomesApp`, htmlContent);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    console.log('Gmail offer link email sent successfully:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error sending offer link email via Gmail:', error);
    throw error;
  }
}
