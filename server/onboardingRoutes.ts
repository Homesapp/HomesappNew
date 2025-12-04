import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { db } from "./db";
import { 
  sellerApplications, 
  ownerApplications, 
  users,
  insertSellerApplicationSchema,
  insertOwnerApplicationSchema,
  updateSellerApplicationSchema,
  updateOwnerApplicationSchema,
} from "@shared/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { isAuthenticated, requireRole } from "./replitAuth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Helper function for role checking
const hasRole = (roles: string[]) => requireRole(roles);
const ADMIN_ROLES = ["admin", "master"] as const;

export function registerOnboardingRoutes(app: Express) {
  // Rate limiter for application submissions
  const applicationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 applications per IP per 15 minutes
    message: { message: "Too many applications, please try again later" },
  });

  // =========================================================
  // PUBLIC SELLER APPLICATION ROUTES
  // =========================================================

  // POST /api/public/seller-applications - Submit seller application
  app.post("/api/public/seller-applications", applicationLimiter, async (req: any, res) => {
    try {
      const data = insertSellerApplicationSchema.parse({
        ...req.body,
        termsAcceptedAt: req.body.termsAccepted ? new Date() : null,
        privacyAcceptedAt: req.body.privacyAccepted ? new Date() : null,
        ipAddress: req.ip || req.headers["x-forwarded-for"] || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
      });

      // Check for duplicate email
      const existingApplication = await db.select()
        .from(sellerApplications)
        .where(and(
          eq(sellerApplications.email, data.email),
          inArray(sellerApplications.status, ["pending", "under_review"])
        ))
        .limit(1);

      if (existingApplication.length > 0) {
        return res.status(409).json({ 
          message: "Ya existe una aplicación pendiente con este correo electrónico",
          messageEn: "An application is already pending with this email"
        });
      }

      const [application] = await db.insert(sellerApplications).values(data).returning();

      res.status(201).json({
        message: "Aplicación recibida exitosamente",
        messageEn: "Application received successfully",
        applicationId: application.id,
      });
    } catch (error: any) {
      console.error("Error submitting seller application:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // GET /api/public/seller-applications/:id - Get application status (public, limited info)
  app.get("/api/public/seller-applications/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const [application] = await db.select({
        id: sellerApplications.id,
        status: sellerApplications.status,
        firstName: sellerApplications.firstName,
        createdAt: sellerApplications.createdAt,
      })
        .from(sellerApplications)
        .where(eq(sellerApplications.id, id));

      if (!application) {
        return res.status(404).json({ message: "Aplicación no encontrada" });
      }

      res.json(application);
    } catch (error: any) {
      console.error("Error getting seller application:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // =========================================================
  // PUBLIC OWNER APPLICATION ROUTES
  // =========================================================

  // POST /api/public/owner-applications - Submit owner application
  app.post("/api/public/owner-applications", applicationLimiter, async (req: any, res) => {
    try {
      const data = insertOwnerApplicationSchema.parse({
        ...req.body,
        termsAcceptedAt: req.body.termsAccepted ? new Date() : null,
        privacyAcceptedAt: req.body.privacyAccepted ? new Date() : null,
        ipAddress: req.ip || req.headers["x-forwarded-for"] || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
      });

      // Check for duplicate email with pending applications
      const existingApplication = await db.select()
        .from(ownerApplications)
        .where(and(
          eq(ownerApplications.email, data.email),
          inArray(ownerApplications.status, ["pending", "under_review"])
        ))
        .limit(1);

      if (existingApplication.length > 0) {
        return res.status(409).json({ 
          message: "Ya existe una aplicación pendiente con este correo electrónico",
          messageEn: "An application is already pending with this email"
        });
      }

      const [application] = await db.insert(ownerApplications).values(data).returning();

      res.status(201).json({
        message: "Aplicación recibida exitosamente",
        messageEn: "Application received successfully",
        applicationId: application.id,
      });
    } catch (error: any) {
      console.error("Error submitting owner application:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // GET /api/public/owner-applications/:id - Get application status (public, limited info)
  app.get("/api/public/owner-applications/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const [application] = await db.select({
        id: ownerApplications.id,
        status: ownerApplications.status,
        firstName: ownerApplications.firstName,
        createdAt: ownerApplications.createdAt,
      })
        .from(ownerApplications)
        .where(eq(ownerApplications.id, id));

      if (!application) {
        return res.status(404).json({ message: "Aplicación no encontrada" });
      }

      res.json(application);
    } catch (error: any) {
      console.error("Error getting owner application:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // =========================================================
  // ADMIN ROUTES FOR SELLER APPLICATIONS
  // =========================================================
  
  // GET /api/admin/seller-applications - List all seller applications
  app.get("/api/admin/seller-applications", isAuthenticated, hasRole([...ADMIN_ROLES]), async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let query = db.select().from(sellerApplications);
      
      if (status && status !== "all") {
        query = query.where(eq(sellerApplications.status, status as any));
      }
      
      const applications = await query
        .orderBy(desc(sellerApplications.createdAt))
        .limit(Number(limit))
        .offset(offset);

      // Get total count
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(sellerApplications)
        .where(status && status !== "all" ? eq(sellerApplications.status, status as any) : undefined);

      res.json({
        applications,
        total: Number(countResult[0]?.count || 0),
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      console.error("Error listing seller applications:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // GET /api/admin/seller-applications/:id - Get full application details
  app.get("/api/admin/seller-applications/:id", isAuthenticated, hasRole([...ADMIN_ROLES]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const [application] = await db.select()
        .from(sellerApplications)
        .where(eq(sellerApplications.id, id));

      if (!application) {
        return res.status(404).json({ message: "Aplicación no encontrada" });
      }

      res.json(application);
    } catch (error: any) {
      console.error("Error getting seller application:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // PATCH /api/admin/seller-applications/:id - Update application status
  app.patch("/api/admin/seller-applications/:id", isAuthenticated, hasRole([...ADMIN_ROLES]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = updateSellerApplicationSchema.parse(req.body);

      const [updated] = await db.update(sellerApplications)
        .set({
          ...updates,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sellerApplications.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Aplicación no encontrada" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating seller application:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // POST /api/admin/seller-applications/:id/approve - Approve and create user account
  app.post("/api/admin/seller-applications/:id/approve", isAuthenticated, hasRole([...ADMIN_ROLES]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role = "vendedor", agencyId, sendWelcomeEmail = true } = req.body;

      const [application] = await db.select()
        .from(sellerApplications)
        .where(eq(sellerApplications.id, id));

      if (!application) {
        return res.status(404).json({ message: "Aplicación no encontrada" });
      }

      if (application.status === "approved") {
        return res.status(400).json({ message: "La aplicación ya fue aprobada" });
      }

      // Check if user with this email already exists
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, application.email))
        .limit(1);

      let userId: string;

      if (existingUser.length > 0) {
        // Update existing user's role
        await db.update(users)
          .set({ 
            role: role as any,
            externalAgencyId: agencyId || application.targetAgencyId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser[0].id));
        userId = existingUser[0].id;
      } else {
        // Create new user account
        const tempPassword = crypto.randomUUID().substring(0, 12);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const [newUser] = await db.insert(users)
          .values({
            email: application.email,
            passwordHash,
            requirePasswordChange: true,
            firstName: application.firstName,
            lastName: application.lastName,
            phone: application.phone,
            role: role as any,
            status: "approved",
            externalAgencyId: agencyId || application.targetAgencyId,
            documentUrl: application.idDocumentUrl,
            profileImageUrl: application.profilePhotoUrl,
          })
          .returning();
        userId = newUser.id;
      }

      // Update application status
      const [updated] = await db.update(sellerApplications)
        .set({
          status: "approved",
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          createdUserId: userId,
          updatedAt: new Date(),
        })
        .where(eq(sellerApplications.id, id))
        .returning();

      res.json({
        message: "Aplicación aprobada y cuenta creada",
        application: updated,
        userId,
      });
    } catch (error: any) {
      console.error("Error approving seller application:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // =========================================================
  // ADMIN ROUTES FOR OWNER APPLICATIONS
  // =========================================================

  // GET /api/admin/owner-applications - List all owner applications
  app.get("/api/admin/owner-applications", isAuthenticated, hasRole([...ADMIN_ROLES]), async (req: any, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let query = db.select().from(ownerApplications);
      
      if (status && status !== "all") {
        query = query.where(eq(ownerApplications.status, status as any));
      }
      
      const applications = await query
        .orderBy(desc(ownerApplications.createdAt))
        .limit(Number(limit))
        .offset(offset);

      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(ownerApplications)
        .where(status && status !== "all" ? eq(ownerApplications.status, status as any) : undefined);

      res.json({
        applications,
        total: Number(countResult[0]?.count || 0),
        page: Number(page),
        limit: Number(limit),
      });
    } catch (error: any) {
      console.error("Error listing owner applications:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // GET /api/admin/owner-applications/:id - Get full owner application details
  app.get("/api/admin/owner-applications/:id", isAuthenticated, hasRole([...ADMIN_ROLES]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const [application] = await db.select()
        .from(ownerApplications)
        .where(eq(ownerApplications.id, id));

      if (!application) {
        return res.status(404).json({ message: "Aplicación no encontrada" });
      }

      res.json(application);
    } catch (error: any) {
      console.error("Error getting owner application:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // PATCH /api/admin/owner-applications/:id - Update owner application status
  app.patch("/api/admin/owner-applications/:id", isAuthenticated, hasRole([...ADMIN_ROLES]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = updateOwnerApplicationSchema.parse(req.body);

      const [updated] = await db.update(ownerApplications)
        .set({
          ...updates,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(ownerApplications.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Aplicación no encontrada" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating owner application:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}
