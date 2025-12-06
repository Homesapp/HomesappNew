import OpenAI, { toFile } from "openai";
import { Buffer } from "node:buffer";
import pLimit from "p-limit";
import pRetry from "p-retry";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export interface EnhancementResult {
  success: boolean;
  imageBuffer?: Buffer;
  error?: string;
}

export interface BatchEnhancementProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

export async function enhanceRealEstatePhoto(imageUrl: string): Promise<EnhancementResult> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const imageFile = await toFile(imageBuffer, "photo.jpg", { type: "image/jpeg" });
    
    const prompt = `Enhance this real estate property photo to make it look professional and appealing for a luxury rental listing in Tulum, Mexico. 
Improve:
- Lighting balance and brightness
- Color saturation and warmth for a tropical feel
- Clarity and sharpness
- Sky replacement if needed (clear blue tropical sky)
- Remove any minor imperfections
Keep the photo realistic and natural looking. Do not add objects or change the structure of the space.`;

    const result = await pRetry(
      async () => {
        try {
          const editResponse = await openai.images.edit({
            model: "gpt-image-1",
            image: [imageFile],
            prompt,
          });

          const base64 = editResponse.data[0]?.b64_json;
          if (!base64) {
            throw new Error("No image data returned from AI");
          }

          return Buffer.from(base64, "base64");
        } catch (error: any) {
          if (isRateLimitError(error)) {
            throw error;
          }
          throw new pRetry.AbortError(error);
        }
      },
      {
        retries: 3,
        minTimeout: 2000,
        maxTimeout: 30000,
        factor: 2,
      }
    );

    return {
      success: true,
      imageBuffer: result
    };
  } catch (error: any) {
    console.error("Photo enhancement error:", error);
    return {
      success: false,
      error: error.message || "Failed to enhance photo"
    };
  }
}

export async function batchEnhancePhotos(
  photos: { id: string; url: string }[],
  onProgress?: (progress: BatchEnhancementProgress) => void
): Promise<Map<string, EnhancementResult>> {
  const results = new Map<string, EnhancementResult>();
  const limit = pLimit(2);
  
  let completed = 0;
  let failed = 0;
  
  const processingPromises = photos.map((photo) =>
    limit(async () => {
      onProgress?.({
        total: photos.length,
        completed,
        failed,
        current: photo.id
      });
      
      const result = await enhanceRealEstatePhoto(photo.url);
      results.set(photo.id, result);
      
      if (result.success) {
        completed++;
      } else {
        failed++;
      }
      
      onProgress?.({
        total: photos.length,
        completed,
        failed,
        current: undefined
      });
      
      return result;
    })
  );
  
  await Promise.all(processingPromises);
  
  return results;
}

export async function generateEnhancedPreview(imageUrl: string): Promise<EnhancementResult> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const imageFile = await toFile(imageBuffer, "photo.jpg", { type: "image/jpeg" });
    
    const prompt = `Preview enhancement: Subtly improve this real estate photo with better lighting, color correction, and clarity. Keep it natural and realistic.`;

    const editResponse = await openai.images.edit({
      model: "gpt-image-1",
      image: [imageFile],
      prompt,
      size: "512x512" as any, 
    });

    const base64 = editResponse.data[0]?.b64_json;
    if (!base64) {
      throw new Error("No preview data returned from AI");
    }

    return {
      success: true,
      imageBuffer: Buffer.from(base64, "base64")
    };
  } catch (error: any) {
    console.error("Preview generation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate preview"
    };
  }
}
