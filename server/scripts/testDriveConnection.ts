import { getGoogleDriveClient, extractFolderIdFromUrl, listImagesInFolder } from "../googleDrive";

async function testDriveConnection() {
  console.log("Testing Google Drive connection...\n");
  
  try {
    const drive = await getGoogleDriveClient();
    console.log("✓ Google Drive client created successfully\n");
    
    // Test with a folder from the spreadsheet
    const testUrl = "https://drive.google.com/drive/folders/1Jfiah69jaEXBpAzuPx3jKh0_zncWUkQ5?usp=drive_link";
    const folderId = extractFolderIdFromUrl(testUrl);
    
    console.log(`Testing folder access: ${folderId}`);
    
    const images = await listImagesInFolder(folderId!);
    console.log(`\n✓ Found ${images.length} images in folder\n`);
    
    if (images.length > 0) {
      console.log("Sample images:");
      for (const img of images.slice(0, 5)) {
        console.log(`  - ${img.name} (${img.mimeType})`);
        if (img.thumbnailLink) {
          console.log(`    Thumbnail: ${img.thumbnailLink.substring(0, 60)}...`);
        }
      }
    }
    
    console.log("\n✓ Drive access working correctly!");
    
  } catch (error: any) {
    console.error("✗ Error:", error.message);
    if (error.message.includes('not found')) {
      console.log("\nThe folder might not be shared with your connected Google account.");
    }
  }
}

testDriveConnection()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
