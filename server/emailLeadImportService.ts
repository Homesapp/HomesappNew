import { google } from 'googleapis';
import { db } from './db';
import { 
  externalLeadEmailSources, 
  externalLeadEmailImportLogs,
  externalLeads,
  ExternalLeadEmailSource
} from '@shared/schema';
import { eq, and, or, ilike, sql } from 'drizzle-orm';

let connectionSettings: any;

async function getAccessToken(): Promise<string> {
  if (connectionSettings && connectionSettings.settings?.expires_at && 
      new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || 
                      connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getGmailClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export interface ParsedLead {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  message?: string;
  propertyInterest?: string;
  source: string;
}

interface EmailParser {
  provider: string;
  parse(emailContent: string, emailSubject: string): ParsedLead | null;
}

class TokkoEmailParser implements EmailParser {
  provider = 'tokko';
  
  parse(emailContent: string, emailSubject: string): ParsedLead | null {
    try {
      const lines = emailContent.split('\n').map(l => l.trim()).filter(Boolean);
      
      let firstName = '';
      let lastName = '';
      let email = '';
      let phone = '';
      let message = '';
      let propertyInterest = '';
      
      for (const line of lines) {
        if (line.toLowerCase().includes('nombre:') || line.toLowerCase().includes('name:')) {
          const fullName = line.split(':').slice(1).join(':').trim();
          const nameParts = fullName.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        if (line.toLowerCase().includes('email:') || line.toLowerCase().includes('correo:') || 
            line.toLowerCase().includes('mail:')) {
          email = line.split(':').slice(1).join(':').trim();
        }
        
        if (line.toLowerCase().includes('tel') || line.toLowerCase().includes('phone') || 
            line.toLowerCase().includes('celular') || line.toLowerCase().includes('móvil')) {
          phone = line.split(':').slice(1).join(':').trim().replace(/\D/g, '');
        }
        
        if (line.toLowerCase().includes('mensaje:') || line.toLowerCase().includes('comentario:') ||
            line.toLowerCase().includes('message:') || line.toLowerCase().includes('comment:')) {
          message = line.split(':').slice(1).join(':').trim();
        }
        
        if (line.toLowerCase().includes('propiedad:') || line.toLowerCase().includes('property:') ||
            line.toLowerCase().includes('inmueble:')) {
          propertyInterest = line.split(':').slice(1).join(':').trim();
        }
      }
      
      const emailMatch = emailContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (!email && emailMatch) {
        email = emailMatch[0];
      }
      
      const phoneMatch = emailContent.match(/(?:\+?[\d\s\-\(\)]{8,})/);
      if (!phone && phoneMatch) {
        phone = phoneMatch[0].replace(/\D/g, '');
      }
      
      if (!firstName) {
        const nameMatch = emailContent.match(/(?:de|from|nombre|name)[\s:]+([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+)/i);
        if (nameMatch) {
          const nameParts = nameMatch[1].trim().split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
      }
      
      if (!firstName && !lastName) {
        return null;
      }
      
      if (emailSubject) {
        const propertyMatch = emailSubject.match(/(?:propiedad|property|inmueble)[\s:#]+(.+)/i);
        if (propertyMatch && !propertyInterest) {
          propertyInterest = propertyMatch[1].trim();
        }
      }
      
      return {
        firstName: firstName || 'Sin nombre',
        lastName: lastName || '',
        email: email || undefined,
        phone: phone || undefined,
        message: message || undefined,
        propertyInterest: propertyInterest || undefined,
        source: 'Tokko Broker'
      };
    } catch (error) {
      console.error('Error parsing Tokko email:', error);
      return null;
    }
  }
}

class EasyBrokerEmailParser implements EmailParser {
  provider = 'easybroker';
  
  parse(emailContent: string, emailSubject: string): ParsedLead | null {
    try {
      const lines = emailContent.split('\n').map(l => l.trim()).filter(Boolean);
      
      let firstName = '';
      let lastName = '';
      let email = '';
      let phone = '';
      let message = '';
      let propertyInterest = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.toLowerCase().includes('nombre') || line.toLowerCase().includes('name')) {
          const nextLine = lines[i + 1];
          if (nextLine && !nextLine.includes(':')) {
            const nameParts = nextLine.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          } else {
            const fullName = line.split(':').slice(1).join(':').trim();
            if (fullName) {
              const nameParts = fullName.split(' ');
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }
          }
        }
        
        if (line.toLowerCase().includes('email') || line.toLowerCase().includes('correo')) {
          const emailInLine = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailInLine) {
            email = emailInLine[0];
          } else if (lines[i + 1]) {
            const emailInNext = lines[i + 1].match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailInNext) {
              email = emailInNext[0];
            }
          }
        }
        
        if (line.toLowerCase().includes('tel') || line.toLowerCase().includes('phone') ||
            line.toLowerCase().includes('celular') || line.toLowerCase().includes('whatsapp')) {
          const phoneInLine = line.match(/[\d\s\-\(\)\+]{8,}/);
          if (phoneInLine) {
            phone = phoneInLine[0].replace(/\D/g, '');
          } else if (lines[i + 1]) {
            const phoneInNext = lines[i + 1].match(/[\d\s\-\(\)\+]{8,}/);
            if (phoneInNext) {
              phone = phoneInNext[0].replace(/\D/g, '');
            }
          }
        }
        
        if (line.toLowerCase().includes('mensaje') || line.toLowerCase().includes('comentario') ||
            line.toLowerCase().includes('message')) {
          message = line.split(':').slice(1).join(':').trim();
          if (!message && lines[i + 1]) {
            message = lines[i + 1].trim();
          }
        }
        
        if (line.toLowerCase().includes('propiedad') || line.toLowerCase().includes('property') ||
            line.toLowerCase().includes('interesado en')) {
          propertyInterest = line.split(':').slice(1).join(':').trim();
          if (!propertyInterest) {
            const propMatch = line.match(/(?:interesado en|interested in)[\s:]+(.+)/i);
            if (propMatch) {
              propertyInterest = propMatch[1].trim();
            }
          }
        }
      }
      
      if (!email) {
        const emailMatch = emailContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch && !emailMatch[0].includes('easybroker') && !emailMatch[0].includes('noreply')) {
          email = emailMatch[0];
        }
      }
      
      if (!phone) {
        const phoneMatch = emailContent.match(/(?:\+?[\d\s\-\(\)]{10,})/);
        if (phoneMatch) {
          phone = phoneMatch[0].replace(/\D/g, '');
        }
      }
      
      if (!firstName && !lastName) {
        return null;
      }
      
      if (emailSubject && !propertyInterest) {
        const propMatch = emailSubject.match(/(?:EB-\w+|propiedad|property)[\s:#-]*(.+)?/i);
        if (propMatch) {
          propertyInterest = propMatch[0].trim();
        }
      }
      
      return {
        firstName: firstName || 'Sin nombre',
        lastName: lastName || '',
        email: email || undefined,
        phone: phone || undefined,
        message: message || undefined,
        propertyInterest: propertyInterest || undefined,
        source: 'EasyBroker'
      };
    } catch (error) {
      console.error('Error parsing EasyBroker email:', error);
      return null;
    }
  }
}

class GenericEmailParser implements EmailParser {
  provider = 'other';
  
  parse(emailContent: string, emailSubject: string): ParsedLead | null {
    try {
      let firstName = '';
      let lastName = '';
      let email = '';
      let phone = '';
      let message = '';
      
      const emailMatch = emailContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emailMatch) {
        for (const em of emailMatch) {
          if (!em.includes('noreply') && !em.includes('no-reply') && 
              !em.includes('notifications') && !em.includes('mailer')) {
            email = em;
            break;
          }
        }
      }
      
      const phoneMatch = emailContent.match(/(?:\+?[\d\s\-\(\)]{10,})/);
      if (phoneMatch) {
        phone = phoneMatch[0].replace(/\D/g, '');
      }
      
      const namePatterns = [
        /(?:nombre|name|de|from)[\s:]+([A-Za-zÁÉÍÓÚáéíóúñÑ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+)*)/i,
        /([A-Za-zÁÉÍÓÚáéíóúñÑ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+)*)\s+(?:está|quiere|desea|consulta)/i,
      ];
      
      for (const pattern of namePatterns) {
        const match = emailContent.match(pattern);
        if (match) {
          const nameParts = match[1].trim().split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
          break;
        }
      }
      
      if (!firstName && !lastName) {
        return null;
      }
      
      return {
        firstName: firstName || 'Sin nombre',
        lastName: lastName || '',
        email: email || undefined,
        phone: phone || undefined,
        message: message || undefined,
        source: 'Email Import'
      };
    } catch (error) {
      console.error('Error parsing generic email:', error);
      return null;
    }
  }
}

const parsers: { [key: string]: EmailParser } = {
  tokko: new TokkoEmailParser(),
  easybroker: new EasyBrokerEmailParser(),
  inmuebles24: new GenericEmailParser(),
  mercadolibre: new GenericEmailParser(),
  other: new GenericEmailParser(),
};

function normalizePhoneForComparison(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits.length >= 4 ? digits : null;
}

function normalizeNameForComparison(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function checkDuplicate(
  agencyId: string, 
  parsedLead: ParsedLead
): Promise<{ isDuplicate: boolean; duplicateLeadId?: string; reason?: string }> {
  const normalizedPhone = normalizePhoneForComparison(parsedLead.phone);
  const normalizedName = normalizeNameForComparison(parsedLead.firstName, parsedLead.lastName);
  
  if (normalizedPhone) {
    const [existingByPhone] = await db
      .select({ id: externalLeads.id })
      .from(externalLeads)
      .where(and(
        eq(externalLeads.agencyId, agencyId),
        or(
          sql`RIGHT(REPLACE(${externalLeads.phone}, ' ', ''), 10) = ${normalizedPhone}`,
          eq(externalLeads.phoneLast4, normalizedPhone.slice(-4))
        )
      ))
      .limit(1);
    
    if (existingByPhone) {
      return { 
        isDuplicate: true, 
        duplicateLeadId: existingByPhone.id, 
        reason: 'matching_phone' 
      };
    }
  }
  
  if (parsedLead.email) {
    const [existingByEmailName] = await db
      .select({ id: externalLeads.id })
      .from(externalLeads)
      .where(and(
        eq(externalLeads.agencyId, agencyId),
        ilike(externalLeads.email, parsedLead.email),
        sql`LOWER(CONCAT(${externalLeads.firstName}, ' ', ${externalLeads.lastName})) = ${normalizedName}`
      ))
      .limit(1);
    
    if (existingByEmailName) {
      return { 
        isDuplicate: true, 
        duplicateLeadId: existingByEmailName.id, 
        reason: 'matching_email_name' 
      };
    }
  }
  
  return { isDuplicate: false };
}

async function createLeadFromEmail(
  agencyId: string,
  source: ExternalLeadEmailSource,
  parsedLead: ParsedLead
): Promise<string> {
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + 3);
  
  const [newLead] = await db.insert(externalLeads).values({
    agencyId,
    registrationType: source.defaultRegistrationType || 'seller',
    firstName: parsedLead.firstName,
    lastName: parsedLead.lastName,
    email: parsedLead.email,
    phone: parsedLead.phone,
    phoneLast4: parsedLead.phone ? parsedLead.phone.slice(-4) : null,
    source: parsedLead.source || source.defaultSource || 'email_import',
    notes: parsedLead.message ? `Mensaje original: ${parsedLead.message}` : undefined,
    desiredProperty: parsedLead.propertyInterest,
    sellerId: source.defaultSellerId,
    status: 'nuevo_lead',
    validUntil,
    firstContactDate: new Date(),
    createdBy: source.defaultSellerId,
  }).returning({ id: externalLeads.id });
  
  return newLead.id;
}

function decodeEmailContent(payload: any): string {
  let content = '';
  
  if (payload.body?.data) {
    content = Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        content = Buffer.from(part.body.data, 'base64').toString('utf-8');
        break;
      }
      if (part.mimeType === 'text/html' && part.body?.data && !content) {
        const htmlContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
        content = htmlContent.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\n+/g, '\n');
      }
      if (part.parts) {
        content = decodeEmailContent(part) || content;
      }
    }
  }
  
  return content;
}

export async function processEmailsForAgency(
  agencyId: string,
  source: ExternalLeadEmailSource
): Promise<{ imported: number; duplicates: number; errors: number }> {
  const result = { imported: 0, duplicates: 0, errors: 0 };
  
  try {
    const gmail = await getGmailClient();
    
    const senderQuery = source.senderEmails.map(e => `from:${e}`).join(' OR ');
    // Only check emails from the last 1 hour for better performance
    const oneHourAgo = Math.floor(Date.now() / 1000) - 60 * 60;
    const query = `(${senderQuery}) after:${oneHourAgo}`;
    
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20, // Reduced for performance
    });
    
    const messages = listResponse.data.messages || [];
    let latestMessageId = source.lastSyncMessageId;
    
    for (const messageInfo of messages) {
      if (!messageInfo.id) continue;
      
      if (source.lastSyncMessageId && messageInfo.id === source.lastSyncMessageId) {
        break;
      }
      
      const [existingLog] = await db
        .select({ id: externalLeadEmailImportLogs.id })
        .from(externalLeadEmailImportLogs)
        .where(and(
          eq(externalLeadEmailImportLogs.agencyId, agencyId),
          eq(externalLeadEmailImportLogs.gmailMessageId, messageInfo.id)
        ))
        .limit(1);
      
      if (existingLog) {
        continue;
      }
      
      try {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: messageInfo.id,
          format: 'full',
        });
        
        const headers = message.data.payload?.headers || [];
        const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
        const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
        const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value;
        const emailDate = dateHeader ? new Date(dateHeader) : undefined;
        
        const content = decodeEmailContent(message.data.payload);
        
        const parser = parsers[source.provider] || parsers.other;
        const parsedLead = parser.parse(content, subject);
        
        if (!parsedLead) {
          await db.insert(externalLeadEmailImportLogs).values({
            agencyId,
            sourceId: source.id,
            gmailMessageId: messageInfo.id,
            gmailThreadId: message.data.threadId || undefined,
            emailSubject: subject,
            emailFrom: from,
            emailDate,
            status: 'parse_error',
            errorMessage: 'Could not extract lead information from email',
          });
          result.errors++;
          continue;
        }
        
        const duplicate = await checkDuplicate(agencyId, parsedLead);
        
        if (duplicate.isDuplicate) {
          await db.insert(externalLeadEmailImportLogs).values({
            agencyId,
            sourceId: source.id,
            gmailMessageId: messageInfo.id,
            gmailThreadId: message.data.threadId || undefined,
            emailSubject: subject,
            emailFrom: from,
            emailDate,
            status: 'duplicate',
            parsedData: parsedLead,
            duplicateOfLeadId: duplicate.duplicateLeadId,
            duplicateReason: duplicate.reason,
          });
          result.duplicates++;
          continue;
        }
        
        const leadId = await createLeadFromEmail(agencyId, source, parsedLead);
        
        await db.insert(externalLeadEmailImportLogs).values({
          agencyId,
          sourceId: source.id,
          gmailMessageId: messageInfo.id,
          gmailThreadId: message.data.threadId || undefined,
          emailSubject: subject,
          emailFrom: from,
          emailDate,
          status: 'success',
          leadId,
          parsedData: parsedLead,
        });
        
        result.imported++;
        
        if (!latestMessageId) {
          latestMessageId = messageInfo.id;
        }
        
      } catch (messageError) {
        console.error(`Error processing message ${messageInfo.id}:`, messageError);
        
        await db.insert(externalLeadEmailImportLogs).values({
          agencyId,
          sourceId: source.id,
          gmailMessageId: messageInfo.id,
          status: 'parse_error',
          errorMessage: messageError instanceof Error ? messageError.message : 'Unknown error',
        });
        result.errors++;
      }
    }
    
    await db.update(externalLeadEmailSources)
      .set({
        lastSyncAt: new Date(),
        lastSyncMessageId: latestMessageId || source.lastSyncMessageId,
        totalImported: sql`${externalLeadEmailSources.totalImported} + ${result.imported}`,
        totalDuplicates: sql`${externalLeadEmailSources.totalDuplicates} + ${result.duplicates}`,
        totalErrors: sql`${externalLeadEmailSources.totalErrors} + ${result.errors}`,
        updatedAt: new Date(),
      })
      .where(eq(externalLeadEmailSources.id, source.id));
    
  } catch (error) {
    console.error(`Error processing emails for source ${source.id}:`, error);
    throw error;
  }
  
  return result;
}

export async function runEmailImportForAgency(agencyId: string): Promise<{ imported: number; duplicates: number; errors: number }> {
  console.log(`[Email Import] Running manual import for agency ${agencyId}...`);
  
  const activeSources = await db
    .select()
    .from(externalLeadEmailSources)
    .where(and(
      eq(externalLeadEmailSources.agencyId, agencyId),
      eq(externalLeadEmailSources.isActive, true)
    ));
  
  const totals = { imported: 0, duplicates: 0, errors: 0 };
  
  for (const source of activeSources) {
    try {
      const result = await processEmailsForAgency(agencyId, source);
      totals.imported += result.imported;
      totals.duplicates += result.duplicates;
      totals.errors += result.errors;
    } catch (error) {
      console.error(`[Email Import] Error processing source ${source.id}:`, error);
      totals.errors++;
    }
  }
  
  console.log(`[Email Import] Manual import completed: imported=${totals.imported}, duplicates=${totals.duplicates}, errors=${totals.errors}`);
  return totals;
}

export async function runEmailImportForAllAgencies(): Promise<void> {
  console.log('[Email Import] Starting scheduled email import run...');
  
  const activeSources = await db
    .select()
    .from(externalLeadEmailSources)
    .where(eq(externalLeadEmailSources.isActive, true));
  
  console.log(`[Email Import] Found ${activeSources.length} active email sources`);
  
  for (const source of activeSources) {
    try {
      console.log(`[Email Import] Processing source: ${source.providerName} (${source.provider}) for agency ${source.agencyId}`);
      const result = await processEmailsForAgency(source.agencyId, source);
      console.log(`[Email Import] Source ${source.id}: imported=${result.imported}, duplicates=${result.duplicates}, errors=${result.errors}`);
    } catch (error) {
      console.error(`[Email Import] Error processing source ${source.id}:`, error);
    }
  }
  
  console.log('[Email Import] Completed scheduled email import run');
}

export async function testGmailConnection(): Promise<boolean> {
  try {
    const gmail = await getGmailClient();
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log(`[Gmail] Connected as: ${profile.data.emailAddress}`);
    return true;
  } catch (error) {
    console.error('[Gmail] Connection test failed:', error);
    return false;
  }
}
