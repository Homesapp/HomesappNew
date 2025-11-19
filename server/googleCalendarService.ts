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

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Creates or updates a calendar event for a maintenance ticket
 * @param ticketId - The unique ID of the maintenance ticket
 * @param workerEmail - The Google Calendar email of the assigned worker
 * @param eventDetails - Details of the maintenance task
 */
export async function syncMaintenanceTicketToGoogleCalendar(
  ticketId: string,
  workerEmail: string,
  eventDetails: {
    title: string;
    description: string;
    location: string;
    startTime: Date;
    endTime: Date;
    accessInfo?: string;
    notes?: string;
  }
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const calendar = await getUncachableGoogleCalendarClient();

    // Build comprehensive event description
    const fullDescription = [
      eventDetails.description,
      '',
      eventDetails.accessInfo ? `🔑 Información de Acceso:\n${eventDetails.accessInfo}` : null,
      eventDetails.notes ? `📝 Notas:\n${eventDetails.notes}` : null,
      '',
      `🎫 Ticket ID: ${ticketId}`,
    ].filter(Boolean).join('\n');

    const event = {
      summary: eventDetails.title,
      location: eventDetails.location,
      description: fullDescription,
      start: {
        dateTime: eventDetails.startTime.toISOString(),
        timeZone: 'America/Cancun', // Tulum timezone
      },
      end: {
        dateTime: eventDetails.endTime.toISOString(),
        timeZone: 'America/Cancun',
      },
      attendees: [
        { email: workerEmail }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
      extendedProperties: {
        private: {
          ticketId: ticketId,
          source: 'homesapp-maintenance',
        },
      },
    };

    // Try to find existing event for this ticket
    const listResponse = await calendar.events.list({
      calendarId: workerEmail,
      privateExtendedProperty: [`ticketId=${ticketId}`],
      maxResults: 1,
    });

    if (listResponse.data.items && listResponse.data.items.length > 0) {
      // Update existing event
      const existingEvent = listResponse.data.items[0];
      const updateResponse = await calendar.events.update({
        calendarId: workerEmail,
        eventId: existingEvent.id!,
        requestBody: event,
      });

      return {
        success: true,
        eventId: updateResponse.data.id || undefined,
      };
    } else {
      // Create new event
      const createResponse = await calendar.events.insert({
        calendarId: workerEmail,
        requestBody: event,
        sendUpdates: 'all', // Send email notification to attendees
      });

      return {
        success: true,
        eventId: createResponse.data.id || undefined,
      };
    }
  } catch (error: any) {
    console.error('Error syncing to Google Calendar:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Deletes a calendar event for a maintenance ticket
 * @param ticketId - The unique ID of the maintenance ticket
 * @param workerEmail - The Google Calendar email of the worker
 */
export async function deleteMaintenanceTicketFromGoogleCalendar(
  ticketId: string,
  workerEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const calendar = await getUncachableGoogleCalendarClient();

    // Find the event
    const listResponse = await calendar.events.list({
      calendarId: workerEmail,
      privateExtendedProperty: [`ticketId=${ticketId}`],
      maxResults: 1,
    });

    if (listResponse.data.items && listResponse.data.items.length > 0) {
      const existingEvent = listResponse.data.items[0];
      await calendar.events.delete({
        calendarId: workerEmail,
        eventId: existingEvent.id!,
        sendUpdates: 'all', // Notify attendees
      });

      return { success: true };
    }

    return { success: true }; // Event doesn't exist, nothing to delete
  } catch (error: any) {
    console.error('Error deleting from Google Calendar:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}
