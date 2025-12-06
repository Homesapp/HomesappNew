import OpenAI from "openai";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import pLimit from "p-limit";

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  sharpness: number;
}

export interface EnhancementResult {
  success: boolean;
  imageBuffer?: Buffer;
  error?: string;
}

export interface AnalysisResult {
  success: boolean;
  adjustments?: ImageAdjustments;
  description?: string;
  error?: string;
  usedFallback?: boolean;
}

export interface BatchEnhancementResult {
  success: boolean;
  adjustments: ImageAdjustments;
  description?: string;
  processed: number;
  failed: number;
  results: Map<string, EnhancementResult>;
  errors: { photoId: string; error: string }[];
  usedFallback?: boolean;
}

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 1.1,
  contrast: 1.15,
  saturation: 1.2,
  warmth: 10,
  sharpness: 1.0
};

const DEFAULT_DESCRIPTION = "Default Tulum luxury real estate preset: +10% brightness, +15% contrast, +20% saturation, warm tone";

function isAIConfigured(): boolean {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  
  if (!baseUrl || !apiKey) {
    console.warn("[Photo Enhancement] AI integration not configured - using default adjustments");
    return false;
  }
  return true;
}

function getOpenAIClient(): OpenAI | null {
  if (!isAIConfigured()) {
    return null;
  }
  
  return new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  });
}

export async function analyzePhotoForAdjustments(imageUrl: string): Promise<AnalysisResult> {
  const openai = getOpenAIClient();
  
  if (!openai) {
    console.log("[Photo Enhancement] Using default adjustments (AI not configured)");
    return {
      success: true,
      adjustments: DEFAULT_ADJUSTMENTS,
      description: DEFAULT_DESCRIPTION,
      usedFallback: true
    };
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional real estate photo editor specializing in luxury properties in Tulum, Mexico. 
Analyze property photos and provide specific numerical adjustments to make them look professional and appealing.
Your goal is to enhance photos for tropical luxury real estate listings.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this real estate photo and provide specific adjustments to enhance it professionally.

Return ONLY a JSON object with these exact numeric values:
{
  "brightness": <number 0.8-1.4, where 1.0 is no change>,
  "contrast": <number 0.8-1.4, where 1.0 is no change>,
  "saturation": <number 0.8-1.5, where 1.0 is no change>,
  "warmth": <number -30 to +30, where 0 is no change, positive adds warmth>,
  "sharpness": <number 0.5-2.0, where 1.0 is no change>,
  "description": "<brief description of recommended enhancements in Spanish>"
}

Consider:
- Tropical/warm lighting for Tulum aesthetic
- Professional real estate standards
- Natural, non-artificial look
- Good balance of brightness and contrast`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error("[Photo Enhancement] Failed to parse AI response:", content);
      throw new Error("Invalid JSON response from AI");
    }

    if (typeof parsed.brightness !== 'number' || typeof parsed.contrast !== 'number') {
      console.warn("[Photo Enhancement] AI response missing expected fields, using partial defaults");
    }
    
    const adjustments: ImageAdjustments = {
      brightness: Math.max(0.8, Math.min(1.4, parsed.brightness ?? 1.1)),
      contrast: Math.max(0.8, Math.min(1.4, parsed.contrast ?? 1.15)),
      saturation: Math.max(0.8, Math.min(1.5, parsed.saturation ?? 1.2)),
      warmth: Math.max(-30, Math.min(30, parsed.warmth ?? 10)),
      sharpness: Math.max(0.5, Math.min(2.0, parsed.sharpness ?? 1.0))
    };

    const description = parsed.description || formatAdjustmentsDescription(adjustments);

    console.log("[AI Photo Analysis] Recommended adjustments:", adjustments, "Description:", description);

    return {
      success: true,
      adjustments,
      description,
      usedFallback: false
    };
  } catch (error: any) {
    console.error("[Photo Enhancement] Analysis error:", error.message);
    return {
      success: true,
      adjustments: DEFAULT_ADJUSTMENTS,
      description: DEFAULT_DESCRIPTION,
      error: error.message,
      usedFallback: true
    };
  }
}

function formatAdjustmentsDescription(adj: ImageAdjustments): string {
  const parts: string[] = [];
  if (adj.brightness !== 1.0) parts.push(`brillo ${adj.brightness > 1 ? '+' : ''}${Math.round((adj.brightness - 1) * 100)}%`);
  if (adj.contrast !== 1.0) parts.push(`contraste ${adj.contrast > 1 ? '+' : ''}${Math.round((adj.contrast - 1) * 100)}%`);
  if (adj.saturation !== 1.0) parts.push(`saturación ${adj.saturation > 1 ? '+' : ''}${Math.round((adj.saturation - 1) * 100)}%`);
  if (adj.warmth !== 0) parts.push(`calidez ${adj.warmth > 0 ? '+' : ''}${adj.warmth}`);
  if (adj.sharpness !== 1.0) parts.push(`nitidez ${adj.sharpness > 1 ? '+' : ''}${Math.round((adj.sharpness - 1) * 100)}%`);
  return parts.length > 0 ? `Ajustes aplicados: ${parts.join(', ')}` : 'Sin ajustes significativos';
}

export async function applyAdjustmentsToPhoto(
  imageUrl: string, 
  adjustments: ImageAdjustments
): Promise<EnhancementResult> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    let pipeline = sharp(imageBuffer);
    
    pipeline = pipeline.modulate({
      brightness: adjustments.brightness,
      saturation: adjustments.saturation
    });
    
    if (adjustments.contrast !== 1.0) {
      pipeline = pipeline.linear(adjustments.contrast, -(128 * (adjustments.contrast - 1)));
    }
    
    if (adjustments.warmth !== 0) {
      const warmthAmount = adjustments.warmth;
      if (warmthAmount > 0) {
        pipeline = pipeline.tint({ r: 255, g: 240 - warmthAmount, b: 220 - warmthAmount * 2 });
      } else {
        pipeline = pipeline.tint({ r: 220 + warmthAmount * 2, g: 240 + warmthAmount, b: 255 });
      }
    }
    
    if (adjustments.sharpness > 1.0) {
      const sharpenAmount = (adjustments.sharpness - 1.0) * 2;
      pipeline = pipeline.sharpen({
        sigma: 1 + sharpenAmount,
        m1: 0.5,
        m2: 0.5
      });
    }
    
    const resultBuffer = await pipeline
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();

    return {
      success: true,
      imageBuffer: resultBuffer
    };
  } catch (error: any) {
    console.error("[Photo Enhancement] Adjustment error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to apply adjustments"
    };
  }
}

export async function analyzeAndEnhanceAllPhotos(
  photos: { id: string; url: string }[],
  onProgress?: (message: string, current: number, total: number) => void
): Promise<BatchEnhancementResult> {
  if (photos.length === 0) {
    return {
      success: false,
      adjustments: DEFAULT_ADJUSTMENTS,
      description: "No photos to process",
      processed: 0,
      failed: 0,
      results: new Map(),
      errors: []
    };
  }

  onProgress?.("Analizando foto con IA...", 0, photos.length);
  
  const samplePhoto = photos[0];
  const analysisResult = await analyzePhotoForAdjustments(samplePhoto.url);
  
  const adjustments = analysisResult.adjustments || DEFAULT_ADJUSTMENTS;
  const description = analysisResult.description || DEFAULT_DESCRIPTION;
  const usedFallback = analysisResult.usedFallback;

  console.log("[Batch Enhancement] Using adjustments:", adjustments, "Fallback:", usedFallback);

  const results = new Map<string, EnhancementResult>();
  const errors: { photoId: string; error: string }[] = [];
  const limit = pLimit(3);
  let processed = 0;
  let failed = 0;

  const processingPromises = photos.map((photo, index) =>
    limit(async () => {
      onProgress?.(`Procesando foto ${index + 1}/${photos.length}`, index + 1, photos.length);
      
      const result = await applyAdjustmentsToPhoto(photo.url, adjustments);
      results.set(photo.id, result);
      
      if (result.success) {
        processed++;
      } else {
        failed++;
        errors.push({ photoId: photo.id, error: result.error || "Unknown error" });
        console.error(`[Batch Enhancement] Failed photo ${photo.id}:`, result.error);
      }
      
      return result;
    })
  );

  await Promise.all(processingPromises);

  onProgress?.("Proceso completado", photos.length, photos.length);

  return {
    success: processed > 0,
    adjustments,
    description,
    processed,
    failed,
    results,
    errors,
    usedFallback
  };
}

export async function applyPresetToPhotos(
  photos: { id: string; url: string }[],
  adjustments: ImageAdjustments,
  onProgress?: (message: string, current: number, total: number) => void
): Promise<BatchEnhancementResult> {
  const results = new Map<string, EnhancementResult>();
  const errors: { photoId: string; error: string }[] = [];
  const limit = pLimit(3);
  let processed = 0;
  let failed = 0;

  const processingPromises = photos.map((photo, index) =>
    limit(async () => {
      onProgress?.(`Aplicando filtro ${index + 1}/${photos.length}`, index + 1, photos.length);
      
      const result = await applyAdjustmentsToPhoto(photo.url, adjustments);
      results.set(photo.id, result);
      
      if (result.success) {
        processed++;
      } else {
        failed++;
        errors.push({ photoId: photo.id, error: result.error || "Unknown error" });
      }
      
      return result;
    })
  );

  await Promise.all(processingPromises);

  return {
    success: processed > 0,
    adjustments,
    description: formatAdjustmentsDescription(adjustments),
    processed,
    failed,
    results,
    errors
  };
}
