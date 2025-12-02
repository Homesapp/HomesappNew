import { db } from "../db";
import { externalUnits } from "@shared/schema";
import { getGoogleSheetsClient } from "../googleSheets";
import { extractFolderIdFromUrl, listImagesInFolder, downloadFileAsBuffer, getDriveFileDirectLink } from "../googleDrive";
import { objectStorageClient } from "../objectStorage";
import sharp from "sharp";
import { eq } from "drizzle-orm";

const SPREADSHEET_ID = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
const SHEET_NAME = 'Renta/Long Term';
const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 300;
const MAX_PHOTOS_PER_UNIT = 10;

interface FichaPhotoData {
  sheetRowId: string;
  unitNumber: string;
  condominiumName: string;
  driveFolderUrl: string;
  source: 'ficha' | 'drive_column';
}

function extractDriveLinkFromText(text: string): string | null {
  if (!text) return null;
  
  const driveMatch = text.match(/https?:\/\/[^\s]*drive\.google\.com[^\s\n]*/);
  if (driveMatch) {
    let url = driveMatch[0];
    url = url.replace(/[)\]}>.,;:!?'"]+$/, '');
    return url;
  }
  return null;
}

async function readDriveLinksFromFichas(): Promise<FichaPhotoData[]> {
  const sheets = await getGoogleSheetsClient();
  
  const valuesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A2:AA`,
  });
  
  const notesResponse = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [`'${SHEET_NAME}'!T2:T1500`],
    fields: 'sheets.data.rowData.values.note'
  });
  
  const valueRows = valuesResponse.data.values || [];
  const noteRows = notesResponse.data.sheets?.[0]?.data?.[0]?.rowData || [];
  
  const results: FichaPhotoData[] = [];
  const seenIds = new Set<string>();
  
  for (let i = 0; i < valueRows.length; i++) {
    const row = valueRows[i];
    const sheetRowId = row[0] || '';
    const condominiumName = row[6] || '';
    const unitNumber = row[7] || '';
    const driveColumnUrl = row[26] || '';
    
    if (!sheetRowId) continue;
    if (seenIds.has(sheetRowId)) continue;
    
    const note = noteRows[i]?.values?.[0]?.note || '';
    const fichaLink = extractDriveLinkFromText(note);
    
    if (driveColumnUrl && driveColumnUrl.includes('drive.google.com')) {
      seenIds.add(sheetRowId);
      results.push({
        sheetRowId,
        condominiumName,
        unitNumber,
        driveFolderUrl: driveColumnUrl,
        source: 'drive_column'
      });
    } else if (fichaLink) {
      seenIds.add(sheetRowId);
      results.push({
        sheetRowId,
        condominiumName,
        unitNumber,
        driveFolderUrl: fichaLink,
        source: 'ficha'
      });
    }
  }
  
  return results;
}

async function createThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

async function uploadToObjectStorage(
  buffer: Buffer, 
  filename: string, 
  contentType: string = 'image/jpeg'
): Promise<string> {
  if (!BUCKET_ID) {
    throw new Error("BUCKET_ID not configured");
  }
  
  const bucket = objectStorageClient.bucket(BUCKET_ID);
  const objectPath = `public/properties/${filename}`;
  const file = bucket.file(objectPath);
  
  await file.save(buffer, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  
  return `/api/public/images/properties/${filename}`;
}

async function importPhotosForUnit(
  unit: { id: string; sheetRowId: string; unitNumber: string },
  folderId: string,
  dryRun: boolean = true
): Promise<{ thumbnails: string[]; driveLinks: string[] }> {
  const images = await listImagesInFolder(folderId);
  
  if (images.length === 0) {
    return { thumbnails: [], driveLinks: [] };
  }
  
  const thumbnails: string[] = [];
  const driveLinks: string[] = [];
  
  const imagesToProcess = images.slice(0, MAX_PHOTOS_PER_UNIT);
  
  for (let i = 0; i < imagesToProcess.length; i++) {
    const image = imagesToProcess[i];
    
    if (!image.id) continue;
    
    try {
      const driveLink = await getDriveFileDirectLink(image.id);
      driveLinks.push(driveLink);
      
      if (!dryRun) {
        const imageBuffer = await downloadFileAsBuffer(image.id);
        const thumbnailBuffer = await createThumbnail(imageBuffer);
        
        const filename = `${unit.sheetRowId}_${i + 1}.jpg`;
        const thumbnailUrl = await uploadToObjectStorage(thumbnailBuffer, filename);
        thumbnails.push(thumbnailUrl);
        
        console.log(`    Uploaded thumbnail ${i + 1}/${imagesToProcess.length}`);
      } else {
        thumbnails.push(`[DRY RUN] Would upload thumbnail ${i + 1}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error: any) {
      console.error(`    Error processing image ${image.name}: ${error.message}`);
    }
  }
  
  return { thumbnails, driveLinks };
}

async function importPhotos(dryRun: boolean = true, limit?: number, skipExisting: boolean = true) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PHOTO IMPORT FROM FICHAS + DRIVE COLUMN`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE IMPORT'}`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log("Reading Drive links from fichas and spreadsheet...");
  const driveData = await readDriveLinksFromFichas();
  
  const fromFicha = driveData.filter(d => d.source === 'ficha').length;
  const fromColumn = driveData.filter(d => d.source === 'drive_column').length;
  
  console.log(`Found ${driveData.length} total units with Drive folder links:`);
  console.log(`  - From fichas (column T notes): ${fromFicha}`);
  console.log(`  - From Drive column (AA): ${fromColumn}\n`);
  
  const allUnits = await db
    .select({
      id: externalUnits.id,
      sheetRowId: externalUnits.sheetRowId,
      unitNumber: externalUnits.unitNumber,
      primaryImages: externalUnits.primaryImages,
    })
    .from(externalUnits);
  
  const unitsBySheetRowId = new Map(
    allUnits.map(u => [u.sheetRowId, u])
  );
  
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let noMatch = 0;
  
  const dataToProcess = limit ? driveData.slice(0, limit) : driveData;
  
  for (const data of dataToProcess) {
    const unit = unitsBySheetRowId.get(data.sheetRowId);
    
    if (!unit) {
      console.log(`[NO MATCH] Sheet row ${data.sheetRowId} - ${data.condominiumName} ${data.unitNumber}`);
      noMatch++;
      continue;
    }
    
    if (skipExisting && unit.primaryImages && unit.primaryImages.length > 0) {
      console.log(`[SKIP] ${data.condominiumName} ${data.unitNumber} - Already has ${unit.primaryImages.length} images`);
      skipped++;
      continue;
    }
    
    const folderId = extractFolderIdFromUrl(data.driveFolderUrl);
    
    if (!folderId) {
      console.log(`[ERROR] Invalid folder URL for ${data.condominiumName} ${data.unitNumber}`);
      console.log(`        URL: ${data.driveFolderUrl.substring(0, 80)}...`);
      errors++;
      continue;
    }
    
    console.log(`[PROCESS] ${data.condominiumName} ${data.unitNumber} (source: ${data.source})`);
    
    try {
      const { thumbnails, driveLinks } = await importPhotosForUnit(
        { id: unit.id, sheetRowId: data.sheetRowId, unitNumber: data.unitNumber },
        folderId,
        dryRun
      );
      
      if (thumbnails.length > 0) {
        console.log(`  → ${thumbnails.length} photos processed`);
        
        if (!dryRun) {
          await db
            .update(externalUnits)
            .set({
              primaryImages: thumbnails,
              photosDriveLink: data.driveFolderUrl,
            })
            .where(eq(externalUnits.id, unit.id));
          
          updated++;
        }
      } else {
        console.log(`  → No images found in folder`);
      }
      
      processed++;
      
    } catch (error: any) {
      console.log(`[ERROR] ${data.condominiumName} ${data.unitNumber}: ${error.message}`);
      errors++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Processed: ${processed}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already have images): ${skipped}`);
  console.log(`No match in database: ${noMatch}`);
  console.log(`Errors: ${errors}`);
  
  if (dryRun) {
    console.log(`\nThis was a DRY RUN. Run with --import to actually import photos.`);
  }
}

const args = process.argv.slice(2);
const dryRun = !args.includes('--import');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;
const forceReimport = args.includes('--force');

importPhotos(dryRun, limit, !forceReimport)
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
