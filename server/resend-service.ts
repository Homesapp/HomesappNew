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
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || 'onboarding@resend.dev'
  };
}

export async function sendAccessCodeEmail(
  recipientEmail: string,
  recipientName: string,
  accessInfo: {
    condominiumName: string;
    unitNumber: string;
    accessType: string;
    accessCode: string;
    description?: string;
  }
) {
  const { client, fromEmail } = await getUncachableResendClient();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Access Code Information</h2>
      <p>Hello ${recipientName},</p>
      <p>You have been sent access code information for a property:</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Condominium:</strong> ${accessInfo.condominiumName}</p>
        <p style="margin: 5px 0;"><strong>Unit:</strong> ${accessInfo.unitNumber}</p>
        <p style="margin: 5px 0;"><strong>Access Type:</strong> ${accessInfo.accessType}</p>
        <p style="margin: 5px 0;"><strong>Code/Password:</strong> <code style="background-color: #e0e0e0; padding: 2px 6px; border-radius: 3px;">${accessInfo.accessCode}</code></p>
        ${accessInfo.description ? `<p style="margin: 5px 0;"><strong>Description:</strong> ${accessInfo.description}</p>` : ''}
      </div>
      <p style="color: #666; font-size: 12px;">This is an automated message from MISTIQ Tulum External Management System.</p>
    </div>
  `;

  const { data, error } = await client.emails.send({
    from: fromEmail,
    to: [recipientEmail],
    subject: `Access Code - ${accessInfo.condominiumName} Unit ${accessInfo.unitNumber}`,
    html: emailHtml,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
