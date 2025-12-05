import { Express } from "express";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import {
  externalAgencies,
  externalAgencySettings,
  externalAgencyMessageTemplates,
  externalAgencyDocuments,
  externalAgencyInvitations,
  users,
  insertExternalAgencySchema,
  insertExternalAgencySettingsSchema,
  insertExternalAgencyMessageTemplateSchema,
  insertExternalAgencyDocumentSchema,
  insertExternalAgencyInvitationSchema,
} from "@shared/schema";
import { isAuthenticated, requireRole } from "./replitAuth";
import crypto from "crypto";

const EXTERNAL_ADMIN_ROLES = [
  "external_agency_admin",
  "external_admin",
  "master",
  "admin",
];

const EXTERNAL_SELLER_ROLES = [
  "external_agency_seller",
  "external_seller",
  "seller",
  ...EXTERNAL_ADMIN_ROLES,
];

const updateAgencySchema = z.object({
  name: z.string().min(2, "Name is required").optional(),
  slug: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
  contactPhone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const updateSettingsSchema = z.object({
  website: z.string().url().optional().nullable().or(z.literal("")),
  socialMedia: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional().nullable(),
  fiscalData: z.object({
    razonSocial: z.string().optional(),
    rfc: z.string().optional(),
    direccionFiscal: z.string().optional(),
    regimenFiscal: z.string().optional(),
  }).optional().nullable(),
  operatingZones: z.array(z.string()).optional().nullable(),
  operationType: z.enum(["rent", "sale", "both"]).optional(),
  leadAssignmentMode: z.enum(["admin_only", "round_robin", "by_link_owner", "manual"]).optional(),
  defaultLeadView: z.enum(["my_leads", "all_leads"]).optional(),
  pipelineColumns: z.object({
    columns: z.array(z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
      isActive: z.boolean(),
      isClosedWon: z.boolean(),
    })),
  }).optional().nullable(),
  catalogDefaultView: z.enum(["grid", "list"]).optional(),
  catalogDefaultSort: z.enum(["date_desc", "date_asc", "price_asc", "price_desc"]).optional(),
  catalogDefaultFilters: z.object({
    listingType: z.string().optional(),
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    bedrooms: z.number().optional(),
  }).optional().nullable(),
  favoriteZones: z.array(z.string()).optional().nullable(),
  favoriteCondominiums: z.array(z.string()).optional().nullable(),
  notificationEmail: z.string().email().optional().nullable().or(z.literal("")),
  notificationWhatsapp: z.string().optional().nullable(),
  notificationEvents: z.object({
    newLead: z.boolean().optional(),
    leadReassigned: z.boolean().optional(),
    appointmentConfirmed: z.boolean().optional(),
    appointmentCancelled: z.boolean().optional(),
    offerAccepted: z.boolean().optional(),
    offerRejected: z.boolean().optional(),
    contractSigned: z.boolean().optional(),
    paymentReceived: z.boolean().optional(),
  }).optional().nullable(),
  formConfig: z.object({
    leadForm: z.object({
      requiredFields: z.array(z.string()),
      thankYouMessage: z.string(),
    }).optional(),
    ownerForm: z.object({
      requiredFields: z.array(z.string()),
      thankYouMessage: z.string(),
    }).optional(),
  }).optional().nullable(),
  standardCommissionRate: z.number().min(0).max(10000).optional().nullable(),
  monthlyTargets: z.object({
    closingTarget: z.number().min(0),
    commissionTarget: z.number().min(0),
  }).optional().nullable(),
});

const createInvitationSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().optional(),
  role: z.enum(["external_agency_admin", "external_agency_seller"]).default("external_agency_seller"),
});

const createTemplateSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  language: z.enum(["es", "en"]).default("es"),
});

const updateTemplateSchema = createTemplateSchema.partial().extend({
  isActive: z.boolean().optional(),
  orderIndex: z.number().optional(),
});

const createDocumentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Invalid URL"),
  category: z.string().optional(),
  description: z.string().optional(),
});

const updateDocumentSchema = createDocumentSchema.partial().extend({
  isActive: z.boolean().optional(),
  orderIndex: z.number().optional(),
});

async function getUserAgencyId(req: any): Promise<string | null> {
  const userId = req.user?.id || req.user?.claims?.sub;
  if (!userId) return null;

  const user = await db
    .select({ externalAgencyId: users.externalAgencyId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user[0]?.externalAgencyId || null;
}

export function registerAgencySettingsRoutes(app: Express): void {
  
  // GET /api/external/agency - Get current user's agency
  app.get("/api/external/agency", isAuthenticated, requireRole(EXTERNAL_SELLER_ROLES), async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      console.log("[Agency] Fetching agency for user:", userId, "role:", req.user?.role);
      
      const agencyId = await getUserAgencyId(req);
      console.log("[Agency] Found agencyId:", agencyId);
      
      if (!agencyId) {
        console.log("[Agency] No agencyId found for user");
        return res.status(404).json({ message: "Agency not found" });
      }

      const agency = await db
        .select()
        .from(externalAgencies)
        .where(eq(externalAgencies.id, agencyId))
        .limit(1);

      console.log("[Agency] Found agency:", agency[0]?.name);
      
      if (!agency[0]) {
        console.log("[Agency] Agency not found in database");
        return res.status(404).json({ message: "Agency not found" });
      }

      res.json(agency[0]);
    } catch (error: any) {
      console.error("Error fetching agency:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH /api/external/agency - Update agency basic info
  app.patch("/api/external/agency", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const parseResult = updateAgencySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { name, slug, contactName, contactEmail, contactPhone, description } = parseResult.data;

      const updated = await db
        .update(externalAgencies)
        .set({
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(contactName !== undefined && { contactName }),
          ...(contactEmail !== undefined && { contactEmail: contactEmail || null }),
          ...(contactPhone !== undefined && { contactPhone }),
          ...(description !== undefined && { description }),
          updatedAt: new Date(),
        })
        .where(eq(externalAgencies.id, agencyId))
        .returning();

      res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating agency:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/external/agency/settings - Get agency settings
  app.get("/api/external/agency/settings", isAuthenticated, requireRole(EXTERNAL_SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const settings = await db
        .select()
        .from(externalAgencySettings)
        .where(eq(externalAgencySettings.agencyId, agencyId))
        .limit(1);

      if (!settings[0]) {
        const newSettings = await db
          .insert(externalAgencySettings)
          .values({
            agencyId,
          })
          .returning();
        return res.json(newSettings[0]);
      }

      res.json(settings[0]);
    } catch (error: any) {
      console.error("Error fetching agency settings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH /api/external/agency/settings - Update agency settings
  app.patch("/api/external/agency/settings", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const parseResult = updateSettingsSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const validatedData = parseResult.data;

      const existingSettings = await db
        .select()
        .from(externalAgencySettings)
        .where(eq(externalAgencySettings.agencyId, agencyId))
        .limit(1);

      const updateData: any = {
        updatedAt: new Date(),
      };

      Object.keys(validatedData).forEach((key) => {
        const value = (validatedData as any)[key];
        if (value !== undefined) {
          updateData[key] = value;
        }
      });

      if (!existingSettings[0]) {
        const newSettings = await db
          .insert(externalAgencySettings)
          .values({
            agencyId,
            ...updateData,
          })
          .returning();
        return res.json(newSettings[0]);
      }

      const updated = await db
        .update(externalAgencySettings)
        .set(updateData)
        .where(eq(externalAgencySettings.agencyId, agencyId))
        .returning();

      res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating agency settings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/external/agency/team - Get team members (read access for all agency members)
  app.get("/api/external/agency/team", isAuthenticated, requireRole(EXTERNAL_SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const team = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.externalAgencyId, agencyId))
        .orderBy(users.firstName);

      res.json(team);
    } catch (error: any) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/external/agency/invitations - Get pending invitations (read access for all agency members)
  app.get("/api/external/agency/invitations", isAuthenticated, requireRole(EXTERNAL_SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const invitations = await db
        .select()
        .from(externalAgencyInvitations)
        .where(eq(externalAgencyInvitations.agencyId, agencyId))
        .orderBy(desc(externalAgencyInvitations.createdAt));

      res.json(invitations);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/external/agency/invitations - Create invitation (admin only)
  app.post("/api/external/agency/invitations", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const parseResult = createInvitationSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { email, name, role } = parseResult.data;

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser[0]) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const existingInvitation = await db
        .select()
        .from(externalAgencyInvitations)
        .where(
          and(
            eq(externalAgencyInvitations.agencyId, agencyId),
            eq(externalAgencyInvitations.email, email)
          )
        )
        .limit(1);

      if (existingInvitation[0] && !existingInvitation[0].acceptedAt) {
        return res.status(400).json({ message: "Invitation already sent to this email" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const userId = req.user?.id || req.user?.claims?.sub;

      const invitation = await db
        .insert(externalAgencyInvitations)
        .values({
          agencyId,
          email,
          name,
          role,
          token,
          expiresAt,
          invitedBy: userId,
        })
        .returning();

      res.status(201).json(invitation[0]);
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // DELETE /api/external/agency/invitations/:id - Delete invitation (admin only)
  app.delete("/api/external/agency/invitations/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      await db
        .delete(externalAgencyInvitations)
        .where(
          and(
            eq(externalAgencyInvitations.id, req.params.id),
            eq(externalAgencyInvitations.agencyId, agencyId)
          )
        );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting invitation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/external/agency/templates - Get message templates (read access for all agency members)
  app.get("/api/external/agency/templates", isAuthenticated, requireRole(EXTERNAL_SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const templates = await db
        .select()
        .from(externalAgencyMessageTemplates)
        .where(eq(externalAgencyMessageTemplates.agencyId, agencyId))
        .orderBy(externalAgencyMessageTemplates.orderIndex);

      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/external/agency/templates - Create template (admin only)
  app.post("/api/external/agency/templates", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const parseResult = createTemplateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { category, title, content, language } = parseResult.data;

      const template = await db
        .insert(externalAgencyMessageTemplates)
        .values({
          agencyId,
          category,
          title,
          content,
          language,
        })
        .returning();

      res.status(201).json(template[0]);
    } catch (error: any) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH /api/external/agency/templates/:id - Update template (admin only)
  app.patch("/api/external/agency/templates/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const parseResult = updateTemplateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const validatedData = parseResult.data;
      const updateData: any = { updatedAt: new Date() };

      Object.keys(validatedData).forEach((key) => {
        const value = (validatedData as any)[key];
        if (value !== undefined) {
          updateData[key] = value;
        }
      });

      const template = await db
        .update(externalAgencyMessageTemplates)
        .set(updateData)
        .where(
          and(
            eq(externalAgencyMessageTemplates.id, req.params.id),
            eq(externalAgencyMessageTemplates.agencyId, agencyId)
          )
        )
        .returning();

      if (!template[0]) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template[0]);
    } catch (error: any) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // DELETE /api/external/agency/templates/:id - Delete template (admin only)
  app.delete("/api/external/agency/templates/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const deleted = await db
        .delete(externalAgencyMessageTemplates)
        .where(
          and(
            eq(externalAgencyMessageTemplates.id, req.params.id),
            eq(externalAgencyMessageTemplates.agencyId, agencyId)
          )
        )
        .returning();

      if (!deleted[0]) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // GET /api/external/agency/documents - Get documents (read access for all agency members)
  app.get("/api/external/agency/documents", isAuthenticated, requireRole(EXTERNAL_SELLER_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const documents = await db
        .select()
        .from(externalAgencyDocuments)
        .where(eq(externalAgencyDocuments.agencyId, agencyId))
        .orderBy(externalAgencyDocuments.orderIndex);

      res.json(documents);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // POST /api/external/agency/documents - Create document (admin only)
  app.post("/api/external/agency/documents", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const parseResult = createDocumentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const { name, url, category, description } = parseResult.data;

      const document = await db
        .insert(externalAgencyDocuments)
        .values({
          agencyId,
          name,
          url,
          category,
          description,
        })
        .returning();

      res.status(201).json(document[0]);
    } catch (error: any) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // PATCH /api/external/agency/documents/:id - Update document (admin only)
  app.patch("/api/external/agency/documents/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const parseResult = updateDocumentSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: parseResult.error.flatten().fieldErrors 
        });
      }

      const validatedData = parseResult.data;
      const updateData: any = { updatedAt: new Date() };

      Object.keys(validatedData).forEach((key) => {
        const value = (validatedData as any)[key];
        if (value !== undefined) {
          updateData[key] = value;
        }
      });

      const document = await db
        .update(externalAgencyDocuments)
        .set(updateData)
        .where(
          and(
            eq(externalAgencyDocuments.id, req.params.id),
            eq(externalAgencyDocuments.agencyId, agencyId)
          )
        )
        .returning();

      if (!document[0]) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(document[0]);
    } catch (error: any) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // DELETE /api/external/agency/documents/:id - Delete document (admin only)
  app.delete("/api/external/agency/documents/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(404).json({ message: "Agency not found" });
      }

      const deleted = await db
        .delete(externalAgencyDocuments)
        .where(
          and(
            eq(externalAgencyDocuments.id, req.params.id),
            eq(externalAgencyDocuments.agencyId, agencyId)
          )
        )
        .returning();

      if (!deleted[0]) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: error.message });
    }
  });

  console.log("Agency settings routes registered");
}
