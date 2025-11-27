import sharp from "sharp";
import { randomUUID } from "crypto";
import { objectStorageClient } from "./objectStorage";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

interface ProcessedImage {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
  originalSize: number;
  processedSize: number;
}

interface ImageUploadResult {
  objectPath: string;
  publicUrl: string;
  width: number;
  height: number;
  originalSize: number;
  processedSize: number;
}

const MAX_IMAGE_DIMENSION = 2000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const WEBP_QUALITY = 85;

const SUPPORTED_INPUT_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/tiff',
  'image/bmp',
];

export class ImageProcessor {
  async processImage(
    buffer: Buffer,
    originalMimeType: string,
    options: {
      maxDimension?: number;
      quality?: number;
      outputFormat?: 'webp' | 'jpeg' | 'png';
    } = {}
  ): Promise<ProcessedImage> {
    const {
      maxDimension = MAX_IMAGE_DIMENSION,
      quality = WEBP_QUALITY,
      outputFormat = 'webp',
    } = options;

    const originalSize = buffer.length;

    let image = sharp(buffer, { failOnError: false });
    const metadata = await image.metadata();

    const needsResize = (metadata.width && metadata.width > maxDimension) ||
                        (metadata.height && metadata.height > maxDimension);

    if (needsResize) {
      image = image.resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    image = image.rotate();

    let processedBuffer: Buffer;
    let mimeType: string;
    let extension: string;

    switch (outputFormat) {
      case 'jpeg':
        processedBuffer = await image.jpeg({ quality }).toBuffer();
        mimeType = 'image/jpeg';
        extension = 'jpg';
        break;
      case 'png':
        processedBuffer = await image.png({ quality }).toBuffer();
        mimeType = 'image/png';
        extension = 'png';
        break;
      case 'webp':
      default:
        processedBuffer = await image.webp({ quality }).toBuffer();
        mimeType = 'image/webp';
        extension = 'webp';
        break;
    }

    const processedMetadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      mimeType,
      extension,
      width: processedMetadata.width || 0,
      height: processedMetadata.height || 0,
      originalSize,
      processedSize: processedBuffer.length,
    };
  }

  async uploadToStorage(
    processedImage: ProcessedImage,
    subpath: string = 'external-units/images'
  ): Promise<ImageUploadResult> {
    const privateObjectDir = process.env.PRIVATE_OBJECT_DIR;
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }

    const objectId = `${randomUUID()}.${processedImage.extension}`;
    const fullPath = `${privateObjectDir}/${subpath}/${objectId}`;
    
    const pathParts = fullPath.startsWith('/') 
      ? fullPath.slice(1).split('/') 
      : fullPath.split('/');
    
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join('/');

    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    await file.save(processedImage.buffer, {
      metadata: {
        contentType: processedImage.mimeType,
      },
    });

    const objectPath = `/objects/${subpath}/${objectId}`;
    
    const publicUrl = await this.getSignedUrl(bucketName, objectName, 'GET', 60 * 60 * 24 * 7);

    return {
      objectPath,
      publicUrl,
      width: processedImage.width,
      height: processedImage.height,
      originalSize: processedImage.originalSize,
      processedSize: processedImage.processedSize,
    };
  }

  async getSignedUrl(
    bucketName: string,
    objectName: string,
    method: 'GET' | 'PUT' | 'DELETE' | 'HEAD',
    ttlSec: number
  ): Promise<string> {
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to sign object URL: ${response.status}`);
    }

    const { signed_url } = await response.json();
    return signed_url;
  }

  async refreshSignedUrl(objectPath: string): Promise<string> {
    if (!objectPath.startsWith('/objects/')) {
      return objectPath;
    }

    const privateObjectDir = process.env.PRIVATE_OBJECT_DIR;
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }

    const parts = objectPath.slice('/objects/'.length);
    const fullPath = `${privateObjectDir}/${parts}`;
    
    const pathParts = fullPath.startsWith('/') 
      ? fullPath.slice(1).split('/') 
      : fullPath.split('/');
    
    const bucketName = pathParts[0];
    const objectName = pathParts.slice(1).join('/');

    return this.getSignedUrl(bucketName, objectName, 'GET', 60 * 60 * 24 * 7);
  }

  isValidImageType(mimeType: string): boolean {
    return SUPPORTED_INPUT_FORMATS.includes(mimeType.toLowerCase());
  }

  validateFileSize(size: number): boolean {
    return size <= MAX_FILE_SIZE;
  }

  getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }

  getSupportedFormats(): string[] {
    return SUPPORTED_INPUT_FORMATS;
  }
}

export const imageProcessor = new ImageProcessor();
