import { getGoogleSheetsClient } from "../googleSheets";

async function getGoogleEmail() {
  try {
    const sheets = await getGoogleSheetsClient();
    const auth = sheets.context._options.auth;
    
    // Try to get credentials info
    if (auth.credentials) {
      console.log("Auth type:", auth.constructor.name);
      if (auth.credentials.access_token) {
        // Try to get user info
        const { google } = await import('googleapis');
        const oauth2 = google.oauth2({ version: 'v2', auth });
        try {
          const userInfo = await oauth2.userinfo.get();
          console.log("\n=== GOOGLE ACCOUNT INFO ===");
          console.log("Email:", userInfo.data.email);
          console.log("Name:", userInfo.data.name);
        } catch (e: any) {
          console.log("Could not get user info:", e.message);
        }
      }
    }
    
    // Check if using service account
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const fs = await import('fs');
      const creds = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
      console.log("\n=== SERVICE ACCOUNT ===");
      console.log("Email:", creds.client_email);
    }
    
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

getGoogleEmail().then(() => process.exit(0));
