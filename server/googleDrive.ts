import { google, drive_v3 } from 'googleapis';

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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

export async function getGoogleDriveClient(): Promise<drive_v3.Drive> {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

export function extractFolderIdFromUrl(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]+)$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

export async function listImagesInFolder(folderId: string): Promise<drive_v3.Schema$File[]> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and (mimeType contains 'image/')`,
    fields: 'files(id, name, mimeType, size, thumbnailLink, webContentLink)',
    pageSize: 100,
    orderBy: 'name',
  });
  
  return response.data.files || [];
}

export async function downloadFileAsBuffer(fileId: string): Promise<Buffer> {
  const drive = await getGoogleDriveClient();
  
  const response = await drive.files.get({
    fileId,
    alt: 'media',
  }, {
    responseType: 'arraybuffer',
  });
  
  return Buffer.from(response.data as ArrayBuffer);
}

export async function getFileMetadata(fileId: string): Promise<drive_v3.Schema$File | null> {
  const drive = await getGoogleDriveClient();
  
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, thumbnailLink, webContentLink, webViewLink',
    });
    return response.data;
  } catch (error) {
    console.error(`Error getting file metadata for ${fileId}:`, error);
    return null;
  }
}

export async function getDriveFileDirectLink(fileId: string): Promise<string> {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}
