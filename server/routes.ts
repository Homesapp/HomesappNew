import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { parse as parseCookie } from "cookie";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole, getSession } from "./replitAuth";
import { createGoogleMeetEvent, deleteGoogleMeetEvent } from "./googleCalendar";
import { sendVerificationEmail } from "./resend";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import {
  insertPropertySchema,
  insertAppointmentSchema,
  insertPresentationCardSchema,
  insertServiceProviderSchema,
  insertServiceSchema,
  insertOfferSchema,
  insertPermissionSchema,
  insertPropertyStaffSchema,
  insertBudgetSchema,
  insertTaskSchema,
  insertWorkReportSchema,
  insertAuditLogSchema,
  adminLoginSchema,
  userRegistrationSchema,
  userLoginSchema,
  insertRoleRequestSchema,
  rentalOpportunityRequests,
  leadJourneys,
  appointments,
  offers,
  properties,
  users,
  presentationCards,
  createPropertyChangeRequestSchema,
  updateOwnerSettingsSchema,
  insertRentalApplicationSchema,
  createInspectionReportSchema,
  updateInspectionReportSchema,
  insertNotificationSchema,
  insertChatConversationSchema,
  insertChatMessageSchema,
  insertChatParticipantSchema,
  updateUserProfileSchema,
  insertAgreementTemplateSchema,
  insertPropertySubmissionDraftSchema,
  insertPropertyAgreementSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc } from "drizzle-orm";

// Helper function to create audit logs
async function createAuditLog(
  req: Request & { user?: any },
  action: "create" | "update" | "delete" | "view" | "approve" | "reject" | "assign",
  entityType: string,
  entityId: string | null,
  details?: string
) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) return;

    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.get("user-agent") || null;

    await storage.createAuditLog({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
}

// WebSocket clients organized by conversation ID
const wsClients = new Map<string, Set<WebSocket>>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint - must be first for deployment health checks
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "HomesApp API"
    });
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // Check if admin session exists
      if (req.session && req.session.adminUser) {
        return res.json(req.session.adminUser);
      }

      // Otherwise, get regular user from Replit Auth
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin login route (local authentication)
  app.post("/api/auth/admin/login", async (req: any, res) => {
    try {
      const validationResult = adminLoginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validationResult.error.errors 
        });
      }
      
      const { username, password } = validationResult.data;
      
      // Find admin by username
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check if admin is active
      if (!admin.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create session with admin info
      req.session.adminUser = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      };
      
      // Save session explicitly
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Return admin info (without password hash)
      const { passwordHash, ...adminWithoutPassword } = admin;
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin logout route
  app.post("/api/auth/admin/logout", async (req, res) => {
    try {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Error during admin logout:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current admin user
  app.get("/api/auth/admin/user", async (req: any, res) => {
    try {
      if (!req.session.adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      res.json(req.session.adminUser);
    } catch (error) {
      console.error("Error fetching admin user:", error);
      res.status(500).json({ message: "Failed to fetch admin user" });
    }
  });

  // Local user login route (for users who registered with email/password)
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const validationResult = userLoginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors,
        });
      }

      const { email, password } = validationResult.data;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Check if user is approved
      if (user.status !== "approved") {
        return res.status(403).json({ message: "Tu cuenta está pendiente de aprobación" });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({ message: "Por favor verifica tu email primero" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Create session
      req.session.userId = user.id;

      // Save session explicitly
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Return user info (without password hash)
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Error al iniciar sesión" });
    }
  });

  // Local user logout route
  app.post("/api/auth/local/logout", async (req: any, res) => {
    try {
      if (req.session.userId) {
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Error al cerrar sesión" });
          }
          res.json({ message: "Sesión cerrada exitosamente" });
        });
      } else {
        res.status(400).json({ message: "No hay sesión activa" });
      }
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Error al cerrar sesión" });
    }
  });

  // User management routes
  app.get("/api/users", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/pending", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const users = await storage.getUsersByStatus("pending");
      res.json(users);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post("/api/users/:id/approve", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUserStatus(id, "approved");
      
      // Log the approval action
      await createAuditLog(
        req,
        "approve",
        "user",
        id,
        `Usuario aprobado: ${user.firstName} ${user.lastName} (${user.email})`
      );
      
      res.json(user);
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.post("/api/users/:id/reject", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUserStatus(id, "rejected");
      
      // Log the rejection action
      await createAuditLog(
        req,
        "reject",
        "user",
        id,
        `Usuario rechazado: ${user.firstName} ${user.lastName} (${user.email})`
      );
      
      res.json(user);
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  app.post("/api/users/approve-all", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const count = await storage.approveAllPendingUsers();
      
      // Log the bulk approval action
      await createAuditLog(
        req,
        "approve",
        "user",
        null,
        `Aprobados ${count} usuarios pendientes en masa`
      );
      
      res.json({ count });
    } catch (error) {
      console.error("Error approving all users:", error);
      res.status(500).json({ message: "Failed to approve all users" });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, requireRole(["master"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await storage.updateUserRole(id, role);
      
      // Log the role update action
      await createAuditLog(
        req,
        "update",
        "user",
        id,
        `Rol actualizado a: ${role} para ${user.firstName} ${user.lastName}`
      );
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Allow users to switch between owner and cliente roles (Airbnb-style)
  app.patch("/api/users/switch-role", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;

      // Validate role is either owner or cliente
      if (role !== "owner" && role !== "cliente") {
        return res.status(400).json({ 
          message: "Solo puedes cambiar entre roles de propietario y cliente" 
        });
      }

      const user = await storage.updateUserRole(userId, role);
      
      // Log the role switch action
      await createAuditLog(
        req,
        "update",
        "user",
        userId,
        `Usuario cambió su rol a: ${role}`
      );
      
      res.json(user);
    } catch (error) {
      console.error("Error switching user role:", error);
      res.status(500).json({ message: "Failed to switch user role" });
    }
  });

  app.get("/api/users/role/:role", isAuthenticated, async (req, res) => {
    try {
      const { role } = req.params;
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ message: "Failed to fetch users by role" });
    }
  });

  // Profile management endpoints
  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validated = updateUserProfileSchema.parse(req.body);
      
      const user = await storage.updateUserProfile(userId, validated);
      
      await createAuditLog(
        req,
        "update",
        "user",
        userId,
        "Perfil actualizado"
      );
      
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.delete("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      await createAuditLog(
        req,
        "delete",
        "user",
        userId,
        "Usuario eliminó su cuenta"
      );
      
      await storage.deleteUser(userId);
      
      req.logout((err: any) => {
        if (err) {
          console.error("Error logging out:", err);
        }
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // User registration routes
  app.post("/api/register", async (req, res) => {
    try {
      const validationResult = userRegistrationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid registration data",
          errors: validationResult.error.errors,
        });
      }

      const { email, password, firstName, lastName, phone } = validationResult.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "El email ya está registrado" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with "cliente" role by default
      const user = await storage.createUserWithPassword({
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: "cliente",
        status: "approved",
        emailVerified: false,
      });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

      await storage.createEmailVerificationToken({
        userId: user.id,
        token: verificationToken,
        expiresAt,
      });

      // Send verification email
      try {
        await sendVerificationEmail(user.email, verificationToken);
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Don't fail registration if email fails
      }

      res.status(201).json({
        message: "Cuenta creada exitosamente. Por favor verifica tu email.",
        userId: user.id,
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Error al crear la cuenta" });
    }
  });

  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Token inválido" });
      }

      // Get verification token
      const verificationToken = await storage.getEmailVerificationToken(token);
      if (!verificationToken) {
        return res.status(404).json({ message: "Token no encontrado o expirado" });
      }

      // Check if token is expired
      if (new Date() > verificationToken.expiresAt) {
        await storage.deleteEmailVerificationToken(token);
        return res.status(400).json({ message: "El token ha expirado" });
      }

      // Verify user email
      await storage.verifyUserEmail(verificationToken.userId);

      // Delete used token
      await storage.deleteEmailVerificationToken(token);

      res.json({ message: "Email verificado exitosamente" });
    } catch (error) {
      console.error("Error during email verification:", error);
      res.status(500).json({ message: "Error al verificar el email" });
    }
  });

  // Role request routes
  app.post("/api/role-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.adminUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const validationResult = insertRoleRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos inválidos",
          errors: validationResult.error.errors,
        });
      }

      // Check if user already has an active request
      const existingRequest = await storage.getUserActiveRoleRequest(userId);
      if (existingRequest) {
        return res.status(409).json({
          message: "Ya tienes una solicitud pendiente",
        });
      }

      const roleRequest = await storage.createRoleRequest({
        ...validationResult.data,
        userId,
      });

      // Log the role request creation
      await createAuditLog(
        req,
        "create",
        "role_request",
        roleRequest.id,
        `Solicitud de rol: ${roleRequest.requestedRole}`
      );

      res.status(201).json(roleRequest);
    } catch (error) {
      console.error("Error creating role request:", error);
      res.status(500).json({ message: "Error al crear solicitud de rol" });
    }
  });

  app.get("/api/role-requests", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const { status, userId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (userId) filters.userId = userId;

      const requests = await storage.getRoleRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching role requests:", error);
      res.status(500).json({ message: "Error al obtener solicitudes" });
    }
  });

  app.get("/api/role-requests/my-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.adminUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const requests = await storage.getRoleRequests({ userId });
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user role requests:", error);
      res.status(500).json({ message: "Error al obtener tus solicitudes" });
    }
  });

  app.patch("/api/role-requests/:id/approve", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const reviewerId = req.user?.claims?.sub || req.session?.adminUser?.id;

      const roleRequest = await storage.getRoleRequest(id);
      if (!roleRequest) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      // Check if request is still pending
      if (roleRequest.status !== "pending") {
        return res.status(400).json({
          message: `Esta solicitud ya fue ${roleRequest.status === "approved" ? "aprobada" : "rechazada"}`,
        });
      }

      // Validate requested role is allowed
      const allowedRoles = ["owner", "seller", "management", "concierge", "provider"];
      if (!allowedRoles.includes(roleRequest.requestedRole)) {
        return res.status(400).json({ message: "Rol solicitado no es válido" });
      }

      // Check if user already has this role
      const user = await storage.getUser(roleRequest.userId);
      if (user?.additionalRole === roleRequest.requestedRole) {
        return res.status(400).json({ message: "El usuario ya tiene este rol" });
      }

      // Update role request status
      const updatedRequest = await storage.updateRoleRequestStatus(
        id,
        "approved",
        reviewerId,
        reviewNotes
      );

      // Update user's additional role
      await storage.updateUserAdditionalRole(roleRequest.userId, roleRequest.requestedRole);

      // Log the approval
      await createAuditLog(
        req,
        "approve",
        "role_request",
        id,
        `Aprobada solicitud de rol: ${roleRequest.requestedRole}`
      );

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving role request:", error);
      res.status(500).json({ message: "Error al aprobar solicitud" });
    }
  });

  app.patch("/api/role-requests/:id/reject", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const reviewerId = req.user?.claims?.sub || req.session?.adminUser?.id;

      const roleRequest = await storage.getRoleRequest(id);
      if (!roleRequest) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      // Check if request is still pending
      if (roleRequest.status !== "pending") {
        return res.status(400).json({
          message: `Esta solicitud ya fue ${roleRequest.status === "approved" ? "aprobada" : "rechazada"}`,
        });
      }

      // Update role request status
      const updatedRequest = await storage.updateRoleRequestStatus(
        id,
        "rejected",
        reviewerId,
        reviewNotes
      );

      // Log the rejection
      await createAuditLog(
        req,
        "reject",
        "role_request",
        id,
        `Rechazada solicitud de rol: ${roleRequest.requestedRole}`
      );

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting role request:", error);
      res.status(500).json({ message: "Error al rechazar solicitud" });
    }
  });

  // Colony routes
  app.get("/api/colonies", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      if (active !== undefined) filters.active = active === "true";
      
      const colonies = await storage.getColonies(filters);
      res.json(colonies);
    } catch (error) {
      console.error("Error fetching colonies:", error);
      res.status(500).json({ message: "Failed to fetch colonies" });
    }
  });

  app.get("/api/colonies/active", async (req, res) => {
    try {
      const colonies = await storage.getActiveColonies();
      res.json(colonies);
    } catch (error) {
      console.error("Error fetching active colonies:", error);
      res.status(500).json({ message: "Failed to fetch active colonies" });
    }
  });

  app.post("/api/admin/colonies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !["master", "admin", "admin_jr"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate request body with Zod
      const colonySchema = z.object({
        name: z.string().min(1, "El nombre de la colonia es requerido"),
        slug: z.string().min(1, "El slug es requerido"),
        active: z.boolean().optional().default(true),
      });
      
      const validationResult = colonySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const colony = await storage.createColony(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "colony",
        colony.id,
        `Colonia creada: ${colony.name}`
      );

      res.json(colony);
    } catch (error) {
      console.error("Error creating colony:", error);
      res.status(500).json({ message: "Failed to create colony" });
    }
  });

  app.patch("/api/admin/colonies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { id } = req.params;

      if (!user || !["master", "admin", "admin_jr"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const colonySchema = z.object({
        name: z.string().optional(),
        slug: z.string().optional(),
        active: z.boolean().optional(),
      });
      
      const validationResult = colonySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const colony = await storage.updateColony(id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "colony",
        colony.id,
        `Colonia actualizada: ${colony.name}`
      );

      res.json(colony);
    } catch (error) {
      console.error("Error updating colony:", error);
      res.status(500).json({ message: "Failed to update colony" });
    }
  });

  app.delete("/api/admin/colonies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { id } = req.params;

      if (!user || !["master", "admin", "admin_jr"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteColony(id);

      await createAuditLog(
        req,
        "delete",
        "colony",
        id,
        `Colonia eliminada`
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting colony:", error);
      res.status(500).json({ message: "Failed to delete colony" });
    }
  });

  // Condominium routes
  app.get("/api/condominiums", async (req, res) => {
    try {
      const { approvalStatus } = req.query;
      const filters: any = {};
      if (approvalStatus) filters.approvalStatus = approvalStatus;
      
      const condominiums = await storage.getCondominiums(filters);
      res.json(condominiums);
    } catch (error) {
      console.error("Error fetching condominiums:", error);
      res.status(500).json({ message: "Failed to fetch condominiums" });
    }
  });

  app.get("/api/condominiums/approved", async (req, res) => {
    try {
      const condominiums = await storage.getApprovedCondominiums();
      res.json(condominiums);
    } catch (error) {
      console.error("Error fetching approved condominiums:", error);
      res.status(500).json({ message: "Failed to fetch approved condominiums" });
    }
  });

  app.post("/api/condominiums", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body with Zod
      const condominiumSchema = z.object({
        name: z.string().min(1, "El nombre del condominio es requerido"),
      });
      
      const validationResult = condominiumSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const { name } = validationResult.data;

      // Create condominium with pending status, requires admin approval
      const condominium = await storage.createCondominium({
        name,
        approvalStatus: "pending",
        requestedBy: userId,
      });

      await createAuditLog(
        req,
        "create",
        "condominium",
        condominium.id,
        `Condominio solicitado: ${name}`
      );

      res.json(condominium);
    } catch (error) {
      console.error("Error creating condominium:", error);
      res.status(500).json({ message: "Failed to create condominium" });
    }
  });

  app.patch("/api/admin/condominiums/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { id } = req.params;

      if (!user || !["master", "admin", "admin_jr"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Validate condominium exists
      const existingCondominium = await storage.getCondominium(id);
      if (!existingCondominium) {
        return res.status(404).json({ message: "Condominio no encontrado" });
      }

      const condominium = await storage.updateCondominiumStatus(id, "approved");
      
      await createAuditLog(
        req,
        "approve",
        "condominium",
        id,
        `Condominio aprobado: ${condominium.name}`
      );

      res.json(condominium);
    } catch (error) {
      console.error("Error approving condominium:", error);
      res.status(500).json({ message: "Failed to approve condominium" });
    }
  });

  app.patch("/api/admin/condominiums/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { id } = req.params;

      if (!user || !["master", "admin", "admin_jr"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Validate condominium exists
      const existingCondominium = await storage.getCondominium(id);
      if (!existingCondominium) {
        return res.status(404).json({ message: "Condominio no encontrado" });
      }

      const condominium = await storage.updateCondominiumStatus(id, "rejected");
      
      await createAuditLog(
        req,
        "reject",
        "condominium",
        id,
        `Condominio rechazado: ${condominium.name}`
      );

      res.json(condominium);
    } catch (error) {
      console.error("Error rejecting condominium:", error);
      res.status(500).json({ message: "Failed to reject condominium" });
    }
  });

  // Property routes
  app.get("/api/properties", async (req, res) => {
    try {
      const { status, ownerId, active } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (ownerId) filters.ownerId = ownerId;
      if (active !== undefined) filters.active = active === "true";
      
      const properties = await storage.getProperties(filters);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/search", async (req: any, res) => {
    try {
      const {
        q,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        minArea,
        maxArea,
        location,
        amenities,
        status,
        minRating,
        featured,
        availableFrom,
        availableTo
      } = req.query;

      const filters: any = {};

      if (q && typeof q === "string") {
        filters.query = q;
      }
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (bedrooms) filters.bedrooms = parseInt(bedrooms as string);
      if (bathrooms) filters.bathrooms = parseFloat(bathrooms as string);
      if (minArea) filters.minArea = parseFloat(minArea as string);
      if (maxArea) filters.maxArea = parseFloat(maxArea as string);
      if (location && typeof location === "string") {
        filters.location = location;
      }
      if (amenities) {
        filters.amenities = typeof amenities === "string" ? amenities.split(",") : amenities;
      }
      if (status && typeof status === "string") {
        filters.status = status;
      }
      if (minRating) filters.minRating = parseFloat(minRating as string);
      if (featured !== undefined) {
        filters.featured = featured === "true";
      }
      if (availableFrom && typeof availableFrom === "string") {
        filters.availableFrom = new Date(availableFrom);
      }
      if (availableTo && typeof availableTo === "string") {
        filters.availableTo = new Date(availableTo);
      }

      // Only show approved properties to non-authenticated users
      const isUserAuthenticated = req.user || (req.session && (req.session.adminUser || req.session.userId));
      if (!isUserAuthenticated) {
        filters.approvalStatus = "approved";
      }

      const properties = await storage.searchPropertiesAdvanced(filters);
      res.json(properties);
    } catch (error) {
      console.error("Error searching properties:", error);
      res.status(500).json({ message: "Failed to search properties" });
    }
  });

  app.get("/api/properties/:id", async (req: any, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Only show approved properties to non-authenticated users
      const isUserAuthenticated = req.user || (req.session && (req.session.adminUser || req.session.userId));
      if (!isUserAuthenticated && property.approvalStatus !== "approved") {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["master", "admin", "admin_jr", "seller", "owner"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const propertyData = insertPropertySchema.parse({
        ...req.body,
        ownerId: req.body.ownerId || userId,
      });
      
      const property = await storage.createProperty(propertyData);
      
      // Log property creation
      await createAuditLog(
        req,
        "create",
        "property",
        property.id,
        `Propiedad creada: ${property.title} - ${property.location}`
      );
      
      res.status(201).json(property);
    } catch (error: any) {
      console.error("Error creating property:", error);
      res.status(400).json({ message: error.message || "Failed to create property" });
    }
  });

  app.patch("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!user || (property.ownerId !== userId && !["master", "admin", "admin_jr"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedProperty = await storage.updateProperty(id, req.body);
      
      // Log property update
      await createAuditLog(
        req,
        "update",
        "property",
        id,
        `Propiedad actualizada: ${updatedProperty.title}`
      );
      
      res.json(updatedProperty);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!user || (property.ownerId !== userId && !["master", "admin"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Log property deletion (before deletion to capture details)
      await createAuditLog(
        req,
        "delete",
        "property",
        id,
        `Propiedad eliminada: ${property.title} - ${property.location}`
      );

      await storage.deleteProperty(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Property staff routes
  app.post("/api/properties/:id/staff", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!user || (property.ownerId !== userId && !["master", "admin"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const staffData = insertPropertyStaffSchema.parse({
        propertyId: id,
        ...req.body,
      });

      const staff = await storage.assignStaff(staffData);
      res.status(201).json(staff);
    } catch (error: any) {
      console.error("Error assigning staff:", error);
      res.status(400).json({ message: error.message || "Failed to assign staff" });
    }
  });

  app.get("/api/properties/:id/staff", async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await storage.getPropertyStaff(id);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching property staff:", error);
      res.status(500).json({ message: "Failed to fetch property staff" });
    }
  });

  // Owner API routes - for property owners to manage their properties
  app.get("/api/owner/properties", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["owner", "seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      // Get properties where user is owner
      const properties = await storage.getProperties({ ownerId: userId });
      res.json(properties);
    } catch (error) {
      console.error("Error fetching owner properties:", error);
      res.status(500).json({ message: "Error al obtener propiedades" });
    }
  });

  // Get single property by ID (owner must be the owner of the property)
  app.get("/api/owner/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { id } = req.params;
      
      if (!user || !["owner", "seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }
      
      // Verify owner
      if (property.ownerId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para ver esta propiedad" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Error fetching owner property:", error);
      res.status(500).json({ message: "Error al obtener propiedad" });
    }
  });

  app.get("/api/owner/change-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["owner", "seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      // Get all change requests and filter by owner
      const allChangeRequests = await storage.getPropertyChangeRequests();
      const changeRequests = allChangeRequests.filter(cr => cr.requestedById === userId);
      res.json(changeRequests);
    } catch (error) {
      console.error("Error fetching change requests:", error);
      res.status(500).json({ message: "Error al obtener solicitudes de cambio" });
    }
  });

  app.post("/api/owner/change-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["owner", "seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      // Validate request body with Zod
      const validationResult = createPropertyChangeRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const { propertyId, changedFields } = validationResult.data;

      // Verify user owns the property
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }
      if (property.ownerId !== userId && !["admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "No tienes permisos para modificar esta propiedad" });
      }

      // Create change request and update property status in transaction
      await db.transaction(async (tx) => {
        const changeRequest = await storage.createPropertyChangeRequest({
          propertyId,
          requestedById: userId,
          changedFields: changedFields as any,
        });

        // Update property approval status to "changes_requested"
        await storage.updateProperty(propertyId, { 
          approvalStatus: "changes_requested" 
        });

        await createAuditLog(
          req,
          "create",
          "property_change_request",
          changeRequest.id,
          `Solicitud de cambio creada para propiedad: ${property.title}`
        );

        res.status(201).json(changeRequest);
      });
    } catch (error: any) {
      console.error("Error creating change request:", error);
      res.status(500).json({ message: error.message || "Error al crear solicitud de cambio" });
    }
  });

  app.get("/api/owner/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["owner", "seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      const settings = await storage.getOwnerSettings(userId);
      res.json(settings || { userId, autoApproveAppointments: false });
    } catch (error) {
      console.error("Error fetching owner settings:", error);
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  app.post("/api/owner/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["owner", "seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      // Validate request body with Zod
      const validationResult = updateOwnerSettingsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const updates = validationResult.data;
      
      // Check if settings already exist
      const existing = await storage.getOwnerSettings(userId);
      
      let settings;
      if (existing) {
        settings = await storage.updateOwnerSettings(userId, updates);
      } else {
        settings = await storage.createOwnerSettings({ userId, ...updates });
      }

      await createAuditLog(
        req,
        "update",
        "owner_settings",
        settings.id,
        `Configuración actualizada`
      );

      res.json(settings);
    } catch (error: any) {
      console.error("Error updating owner settings:", error);
      res.status(500).json({ message: error.message || "Error al actualizar configuración" });
    }
  });

  app.get("/api/owner/appointments/pending", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["owner", "seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      // Get properties owned by user
      const properties = await storage.getProperties({ ownerId: userId });
      const propertyIds = properties.map(p => p.id);

      if (propertyIds.length === 0) {
        return res.json([]);
      }

      // Get all appointments for these properties and filter by ownerApprovalStatus
      const allAppointments = await storage.getAppointments({});
      const pendingAppointments = allAppointments.filter(apt => 
        propertyIds.includes(apt.propertyId) && apt.ownerApprovalStatus === "pending"
      );
      res.json(pendingAppointments);
    } catch (error) {
      console.error("Error fetching pending appointments:", error);
      res.status(500).json({ message: "Error al obtener citas pendientes" });
    }
  });

  app.patch("/api/owner/appointments/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["owner", "seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Verify user owns the property
      const property = await storage.getProperty(appointment.propertyId);
      if (!property || (property.ownerId !== userId && !["admin", "admin_jr", "master"].includes(user.role))) {
        return res.status(403).json({ message: "No tienes permisos para aprobar esta cita" });
      }

      // Update appointment approval status
      const updated = await storage.updateAppointment(id, {
        ownerApprovalStatus: "approved",
        ownerApprovedAt: new Date(),
      });

      await createAuditLog(
        req,
        "approve",
        "appointment",
        id,
        `Cita aprobada por propietario`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error approving appointment:", error);
      res.status(500).json({ message: error.message || "Error al aprobar cita" });
    }
  });

  app.patch("/api/owner/appointments/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["owner", "seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Verify user owns the property
      const property = await storage.getProperty(appointment.propertyId);
      if (!property || (property.ownerId !== userId && !["admin", "admin_jr", "master"].includes(user.role))) {
        return res.status(403).json({ message: "No tienes permisos para rechazar esta cita" });
      }

      // Update appointment approval status
      const updated = await storage.updateAppointment(id, {
        ownerApprovalStatus: "rejected",
        ownerApprovedAt: new Date(),
      });

      await createAuditLog(
        req,
        "reject",
        "appointment",
        id,
        `Cita rechazada por propietario`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting appointment:", error);
      res.status(500).json({ message: error.message || "Error al rechazar cita" });
    }
  });

  // Admin API routes - for admins to manage property approvals and inspections
  app.get("/api/admin/change-requests", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const { status, propertyId } = req.query;
      
      const allChangeRequests = await storage.getPropertyChangeRequests();
      let changeRequests = allChangeRequests;
      
      if (status) {
        changeRequests = changeRequests.filter(cr => cr.status === status);
      }
      if (propertyId) {
        changeRequests = changeRequests.filter(cr => cr.propertyId === propertyId);
      }
      
      res.json(changeRequests);
    } catch (error) {
      console.error("Error fetching change requests:", error);
      res.status(500).json({ message: "Error al obtener solicitudes de cambio" });
    }
  });

  app.patch("/api/admin/change-requests/:id/approve", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const reviewerId = req.user?.claims?.sub || req.session?.adminUser?.id;

      const changeRequest = await storage.getPropertyChangeRequest(id);
      if (!changeRequest) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      if (changeRequest.status !== "pending") {
        return res.status(400).json({ 
          message: "Esta solicitud ya fue procesada" 
        });
      }

      // Validate changed fields before applying
      const changedFields = changeRequest.changedFields as any;
      if (typeof changedFields !== 'object' || changedFields === null || Array.isArray(changedFields)) {
        return res.status(400).json({ 
          message: "Datos de cambio inválidos" 
        });
      }

      // Approve and apply changes in transaction
      await db.transaction(async (tx) => {
        // Approve change request and apply changes (cascade logic in storage)
        const updated = await storage.updatePropertyChangeRequestStatus(
          id,
          "approved",
          reviewerId,
          reviewNotes
        );

        await createAuditLog(
          req,
          "approve",
          "property_change_request",
          id,
          `Cambios aprobados para propiedad ${changeRequest.propertyId}`
        );

        res.json(updated);
      });
    } catch (error: any) {
      console.error("Error approving change request:", error);
      res.status(500).json({ message: error.message || "Error al aprobar cambios" });
    }
  });

  app.patch("/api/admin/change-requests/:id/reject", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const reviewerId = req.user?.claims?.sub || req.session?.adminUser?.id;

      const changeRequest = await storage.getPropertyChangeRequest(id);
      if (!changeRequest) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      if (changeRequest.status !== "pending") {
        return res.status(400).json({ 
          message: "Esta solicitud ya fue procesada" 
        });
      }

      const updated = await storage.updatePropertyChangeRequestStatus(
        id,
        "rejected",
        reviewerId,
        reviewNotes
      );

      await createAuditLog(
        req,
        "reject",
        "property_change_request",
        id,
        `Cambios rechazados para propiedad ${changeRequest.propertyId}`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting change request:", error);
      res.status(500).json({ message: error.message || "Error al rechazar cambios" });
    }
  });

  app.get("/api/admin/inspection-reports", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const { status, propertyId } = req.query;
      
      const allReports = await storage.getInspectionReports();
      let reports = allReports;
      
      if (status) {
        reports = reports.filter(r => r.status === status);
      }
      if (propertyId) {
        reports = reports.filter(r => r.propertyId === propertyId);
      }
      
      res.json(reports);
    } catch (error) {
      console.error("Error fetching inspection reports:", error);
      res.status(500).json({ message: "Error al obtener reportes de inspección" });
    }
  });

  app.get("/api/admin/inspection-reports/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getInspectionReport(id);
      
      if (!report) {
        return res.status(404).json({ message: "Reporte no encontrado" });
      }
      
      res.json(report);
    } catch (error) {
      console.error("Error fetching inspection report:", error);
      res.status(500).json({ message: "Error al obtener reporte" });
    }
  });

  app.post("/api/admin/inspection-reports", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const inspectorId = req.user?.claims?.sub || req.session?.adminUser?.id;
      
      // Validate request body with Zod
      const validationResult = createInspectionReportSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const { propertyId, inspectionDate, observations } = validationResult.data;

      // Verify property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Create inspection report
      const report = await storage.createInspectionReport({
        propertyId,
        inspectorId,
        inspectionDate,
        status: "scheduled",
        observations,
      });

      await createAuditLog(
        req,
        "create",
        "inspection_report",
        report.id,
        `Inspección programada para propiedad ${property.title}`
      );

      res.status(201).json(report);
    } catch (error: any) {
      console.error("Error creating inspection report:", error);
      res.status(500).json({ message: error.message || "Error al crear reporte de inspección" });
    }
  });

  app.patch("/api/admin/inspection-reports/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body with Zod
      const validationResult = updateInspectionReportSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const updates = validationResult.data;

      const report = await storage.getInspectionReport(id);
      if (!report) {
        return res.status(404).json({ message: "Reporte no encontrado" });
      }

      // Update inspection report (cascade logic in storage handles property approval status)
      const updated = await storage.updateInspectionReport(id, updates as any);

      await createAuditLog(
        req,
        "update",
        "inspection_report",
        id,
        `Reporte de inspección actualizado`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating inspection report:", error);
      res.status(500).json({ message: error.message || "Error al actualizar reporte" });
    }
  });

  // Agreement Templates routes (admin only)
  app.get("/api/admin/agreement-templates", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { active } = req.query;
      const filters = active !== undefined ? { active: active === "true" } : {};
      
      const templates = await storage.getAgreementTemplates(filters);
      
      await createAuditLog(
        req,
        "view",
        "agreement_template",
        null,
        `Consultó ${templates.length} plantilla(s) de acuerdo`
      );
      
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching agreement templates:", error);
      res.status(500).json({ message: error.message || "Error al obtener plantillas" });
    }
  });

  app.get("/api/admin/agreement-templates/:id", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getAgreementTemplate(id);
      
      if (!template) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }
      
      await createAuditLog(
        req,
        "view",
        "agreement_template",
        id,
        `Consultó plantilla de acuerdo "${template.name}"`
      );
      
      res.json(template);
    } catch (error: any) {
      console.error("Error fetching agreement template:", error);
      res.status(500).json({ message: error.message || "Error al obtener plantilla" });
    }
  });

  app.post("/api/admin/agreement-templates", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const validationResult = insertAgreementTemplateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const template = await storage.createAgreementTemplate(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "agreement_template",
        template.id,
        `Plantilla de acuerdo "${template.name}" creada`
      );

      res.status(201).json(template);
    } catch (error: any) {
      console.error("Error creating agreement template:", error);
      res.status(500).json({ message: error.message || "Error al crear plantilla" });
    }
  });

  app.patch("/api/admin/agreement-templates/:id", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const validationResult = insertAgreementTemplateSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const existing = await storage.getAgreementTemplate(id);
      if (!existing) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }

      const updated = await storage.updateAgreementTemplate(id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "agreement_template",
        id,
        `Plantilla de acuerdo "${updated.name}" actualizada`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating agreement template:", error);
      res.status(500).json({ message: error.message || "Error al actualizar plantilla" });
    }
  });

  app.delete("/api/admin/agreement-templates/:id", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const existing = await storage.getAgreementTemplate(id);
      if (!existing) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }

      await storage.deleteAgreementTemplate(id);

      await createAuditLog(
        req,
        "delete",
        "agreement_template",
        id,
        `Plantilla de acuerdo "${existing.name}" eliminada`
      );

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting agreement template:", error);
      res.status(500).json({ message: error.message || "Error al eliminar plantilla" });
    }
  });

  // Property Submission Draft routes
  app.get("/api/property-submission-drafts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const drafts = await storage.getPropertySubmissionDrafts({ userId });
      res.json(drafts);
    } catch (error: any) {
      console.error("Error fetching property submission drafts:", error);
      res.status(500).json({ message: error.message || "Error al obtener borradores" });
    }
  });

  app.get("/api/property-submission-drafts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const draft = await storage.getPropertySubmissionDraft(id);
      if (!draft) {
        return res.status(404).json({ message: "Borrador no encontrado" });
      }
      
      if (draft.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      res.json(draft);
    } catch (error: any) {
      console.error("Error fetching property submission draft:", error);
      res.status(500).json({ message: error.message || "Error al obtener borrador" });
    }
  });

  app.post("/api/property-submission-drafts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validationResult = insertPropertySubmissionDraftSchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const draft = await storage.createPropertySubmissionDraft(validationResult.data);
      
      await createAuditLog(
        req,
        "create",
        "property_submission_draft",
        draft.id,
        "Borrador de propiedad creado"
      );

      res.status(201).json(draft);
    } catch (error: any) {
      console.error("Error creating property submission draft:", error);
      res.status(500).json({ message: error.message || "Error al crear borrador" });
    }
  });

  app.patch("/api/property-submission-drafts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const existing = await storage.getPropertySubmissionDraft(id);
      if (!existing) {
        return res.status(404).json({ message: "Borrador no encontrado" });
      }
      
      if (existing.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const validationResult = insertPropertySubmissionDraftSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      // Remove server-controlled fields to prevent unauthorized mutation
      const sanitizedData = { ...validationResult.data };
      delete sanitizedData.userId;
      delete (sanitizedData as any).id;
      delete (sanitizedData as any).createdAt;
      delete (sanitizedData as any).updatedAt;

      const updated = await storage.updatePropertySubmissionDraft(id, sanitizedData);
      
      await createAuditLog(
        req,
        "update",
        "property_submission_draft",
        id,
        "Borrador de propiedad actualizado"
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating property submission draft:", error);
      res.status(500).json({ message: error.message || "Error al actualizar borrador" });
    }
  });

  app.delete("/api/property-submission-drafts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const existing = await storage.getPropertySubmissionDraft(id);
      if (!existing) {
        return res.status(404).json({ message: "Borrador no encontrado" });
      }
      
      if (existing.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      await storage.deletePropertySubmissionDraft(id);
      
      await createAuditLog(
        req,
        "delete",
        "property_submission_draft",
        id,
        "Borrador de propiedad eliminado"
      );

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting property submission draft:", error);
      res.status(500).json({ message: error.message || "Error al eliminar borrador" });
    }
  });

  // Property Agreement routes
  app.get("/api/property-agreements/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const agreement = await storage.getPropertyAgreement(id);
      if (!agreement) {
        return res.status(404).json({ message: "Acuerdo no encontrado" });
      }
      
      if (agreement.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      res.json(agreement);
    } catch (error: any) {
      console.error("Error fetching property agreement:", error);
      res.status(500).json({ message: error.message || "Error al obtener acuerdo" });
    }
  });

  app.post("/api/property-agreements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validationResult = insertPropertyAgreementSchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const agreement = await storage.createPropertyAgreement(validationResult.data);
      
      await createAuditLog(
        req,
        "create",
        "property_agreement",
        agreement.id,
        "Acuerdo de propiedad creado"
      );

      res.status(201).json(agreement);
    } catch (error: any) {
      console.error("Error creating property agreement:", error);
      res.status(500).json({ message: error.message || "Error al crear acuerdo" });
    }
  });

  app.post("/api/property-agreements/:id/sign", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { signerName } = req.body;
      
      if (!signerName) {
        return res.status(400).json({ message: "Se requiere el nombre del firmante" });
      }
      
      const agreement = await storage.getPropertyAgreement(id);
      if (!agreement) {
        return res.status(404).json({ message: "Acuerdo no encontrado" });
      }
      
      if (agreement.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      if (agreement.status === "signed") {
        return res.status(400).json({ message: "Este acuerdo ya ha sido firmado" });
      }
      
      const signerIp = req.ip || req.socket.remoteAddress || "unknown";
      const signed = await storage.signPropertyAgreement(id, signerName, signerIp);
      
      await createAuditLog(
        req,
        "update",
        "property_agreement",
        id,
        `Acuerdo firmado por ${signerName}`
      );

      res.json(signed);
    } catch (error: any) {
      console.error("Error signing property agreement:", error);
      res.status(500).json({ message: error.message || "Error al firmar acuerdo" });
    }
  });

  // Rental Opportunity Requests (SOR) routes
  app.post("/api/rental-opportunity-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { propertyId, desiredMoveInDate, preferredContactMethod, notes } = req.body;

      // Verificar límite de SORs activas (máximo 3)
      const activeSORs = await db
        .select()
        .from(rentalOpportunityRequests)
        .where(
          and(
            eq(rentalOpportunityRequests.userId, userId),
            inArray(rentalOpportunityRequests.status, ["pending", "scheduled_visit"])
          )
        );

      if (activeSORs.length >= 3) {
        return res.status(400).json({ 
          error: "Ya tienes 3 solicitudes activas. Espera a que se procesen antes de crear una nueva." 
        });
      }

      // Crear SOR
      const [newSOR] = await db
        .insert(rentalOpportunityRequests)
        .values({
          propertyId,
          userId,
          desiredMoveInDate: desiredMoveInDate || null,
          preferredContactMethod: preferredContactMethod || "email",
          notes: notes || null,
          status: "pending",
        })
        .returning();

      // Registrar acción en lead_journeys
      await db.insert(leadJourneys).values({
        propertyId,
        userId,
        action: "request_opportunity",
      });

      res.json(newSOR);
    } catch (error: any) {
      console.error("Error creating rental opportunity request:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rental-opportunity-requests/active-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const activeSORs = await db
        .select()
        .from(rentalOpportunityRequests)
        .where(
          and(
            eq(rentalOpportunityRequests.userId, userId),
            inArray(rentalOpportunityRequests.status, ["pending", "scheduled_visit"])
          )
        );

      res.json({ count: activeSORs.length });
    } catch (error: any) {
      console.error("Error getting active SOR count:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rental-opportunity-requests/by-property/:propertyId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { propertyId } = req.params;

      const existingSOR = await db
        .select()
        .from(rentalOpportunityRequests)
        .where(
          and(
            eq(rentalOpportunityRequests.userId, userId),
            eq(rentalOpportunityRequests.propertyId, propertyId),
            inArray(rentalOpportunityRequests.status, ["pending", "scheduled_visit"])
          )
        )
        .limit(1);

      res.json(existingSOR[0] || null);
    } catch (error: any) {
      console.error("Error checking existing SOR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's SORs with property and appointment details
  app.get("/api/my-rental-opportunities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const sorsWithDetails = await db
        .select({
          id: rentalOpportunityRequests.id,
          userId: rentalOpportunityRequests.userId,
          propertyId: rentalOpportunityRequests.propertyId,
          status: rentalOpportunityRequests.status,
          notes: rentalOpportunityRequests.notes,
          desiredMoveInDate: rentalOpportunityRequests.desiredMoveInDate,
          preferredContactMethod: rentalOpportunityRequests.preferredContactMethod,
          createdAt: rentalOpportunityRequests.createdAt,
          updatedAt: rentalOpportunityRequests.updatedAt,
        })
        .from(rentalOpportunityRequests)
        .where(eq(rentalOpportunityRequests.userId, userId))
        .orderBy(rentalOpportunityRequests.createdAt);

      // Enrich with property, appointment, and offer data
      const enrichedSORs = await Promise.all(
        sorsWithDetails.map(async (sor) => {
          const property = await storage.getProperty(sor.propertyId);
          
          // Get appointment if status is scheduled_visit
          let appointment = null;
          if (sor.status === "scheduled_visit") {
            const appointments = await storage.getAppointments();
            appointment = appointments.find(
              (apt) => apt.opportunityRequestId === sor.id
            );
          }

          // Get offer if status indicates offer was submitted
          let offer = null;
          if (["offer_submitted", "offer_negotiation", "offer_accepted"].includes(sor.status)) {
            const [foundOffer] = await db
              .select()
              .from(offers)
              .where(eq(offers.opportunityRequestId, sor.id))
              .limit(1);
            offer = foundOffer || null;
          }

          return {
            ...sor,
            property,
            appointment,
            offer,
          };
        })
      );

      res.json(enrichedSORs);
    } catch (error: any) {
      console.error("Error fetching user SORs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Schedule visit from SOR
  app.post("/api/rental-opportunity-requests/:sorId/schedule-visit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sorId } = req.params;
      const { date, type, notes } = req.body;

      // Verificar que la SOR existe y pertenece al usuario
      const [sor] = await db
        .select()
        .from(rentalOpportunityRequests)
        .where(
          and(
            eq(rentalOpportunityRequests.id, sorId),
            eq(rentalOpportunityRequests.userId, userId)
          )
        )
        .limit(1);

      if (!sor) {
        return res.status(404).json({ error: "Solicitud de oportunidad no encontrada" });
      }

      if (sor.status !== "pending") {
        return res.status(400).json({ 
          error: "Esta solicitud ya tiene una visita programada o ha sido procesada" 
        });
      }

      // Preparar datos del appointment
      let meetLink: string | null = null;
      let googleEventId: string | null = null;

      // Crear evento de Google Meet si es video
      if (type === "video") {
        const property = await storage.getProperty(sor.propertyId);
        const appointmentDate = new Date(date);
        const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000);

        const eventResult = await createGoogleMeetEvent({
          summary: `Visita Virtual: ${property?.title || "Propiedad"}`,
          description: `Visita virtual programada desde solicitud de oportunidad`,
          start: appointmentDate,
          end: endDate,
          attendees: [],
        });

        if (eventResult) {
          meetLink = eventResult.meetLink;
          googleEventId = eventResult.eventId;
        }
      }

      // Crear appointment
      const [appointment] = await db
        .insert(appointments)
        .values({
          propertyId: sor.propertyId,
          clientId: userId,
          opportunityRequestId: sorId,
          date: new Date(date),
          type,
          status: "pending",
          meetLink,
          googleEventId,
          notes: notes || null,
        })
        .returning();

      // Actualizar estado de SOR a scheduled_visit
      await db
        .update(rentalOpportunityRequests)
        .set({ 
          status: "scheduled_visit",
          updatedAt: new Date()
        })
        .where(eq(rentalOpportunityRequests.id, sorId));

      // Registrar en lead_journeys
      await db.insert(leadJourneys).values({
        propertyId: sor.propertyId,
        userId,
        action: "view_layer2", // Visita programada
        metadata: { appointmentId: appointment.id, sorId },
      });

      res.json(appointment);
    } catch (error: any) {
      console.error("Error scheduling visit from SOR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submit offer from SOR (after visit completed)
  app.post("/api/rental-opportunity-requests/:sorId/submit-offer", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sorId } = req.params;
      
      // Validar con Zod
      const offerSchema = z.object({
        offerAmount: z.string().min(1).refine((val) => parseFloat(val) > 0, {
          message: "El monto de la oferta debe ser mayor a 0",
        }),
        notes: z.string().optional(),
      });

      const validationResult = offerSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          details: validationResult.error.errors 
        });
      }

      const { offerAmount, notes } = validationResult.data;

      // Verificar que la SOR existe y pertenece al usuario
      const [sor] = await db
        .select()
        .from(rentalOpportunityRequests)
        .where(
          and(
            eq(rentalOpportunityRequests.id, sorId),
            eq(rentalOpportunityRequests.userId, userId)
          )
        )
        .limit(1);

      if (!sor) {
        return res.status(404).json({ error: "Solicitud de oportunidad no encontrada" });
      }

      // Verificar que la visita ya se completó
      if (sor.status !== "visit_completed" && sor.status !== "scheduled_visit") {
        return res.status(400).json({ 
          error: "Debes completar la visita antes de hacer una oferta" 
        });
      }

      // Verificar que no exista ya una oferta para esta SOR
      const [existingOffer] = await db
        .select()
        .from(offers)
        .where(eq(offers.opportunityRequestId, sorId))
        .limit(1);

      if (existingOffer) {
        return res.status(400).json({ 
          error: "Ya existe una oferta para esta solicitud" 
        });
      }

      // Buscar el appointment asociado
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.opportunityRequestId, sorId))
        .limit(1);

      // Crear la oferta
      const [offer] = await db
        .insert(offers)
        .values({
          opportunityRequestId: sorId,
          propertyId: sor.propertyId,
          clientId: userId,
          appointmentId: appointment?.id || null,
          offerAmount: offerAmount.toString(),
          status: "pending",
          notes: notes || null,
        })
        .returning();

      // Actualizar estado de SOR a offer_submitted
      await db
        .update(rentalOpportunityRequests)
        .set({ 
          status: "offer_submitted",
          updatedAt: new Date()
        })
        .where(eq(rentalOpportunityRequests.id, sorId));

      // Registrar en lead_journeys
      await db.insert(leadJourneys).values({
        propertyId: sor.propertyId,
        userId,
        action: "submit_offer",
        metadata: { offerId: offer.id, sorId, offerAmount },
      });

      // Log offer creation
      await createAuditLog(
        req,
        "create",
        "offer",
        offer.id,
        `Oferta creada de $${offer.offerAmount} para propiedad ${sor.propertyId}`
      );

      res.status(201).json(offer);
    } catch (error: any) {
      console.error("Error submitting offer from SOR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get interested clients for owner's properties (with limited info - no contact details)
  app.get("/api/owner/interested-clients", isAuthenticated, requireRole(["owner"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Get all properties owned by this user
      const ownerProperties = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.ownerId, userId));

      if (ownerProperties.length === 0) {
        return res.json([]);
      }

      const propertyIds = ownerProperties.map(p => p.id);

      // Get all rental opportunity requests for these properties
      const interestedClients = await db
        .select({
          id: rentalOpportunityRequests.id,
          status: rentalOpportunityRequests.status,
          desiredMoveInDate: rentalOpportunityRequests.desiredMoveInDate,
          createdAt: rentalOpportunityRequests.createdAt,
          notes: rentalOpportunityRequests.notes,
          propertyId: rentalOpportunityRequests.propertyId,
          propertyTitle: properties.title,
          propertyLocation: properties.location,
          propertyPrice: properties.price,
          // Limited client info - NO CONTACT DETAILS
          clientId: users.id,
          clientFirstName: users.firstName,
          clientLastName: users.lastName,
          // Presentation card info if exists
          presentationCardId: presentationCards.id,
          cardPropertyType: presentationCards.propertyType,
          cardModality: presentationCards.modality,
          cardMinPrice: presentationCards.minPrice,
          cardMaxPrice: presentationCards.maxPrice,
        })
        .from(rentalOpportunityRequests)
        .innerJoin(properties, eq(rentalOpportunityRequests.propertyId, properties.id))
        .innerJoin(users, eq(rentalOpportunityRequests.userId, users.id))
        .leftJoin(presentationCards, eq(users.id, presentationCards.clientId))
        .where(inArray(rentalOpportunityRequests.propertyId, propertyIds))
        .orderBy(desc(rentalOpportunityRequests.createdAt));

      res.json(interestedClients);
    } catch (error: any) {
      console.error("Error getting interested clients:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Counter offer endpoint (for property owner/admin)
  app.post("/api/offers/:offerId/counter", isAuthenticated, requireRole(["admin", "propietario", "vendedor"]), async (req: any, res) => {
    try {
      const { offerId } = req.params;
      const { counterOfferAmount, counterOfferNotes } = req.body;

      // Validar el monto de la contraoferta
      if (!counterOfferAmount || parseFloat(counterOfferAmount) <= 0) {
        return res.status(400).json({ error: "El monto de la contraoferta debe ser mayor a 0" });
      }

      // Buscar la oferta
      const [existingOffer] = await db
        .select()
        .from(offers)
        .where(eq(offers.id, offerId))
        .limit(1);

      if (!existingOffer) {
        return res.status(404).json({ error: "Oferta no encontrada" });
      }

      if (existingOffer.status !== "pending") {
        return res.status(400).json({ 
          error: "Solo se pueden hacer contraofertas a ofertas pendientes" 
        });
      }

      // Actualizar la oferta con contraoferta
      const [updatedOffer] = await db
        .update(offers)
        .set({
          counterOfferAmount: counterOfferAmount.toString(),
          counterOfferNotes: counterOfferNotes || null,
          status: "countered",
          updatedAt: new Date()
        })
        .where(eq(offers.id, offerId))
        .returning();

      // Actualizar estado de SOR a offer_negotiation
      if (existingOffer.opportunityRequestId) {
        await db
          .update(rentalOpportunityRequests)
          .set({ 
            status: "offer_negotiation",
            updatedAt: new Date()
          })
          .where(eq(rentalOpportunityRequests.id, existingOffer.opportunityRequestId));
      }

      // Registrar en lead_journeys
      await db.insert(leadJourneys).values({
        propertyId: existingOffer.propertyId,
        userId: existingOffer.clientId,
        action: "counter_offer",
        metadata: { offerId, counterOfferAmount },
      });

      // Log counter offer
      await createAuditLog(
        req,
        "update",
        "offer",
        offerId,
        `Contraoferta realizada de $${counterOfferAmount} (oferta original: $${existingOffer.offerAmount})`
      );

      res.json(updatedOffer);
    } catch (error: any) {
      console.error("Error creating counter offer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Accept offer endpoint (for property owner/admin)
  app.post("/api/offers/:offerId/accept", isAuthenticated, requireRole(["admin", "propietario", "vendedor"]), async (req: any, res) => {
    try {
      const { offerId } = req.params;

      // Buscar la oferta
      const [existingOffer] = await db
        .select()
        .from(offers)
        .where(eq(offers.id, offerId))
        .limit(1);

      if (!existingOffer) {
        return res.status(404).json({ error: "Oferta no encontrada" });
      }

      if (existingOffer.status === "accepted") {
        return res.status(400).json({ error: "Esta oferta ya fue aceptada" });
      }

      // Actualizar la oferta a aceptada
      const [updatedOffer] = await db
        .update(offers)
        .set({
          status: "accepted",
          updatedAt: new Date()
        })
        .where(eq(offers.id, offerId))
        .returning();

      // Actualizar estado de SOR a offer_accepted
      if (existingOffer.opportunityRequestId) {
        await db
          .update(rentalOpportunityRequests)
          .set({ 
            status: "offer_accepted",
            updatedAt: new Date()
          })
          .where(eq(rentalOpportunityRequests.id, existingOffer.opportunityRequestId));
      }

      // Registrar en lead_journeys
      await db.insert(leadJourneys).values({
        propertyId: existingOffer.propertyId,
        userId: existingOffer.clientId,
        action: "accept_offer",
        metadata: { offerId },
      });

      // Log offer acceptance
      await createAuditLog(
        req,
        "update",
        "offer",
        offerId,
        `Oferta aceptada de $${existingOffer.offerAmount}`
      );

      res.json(updatedOffer);
    } catch (error: any) {
      console.error("Error accepting offer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reject offer endpoint (for property owner/admin)
  app.post("/api/offers/:offerId/reject", isAuthenticated, requireRole(["admin", "propietario", "vendedor"]), async (req: any, res) => {
    try {
      const { offerId } = req.params;
      const { notes } = req.body;

      // Buscar la oferta
      const [existingOffer] = await db
        .select()
        .from(offers)
        .where(eq(offers.id, offerId))
        .limit(1);

      if (!existingOffer) {
        return res.status(404).json({ error: "Oferta no encontrada" });
      }

      if (existingOffer.status === "accepted") {
        return res.status(400).json({ error: "No se puede rechazar una oferta ya aceptada" });
      }

      // Actualizar la oferta a rechazada
      const [updatedOffer] = await db
        .update(offers)
        .set({
          status: "rejected",
          counterOfferNotes: notes || null,
          updatedAt: new Date()
        })
        .where(eq(offers.id, offerId))
        .returning();

      // Actualizar estado de SOR a rejected
      if (existingOffer.opportunityRequestId) {
        await db
          .update(rentalOpportunityRequests)
          .set({ 
            status: "rejected",
            updatedAt: new Date()
          })
          .where(eq(rentalOpportunityRequests.id, existingOffer.opportunityRequestId));
      }

      // Registrar en lead_journeys
      await db.insert(leadJourneys).values({
        propertyId: existingOffer.propertyId,
        userId: existingOffer.clientId,
        action: "reject_offer",
        metadata: { offerId },
      });

      // Log offer rejection
      await createAuditLog(
        req,
        "update",
        "offer",
        offerId,
        `Oferta rechazada de $${existingOffer.offerAmount}`
      );

      res.json(updatedOffer);
    } catch (error: any) {
      console.error("Error rejecting offer:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Favorites routes
  app.post("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { propertyId } = req.body;

      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }

      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const favorite = await storage.addFavorite({ userId, propertyId });
      res.status(201).json(favorite);
    } catch (error: any) {
      console.error("Error adding favorite:", error);
      if (error.message?.includes("duplicate")) {
        return res.status(400).json({ message: "Property already in favorites" });
      }
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:propertyId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { propertyId } = req.params;

      await storage.removeFavorite(userId, propertyId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.get("/api/favorites/:propertyId/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { propertyId } = req.params;

      const isFavorite = await storage.isFavorite(userId, propertyId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Failed to check favorite" });
    }
  });

  // Leads/CRM routes
  app.get("/api/leads", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req, res) => {
    try {
      const { status, assignedToId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (assignedToId) filters.assignedToId = assignedToId;

      const leads = await storage.getLeads(filters);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req, res) => {
    try {
      const { id } = req.params;
      const lead = await storage.getLead(id);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const leadData = req.body;
      const lead = await storage.createLead(leadData);
      
      await createAuditLog(req, "create", "lead", lead.id, `Lead creado: ${lead.firstName} ${lead.lastName}`);
      
      res.status(201).json(lead);
    } catch (error: any) {
      console.error("Error creating lead:", error);
      res.status(400).json({ message: error.message || "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      const updatedLead = await storage.updateLead(id, updates);
      
      await createAuditLog(req, "update", "lead", id, `Lead actualizado: ${updatedLead.firstName} ${updatedLead.lastName}`);
      
      res.json(updatedLead);
    } catch (error: any) {
      console.error("Error updating lead:", error);
      res.status(400).json({ message: error.message || "Failed to update lead" });
    }
  });

  app.patch("/api/leads/:id/status", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      const updatedLead = await storage.updateLeadStatus(id, status);
      
      await createAuditLog(req, "update", "lead", id, `Estado de lead actualizado a: ${status}`);
      
      res.json(updatedLead);
    } catch (error: any) {
      console.error("Error updating lead status:", error);
      res.status(400).json({ message: error.message || "Failed to update lead status" });
    }
  });

  app.delete("/api/leads/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      await createAuditLog(req, "delete", "lead", id, `Lead eliminado: ${existingLead.firstName} ${existingLead.lastName}`);
      
      await storage.deleteLead(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const { status, clientId, propertyId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;
      if (propertyId) filters.propertyId = propertyId;

      const appointments = await storage.getAppointments(filters);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Clean special values
      const cleanedBody = {
        ...req.body,
        clientId: req.body.clientId || userId,
        conciergeId: req.body.conciergeId === "none" ? undefined : req.body.conciergeId,
      };
      
      const appointmentData = insertAppointmentSchema.parse(cleanedBody);

      // Create Google Meet event if type is video
      let meetLink = null;
      let googleEventId = null;
      
      if (appointmentData.type === "video") {
        const property = await storage.getProperty(appointmentData.propertyId);
        const appointmentDate = new Date(appointmentData.date);
        const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // 1 hour later

        const eventResult = await createGoogleMeetEvent({
          summary: `Visita Virtual: ${property?.title || "Propiedad"}`,
          description: `Cita virtual para visitar la propiedad`,
          start: appointmentDate,
          end: endDate,
          attendees: [], // Can be extended to include emails
        });

        if (eventResult) {
          meetLink = eventResult.meetLink;
          googleEventId = eventResult.eventId;
        }
      }

      const appointment = await storage.createAppointment({
        ...appointmentData,
        meetLink: meetLink || appointmentData.meetLink,
        googleEventId: googleEventId || undefined,
      });

      // Log appointment creation
      const property = await storage.getProperty(appointment.propertyId);
      await createAuditLog(
        req,
        "create",
        "appointment",
        appointment.id,
        `Cita creada para ${property?.title || "propiedad"} - ${new Date(appointment.date).toLocaleDateString()}`
      );

      res.status(201).json(appointment);
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ message: error.message || "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.updateAppointment(id, req.body);
      
      // Log appointment update
      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `Cita actualizada - Estado: ${appointment.status}`
      );
      
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.getAppointment(id);

      // Log appointment deletion (before deletion to capture details)
      if (appointment) {
        const property = await storage.getProperty(appointment.propertyId);
        await createAuditLog(
          req,
          "delete",
          "appointment",
          id,
          `Cita cancelada para ${property?.title || "propiedad"} - ${new Date(appointment.date).toLocaleDateString()}`
        );
      }

      if (appointment?.googleEventId) {
        await deleteGoogleMeetEvent(appointment.googleEventId);
      }

      await storage.deleteAppointment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Presentation card routes
  app.get("/api/presentation-cards", isAuthenticated, async (req, res) => {
    try {
      const { clientId } = req.query;
      const cards = await storage.getPresentationCards(clientId as string);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching presentation cards:", error);
      res.status(500).json({ message: "Failed to fetch presentation cards" });
    }
  });

  app.get("/api/presentation-cards/:id/matches", async (req, res) => {
    try {
      const { id } = req.params;
      const properties = await storage.matchPropertiesForCard(id);
      res.json(properties);
    } catch (error) {
      console.error("Error matching properties:", error);
      res.status(500).json({ message: "Failed to match properties" });
    }
  });

  app.post("/api/presentation-cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardData = insertPresentationCardSchema.parse({
        ...req.body,
        clientId: req.body.clientId || userId,
      });

      const card = await storage.createPresentationCard(cardData);
      res.status(201).json(card);
    } catch (error: any) {
      console.error("Error creating presentation card:", error);
      res.status(400).json({ message: error.message || "Failed to create presentation card" });
    }
  });

  app.patch("/api/presentation-cards/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const card = await storage.updatePresentationCard(id, req.body);
      res.json(card);
    } catch (error) {
      console.error("Error updating presentation card:", error);
      res.status(500).json({ message: "Failed to update presentation card" });
    }
  });

  app.delete("/api/presentation-cards/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePresentationCard(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting presentation card:", error);
      res.status(500).json({ message: "Failed to delete presentation card" });
    }
  });

  // Service provider routes
  app.get("/api/service-providers", async (req, res) => {
    try {
      const { specialty, available } = req.query;
      const filters: any = {};
      if (specialty) filters.specialty = specialty;
      if (available !== undefined) filters.available = available === "true";

      const providers = await storage.getServiceProviders(filters);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching service providers:", error);
      res.status(500).json({ message: "Failed to fetch service providers" });
    }
  });

  app.post("/api/service-providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerData = insertServiceProviderSchema.parse({
        ...req.body,
        userId,
      });

      const provider = await storage.createServiceProvider(providerData);
      res.status(201).json(provider);
    } catch (error: any) {
      console.error("Error creating service provider:", error);
      res.status(400).json({ message: error.message || "Failed to create service provider" });
    }
  });

  app.patch("/api/service-providers/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const provider = await storage.updateServiceProvider(id, req.body);
      res.json(provider);
    } catch (error) {
      console.error("Error updating service provider:", error);
      res.status(500).json({ message: "Failed to update service provider" });
    }
  });

  // Service routes
  app.get("/api/service-providers/:id/services", async (req, res) => {
    try {
      const { id } = req.params;
      const services = await storage.getServicesByProvider(id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", isAuthenticated, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error: any) {
      console.error("Error creating service:", error);
      res.status(400).json({ message: error.message || "Failed to create service" });
    }
  });

  app.patch("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const service = await storage.updateService(id, req.body);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteService(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Offer routes
  app.get("/api/offers", isAuthenticated, async (req, res) => {
    try {
      const { status, clientId, propertyId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;
      if (propertyId) filters.propertyId = propertyId;

      const offers = await storage.getOffers(filters);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.post("/api/offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Clean special values
      const cleanedBody = {
        ...req.body,
        clientId: req.body.clientId || userId,
        appointmentId: req.body.appointmentId === "none" ? undefined : req.body.appointmentId,
      };
      
      const offerData = insertOfferSchema.parse(cleanedBody);

      const offer = await storage.createOffer(offerData);
      
      // Log offer creation
      await createAuditLog(
        req,
        "create",
        "offer",
        offer.id,
        `Oferta creada de $${offer.offerAmount} - Estado: ${offer.status}`
      );
      
      res.status(201).json(offer);
    } catch (error: any) {
      console.error("Error creating offer:", error);
      res.status(400).json({ message: error.message || "Failed to create offer" });
    }
  });

  app.patch("/api/offers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const offer = await storage.updateOffer(id, req.body);
      
      // Log offer update
      await createAuditLog(
        req,
        "update",
        "offer",
        id,
        `Oferta actualizada - Estado: ${offer.status}`
      );
      
      res.json(offer);
    } catch (error) {
      console.error("Error updating offer:", error);
      res.status(500).json({ message: "Failed to update offer" });
    }
  });

  // Rental Application routes (Rental Process Kanban)
  app.get("/api/rental-applications", isAuthenticated, async (req, res) => {
    try {
      const { status, propertyId, applicantId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (propertyId) filters.propertyId = propertyId;
      if (applicantId) filters.applicantId = applicantId;

      const applications = await storage.getRentalApplications(filters);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching rental applications:", error);
      res.status(500).json({ message: "Failed to fetch rental applications" });
    }
  });

  app.get("/api/rental-applications/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const application = await storage.getRentalApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Rental application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching rental application:", error);
      res.status(500).json({ message: "Failed to fetch rental application" });
    }
  });

  app.post("/api/rental-applications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applicationData = insertRentalApplicationSchema.parse({
        ...req.body,
        applicantId: req.body.applicantId || userId,
      });

      const application = await storage.createRentalApplication(applicationData);
      
      // Log rental application creation
      await createAuditLog(
        req,
        "create",
        "rental_application",
        application.id,
        `Solicitud de renta creada - Estado: ${application.status}`
      );
      
      res.status(201).json(application);
    } catch (error: any) {
      console.error("Error creating rental application:", error);
      res.status(400).json({ message: error.message || "Failed to create rental application" });
    }
  });

  app.patch("/api/rental-applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const application = await storage.updateRentalApplication(id, req.body);
      
      // Log rental application update
      await createAuditLog(
        req,
        "update",
        "rental_application",
        id,
        `Solicitud de renta actualizada - Estado: ${application.status}`
      );
      
      res.json(application);
    } catch (error) {
      console.error("Error updating rental application:", error);
      res.status(500).json({ message: "Failed to update rental application" });
    }
  });

  app.patch("/api/rental-applications/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const application = await storage.updateRentalApplicationStatus(id, status);
      
      // Log status change
      await createAuditLog(
        req,
        "update",
        "rental_application",
        id,
        `Estado de solicitud cambiado a: ${status}`
      );
      
      res.json(application);
    } catch (error) {
      console.error("Error updating rental application status:", error);
      res.status(500).json({ message: "Failed to update rental application status" });
    }
  });

  app.delete("/api/rental-applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["master", "admin", "admin_jr"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const application = await storage.getRentalApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Rental application not found" });
      }

      // Log deletion
      await createAuditLog(
        req,
        "delete",
        "rental_application",
        id,
        `Solicitud de renta eliminada - Estado: ${application.status}`
      );

      await storage.deleteRentalApplication(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting rental application:", error);
      res.status(500).json({ message: "Failed to delete rental application" });
    }
  });

  // Permission routes
  app.get("/api/users/:id/permissions", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const permissions = await storage.getUserPermissions(id);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  app.post("/api/permissions", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const permissionData = insertPermissionSchema.parse(req.body);
      const permission = await storage.addPermission(permissionData);
      res.status(201).json(permission);
    } catch (error: any) {
      console.error("Error adding permission:", error);
      res.status(400).json({ message: error.message || "Failed to add permission" });
    }
  });

  app.delete("/api/permissions", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const { userId, permission } = req.body;
      await storage.removePermission(userId, permission);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing permission:", error);
      res.status(500).json({ message: "Failed to remove permission" });
    }
  });

  // Budget routes
  app.get("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, staffId, status } = req.query;
      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (staffId) filters.staffId = staffId;
      if (status) filters.status = status;

      const budgets = await storage.getBudgets(filters);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.get("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const budget = await storage.getBudget(id);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      console.error("Error fetching budget:", error);
      res.status(500).json({ message: "Failed to fetch budget" });
    }
  });

  app.post("/api/budgets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["master", "admin", "admin_jr", "management", "provider"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        staffId: req.body.staffId || userId,
      });
      
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error: any) {
      console.error("Error creating budget:", error);
      res.status(400).json({ message: error.message || "Failed to create budget" });
    }
  });

  app.patch("/api/budgets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const budget = await storage.getBudget(id);

      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }

      if (!user || (budget.staffId !== userId && !["master", "admin", "admin_jr"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedBudget = await storage.updateBudget(id, req.body);
      res.json(updatedBudget);
    } catch (error) {
      console.error("Error updating budget:", error);
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  app.delete("/api/budgets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const budget = await storage.getBudget(id);

      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }

      if (!user || (budget.staffId !== userId && !["master", "admin"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteBudget(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  // Task routes
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, assignedToId, status } = req.query;
      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (assignedToId) filters.assignedToId = assignedToId;
      if (status) filters.status = status;

      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["master", "admin", "admin_jr", "management"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Clean special values
      const cleanedBody = {
        ...req.body,
        budgetId: req.body.budgetId === "none" ? undefined : req.body.budgetId,
      };

      const taskData = insertTaskSchema.parse(cleanedBody);
      const task = await storage.createTask(taskData);
      
      // Log task creation
      await createAuditLog(
        req,
        "create",
        "task",
        task.id,
        `Tarea creada: ${task.title}`
      );
      
      res.status(201).json(task);
    } catch (error: any) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: error.message || "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const task = await storage.getTask(id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (!user || (task.assignedToId !== userId && !["master", "admin", "admin_jr", "management"].includes(user.role))) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedTask = await storage.updateTask(id, req.body);
      
      // Log task update
      await createAuditLog(
        req,
        "update",
        "task",
        id,
        `Tarea actualizada: ${updatedTask.title} - Estado: ${updatedTask.status}`
      );
      
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const task = await storage.getTask(id);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (!user || !["master", "admin", "management"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Log task deletion (before deletion to capture details)
      await createAuditLog(
        req,
        "delete",
        "task",
        id,
        `Tarea eliminada: ${task.title}`
      );

      await storage.deleteTask(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Work report routes
  app.get("/api/work-reports", isAuthenticated, async (req, res) => {
    try {
      const { taskId, staffId } = req.query;
      const filters: any = {};
      if (taskId) filters.taskId = taskId;
      if (staffId) filters.staffId = staffId;

      const reports = await storage.getWorkReports(filters);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching work reports:", error);
      res.status(500).json({ message: "Failed to fetch work reports" });
    }
  });

  app.get("/api/work-reports/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getWorkReport(id);
      if (!report) {
        return res.status(404).json({ message: "Work report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching work report:", error);
      res.status(500).json({ message: "Failed to fetch work report" });
    }
  });

  app.post("/api/work-reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportData = insertWorkReportSchema.parse({
        ...req.body,
        staffId: req.body.staffId || userId,
      });

      const report = await storage.createWorkReport(reportData);
      res.status(201).json(report);
    } catch (error: any) {
      console.error("Error creating work report:", error);
      res.status(400).json({ message: error.message || "Failed to create work report" });
    }
  });

  // Audit log routes
  app.get("/api/audit-logs", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const { userId, entityType, entityId, action, limit } = req.query;
      const filters: any = {};
      if (userId) filters.userId = userId;
      if (entityType) filters.entityType = entityType;
      if (entityId) filters.entityId = entityId;
      if (action) filters.action = action;
      if (limit) filters.limit = parseInt(limit as string);

      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/user/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      const currentUserId = req.user.claims.sub;
      const currentUser = await storage.getUser(currentUserId);

      // Users can view their own audit logs, admins can view any user's logs
      if (userId !== currentUserId && !["master", "admin"].includes(currentUser?.role || "")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const logs = await storage.getUserAuditHistory(userId, limit ? parseInt(limit as string) : 100);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user audit history:", error);
      res.status(500).json({ message: "Failed to fetch user audit history" });
    }
  });

  app.post("/api/audit-logs", isAuthenticated, async (req: any, res) => {
    try {
      const logData = insertAuditLogSchema.parse(req.body);
      const log = await storage.createAuditLog(logData);
      res.status(201).json(log);
    } catch (error: any) {
      console.error("Error creating audit log:", error);
      res.status(400).json({ message: error.message || "Failed to create audit log" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error: any) {
      console.error("Error creating notification:", error);
      res.status(400).json({ message: error.message || "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Chat routes
  app.get("/api/chat/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.query;
      const userId = req.user.claims.sub;
      const conversations = await storage.getChatConversations({ type: type as string, userId });
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching chat conversations:", error);
      res.status(500).json({ message: "Failed to fetch chat conversations" });
    }
  });

  app.get("/api/chat/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getChatConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching chat conversation:", error);
      res.status(500).json({ message: "Failed to fetch chat conversation" });
    }
  });

  app.post("/api/chat/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const conversationData = insertChatConversationSchema.parse(req.body);
      const conversation = await storage.createChatConversation(conversationData);
      res.status(201).json(conversation);
    } catch (error: any) {
      console.error("Error creating chat conversation:", error);
      res.status(400).json({ message: error.message || "Failed to create chat conversation" });
    }
  });

  app.get("/api/chat/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getChatMessages(id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/messages", isAuthenticated, async (req: any, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(messageData);
      
      // Broadcast message to all connected clients in this conversation
      const conversationId = messageData.conversationId;
      if (wsClients.has(conversationId)) {
        const clients = wsClients.get(conversationId)!;
        const messagePayload = JSON.stringify({
          type: 'new_message',
          conversationId,
          message
        });
        
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(messagePayload);
          }
        });
      }
      
      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error creating chat message:", error);
      res.status(400).json({ message: error.message || "Failed to create chat message" });
    }
  });

  app.post("/api/chat/participants", isAuthenticated, async (req: any, res) => {
    try {
      const participantData = insertChatParticipantSchema.parse(req.body);
      const participant = await storage.addChatParticipant(participantData);
      res.status(201).json(participant);
    } catch (error: any) {
      console.error("Error adding chat participant:", error);
      res.status(400).json({ message: error.message || "Failed to add chat participant" });
    }
  });

  app.get("/api/chat/conversations/:id/participants", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const participants = await storage.getChatParticipants(id);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching chat participants:", error);
      res.status(500).json({ message: "Failed to fetch chat participants" });
    }
  });

  const httpServer = createServer(app);
  const sessionMiddleware = getSession();
  
  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/chat' });
  
  wss.on('connection', async (ws, req) => {
    console.log('WebSocket connection attempt');
    
    // Parse session from cookies
    let userId: string | null = null;
    
    try {
      const cookies = req.headers.cookie;
      if (!cookies) {
        console.error('WebSocket: No cookies found');
        ws.close(1008, 'Unauthorized: No session');
        return;
      }
      
      const parsedCookies = parseCookie(cookies);
      const sessionId = parsedCookies['connect.sid']?.split('.')[0]?.substring(2);
      
      if (!sessionId) {
        console.error('WebSocket: No session ID found');
        ws.close(1008, 'Unauthorized: No session');
        return;
      }
      
      // Get session from store
      const sessionStore = (sessionMiddleware as any).store;
      const session: any = await new Promise((resolve, reject) => {
        sessionStore.get(sessionId, (err: any, session: any) => {
          if (err) reject(err);
          else resolve(session);
        });
      });
      
      if (!session) {
        console.error('WebSocket: Session not found');
        ws.close(1008, 'Unauthorized: Invalid session');
        return;
      }
      
      // Extract user ID from session
      if (session.adminUser) {
        userId = session.adminUser.id;
      } else if (session.userId) {
        userId = session.userId;
      } else if (session.passport?.user?.claims?.sub) {
        userId = session.passport.user.claims.sub;
      }
      
      if (!userId) {
        console.error('WebSocket: No user ID in session');
        ws.close(1008, 'Unauthorized: No user');
        return;
      }
      
      console.log(`WebSocket: User ${userId} authenticated`);
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      ws.close(1008, 'Unauthorized: Authentication failed');
      return;
    }
    
    let currentConversationId: string | null = null;
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join_conversation') {
          const conversationId = message.conversationId;
          
          if (!conversationId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Missing conversation ID' }));
            return;
          }
          
          // Verify user is a participant in this conversation
          try {
            const participants = await storage.getChatParticipants(conversationId);
            const isParticipant = participants.some(p => p.userId === userId);
            
            if (!isParticipant) {
              console.error(`WebSocket: User ${userId} not authorized for conversation ${conversationId}`);
              ws.send(JSON.stringify({ type: 'error', message: 'Not authorized for this conversation' }));
              return;
            }
            
            currentConversationId = conversationId;
            
            if (!wsClients.has(currentConversationId)) {
              wsClients.set(currentConversationId, new Set());
            }
            wsClients.get(currentConversationId)!.add(ws);
            
            console.log(`WebSocket: User ${userId} joined conversation ${currentConversationId}`);
            ws.send(JSON.stringify({ type: 'joined', conversationId: currentConversationId }));
          } catch (error) {
            console.error('WebSocket: Error verifying participant:', error);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to verify authorization' }));
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      if (currentConversationId) {
        if (wsClients.has(currentConversationId)) {
          wsClients.get(currentConversationId)!.delete(ws);
          
          if (wsClients.get(currentConversationId)!.size === 0) {
            wsClients.delete(currentConversationId);
          }
        }
      }
      console.log(`WebSocket: User ${userId} disconnected`);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  return httpServer;
}
