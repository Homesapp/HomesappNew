import { google } from "googleapis";

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Replit connection environment not available');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Google Calendar connection');
  }

  const data = await response.json();
  connectionSettings = data.items?.[0];

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function checkGoogleCalendarConnection(): Promise<{ connected: boolean; email?: string; error?: string }> {
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    const response = await calendar.calendarList.list({ maxResults: 1 });
    
    const primaryCalendar = response.data.items?.find(cal => cal.primary);
    
    return {
      connected: true,
      email: primaryCalendar?.id || undefined
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message
    };
  }
}

export async function listCalendars() {
  const calendar = await getUncachableGoogleCalendarClient();
  const response = await calendar.calendarList.list();
  return response.data.items || [];
}

export async function listEvents(calendarId: string = 'primary', options: {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
} = {}) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const now = new Date();
  const response = await calendar.events.list({
    calendarId,
    timeMin: options.timeMin || now.toISOString(),
    timeMax: options.timeMax,
    maxResults: options.maxResults || 100,
    singleEvents: true,
    orderBy: 'startTime',
  });
  
  return response.data.items || [];
}

export type CalendarEvent = {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  location?: string;
};

export async function createGoogleMeetEvent(event: CalendarEvent): Promise<{ eventId: string; meetLink: string } | null> {
  try {
    const calendar = await getUncachableGoogleCalendarClient();

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: "America/Mexico_City",
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: "America/Mexico_City",
        },
        attendees: event.attendees?.map(email => ({ email })),
        location: event.location,
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video"
    )?.uri;

    return {
      eventId: response.data.id || "",
      meetLink: meetLink || "",
    };
  } catch (error) {
    console.error("Error creating Google Meet event:", error);
    return null;
  }
}

export async function createCalendarEvent(event: {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
  attendees?: { email: string }[];
}) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      location: event.location,
      attendees: event.attendees,
    },
  });
  
  return response.data;
}

export async function updateCalendarEvent(eventId: string, event: {
  summary?: string;
  description?: string;
  start?: { dateTime: string; timeZone?: string };
  end?: { dateTime: string; timeZone?: string };
  location?: string;
  attendees?: { email: string }[];
}) {
  const calendar = await getUncachableGoogleCalendarClient();
  
  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      location: event.location,
      attendees: event.attendees,
    },
  });
  
  return response.data;
}

export async function deleteGoogleMeetEvent(eventId: string): Promise<boolean> {
  try {
    const calendar = await getUncachableGoogleCalendarClient();
    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });
    return true;
  } catch (error) {
    console.error("Error deleting Google Meet event:", error);
    return false;
  }
}
