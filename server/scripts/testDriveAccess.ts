import { google } from 'googleapis';

async function testDriveAccess() {
  // Check if we have the credentials
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS 
    ? JSON.parse(require('fs').readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
    : null;
  
  if (!credentials) {
    console.log("No service account credentials found");
    console.log("\nChecking for OAuth credentials...");
    console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET");
    console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET");
  }
  
  // Try to use the Sheets client method
  const { getGoogleSheetsClient } = await import("../googleSheets");
  const sheets = await getGoogleSheetsClient();
  
  // Get the auth from sheets and try Drive
  const auth = sheets.context._options.auth;
  
  const drive = google.drive({ version: 'v3', auth });
  
  // Test with a known folder
  const testFolderId = '1Jfiah69jaEXBpAzuPx3jKh0_zncWUkQ5';
  
  try {
    const response = await drive.files.list({
      q: `'${testFolderId}' in parents and (mimeType contains 'image/')`,
      fields: 'files(id, name, mimeType, size, webContentLink)',
      pageSize: 10,
    });
    
    console.log("\n=== DRIVE ACCESS SUCCESSFUL ===");
    console.log(`Found ${response.data.files?.length || 0} images in test folder`);
    
    if (response.data.files && response.data.files.length > 0) {
      console.log("\nSample files:");
      for (const file of response.data.files.slice(0, 5)) {
        console.log(`  - ${file.name} (${file.mimeType})`);
      }
    }
  } catch (error: any) {
    console.log("\n=== DRIVE ACCESS ERROR ===");
    console.log("Error:", error.message);
    
    if (error.message.includes('insufficient')) {
      console.log("\nThe current credentials don't have Drive access.");
      console.log("You may need to:");
      console.log("1. Share the Drive folder with the service account email");
      console.log("2. Or add Drive scope to OAuth credentials");
    }
  }
}

testDriveAccess()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
