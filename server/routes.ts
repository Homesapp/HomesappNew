import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { parse as parseCookie } from "cookie";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole, getSession } from "./replitAuth";
import { createGoogleMeetEvent, deleteGoogleMeetEvent } from "./googleCalendar";
import { calculateRentalCommissions } from "./commissionCalculator";
import { sendVerificationEmail, sendLeadVerificationEmail, sendDuplicateLeadNotification, sendOwnerReferralVerificationEmail, sendOwnerReferralApprovedNotification } from "./gmail";
import { processChatbotMessage, generatePropertyRecommendations } from "./chatbot";
import { authLimiter, registrationLimiter, emailVerificationLimiter, chatbotLimiter } from "./rateLimiters";
import { sanitizeText, sanitizeHtml, sanitizeObject } from "./sanitize";
import { handleGenericError, handleZodError } from "./errorHandling";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import {
  insertPropertySchema,
  insertAppointmentSchema,
  insertCalendarEventSchema,
  insertPresentationCardSchema,
  insertServiceProviderSchema,
  insertServiceSchema,
  insertServiceBookingSchema,
  insertOfferSchema,
  insertPermissionSchema,
  insertPropertyStaffSchema,
  insertBudgetSchema,
  insertTaskSchema,
  insertWorkReportSchema,
  insertAuditLogSchema,
  adminLoginSchema,
  updateAdminProfileSchema,
  updateAdminPasswordSchema,
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
  propertyRecommendations,
  autoSuggestions,
  createPropertyChangeRequestSchema,
  updateOwnerSettingsSchema,
  insertRentalApplicationSchema,
  insertRentalContractSchema,
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
  insertProviderApplicationSchema,
  insertFeedbackSchema,
  updateFeedbackSchema,
  insertRentalCommissionConfigSchema,
  insertAccountantAssignmentSchema,
  insertPayoutBatchSchema,
  insertIncomeTransactionSchema,
  insertChangelogSchema,
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

// Helper function to check if user has full admin privileges (admin and master only)
function hasFullAdminPrivileges(userRole: string): boolean {
  return ["master", "admin"].includes(userRole);
}

// Helper function to check if user has any admin privileges (including admin_jr)
function hasAdminPrivileges(userRole: string): boolean {
  return ["master", "admin", "admin_jr"].includes(userRole);
}

// Middleware to require full admin privileges
async function requireFullAdmin(req: any, res: any, next: any) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    let userRole: string | null = null;
    
    // Check if it's an admin user (from admin_users table)
    if (user.adminAuth && req.session?.adminUser) {
      userRole = req.session.adminUser.role;
    } else {
      // Regular user from users table
      const userId = user.claims.sub;
      const dbUser = await storage.getUser(userId);
      if (!dbUser) {
        return res.status(403).json({ 
          message: "Forbidden: This action requires full administrator privileges" 
        });
      }
      userRole = dbUser.role;
    }
    
    if (!userRole || !hasFullAdminPrivileges(userRole)) {
      return res.status(403).json({ 
        message: "Forbidden: This action requires full administrator privileges" 
      });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin privileges:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Middleware to require accountant or admin role
function requireAccountantOrAdmin(req: any, res: any, next: any) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userId = user.claims.sub;
  storage.getUser(userId).then(dbUser => {
    if (!dbUser || !["accountant", "master", "admin", "admin_jr"].includes(dbUser.role)) {
      return res.status(403).json({ 
        message: "Forbidden: This action requires accountant or administrator privileges" 
      });
    }
    req.dbUser = dbUser; // Attach user to request for later use
    next();
  }).catch(error => {
    console.error("Error checking accountant privileges:", error);
    res.status(500).json({ message: "Internal server error" });
  });
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
  app.post("/api/auth/admin/login", authLimiter, async (req: any, res) => {
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

  // Update admin profile
  app.patch("/api/auth/admin/profile", async (req: any, res) => {
    try {
      if (!req.session.adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validationResult = updateAdminProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors,
        });
      }

      const adminId = req.session.adminUser.id;
      const updatedAdmin = await storage.updateAdminProfile(adminId, validationResult.data);

      // Update session with new data
      req.session.adminUser = {
        ...req.session.adminUser,
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName,
        email: updatedAdmin.email,
        profileImageUrl: updatedAdmin.profileImageUrl,
      };

      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const { passwordHash, ...adminWithoutPassword } = updatedAdmin;
      res.json(adminWithoutPassword);
    } catch (error) {
      console.error("Error updating admin profile:", error);
      res.status(500).json({ message: "Failed to update admin profile" });
    }
  });

  // Update admin password
  app.patch("/api/auth/admin/password", async (req: any, res) => {
    try {
      if (!req.session.adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validationResult = updateAdminPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors,
        });
      }

      const { currentPassword, newPassword } = validationResult.data;
      const adminId = req.session.adminUser.id;

      // Get current admin to verify password
      const admin = await storage.getAdminByUsername(req.session.adminUser.username);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateAdminPassword(adminId, newPasswordHash);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating admin password:", error);
      res.status(500).json({ message: "Failed to update admin password" });
    }
  });

  // Local user login route (for users who registered with email/password)
  app.post("/api/auth/login", authLimiter, async (req: any, res) => {
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

      // Get current user data to check their approved roles
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // User can always switch between owner and cliente (base roles)
      const isBaseRole = role === "owner" || role === "cliente";
      
      // User can switch to their approved additional role
      const isApprovedAdditionalRole = role === currentUser.additionalRole;

      if (!isBaseRole && !isApprovedAdditionalRole) {
        return res.status(400).json({ 
          message: "Solo puedes cambiar a roles que tienes aprobados" 
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

  app.patch("/api/user/mark-welcome-seen", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dontShowAgain } = req.body;
      
      const updates: any = {
        lastWelcomeShown: new Date(),
      };
      
      if (dontShowAgain === true) {
        updates.hasSeenWelcome = true;
      }
      
      await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking welcome as seen:", error);
      res.status(500).json({ message: "Failed to mark welcome as seen" });
    }
  });

  // User registration routes
  app.post("/api/register", registrationLimiter, async (req, res) => {
    try {
      const validationResult = userRegistrationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid registration data",
          errors: validationResult.error.errors,
        });
      }

      const { email, password, firstName, lastName, phone, preferredLanguage } = validationResult.data;

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
        preferredLanguage: preferredLanguage || "es",
        role: "cliente",
        status: "approved",
        emailVerified: false,
      });

      // Generate 6-digit verification code using crypto for security
      const crypto = await import("crypto");
      const verificationCode = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiration

      await storage.createEmailVerificationToken({
        userId: user.id,
        code: verificationCode,
        expiresAt,
      });

      // Send verification email
      let emailSent = false;
      let emailError: string | null = null;
      
      try {
        console.log(`Attempting to send verification email to ${user.email} with code ${verificationCode}`);
        const emailResult = await sendVerificationEmail(user.email, verificationCode);
        console.log("Verification email sent successfully:", JSON.stringify(emailResult, null, 2));
        emailSent = true;
      } catch (error) {
        console.error("Error sending verification email:", error);
        emailError = error instanceof Error ? error.message : String(error);
        console.error("Email error details:", emailError);
        // Don't fail registration if email fails
      }

      res.status(201).json({
        message: emailSent 
          ? "Cuenta creada exitosamente. Por favor verifica tu email." 
          : "Cuenta creada exitosamente. El correo de verificación será enviado pronto.",
        userId: user.id,
        email: user.email,
        emailSent,
        ...(emailError && { emailError })
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Error al crear la cuenta" });
    }
  });

  app.post("/api/verify-email", emailVerificationLimiter, async (req: any, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email y código son requeridos" });
      }

      // Validate code format (6 digits)
      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({ message: "Código inválido" });
      }

      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Código de verificación inválido" });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: "El email ya está verificado" });
      }

      // Get verification token for this specific user
      const verificationToken = await storage.getEmailVerificationTokenByUserId(user.id);
      
      // Verify code matches and belongs to this user
      if (!verificationToken || verificationToken.code !== code) {
        return res.status(400).json({ message: "Código de verificación inválido" });
      }

      // Check if code is expired
      if (new Date() > verificationToken.expiresAt) {
        await storage.deleteEmailVerificationToken(verificationToken.id);
        return res.status(400).json({ message: "El código ha expirado" });
      }

      // Verify user email
      await storage.verifyUserEmail(user.id);

      // Delete used token
      await storage.deleteEmailVerificationToken(verificationToken.id);

      // Auto-login: Create session for the user
      req.session.userId = user.id;

      // Save session explicitly
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ 
        message: "Email verificado exitosamente",
        autoLogin: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Error al verificar el código" });
    }
  });

  // Resend verification code
  app.post("/api/resend-verification", emailVerificationLimiter, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email es requerido" });
      }

      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: "El email ya está verificado" });
      }

      // Delete old verification code if exists
      await storage.deleteEmailVerificationTokenByUserId(user.id);

      // Generate new 6-digit verification code using crypto for security
      const crypto = await import("crypto");
      const verificationCode = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await storage.createEmailVerificationToken({
        userId: user.id,
        code: verificationCode,
        expiresAt,
      });

      // Send verification email
      try {
        await sendVerificationEmail(user.email, verificationCode);
        res.json({ message: "Código de verificación enviado" });
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        res.status(500).json({ message: "Error al enviar el código" });
      }
    } catch (error) {
      console.error("Error resending verification code:", error);
      res.status(500).json({ message: "Error al reenviar el código" });
    }
  });

  app.get("/api/verify-email", emailVerificationLimiter, async (req: any, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Token inválido" });
      }

      // Legacy support - redirect to verification page
      res.redirect(`/verify-email?token=${token}`);
    } catch (error) {
      console.error("Error with legacy verification:", error);
      res.status(500).json({ message: "Error al verificar" });
    }
  });

  app.get("/api/verify-email-old", emailVerificationLimiter, async (req: any, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Token inválido" });
      }

      // This is for old-style verification - not used anymore but kept for backward compatibility
      res.json({ 
        message: "Este método de verificación ya no está disponible. Por favor solicita un nuevo código.",
        autoLogin: false,
        requiresApproval: true
      });
    } catch (error) {
      console.error("Error during email verification:", error);
      res.status(500).json({ message: "Error al verificar el email" });
    }
  });

  // Admin: Create user with custom role
  const adminCreateUserSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    role: z.enum([
      "master",
      "admin",
      "admin_jr",
      "cliente",
      "seller",
      "owner",
      "management",
      "concierge",
      "provider",
      "abogado",
      "contador",
      "agente_servicios_especiales",
    ]),
    phone: z.string().optional(),
    sendEmail: z.boolean().optional(),
  });

  app.post("/api/admin/users", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const validationResult = adminCreateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos de usuario inválidos",
          errors: validationResult.error.errors,
        });
      }

      const { email, password, firstName, lastName, role, phone, sendEmail } = validationResult.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "El email ya está registrado" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with specified role
      const user = await storage.createUserWithPassword({
        email,
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        role,
        status: "approved",
        emailVerified: true, // Auto-verify admin-created accounts
        preferredLanguage: "es",
      });

      // Optionally send welcome email
      if (sendEmail) {
        try {
          // Generate verification token (even though auto-verified, for welcome email)
          const verificationToken = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          await storage.createEmailVerificationToken({
            userId: user.id,
            token: verificationToken,
            expiresAt,
          });

          await sendVerificationEmail(user.email, verificationToken);
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          // Don't fail user creation if email fails
        }
      }

      // Create audit log
      await createAuditLog(
        req,
        "create",
        "user",
        user.id,
        `Admin created user with role ${role}`
      );

      res.status(201).json({
        message: "Usuario creado exitosamente",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error al crear el usuario" });
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
      
      // Enrich requests with user data
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const user = await storage.getUser(request.userId);
          return {
            ...request,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              profilePictureUrl: user.profileImageUrl,
            } : undefined,
          };
        })
      );
      
      res.json(requestsWithUsers);
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
      // Only pass reviewerId if it's an OIDC user (not admin or local auth)
      // Admin users are in admin_users table, not users table
      const reviewerIdToSave = (!req.user?.adminAuth && !req.user?.localAuth) ? req.user?.claims?.sub : null;
      const updatedRequest = await storage.updateRoleRequestStatus(
        id,
        "approved",
        reviewerIdToSave,
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
      // Only pass reviewerId if it's an OIDC user (not admin or local auth)
      // Admin users are in admin_users table, not users table
      const reviewerIdToSave = (!req.user?.adminAuth && !req.user?.localAuth) ? req.user?.claims?.sub : null;
      const updatedRequest = await storage.updateRoleRequestStatus(
        id,
        "rejected",
        reviewerIdToSave,
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
      const { active, approvalStatus } = req.query;
      const filters: any = {};
      if (active !== undefined) filters.active = active === "true";
      if (approvalStatus) filters.approvalStatus = approvalStatus;
      
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

  app.get("/api/colonies/approved", async (req, res) => {
    try {
      const colonies = await storage.getApprovedColonies();
      res.json(colonies);
    } catch (error) {
      console.error("Error fetching approved colonies:", error);
      res.status(500).json({ message: "Failed to fetch approved colonies" });
    }
  });

  app.post("/api/colonies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      // Only owners can suggest colonies
      if (!user || user.role !== "owner") {
        return res.status(403).json({ message: "Solo los propietarios pueden sugerir colonias" });
      }
      
      // Validate request body with Zod
      const colonySchema = z.object({
        name: z.string().min(1, "El nombre de la colonia es requerido"),
      });
      
      const validationResult = colonySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const { name } = validationResult.data;

      // Generate slug from name
      const slug = name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

      // Create colony with pending status, requires admin approval
      const colony = await storage.createColony({
        name,
        slug,
        active: true,
        approvalStatus: "pending",
        requestedBy: userId,
      });

      await createAuditLog(
        req,
        "create",
        "colony",
        colony.id,
        `Colonia solicitada: ${name}`
      );

      res.json(colony);
    } catch (error) {
      console.error("Error creating colony:", error);
      res.status(500).json({ message: "Failed to create colony" });
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

  app.patch("/api/admin/colonies/:id/approve", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Validate colony exists
      const existingColony = await storage.getColony(id);
      if (!existingColony) {
        return res.status(404).json({ message: "Colonia no encontrada" });
      }

      const colony = await storage.updateColonyStatus(id, "approved");
      
      await createAuditLog(
        req,
        "approve",
        "colony",
        id,
        `Colonia aprobada: ${colony.name}`
      );

      res.json(colony);
    } catch (error) {
      console.error("Error approving colony:", error);
      res.status(500).json({ message: "Failed to approve colony" });
    }
  });

  app.patch("/api/admin/colonies/:id/reject", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Validate colony exists
      const existingColony = await storage.getColony(id);
      if (!existingColony) {
        return res.status(404).json({ message: "Colonia no encontrada" });
      }

      const colony = await storage.updateColonyStatus(id, "rejected");
      
      await createAuditLog(
        req,
        "reject",
        "colony",
        id,
        `Colonia rechazada: ${colony.name}`
      );

      res.json(colony);
    } catch (error) {
      console.error("Error rejecting colony:", error);
      res.status(500).json({ message: "Failed to reject colony" });
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
      const user = await storage.getUser(userId);

      // Only owners can suggest condominiums
      if (!user || user.role !== "owner") {
        return res.status(403).json({ message: "Solo los propietarios pueden sugerir condominios" });
      }
      
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

  app.patch("/api/admin/condominiums/:id/approve", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

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

  app.patch("/api/admin/condominiums/:id/reject", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

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

  app.patch("/api/admin/condominiums/:id", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Validate condominium exists
      const existingCondominium = await storage.getCondominium(id);
      if (!existingCondominium) {
        return res.status(404).json({ message: "Condominio no encontrado" });
      }

      // Validate request body with Zod
      const updateSchema = z.object({
        name: z.string().min(1, "El nombre del condominio es requerido").optional(),
        zone: z.string().optional(),
        address: z.string().optional(),
      });
      
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const condominium = await storage.updateCondominium(id, validationResult.data);
      
      await createAuditLog(
        req,
        "update",
        "condominium",
        id,
        `Condominio actualizado: ${condominium.name}`
      );

      res.json(condominium);
    } catch (error) {
      console.error("Error updating condominium:", error);
      res.status(500).json({ message: "Failed to update condominium" });
    }
  });

  app.patch("/api/admin/condominiums/:id/toggle-active", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { active } = req.body;

      // Validate condominium exists
      const existingCondominium = await storage.getCondominium(id);
      if (!existingCondominium) {
        return res.status(404).json({ message: "Condominio no encontrado" });
      }

      if (typeof active !== "boolean") {
        return res.status(400).json({ message: "El campo 'active' debe ser booleano" });
      }

      const condominium = await storage.toggleCondominiumActive(id, active);
      
      await createAuditLog(
        req,
        "update",
        "condominium",
        id,
        `Condominio ${active ? 'activado' : 'suspendido'}: ${condominium.name}`
      );

      res.json(condominium);
    } catch (error) {
      console.error("Error toggling condominium active status:", error);
      res.status(500).json({ message: "Failed to toggle condominium active status" });
    }
  });

  app.delete("/api/admin/condominiums/:id", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Validate condominium exists
      const existingCondominium = await storage.getCondominium(id);
      if (!existingCondominium) {
        return res.status(404).json({ message: "Condominio no encontrado" });
      }

      // Check if condominium has associated properties
      const propertiesCount = await storage.countPropertiesByCondominium(id);
      if (propertiesCount > 0) {
        return res.status(400).json({ 
          message: `No se puede eliminar el condominio porque tiene ${propertiesCount} propiedad${propertiesCount > 1 ? 'es' : ''} asociada${propertiesCount > 1 ? 's' : ''}. Por favor, elimina o reasigna las propiedades primero.` 
        });
      }

      await createAuditLog(
        req,
        "delete",
        "condominium",
        id,
        `Condominio eliminado: ${existingCondominium.name}`
      );

      await storage.deleteCondominium(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting condominium:", error);
      res.status(500).json({ message: "Failed to delete condominium" });
    }
  });

  // Get duplicate condominiums
  app.get("/api/admin/condominiums/duplicates/list", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const duplicates = await db.execute(sql`
        WITH duplicates AS (
          SELECT 
            id,
            name,
            zone,
            address,
            approval_status,
            created_at,
            LOWER(name) as name_lower,
            ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY created_at ASC) as row_num,
            COUNT(*) OVER (PARTITION BY LOWER(name)) as duplicate_count
          FROM condominiums
        )
        SELECT 
          id,
          name,
          zone,
          address,
          approval_status,
          created_at,
          duplicate_count::int as duplicate_count,
          row_num::int as row_num
        FROM duplicates 
        WHERE duplicate_count > 1
        ORDER BY name_lower, created_at
      `);

      res.json(duplicates.rows);
    } catch (error) {
      console.error("Error fetching duplicate condominiums:", error);
      res.status(500).json({ message: "Error al obtener condominios duplicados" });
    }
  });

  // Delete duplicate condominiums (keeps the oldest one)
  app.delete("/api/admin/condominiums/duplicates/remove", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const result = await db.execute(sql`
        DELETE FROM condominiums
        WHERE id IN (
          SELECT id
          FROM (
            SELECT 
              id,
              ROW_NUMBER() OVER (PARTITION BY LOWER(name) ORDER BY created_at ASC) as row_num
            FROM condominiums
          ) as duplicates
          WHERE row_num > 1
        )
        RETURNING id, name
      `);

      await createAuditLog(
        req,
        "delete",
        "condominium",
        "bulk",
        `Eliminados ${result.rowCount || 0} condominios duplicados`
      );

      res.json({ 
        message: `Se eliminaron ${result.rowCount || 0} condominios duplicados`,
        deletedCount: result.rowCount || 0,
        deletedCondominiums: result.rows
      });
    } catch (error) {
      console.error("Error deleting duplicate condominiums:", error);
      res.status(500).json({ message: "Error al eliminar condominios duplicados" });
    }
  });

  // Get condominium with properties count
  app.get("/api/admin/condominiums/:id/details", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const { id } = req.params;
      const condominium = await storage.getCondominium(id);
      
      if (!condominium) {
        return res.status(404).json({ message: "Condominio no encontrado" });
      }

      // Get properties in this condominium
      const allProperties = await storage.getProperties({});
      const properties = allProperties.filter(p => p.condominiumId === id);

      res.json({
        ...condominium,
        propertiesCount: properties.length,
        properties: properties.map(p => ({
          id: p.id,
          title: p.title,
          unitNumber: p.unitNumber,
          propertyType: p.propertyType,
          status: p.status,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          price: p.price,
          ownerId: p.ownerId,
          managementId: p.managementId,
        })),
      });
    } catch (error) {
      console.error("Error fetching condominium details:", error);
      res.status(500).json({ message: "Failed to fetch condominium details" });
    }
  });

  // Get statistics for all condominiums
  app.get("/api/admin/condominiums-stats", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const condominiums = await storage.getCondominiums({});
      const colonies = await storage.getColonies({});
      const allProperties = await storage.getProperties({});

      // Group properties by condominium
      const condominiumStats = condominiums.map(condo => {
        const properties = allProperties.filter(p => p.condominiumId === condo.id);
        return {
          ...condo,
          propertiesCount: properties.length,
        };
      });

      // Group properties by colony
      const colonyStats = colonies.map(colony => {
        const properties = allProperties.filter(p => p.colonyId === colony.id);
        return {
          ...colony,
          propertiesCount: properties.length,
        };
      });

      // Properties without condominium
      const propertiesWithoutCondominium = allProperties.filter(p => !p.condominiumId).length;

      res.json({
        condominiums: condominiumStats,
        colonies: colonyStats,
        totalProperties: allProperties.length,
        propertiesWithoutCondominium,
      });
    } catch (error) {
      console.error("Error fetching condominium stats:", error);
      res.status(500).json({ message: "Failed to fetch condominium stats" });
    }
  });

  // System Configuration routes (master only)
  app.get("/api/system-config", isAuthenticated, requireRole(["master"]), async (req, res) => {
    try {
      const configs = await storage.getAllSystemConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching system configurations:", error);
      res.status(500).json({ message: "Error al obtener configuraciones del sistema" });
    }
  });

  app.get("/api/system-config/:key", isAuthenticated, requireRole(["master"]), async (req, res) => {
    try {
      const { key } = req.params;
      const config = await storage.getSystemConfig(key);
      
      if (!config) {
        return res.status(404).json({ message: "Configuración no encontrada" });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching system configuration:", error);
      res.status(500).json({ message: "Error al obtener configuración del sistema" });
    }
  });

  app.put("/api/system-config/:key", isAuthenticated, requireRole(["master"]), async (req: any, res) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Valor es requerido" });
      }
      
      const userId = req.user.claims.sub;
      const config = await storage.upsertSystemConfig({
        key,
        value,
        description: description || null,
        updatedBy: userId,
      });
      
      await createAuditLog(req, "update", "system_config", key, `Configuración actualizada: ${key} = ${value}`);
      
      res.json(config);
    } catch (error: any) {
      console.error("Error updating system configuration:", error);
      res.status(400).json({ message: error.message || "Error al actualizar configuración del sistema" });
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
        availableTo,
        propertyType,
        colonyName,
        condoName,
        unitType,
        allowsSubleasing
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
      if (propertyType && typeof propertyType === "string") {
        filters.propertyType = propertyType;
      }
      if (colonyName && typeof colonyName === "string") {
        filters.colonyName = colonyName;
      }
      if (condoName && typeof condoName === "string") {
        filters.condoName = condoName;
      }
      if (unitType && typeof unitType === "string") {
        filters.unitType = unitType;
      }
      if (allowsSubleasing !== undefined) {
        filters.allowsSubleasing = allowsSubleasing === "true";
      }

      // Only show approved or published properties to non-authenticated users
      // This is a security-critical check - always override approvalStatus for non-authenticated users
      const isUserAuthenticated = req.user || (req.session && (req.session.adminUser || req.session.userId));
      if (!isUserAuthenticated) {
        // Defensively delete any approvalStatus that might have been set and force the correct values
        delete filters.approvalStatus;
        filters.approvalStatus = ["approved", "published"];
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
      
      // Only show approved or published properties to non-authenticated users
      const isUserAuthenticated = req.user || (req.session && (req.session.adminUser || req.session.userId));
      if (!isUserAuthenticated && !["approved", "published"].includes(property.approvalStatus)) {
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

      const sanitizedBody = {
        ...req.body,
        title: sanitizeText(req.body.title),
        description: sanitizeHtml(req.body.description),
        location: sanitizeText(req.body.location),
      };

      const propertyData = insertPropertySchema.parse({
        ...sanitizedBody,
        ownerId: sanitizedBody.ownerId || userId,
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
      return handleGenericError(res, error, "al crear la propiedad");
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

      const sanitizedBody = {
        ...req.body,
        title: req.body.title ? sanitizeText(req.body.title) : undefined,
        description: req.body.description ? sanitizeHtml(req.body.description) : undefined,
        location: req.body.location ? sanitizeText(req.body.location) : undefined,
      };

      const updatedProperty = await storage.updateProperty(id, sanitizedBody);
      
      // Log property update
      await createAuditLog(
        req,
        "update",
        "property",
        id,
        `Propiedad actualizada: ${updatedProperty.title}`
      );
      
      res.json(updatedProperty);
    } catch (error: any) {
      return handleGenericError(res, error, "al actualizar la propiedad");
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
    } catch (error: any) {
      return handleGenericError(res, error, "al eliminar la propiedad");
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
        // Only pass reviewerId if it's an OIDC user (not admin or local auth)
        const reviewerIdToSave = (!req.user?.adminAuth && !req.user?.localAuth) ? req.user?.claims?.sub : null;
        const updated = await storage.updatePropertyChangeRequestStatus(
          id,
          "approved",
          reviewerIdToSave,
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

      // Only pass reviewerId if it's an OIDC user (not admin or local auth)
      const reviewerIdToSave = (!req.user?.adminAuth && !req.user?.localAuth) ? req.user?.claims?.sub : null;
      const updated = await storage.updatePropertyChangeRequestStatus(
        id,
        "rejected",
        reviewerIdToSave,
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

  // Get user's property agreements (contracts)
  app.get("/api/property-agreements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const agreements = await storage.getPropertyAgreements({ userId });
      res.json(agreements);
    } catch (error: any) {
      console.error("Error fetching property agreements:", error);
      res.status(500).json({ message: error.message || "Error al obtener contratos" });
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
    let googleEventId: string | null = null;
    
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

      // Crear evento de Google Meet si es video
      if (type === "video") {
        const property = await storage.getProperty(sor.propertyId);
        const appointmentDate = new Date(date);
        const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000);

        try {
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
        } catch (meetError) {
          console.error("Error creating Google Meet event:", meetError);
          // Continue without meet link if event creation fails
        }
      }

      try {
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
      } catch (dbError) {
        // Rollback: Delete Google Meet event if any DB operation fails
        if (googleEventId) {
          try {
            await deleteGoogleMeetEvent(googleEventId);
            console.log(`Rolled back Google Meet event ${googleEventId} due to database operation failure`);
          } catch (rollbackError) {
            console.error("Error rolling back Google Meet event:", rollbackError);
          }
        }
        throw dbError;
      }
    } catch (error: any) {
      return handleGenericError(res, error, "al programar la visita desde SOR");
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
          counterOfferNotes: counterOfferNotes ? sanitizeText(counterOfferNotes) : null,
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
          counterOfferNotes: notes ? sanitizeText(notes) : null,
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
  app.get("/api/leads", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { status, assignedToId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (assignedToId) filters.assignedToId = assignedToId;
      
      // Sellers can only see their own leads
      if (currentUser.role === "seller") {
        filters.registeredById = userId;
      }

      const leads = await storage.getLeads(filters);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const lead = await storage.getLead(id);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Sellers can only access their own leads
      if (currentUser.role === "seller" && lead.registeredById !== userId) {
        return res.status(403).json({ message: "No tienes permiso para acceder a este lead" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const leadData = req.body;
      
      // Obtener configuración del sistema para período de validez
      const validityConfig = await storage.getSystemConfig("lead_validity_months");
      const validityMonths = validityConfig ? parseInt(validityConfig.value) : 3;
      
      // Calcular fecha de validez
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + validityMonths);
      
      // Verificar si existe un lead activo (no expirado) con el mismo email
      const existingLead = await storage.getActiveLead(leadData.email);
      
      if (existingLead) {
        // Lead duplicado detectado
        const originalSeller = await storage.getUser(existingLead.registeredById);
        
        // Obtener propiedades ofrecidas al lead por el vendedor original
        const offersToLead = await storage.getLeadPropertyOffers({ leadId: existingLead.id });
        const propertyNames = await Promise.all(
          offersToLead.map(async (offer) => {
            const property = await storage.getProperty(offer.propertyId);
            return property?.title || "Propiedad sin nombre";
          })
        );
        
        // Enviar notificación al vendedor original
        if (originalSeller && originalSeller.email) {
          try {
            await sendDuplicateLeadNotification(
              originalSeller.email,
              `${originalSeller.firstName} ${originalSeller.lastName}`,
              `${existingLead.firstName} ${existingLead.lastName}`,
              `${currentUser.firstName} ${currentUser.lastName}`,
              propertyNames
            );
          } catch (emailError) {
            console.error("Error enviando notificación de duplicado:", emailError);
          }
        }
        
        // Crear notificación en el sistema para el vendedor original
        await storage.createNotification({
          userId: existingLead.registeredById,
          title: "Lead duplicado detectado",
          message: `El lead ${existingLead.firstName} ${existingLead.lastName} fue registrado nuevamente por ${currentUser.firstName} ${currentUser.lastName}`,
          type: "lead_duplicate",
          link: `/leads/${existingLead.id}`,
        });
        
        await createAuditLog(req, "create", "lead", existingLead.id, `Intento de crear lead duplicado: ${leadData.firstName} ${leadData.lastName}`);
        
        return res.status(409).json({ 
          message: "Este lead ya fue registrado y sigue activo",
          existingLead,
          isDuplicate: true
        });
      }
      
      // Crear nuevo lead con fecha de validez
      const lead = await storage.createLead({
        ...leadData,
        registeredById: userId,
        validUntil,
        emailVerified: false,
      });
      
      // Generar token de verificación para el email del lead
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationLink = `${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.repl.co` : 'http://localhost:5000'}/verify-lead?token=${verificationToken}&email=${encodeURIComponent(lead.email)}`;
      
      // Guardar token de verificación en la base de datos (reutilizando tabla de tokens)
      await storage.createEmailVerificationToken({
        userId: lead.id, // Usar ID del lead
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      });
      
      // Enviar email de confirmación al lead
      try {
        await sendLeadVerificationEmail(lead.email, lead.firstName, verificationLink);
      } catch (emailError) {
        console.error("Error enviando email de verificación al lead:", emailError);
        // No falla la creación del lead si no se puede enviar el email
      }
      
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
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Sellers can only update their own leads
      if (currentUser.role === "seller" && existingLead.registeredById !== userId) {
        return res.status(403).json({ message: "No tienes permiso para actualizar este lead" });
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
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Sellers can only update status of their own leads
      if (currentUser.role === "seller" && existingLead.registeredById !== userId) {
        return res.status(403).json({ message: "No tienes permiso para actualizar el estado de este lead" });
      }
      
      const updatedLead = await storage.updateLeadStatus(id, status);
      
      await createAuditLog(req, "update", "lead", id, `Estado de lead actualizado a: ${status}`);
      
      res.json(updatedLead);
    } catch (error: any) {
      console.error("Error updating lead status:", error);
      res.status(400).json({ message: error.message || "Failed to update lead status" });
    }
  });

  app.delete("/api/leads/:id", isAuthenticated, requireFullAdmin, async (req: any, res) => {
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

  // Lead email verification route (public)
  app.get("/api/verify-lead", emailVerificationLimiter, async (req: any, res) => {
    try {
      const { token, email } = req.query;
      
      if (!token || !email) {
        return res.status(400).json({ message: "Token y email son requeridos" });
      }
      
      // Buscar el lead por email
      const lead = await storage.getLeadByEmail(email as string);
      if (!lead) {
        return res.status(404).json({ message: "Lead no encontrado" });
      }
      
      // Verificar si ya está verificado
      if (lead.emailVerified) {
        return res.status(200).json({ 
          message: "El email ya fue verificado anteriormente",
          alreadyVerified: true
        });
      }
      
      // Obtener el token de verificación
      const verificationToken = await storage.getEmailVerificationTokenByUserId(lead.id);
      if (!verificationToken || verificationToken.token !== token) {
        return res.status(400).json({ message: "Token de verificación inválido" });
      }
      
      // Verificar que no haya expirado
      if (new Date() > verificationToken.expiresAt) {
        await storage.deleteEmailVerificationToken(verificationToken.id);
        return res.status(400).json({ message: "El token ha expirado" });
      }
      
      // Marcar el email del lead como verificado
      await storage.verifyLeadEmail(lead.id);
      
      // Eliminar el token usado
      await storage.deleteEmailVerificationToken(verificationToken.id);
      
      res.json({ 
        message: "Email verificado exitosamente",
        success: true
      });
    } catch (error) {
      console.error("Error verifying lead email:", error);
      res.status(500).json({ message: "Error al verificar el email" });
    }
  });

  // Owner referral email verification route (public)
  app.get("/api/verify-owner-referral/:token", emailVerificationLimiter, async (req: any, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ message: "Token es requerido" });
      }
      
      // Buscar el referido por token
      const referral = await storage.getOwnerReferralByVerificationToken(token);
      if (!referral) {
        return res.status(404).json({ message: "Token de verificación inválido o expirado" });
      }
      
      // Verificar si ya está verificado
      if (referral.emailVerified) {
        return res.status(200).json({ 
          message: "El email ya fue verificado anteriormente",
          alreadyVerified: true,
          referral: {
            id: referral.id,
            firstName: referral.firstName,
            lastName: referral.lastName,
            propertyAddress: referral.propertyAddress
          }
        });
      }
      
      // Verificar que no haya expirado
      if (referral.verificationTokenExpiry && new Date() > referral.verificationTokenExpiry) {
        return res.status(400).json({ message: "El token ha expirado" });
      }
      
      // Marcar el email del referido como verificado
      const updatedReferral = await storage.verifyOwnerReferralEmail(referral.id);
      
      res.json({ 
        message: "Email verificado exitosamente. Un administrador revisará tu solicitud pronto.",
        success: true,
        referral: {
          id: updatedReferral.id,
          firstName: updatedReferral.firstName,
          lastName: updatedReferral.lastName,
          propertyAddress: updatedReferral.propertyAddress
        }
      });
    } catch (error) {
      console.error("Error verifying owner referral email:", error);
      res.status(500).json({ message: "Error al verificar el email" });
    }
  });

  // Route to offer properties to leads (seller only)
  app.post("/api/leads/:leadId/offer-property", isAuthenticated, requireRole(["seller", "master", "admin"]), async (req: any, res) => {
    try {
      const { leadId } = req.params;
      const { propertyId } = req.body;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!propertyId) {
        return res.status(400).json({ message: "ID de propiedad es requerido" });
      }
      
      // Verificar que el lead existe
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead no encontrado" });
      }
      
      // Sellers can only offer properties to their own leads
      if (currentUser.role === "seller" && lead.registeredById !== userId) {
        return res.status(403).json({ message: "No tienes permiso para ofrecer propiedades a este lead" });
      }
      
      // Verificar que la propiedad existe
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }
      
      // Crear el registro de oferta de propiedad
      const offer = await storage.createLeadPropertyOffer({
        leadId,
        propertyId,
        offeredById: userId,
      });
      
      await createAuditLog(req, "create", "lead_property_offer", offer.id, `Propiedad ${property.title} ofrecida a lead ${lead.firstName} ${lead.lastName}`);
      
      res.status(201).json({ 
        message: "Propiedad ofrecida al lead exitosamente",
        offer
      });
    } catch (error: any) {
      console.error("Error offering property to lead:", error);
      res.status(400).json({ message: error.message || "Error al ofrecer propiedad al lead" });
    }
  });

  // Route to get properties offered to a lead
  app.get("/api/leads/:leadId/offered-properties", isAuthenticated, requireRole(["seller", "master", "admin", "management"]), async (req: any, res) => {
    try {
      const { leadId } = req.params;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify the lead exists
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead no encontrado" });
      }
      
      // Sellers can only access offered properties for their own leads
      if (currentUser.role === "seller" && lead.registeredById !== userId) {
        return res.status(403).json({ message: "No tienes permiso para acceder a las propiedades ofrecidas de este lead" });
      }
      
      const offers = await storage.getLeadPropertyOffers({ leadId });
      
      // Enrich with property details
      const enrichedOffers = await Promise.all(
        offers.map(async (offer) => {
          const property = await storage.getProperty(offer.propertyId);
          const offeredBy = await storage.getUser(offer.offeredById);
          return {
            ...offer,
            property,
            offeredBy: offeredBy ? { 
              id: offeredBy.id, 
              firstName: offeredBy.firstName, 
              lastName: offeredBy.lastName 
            } : null
          };
        })
      );
      
      res.json(enrichedOffers);
    } catch (error) {
      console.error("Error fetching offered properties:", error);
      res.status(500).json({ message: "Error al obtener propiedades ofrecidas" });
    }
  });

  // Owner Referral routes
  
  // POST /api/owner-referrals - Create new owner referral (sellers only)
  app.post("/api/owner-referrals", isAuthenticated, requireRole(["seller"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      const referralData = {
        ...req.body,
        referrerId: userId,
        commissionPercent: req.body.commissionPercent || "20.00",
      };
      
      // Generate verification token
      const verificationToken = crypto.randomUUID();
      const verificationTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const ownerReferral = await storage.createOwnerReferral({
        ...referralData,
        verificationToken,
        verificationTokenExpiry,
      });
      
      // Send verification email to owner
      const verificationLink = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/verify-owner-referral/${verificationToken}`;
      const sellerName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      
      await sendOwnerReferralVerificationEmail(
        ownerReferral.email,
        ownerReferral.firstName,
        sellerName,
        ownerReferral.propertyAddress || 'Propiedad referida',
        verificationLink
      );
      
      await createAuditLog(req, "create", "owner_referral", ownerReferral.id, `Referido de propietario creado: ${ownerReferral.firstName} ${ownerReferral.lastName}`);
      
      res.status(201).json({ 
        message: "Referido de propietario creado. Se ha enviado un email de verificación al propietario.",
        ownerReferral 
      });
    } catch (error: any) {
      console.error("Error creating owner referral:", error);
      res.status(400).json({ message: error.message || "Error al crear referido de propietario" });
    }
  });
  
  // GET /api/owner-referrals - Get owner referrals
  app.get("/api/owner-referrals", isAuthenticated, requireRole(["seller", "master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      let referrals;
      
      if (currentUser.role === "seller") {
        // Sellers can only see their own referrals
        referrals = await storage.getOwnerReferrals({ referrerId: userId });
      } else {
        // Admins can see all referrals
        const filters: any = {};
        if (req.query.status) {
          filters.status = req.query.status;
        }
        if (req.query.referrerId) {
          filters.referrerId = req.query.referrerId;
        }
        referrals = await storage.getOwnerReferrals(filters);
      }
      
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching owner referrals:", error);
      res.status(500).json({ message: "Error al obtener referidos de propietarios" });
    }
  });
  
  // GET /api/owner-referrals/:id - Get specific owner referral
  app.get("/api/owner-referrals/:id", isAuthenticated, requireRole(["seller", "master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      const referral = await storage.getOwnerReferral(id);
      
      if (!referral) {
        return res.status(404).json({ message: "Referido no encontrado" });
      }
      
      // Sellers can only see their own referrals
      if (currentUser.role === "seller" && referral.referrerId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para ver este referido" });
      }
      
      res.json(referral);
    } catch (error) {
      console.error("Error fetching owner referral:", error);
      res.status(500).json({ message: "Error al obtener referido de propietario" });
    }
  });
  
  // PATCH /api/owner-referrals/:id/approve - Approve owner referral (admin only)
  app.patch("/api/owner-referrals/:id/approve", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      let { commissionAmount } = req.body;
      const userId = req.user.claims.sub;
      
      const referral = await storage.getOwnerReferral(id);
      
      if (!referral) {
        return res.status(404).json({ message: "Referido no encontrado" });
      }
      
      if (!referral.emailVerified) {
        return res.status(400).json({ message: "El email del propietario debe ser verificado antes de aprobar" });
      }
      
      // Calculate default 20% commission if not provided
      if (!commissionAmount && referral.estimatedValue) {
        const estimatedValue = parseFloat(referral.estimatedValue);
        if (!isNaN(estimatedValue)) {
          commissionAmount = (estimatedValue * 0.20).toFixed(2);
        }
      }
      
      const updatedReferral = await storage.approveOwnerReferralByAdmin(id, userId, commissionAmount);
      
      // Send notification to seller
      const seller = await storage.getUser(referral.referrerId);
      if (seller && seller.email) {
        await sendOwnerReferralApprovedNotification(
          seller.email,
          `${seller.firstName || ''} ${seller.lastName || ''}`.trim(),
          `${referral.firstName} ${referral.lastName}`,
          referral.propertyAddress || 'Propiedad referida',
          commissionAmount || updatedReferral.commissionAmount || '0.00'
        );
      }
      
      await createAuditLog(req, "update", "owner_referral", id, `Referido de propietario aprobado con comisión de $${commissionAmount || updatedReferral.commissionAmount}`);
      
      res.json({ 
        message: "Referido aprobado exitosamente. Se ha notificado al vendedor.",
        ownerReferral: updatedReferral 
      });
    } catch (error: any) {
      console.error("Error approving owner referral:", error);
      res.status(400).json({ message: error.message || "Error al aprobar referido" });
    }
  });
  
  // PATCH /api/owner-referrals/:id/reject - Reject owner referral (admin only)
  app.patch("/api/owner-referrals/:id/reject", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const userId = req.user.claims.sub;
      
      if (!rejectionReason) {
        return res.status(400).json({ message: "Se requiere una razón de rechazo" });
      }
      
      const referral = await storage.getOwnerReferral(id);
      
      if (!referral) {
        return res.status(404).json({ message: "Referido no encontrado" });
      }
      
      const updatedReferral = await storage.rejectOwnerReferralByAdmin(id, userId, rejectionReason);
      
      await createAuditLog(req, "update", "owner_referral", id, `Referido de propietario rechazado: ${rejectionReason}`);
      
      res.json({ 
        message: "Referido rechazado exitosamente",
        ownerReferral: updatedReferral 
      });
    } catch (error: any) {
      console.error("Error rejecting owner referral:", error);
      res.status(400).json({ message: error.message || "Error al rechazar referido" });
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
    let googleEventId: string | null = null;
    
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
      
      if (appointmentData.type === "video") {
        const property = await storage.getProperty(appointmentData.propertyId);
        const appointmentDate = new Date(appointmentData.date);
        const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // 1 hour later

        try {
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
        } catch (meetError) {
          console.error("Error creating Google Meet event:", meetError);
          // Continue without meet link if event creation fails
        }
      }

      try {
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
      } catch (dbError) {
        // Rollback: Delete Google Meet event if appointment creation fails
        if (googleEventId) {
          try {
            await deleteGoogleMeetEvent(googleEventId);
            console.log(`Rolled back Google Meet event ${googleEventId} due to appointment creation failure`);
          } catch (rollbackError) {
            console.error("Error rolling back Google Meet event:", rollbackError);
          }
        }
        throw dbError;
      }
    } catch (error: any) {
      return handleGenericError(res, error, "al crear la cita");
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

  // Calendar Events routes
  app.get("/api/calendar-events", isAuthenticated, async (req, res) => {
    try {
      const { eventType, assignedToId, status, propertyId, startDate, endDate } = req.query;
      const filters: any = {};
      if (eventType) filters.eventType = eventType;
      if (assignedToId) filters.assignedToId = assignedToId;
      if (status) filters.status = status;
      if (propertyId) filters.propertyId = propertyId;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const events = await storage.getCalendarEvents(filters);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar-events", isAuthenticated, requireRole(["master", "admin", "admin_jr", "management"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Include createdById before validation
      const eventData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        createdById: userId,
      };

      // Validate complete event data
      const validatedData = insertCalendarEventSchema.parse(eventData);

      const event = await storage.createCalendarEvent(validatedData);

      await createAuditLog(
        req,
        "create",
        "calendar_event",
        event.id,
        `Evento de calendario creado: ${event.title} - ${event.eventType}`
      );

      res.status(201).json(event);
    } catch (error: any) {
      console.error("Error creating calendar event:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(400).json({ message: error.message || "Failed to create calendar event" });
    }
  });

  app.patch("/api/calendar-events/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr", "management"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Validate and coerce dates if present
      const updates = { ...req.body };
      if (updates.startDate) {
        updates.startDate = new Date(updates.startDate);
      }
      if (updates.endDate) {
        updates.endDate = new Date(updates.endDate);
      }

      // Use partial validation
      const validatedData = insertCalendarEventSchema.partial().parse(updates);
      
      const event = await storage.updateCalendarEvent(id, validatedData);

      await createAuditLog(
        req,
        "update",
        "calendar_event",
        id,
        `Evento de calendario actualizado: ${event.title} - Estado: ${event.status}`
      );

      res.json(event);
    } catch (error: any) {
      console.error("Error updating calendar event:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete("/api/calendar-events/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr", "management"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getCalendarEvent(id);

      if (event) {
        await createAuditLog(
          req,
          "delete",
          "calendar_event",
          id,
          `Evento de calendario eliminado: ${event.title}`
        );
      }

      await storage.deleteCalendarEvent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Review routes
  // Property Reviews
  app.get("/api/reviews/properties", async (req, res) => {
    try {
      const { propertyId, clientId } = req.query;
      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (clientId) filters.clientId = clientId;
      const reviews = await storage.getPropertyReviews(filters);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching property reviews:", error);
      res.status(500).json({ message: "Failed to fetch property reviews" });
    }
  });

  app.post("/api/reviews/properties", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Security: Remove clientId from body to prevent impersonation
      const { clientId: _, ...bodyWithoutClientId } = req.body;
      
      // Enforce authenticated user as the reviewer
      const reviewData = {
        ...bodyWithoutClientId,
        clientId: userId,
      };
      
      const review = await storage.createPropertyReview(reviewData);
      
      await createAuditLog(
        req,
        "create",
        "property_review",
        review.id,
        `Review creado para propiedad ${review.propertyId} - Rating: ${review.rating}`
      );
      
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating property review:", error);
      res.status(400).json({ message: error.message || "Failed to create property review" });
    }
  });

  // Appointment Reviews
  app.get("/api/reviews/appointments", isAuthenticated, async (req, res) => {
    try {
      const { appointmentId, clientId } = req.query;
      const filters: any = {};
      if (appointmentId) filters.appointmentId = appointmentId;
      if (clientId) filters.clientId = clientId;
      const reviews = await storage.getAppointmentReviews(filters);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching appointment reviews:", error);
      res.status(500).json({ message: "Failed to fetch appointment reviews" });
    }
  });

  app.post("/api/reviews/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Security: Remove clientId from body to prevent impersonation
      const { clientId: _, ...bodyWithoutClientId } = req.body;
      
      // Optional: Verify user attended the appointment
      if (req.body.appointmentId) {
        const appointment = await storage.getAppointment(req.body.appointmentId);
        if (!appointment || appointment.clientId !== userId) {
          return res.status(403).json({ 
            message: "Solo puedes dejar reviews de citas a las que asististe" 
          });
        }
      }
      
      // Enforce authenticated user as the reviewer
      const reviewData = {
        ...bodyWithoutClientId,
        clientId: userId,
      };
      
      const review = await storage.createAppointmentReview(reviewData);
      
      await createAuditLog(
        req,
        "create",
        "appointment_review",
        review.id,
        `Review creado para cita ${review.appointmentId} - Rating: ${review.rating}`
      );
      
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating appointment review:", error);
      res.status(400).json({ message: error.message || "Failed to create appointment review" });
    }
  });

  // Concierge Reviews (from clients)
  app.get("/api/reviews/concierges", async (req, res) => {
    try {
      const { conciergeId, clientId } = req.query;
      const filters: any = {};
      if (conciergeId) filters.conciergeId = conciergeId;
      if (clientId) filters.clientId = clientId;
      const reviews = await storage.getConciergeReviews(filters);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching concierge reviews:", error);
      res.status(500).json({ message: "Failed to fetch concierge reviews" });
    }
  });

  app.post("/api/reviews/concierges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Security: Remove clientId from body to prevent impersonation
      const { clientId: _, ...bodyWithoutClientId } = req.body;
      
      // Enforce authenticated user as the reviewer
      const reviewData = {
        ...bodyWithoutClientId,
        clientId: userId,
      };
      
      const review = await storage.createConciergeReview(reviewData);
      
      await createAuditLog(
        req,
        "create",
        "concierge_review",
        review.id,
        `Review creado para conserje ${review.conciergeId} - Rating: ${review.rating}`
      );
      
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating concierge review:", error);
      res.status(400).json({ message: error.message || "Failed to create concierge review" });
    }
  });

  // Client Reviews (from concierges)
  app.get("/api/reviews/clients", isAuthenticated, async (req: any, res) => {
    try {
      const { clientId, conciergeId } = req.query;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Only concierges can view client reviews
      if (user?.role !== "concierge" && !["admin", "master", "admin_jr"].includes(user?.role as string)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const filters: any = {};
      if (clientId) filters.clientId = clientId;
      if (conciergeId) filters.conciergeId = conciergeId;
      const reviews = await storage.getClientReviews(filters);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching client reviews:", error);
      res.status(500).json({ message: "Failed to fetch client reviews" });
    }
  });

  app.post("/api/reviews/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Security: Only concierges can create client reviews
      if (user?.role !== "concierge") {
        return res.status(403).json({ message: "Solo los conserjes pueden dejar reviews de clientes" });
      }
      
      // Security: Remove conciergeId from body to prevent impersonation
      const { conciergeId: _, ...bodyWithoutConciergeId } = req.body;
      
      // Enforce authenticated concierge as the reviewer
      const reviewData = {
        ...bodyWithoutConciergeId,
        conciergeId: userId,
      };
      
      const review = await storage.createClientReview(reviewData);
      
      await createAuditLog(
        req,
        "create",
        "client_review",
        review.id,
        `Review creado para cliente ${review.clientId} - Rating: ${review.rating}`
      );
      
      res.status(201).json(review);
    } catch (error: any) {
      console.error("Error creating client review:", error);
      res.status(400).json({ message: error.message || "Failed to create client review" });
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
      const clientId = req.body.clientId || userId;

      // Check if user already has 3 cards
      const existingCards = await db
        .select()
        .from(presentationCards)
        .where(eq(presentationCards.clientId, clientId));

      if (existingCards.length >= 3) {
        return res.status(400).json({ 
          message: "Has alcanzado el límite de 3 tarjetas de presentación. Elimina una existente para crear una nueva." 
        });
      }

      const cardData = insertPresentationCardSchema.parse({
        ...req.body,
        clientId,
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
      const { id} = req.params;
      await storage.deletePresentationCard(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting presentation card:", error);
      res.status(500).json({ message: "Failed to delete presentation card" });
    }
  });

  // Activate/deactivate presentation card
  app.patch("/api/presentation-cards/:id/toggle-active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      // First, find the card and check its current state
      const existingCard = await db.query.presentationCards.findFirst({
        where: and(
          eq(presentationCards.id, id),
          eq(presentationCards.clientId, userId)
        )
      });

      if (!existingCard) {
        return res.status(404).json({ message: "Presentation card not found" });
      }

      // If activating, deactivate all other cards first
      if (!existingCard.isActive) {
        await db.update(presentationCards)
          .set({ isActive: false })
          .where(eq(presentationCards.clientId, userId));
      }

      // Toggle the card's active state
      const card = await db.update(presentationCards)
        .set({ isActive: !existingCard.isActive })
        .where(and(
          eq(presentationCards.id, id),
          eq(presentationCards.clientId, userId)
        ))
        .returning();

      res.json(card[0]);
    } catch (error) {
      console.error("Error toggling presentation card:", error);
      res.status(500).json({ message: "Failed to toggle presentation card" });
    }
  });

  // Property Recommendations routes (seller to client)
  app.post("/api/property-recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const sellerId = req.user.claims.sub;
      const { propertyId, clientId, presentationCardId, message } = req.body;

      const recommendation = await db.insert(propertyRecommendations)
        .values({
          propertyId,
          clientId,
          sellerId,
          presentationCardId: presentationCardId || null,
          message: message || null,
        })
        .returning();

      res.status(201).json(recommendation[0]);
    } catch (error) {
      console.error("Error creating recommendation:", error);
      res.status(500).json({ message: "Failed to create recommendation" });
    }
  });

  app.get("/api/my-property-recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const recommendations = await db
        .select({
          id: propertyRecommendations.id,
          propertyId: propertyRecommendations.propertyId,
          sellerId: propertyRecommendations.sellerId,
          presentationCardId: propertyRecommendations.presentationCardId,
          message: propertyRecommendations.message,
          isRead: propertyRecommendations.isRead,
          isInterested: propertyRecommendations.isInterested,
          createdAt: propertyRecommendations.createdAt,
        })
        .from(propertyRecommendations)
        .where(eq(propertyRecommendations.clientId, userId))
        .orderBy(desc(propertyRecommendations.createdAt));

      // Enrich with property and seller data
      const enriched = await Promise.all(
        recommendations.map(async (rec) => {
          const property = await db.select().from(properties).where(eq(properties.id, rec.propertyId)).limit(1);
          const seller = await db.select().from(users).where(eq(users.id, rec.sellerId)).limit(1);
          return {
            ...rec,
            property: property[0] || null,
            seller: seller[0] ? { 
              id: seller[0].id, 
              firstName: seller[0].firstName, 
              lastName: seller[0].lastName,
              profileImageUrl: seller[0].profileImageUrl
            } : null,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.patch("/api/property-recommendations/:id/mark-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const recommendation = await db.update(propertyRecommendations)
        .set({ isRead: true })
        .where(and(
          eq(propertyRecommendations.id, id),
          eq(propertyRecommendations.clientId, userId)
        ))
        .returning();

      if (!recommendation[0]) {
        return res.status(404).json({ message: "Recommendation not found" });
      }

      res.json(recommendation[0]);
    } catch (error) {
      console.error("Error marking recommendation as read:", error);
      res.status(500).json({ message: "Failed to mark recommendation as read" });
    }
  });

  app.patch("/api/property-recommendations/:id/set-interest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { isInterested } = req.body;

      const recommendation = await db.update(propertyRecommendations)
        .set({ isInterested, isRead: true })
        .where(and(
          eq(propertyRecommendations.id, id),
          eq(propertyRecommendations.clientId, userId)
        ))
        .returning();

      if (!recommendation[0]) {
        return res.status(404).json({ message: "Recommendation not found" });
      }

      res.json(recommendation[0]);
    } catch (error) {
      console.error("Error setting interest:", error);
      res.status(500).json({ message: "Failed to set interest" });
    }
  });

  // Auto Suggestions routes
  app.get("/api/my-auto-suggestions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      const suggestions = await db
        .select({
          id: autoSuggestions.id,
          propertyId: autoSuggestions.propertyId,
          presentationCardId: autoSuggestions.presentationCardId,
          matchScore: autoSuggestions.matchScore,
          matchReasons: autoSuggestions.matchReasons,
          isRead: autoSuggestions.isRead,
          isInterested: autoSuggestions.isInterested,
          createdAt: autoSuggestions.createdAt,
        })
        .from(autoSuggestions)
        .where(eq(autoSuggestions.clientId, userId))
        .orderBy(desc(autoSuggestions.matchScore), desc(autoSuggestions.createdAt));

      // Enrich with property data
      const enriched = await Promise.all(
        suggestions.map(async (sug) => {
          const property = await db.select().from(properties).where(eq(properties.id, sug.propertyId)).limit(1);
          return {
            ...sug,
            property: property[0] || null,
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error fetching auto suggestions:", error);
      res.status(500).json({ message: "Failed to fetch auto suggestions" });
    }
  });

  app.patch("/api/auto-suggestions/:id/mark-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const suggestion = await db.update(autoSuggestions)
        .set({ isRead: true })
        .where(and(
          eq(autoSuggestions.id, id),
          eq(autoSuggestions.clientId, userId)
        ))
        .returning();

      if (!suggestion[0]) {
        return res.status(404).json({ message: "Suggestion not found" });
      }

      res.json(suggestion[0]);
    } catch (error) {
      console.error("Error marking suggestion as read:", error);
      res.status(500).json({ message: "Failed to mark suggestion as read" });
    }
  });

  app.patch("/api/auto-suggestions/:id/set-interest", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { isInterested } = req.body;

      const suggestion = await db.update(autoSuggestions)
        .set({ isInterested, isRead: true })
        .where(and(
          eq(autoSuggestions.id, id),
          eq(autoSuggestions.clientId, userId)
        ))
        .returning();

      if (!suggestion[0]) {
        return res.status(404).json({ message: "Suggestion not found" });
      }

      res.json(suggestion[0]);
    } catch (error) {
      console.error("Error setting interest:", error);
      res.status(500).json({ message: "Failed to set interest" });
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

  // Service Booking routes
  app.get("/api/service-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { clientId, providerId, status } = req.query;
      
      const filters: any = {};
      
      if (clientId) {
        filters.clientId = clientId;
      } else if (user?.role !== "master" && user?.role !== "admin") {
        filters.clientId = userId;
      }
      
      if (providerId) filters.providerId = providerId;
      if (status) filters.status = status;

      const bookings = await storage.getServiceBookings(filters);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching service bookings:", error);
      res.status(500).json({ message: "Failed to fetch service bookings" });
    }
  });

  app.post("/api/service-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookingData = insertServiceBookingSchema.parse({
        ...req.body,
        clientId: userId,
      });
      
      const booking = await storage.createServiceBooking(bookingData);
      
      await createAuditLog(req, "create", "service_booking", booking.id, 
        `Created service booking for service ${booking.serviceId}`);
      
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Error creating service booking:", error);
      res.status(400).json({ message: error.message || "Failed to create service booking" });
    }
  });

  app.patch("/api/service-bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.updateServiceBooking(id, req.body);
      res.json(booking);
    } catch (error) {
      console.error("Error updating service booking:", error);
      res.status(500).json({ message: "Failed to update service booking" });
    }
  });

  app.delete("/api/service-bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteServiceBooking(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service booking:", error);
      res.status(500).json({ message: "Failed to delete service booking" });
    }
  });

  // Provider Application routes
  app.post("/api/provider-applications", async (req, res) => {
    try {
      const applicationData = insertProviderApplicationSchema.parse({
        ...req.body,
        status: "pending",
      });
      
      const application = await storage.createProviderApplication(applicationData);
      res.status(201).json(application);
    } catch (error: any) {
      console.error("Error creating provider application:", error);
      res.status(400).json({ message: error.message || "Failed to create provider application" });
    }
  });

  app.get("/api/provider-applications", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const filters: any = {};
      if (status && typeof status === "string") {
        filters.status = status;
      }
      
      const applications = await storage.getProviderApplications(filters);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching provider applications:", error);
      res.status(500).json({ message: "Failed to fetch provider applications" });
    }
  });

  app.get("/api/provider-applications/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const application = await storage.getProviderApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: "Provider application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error fetching provider application:", error);
      res.status(500).json({ message: "Failed to fetch provider application" });
    }
  });

  app.patch("/api/provider-applications/:id/status", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const adminId = req.user.id;
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      
      const application = await storage.updateProviderApplicationStatus(id, status, adminId, notes);
      
      // Log the action
      await createAuditLog(
        req,
        "update",
        "provider_application",
        id,
        `Provider application ${status} - ${application.fullName}`
      );
      
      res.json(application);
    } catch (error: any) {
      console.error("Error updating provider application status:", error);
      res.status(500).json({ message: error.message || "Failed to update provider application status" });
    }
  });

  // Referral Configuration routes
  app.get("/api/referrals/config", isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getReferralConfig();
      res.json(config || { clientReferralCommissionPercent: "5.00", ownerReferralCommissionPercent: "10.00" });
    } catch (error) {
      console.error("Error fetching referral config:", error);
      res.status(500).json({ message: "Failed to fetch referral configuration" });
    }
  });

  app.patch("/api/referrals/config", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { clientReferralCommissionPercent, ownerReferralCommissionPercent } = req.body;

      const config = await storage.updateReferralConfig({
        clientReferralCommissionPercent,
        ownerReferralCommissionPercent,
      }, userId);

      await createAuditLog(
        req,
        "update",
        "referral_config",
        config.id,
        `Configuración de comisiones actualizada - Clientes: ${config.clientReferralCommissionPercent}%, Propietarios: ${config.ownerReferralCommissionPercent}%`
      );

      res.json(config);
    } catch (error: any) {
      console.error("Error updating referral config:", error);
      res.status(500).json({ message: error.message || "Failed to update referral configuration" });
    }
  });

  // Client Referral routes
  app.get("/api/referrals/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }
      
      let filters: any = {};
      
      if (["master", "admin", "admin_jr"].includes(user.role)) {
        if (req.query.referrerId) {
          filters.referrerId = req.query.referrerId;
        }
        if (req.query.status) {
          filters.status = req.query.status;
        }
      } else if (user.role === "seller") {
        filters.sellerView = userId;
        if (req.query.status) {
          filters.status = req.query.status;
        }
      } else {
        filters.referrerId = userId;
        if (req.query.status) {
          filters.status = req.query.status;
        }
      }

      const referrals = await storage.getClientReferrals(filters);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching client referrals:", error);
      res.status(500).json({ message: "Failed to fetch client referrals" });
    }
  });

  app.post("/api/referrals/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get current commission config
      const config = await storage.getReferralConfig();
      const commissionPercent = config?.clientReferralCommissionPercent || "5.00";

      const referralData = {
        ...req.body,
        referrerId: userId,
        commissionPercent,
        status: "pendiente_confirmacion",
      };

      const referral = await storage.createClientReferral(referralData);

      await createAuditLog(
        req,
        "create",
        "client_referral",
        referral.id,
        `Referido de cliente creado: ${referral.firstName} ${referral.lastName}`
      );

      res.status(201).json(referral);
    } catch (error: any) {
      console.error("Error creating client referral:", error);
      res.status(400).json({ message: error.message || "Failed to create client referral" });
    }
  });

  app.patch("/api/referrals/clients/:id", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const referral = await storage.updateClientReferral(id, req.body);

      await createAuditLog(
        req,
        "update",
        "client_referral",
        id,
        `Referido de cliente actualizado - Estado: ${referral.status}`
      );

      res.json(referral);
    } catch (error: any) {
      console.error("Error updating client referral:", error);
      res.status(500).json({ message: error.message || "Failed to update client referral" });
    }
  });

  // Owner Referral routes
  app.get("/api/referrals/owners", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }
      
      let filters: any = {};
      
      if (["master", "admin", "admin_jr"].includes(user.role)) {
        if (req.query.referrerId) {
          filters.referrerId = req.query.referrerId;
        }
        if (req.query.status) {
          filters.status = req.query.status;
        }
      } else if (user.role === "seller") {
        filters.sellerView = userId;
        if (req.query.status) {
          filters.status = req.query.status;
        }
      } else {
        filters.referrerId = userId;
        if (req.query.status) {
          filters.status = req.query.status;
        }
      }

      const referrals = await storage.getOwnerReferrals(filters);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching owner referrals:", error);
      res.status(500).json({ message: "Failed to fetch owner referrals" });
    }
  });

  app.post("/api/referrals/owners", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get current commission config
      const config = await storage.getReferralConfig();
      const commissionPercent = config?.ownerReferralCommissionPercent || "10.00";

      const referralData = {
        ...req.body,
        referrerId: userId,
        commissionPercent,
        status: "pendiente_confirmacion",
      };

      const referral = await storage.createOwnerReferral(referralData);

      await createAuditLog(
        req,
        "create",
        "owner_referral",
        referral.id,
        `Referido de propietario creado: ${referral.firstName} ${referral.lastName}`
      );

      res.status(201).json(referral);
    } catch (error: any) {
      console.error("Error creating owner referral:", error);
      res.status(400).json({ message: error.message || "Failed to create owner referral" });
    }
  });

  app.patch("/api/referrals/owners/:id", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const referral = await storage.updateOwnerReferral(id, req.body);

      await createAuditLog(
        req,
        "update",
        "owner_referral",
        id,
        `Referido de propietario actualizado - Estado: ${referral.status}`
      );

      res.json(referral);
    } catch (error: any) {
      console.error("Error updating owner referral:", error);
      res.status(500).json({ message: error.message || "Failed to update owner referral" });
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
  app.get("/api/rental-applications/eligible-applicants", isAuthenticated, async (req, res) => {
    try {
      const { propertyId } = req.query;
      
      if (!propertyId) {
        return res.status(400).json({ message: "propertyId is required" });
      }

      const completedAppointments = await storage.getAppointments({
        propertyId: propertyId as string,
        status: "completed",
      });

      const clientIds = [...new Set(completedAppointments.map(apt => apt.clientId))];
      
      const eligibleUsers = await Promise.all(
        clientIds.map(clientId => storage.getUser(clientId))
      );

      const validUsers = eligibleUsers.filter(user => user !== undefined);

      res.json(validUsers);
    } catch (error) {
      console.error("Error fetching eligible applicants:", error);
      res.status(500).json({ message: "Failed to fetch eligible applicants" });
    }
  });

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

  // Rental Contract routes
  app.get("/api/rental-contracts", isAuthenticated, async (req, res) => {
    try {
      const { status, propertyId, tenantId, sellerId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (propertyId) filters.propertyId = propertyId;
      if (tenantId) filters.tenantId = tenantId;
      if (sellerId) filters.sellerId = sellerId;

      const contracts = await storage.getRentalContracts(filters);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching rental contracts:", error);
      res.status(500).json({ message: "Failed to fetch rental contracts" });
    }
  });

  app.get("/api/rental-contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const contract = await storage.getRentalContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Rental contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error fetching rental contract:", error);
      res.status(500).json({ message: "Failed to fetch rental contract" });
    }
  });

  app.post("/api/rental-contracts/calculate-commission", isAuthenticated, async (req, res) => {
    try {
      const { monthlyRent, leaseDurationMonths, propertyId } = req.body;
      
      if (!monthlyRent || !leaseDurationMonths) {
        return res.status(400).json({ message: "monthlyRent and leaseDurationMonths are required" });
      }

      let hasReferral = false;
      let referralPercent = 20;

      if (propertyId) {
        const property = await storage.getProperty(propertyId);
        if (property?.referralPartnerId) {
          hasReferral = true;
          referralPercent = parseFloat(property.referralPercent || "20");
        }
      }

      const commissions = calculateRentalCommissions({
        monthlyRent: parseFloat(monthlyRent),
        leaseDurationMonths: parseInt(leaseDurationMonths),
        hasReferral,
        referralPercent,
      });

      res.json(commissions);
    } catch (error) {
      console.error("Error calculating commission:", error);
      res.status(500).json({ message: "Failed to calculate commission" });
    }
  });

  app.post("/api/rental-contracts", isAuthenticated, async (req: any, res) => {
    try {
      const { propertyId, monthlyRent, leaseDurationMonths, ...otherData } = req.body;

      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const hasReferral = !!property.referralPartnerId;
      const referralPercent = parseFloat(property.referralPercent || "20");

      const commissions = calculateRentalCommissions({
        monthlyRent: parseFloat(monthlyRent),
        leaseDurationMonths: parseInt(leaseDurationMonths),
        hasReferral,
        referralPercent,
      });

      const contractData = insertRentalContractSchema.parse({
        ...otherData,
        propertyId,
        monthlyRent: monthlyRent.toString(),
        leaseDurationMonths: parseInt(leaseDurationMonths),
        totalCommissionMonths: commissions.totalCommissionMonths.toString(),
        totalCommissionAmount: commissions.totalCommissionAmount.toString(),
        sellerCommissionPercent: commissions.sellerCommissionPercent.toString(),
        referralCommissionPercent: commissions.referralCommissionPercent.toString(),
        homesappCommissionPercent: commissions.homesappCommissionPercent.toString(),
        sellerCommissionAmount: commissions.sellerCommissionAmount.toString(),
        referralCommissionAmount: commissions.referralCommissionAmount.toString(),
        homesappCommissionAmount: commissions.homesappCommissionAmount.toString(),
        referralPartnerId: property.referralPartnerId || null,
      });

      const contract = await storage.createRentalContract(contractData);

      await createAuditLog(
        req,
        "create",
        "rental_contract",
        contract.id,
        `Contrato de renta creado - Estado: ${contract.status}, Renta: $${monthlyRent}`
      );

      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating rental contract:", error);
      res.status(400).json({ message: error.message || "Failed to create rental contract" });
    }
  });

  app.patch("/api/rental-contracts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const contract = await storage.updateRentalContract(id, req.body);

      await createAuditLog(
        req,
        "update",
        "rental_contract",
        id,
        `Contrato de renta actualizado - Estado: ${contract.status}`
      );

      res.json(contract);
    } catch (error) {
      console.error("Error updating rental contract:", error);
      res.status(500).json({ message: "Failed to update rental contract" });
    }
  });

  app.patch("/api/rental-contracts/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const additionalData: any = {};
      const now = new Date();

      if (status === "apartado") {
        additionalData.apartadoDate = now;
      } else if (status === "firmado") {
        additionalData.contractSignedDate = now;
      } else if (status === "check_in") {
        additionalData.checkInDate = now;
        additionalData.payoutReleasedAt = now;
      }

      const contract = await storage.updateRentalContractStatus(id, status, additionalData);

      await createAuditLog(
        req,
        "update",
        "rental_contract",
        id,
        `Estado de contrato cambiado a: ${status}`
      );

      res.json(contract);
    } catch (error) {
      console.error("Error updating rental contract status:", error);
      res.status(500).json({ message: "Failed to update rental contract status" });
    }
  });

  app.delete("/api/rental-contracts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !["master", "admin", "admin_jr"].includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const contract = await storage.getRentalContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Rental contract not found" });
      }

      await createAuditLog(
        req,
        "delete",
        "rental_contract",
        id,
        `Contrato de renta eliminado - Estado: ${contract.status}`
      );

      await storage.deleteRentalContract(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting rental contract:", error);
      res.status(500).json({ message: "Failed to delete rental contract" });
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
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const conversationData = insertChatConversationSchema.parse(req.body);
      
      // Get and validate participants from request
      const participantUserIds = req.body.participants?.map((p: { userId: string }) => p.userId) || [];
      
      if (participantUserIds.length === 0) {
        return res.status(400).json({ message: "Conversations must have participants" });
      }
      
      // Fetch all participants to verify their roles
      const participantUsers = await Promise.all(
        participantUserIds.map((uid: string) => storage.getUser(uid))
      );
      
      const validParticipants = participantUsers.filter(u => u !== null);
      
      if (validParticipants.length !== participantUserIds.length) {
        return res.status(400).json({ message: "One or more participants not found" });
      }
      
      // Chat restriction 0: Sellers can only chat with leads whose email is verified
      if (conversationData.type === "lead") {
        const sellerParticipants = validParticipants.filter(p => p!.role === "seller");
        
        if (sellerParticipants.length > 0 && conversationData.leadId) {
          // Verify the lead's email is verified
          const lead = await storage.getLead(conversationData.leadId);
          if (!lead) {
            return res.status(404).json({ message: "Lead no encontrado" });
          }
          
          if (!lead.emailVerified) {
            return res.status(403).json({ 
              message: "No puedes chatear con este lead hasta que verifique su correo electrónico" 
            });
          }
        }
      }

      // Chat restriction 1: Owners can only chat with clients after rental completion
      if (conversationData.type === "rental") {
        const ownerParticipants = validParticipants.filter(p => p!.role === "owner");
        const clientParticipants = validParticipants.filter(p => p!.role === "cliente");
        
        // If both owner and client are participants, verify active rental
        if (ownerParticipants.length > 0 && clientParticipants.length > 0) {
          // Rental conversations must have a propertyId
          if (!conversationData.propertyId) {
            return res.status(400).json({ 
              message: "Rental conversations require a property ID" 
            });
          }
          
          // Get the property to find its owner
          const property = await storage.getProperty(conversationData.propertyId);
          if (!property) {
            return res.status(404).json({ message: "Property not found" });
          }
          
          // Verify one of the owner participants is the property owner
          const isPropertyOwnerInConversation = ownerParticipants.some(p => p!.id === property.ownerId);
          if (!isPropertyOwnerInConversation) {
            return res.status(403).json({ 
              message: "Rental conversations must include the property owner" 
            });
          }
          
          // Check if there's an active rental application between the property owner and any client
          const rentalApps = await storage.getRentalApplications({ propertyId: conversationData.propertyId });
          const clientIds = clientParticipants.map(p => p!.id);
          const hasActiveRental = rentalApps.some(
            app => clientIds.includes(app.clientId) && app.status === "activo"
          );
          
          if (!hasActiveRental) {
            return res.status(403).json({ 
              message: "Los propietarios solo pueden chatear con clientes después de completar el proceso de renta" 
            });
          }
        }
      }
      
      // Chat restriction 2: Appointment conversations require concierge involvement
      if (conversationData.type === "appointment") {
        const ownerParticipants = validParticipants.filter(p => p!.role === "owner");
        const clientParticipants = validParticipants.filter(p => p!.role === "cliente");
        const conciergeParticipants = validParticipants.filter(p => p!.role === "concierge");
        
        // If both owner and client are participants, ensure a concierge is also present
        if (ownerParticipants.length > 0 && clientParticipants.length > 0) {
          if (conciergeParticipants.length === 0) {
            return res.status(403).json({ 
              message: "Las conversaciones de citas entre propietarios y clientes requieren la participación de un conserje" 
            });
          }
        }
      }
      
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
      const sanitizedBody = {
        ...req.body,
        content: sanitizeText(req.body.content),
      };
      const messageData = insertChatMessageSchema.parse(sanitizedBody);
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

  app.patch("/api/chat/conversations/:id/mark-read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const conversation = await storage.getChatConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const updated = await storage.markConversationAsRead(id, userId);
      if (!updated) {
        return res.status(403).json({ message: "You are not a participant in this conversation" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      res.status(500).json({ message: "Failed to mark conversation as read" });
    }
  });

  // Chatbot routes
  app.post("/api/chat/chatbot/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get chatbot config
      const config = await storage.getChatbotConfig();
      
      if (!config) {
        return res.status(500).json({ message: "Chatbot configuration not found" });
      }

      // Check if chatbot is active
      if (!config.isActive) {
        return res.status(503).json({ message: "El asistente virtual no está disponible en este momento" });
      }

      // Create chatbot conversation
      const conversation = await storage.createChatConversation({
        type: "appointment",
        title: `Chat con ${config.name || 'Asistente Virtual'} - ${user.firstName || user.email}`,
        createdById: userId,
        isBot: true,
      });

      // Add user as participant
      await storage.addChatParticipant({
        conversationId: conversation.id,
        userId: userId,
      });

      // Send welcome message
      const welcomeMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        senderId: userId,
        message: config.welcomeMessage,
        isBot: true,
      });

      res.status(201).json({
        ...conversation,
        welcomeMessage
      });
    } catch (error: any) {
      console.error("Error starting chatbot conversation:", error);
      res.status(500).json({ message: error.message || "Failed to start chatbot conversation" });
    }
  });

  app.post("/api/chat/chatbot/message", chatbotLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId, message } = req.body;

      if (!conversationId || !message) {
        return res.status(400).json({ message: "Missing conversationId or message" });
      }

      // Get user info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get chatbot config
      const config = await storage.getChatbotConfig();
      if (!config) {
        return res.status(500).json({ message: "Chatbot configuration not found" });
      }

      // Check if chatbot is active
      if (!config.isActive) {
        return res.status(503).json({ message: "El asistente virtual no está disponible en este momento" });
      }

      // Get user's presentation cards
      const presentationCardsData = await storage.getPresentationCards(userId);

      // Get available properties
      const allProperties = await storage.getProperties({ active: true });

      // Get conversation history
      const messages = await storage.getChatMessages(conversationId);
      const conversationHistory = messages.map(msg => ({
        role: msg.isBot ? 'assistant' as const : 'user' as const,
        content: msg.message
      }));

      // Process message with chatbot
      const chatbotResponse = await processChatbotMessage(
        message,
        {
          user,
          presentationCards: presentationCardsData,
          availableProperties: allProperties,
          config
        },
        conversationHistory
      );

      // Save user message
      const userMessage = await storage.createChatMessage({
        conversationId,
        senderId: userId,
        message,
        isBot: false,
      });

      // Save chatbot response
      const botMessage = await storage.createChatMessage({
        conversationId,
        senderId: userId,
        message: chatbotResponse.message,
        isBot: true,
      });

      // If chatbot suggested properties, create auto-suggestions
      if (chatbotResponse.suggestedProperties && chatbotResponse.suggestedProperties.length > 0 && presentationCardsData.length > 0) {
        const activeCard = presentationCardsData.find(card => card.isActive);
        if (activeCard) {
          for (const property of chatbotResponse.suggestedProperties) {
            // Check if suggestion already exists
            const existingSuggestions = await db
              .select()
              .from(autoSuggestions)
              .where(
                and(
                  eq(autoSuggestions.propertyId, property.id),
                  eq(autoSuggestions.presentationCardId, activeCard.id)
                )
              );

            if (existingSuggestions.length === 0) {
              await db.insert(autoSuggestions).values({
                propertyId: property.id,
                clientId: userId,
                presentationCardId: activeCard.id,
                matchScore: 80, // Default score from chatbot
                matchReasons: ["Sugerido por asistente virtual"],
              });
            }
          }
        }
      }

      // Broadcast messages to WebSocket clients
      if (wsClients.has(conversationId)) {
        const clients = wsClients.get(conversationId)!;
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'new_message',
              conversationId,
              message: botMessage
            }));
          }
        });
      }

      res.json({
        userMessage,
        botMessage: {
          ...botMessage,
          suggestedProperties: chatbotResponse.suggestedProperties
        }
      });
    } catch (error: any) {
      console.error("Error processing chatbot message:", error);
      res.status(500).json({ message: error.message || "Failed to process chatbot message" });
    }
  });

  // Generate property recommendations using chatbot AI
  app.post("/api/chatbot/generate-recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { presentationCardId } = req.body;

      if (!presentationCardId) {
        return res.status(400).json({ message: "Missing presentationCardId" });
      }

      // Get presentation card
      const [card] = await db
        .select()
        .from(presentationCards)
        .where(eq(presentationCards.id, presentationCardId));

      if (!card) {
        return res.status(404).json({ message: "Presentation card not found" });
      }

      if (card.clientId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Get available properties
      const allProperties = await storage.getProperties({ active: true });

      // Generate recommendations using AI
      const recommendations = await generatePropertyRecommendations(card, allProperties);

      // Save recommendations to database
      for (const rec of recommendations) {
        // Check if suggestion already exists
        const existingSuggestions = await db
          .select()
          .from(autoSuggestions)
          .where(
            and(
              eq(autoSuggestions.propertyId, rec.propertyId),
              eq(autoSuggestions.presentationCardId, presentationCardId)
            )
          );

        if (existingSuggestions.length === 0) {
          await db.insert(autoSuggestions).values({
            propertyId: rec.propertyId,
            clientId: userId,
            presentationCardId,
            matchScore: rec.matchScore,
            matchReasons: rec.matchReasons,
          });
        }
      }

      res.json({ recommendations });
    } catch (error: any) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: error.message || "Failed to generate recommendations" });
    }
  });

  // Chatbot status route (public for clients)
  app.get("/api/chatbot/status", isAuthenticated, async (req: any, res) => {
    try {
      const config = await storage.getChatbotConfig();
      
      if (!config) {
        return res.status(404).json({ message: "Chatbot configuration not found" });
      }

      // Only return public status information
      res.json({
        isActive: config.isActive,
        name: config.name,
      });
    } catch (error: any) {
      console.error("Error fetching chatbot status:", error);
      res.status(500).json({ message: error.message || "Failed to fetch chatbot status" });
    }
  });

  // Chatbot Configuration routes (admin only)
  app.get("/api/chatbot/config", isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.role;
      
      // Only admin and master can access chatbot config
      if (userRole !== "admin" && userRole !== "master") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const config = await storage.getChatbotConfig();
      
      if (!config) {
        return res.status(404).json({ message: "Chatbot configuration not found" });
      }

      res.json(config);
    } catch (error: any) {
      console.error("Error fetching chatbot config:", error);
      res.status(500).json({ message: error.message || "Failed to fetch chatbot configuration" });
    }
  });

  app.put("/api/chatbot/config", isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.role;
      const userId = req.user.claims.sub;
      
      // Only admin and master can update chatbot config
      if (userRole !== "admin" && userRole !== "master") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updates = req.body;
      
      // Add updatedBy field
      updates.updatedBy = userId;

      const updatedConfig = await storage.updateChatbotConfig(updates);

      res.json(updatedConfig);
    } catch (error: any) {
      console.error("Error updating chatbot config:", error);
      res.status(500).json({ message: error.message || "Failed to update chatbot configuration" });
    }
  });

  // Feedback routes
  app.get("/api/feedback", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { type, status } = req.query;
      const filters: any = {};
      
      if (type) filters.type = type;
      if (status) filters.status = status;
      
      const feedbackList = await storage.getAllFeedback(filters);
      res.json(feedbackList);
    } catch (error: any) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.get("/api/feedback/my-feedback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.adminUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }
      
      const feedbackList = await storage.getAllFeedback({ userId });
      res.json(feedbackList);
    } catch (error: any) {
      console.error("Error fetching user feedback:", error);
      res.status(500).json({ message: "Failed to fetch user feedback" });
    }
  });

  app.post("/api/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.adminUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const sanitizedBody = {
        ...req.body,
        title: sanitizeText(req.body.title),
        description: sanitizeHtml(req.body.description),
      };

      const validationResult = insertFeedbackSchema.safeParse(sanitizedBody);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos inválidos",
          errors: validationResult.error.errors,
        });
      }

      const newFeedback = await storage.createFeedback({
        ...validationResult.data,
        userId,
      });

      await createAuditLog(
        req,
        "create",
        "feedback",
        newFeedback.id,
        `Feedback creado: ${newFeedback.type} - ${newFeedback.title}`
      );

      res.status(201).json(newFeedback);
    } catch (error: any) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.patch("/api/feedback/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      const validationResult = updateFeedbackSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos inválidos",
          errors: validationResult.error.errors,
        });
      }

      const updatedFeedback = await storage.updateFeedback(id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "feedback",
        id,
        `Feedback actualizado a: ${updatedFeedback.status}`
      );

      res.json(updatedFeedback);
    } catch (error: any) {
      console.error("Error updating feedback:", error);
      res.status(500).json({ message: "Failed to update feedback" });
    }
  });

  // ============================================================================
  // INCOME MANAGEMENT SYSTEM ROUTES
  // ============================================================================

  // Rental Commission Config endpoints (Admin only)
  app.get("/api/income/commission-configs", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const { propertyId, userId } = req.query;
      const configs = await storage.getRentalCommissionConfigs({
        propertyId: propertyId as string,
        userId: userId as string,
      });
      res.json(configs);
    } catch (error: any) {
      console.error("Error fetching commission configs:", error);
      res.status(500).json({ message: "Failed to fetch commission configs" });
    }
  });

  app.get("/api/income/commission-configs/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const config = await storage.getRentalCommissionConfig(req.params.id);
      if (!config) {
        return res.status(404).json({ message: "Commission config not found" });
      }
      res.json(config);
    } catch (error: any) {
      console.error("Error fetching commission config:", error);
      res.status(500).json({ message: "Failed to fetch commission config" });
    }
  });

  app.post("/api/income/commission-configs", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const validationResult = insertRentalCommissionConfigSchema.safeParse({
        ...req.body,
        createdBy: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const config = await storage.createRentalCommissionConfig(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "rental_commission_config",
        config.id,
        `Created commission config`
      );

      res.status(201).json(config);
    } catch (error: any) {
      console.error("Error creating commission config:", error);
      res.status(500).json({ message: "Failed to create commission config" });
    }
  });

  app.put("/api/income/commission-configs/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const validationResult = insertRentalCommissionConfigSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const updated = await storage.updateRentalCommissionConfig(req.params.id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "rental_commission_config",
        req.params.id,
        `Updated commission config`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating commission config:", error);
      res.status(500).json({ message: "Failed to update commission config" });
    }
  });

  app.delete("/api/income/commission-configs/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      await storage.deleteRentalCommissionConfig(req.params.id);

      await createAuditLog(
        req,
        "delete",
        "rental_commission_config",
        req.params.id,
        `Deleted commission config`
      );

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting commission config:", error);
      res.status(500).json({ message: "Failed to delete commission config" });
    }
  });

  // Accountant Assignment endpoints (Admin only)
  app.get("/api/income/assignments", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const { accountantId, assignmentType, propertyId, userId } = req.query;
      const assignments = await storage.getAccountantAssignments({
        accountantId: accountantId as string,
        assignmentType: assignmentType as string,
        propertyId: propertyId as string,
        userId: userId as string,
      });
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching accountant assignments:", error);
      res.status(500).json({ message: "Failed to fetch accountant assignments" });
    }
  });

  app.get("/api/income/my-assignments", isAuthenticated, requireAccountantOrAdmin, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const assignments = await storage.getAccountantActiveAssignments(userId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching my assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/income/assignments", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const validationResult = insertAccountantAssignmentSchema.safeParse({
        ...req.body,
        createdBy: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const assignment = await storage.createAccountantAssignment(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "accountant_assignment",
        assignment.id,
        `Created accountant assignment for ${assignment.accountantId}`
      );

      res.status(201).json(assignment);
    } catch (error: any) {
      console.error("Error creating accountant assignment:", error);
      res.status(500).json({ message: "Failed to create accountant assignment" });
    }
  });

  app.put("/api/income/assignments/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const validationResult = insertAccountantAssignmentSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const updated = await storage.updateAccountantAssignment(req.params.id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "accountant_assignment",
        req.params.id,
        `Updated accountant assignment`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating accountant assignment:", error);
      res.status(500).json({ message: "Failed to update accountant assignment" });
    }
  });

  app.delete("/api/income/assignments/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      await storage.deleteAccountantAssignment(req.params.id);

      await createAuditLog(
        req,
        "delete",
        "accountant_assignment",
        req.params.id,
        `Deleted accountant assignment`
      );

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting accountant assignment:", error);
      res.status(500).json({ message: "Failed to delete accountant assignment" });
    }
  });

  // Payout Batch endpoints
  app.get("/api/income/batches", isAuthenticated, requireAccountantOrAdmin, async (req, res) => {
    try {
      const { status, createdBy } = req.query;
      const batches = await storage.getPayoutBatches({
        status: status as string,
        createdBy: createdBy as string,
      });
      res.json(batches);
    } catch (error: any) {
      console.error("Error fetching payout batches:", error);
      res.status(500).json({ message: "Failed to fetch payout batches" });
    }
  });

  app.get("/api/income/batches/:id", isAuthenticated, requireAccountantOrAdmin, async (req, res) => {
    try {
      const batch = await storage.getPayoutBatch(req.params.id);
      if (!batch) {
        return res.status(404).json({ message: "Payout batch not found" });
      }
      res.json(batch);
    } catch (error: any) {
      console.error("Error fetching payout batch:", error);
      res.status(500).json({ message: "Failed to fetch payout batch" });
    }
  });

  app.post("/api/income/batches", isAuthenticated, requireAccountantOrAdmin, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const batchNumber = await storage.generatePayoutBatchNumber();

      const validationResult = insertPayoutBatchSchema.safeParse({
        ...req.body,
        batchNumber,
        createdBy: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const batch = await storage.createPayoutBatch(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "payout_batch",
        batch.id,
        `Created payout batch ${batch.batchNumber}`
      );

      res.status(201).json(batch);
    } catch (error: any) {
      console.error("Error creating payout batch:", error);
      res.status(500).json({ message: "Failed to create payout batch" });
    }
  });

  app.put("/api/income/batches/:id", isAuthenticated, requireAccountantOrAdmin, async (req, res) => {
    try {
      const validationResult = insertPayoutBatchSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const updated = await storage.updatePayoutBatch(req.params.id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "payout_batch",
        req.params.id,
        `Updated payout batch ${updated.batchNumber}`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating payout batch:", error);
      res.status(500).json({ message: "Failed to update payout batch" });
    }
  });

  app.post("/api/income/batches/:id/status", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const { status, notes } = req.body;
      const userId = (req.user as any).claims.sub;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updated = await storage.updatePayoutBatchStatus(req.params.id, status, userId, notes);

      await createAuditLog(
        req,
        "update",
        "payout_batch",
        req.params.id,
        `Changed payout batch status to ${status}`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating payout batch status:", error);
      res.status(500).json({ message: "Failed to update payout batch status" });
    }
  });

  // Income Transaction endpoints
  app.get("/api/income/transactions", isAuthenticated, requireAccountantOrAdmin, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const dbUser = (req as any).dbUser;
      
      const { beneficiaryId, category, status, propertyId, payoutBatchId, fromDate, toDate } = req.query;

      // Apply accountant scope filtering if user is accountant
      const filters: any = {
        beneficiaryId: beneficiaryId as string,
        category: category as string,
        status: status as string,
        propertyId: propertyId as string,
        payoutBatchId: payoutBatchId as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      };

      // If user is accountant (not admin), apply scope filtering
      if (dbUser.role === "accountant") {
        filters.accountantId = userId;
      }

      const transactions = await storage.getIncomeTransactions(filters);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching income transactions:", error);
      res.status(500).json({ message: "Failed to fetch income transactions" });
    }
  });

  app.get("/api/income/transactions/:id", isAuthenticated, requireAccountantOrAdmin, async (req, res) => {
    try {
      const transaction = await storage.getIncomeTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Income transaction not found" });
      }
      res.json(transaction);
    } catch (error: any) {
      console.error("Error fetching income transaction:", error);
      res.status(500).json({ message: "Failed to fetch income transaction" });
    }
  });

  app.post("/api/income/transactions", isAuthenticated, requireAccountantOrAdmin, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const validationResult = insertIncomeTransactionSchema.safeParse({
        ...req.body,
        createdBy: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const transaction = await storage.createIncomeTransaction(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "income_transaction",
        transaction.id,
        `Created income transaction for ${transaction.beneficiaryId}`
      );

      res.status(201).json(transaction);
    } catch (error: any) {
      console.error("Error creating income transaction:", error);
      res.status(500).json({ message: "Failed to create income transaction" });
    }
  });

  app.put("/api/income/transactions/:id", isAuthenticated, requireAccountantOrAdmin, async (req, res) => {
    try {
      const validationResult = insertIncomeTransactionSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const updated = await storage.updateIncomeTransaction(req.params.id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "income_transaction",
        req.params.id,
        `Updated income transaction`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating income transaction:", error);
      res.status(500).json({ message: "Failed to update income transaction" });
    }
  });

  app.post("/api/income/transactions/:id/status", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const { status, notes, rejectionReason } = req.body;
      const userId = (req.user as any).claims.sub;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updated = await storage.updateIncomeTransactionStatus(
        req.params.id,
        status,
        userId,
        notes,
        rejectionReason
      );

      await createAuditLog(
        req,
        "update",
        "income_transaction",
        req.params.id,
        `Changed income transaction status to ${status}`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating income transaction status:", error);
      res.status(500).json({ message: "Failed to update income transaction status" });
    }
  });

  // Get my income transactions (for clients and owners)
  app.get("/api/income/my-transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { category, status, fromDate, toDate } = req.query;

      const transactions = await storage.getIncomeTransactions({
        beneficiaryId: userId,
        category: category as string,
        status: status as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      });

      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching user income transactions:", error);
      res.status(500).json({ message: "Failed to fetch income transactions" });
    }
  });

  // Get my income summary (for clients and owners)
  app.get("/api/income/my-summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const transactions = await storage.getIncomeTransactions({
        beneficiaryId: userId,
      });

      const totalEarnings = transactions.reduce((sum, t) => sum + t.amount, 0);
      const paidAmount = transactions
        .filter(t => t.status === "paid")
        .reduce((sum, t) => sum + t.amount, 0);
      const pendingAmount = transactions
        .filter(t => t.status === "pending")
        .reduce((sum, t) => sum + t.amount, 0);

      const byCategory = transactions.reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = { count: 0, total: 0 };
        }
        acc[t.category].count++;
        acc[t.category].total += t.amount;
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      res.json({
        totalEarnings,
        paidAmount,
        pendingAmount,
        transactionCount: transactions.length,
        byCategory,
      });
    } catch (error: any) {
      console.error("Error fetching user income summary:", error);
      res.status(500).json({ message: "Failed to fetch income summary" });
    }
  });

  // Income Reports endpoint (Admin only)
  app.get("/api/income/reports", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const { beneficiaryId, propertyId, category, status, fromDate, toDate, groupBy } = req.query;

      const reports = await storage.getIncomeReports({
        beneficiaryId: beneficiaryId as string,
        propertyId: propertyId as string,
        category: category as string,
        status: status as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        groupBy: groupBy as any,
      });

      res.json(reports);
    } catch (error: any) {
      console.error("Error fetching income reports:", error);
      res.status(500).json({ message: "Failed to fetch income reports" });
    }
  });

  // Changelog routes (Admin only)
  app.get("/api/changelogs", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const changelogs = await storage.getAllChangelogs();
      res.json(changelogs);
    } catch (error: any) {
      console.error("Error fetching changelogs:", error);
      res.status(500).json({ message: "Failed to fetch changelogs" });
    }
  });

  app.get("/api/changelogs/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const changelog = await storage.getChangelog(req.params.id);
      if (!changelog) {
        return res.status(404).json({ message: "Changelog not found" });
      }
      res.json(changelog);
    } catch (error: any) {
      console.error("Error fetching changelog:", error);
      res.status(500).json({ message: "Failed to fetch changelog" });
    }
  });

  app.post("/api/changelogs", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const validationResult = insertChangelogSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid changelog data", 
          errors: validationResult.error.errors 
        });
      }

      const changelog = await storage.createChangelog(validationResult.data);

      await logAuditAction(
        req,
        "create",
        "changelog",
        changelog.id,
        `Created changelog: ${changelog.title}`
      );

      res.status(201).json(changelog);
    } catch (error: any) {
      console.error("Error creating changelog:", error);
      res.status(500).json({ message: "Failed to create changelog" });
    }
  });

  app.patch("/api/changelogs/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const changelog = await storage.updateChangelog(req.params.id, req.body);

      await logAuditAction(
        req,
        "update",
        "changelog",
        changelog.id,
        `Updated changelog: ${changelog.title}`
      );

      res.json(changelog);
    } catch (error: any) {
      console.error("Error updating changelog:", error);
      res.status(500).json({ message: "Failed to update changelog" });
    }
  });

  app.delete("/api/changelogs/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      await storage.deleteChangelog(req.params.id);

      await logAuditAction(
        req,
        "delete",
        "changelog",
        req.params.id,
        "Deleted changelog"
      );

      res.json({ message: "Changelog deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting changelog:", error);
      res.status(500).json({ message: "Failed to delete changelog" });
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
            
            if (!wsClients.has(conversationId)) {
              wsClients.set(conversationId, new Set());
            }
            wsClients.get(conversationId)!.add(ws);
            
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
