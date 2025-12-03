// ============================================
// SELLER SOCIAL MEDIA MARKETING ROUTES
// ============================================

import type { Express, Request } from "express";
import { db } from "./db";
import { storage } from "./storage";
import { isAuthenticated, requireRole } from "./replitAuth";
import { 
  sellerSocialMediaTemplates,
  sellerSocialMediaReminders,
  insertSellerSocialMediaTemplateSchema,
  insertSellerSocialMediaReminderSchema,
  externalUnits,
} from "@shared/schema";
import { eq, and, or, desc, asc, gte, lte, isNull } from "drizzle-orm";
import { z } from "zod";
import { openAIService } from "./services/openai";

const EXTERNAL_ADMIN_ROLES = ['external_agency_owner', 'external_agency_admin', 'external_agency_manager'];
const SELLER_ROLES = ['external_agency_seller', ...EXTERNAL_ADMIN_ROLES];

// Helper to get user's agency ID
async function getUserAgencyId(req: any): Promise<string | null> {
  const userId = req.user?.id;
  if (!userId) return null;
  const user = await storage.getUser(userId);
  return user?.externalAgencyId || null;
}

export function registerSocialMediaRoutes(app: Express) {
  
  // ============================================
  // SOCIAL MEDIA TEMPLATES
  // ============================================
  
  // GET /api/external-seller/social-templates - Get all templates for seller
  app.get("/api/external-seller/social-templates", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { platform, category } = req.query;
      
      let query = db
        .select()
        .from(sellerSocialMediaTemplates)
        .where(
          and(
            eq(sellerSocialMediaTemplates.agencyId, agencyId),
            eq(sellerSocialMediaTemplates.isActive, true),
            or(
              isNull(sellerSocialMediaTemplates.sellerId),
              eq(sellerSocialMediaTemplates.sellerId, req.user.id)
            )
          )
        )
        .orderBy(desc(sellerSocialMediaTemplates.usageCount), desc(sellerSocialMediaTemplates.createdAt));
      
      const templates = await query;
      
      // Filter by platform/category in JS since drizzle doesn't support dynamic where easily
      let filtered = templates;
      if (platform) {
        filtered = filtered.filter(t => t.platform === platform);
      }
      if (category) {
        filtered = filtered.filter(t => t.category === category);
      }
      
      res.json(filtered);
    } catch (error: any) {
      console.error("Error fetching social media templates:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // POST /api/external-seller/social-templates - Create a new template
  app.post("/api/external-seller/social-templates", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const parsed = insertSellerSocialMediaTemplateSchema.parse({
        ...req.body,
        agencyId,
        sellerId: req.body.isShared ? null : req.user.id,
      });
      
      const [template] = await db
        .insert(sellerSocialMediaTemplates)
        .values(parsed)
        .returning();
      
      res.status(201).json(template);
    } catch (error: any) {
      console.error("Error creating social media template:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // PATCH /api/external-seller/social-templates/:id - Update a template
  app.patch("/api/external-seller/social-templates/:id", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { id } = req.params;
      const { title, content, hashtags, category, platform, isActive } = req.body;
      
      // Verify ownership
      const [existing] = await db
        .select()
        .from(sellerSocialMediaTemplates)
        .where(and(
          eq(sellerSocialMediaTemplates.id, id),
          eq(sellerSocialMediaTemplates.agencyId, agencyId)
        ));
      
      if (!existing) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Only allow editing own templates or shared templates for admins
      if (existing.sellerId && existing.sellerId !== req.user.id && !EXTERNAL_ADMIN_ROLES.includes(req.user.role)) {
        return res.status(403).json({ message: "Cannot edit this template" });
      }
      
      const [updated] = await db
        .update(sellerSocialMediaTemplates)
        .set({
          title: title ?? existing.title,
          content: content ?? existing.content,
          hashtags: hashtags ?? existing.hashtags,
          category: category ?? existing.category,
          platform: platform ?? existing.platform,
          isActive: isActive ?? existing.isActive,
          updatedAt: new Date(),
        })
        .where(eq(sellerSocialMediaTemplates.id, id))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating social media template:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // DELETE /api/external-seller/social-templates/:id - Delete a template
  app.delete("/api/external-seller/social-templates/:id", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { id } = req.params;
      
      // Verify ownership
      const [existing] = await db
        .select()
        .from(sellerSocialMediaTemplates)
        .where(and(
          eq(sellerSocialMediaTemplates.id, id),
          eq(sellerSocialMediaTemplates.agencyId, agencyId)
        ));
      
      if (!existing) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Only allow deleting own templates or for admins
      if (existing.sellerId && existing.sellerId !== req.user.id && !EXTERNAL_ADMIN_ROLES.includes(req.user.role)) {
        return res.status(403).json({ message: "Cannot delete this template" });
      }
      
      await db
        .delete(sellerSocialMediaTemplates)
        .where(eq(sellerSocialMediaTemplates.id, id));
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting social media template:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // POST /api/external-seller/social-templates/:id/use - Increment usage count
  app.post("/api/external-seller/social-templates/:id/use", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { id } = req.params;
      
      const [template] = await db
        .select()
        .from(sellerSocialMediaTemplates)
        .where(and(
          eq(sellerSocialMediaTemplates.id, id),
          eq(sellerSocialMediaTemplates.agencyId, agencyId)
        ));
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const [updated] = await db
        .update(sellerSocialMediaTemplates)
        .set({
          usageCount: template.usageCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(sellerSocialMediaTemplates.id, id))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating template usage:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // POST /api/external-seller/social-templates/seed-defaults - Create default templates
  app.post("/api/external-seller/social-templates/seed-defaults", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      // Check if templates already exist
      const existing = await db
        .select()
        .from(sellerSocialMediaTemplates)
        .where(eq(sellerSocialMediaTemplates.agencyId, agencyId));
      
      if (existing.length > 0) {
        return res.json({ message: "Templates already exist", count: existing.length });
      }
      
      // Default templates for each platform
      const defaultTemplates = [
        // Facebook templates
        {
          agencyId,
          sellerId: null,
          platform: "facebook" as const,
          category: "new_listing" as const,
          title: "Nueva Propiedad - Facebook",
          content: "🏠 ¡Nueva propiedad disponible en {{location}}!\n\n✨ {{propertyType}} con {{bedrooms}} recámaras\n💰 Precio: {{price}} MXN\n📍 Ubicación: {{address}}\n\n¿Te interesa? ¡Contáctame para más información!\n\n{{hashtags}}",
          hashtags: "#Tulum #BienesRaices #PropiedadEnVenta #InvierteEnTulum #RealEstate",
          isDefault: true,
          isActive: true,
        },
        {
          agencyId,
          sellerId: null,
          platform: "facebook" as const,
          category: "featured" as const,
          title: "Propiedad Destacada - Facebook",
          content: "⭐ PROPIEDAD DESTACADA ⭐\n\n🏡 {{propertyType}} en {{location}}\n🛏️ {{bedrooms}} recámaras | 🚿 {{bathrooms}} baños\n📐 {{area}} m²\n💵 {{price}} MXN\n\n📸 ¡No te pierdas esta oportunidad única!\n\n{{hashtags}}",
          hashtags: "#PropiedadDestacada #Tulum #Inversión #LuxuryRealEstate",
          isDefault: true,
          isActive: true,
        },
        // Instagram templates
        {
          agencyId,
          sellerId: null,
          platform: "instagram" as const,
          category: "new_listing" as const,
          title: "Nueva Propiedad - Instagram",
          content: "📍 {{location}}\n\n🏠 {{propertyType}} disponible\n🛏️ {{bedrooms}} recámaras\n💰 {{price}} MXN\n\n✨ Características principales:\n• Ubicación privilegiada\n• Amenidades de lujo\n• Excelente inversión\n\n🔗 Link en bio para más info\n\n{{hashtags}}",
          hashtags: "#Tulum #Mexico #RealEstate #PropertyForSale #LuxuryLiving #Investment #TulumRealEstate #BeachLife #Paradise",
          isDefault: true,
          isActive: true,
        },
        {
          agencyId,
          sellerId: null,
          platform: "instagram" as const,
          category: "open_house" as const,
          title: "Casa Abierta - Instagram",
          content: "🏠 ¡CASA ABIERTA ESTE FIN DE SEMANA!\n\n📅 Fecha: {{date}}\n⏰ Horario: {{time}}\n📍 {{address}}\n\n✨ {{propertyType}} con:\n🛏️ {{bedrooms}} recámaras\n🚿 {{bathrooms}} baños\n💰 {{price}} MXN\n\n¡Te esperamos! 🎉\n\n{{hashtags}}",
          hashtags: "#OpenHouse #CasaAbierta #Tulum #RealEstate #PropertyTour",
          isDefault: true,
          isActive: true,
        },
        // WhatsApp templates
        {
          agencyId,
          sellerId: null,
          platform: "whatsapp" as const,
          category: "new_listing" as const,
          title: "Nueva Propiedad - WhatsApp",
          content: "¡Hola! 👋\n\nTengo una nueva propiedad que podría interesarte:\n\n🏠 *{{propertyType}}* en *{{location}}*\n\n📍 Ubicación: {{address}}\n🛏️ Recámaras: {{bedrooms}}\n🚿 Baños: {{bathrooms}}\n📐 Área: {{area}} m²\n💰 Precio: {{price}} MXN\n\n¿Te gustaría agendar una visita? 📅",
          hashtags: null,
          isDefault: true,
          isActive: true,
        },
        {
          agencyId,
          sellerId: null,
          platform: "whatsapp" as const,
          category: "follow_up" as const,
          title: "Seguimiento - WhatsApp",
          content: "¡Hola {{clientName}}! 👋\n\nEspero que estés bien. Te escribo para dar seguimiento a la propiedad que te compartí anteriormente.\n\n¿Tuviste oportunidad de revisar la información? ¿Te gustaría agendar una visita?\n\nQuedo atento a tus comentarios. 😊",
          hashtags: null,
          isDefault: true,
          isActive: true,
        },
        {
          agencyId,
          sellerId: null,
          platform: "whatsapp" as const,
          category: "promotion" as const,
          title: "Promoción Especial - WhatsApp",
          content: "🎉 *¡PROMOCIÓN ESPECIAL!* 🎉\n\n{{propertyType}} en {{location}} con *descuento exclusivo*\n\n💰 Precio especial: {{price}} MXN\n📅 Válido hasta: {{endDate}}\n\n¿Interesado? ¡Contáctame ahora! 📱",
          hashtags: null,
          isDefault: true,
          isActive: true,
        },
      ];
      
      const inserted = await db
        .insert(sellerSocialMediaTemplates)
        .values(defaultTemplates)
        .returning();
      
      res.json({ message: "Default templates created", count: inserted.length, templates: inserted });
    } catch (error: any) {
      console.error("Error seeding default templates:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================
  // AI GENERATION
  // ============================================
  
  // POST /api/external-seller/social-templates/generate - Generate template with AI
  app.post("/api/external-seller/social-templates/generate", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { platform, category, propertyInfo, language = "es", tone = "professional" } = req.body;
      
      if (!platform || !propertyInfo) {
        return res.status(400).json({ message: "Platform and property info required" });
      }
      
      const platformGuide: Record<string, string> = {
        facebook: "Facebook post: Can be longer, use emojis moderately, include call to action.",
        instagram: "Instagram caption: Engaging, use relevant emojis, include hashtag suggestions at the end.",
        whatsapp: "WhatsApp message: Personal and direct, use *bold* for emphasis, keep it conversational.",
      };
      
      const categoryGuide: Record<string, string> = {
        new_listing: "Announcing a new property listing",
        price_update: "Announcing a price change or special offer",
        open_house: "Inviting to an open house event",
        featured: "Highlighting a featured/special property",
        promotion: "Special promotion or limited-time offer",
        general: "General property showcase",
      };
      
      const toneGuide: Record<string, string> = {
        professional: "Professional and trustworthy",
        friendly: "Warm and approachable",
        luxury: "Elegant and exclusive",
        urgent: "Creating urgency to act now",
      };
      
      const languageGuide = language === "en" ? "Write in English" : "Escribe en español";
      
      const prompt = `You are a real estate marketing expert. Generate a compelling social media post for the following:

Platform: ${platform} - ${platformGuide[platform] || "Social media post"}
Purpose: ${categoryGuide[category] || "Property promotion"}
Tone: ${toneGuide[tone] || "Professional"}
Language: ${languageGuide}

Property Details:
${JSON.stringify(propertyInfo, null, 2)}

Requirements:
1. Use appropriate emojis for the platform
2. Include property highlights
3. Add a call to action
4. For Instagram, include relevant hashtags (8-12 hashtags)
5. For WhatsApp, use *bold* for emphasis
6. Keep it engaging and platform-appropriate
7. Use placeholders like {{price}}, {{location}}, {{bedrooms}} where applicable for reusability

Generate ONLY the post content, no additional explanation.`;

      const response = await openAIService.chat([
        { role: "system", content: "You are a real estate social media marketing expert specializing in the Tulum, Mexico market." },
        { role: "user", content: prompt }
      ]);
      
      // Extract hashtags if present
      let content = response;
      let hashtags = null;
      
      if (platform === "instagram") {
        const hashtagMatch = content.match(/(#[\w\u00C0-\u017F]+\s*)+$/);
        if (hashtagMatch) {
          hashtags = hashtagMatch[0].trim();
        }
      }
      
      res.json({
        content,
        hashtags,
        platform,
        category: category || "general",
        isAiGenerated: true,
      });
    } catch (error: any) {
      console.error("Error generating social media content:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================
  // SOCIAL MEDIA REMINDERS
  // ============================================
  
  // GET /api/external-seller/social-reminders - Get reminders for seller
  app.get("/api/external-seller/social-reminders", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { showCompleted, startDate, endDate, platform } = req.query;
      
      let conditions = [
        eq(sellerSocialMediaReminders.agencyId, agencyId),
        eq(sellerSocialMediaReminders.sellerId, req.user.id),
      ];
      
      if (showCompleted !== "true") {
        conditions.push(eq(sellerSocialMediaReminders.isCompleted, false));
      }
      
      if (startDate) {
        conditions.push(gte(sellerSocialMediaReminders.scheduledAt, new Date(startDate as string)));
      }
      
      if (endDate) {
        conditions.push(lte(sellerSocialMediaReminders.scheduledAt, new Date(endDate as string)));
      }
      
      const reminders = await db
        .select({
          reminder: sellerSocialMediaReminders,
          unit: {
            id: externalUnits.id,
            unitNumber: externalUnits.unitNumber,
            slug: externalUnits.slug,
          },
        })
        .from(sellerSocialMediaReminders)
        .leftJoin(externalUnits, eq(sellerSocialMediaReminders.unitId, externalUnits.id))
        .where(and(...conditions))
        .orderBy(asc(sellerSocialMediaReminders.scheduledAt));
      
      // Filter by platform in JS
      let filtered = reminders;
      if (platform) {
        filtered = filtered.filter(r => r.reminder.platform === platform);
      }
      
      res.json(filtered.map(r => ({
        ...r.reminder,
        unit: r.unit,
      })));
    } catch (error: any) {
      console.error("Error fetching social media reminders:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // POST /api/external-seller/social-reminders - Create a new reminder
  app.post("/api/external-seller/social-reminders", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const parsed = insertSellerSocialMediaReminderSchema.parse({
        ...req.body,
        agencyId,
        sellerId: req.user.id,
        scheduledAt: new Date(req.body.scheduledAt),
      });
      
      const [reminder] = await db
        .insert(sellerSocialMediaReminders)
        .values(parsed)
        .returning();
      
      res.status(201).json(reminder);
    } catch (error: any) {
      console.error("Error creating social media reminder:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // PATCH /api/external-seller/social-reminders/:id - Update a reminder
  app.patch("/api/external-seller/social-reminders/:id", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { id } = req.params;
      const { title, notes, scheduledAt, platform, isCompleted } = req.body;
      
      // Verify ownership
      const [existing] = await db
        .select()
        .from(sellerSocialMediaReminders)
        .where(and(
          eq(sellerSocialMediaReminders.id, id),
          eq(sellerSocialMediaReminders.agencyId, agencyId),
          eq(sellerSocialMediaReminders.sellerId, req.user.id)
        ));
      
      if (!existing) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (title !== undefined) updateData.title = title;
      if (notes !== undefined) updateData.notes = notes;
      if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
      if (platform !== undefined) updateData.platform = platform;
      if (isCompleted !== undefined) {
        updateData.isCompleted = isCompleted;
        if (isCompleted) {
          updateData.completedAt = new Date();
        } else {
          updateData.completedAt = null;
        }
      }
      
      const [updated] = await db
        .update(sellerSocialMediaReminders)
        .set(updateData)
        .where(eq(sellerSocialMediaReminders.id, id))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating social media reminder:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // PATCH /api/external-seller/social-reminders/:id/complete - Mark reminder as complete
  app.patch("/api/external-seller/social-reminders/:id/complete", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { id } = req.params;
      
      // Verify ownership
      const [existing] = await db
        .select()
        .from(sellerSocialMediaReminders)
        .where(and(
          eq(sellerSocialMediaReminders.id, id),
          eq(sellerSocialMediaReminders.agencyId, agencyId),
          eq(sellerSocialMediaReminders.sellerId, req.user.id)
        ));
      
      if (!existing) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      const [updated] = await db
        .update(sellerSocialMediaReminders)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sellerSocialMediaReminders.id, id))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error completing reminder:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // DELETE /api/external-seller/social-reminders/:id - Delete a reminder
  app.delete("/api/external-seller/social-reminders/:id", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { id } = req.params;
      
      // Verify ownership
      const [existing] = await db
        .select()
        .from(sellerSocialMediaReminders)
        .where(and(
          eq(sellerSocialMediaReminders.id, id),
          eq(sellerSocialMediaReminders.agencyId, agencyId),
          eq(sellerSocialMediaReminders.sellerId, req.user.id)
        ));
      
      if (!existing) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      await db
        .delete(sellerSocialMediaReminders)
        .where(eq(sellerSocialMediaReminders.id, id));
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting reminder:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // GET /api/external-seller/social-reminders/upcoming - Get upcoming reminders count
  app.get("/api/external-seller/social-reminders/upcoming", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      
      const reminders = await db
        .select()
        .from(sellerSocialMediaReminders)
        .where(and(
          eq(sellerSocialMediaReminders.agencyId, agencyId),
          eq(sellerSocialMediaReminders.sellerId, req.user.id),
          eq(sellerSocialMediaReminders.isCompleted, false),
          lte(sellerSocialMediaReminders.scheduledAt, tomorrow)
        ));
      
      const overdue = reminders.filter(r => new Date(r.scheduledAt) < now).length;
      const today = reminders.filter(r => {
        const scheduled = new Date(r.scheduledAt);
        return scheduled >= now && scheduled.toDateString() === now.toDateString();
      }).length;
      const tomorrowCount = reminders.filter(r => {
        const scheduled = new Date(r.scheduledAt);
        return scheduled.toDateString() === tomorrow.toDateString();
      }).length;
      
      res.json({
        total: reminders.length,
        overdue,
        today,
        tomorrow: tomorrowCount,
        reminders,
      });
    } catch (error: any) {
      console.error("Error fetching upcoming reminders:", error);
      res.status(500).json({ message: error.message });
    }
  });
}
