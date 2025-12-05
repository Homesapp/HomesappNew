/**
 * Photo Reimport Script
 * 
 * This script reimports photos from Google Drive in higher resolution and stores
 * them in Object Storage. It supports:
 * - Batch processing with configurable batch size
 * - Resume capability (only processes photos with migration_status = 'pending')
 * - Error tracking per photo
 * - Progress reporting
 * 
 * Usage:
 *   npx tsx server/scripts/reimportPhotos.ts [--batch=100] [--agency=<id>] [--dry-run]
 */

import { db } from "@db";
import { externalUnitMedia, externalUnits, externalAgencies } from "@shared/schema";
import { eq, and, inArray, isNull, or, desc } from "drizzle-orm";

// Parse command line arguments
const args = process.argv.slice(2);
const batchSize = parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '50');
const agencyId = args.find(a => a.startsWith('--agency='))?.split('=')[1];
const dryRun = args.includes('--dry-run');
const maxBatches = parseInt(args.find(a => a.startsWith('--max-batches='))?.split('=')[1] || '0');

interface ReimportStats {
  totalPhotos: number;
  processed: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ photoId: string; error: string }>;
}

async function getGoogleDriveClient() {
  try {
    const { google } = await import('googleapis');
    
    const accessToken = process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!accessToken || !refreshToken || !clientId || !clientSecret) {
      throw new Error('Google Drive credentials not configured. Need GOOGLE_DRIVE_ACCESS_TOKEN, GOOGLE_DRIVE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
    }
    
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    return google.drive({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.error('Failed to initialize Google Drive client:', error);
    throw error;
  }
}

async function downloadFromDrive(driveFileId: string): Promise<Buffer | null> {
  try {
    const drive = await getGoogleDriveClient();
    
    const response = await drive.files.get({
      fileId: driveFileId,
      alt: 'media',
    }, { responseType: 'arraybuffer' });
    
    return Buffer.from(response.data as ArrayBuffer);
  } catch (error: any) {
    console.error(`Failed to download file ${driveFileId}:`, error.message);
    return null;
  }
}

async function uploadToObjectStorage(buffer: Buffer, path: string, mimeType: string = 'image/jpeg'): Promise<string | null> {
  try {
    const { BucketClient } = await import('@replit/object-storage');
    const client = new BucketClient();
    
    await client.uploadFromBytes(path, buffer, {
      contentType: mimeType
    });
    
    return `https://obj.replit.com/${client.bucketId}/${path}`;
  } catch (error: any) {
    console.error(`Failed to upload to Object Storage:`, error.message);
    return null;
  }
}

async function getPhotosForReimport(limit: number, agencyFilter?: string): Promise<any[]> {
  const conditions = [
    eq(externalUnitMedia.mediaType, 'photo'),
    eq(externalUnitMedia.migrationStatus, 'pending'),
    or(
      isNull(externalUnitMedia.storageUrl),
      eq(externalUnitMedia.qualityVersion, 1)
    )
  ];
  
  let query = db
    .select({
      id: externalUnitMedia.id,
      unitId: externalUnitMedia.unitId,
      driveFileId: externalUnitMedia.driveFileId,
      url: externalUnitMedia.url,
      fileName: externalUnitMedia.fileName,
      mimeType: externalUnitMedia.mimeType,
      photoSlot: externalUnitMedia.photoSlot,
      position: externalUnitMedia.position
    })
    .from(externalUnitMedia)
    .where(and(...conditions))
    .limit(limit);

  const photos = await query;
  
  if (agencyFilter && photos.length > 0) {
    const units = await db
      .select({ id: externalUnits.id, agencyId: externalUnits.agencyId })
      .from(externalUnits)
      .where(eq(externalUnits.agencyId, agencyFilter));
    
    const unitIds = new Set(units.map(u => u.id));
    return photos.filter(p => unitIds.has(p.unitId));
  }
  
  return photos;
}

async function markPhotoAsDone(photoId: string, storageUrl: string, storagePath: string): Promise<void> {
  await db
    .update(externalUnitMedia)
    .set({
      storageUrl,
      storagePath,
      qualityVersion: 2,
      migrationStatus: 'done',
      migratedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(externalUnitMedia.id, photoId));
}

async function markPhotoAsError(photoId: string, error: string): Promise<void> {
  await db
    .update(externalUnitMedia)
    .set({
      migrationStatus: 'error',
      migrationError: error,
      updatedAt: new Date()
    })
    .where(eq(externalUnitMedia.id, photoId));
}

async function markPhotosAsPending(agencyFilter?: string): Promise<number> {
  const conditions = [
    eq(externalUnitMedia.mediaType, 'photo'),
    eq(externalUnitMedia.migrationStatus, 'none')
  ];
  
  const result = await db
    .update(externalUnitMedia)
    .set({
      migrationStatus: 'pending',
      updatedAt: new Date()
    })
    .where(and(...conditions))
    .returning();
  
  return result.length;
}

async function getStats(): Promise<{ none: number; pending: number; processing: number; done: number; error: number }> {
  const photos = await db
    .select({ migrationStatus: externalUnitMedia.migrationStatus })
    .from(externalUnitMedia)
    .where(eq(externalUnitMedia.mediaType, 'photo'));

  return {
    none: photos.filter(p => p.migrationStatus === 'none' || !p.migrationStatus).length,
    pending: photos.filter(p => p.migrationStatus === 'pending').length,
    processing: photos.filter(p => p.migrationStatus === 'processing').length,
    done: photos.filter(p => p.migrationStatus === 'done').length,
    error: photos.filter(p => p.migrationStatus === 'error').length
  };
}

async function canAddPhotoToSlot(unitId: string, slot: 'primary' | 'secondary'): Promise<boolean> {
  const photos = await db
    .select({ photoSlot: externalUnitMedia.photoSlot })
    .from(externalUnitMedia)
    .where(and(
      eq(externalUnitMedia.unitId, unitId),
      eq(externalUnitMedia.mediaType, 'photo'),
      eq(externalUnitMedia.isHidden, false)
    ));
  
  const count = photos.filter(p => p.photoSlot === slot).length;
  const maxPhotos = slot === 'primary' ? 5 : 20;
  return count < maxPhotos;
}

async function processPhoto(photo: any): Promise<{ success: boolean; error?: string }> {
  if (!photo.driveFileId) {
    return { success: false, error: 'No Drive file ID' };
  }
  
  // Validate slot limits before processing
  if (photo.photoSlot) {
    const canAdd = await canAddPhotoToSlot(photo.unitId, photo.photoSlot);
    if (!canAdd) {
      return { success: false, error: `Slot ${photo.photoSlot} is at capacity` };
    }
  }
  
  try {
    // Mark as processing
    await db
      .update(externalUnitMedia)
      .set({ migrationStatus: 'processing', updatedAt: new Date() })
      .where(eq(externalUnitMedia.id, photo.id));
    
    // Download from Google Drive
    const buffer = await downloadFromDrive(photo.driveFileId);
    if (!buffer) {
      return { success: false, error: 'Failed to download from Drive' };
    }
    
    // Generate storage path
    const extension = photo.mimeType?.includes('png') ? 'png' : 'jpg';
    const storagePath = `external-units/${photo.unitId}/photos/hd/${photo.id}.${extension}`;
    
    // Upload to Object Storage
    const storageUrl = await uploadToObjectStorage(buffer, storagePath, photo.mimeType || 'image/jpeg');
    if (!storageUrl) {
      return { success: false, error: 'Failed to upload to Object Storage' };
    }
    
    // Mark as done
    await markPhotoAsDone(photo.id, storageUrl, storagePath);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function runReimport(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Photo Reimport Script');
  console.log('='.repeat(60));
  console.log(`Batch size: ${batchSize}`);
  console.log(`Agency filter: ${agencyId || 'none'}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Max batches: ${maxBatches || 'unlimited'}`);
  console.log('');

  // Get initial stats
  const initialStats = await getStats();
  console.log('Initial migration status:');
  console.log(`  - None: ${initialStats.none}`);
  console.log(`  - Pending: ${initialStats.pending}`);
  console.log(`  - Processing: ${initialStats.processing}`);
  console.log(`  - Done: ${initialStats.done}`);
  console.log(`  - Error: ${initialStats.error}`);
  console.log('');

  // Mark photos as pending if needed
  if (initialStats.pending === 0 && initialStats.none > 0) {
    console.log('Marking photos as pending for migration...');
    const markedCount = await markPhotosAsPending(agencyId);
    console.log(`Marked ${markedCount} photos as pending`);
    console.log('');
  }

  const stats: ReimportStats = {
    totalPhotos: initialStats.pending + initialStats.none,
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  let batchNumber = 0;
  let hasMore = true;

  while (hasMore) {
    batchNumber++;
    
    if (maxBatches > 0 && batchNumber > maxBatches) {
      console.log(`\nReached max batches limit (${maxBatches})`);
      break;
    }

    console.log(`\n--- Batch ${batchNumber} ---`);
    
    const photos = await getPhotosForReimport(batchSize, agencyId);
    
    if (photos.length === 0) {
      console.log('No more photos to process');
      hasMore = false;
      break;
    }

    console.log(`Processing ${photos.length} photos...`);

    for (const photo of photos) {
      if (dryRun) {
        console.log(`[DRY RUN] Would process photo ${photo.id} (${photo.driveFileId})`);
        stats.skipped++;
        continue;
      }

      const result = await processPhoto(photo);
      stats.processed++;

      if (result.success) {
        stats.success++;
        process.stdout.write('.');
      } else {
        stats.failed++;
        await markPhotoAsError(photo.id, result.error || 'Unknown error');
        stats.errors.push({ photoId: photo.id, error: result.error || 'Unknown error' });
        process.stdout.write('X');
      }

      // Rate limiting - small delay between photos
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('');
    console.log(`Batch ${batchNumber} complete: ${stats.success} success, ${stats.failed} failed`);
  }

  // Final stats
  console.log('\n' + '='.repeat(60));
  console.log('Reimport Complete');
  console.log('='.repeat(60));
  console.log(`Total processed: ${stats.processed}`);
  console.log(`Success: ${stats.success}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Skipped (dry run): ${stats.skipped}`);
  
  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    stats.errors.slice(0, 10).forEach(e => {
      console.log(`  - Photo ${e.photoId}: ${e.error}`);
    });
    if (stats.errors.length > 10) {
      console.log(`  ... and ${stats.errors.length - 10} more errors`);
    }
  }

  // Final migration status
  const finalStats = await getStats();
  console.log('\nFinal migration status:');
  console.log(`  - None: ${finalStats.none}`);
  console.log(`  - Pending: ${finalStats.pending}`);
  console.log(`  - Processing: ${finalStats.processing}`);
  console.log(`  - Done: ${finalStats.done}`);
  console.log(`  - Error: ${finalStats.error}`);
}

// Run the script
runReimport()
  .then(() => {
    console.log('\nScript finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed with error:', error);
    process.exit(1);
  });
