/**
 * Script to upgrade existing thumbnails to HD quality
 * 
 * This script:
 * 1. Finds all existing media with thumbnails
 * 2. Downloads originals from Google Drive
 * 3. Creates new HD thumbnails (1200x900 @ 90% quality)
 * 4. Uploads to object storage and updates the records
 * 5. Deletes old thumbnails from object storage to save space
 * 
 * Run with: npx tsx server/scripts/upgradeThumbnailQuality.ts
 */

import { db } from "../db";
import { externalUnitMedia } from "@shared/schema";
import { downloadFileAsBuffer } from "../googleDrive";
import { objectStorageClient } from "../objectStorage";
import sharp from "sharp";
import { eq, isNotNull, and, not, like } from "drizzle-orm";

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;

const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 900;
const JPEG_QUALITY = 90;
const BATCH_SIZE = 5;
const DELAY_BETWEEN_PHOTOS = 500;
const DELAY_BETWEEN_BATCHES = 3000;

async function createHDThumbnail(imageBuffer: Buffer): Promise<Buffer> {
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

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deleteOldThumbnail(oldUrl: string): Promise<boolean> {
  if (!BUCKET_ID || !oldUrl) return false;
  
  try {
    // Extract the object path from the URL
    // URL format: /api/public/images/properties/filename.jpg
    const match = oldUrl.match(/\/api\/public\/images\/properties\/(.+)$/);
    if (!match) {
      // Try alternate format: direct object storage path
      const altMatch = oldUrl.match(/public\/properties\/(.+)$/);
      if (!altMatch) return false;
    }
    
    const filename = match ? match[1] : oldUrl.split('/').pop();
    if (!filename || filename.startsWith('hd_')) return false; // Don't delete HD photos
    
    const bucket = objectStorageClient.bucket(BUCKET_ID);
    const objectPath = `public/properties/${filename}`;
    const file = bucket.file(objectPath);
    
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      return true;
    }
    return false;
  } catch (error) {
    // Silent fail - old file might not exist or path format different
    return false;
  }
}

async function processPhoto(media: {
  id: string;
  unitId: string;
  driveFileId: string | null;
  thumbnailUrl: string | null;
  fileName: string | null;
}): Promise<{ success: boolean; deleted: boolean }> {
  try {
    if (!media.driveFileId) {
      console.log(`  [SKIP] ${media.id.slice(-8)} - No Drive file ID`);
      return { success: false, deleted: false };
    }

    const imageBuffer = await downloadFileAsBuffer(media.driveFileId);
    if (!imageBuffer || imageBuffer.length === 0) {
      console.log(`  [SKIP] ${media.id.slice(-8)} - Empty download`);
      return { success: false, deleted: false };
    }

    const hdThumbnail = await createHDThumbnail(imageBuffer);
    
    const timestamp = Date.now();
    const filename = `hd_${media.unitId}_${timestamp}_${media.id.slice(-8)}.jpg`;
    
    // Store old URL before updating
    const oldUrl = media.thumbnailUrl;
    
    const newUrl = await uploadToObjectStorage(hdThumbnail, filename, 'image/jpeg');

    await db
      .update(externalUnitMedia)
      .set({ 
        thumbnailUrl: newUrl,
        updatedAt: new Date()
      })
      .where(eq(externalUnitMedia.id, media.id));

    // Delete old thumbnail after successful update
    let deleted = false;
    if (oldUrl) {
      deleted = await deleteOldThumbnail(oldUrl);
    }

    const deleteStatus = deleted ? ' [OLD DELETED]' : '';
    console.log(`  [OK] ${media.id.slice(-8)} -> ${filename} (${Math.round(hdThumbnail.length/1024)}KB)${deleteStatus}`);
    return { success: true, deleted };
  } catch (error: any) {
    console.log(`  [ERROR] ${media.id.slice(-8)}: ${error.message?.slice(0, 50)}`);
    return { success: false, deleted: false };
  }
}

async function main() {
  console.log("=================================================");
  console.log("  UPGRADE THUMBNAILS TO HD QUALITY");
  console.log(`  Target: ${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT} @ ${JPEG_QUALITY}% JPEG`);
  console.log(`  Batch size: ${BATCH_SIZE}, Delay: ${DELAY_BETWEEN_BATCHES}ms`);
  console.log("=================================================\n");

  if (!BUCKET_ID) {
    console.error("ERROR: DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
    process.exit(1);
  }

  console.log("Fetching photos that need upgrading...");

  const allMedia = await db
    .select({
      id: externalUnitMedia.id,
      unitId: externalUnitMedia.unitId,
      driveFileId: externalUnitMedia.driveFileId,
      thumbnailUrl: externalUnitMedia.thumbnailUrl,
      fileName: externalUnitMedia.fileName,
    })
    .from(externalUnitMedia)
    .where(and(
      isNotNull(externalUnitMedia.driveFileId),
      isNotNull(externalUnitMedia.thumbnailUrl),
      eq(externalUnitMedia.mediaType, 'photo'),
      not(like(externalUnitMedia.thumbnailUrl, '%/hd_%'))
    ));

  console.log(`Found ${allMedia.length} photos to upgrade\n`);

  if (allMedia.length === 0) {
    console.log("All photos already upgraded!");
    process.exit(0);
  }

  let processed = 0;
  let success = 0;
  let failed = 0;
  let deletedOld = 0;
  const startTime = Date.now();

  const totalBatches = Math.ceil(allMedia.length / BATCH_SIZE);

  for (let i = 0; i < allMedia.length; i += BATCH_SIZE) {
    const batch = allMedia.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    console.log(`\n[Batch ${batchNum}/${totalBatches}] Processing ${batch.length} photos...`);

    for (const media of batch) {
      const result = await processPhoto(media);
      if (result.success) {
        success++;
        if (result.deleted) {
          deletedOld++;
        }
      } else {
        failed++;
      }
      processed++;
      
      await sleep(DELAY_BETWEEN_PHOTOS);
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const rate = processed / elapsed;
    const remaining = allMedia.length - processed;
    const eta = Math.round(remaining / rate);

    console.log(`  Batch done: ${success} ok, ${failed} fail, ${deletedOld} old deleted | Progress: ${processed}/${allMedia.length} (${Math.round(processed/allMedia.length*100)}%)`);
    console.log(`  Time: ${elapsed}s elapsed, ~${eta}s remaining (~${Math.round(eta/60)} min)`);

    if (i + BATCH_SIZE < allMedia.length) {
      await sleep(DELAY_BETWEEN_BATCHES);
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);

  console.log("\n=================================================");
  console.log("  UPGRADE COMPLETE");
  console.log(`  Total processed: ${processed}`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Old thumbnails deleted: ${deletedOld}`);
  console.log(`  Total time: ${Math.round(totalTime/60)} minutes`);
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});
