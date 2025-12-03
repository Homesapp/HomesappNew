import { db } from "../db";
import { externalUnits } from "@shared/schema";
import { getGoogleSheetsClient } from "../googleSheets";
import { 
  extractFolderIdFromUrl, 
  listAllMediaInFolder, 
  downloadFileAsBuffer, 
  getVideoEmbedUrl,
  getVideoThumbnailUrl 
} from "../googleDrive";
import { objectStorageClient } from "../objectStorage";
import sharp from "sharp";
import { eq, sql } from "drizzle-orm";

const SPREADSHEET_ID = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
const SHEET_NAME = 'Renta/Long Term';
const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;

// High quality settings for better visual appearance
// Targeting 1-2 GB total storage for all units with ~25 photos each
const THUMBNAIL_WIDTH = 1200;  // Was 400 - now HD quality
const THUMBNAIL_HEIGHT = 900;  // Was 300 - now HD quality
const JPEG_QUALITY = 90;       // Was 80 - higher quality
const MAX_PRIMARY_PHOTOS = 5;  // Primary/cover photos
const MAX_SECONDARY_PHOTOS = 20; // Additional photos
const MAX_PHOTOS_PER_UNIT = MAX_PRIMARY_PHOTOS + MAX_SECONDARY_PHOTOS; // Total 25
const MAX_VIDEOS_PER_UNIT = 10;

interface MediaRecord {
  id: string;
  unitId: string;
  mediaType: 'photo' | 'video';
  driveFileId: string | null;
  driveWebViewUrl: string | null;
  thumbnailUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  status: 'pending' | 'processing' | 'processed' | 'error';
  displayOrder: number;
  isHidden: boolean;
  isCover: boolean;
}

interface DriveMediaData {
  sheetRowId: string;
  unitNumber: string;
  condominiumName: string;
  fichasDriveUrl: string;
  directDriveUrl: string;
}

function extractDriveLinkFromFichas(fichasNotes: string): string | null {
  if (!fichasNotes) return null;
  const patterns = [
    /https:\/\/drive\.google\.com\/(?:drive\/)?folders\/[a-zA-Z0-9_-]+/gi,
    /https:\/\/drive\.google\.com\/(?:open|file\/d)\/[a-zA-Z0-9_-]+/gi,
  ];
  for (const pattern of patterns) {
    const matches = fichasNotes.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }
  return null;
}

async function readDriveLinksFromSheet(): Promise<DriveMediaData[]> {
  const sheets = await getGoogleSheetsClient();
  
  // First, get the cell values
  const valuesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A2:AA`,
  });
  
  const rows = valuesResponse.data.values || [];
  
  // Then, get the cell NOTES from column T (which contain Drive links in fichas)
  const notesResponse = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [`'${SHEET_NAME}'!T2:T${rows.length + 1}`],
    includeGridData: true,
  });
  
  const notesData = notesResponse.data.sheets?.[0]?.data?.[0]?.rowData || [];
  
  // Build a map of row index to note content
  const notesByRow: { [key: number]: string } = {};
  notesData.forEach((rowData: any, index: number) => {
    if (rowData?.values?.[0]?.note) {
      notesByRow[index] = rowData.values[0].note;
    }
  });
  
  console.log(`Found ${Object.keys(notesByRow).length} cells with notes in column T`);
  
  return rows.map((row: any[], index: number) => {
    // Try cell value first, then cell note
    const fichasCellValue = row[19] || '';
    const fichasCellNote = notesByRow[index] || '';
    const directDriveUrl = row[26] || '';
    
    // Extract Drive link from both cell value and note
    let fichasDriveUrl = extractDriveLinkFromFichas(fichasCellValue);
    if (!fichasDriveUrl) {
      fichasDriveUrl = extractDriveLinkFromFichas(fichasCellNote);
    }
    
    return {
      sheetRowId: row[0] || '',
      condominiumName: row[6] || '',
      unitNumber: row[7] || '',
      fichasDriveUrl: fichasDriveUrl || '',
      directDriveUrl: directDriveUrl,
    };
  }).filter((r: DriveMediaData) => r.sheetRowId && (r.fichasDriveUrl || r.directDriveUrl));
}

async function createThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: JPEG_QUALITY })
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

async function insertMediaRecord(record: Partial<MediaRecord>): Promise<void> {
  const id = `${record.unitId}_${record.mediaType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.execute(sql`
    INSERT INTO external_unit_media (
      id, unit_id, media_type, drive_file_id, drive_web_view_url, 
      thumbnail_url, file_name, mime_type, file_size, status, 
      display_order, is_hidden, is_cover
    ) VALUES (
      ${id}, ${record.unitId}, ${record.mediaType}, ${record.driveFileId || null}, ${record.driveWebViewUrl || null}, 
      ${record.thumbnailUrl || null}, ${record.fileName || null}, ${record.mimeType || null}, ${record.fileSize || null}, ${record.status || 'pending'}, 
      ${record.displayOrder || 0}, ${record.isHidden || false}, ${record.isCover || false}
    )
  `);
}

async function getExistingMediaCount(unitId: string): Promise<{ photos: number; videos: number }> {
  const result = await db.execute(sql`
    SELECT media_type, COUNT(*) as count
    FROM external_unit_media
    WHERE unit_id = ${unitId}
    GROUP BY media_type
  `);
  
  const counts = { photos: 0, videos: 0 };
  for (const row of (result.rows || [])) {
    if ((row as any).media_type === 'photo') counts.photos = parseInt((row as any).count);
    if ((row as any).media_type === 'video') counts.videos = parseInt((row as any).count);
  }
  return counts;
}

async function isDriveFileAlreadyImported(driveFileId: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1 FROM external_unit_media
    WHERE drive_file_id = ${driveFileId}
    LIMIT 1
  `);
  return (result.rows?.length || 0) > 0;
}

async function getExistingDriveFileIds(unitId: string): Promise<Set<string>> {
  const result = await db.execute(sql`
    SELECT drive_file_id FROM external_unit_media
    WHERE unit_id = ${unitId} AND drive_file_id IS NOT NULL
  `);
  const ids = new Set<string>();
  for (const row of (result.rows || [])) {
    if ((row as any).drive_file_id) ids.add((row as any).drive_file_id);
  }
  return ids;
}

async function importMediaForUnit(
  unit: { id: string; sheetRowId: string; unitNumber: string },
  folderId: string,
  dryRun: boolean = true
): Promise<{ photos: number; videos: number; skippedDuplicates: number }> {
  const { images, videos } = await listAllMediaInFolder(folderId);
  
  const existingCounts = await getExistingMediaCount(unit.id);
  const existingDriveIds = await getExistingDriveFileIds(unit.id);
  const photosToAdd = MAX_PHOTOS_PER_UNIT - existingCounts.photos;
  const videosToAdd = MAX_VIDEOS_PER_UNIT - existingCounts.videos;
  
  let photosImported = 0;
  let videosImported = 0;
  let skippedDuplicates = 0;
  
  // Filter out already imported images
  const newImages = images.filter(img => img.id && !existingDriveIds.has(img.id));
  if (images.length !== newImages.length) {
    skippedDuplicates += images.length - newImages.length;
    console.log(`    [SKIP] ${images.length - newImages.length} duplicate photos already imported`);
  }
  
  const imagesToProcess = newImages.slice(0, Math.max(0, photosToAdd));
  for (let i = 0; i < imagesToProcess.length; i++) {
    const image = imagesToProcess[i];
    if (!image.id) continue;
    
    try {
      let thumbnailUrl: string | null = null;
      
      if (!dryRun) {
        const imageBuffer = await downloadFileAsBuffer(image.id);
        const thumbnailBuffer = await createThumbnail(imageBuffer);
        const filename = `${unit.sheetRowId}_${Date.now()}_${i + 1}.jpg`;
        thumbnailUrl = await uploadToObjectStorage(thumbnailBuffer, filename);
        
        await insertMediaRecord({
          unitId: unit.id,
          mediaType: 'photo',
          driveFileId: image.id,
          driveWebViewUrl: image.webViewLink || null,
          thumbnailUrl,
          fileName: image.name || null,
          mimeType: image.mimeType || null,
          fileSize: image.size ? parseInt(image.size) : null,
          status: 'pending',
          displayOrder: existingCounts.photos + photosImported,
          isCover: existingCounts.photos === 0 && photosImported === 0,
        });
        
        // Add to existing set to prevent duplicates within same run
        existingDriveIds.add(image.id);
        
        console.log(`    Photo ${photosImported + 1}/${imagesToProcess.length}: ${image.name}`);
      }
      
      photosImported++;
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error: any) {
      console.error(`    Error with photo ${image.name}: ${error.message}`);
    }
  }
  
  // Filter out already imported videos
  const newVideos = videos.filter(vid => vid.id && !existingDriveIds.has(vid.id));
  if (videos.length !== newVideos.length) {
    skippedDuplicates += videos.length - newVideos.length;
    console.log(`    [SKIP] ${videos.length - newVideos.length} duplicate videos already imported`);
  }
  
  const videosToProcess = newVideos.slice(0, Math.max(0, videosToAdd));
  for (let i = 0; i < videosToProcess.length; i++) {
    const video = videosToProcess[i];
    if (!video.id) continue;
    
    try {
      if (!dryRun) {
        const embedUrl = getVideoEmbedUrl(video.id);
        const thumbnailUrl = getVideoThumbnailUrl(video.id);
        
        await insertMediaRecord({
          unitId: unit.id,
          mediaType: 'video',
          driveFileId: video.id,
          driveWebViewUrl: embedUrl,
          thumbnailUrl,
          fileName: video.name || null,
          mimeType: video.mimeType || null,
          fileSize: video.size ? parseInt(video.size) : null,
          status: 'pending',
          displayOrder: existingCounts.videos + videosImported,
        });
        
        // Add to existing set to prevent duplicates within same run
        existingDriveIds.add(video.id);
        
        console.log(`    Video ${videosImported + 1}/${videosToProcess.length}: ${video.name}`);
      }
      
      videosImported++;
      
    } catch (error: any) {
      console.error(`    Error with video ${video.name}: ${error.message}`);
    }
  }
  
  return { photos: photosImported, videos: videosImported, skippedDuplicates };
}

async function updateUnitPrimaryImages(unitId: string): Promise<void> {
  const result = await db.execute(sql`
    SELECT thumbnail_url FROM external_unit_media
    WHERE unit_id = ${unitId} AND media_type = 'photo' AND is_hidden = false
    ORDER BY is_cover DESC, display_order ASC
    LIMIT 10
  `);
  
  const thumbnails = (result.rows || []).map((r: any) => r.thumbnail_url).filter(Boolean);
  
  if (thumbnails.length > 0) {
    await db
      .update(externalUnits)
      .set({ primaryImages: thumbnails })
      .where(eq(externalUnits.id, unitId));
  }
}

async function importMedia(dryRun: boolean = true, limit?: number, skipExisting: boolean = true) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`MEDIA IMPORT FROM GOOGLE DRIVE`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE IMPORT'}`);
  console.log(`Skip existing: ${skipExisting}`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log("Reading Drive links from spreadsheet...");
  const driveData = await readDriveLinksFromSheet();
  console.log(`Found ${driveData.length} units with Drive folder links\n`);
  
  const allUnits = await db
    .select({
      id: externalUnits.id,
      sheetRowId: externalUnits.sheetRowId,
      unitNumber: externalUnits.unitNumber,
    })
    .from(externalUnits);
  
  const unitsBySheetRowId = new Map(
    allUnits.map(u => [u.sheetRowId, u])
  );
  
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let totalPhotos = 0;
  let totalVideos = 0;
  
  const dataToProcess = limit ? driveData.slice(0, limit) : driveData;
  
  for (const data of dataToProcess) {
    const unit = unitsBySheetRowId.get(data.sheetRowId);
    
    if (!unit) {
      skipped++;
      continue;
    }
    
    if (skipExisting) {
      const existing = await getExistingMediaCount(unit.id);
      if (existing.photos >= MAX_PHOTOS_PER_UNIT) {
        console.log(`[SKIP] ${data.condominiumName} ${data.unitNumber} - Already has ${existing.photos} photos`);
        skipped++;
        continue;
      }
    }
    
    const driveUrl = data.directDriveUrl || data.fichasDriveUrl;
    const folderId = extractFolderIdFromUrl(driveUrl);
    
    if (!folderId) {
      console.log(`[ERROR] Invalid folder URL for ${data.condominiumName} ${data.unitNumber}`);
      errors++;
      continue;
    }
    
    console.log(`[PROCESS] ${data.condominiumName} ${data.unitNumber}`);
    console.log(`  Source: ${data.directDriveUrl ? 'Column AA' : 'Fichas T'}`);
    
    try {
      const { photos, videos, skippedDuplicates } = await importMediaForUnit(
        { id: unit.id, sheetRowId: data.sheetRowId, unitNumber: data.unitNumber },
        folderId,
        dryRun
      );
      
      if (photos > 0 || videos > 0) {
        let msg = `  → ${photos} photos, ${videos} videos processed`;
        if (skippedDuplicates > 0) {
          msg += ` (${skippedDuplicates} duplicates skipped)`;
        }
        console.log(msg);
        totalPhotos += photos;
        totalVideos += videos;
        
        if (!dryRun) {
          await updateUnitPrimaryImages(unit.id);
          updated++;
        }
      } else if (skippedDuplicates > 0) {
        console.log(`  → No new media (${skippedDuplicates} duplicates skipped)`);
      } else {
        console.log(`  → No new media found`);
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
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total photos: ${totalPhotos}`);
  console.log(`Total videos: ${totalVideos}`);
  
  if (dryRun) {
    console.log(`\nThis was a DRY RUN. Run with --import to actually import media.`);
  }
}

const args = process.argv.slice(2);
const dryRun = !args.includes('--import');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;
const skipExisting = !args.includes('--force');

importMedia(dryRun, limit, skipExisting)
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
