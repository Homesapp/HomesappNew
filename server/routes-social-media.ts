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
  externalAgencies,
  externalCondominiums,
  externalAiCreditEvents,
  externalSocialLinkClicks,
  externalSellerProfiles,
} from "@shared/schema";
import { eq, and, or, desc, asc, gte, lte, isNull, ilike, sql } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { openAIService } from "./services/openai";

const EXTERNAL_ADMIN_ROLES = ['master', 'admin', 'external_agency_admin'];
const SELLER_ROLES = ['external_agency_seller', 'external_agency_staff', ...EXTERNAL_ADMIN_ROLES];

// Helper to get user's agency ID
async function getUserAgencyId(req: any): Promise<string | null> {
  try {
    // Admin and master users don't have an agency
    const userRole = req.user?.cachedRole || req.user?.role || req.session?.adminUser?.role;
    if (userRole === "master" || userRole === "admin") {
      return null;
    }

    // Try to use cached agencyId from isAuthenticated middleware first
    if (req.user?.cachedAgencyId) {
      return req.user.cachedAgencyId;
    }

    // Check session cache (with TTL validation - 5 min)
    const CACHE_TTL_MS = 5 * 60 * 1000;
    const now = Date.now();
    const cacheValid = req.session?.cachedUser?.externalAgencyId && 
                       req.session.cachedUser.cachedAt && 
                       (now - req.session.cachedUser.cachedAt) < CACHE_TTL_MS;
    if (cacheValid) {
      return req.session.cachedUser.externalAgencyId;
    }

    // Get user ID from authentication
    const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) {
      return null;
    }

    // Fallback: Get the user's external agency ID from DB
    const user = await storage.getUser(userId);
    return user?.externalAgencyId || null;
  } catch (error) {
    console.error("Error getting user agency ID:", error);
    return null;
  }
}

export function registerSocialMediaRoutes(app: Express) {
  
  // ============================================
  // AGENCY CONFIG FOR SELLERS
  // ============================================
  
  // GET /api/external-seller/agency-config - Get agency config for seller (AI credits status, etc.)
  // Now returns seller-specific credits, not agency-level credits
  app.get("/api/external-seller/agency-config", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) return res.status(401).json({ message: "User not found" });
      
      // Get seller profile with AI credits
      const [sellerProfile] = await db
        .select({
          aiCreditBalance: externalSellerProfiles.aiCreditBalance,
          aiCreditUsed: externalSellerProfiles.aiCreditUsed,
          aiCreditTotalAssigned: externalSellerProfiles.aiCreditTotalAssigned,
        })
        .from(externalSellerProfiles)
        .where(and(
          eq(externalSellerProfiles.agencyId, agencyId),
          eq(externalSellerProfiles.userId, userId)
        ));
      
      // If no profile exists, create one with default credits
      if (!sellerProfile) {
        const [newProfile] = await db
          .insert(externalSellerProfiles)
          .values({
            agencyId,
            userId,
            aiCreditBalance: 10,
            aiCreditTotalAssigned: 10,
            aiCreditUsed: 0,
          })
          .returning({
            aiCreditBalance: externalSellerProfiles.aiCreditBalance,
            aiCreditUsed: externalSellerProfiles.aiCreditUsed,
            aiCreditTotalAssigned: externalSellerProfiles.aiCreditTotalAssigned,
          });
        
        return res.json({
          aiCreditsEnabled: true,
          aiCreditBalance: newProfile?.aiCreditBalance || 10,
          aiCreditUsed: newProfile?.aiCreditUsed || 0,
          aiCreditTotalAssigned: newProfile?.aiCreditTotalAssigned || 10,
          monthlyUsed: 0,
        });
      }
      
      res.json({
        aiCreditsEnabled: true,
        aiCreditBalance: sellerProfile.aiCreditBalance || 0,
        aiCreditUsed: sellerProfile.aiCreditUsed || 0,
        aiCreditTotalAssigned: sellerProfile.aiCreditTotalAssigned || 10,
        monthlyUsed: sellerProfile.aiCreditUsed || 0,
      });
    } catch (error: any) {
      console.error("Error fetching agency config:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================
  // AI CREDITS MANAGEMENT
  // ============================================
  
  // GET /api/external-seller/ai-credits/summary - Get AI credits summary for seller (per-seller credits)
  app.get("/api/external-seller/ai-credits/summary", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) return res.status(401).json({ message: "User not found" });
      
      // Get seller profile with credits
      const [sellerProfile] = await db
        .select({
          aiCreditBalance: externalSellerProfiles.aiCreditBalance,
          aiCreditUsed: externalSellerProfiles.aiCreditUsed,
          aiCreditTotalAssigned: externalSellerProfiles.aiCreditTotalAssigned,
        })
        .from(externalSellerProfiles)
        .where(and(
          eq(externalSellerProfiles.agencyId, agencyId),
          eq(externalSellerProfiles.userId, userId)
        ));
      
      // Get recent transactions for this seller
      const recentTransactions = await db
        .select()
        .from(externalAiCreditEvents)
        .where(and(
          eq(externalAiCreditEvents.agencyId, agencyId),
          eq(externalAiCreditEvents.sellerId, userId)
        ))
        .orderBy(desc(externalAiCreditEvents.createdAt))
        .limit(10);
      
      res.json({
        enabled: true,
        balance: sellerProfile?.aiCreditBalance || 0,
        used: sellerProfile?.aiCreditUsed || 0,
        totalAssigned: sellerProfile?.aiCreditTotalAssigned || 10,
        recentTransactions,
      });
    } catch (error: any) {
      console.error("Error fetching AI credits summary:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================
  // PROPERTY CATALOG FOR AI GENERATOR
  // ============================================
  
  // GET /api/external-seller/properties - Get properties for AI generator auto-fill
  app.get("/api/external-seller/properties", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { type, condominiumId, search, listingType } = req.query;
      
      // Base conditions
      const conditions = [
        eq(externalUnits.agencyId, agencyId),
        eq(externalUnits.isActive, true),
      ];
      
      // Filter by property type (condo or independent house)
      if (type === 'house') {
        conditions.push(isNull(externalUnits.condominiumId));
      } else if (type === 'condo') {
        // If condominiumId is provided, filter by that specific condo
        // Otherwise, show all properties that have a condominium (not independent houses)
        if (condominiumId) {
          conditions.push(eq(externalUnits.condominiumId, condominiumId as string));
        } else {
          conditions.push(sql`${externalUnits.condominiumId} IS NOT NULL`);
        }
      }
      
      // Filter by listing type
      if (listingType && listingType !== 'all') {
        conditions.push(
          or(
            eq(externalUnits.listingType, listingType as string),
            eq(externalUnits.listingType, 'both')
          )!
        );
      }
      
      // Get units with condominium info
      const units = await db
        .select({
          id: externalUnits.id,
          unitNumber: externalUnits.unitNumber,
          title: externalUnits.title,
          description: externalUnits.description,
          propertyType: externalUnits.propertyType,
          zone: externalUnits.zone,
          city: externalUnits.city,
          address: sql<string>`COALESCE(${externalUnits.address}, ${externalCondominiums.address})`,
          bedrooms: externalUnits.bedrooms,
          bathrooms: externalUnits.bathrooms,
          area: externalUnits.area,
          price: externalUnits.price,
          salePrice: externalUnits.salePrice,
          currency: externalUnits.currency,
          listingType: externalUnits.listingType,
          amenities: externalUnits.amenities,
          petFriendly: externalUnits.petFriendly,
          includedServices: externalUnits.includedServices,
          condominiumId: externalUnits.condominiumId,
          condominiumName: externalCondominiums.name,
          slug: externalUnits.slug,
          latitude: externalUnits.latitude,
          longitude: externalUnits.longitude,
        })
        .from(externalUnits)
        .leftJoin(externalCondominiums, eq(externalUnits.condominiumId, externalCondominiums.id))
        .where(and(...conditions))
        .orderBy(desc(externalUnits.updatedAt))
        .limit(100);
      
      // Filter by search term in JS
      let filtered = units;
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filtered = units.filter(u => 
          u.unitNumber.toLowerCase().includes(searchLower) ||
          (u.title && u.title.toLowerCase().includes(searchLower)) ||
          (u.zone && u.zone.toLowerCase().includes(searchLower)) ||
          (u.condominiumName && u.condominiumName.toLowerCase().includes(searchLower))
        );
      }
      
      res.json(filtered);
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // GET /api/external-seller/condominiums - Get condominiums list for property selector
  app.get("/api/external-seller/condominiums", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const condominiums = await db
        .select({
          id: externalCondominiums.id,
          name: externalCondominiums.name,
          zone: externalCondominiums.zone,
          address: externalCondominiums.address,
          propertyCategory: externalCondominiums.propertyCategory,
        })
        .from(externalCondominiums)
        .where(and(
          eq(externalCondominiums.agencyId, agencyId),
          eq(externalCondominiums.isActive, true)
        ))
        .orderBy(asc(externalCondominiums.name));
      
      res.json(condominiums);
    } catch (error: any) {
      console.error("Error fetching condominiums:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // GET /api/external-seller/properties/:id - Get single property details for auto-fill
  app.get("/api/external-seller/properties/:id", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { id } = req.params;
      
      const [unit] = await db
        .select({
          id: externalUnits.id,
          unitNumber: externalUnits.unitNumber,
          title: externalUnits.title,
          description: externalUnits.description,
          propertyType: externalUnits.propertyType,
          zone: externalUnits.zone,
          city: externalUnits.city,
          address: sql<string>`COALESCE(${externalUnits.address}, ${externalCondominiums.address})`,
          bedrooms: externalUnits.bedrooms,
          bathrooms: externalUnits.bathrooms,
          area: externalUnits.area,
          floor: externalUnits.floor,
          price: externalUnits.price,
          salePrice: externalUnits.salePrice,
          currency: externalUnits.currency,
          listingType: externalUnits.listingType,
          minimumTerm: externalUnits.minimumTerm,
          maximumTerm: externalUnits.maximumTerm,
          amenities: externalUnits.amenities,
          petFriendly: externalUnits.petFriendly,
          includedServices: externalUnits.includedServices,
          condominiumId: externalUnits.condominiumId,
          condominiumName: externalCondominiums.name,
          condominiumAddress: externalCondominiums.address,
          slug: externalUnits.slug,
          latitude: externalUnits.latitude,
          longitude: externalUnits.longitude,
        })
        .from(externalUnits)
        .leftJoin(externalCondominiums, eq(externalUnits.condominiumId, externalCondominiums.id))
        .where(and(
          eq(externalUnits.id, id),
          eq(externalUnits.agencyId, agencyId)
        ));
      
      if (!unit) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(unit);
    } catch (error: any) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================
  // SOCIAL LINK TRACKING
  // ============================================
  
  // POST /api/external-seller/tracking-links - Create a tracking link
  app.post("/api/external-seller/tracking-links", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const { targetUrl, unitId, platform } = req.body;
      
      if (!targetUrl) {
        return res.status(400).json({ message: "Target URL is required" });
      }
      
      // Generate unique token
      const token = crypto.randomBytes(8).toString('hex');
      
      const [link] = await db
        .insert(externalSocialLinkClicks)
        .values({
          agencyId,
          sellerId: req.user.id,
          unitId: unitId || null,
          token,
          targetUrl,
          platform: platform || null,
          isActive: true,
        })
        .returning();
      
      // Generate tracking URL
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'http://localhost:5000';
      const trackingUrl = `${baseUrl}/go/${token}`;
      
      res.json({
        ...link,
        trackingUrl,
      });
    } catch (error: any) {
      console.error("Error creating tracking link:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // GET /api/external-seller/tracking-links - Get seller's tracking links
  app.get("/api/external-seller/tracking-links", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const links = await db
        .select({
          id: externalSocialLinkClicks.id,
          token: externalSocialLinkClicks.token,
          targetUrl: externalSocialLinkClicks.targetUrl,
          platform: externalSocialLinkClicks.platform,
          clickCount: externalSocialLinkClicks.clickCount,
          lastClickedAt: externalSocialLinkClicks.lastClickedAt,
          createdAt: externalSocialLinkClicks.createdAt,
          unitId: externalSocialLinkClicks.unitId,
          unitNumber: externalUnits.unitNumber,
        })
        .from(externalSocialLinkClicks)
        .leftJoin(externalUnits, eq(externalSocialLinkClicks.unitId, externalUnits.id))
        .where(and(
          eq(externalSocialLinkClicks.agencyId, agencyId),
          eq(externalSocialLinkClicks.sellerId, req.user.id),
          eq(externalSocialLinkClicks.isActive, true)
        ))
        .orderBy(desc(externalSocialLinkClicks.createdAt))
        .limit(50);
      
      // Add tracking URLs
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'http://localhost:5000';
      
      const linksWithUrls = links.map(link => ({
        ...link,
        trackingUrl: `${baseUrl}/go/${link.token}`,
      }));
      
      res.json(linksWithUrls);
    } catch (error: any) {
      console.error("Error fetching tracking links:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
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
      
      const { title, platform, category, content, hashtags, isShared } = req.body;
      
      const parsed = insertSellerSocialMediaTemplateSchema.parse({
        title,
        platform,
        category: category || "general",
        content,
        hashtags: hashtags || null,
        agencyId,
        sellerId: isShared ? null : req.user.id,
        isAiGenerated: req.body.isAiGenerated || false,
        isDefault: false,
        isActive: true,
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
  
  // POST /api/external-seller/social-templates/generate - Generate template with AI (uses seller credits)
  app.post("/api/external-seller/social-templates/generate", isAuthenticated, requireRole(SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) return res.status(403).json({ message: "No agency access" });
      
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) return res.status(401).json({ message: "User not found" });
      
      // Get seller profile with credits
      let [sellerProfile] = await db
        .select({
          id: externalSellerProfiles.id,
          aiCreditBalance: externalSellerProfiles.aiCreditBalance,
          aiCreditUsed: externalSellerProfiles.aiCreditUsed,
        })
        .from(externalSellerProfiles)
        .where(and(
          eq(externalSellerProfiles.agencyId, agencyId),
          eq(externalSellerProfiles.userId, userId)
        ));
      
      // Create profile if doesn't exist
      if (!sellerProfile) {
        const [newProfile] = await db
          .insert(externalSellerProfiles)
          .values({
            agencyId,
            userId,
            aiCreditBalance: 10,
            aiCreditTotalAssigned: 10,
            aiCreditUsed: 0,
          })
          .returning();
        sellerProfile = {
          id: newProfile.id,
          aiCreditBalance: newProfile.aiCreditBalance,
          aiCreditUsed: newProfile.aiCreditUsed,
        };
      }
      
      // Check if seller has credits available
      if (sellerProfile.aiCreditBalance <= 0) {
        return res.status(403).json({
          message: "No tienes créditos de IA disponibles. Puedes usar las plantillas guardadas en la sección Manual.",
          messageEn: "No AI credits available. You can use saved templates in the Manual section.",
          code: "AI_CREDITS_EXHAUSTED"
        });
      }
      
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
      
      // Build property link if available
      let propertyLink = "";
      if (propertyInfo.publicUrl) {
        propertyLink = propertyInfo.publicUrl;
      } else if (propertyInfo.unitId && propertyInfo.agencySlug && propertyInfo.unitSlug) {
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
        const host = req.get('host');
        propertyLink = `${protocol}://${host}/${propertyInfo.agencySlug}/propiedad/${propertyInfo.unitSlug}`;
      }
      
      const prompt = `You are a real estate marketing expert. Generate a compelling social media post for the following:

Platform: ${platform} - ${platformGuide[platform] || "Social media post"}
Purpose: ${categoryGuide[category] || "Property promotion"}
Tone: ${toneGuide[tone] || "Professional"}
Language: ${languageGuide}

Property Details:
- Name: ${propertyInfo.name || propertyInfo.unitNumber || "Propiedad"}
- Location/Zone: ${propertyInfo.zone || propertyInfo.location || "Tulum"}
- Condominium: ${propertyInfo.condominiumName || ""}
- Bedrooms: ${propertyInfo.bedrooms || "N/A"}
- Bathrooms: ${propertyInfo.bathrooms || "N/A"}
- Area: ${propertyInfo.area || propertyInfo.squareMeters || "N/A"} m²
- Price: ${propertyInfo.price ? `$${Number(propertyInfo.price).toLocaleString()} ${propertyInfo.currency || "MXN"}` : "Consultar"}
- Property Type: ${propertyInfo.propertyType || "Inmueble"}
- Amenities: ${propertyInfo.amenities ? (Array.isArray(propertyInfo.amenities) ? propertyInfo.amenities.join(", ") : propertyInfo.amenities) : ""}
${propertyLink ? `- Property Link: ${propertyLink}` : ""}

Requirements:
1. Use appropriate emojis for the platform
2. Include ALL the property details provided above with their ACTUAL VALUES (price, bedrooms, bathrooms, area, location)
3. Add a compelling call to action
4. For Instagram, include relevant hashtags (8-12 hashtags) at the end
5. For WhatsApp, use *bold* for emphasis on key details
6. Keep it engaging and platform-appropriate
7. If a property link is provided, include it prominently in the post
8. Do NOT use placeholders like {{price}} - use the actual values provided

Generate ONLY the post content, no additional explanation.`;

      const response = await openAIService.chat([
        { role: "system", content: "You are a real estate social media marketing expert specializing in the Tulum, Mexico market." },
        { role: "user", content: prompt }
      ]);
      
      // Deduct credit from seller profile
      const creditCost = 1;
      const newBalance = sellerProfile.aiCreditBalance - creditCost;
      const newUsed = (sellerProfile.aiCreditUsed || 0) + creditCost;
      
      await db
        .update(externalSellerProfiles)
        .set({ 
          aiCreditBalance: newBalance,
          aiCreditUsed: newUsed,
          updatedAt: new Date(),
        })
        .where(eq(externalSellerProfiles.id, sellerProfile.id));
      
      // Record the usage event
      await db.insert(externalAiCreditEvents).values({
        agencyId,
        sellerId: userId,
        eventType: 'usage',
        credits: -creditCost,
        balanceAfter: newBalance,
        source: 'social_media_generator',
        metadata: {
          platform,
          category: category || 'general',
          unitId: propertyInfo.unitId || null,
        },
      });
      
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
        creditsRemaining: newBalance,
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
      
      const { title, platform, notes, scheduledAt, unitId } = req.body;
      
      const parsed = insertSellerSocialMediaReminderSchema.parse({
        title,
        platform,
        notes: notes || null,
        agencyId,
        sellerId: req.user.id,
        unitId: unitId || null,
        scheduledAt: new Date(scheduledAt),
        isCompleted: false,
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
  
  // ============================================
  // PUBLIC LINK TRACKING REDIRECT
  // ============================================
  
  // GET /go/:token - Public redirect endpoint for tracking links
  app.get("/go/:token", async (req: any, res) => {
    try {
      const { token } = req.params;
      
      // Find the link
      const [link] = await db
        .select()
        .from(externalSocialLinkClicks)
        .where(and(
          eq(externalSocialLinkClicks.token, token),
          eq(externalSocialLinkClicks.isActive, true)
        ));
      
      if (!link) {
        return res.status(404).send('Link not found');
      }
      
      // Check expiration
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(410).send('Link expired');
      }
      
      // Update click count and last clicked
      await db
        .update(externalSocialLinkClicks)
        .set({
          clickCount: (link.clickCount || 0) + 1,
          lastClickedAt: new Date(),
        })
        .where(eq(externalSocialLinkClicks.id, link.id));
      
      // Redirect to target URL
      res.redirect(link.targetUrl);
    } catch (error: any) {
      console.error("Error handling tracking redirect:", error);
      res.status(500).send('Error processing link');
    }
  });
}
