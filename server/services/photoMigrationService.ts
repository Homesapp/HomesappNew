import { db } from "../db";
import { 
  externalUnitMedia, 
  photoMigrationMeta, 
  photoMigrationLogs,
  PhotoMigrationMeta
} from "@shared/schema";
import { eq, and, sql, inArray, isNotNull, or, count, desc } from "drizzle-orm";
import sharp from "sharp";

const BATCH_SIZE = 100;
const CONCURRENCY = 3;
const UPDATE_PROGRESS_EVERY = 50;

interface MigrationConfig {
  batchSize?: number;
  concurrency?: number;
  targetQuality?: number;
  maxWidth?: number;
}

interface MigrationStatus {
  totalPhotos: number;
  processedPhotos: number;
  pendingPhotos: number;
  errorPhotos: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  lastUpdatedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  estimatedTimeRemaining?: string;
  averageProcessingTimeMs?: number;
}

// Get or create migration meta for an agency
export async function getOrCreateMigrationMeta(agencyId: string): Promise<PhotoMigrationMeta> {
  const existing = await db.query.photoMigrationMeta.findFirst({
    where: eq(photoMigrationMeta.agencyId, agencyId),
  });

  if (existing) {
    return existing;
  }

  // Count total photos that could be migrated
  const [photoCount] = await db.select({ count: count() })
    .from(externalUnitMedia)
    .innerJoin(
      sql`external_units`,
      sql`external_units.id = ${externalUnitMedia.unitId}`
    )
    .where(
      and(
        isNotNull(externalUnitMedia.driveFileId),
        or(
          eq(externalUnitMedia.migrationStatus, 'none'),
          eq(externalUnitMedia.migrationStatus, 'pending'),
          eq(externalUnitMedia.migrationStatus, 'error')
        )
      )
    );

  const [newMeta] = await db.insert(photoMigrationMeta)
    .values({
      agencyId,
      totalPhotos: photoCount?.count || 0,
      pendingPhotos: photoCount?.count || 0,
      processedPhotos: 0,
      errorPhotos: 0,
      status: 'idle',
      batchSize: BATCH_SIZE,
      concurrency: CONCURRENCY,
      targetQuality: 70,
      maxWidth: 1600,
    })
    .returning();

  return newMeta;
}

// Get migration status for admin panel
export async function getMigrationStatus(agencyId?: string): Promise<MigrationStatus> {
  // Get aggregated stats directly from photos
  const conditions = [
    isNotNull(externalUnitMedia.driveFileId),
  ];

  // Get counts by status
  const [stats] = await db.select({
    total: count(),
    done: sql<number>`SUM(CASE WHEN ${externalUnitMedia.migrationStatus} = 'done' THEN 1 ELSE 0 END)`,
    pending: sql<number>`SUM(CASE WHEN ${externalUnitMedia.migrationStatus} IN ('none', 'pending') THEN 1 ELSE 0 END)`,
    processing: sql<number>`SUM(CASE WHEN ${externalUnitMedia.migrationStatus} = 'processing' THEN 1 ELSE 0 END)`,
    errors: sql<number>`SUM(CASE WHEN ${externalUnitMedia.migrationStatus} = 'error' THEN 1 ELSE 0 END)`,
  })
  .from(externalUnitMedia)
  .where(and(...conditions));

  // Get migration meta for status info
  let meta: PhotoMigrationMeta | undefined;
  if (agencyId) {
    meta = await db.query.photoMigrationMeta.findFirst({
      where: eq(photoMigrationMeta.agencyId, agencyId),
      orderBy: [desc(photoMigrationMeta.createdAt)],
    });
  } else {
    meta = await db.query.photoMigrationMeta.findFirst({
      orderBy: [desc(photoMigrationMeta.createdAt)],
    });
  }

  const totalPhotos = Number(stats?.total) || 0;
  const processedPhotos = Number(stats?.done) || 0;
  const pendingPhotos = Number(stats?.pending) || 0;
  const errorPhotos = Number(stats?.errors) || 0;

  return {
    totalPhotos,
    processedPhotos,
    pendingPhotos,
    errorPhotos,
    status: meta?.status || 'idle',
    lastUpdatedAt: meta?.lastUpdatedAt || null,
    startedAt: meta?.startedAt || null,
    completedAt: meta?.completedAt || null,
  };
}

// Get pending photos for migration batch
export async function getPendingPhotos(limit: number = BATCH_SIZE, agencyId?: string) {
  const conditions = [
    isNotNull(externalUnitMedia.driveFileId),
    or(
      eq(externalUnitMedia.migrationStatus, 'none'),
      eq(externalUnitMedia.migrationStatus, 'pending')
    ),
  ];

  const photos = await db.select({
    id: externalUnitMedia.id,
    unitId: externalUnitMedia.unitId,
    driveFileId: externalUnitMedia.driveFileId,
    fileName: externalUnitMedia.fileName,
    photoSlot: externalUnitMedia.photoSlot,
    position: externalUnitMedia.position,
    storageUrl: externalUnitMedia.storageUrl,
    storagePath: externalUnitMedia.storagePath,
  })
  .from(externalUnitMedia)
  .where(and(...conditions))
  .limit(limit);

  return photos;
}

// Mark photos as processing
export async function markPhotosAsProcessing(photoIds: string[]) {
  if (photoIds.length === 0) return;

  await db.update(externalUnitMedia)
    .set({ 
      migrationStatus: 'processing',
      updatedAt: new Date(),
    })
    .where(inArray(externalUnitMedia.id, photoIds));
}

// Mark photo as done with new data
export async function markPhotoAsDone(
  photoId: string, 
  data: {
    storageUrl: string;
    storagePath: string;
    width: number;
    height: number;
    fileSize: number;
  }
) {
  await db.update(externalUnitMedia)
    .set({
      storageUrl: data.storageUrl,
      storagePath: data.storagePath,
      width: data.width,
      height: data.height,
      fileSize: data.fileSize,
      qualityVersion: 2,
      migrationStatus: 'done',
      migratedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(externalUnitMedia.id, photoId));
}

// Mark photo as error
export async function markPhotoAsError(photoId: string, errorMessage: string) {
  await db.update(externalUnitMedia)
    .set({
      migrationStatus: 'error',
      migrationError: errorMessage.slice(0, 1000), // Limit error message length
      updatedAt: new Date(),
    })
    .where(eq(externalUnitMedia.id, photoId));
}

// Update migration meta progress (with safe non-negative values)
export async function updateMigrationProgress(
  metaId: string,
  processedCount: number,
  errorCount: number = 0
) {
  await db.update(photoMigrationMeta)
    .set({
      processedPhotos: sql`${photoMigrationMeta.processedPhotos} + ${processedCount}`,
      pendingPhotos: sql`GREATEST(0, ${photoMigrationMeta.pendingPhotos} - ${processedCount})`,
      errorPhotos: sql`${photoMigrationMeta.errorPhotos} + ${errorCount}`,
      lastBatchSize: processedCount,
      lastUpdatedAt: new Date(),
    })
    .where(eq(photoMigrationMeta.id, metaId));
}

// Start migration
export async function startMigration(agencyId: string, config?: MigrationConfig) {
  const meta = await getOrCreateMigrationMeta(agencyId);

  await db.update(photoMigrationMeta)
    .set({
      status: 'running',
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      errorMessage: null,
      ...(config?.batchSize && { batchSize: config.batchSize }),
      ...(config?.concurrency && { concurrency: config.concurrency }),
      ...(config?.targetQuality && { targetQuality: config.targetQuality }),
      ...(config?.maxWidth && { maxWidth: config.maxWidth }),
    })
    .where(eq(photoMigrationMeta.id, meta.id));

  return meta;
}

// Pause migration
export async function pauseMigration(agencyId: string) {
  await db.update(photoMigrationMeta)
    .set({
      status: 'paused',
      pausedAt: new Date(),
      lastUpdatedAt: new Date(),
    })
    .where(eq(photoMigrationMeta.agencyId, agencyId));
}

// Mark migration as completed
export async function completeMigration(metaId: string) {
  await db.update(photoMigrationMeta)
    .set({
      status: 'completed',
      completedAt: new Date(),
      lastUpdatedAt: new Date(),
    })
    .where(eq(photoMigrationMeta.id, metaId));
}

// Mark migration as error
export async function failMigration(metaId: string, errorMessage: string) {
  await db.update(photoMigrationMeta)
    .set({
      status: 'error',
      errorMessage,
      lastUpdatedAt: new Date(),
    })
    .where(eq(photoMigrationMeta.id, metaId));
}

// Reset photos with errors to pending (for retry)
export async function resetErrorPhotos(agencyId?: string) {
  const conditions = [
    eq(externalUnitMedia.migrationStatus, 'error'),
    isNotNull(externalUnitMedia.driveFileId),
  ];

  const result = await db.update(externalUnitMedia)
    .set({
      migrationStatus: 'pending',
      migrationError: null,
      updatedAt: new Date(),
    })
    .where(and(...conditions))
    .returning({ id: externalUnitMedia.id });

  return result.length;
}

// Queue all photos for migration (set status to pending)
export async function queueAllPhotosForMigration(agencyId?: string) {
  const conditions = [
    eq(externalUnitMedia.migrationStatus, 'none'),
    isNotNull(externalUnitMedia.driveFileId),
  ];

  const result = await db.update(externalUnitMedia)
    .set({
      migrationStatus: 'pending',
      updatedAt: new Date(),
    })
    .where(and(...conditions))
    .returning({ id: externalUnitMedia.id });

  // Update meta counts
  if (agencyId) {
    const meta = await getOrCreateMigrationMeta(agencyId);
    await db.update(photoMigrationMeta)
      .set({
        totalPhotos: sql`(
          SELECT COUNT(*) FROM external_unit_media 
          WHERE drive_file_id IS NOT NULL
        )`,
        pendingPhotos: sql`(
          SELECT COUNT(*) FROM external_unit_media 
          WHERE drive_file_id IS NOT NULL 
          AND migration_status IN ('none', 'pending')
        )`,
        lastUpdatedAt: new Date(),
      })
      .where(eq(photoMigrationMeta.id, meta.id));
  }

  return result.length;
}

// Get recent migration logs
export async function getRecentMigrationLogs(limit: number = 100) {
  return await db.query.photoMigrationLogs.findMany({
    orderBy: [desc(photoMigrationLogs.processedAt)],
    limit,
  });
}

// Log a photo migration result
export async function logPhotoMigration(
  metaId: string | null,
  photoId: string,
  status: 'done' | 'error',
  data?: {
    errorMessage?: string;
    originalSize?: number;
    processedSize?: number;
    originalWidth?: number;
    originalHeight?: number;
    processedWidth?: number;
    processedHeight?: number;
    processingTimeMs?: number;
  }
) {
  await db.insert(photoMigrationLogs)
    .values({
      migrationMetaId: metaId,
      photoId,
      status,
      errorMessage: data?.errorMessage,
      originalSize: data?.originalSize,
      processedSize: data?.processedSize,
      originalWidth: data?.originalWidth,
      originalHeight: data?.originalHeight,
      processedWidth: data?.processedWidth,
      processedHeight: data?.processedHeight,
      processingTimeMs: data?.processingTimeMs,
    });
}

// Process image with Sharp (resize and compress)
export async function processImage(
  buffer: Buffer,
  config: { maxWidth: number; quality: number }
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const processed = await image
    .resize({
      width: config.maxWidth,
      withoutEnlargement: true, // Don't upscale small images
    })
    .webp({ quality: config.quality })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: processed.data,
    width: processed.info.width,
    height: processed.info.height,
  };
}

// Get photos with errors for debugging
export async function getPhotosWithErrors(limit: number = 50) {
  return await db.select({
    id: externalUnitMedia.id,
    unitId: externalUnitMedia.unitId,
    fileName: externalUnitMedia.fileName,
    driveFileId: externalUnitMedia.driveFileId,
    migrationError: externalUnitMedia.migrationError,
    updatedAt: externalUnitMedia.updatedAt,
  })
  .from(externalUnitMedia)
  .where(eq(externalUnitMedia.migrationStatus, 'error'))
  .limit(limit);
}

// Scan Google Sheets for Drive links and queue photos for migration
export async function scanDriveLinksFromSheet(): Promise<{
  scannedRows: number;
  newPhotosQueued: number;
  errors: string[];
}> {
  const { getGoogleSheetsClient } = await import("../googleSheets");
  const { extractFolderIdFromUrl, listImagesInFolder } = await import("../googleDrive");
  
  const SPREADSHEET_ID = '1fmViiKjC07TFzR71p19y7tN36430FkpJ8MF0DRlKQg4';
  const SHEET_NAME = 'Renta/Long Term';
  
  const sheets = await getGoogleSheetsClient();
  
  // Read values and notes
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
  
  const errors: string[] = [];
  let scannedRows = 0;
  let newPhotosQueued = 0;
  
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
  
  for (let i = 0; i < valueRows.length; i++) {
    const row = valueRows[i];
    const sheetRowId = row[0] || '';
    
    if (!sheetRowId) continue;
    scannedRows++;
    
    const driveColumnUrl = row[26] || ''; // Column AA
    const note = noteRows[i]?.values?.[0]?.note || '';
    const fichaLink = extractDriveLinkFromText(note);
    
    let driveFolderUrl = '';
    if (driveColumnUrl && driveColumnUrl.includes('drive.google.com')) {
      driveFolderUrl = driveColumnUrl;
    } else if (fichaLink) {
      driveFolderUrl = fichaLink;
    }
    
    if (!driveFolderUrl) continue;
    
    try {
      // Find unit in database
      const unit = await db.query.externalUnits.findFirst({
        where: eq(sql`sheet_row_id`, sheetRowId),
      });
      
      if (!unit) continue;
      
      // Check if unit already has photos with driveFileId
      const existingPhotos = await db.select({ id: externalUnitMedia.id })
        .from(externalUnitMedia)
        .where(
          and(
            eq(externalUnitMedia.unitId, unit.id),
            isNotNull(externalUnitMedia.driveFileId)
          )
        )
        .limit(1);
      
      if (existingPhotos.length > 0) continue; // Already has drive photos
      
      // Extract folder ID and list images
      const folderId = extractFolderIdFromUrl(driveFolderUrl);
      if (!folderId) {
        errors.push(`Row ${sheetRowId}: Invalid Drive URL format`);
        continue;
      }
      
      const images = await listImagesInFolder(folderId);
      
      for (let j = 0; j < Math.min(images.length, 25); j++) {
        const image = images[j];
        if (!image.id) continue;
        
        // Insert new photo entry with driveFileId for HD migration
        await db.insert(externalUnitMedia)
          .values({
            id: crypto.randomUUID(),
            unitId: unit.id,
            type: 'image',
            fileName: image.name || `photo_${j + 1}.jpg`,
            driveFileId: image.id,
            photoSlot: j < 5 ? 'primary' : 'secondary',
            position: j < 5 ? j : j - 5,
            migrationStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();
        
        newPhotosQueued++;
      }
    } catch (error: any) {
      errors.push(`Row ${sheetRowId}: ${error.message}`);
    }
  }
  
  return { scannedRows, newPhotosQueued, errors };
}

export default {
  getMigrationStatus,
  getPendingPhotos,
  markPhotosAsProcessing,
  markPhotoAsDone,
  markPhotoAsError,
  updateMigrationProgress,
  startMigration,
  pauseMigration,
  completeMigration,
  failMigration,
  resetErrorPhotos,
  queueAllPhotosForMigration,
  getRecentMigrationLogs,
  logPhotoMigration,
  processImage,
  getPhotosWithErrors,
  getOrCreateMigrationMeta,
  scanDriveLinksFromSheet,
};
