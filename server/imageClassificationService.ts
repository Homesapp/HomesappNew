import { GoogleGenAI } from "@google/genai";
import { db } from "./db";
import { externalUnitMedia } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LABELS = [
  'kitchen',
  'bedroom',
  'bathroom',
  'dining_room',
  'living_room',
  'balcony',
  'rooftop',
  'pool',
  'gym',
  'entrance',
  'facade',
  'other'
] as const;

type MediaLabel = typeof LABELS[number];

interface ClassificationResult {
  primaryLabel: MediaLabel;
  labels: MediaLabel[];
  confidence: number;
  description: string;
}

let genAI: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return genAI;
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  let fullUrl = imageUrl;
  
  if (imageUrl.startsWith('/api/')) {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
    fullUrl = `https://${baseUrl}${imageUrl}`;
  }
  
  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  
  return { base64, mimeType: contentType };
}

export async function classifyImage(imageUrl: string): Promise<ClassificationResult> {
  const client = getGeminiClient();
  
  const { base64, mimeType } = await fetchImageAsBase64(imageUrl);
  
  const prompt = `You are analyzing a real estate property photo. 
Classify this image into ONE primary category from this list:
- kitchen: Kitchen or cocina
- bedroom: Bedroom or recámara
- bathroom: Bathroom or baño
- dining_room: Dining area or comedor
- living_room: Living room or sala
- balcony: Balcony or terrace
- rooftop: Rooftop area
- pool: Swimming pool area
- gym: Gym or fitness center
- entrance: Building entrance or lobby
- facade: Building exterior or facade
- other: Anything that doesn't fit above categories

Also list all applicable secondary labels from the same list.

Respond ONLY with valid JSON in this exact format:
{
  "primary": "bedroom",
  "secondary": ["balcony"],
  "confidence": 0.85,
  "description": "Master bedroom with ocean view and modern finishes"
}`;

  const response = await client.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          { text: prompt },
        ],
      },
    ],
  });
  
  const text = response.text || '';
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No valid JSON in response");
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  const primaryLabel = LABELS.includes(parsed.primary) ? parsed.primary : 'other';
  const secondaryLabels = (parsed.secondary || []).filter((l: string) => LABELS.includes(l as any));
  const allLabels = [primaryLabel, ...secondaryLabels.filter((l: string) => l !== primaryLabel)];
  
  return {
    primaryLabel,
    labels: allLabels as MediaLabel[],
    confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    description: parsed.description || '',
  };
}

export async function classifyMediaItem(mediaId: string): Promise<boolean> {
  const [media] = await db
    .select()
    .from(externalUnitMedia)
    .where(eq(externalUnitMedia.id, mediaId))
    .limit(1);
  
  if (!media || media.mediaType !== 'photo') {
    console.log(`Skipping media ${mediaId}: not a photo or not found`);
    return false;
  }
  
  if (!media.thumbnailUrl) {
    console.log(`Skipping media ${mediaId}: no thumbnail URL`);
    return false;
  }
  
  try {
    console.log(`Classifying: ${media.fileName}`);
    
    const result = await classifyImage(media.thumbnailUrl);
    
    await db
      .update(externalUnitMedia)
      .set({
        aiPrimaryLabel: result.primaryLabel,
        aiLabels: result.labels,
        aiConfidence: result.confidence,
        aiDescription: result.description,
        status: 'processed',
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(externalUnitMedia.id, mediaId));
    
    console.log(`  → ${result.primaryLabel} (${Math.round(result.confidence * 100)}%)`);
    return true;
    
  } catch (error: any) {
    console.error(`Error classifying ${mediaId}: ${error.message}`);
    
    await db
      .update(externalUnitMedia)
      .set({
        status: 'error',
        updatedAt: new Date(),
      })
      .where(eq(externalUnitMedia.id, mediaId));
    
    return false;
  }
}

export async function classifyPendingMedia(limit: number = 10): Promise<{ processed: number; errors: number }> {
  const pendingMedia = await db
    .select()
    .from(externalUnitMedia)
    .where(and(
      eq(externalUnitMedia.mediaType, 'photo'),
      eq(externalUnitMedia.status, 'pending')
    ))
    .limit(limit);
  
  console.log(`Found ${pendingMedia.length} pending photos to classify`);
  
  let processed = 0;
  let errors = 0;
  
  for (const media of pendingMedia) {
    const success = await classifyMediaItem(media.id);
    if (success) {
      processed++;
    } else {
      errors++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return { processed, errors };
}

export async function getClassificationStats(): Promise<{
  total: number;
  pending: number;
  processed: number;
  errors: number;
  byLabel: Record<string, number>;
}> {
  const countsResult = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending' AND media_type = 'photo') as pending,
      COUNT(*) FILTER (WHERE status = 'processed') as processed,
      COUNT(*) FILTER (WHERE status = 'error') as errors
    FROM external_unit_media
    WHERE media_type = 'photo'
  `);
  
  const counts = (countsResult.rows || [])[0] || {};
  
  const labelCounts = await db.execute(sql`
    SELECT 
      COALESCE(manual_label::text, ai_primary_label::text, 'unclassified') as label,
      COUNT(*) as count
    FROM external_unit_media
    WHERE media_type = 'photo' AND status = 'processed'
    GROUP BY COALESCE(manual_label::text, ai_primary_label::text, 'unclassified')
    ORDER BY count DESC
  `);
  
  const byLabel: Record<string, number> = {};
  for (const row of (labelCounts.rows || [])) {
    byLabel[(row as any).label] = parseInt((row as any).count);
  }
  
  return {
    total: parseInt((counts as any).total || '0'),
    pending: parseInt((counts as any).pending || '0'),
    processed: parseInt((counts as any).processed || '0'),
    errors: parseInt((counts as any).errors || '0'),
    byLabel,
  };
}
