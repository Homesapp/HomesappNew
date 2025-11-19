import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { parse as parseCookie } from "cookie";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { openAIService } from "./services/openai";
import { setupAuth, isAuthenticated, requireRole, getSession } from "./replitAuth";
import { requireResourceOwnership } from "./middleware/resourceOwnership";
import { createGoogleMeetEvent, deleteGoogleMeetEvent } from "./googleCalendar";
import { calculateRentalCommissions } from "./commissionCalculator";
import { sendVerificationEmail, sendLeadVerificationEmail, sendDuplicateLeadNotification, sendOwnerReferralVerificationEmail, sendOwnerReferralApprovedNotification, sendOfferLinkEmail } from "./gmail";
import { getPropertyTitle } from "./propertyHelpers";
import { setupGoogleAuth } from "./googleAuth";
import { generateOfferPDF } from "./pdfGenerator";
import { processChatbotMessage, generatePropertyRecommendations } from "./chatbot";
import { authLimiter, registrationLimiter, emailVerificationLimiter, chatbotLimiter, propertySubmissionLimiter } from "./rateLimiters";
import { 
  sanitizeText, 
  sanitizeHtml, 
  sanitizeObject,
  isValidEmail,
  isValidURL,
  isValidPhoneNumber,
  sanitizePhoneNumber,
  isStrongPassword,
  normalizeEmail,
  containsSQLKeywords,
  containsScriptTags
} from "./sanitize";
import { handleGenericError, handleZodError } from "./errorHandling";
import { cache, CacheKeys, CacheTTL } from "./cache";
import { generateTemporaryPassword, validatePasswordStrength } from "./utils/password";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
  setTemporaryPasswordSchema,
  changePasswordSchema,
  forcePasswordChangeSchema,
  insertRoleRequestSchema,
  insertLeadSchema,
  leads,
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
  chatConversations,
  updateUserProfileSchema,
  updateBankInfoSchema,
  uploadSellerDocumentSchema,
  acceptCommissionTermsSchema,
  updateDocumentStatusSchema,
  insertAgreementTemplateSchema,
  insertPropertySubmissionDraftSchema,
  insertPropertyAgreementSchema,
  insertProviderApplicationSchema,
  insertFeedbackSchema,
  insertContractTenantInfoSchema,
  insertContractOwnerInfoSchema,
  insertContractLegalDocumentSchema,
  updateContractLegalDocumentSchema,
  insertContractTermDiscussionSchema,
  insertContractApprovalSchema,
  insertCheckInAppointmentSchema,
  updateCheckInAppointmentSchema,
  insertContractSignedDocumentSchema,
  updateFeedbackSchema,
  insertRentalCommissionConfigSchema,
  insertAccountantAssignmentSchema,
  insertPayoutBatchSchema,
  insertIncomeTransactionSchema,
  insertChangelogSchema,
  insertSlaConfigurationSchema,
  insertLeadScoringRuleSchema,
  insertLeadScoreSchema,
  insertContractChecklistTemplateSchema,
  insertContractChecklistTemplateItemSchema,
  insertContractChecklistItemSchema,
  insertRentalHealthScoreSchema,
  insertLeadResponseMetricSchema,
  insertContractCycleMetricSchema,
  insertWorkflowEventSchema,
  insertSystemAlertSchema,
  insertErrorLogSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  suspendUserSchema,
  unsuspendUserSchema,
  createPropertyLimitRequestSchema,
  insertCondominiumUnitSchema,
  insertCondominiumFeeSchema,
  insertCondominiumFeePaymentSchema,
  insertCondominiumIssueSchema,
  insertHoaManagerAssignmentSchema,
  insertHoaAnnouncementSchema,
  insertHoaAnnouncementReadSchema,
  insertOfferTokenSchema,
  offerTokens,
  tenantRentalFormTokens,
  tenantRentalForms,
  condominiums,
  condominiumUnits,
  colonies,
  insertExternalAgencySchema,
  insertExternalPropertySchema,
  insertExternalRentalContractSchema,
  updateExternalRentalContractSchema,
  insertExternalPaymentScheduleSchema,
  insertExternalPaymentSchema,
  insertExternalMaintenanceTicketSchema,
  insertExternalCondominiumSchema,
  updateExternalCondominiumSchema,
  insertExternalUnitSchema,
  updateExternalUnitSchema,
  insertExternalUnitOwnerSchema,
  updateExternalUnitOwnerSchema,
  insertExternalUnitAccessControlSchema,
  updateExternalUnitAccessControlSchema,
  insertExternalOwnerChargeSchema,
  insertExternalOwnerNotificationSchema,
  externalAgencies,
  externalCondominiums,
  externalUnits,
  externalUnitAccessControls,
  externalUnitOwners,
  externalOwnerCharges,
  externalOwnerNotifications,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, sql } from "drizzle-orm";

// Helper function to verify external agency ownership
async function verifyExternalAgencyOwnership(req: any, res: any, agencyId: string): Promise<boolean> {
  try {
    // Admin and master users can access all agencies
    const userRole = req.user?.role || req.session?.adminUser?.role;
    if (userRole === "master" || userRole === "admin") {
      return true;
    }

    // Get user ID from authentication
    const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized: User ID not found" });
      return false;
    }

    // Get the user's assigned agency
    const userAgency = await storage.getExternalAgencyByUser(userId);
    if (!userAgency) {
      res.status(403).json({ message: "Forbidden: User is not assigned to any agency" });
      return false;
    }

    // Verify the agency matches
    if (userAgency.id !== agencyId) {
      res.status(403).json({ message: "Forbidden: Cannot access resources from another agency" });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying agency ownership:", error);
    res.status(500).json({ message: "Failed to verify agency ownership" });
    return false;
  }
}

// Helper function to get user's agency ID
async function getUserAgencyId(req: any): Promise<string | null> {
  try {
    // Admin and master users don't have an agency
    const userRole = req.user?.role || req.session?.adminUser?.role;
    if (userRole === "master" || userRole === "admin") {
      return null;
    }

    // Get user ID from authentication
    const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) {
      return null;
    }

    // Get the user's assigned agency
    const userAgency = await storage.getExternalAgencyByUser(userId);
    return userAgency?.id || null;
  } catch (error) {
    console.error("Error getting user agency ID:", error);
    return null;
  }
}

// Helper function to create audit logs
async function createAuditLog(
  req: Request & { user?: any; session?: any },
  action: "create" | "update" | "delete" | "view" | "approve" | "reject" | "assign",
  entityType: string,
  entityId: string | null,
  details?: string
) {
  try {
    // Get userId from either admin session or regular auth
    let userId: string | null = null;
    
    if (req.session?.adminUser) {
      // Admin session - use admin user ID
      userId = req.session.adminUser.id;
    } else if (req.user?.claims?.sub) {
      // Regular Replit Auth - use claims sub
      userId = req.user.claims.sub;
    }
    
    if (!userId) return;

    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.get("user-agent") || null;

    // Only create audit log if userId exists in users table
    // For admin users, we skip audit logging since they're in admin_users table
    if (req.session?.adminUser) {
      // Skip audit logging for admin sessions as admin IDs don't exist in users table
      return;
    }
    
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
      // Regular user from users table - ensure they exist
      const dbUser = await ensureUserExists(req);
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

// Helper function to ensure user exists in database
async function ensureUserExists(req: any): Promise<any> {
  const userId = req.user.claims.sub;
  const claims = req.user.claims;
  
  let user = await storage.getUser(userId);
  
  // If user doesn't exist but we have valid claims, create them automatically
  if (!user && claims) {
    user = await storage.upsertUser({
      id: claims.sub,
      email: claims.email,
      firstName: claims.first_name || '',
      lastName: claims.last_name || '',
      profileImageUrl: claims.profile_image_url,
    });
  }
  
  return user;
}

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
  
  // Setup Google OAuth direct login
  setupGoogleAuth(app);
  
  // Initialize business hours with default values if not exists
  await storage.initializeBusinessHours();

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // Check if admin session exists
      if (req.session && req.session.adminUser) {
        return res.json(req.session.adminUser);
      }

      // Otherwise, get regular user from Replit Auth
      const userId = req.user.claims.sub;
      const claims = req.user.claims;
      
      // Try to get user from database
      let user = await storage.getUser(userId);
      
      // If user doesn't exist but we have valid claims, create them automatically
      if (!user && claims) {
        user = await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name || '',
          lastName: claims.last_name || '',
          profileImageUrl: claims.profile_image_url,
        });
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Test endpoint to update authenticated user's role (development only)
  if (process.env.NODE_ENV === "development") {
    app.post("/api/auth/test/set-role", isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { role } = req.body;
        
        if (!role) {
          return res.status(400).json({ message: "Role is required" });
        }
        
        const validRoles = ["cliente", "owner", "seller", "concierge", "admin", "admin_jr", "master"];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        
        // Update user role
        const updatedUser = await storage.updateUserRole(userId, role);
        res.json(updatedUser);
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Failed to update role" });
      }
    });
    
    // Test endpoint to bootstrap admin session without OIDC (development only, for e2e testing)
    app.post("/api/test-auth/admin-session", async (req: any, res) => {
      try {
        // Get or create a test admin user
        let testAdmin = await storage.getAdminByUsername("test-admin");
        
        if (!testAdmin) {
          // Create a test admin user
          testAdmin = await storage.createAdmin({
            username: "test-admin",
            email: "test-admin@test.com",
            firstName: "Test",
            lastName: "Admin",
            passwordHash: await bcrypt.hash("test-password", 10),
            role: "admin",
            isActive: true,
          });
        }
        
        // Upsert to users table for foreign key constraints
        await storage.upsertUser({
          id: testAdmin.id,
          email: testAdmin.email,
          firstName: testAdmin.firstName,
          lastName: testAdmin.lastName,
          role: testAdmin.role,
        });
        
        // Set admin session
        req.session.adminUser = {
          id: testAdmin.id,
          username: testAdmin.username,
          email: testAdmin.email,
          firstName: testAdmin.firstName,
          lastName: testAdmin.lastName,
          role: testAdmin.role,
        };
        
        // Save session explicitly
        await new Promise<void>((resolve, reject) => {
          req.session.save((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        res.json({ 
          success: true, 
          message: "Test admin session created",
          admin: {
            username: testAdmin.username,
            role: testAdmin.role,
          }
        });
      } catch (error) {
        console.error("Error creating test admin session:", error);
        res.status(500).json({ message: "Failed to create test session" });
      }
    });
  }

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
      
      // Ensure admin also exists in users table (for foreign key constraints)
      try {
        await storage.upsertUser({
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          profileImageUrl: admin.profileImageUrl,
        });
      } catch (upsertError) {
        console.error("Error upserting admin to users table:", upsertError);
        // Don't fail login if this fails, but log it
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

  // Configure multer for property photo uploads
  const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'attached_assets/stock_images/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(4).toString('hex');
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
      cb(null, `${baseName}_${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage: photoStorage,
    limits: {
      fileSize: 20 * 1024 * 1024 // 20MB limit (images are compressed on frontend)
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG y WEBP.'));
      }
    }
  });

  // Configure multer for payment proof uploads
  const paymentProofStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'attached_assets/payment_proofs/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = crypto.randomBytes(4).toString('hex');
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
      cb(null, `payment_${uniqueSuffix}${ext}`);
    }
  });

  const uploadPaymentProof = multer({
    storage: paymentProofStorage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit for payment proofs
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG y WEBP.'));
      }
    }
  });

  // Upload property photo endpoint
  app.post("/api/upload/property-photo", isAuthenticated, requireRole(["owner", "admin", "master"]), upload.single('photo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se proporcionó ninguna foto" });
      }

      const photoUrl = `/attached_assets/stock_images/${req.file.filename}`;
      res.json({ url: photoUrl });
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: error.message || "Error al subir la foto" });
    }
  });

  // Get current admin user
  app.get("/api/auth/admin/user", async (req: any, res) => {
    try {
      if (!req.session.adminUser) {
        // Return 200 with null instead of 401 to avoid unnecessary error logs
        return res.status(200).json(null);
      }
      
      // Fetch full admin data from database to include onboarding fields
      const adminId = req.session.adminUser.id;
      const admin = await storage.getAdminById(adminId);
      
      if (!admin) {
        return res.status(200).json(null);
      }
      
      const { passwordHash, ...adminWithoutPassword } = admin;
      res.json(adminWithoutPassword);
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
      res.json({
        ...userWithoutPassword,
        requirePasswordChange: user.requirePasswordChange || false,
      });
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

  // Admin: Set temporary password for a user
  app.post("/api/admin/users/:userId/set-password", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate temporary password
      const temporaryPassword = generateTemporaryPassword();
      
      // Hash the password
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);
      
      // Update user password and set requirePasswordChange flag
      await db
        .update(users)
        .set({
          passwordHash,
          requirePasswordChange: true,
          emailVerified: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      await createAuditLog(req, "update", "user", userId, `Admin set temporary password for user ${user.email}`);
      
      // Return the temporary password (only shown once)
      res.json({ 
        message: "Temporary password set successfully",
        temporaryPassword,
        email: user.email 
      });
    } catch (error) {
      console.error("Error setting temporary password:", error);
      res.status(500).json({ message: "Failed to set temporary password" });
    }
  });

  // Admin: Reset password for a user (generate new temporary password)
  app.post("/api/admin/users/:userId/reset-password", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate new temporary password
      const temporaryPassword = generateTemporaryPassword();
      
      // Hash the password
      const passwordHash = await bcrypt.hash(temporaryPassword, 10);
      
      // Update user password and set requirePasswordChange flag
      await db
        .update(users)
        .set({
          passwordHash,
          requirePasswordChange: true,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      await createAuditLog(req, "update", "user", userId, `Admin reset password for user ${user.email}`);
      
      // Return the new temporary password (only shown once)
      res.json({ 
        message: "Password reset successfully",
        temporaryPassword,
        email: user.email 
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // User: Change own password
  app.post("/api/auth/change-password", isAuthenticated, async (req: any, res) => {
    try {
      const validationResult = changePasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors,
        });
      }

      const { currentPassword, newPassword } = validationResult.data;
      const userId = req.user.claims.sub;
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "User not found or no password set" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Validate new password strength
      const strengthValidation = validatePasswordStrength(newPassword);
      if (!strengthValidation.valid) {
        return res.status(400).json({ message: strengthValidation.message });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear requirePasswordChange flag using direct DB update
      await db
        .update(users)
        .set({
          passwordHash,
          requirePasswordChange: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      await createAuditLog(req, "update", "user", userId, `User changed their password`);
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // User: Force password change (first time login)
  app.post("/api/auth/force-password-change", isAuthenticated, async (req: any, res) => {
    try {
      const validationResult = forcePasswordChangeSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: validationResult.error.errors,
        });
      }

      const { newPassword } = validationResult.data;
      const userId = req.user.claims.sub;
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user actually needs to change password
      if (!user.requirePasswordChange) {
        return res.status(400).json({ message: "Password change not required" });
      }

      // Validate new password strength
      const strengthValidation = validatePasswordStrength(newPassword);
      if (!strengthValidation.valid) {
        return res.status(400).json({ message: strengthValidation.message });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear requirePasswordChange flag using direct DB update
      await db
        .update(users)
        .set({
          passwordHash,
          requirePasswordChange: false,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      await createAuditLog(req, "update", "user", userId, `User completed forced password change`);
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error in force password change:", error);
      res.status(500).json({ message: "Failed to change password" });
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
      
      // Validate role with Zod
      const roleSchema = z.object({
        role: z.enum(["cliente", "owner", "seller", "admin", "admin_jr", "master", "accountant"], {
          errorMap: () => ({ message: "Rol inválido" })
        })
      });
      
      const validationResult = roleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos",
          errors: validationResult.error.errors 
        });
      }
      
      const { role } = validationResult.data;
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
      
      // Validate role with Zod
      const switchRoleSchema = z.object({
        role: z.string().min(1, "El rol es requerido")
      });
      
      const validationResult = switchRoleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos",
          errors: validationResult.error.errors 
        });
      }
      
      const { role } = validationResult.data;

      // SECURITY: Define admin-level roles that can NEVER be switched to via this endpoint
      // These roles require explicit assignment by master users only
      const ADMIN_ROLES = ["master", "admin", "admin_jr"];
      
      // SECURITY: Define roles that are safe for user-initiated switching
      const SWITCHABLE_ROLES = ["cliente", "owner", "seller", "accountant", "management", "concierge", "provider", "abogado", "contador", "agente_servicios_especiales"];

      // CRITICAL SECURITY CHECK: Prevent privilege escalation to admin roles
      if (ADMIN_ROLES.includes(role)) {
        return res.status(403).json({ 
          message: "Los roles administrativos solo pueden ser asignados por un administrador master" 
        });
      }

      // Validate role is in switchable set
      if (!SWITCHABLE_ROLES.includes(role)) {
        return res.status(400).json({ 
          message: "Rol inválido" 
        });
      }

      // Get current user data to check their approved roles
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // User can always switch between owner and cliente (base roles)
      const isBaseRole = role === "owner" || role === "cliente";
      
      // User can switch to their approved additional role (only if it's switchable)
      const isApprovedAdditionalRole = 
        role === currentUser.additionalRole && 
        SWITCHABLE_ROLES.includes(role);

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

  app.patch("/api/profile/bank-info", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validated = updateBankInfoSchema.parse(req.body);
      
      const user = await storage.updateBankInfo(userId, validated);
      
      await createAuditLog(
        req,
        "update",
        "user",
        userId,
        "Información bancaria actualizada"
      );
      
      res.json(user);
    } catch (error) {
      console.error("Error updating bank info:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update bank information" });
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

  app.patch("/api/user/complete-onboarding", isAuthenticated, async (req: any, res) => {
    try {
      // Support both regular auth (req.user) and admin auth (req.session.adminUser)
      const isAdmin = !!req.session?.adminUser;
      let userId;
      
      if (isAdmin) {
        userId = req.session.adminUser.id;
        // Update admin_users table
        await db
          .update(adminUsers)
          .set({ 
            onboardingCompleted: true,
            onboardingSteps: { completed: true, completedAt: new Date().toISOString() }
          })
          .where(eq(adminUsers.id, userId));
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
        // Update users table
        await db
          .update(users)
          .set({ 
            onboardingCompleted: true,
            onboardingSteps: { completed: true, completedAt: new Date().toISOString() }
          })
          .where(eq(users.id, userId));
      } else {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  app.patch("/api/user/skip-onboarding", isAuthenticated, async (req: any, res) => {
    try {
      // Support both regular auth (req.user) and admin auth (req.session.adminUser)
      const isAdmin = !!req.session?.adminUser;
      let userId;
      
      if (isAdmin) {
        userId = req.session.adminUser.id;
        // Update admin_users table
        await db
          .update(adminUsers)
          .set({ 
            onboardingCompleted: true,
            onboardingSteps: { skipped: true, skippedAt: new Date().toISOString() }
          })
          .where(eq(adminUsers.id, userId));
      } else if (req.user?.claims?.sub) {
        userId = req.user.claims.sub;
        // Update users table
        await db
          .update(users)
          .set({ 
            onboardingCompleted: true,
            onboardingSteps: { skipped: true, skippedAt: new Date().toISOString() }
          })
          .where(eq(users.id, userId));
      } else {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      res.status(500).json({ message: "Failed to skip onboarding" });
    }
  });

  // Password reset routes
  app.post("/api/password-reset/request", async (req, res) => {
    try {
      const validated = requestPasswordResetSchema.parse(req.body);
      const { email } = validated;
      
      const user = await storage.getUserByEmail(email);
      
      if (user && user.passwordHash) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        
        await storage.createPasswordResetToken({
          userId: user.id,
          token,
          expiresAt,
          used: false,
        });
        
        // Determine the base URL for the reset link
        // In production: use REPLIT_DOMAINS (first domain) or WEB_REPL_DEPLOYMENT_URL
        // In development: use REPLIT_DEV_DOMAIN or localhost
        let baseUrl = 'http://localhost:5000';
        
        if (process.env.REPLIT_DOMAINS) {
          // Production deployment - use the first domain from REPLIT_DOMAINS
          const domains = process.env.REPLIT_DOMAINS.split(',');
          baseUrl = `https://${domains[0]}`;
        } else if (process.env.REPLIT_DEV_DOMAIN) {
          // Development environment
          baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
        }
        
        const resetLink = `${baseUrl}/reset-password?token=${token}`;
        console.log(`Generated password reset link for ${user.email} using baseUrl: ${baseUrl}`);
        
        try {
          const { sendPasswordResetEmail } = await import("./gmail");
          await sendPasswordResetEmail(
            user.email,
            user.firstName || 'Usuario',
            resetLink
          );
          console.log(`Password reset email sent successfully to ${user.email}`);
        } catch (emailError) {
          console.error('Error sending password reset email:', emailError);
          console.error('Email error details:', {
            message: emailError instanceof Error ? emailError.message : 'Unknown error',
            stack: emailError instanceof Error ? emailError.stack : undefined
          });
          // Still return success to prevent user enumeration
        }
      }
      
      res.json({ message: "Si el email existe, recibirás un enlace de restablecimiento" });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Email inválido", errors: error.errors });
      }
      res.status(500).json({ message: "Error al procesar solicitud" });
    }
  });
  
  app.post("/api/password-reset/reset", async (req, res) => {
    try {
      const validated = resetPasswordSchema.parse(req.body);
      const { token, newPassword } = validated;
      
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }
      
      if (resetToken.used) {
        return res.status(400).json({ message: "Este token ya fue usado" });
      }
      
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Este token ha expirado" });
      }
      
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(resetToken.userId, passwordHash);
      await storage.markPasswordResetTokenAsUsed(token);
      
      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al restablecer contraseña" });
    }
  });
  
  // Admin send password reset link to user
  app.post("/api/admin/users/:userId/send-reset-link", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      if (!user.passwordHash) {
        return res.status(400).json({ message: "Esta cuenta usa autenticación de terceros. No se puede enviar enlace de restablecimiento." });
      }
      
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        used: false,
      });
      
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : `http://localhost:5000`;
      const resetLink = `${baseUrl}/reset-password?token=${token}`;
      
      const { sendPasswordResetEmail } = await import("./gmail");
      await sendPasswordResetEmail(
        user.email,
        user.firstName || 'Usuario',
        resetLink
      );
      
      await createAuditLog(
        req,
        "update",
        "user",
        userId,
        `Admin envió enlace de restablecimiento de contraseña a ${user.email}`
      );
      
      res.json({ message: "Enlace de restablecimiento enviado exitosamente" });
    } catch (error) {
      console.error("Error sending reset link:", error);
      res.status(500).json({ message: "Error al enviar enlace de restablecimiento" });
    }
  });
  
  // Admin delete user completely
  app.delete("/api/admin/users/:userId", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Prevent self-deletion
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Check for related data that would prevent deletion
      const hasRelatedData = await db.select({ count: sql<number>`count(*)::int` })
        .from(chatConversations)
        .where(eq(chatConversations.createdById, userId))
        .then(rows => rows[0]?.count > 0);
      
      if (hasRelatedData) {
        return res.status(400).json({ 
          message: "No se puede eliminar este usuario porque tiene conversaciones de chat asociadas. Considera suspender la cuenta en su lugar." 
        });
      }
      
      await createAuditLog(
        req,
        "delete",
        "user",
        userId,
        `Admin eliminó usuario: ${user.firstName} ${user.lastName} (${user.email})`
      );
      
      await storage.deleteUser(userId);
      
      res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error al eliminar usuario" });
    }
  });

  // Get user's presentation cards
  app.get("/api/users/:userId/presentation-cards", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      const cards = await db
        .select()
        .from(presentationCards)
        .where(eq(presentationCards.clientId, userId))
        .orderBy(desc(presentationCards.createdAt));
      
      res.json(cards);
    } catch (error) {
      console.error("Error fetching presentation cards:", error);
      res.status(500).json({ message: "Error al obtener tarjetas de presentación" });
    }
  });

  // Get user's properties
  app.get("/api/users/:userId/properties", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      const userProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.ownerId, userId))
        .orderBy(desc(properties.createdAt));
      
      res.json(userProperties);
    } catch (error) {
      console.error("Error fetching user properties:", error);
      res.status(500).json({ message: "Error al obtener propiedades del usuario" });
    }
  });

  // Suspend user account
  app.post("/api/admin/users/:userId/suspend", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const validated = suspendUserSchema.parse({ ...req.body, userId });
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      const adminId = req.user?.claims?.sub || req.user?.id;
      if (userId === adminId) {
        return res.status(400).json({ message: "No puedes suspender tu propia cuenta" });
      }
      
      const suspendedAt = new Date();
      const suspensionEndDate = validated.suspensionType === "temporary" && validated.endDate
        ? new Date(validated.endDate)
        : null;
      
      await db
        .update(users)
        .set({
          isSuspended: true,
          suspensionType: validated.suspensionType,
          suspensionReason: validated.reason,
          suspensionEndDate,
          suspendedAt,
          suspendedById: adminId,
        })
        .where(eq(users.id, userId));
      
      await createAuditLog(
        req,
        "update",
        "user",
        userId,
        `Admin suspendió cuenta de ${user.firstName} ${user.lastName}: ${validated.reason} (${validated.suspensionType})`
      );
      
      res.json({ message: "Usuario suspendido exitosamente" });
    } catch (error) {
      console.error("Error suspending user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al suspender usuario" });
    }
  });

  // Unsuspend user account
  app.post("/api/admin/users/:userId/unsuspend", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      await db
        .update(users)
        .set({
          isSuspended: false,
          suspensionType: null,
          suspensionReason: null,
          suspensionEndDate: null,
          suspendedAt: null,
          suspendedById: null,
        })
        .where(eq(users.id, userId));
      
      await createAuditLog(
        req,
        "update",
        "user",
        userId,
        `Admin reactivó cuenta de ${user.firstName} ${user.lastName}`
      );
      
      res.json({ message: "Usuario reactivado exitosamente" });
    } catch (error) {
      console.error("Error unsuspending user:", error);
      res.status(500).json({ message: "Error al reactivar usuario" });
    }
  });

  // Update user role (admin can assign roles directly)
  app.patch("/api/admin/users/:userId/role", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role, additionalRole } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Validate role
      const validRoles = ["cliente", "seller", "owner", "concierge", "provider", "admin", "admin_jr", "master", "management"];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ message: "Rol inválido" });
      }
      if (additionalRole && !validRoles.includes(additionalRole)) {
        return res.status(400).json({ message: "Rol adicional inválido" });
      }

      const updateData: any = {};
      if (role) updateData.role = role;
      if (additionalRole !== undefined) updateData.additionalRole = additionalRole;

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      await createAuditLog(
        req,
        "update",
        "user",
        userId,
        `Admin actualizó rol de ${user.firstName} ${user.lastName} a: ${role}${additionalRole ? ` (adicional: ${additionalRole})` : ""}`
      );

      res.json({ message: "Rol actualizado exitosamente" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Error al actualizar rol" });
    }
  });

  // Seller document and commission terms routes
  app.patch("/api/seller/document", isAuthenticated, requireRole(["seller"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = uploadSellerDocumentSchema.parse(req.body);
      
      await db
        .update(users)
        .set({
          documentType: validated.documentType,
          documentUrl: validated.documentUrl,
          documentApprovalStatus: "pending",
          documentReviewedAt: null,
          documentRejectionReason: null,
        })
        .where(eq(users.id, userId));
      
      await createAuditLog(
        req,
        "update",
        "user",
        userId,
        `Vendedor subió documento tipo ${validated.documentType}`
      );
      
      res.json({ message: "Documento subido exitosamente, pendiente de revisión" });
    } catch (error) {
      console.error("Error uploading seller document:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al subir documento" });
    }
  });

  app.patch("/api/seller/commission-terms", isAuthenticated, requireRole(["seller"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = acceptCommissionTermsSchema.parse(req.body);
      
      if (validated.accepted) {
        await db
          .update(users)
          .set({
            commissionTermsAccepted: true,
            commissionTermsAcceptedAt: new Date(),
          })
          .where(eq(users.id, userId));
        
        await createAuditLog(
          req,
          "update",
          "user",
          userId,
          "Vendedor aceptó términos y condiciones de comisiones"
        );
        
        res.json({ message: "Términos y condiciones aceptados" });
      } else {
        res.status(400).json({ message: "Debes aceptar los términos y condiciones" });
      }
    } catch (error) {
      console.error("Error accepting commission terms:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al aceptar términos" });
    }
  });

  app.patch("/api/admin/seller/:id/document-status", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const validated = updateDocumentStatusSchema.parse(req.body);
      
      const [seller] = await db.select().from(users).where(eq(users.id, id));
      if (!seller) {
        return res.status(404).json({ message: "Vendedor no encontrado" });
      }
      
      if (seller.role !== "seller") {
        return res.status(400).json({ message: "El usuario no es un vendedor" });
      }
      
      const updates: any = {
        documentApprovalStatus: validated.status,
        documentReviewedAt: new Date(),
      };
      
      if (validated.status === "rejected" && validated.rejectionReason) {
        updates.documentRejectionReason = validated.rejectionReason;
      } else if (validated.status === "approved") {
        updates.documentRejectionReason = null;
      }
      
      await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id));
      
      await createAuditLog(
        req,
        "update",
        "user",
        id,
        `Admin actualizó estado de documento a: ${validated.status}`
      );
      
      res.json({ message: "Estado de documento actualizado" });
    } catch (error) {
      console.error("Error updating document status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al actualizar estado de documento" });
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

      // Additional security validations
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Formato de email inválido" });
      }

      if (!isStrongPassword(password)) {
        return res.status(400).json({ 
          message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número" 
        });
      }

      if (containsSQLKeywords(firstName) || containsSQLKeywords(lastName)) {
        return res.status(400).json({ message: "Nombre contiene caracteres no permitidos" });
      }

      if (phone && !isValidPhoneNumber(phone)) {
        return res.status(400).json({ message: "Formato de teléfono inválido" });
      }

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
      const allowedRoles = ["owner", "seller", "management", "concierge", "provider", "hoa_manager"];
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

  // Property Limit Request routes
  app.post("/api/property-limit-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "owner") {
        return res.status(403).json({ message: "Solo los propietarios pueden solicitar aumento de límite" });
      }

      // Validate request data
      const validationResult = createPropertyLimitRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos inválidos",
          errors: validationResult.error.errors,
        });
      }

      // Check if user already has a pending request
      const existingRequest = await storage.getUserActivePropertyLimitRequest(userId);
      if (existingRequest) {
        return res.status(409).json({
          message: "Ya tienes una solicitud pendiente",
        });
      }

      const currentLimit = user.propertyLimit || 3;
      const requestedLimit = validationResult.data.requestedLimit;

      if (requestedLimit <= currentLimit) {
        return res.status(400).json({
          message: `El límite solicitado debe ser mayor que tu límite actual (${currentLimit})`,
        });
      }

      const request = await storage.createPropertyLimitRequest({
        ownerId: userId,
        currentLimit,
        requestedLimit,
        reason: validationResult.data.reason,
      });

      // Log the request creation
      await createAuditLog(
        req,
        "create",
        "property_limit_request",
        request.id,
        `Solicitud de aumento de límite de propiedades: ${currentLimit} → ${requestedLimit}`
      );

      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating property limit request:", error);
      res.status(500).json({ message: "Error al crear solicitud de aumento de límite" });
    }
  });

  app.get("/api/property-limit-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.adminUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const user = await storage.getUser(userId);
      const isAdmin = user && ["master", "admin", "admin_jr"].includes(user.role);

      const { status, ownerId } = req.query;
      const filters: any = {};
      
      if (isAdmin) {
        // Admins can see all requests or filter by ownerId/status
        if (status) filters.status = status;
        if (ownerId) filters.ownerId = ownerId;
      } else {
        // Regular users can only see their own requests
        filters.ownerId = userId;
        if (status) filters.status = status;
      }

      const requests = await storage.getPropertyLimitRequests(filters);
      
      // Enrich requests with user data
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const owner = await storage.getUser(request.ownerId);
          return {
            ...request,
            owner: owner ? {
              id: owner.id,
              firstName: owner.firstName,
              lastName: owner.lastName,
              email: owner.email,
              profileImageUrl: owner.profileImageUrl,
            } : undefined,
          };
        })
      );
      
      res.json(requestsWithUsers);
    } catch (error) {
      console.error("Error fetching property limit requests:", error);
      res.status(500).json({ message: "Error al obtener solicitudes" });
    }
  });

  app.patch("/api/property-limit-requests/:id/approve", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const reviewerId = req.user?.claims?.sub || req.session?.adminUser?.id;

      const request = await storage.getPropertyLimitRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({
          message: `Esta solicitud ya fue ${request.status === "approved" ? "aprobada" : "rechazada"}`,
        });
      }

      // Update property limit request status
      const reviewerIdToSave = (!req.user?.adminAuth && !req.user?.localAuth) ? req.user?.claims?.sub : null;
      const updatedRequest = await storage.updatePropertyLimitRequestStatus(
        id,
        "approved",
        reviewerIdToSave,
        reviewNotes
      );

      // Update user's property limit
      await db
        .update(users)
        .set({ propertyLimit: request.requestedLimit })
        .where(eq(users.id, request.ownerId));

      // Log the approval
      await createAuditLog(
        req,
        "approve",
        "property_limit_request",
        id,
        `Aprobada solicitud de aumento de límite: ${request.currentLimit} → ${request.requestedLimit}`
      );

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving property limit request:", error);
      res.status(500).json({ message: "Error al aprobar solicitud" });
    }
  });

  app.patch("/api/property-limit-requests/:id/reject", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reviewNotes } = req.body;
      const reviewerId = req.user?.claims?.sub || req.session?.adminUser?.id;

      const request = await storage.getPropertyLimitRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({
          message: `Esta solicitud ya fue ${request.status === "approved" ? "aprobada" : "rechazada"}`,
        });
      }

      // Update property limit request status
      const reviewerIdToSave = (!req.user?.adminAuth && !req.user?.localAuth) ? req.user?.claims?.sub : null;
      const updatedRequest = await storage.updatePropertyLimitRequestStatus(
        id,
        "rejected",
        reviewerIdToSave,
        reviewNotes
      );

      // Log the rejection
      await createAuditLog(
        req,
        "reject",
        "property_limit_request",
        id,
        `Rechazada solicitud de aumento de límite: ${request.currentLimit} → ${request.requestedLimit}`
      );

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting property limit request:", error);
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
      // Try to get from cache first
      const cacheKey = CacheKeys.coloniesApproved();
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      // Cache miss - fetch from database
      const colonies = await storage.getApprovedColonies();
      
      // Store in cache with 24h TTL
      await cache.set(cacheKey, colonies, CacheTTL.STATIC);
      
      res.json(colonies);
    } catch (error) {
      console.error("Error fetching approved colonies:", error);
      res.status(500).json({ message: "Failed to fetch approved colonies" });
    }
  });

  app.post("/api/colonies", isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      let isAdmin: boolean;
      let userRole: string | null = null;

      // Check if it's an admin session (from admin_users table)
      if (req.session?.adminUser) {
        userId = req.session.adminUser.id;
        userRole = req.session.adminUser.role;
        isAdmin = ["master", "admin"].includes(userRole);
      } else {
        // Regular user from Replit Auth
        const user = await ensureUserExists(req);
        if (!user) {
          return res.status(401).json({ message: "Usuario no encontrado" });
        }
        userId = user.id;
        userRole = user.role;
        isAdmin = user.role === "master" || user.role === "admin" || user.additionalRole === "admin";
      }
      
      // Admins can create directly, owners need to suggest with limits
      if (!isAdmin && userRole !== "owner") {
        return res.status(403).json({ message: "Solo los propietarios y administradores pueden crear colonias" });
      }

      // Check suggestion limits only for non-admin owners
      if (!isAdmin && userRole === "owner") {
        const todaySuggestions = await storage.getUserSuggestionsCount(userId, 'today');
        const totalSuggestions = await storage.getUserSuggestionsCount(userId, 'total');

        if (todaySuggestions >= 3) {
          return res.status(429).json({ 
            message: "Has alcanzado el límite de 3 sugerencias por día" 
          });
        }

        if (totalSuggestions >= 15) {
          return res.status(429).json({ 
            message: "Has alcanzado el límite de 15 sugerencias totales" 
          });
        }
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

      // Admins create directly as approved, owners create as pending
      const approvalStatus = isAdmin ? "approved" : "pending_review";

      // Create colony
      const colony = await storage.createColony({
        name,
        slug,
        active: true,
        approvalStatus,
        requestedBy: userId,
      });

      await createAuditLog(
        req,
        "create",
        "colony",
        colony.id,
        isAdmin ? `Colonia creada: ${name}` : `Colonia solicitada: ${name}`
      );

      // Invalidate cache if admin created (auto-approved)
      if (isAdmin) {
        await cache.invalidate(CacheKeys.coloniesApproved());
      }

      res.json(colony);
    } catch (error) {
      console.error("Error creating colony:", error);
      res.status(500).json({ message: "Failed to create colony" });
    }
  });

  app.post("/api/colonies/ensure", isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      let isAdmin: boolean;
      let userRole: string | null = null;

      // Check if it's an admin session
      if (req.session?.adminUser) {
        userId = req.session.adminUser.id;
        userRole = req.session.adminUser.role;
        isAdmin = ["master", "admin"].includes(userRole);
      } else {
        const user = await ensureUserExists(req);
        if (!user) {
          return res.status(401).json({ message: "Usuario no encontrado" });
        }
        userId = user.id;
        userRole = user.role;
        isAdmin = user.role === "master" || user.role === "admin" || user.additionalRole === "admin";
      }

      const { name } = req.body;
      if (!name || name.trim() === "") {
        return res.status(400).json({ message: "El nombre de la colonia es requerido" });
      }

      // Search for existing colony by exact name (case-insensitive)
      const existingColony = await db
        .select()
        .from(colonies)
        .where(sql`LOWER(${colonies.name}) = LOWER(${name.trim()})`)
        .limit(1);

      if (existingColony.length > 0) {
        return res.json(existingColony[0]);
      }

      // Generate slug from name
      const slug = name.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

      // Create new colony
      const approvalStatus = isAdmin ? "approved" : "pending_review";
      const newColony = await storage.createColony({
        name: name.trim(),
        slug,
        approvalStatus,
        requestedBy: userId,
      });

      await createAuditLog(
        req,
        "create",
        "colony",
        newColony.id,
        isAdmin ? `Colonia creada: ${name}` : `Colonia solicitada: ${name}`
      );

      // Invalidate cache if admin created (auto-approved)
      if (isAdmin) {
        await cache.invalidate(CacheKeys.coloniesApproved());
      }

      res.json(newColony);
    } catch (error) {
      console.error("Error ensuring colony:", error);
      res.status(500).json({ message: "Failed to ensure colony exists" });
    }
  });

  app.post("/api/admin/colonies", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
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

  app.patch("/api/admin/colonies/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;

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

      // Invalidate cache after updating colony
      await cache.invalidate(CacheKeys.coloniesApproved());

      res.json(colony);
    } catch (error) {
      console.error("Error updating colony:", error);
      res.status(500).json({ message: "Failed to update colony" });
    }
  });

  app.delete("/api/admin/colonies/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;

      await storage.deleteColony(id);

      await createAuditLog(
        req,
        "delete",
        "colony",
        id,
        `Colonia eliminada`
      );

      // Invalidate cache after deleting colony
      await cache.invalidate(CacheKeys.coloniesApproved());

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting colony:", error);
      res.status(500).json({ message: "Failed to delete colony" });
    }
  });

  app.patch("/api/admin/colonies/:id/approve", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      // Validate colony exists
      const existingColony = await storage.getColony(id);
      if (!existingColony) {
        return res.status(404).json({ message: "Colonia no encontrada" });
      }

      // Update name if provided
      if (name && name.trim() !== "" && name !== existingColony.name) {
        await storage.updateColony(id, { name: name.trim() });
      }

      const colony = await storage.updateColonyStatus(id, "approved");
      
      await createAuditLog(
        req,
        "approve",
        "colony",
        id,
        `Colonia aprobada: ${colony.name}`
      );

      // Invalidate cache after approving colony
      await cache.invalidate(CacheKeys.coloniesApproved());

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

      // Invalidate cache after rejecting colony (removes from approved list)
      await cache.invalidate(CacheKeys.coloniesApproved());

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
      // Try to get from cache first
      const cacheKey = CacheKeys.condominiumsApproved();
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      // Cache miss - fetch from database
      const condominiums = await storage.getApprovedCondominiums();
      
      // Store in cache with 24h TTL
      await cache.set(cacheKey, condominiums, CacheTTL.STATIC);
      
      res.json(condominiums);
    } catch (error) {
      console.error("Error fetching approved condominiums:", error);
      res.status(500).json({ message: "Failed to fetch approved condominiums" });
    }
  });

  app.post("/api/condominiums", isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      let isAdmin: boolean;
      let userRole: string | null = null;

      // Check if it's an admin session (from admin_users table)
      if (req.session?.adminUser) {
        userId = req.session.adminUser.id;
        userRole = req.session.adminUser.role;
        isAdmin = ["master", "admin"].includes(userRole);
      } else {
        // Regular user from Replit Auth
        const user = await ensureUserExists(req);
        if (!user) {
          return res.status(401).json({ message: "Usuario no encontrado" });
        }
        userId = user.id;
        userRole = user.role;
        isAdmin = user.role === "master" || user.role === "admin" || user.additionalRole === "admin";
      }
      
      // Admins can create directly, owners need to suggest with limits
      if (!isAdmin && userRole !== "owner") {
        return res.status(403).json({ message: "Solo los propietarios y administradores pueden crear condominios" });
      }

      // Check suggestion limits only for non-admin owners
      if (!isAdmin && userRole === "owner") {
        const todaySuggestions = await storage.getUserSuggestionsCount(userId, 'today');
        const totalSuggestions = await storage.getUserSuggestionsCount(userId, 'total');

        if (todaySuggestions >= 3) {
          return res.status(429).json({ 
            message: "Has alcanzado el límite de 3 sugerencias por día" 
          });
        }

        if (totalSuggestions >= 15) {
          return res.status(429).json({ 
            message: "Has alcanzado el límite de 15 sugerencias totales" 
          });
        }
      }
      
      // Validate request body with Zod
      const condominiumSchema = z.object({
        name: z.string().min(1, "El nombre del condominio es requerido"),
        colonyId: z.string().optional(),
        zone: z.string().optional(),
        address: z.string().optional(),
      });
      
      const validationResult = condominiumSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const { name, colonyId, zone, address } = validationResult.data;

      // Admins create directly as approved, owners create as pending
      const approvalStatus = isAdmin ? "approved" : "pending_review";

      // Create condominium
      const condominium = await storage.createCondominium({
        name,
        colonyId,
        zone,
        address,
        approvalStatus,
        requestedBy: userId,
      });

      await createAuditLog(
        req,
        "create",
        "condominium",
        condominium.id,
        isAdmin ? `Condominio creado: ${name}` : `Condominio solicitado: ${name}`
      );

      // Invalidate cache if admin created (auto-approved)
      if (isAdmin) {
        await cache.invalidate(CacheKeys.condominiumsApproved());
      }

      res.json(condominium);
    } catch (error) {
      console.error("Error creating condominium:", error);
      res.status(500).json({ message: "Failed to create condominium" });
    }
  });

  // Simplified endpoint to ensure condominium exists (create if needed)
  app.post("/api/condominiums/ensure", isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      let isAdmin: boolean;
      let userRole: string | null = null;

      // Check if it's an admin session
      if (req.session?.adminUser) {
        userId = req.session.adminUser.id;
        userRole = req.session.adminUser.role;
        isAdmin = ["master", "admin"].includes(userRole);
      } else {
        const user = await ensureUserExists(req);
        if (!user) {
          return res.status(401).json({ message: "Usuario no encontrado" });
        }
        userId = user.id;
        userRole = user.role;
        isAdmin = user.role === "master" || user.role === "admin" || user.additionalRole === "admin";
      }

      const { name } = req.body;
      if (!name || name.trim() === "") {
        return res.status(400).json({ message: "El nombre del condominio es requerido" });
      }

      // Search for existing condominium by exact name (case-insensitive)
      const existingCondo = await db
        .select()
        .from(condominiums)
        .where(sql`LOWER(${condominiums.name}) = LOWER(${name.trim()})`)
        .limit(1);

      if (existingCondo.length > 0) {
        return res.json(existingCondo[0]);
      }

      // Create new condominium
      const approvalStatus = isAdmin ? "approved" : "pending_review";
      const newCondo = await storage.createCondominium({
        name: name.trim(),
        approvalStatus,
        requestedBy: userId,
      });

      await createAuditLog(
        req,
        "create",
        "condominium",
        newCondo.id,
        isAdmin ? `Condominio creado: ${name}` : `Condominio solicitado: ${name}`
      );

      // Invalidate cache if admin created (auto-approved)
      if (isAdmin) {
        await cache.invalidate(CacheKeys.condominiumsApproved());
      }

      res.json(newCondo);
    } catch (error) {
      console.error("Error ensuring condominium:", error);
      res.status(500).json({ message: "Failed to ensure condominium exists" });
    }
  });

  app.patch("/api/admin/condominiums/:id/approve", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      // Validate condominium exists
      const existingCondominium = await storage.getCondominium(id);
      if (!existingCondominium) {
        return res.status(404).json({ message: "Condominio no encontrado" });
      }

      // Update name if provided
      if (name && name.trim() !== "" && name !== existingCondominium.name) {
        await storage.updateCondominium(id, { name: name.trim() });
      }

      const condominium = await storage.updateCondominiumStatus(id, "approved");
      
      await createAuditLog(
        req,
        "approve",
        "condominium",
        id,
        `Condominio aprobado: ${condominium.name}`
      );

      // Invalidate cache after approval
      await cache.invalidate(CacheKeys.condominiumsApproved());

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
        colonyId: z.string().optional(),
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

      // Invalidate cache after update
      await cache.invalidate(CacheKeys.condominiumsApproved());

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

      // Invalidate cache after toggle
      await cache.invalidate(CacheKeys.condominiumsApproved());

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
      
      // Invalidate cache after deletion
      await cache.invalidate(CacheKeys.condominiumsApproved());
      
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

  // Public endpoint to get units for a condominium
  app.get("/api/condominiums/:condominiumId/units", async (req, res) => {
    try {
      const { condominiumId } = req.params;
      
      const units = await db
        .select()
        .from(condominiumUnits)
        .where(eq(condominiumUnits.condominiumId, condominiumId));

      res.json(units);
    } catch (error) {
      console.error("Error fetching units:", error);
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  // Simplified endpoint to ensure unit exists (create if needed)
  app.post("/api/condominiums/:condominiumId/units/ensure", isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      let isAdmin: boolean;
      let userRole: string | null = null;

      // Check if it's an admin session
      if (req.session?.adminUser) {
        userId = req.session.adminUser.id;
        userRole = req.session.adminUser.role;
        isAdmin = ["master", "admin"].includes(userRole);
      } else {
        const user = await ensureUserExists(req);
        if (!user) {
          return res.status(401).json({ message: "Usuario no encontrado" });
        }
        userId = user.id;
        userRole = user.role;
        isAdmin = user.role === "master" || user.role === "admin" || user.additionalRole === "admin";
      }

      const { condominiumId } = req.params;
      const { unitNumber } = req.body;

      if (!unitNumber || unitNumber.trim() === "") {
        return res.status(400).json({ message: "El número de unidad es requerido" });
      }

      // Search for existing unit in this condominium with exact unit number
      const existingUnit = await db
        .select()
        .from(condominiumUnits)
        .where(
          and(
            eq(condominiumUnits.condominiumId, condominiumId),
            sql`LOWER(${condominiumUnits.unitNumber}) = LOWER(${unitNumber.trim()})`
          )
        )
        .limit(1);

      if (existingUnit.length > 0) {
        return res.json(existingUnit[0]);
      }

      // Create new unit
      const newUnit = await storage.createCondominiumUnit({
        condominiumId,
        unitNumber: unitNumber.trim(),
      });

      await createAuditLog(
        req,
        "create",
        "condominium_unit",
        newUnit.id,
        `Unidad creada: ${unitNumber} en condominio ${condominiumId}`
      );

      res.json(newUnit);
    } catch (error) {
      console.error("Error ensuring unit:", error);
      res.status(500).json({ message: "Failed to ensure unit exists" });
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

  // Property Owner Terms routes
  app.get("/api/property-owner-terms", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const terms = await storage.getAllPropertyOwnerTerms();
      res.json(terms);
    } catch (error) {
      console.error("Error fetching property owner terms:", error);
      res.status(500).json({ message: "Error al obtener términos y condiciones" });
    }
  });

  app.get("/api/property-owner-terms/active", async (req, res) => {
    try {
      const terms = await storage.getActivePropertyOwnerTerms();
      res.json(terms);
    } catch (error) {
      console.error("Error fetching active property owner terms:", error);
      res.status(500).json({ message: "Error al obtener términos activos" });
    }
  });

  app.get("/api/property-owner-terms/:id", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const term = await storage.getPropertyOwnerTerm(id);
      
      if (!term) {
        return res.status(404).json({ message: "Término no encontrado" });
      }
      
      res.json(term);
    } catch (error) {
      console.error("Error fetching property owner term:", error);
      res.status(500).json({ message: "Error al obtener término" });
    }
  });

  app.post("/api/property-owner-terms", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { title, titleEn, content, contentEn, orderIndex, isActive } = req.body;
      
      if (!title || !titleEn || !content || !contentEn) {
        return res.status(400).json({ message: "Todos los campos son requeridos" });
      }
      
      const userId = req.user.claims.sub;
      const term = await storage.createPropertyOwnerTerm({
        title,
        titleEn,
        content,
        contentEn,
        orderIndex: orderIndex || 0,
        isActive: isActive !== undefined ? isActive : true,
        updatedBy: userId,
      });
      
      await createAuditLog(req, "create", "property_owner_terms", term.id, `Término creado: ${title}`);
      
      res.status(201).json(term);
    } catch (error: any) {
      console.error("Error creating property owner term:", error);
      res.status(400).json({ message: error.message || "Error al crear término" });
    }
  });

  app.patch("/api/property-owner-terms/:id", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { title, titleEn, content, contentEn, orderIndex, isActive } = req.body;
      
      const userId = req.user.claims.sub;
      const updates: any = { updatedBy: userId };
      
      if (title !== undefined) updates.title = title;
      if (titleEn !== undefined) updates.titleEn = titleEn;
      if (content !== undefined) updates.content = content;
      if (contentEn !== undefined) updates.contentEn = contentEn;
      if (orderIndex !== undefined) updates.orderIndex = orderIndex;
      if (isActive !== undefined) updates.isActive = isActive;
      
      const term = await storage.updatePropertyOwnerTerm(id, updates);
      
      await createAuditLog(req, "update", "property_owner_terms", id, `Término actualizado: ${term.title}`);
      
      res.json(term);
    } catch (error: any) {
      console.error("Error updating property owner term:", error);
      res.status(400).json({ message: error.message || "Error al actualizar término" });
    }
  });

  app.delete("/api/property-owner-terms/:id", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      await storage.deletePropertyOwnerTerm(id);
      
      await createAuditLog(req, "delete", "property_owner_terms", id, `Término eliminado`);
      
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting property owner term:", error);
      res.status(400).json({ message: error.message || "Error al eliminar término" });
    }
  });

  // Amenity routes
  app.get("/api/amenities", async (req, res) => {
    try {
      const { category, approvalStatus } = req.query;
      const filters: any = {};
      if (category) filters.category = category;
      if (approvalStatus) filters.approvalStatus = approvalStatus;
      
      // Only cache if no filters (full amenities list)
      const shouldCache = !category && !approvalStatus;
      const cacheKey = CacheKeys.amenities();
      
      if (shouldCache) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          return res.json(cached);
        }
      }
      
      const amenities = await storage.getAmenities(filters);
      
      // Store in cache only if no filters
      if (shouldCache) {
        await cache.set(cacheKey, amenities, CacheTTL.STATIC);
      }
      
      res.json(amenities);
    } catch (error) {
      console.error("Error fetching amenities:", error);
      res.status(500).json({ message: "Failed to fetch amenities" });
    }
  });

  app.get("/api/amenities/approved", async (req, res) => {
    try {
      const { category } = req.query;
      const amenities = await storage.getApprovedAmenities(category as string | undefined);
      res.json(amenities);
    } catch (error) {
      console.error("Error fetching approved amenities:", error);
      res.status(500).json({ message: "Failed to fetch approved amenities" });
    }
  });

  app.post("/api/amenities", isAuthenticated, async (req: any, res) => {
    try {
      let userId: string;
      let isAdmin: boolean;
      let userRole: string | null = null;

      // Check if it's an admin session (from admin_users table)
      if (req.session?.adminUser) {
        userId = req.session.adminUser.id;
        userRole = req.session.adminUser.role;
        isAdmin = ["master", "admin"].includes(userRole);
      } else {
        // Regular user from Replit Auth
        const user = await ensureUserExists(req);
        if (!user) {
          return res.status(401).json({ message: "Usuario no encontrado" });
        }
        userId = user.id;
        userRole = user.role;
        isAdmin = user.role === "master" || user.role === "admin" || user.additionalRole === "admin";
      }
      
      // Admins can create directly, owners need to suggest with limits
      if (!isAdmin && userRole !== "owner") {
        return res.status(403).json({ message: "Solo los propietarios y administradores pueden crear amenidades" });
      }

      // Check suggestion limits only for non-admin owners
      if (!isAdmin && userRole === "owner") {
        const todaySuggestions = await storage.getUserSuggestionsCount(userId, 'today');
        const totalSuggestions = await storage.getUserSuggestionsCount(userId, 'total');

        if (todaySuggestions >= 3) {
          return res.status(429).json({ 
            message: "Has alcanzado el límite de 3 sugerencias por día" 
          });
        }

        if (totalSuggestions >= 15) {
          return res.status(429).json({ 
            message: "Has alcanzado el límite de 15 sugerencias totales" 
          });
        }
      }
      
      // Validate request body with Zod
      const amenitySchema = z.object({
        name: z.string().min(1, "El nombre de la amenidad es requerido"),
        category: z.enum(["property", "condo"], { errorMap: () => ({ message: "La categoría debe ser 'property' o 'condo'" }) }),
      });
      
      const validationResult = amenitySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const { name, category } = validationResult.data;

      // Admins create directly as approved, owners create as pending
      const approvalStatus = isAdmin ? "approved" : "pending_review";

      // Create amenity
      const amenity = await storage.createAmenity({
        name,
        category,
        approvalStatus,
        requestedBy: userId,
      });

      await createAuditLog(
        req,
        "create",
        "amenity",
        amenity.id,
        isAdmin ? `Amenidad creada: ${name} (${category})` : `Amenidad solicitada: ${name} (${category})`
      );

      // Invalidate cache if admin created (auto-approved)
      if (isAdmin) {
        await cache.invalidate(CacheKeys.amenities());
      }

      res.json(amenity);
    } catch (error) {
      console.error("Error creating amenity:", error);
      res.status(500).json({ message: "Failed to create amenity" });
    }
  });

  app.patch("/api/admin/amenities/:id/approve", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const existingAmenity = await storage.getAmenity(id);
      if (!existingAmenity) {
        return res.status(404).json({ message: "Amenidad no encontrada" });
      }

      // Update name if provided
      if (name && name.trim() !== "" && name !== existingAmenity.name) {
        await storage.updateAmenity(id, { name: name.trim() });
      }

      const amenity = await storage.updateAmenityStatus(id, "approved");
      
      await createAuditLog(
        req,
        "approve",
        "amenity",
        id,
        `Amenidad aprobada: ${amenity.name}`
      );

      // Invalidate cache after approving amenity
      await cache.invalidate(CacheKeys.amenities());

      res.json(amenity);
    } catch (error) {
      console.error("Error approving amenity:", error);
      res.status(500).json({ message: "Failed to approve amenity" });
    }
  });

  app.patch("/api/admin/amenities/:id/reject", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      const existingAmenity = await storage.getAmenity(id);
      if (!existingAmenity) {
        return res.status(404).json({ message: "Amenidad no encontrada" });
      }

      const amenity = await storage.updateAmenityStatus(id, "rejected");
      
      await createAuditLog(
        req,
        "reject",
        "amenity",
        id,
        `Amenidad rechazada: ${amenity.name}`
      );

      // Invalidate cache after rejecting amenity (removes from approved list)
      await cache.invalidate(CacheKeys.amenities());

      res.json(amenity);
    } catch (error) {
      console.error("Error rejecting amenity:", error);
      res.status(500).json({ message: "Failed to reject amenity" });
    }
  });

  app.put("/api/admin/amenities/:id", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body with Zod
      const amenitySchema = z.object({
        name: z.string().min(1, "El nombre de la amenidad es requerido"),
        category: z.enum(["property", "condo"]).optional(),
      });
      
      const validationResult = amenitySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const existingAmenity = await storage.getAmenity(id);
      if (!existingAmenity) {
        return res.status(404).json({ message: "Amenidad no encontrada" });
      }

      const amenity = await storage.updateAmenity(id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "amenity",
        amenity.id,
        `Amenidad actualizada: ${amenity.name}`
      );

      // Invalidate cache after updating amenity
      await cache.invalidate(CacheKeys.amenities());

      res.json(amenity);
    } catch (error) {
      console.error("Error updating amenity:", error);
      res.status(500).json({ message: "Failed to update amenity" });
    }
  });

  app.delete("/api/admin/amenities/:id", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      const existingAmenity = await storage.getAmenity(id);
      if (!existingAmenity) {
        return res.status(404).json({ message: "Amenidad no encontrada" });
      }

      await createAuditLog(
        req,
        "delete",
        "amenity",
        id,
        `Amenidad eliminada: ${existingAmenity.name}`
      );

      await storage.deleteAmenity(id);
      
      // Invalidate cache after deleting amenity
      await cache.invalidate(CacheKeys.amenities());
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting amenity:", error);
      res.status(500).json({ message: "Failed to delete amenity" });
    }
  });

  // Property Features routes
  app.get("/api/property-features", async (req, res) => {
    try {
      const { active } = req.query;
      const filters: any = {};
      if (active !== undefined) filters.active = active === "true";
      
      // Only cache if no filters (all property features)
      const shouldCache = active === undefined;
      const cacheKey = CacheKeys.propertyFeatures();
      
      if (shouldCache) {
        const cached = await cache.get(cacheKey);
        if (cached) {
          return res.json(cached);
        }
      }
      
      const features = await storage.getPropertyFeatures(filters);
      
      // Store in cache only if no filters
      if (shouldCache) {
        await cache.set(cacheKey, features, CacheTTL.STATIC);
      }
      
      res.json(features);
    } catch (error) {
      console.error("Error fetching property features:", error);
      res.status(500).json({ message: "Failed to fetch property features" });
    }
  });

  app.post("/api/property-features", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      // Validate request body with Zod
      const featureSchema = z.object({
        name: z.string().min(1, "El nombre es requerido"),
        icon: z.string().optional(),
        active: z.boolean().optional().default(true),
      });
      
      const validationResult = featureSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const feature = await storage.createPropertyFeature(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "property_feature",
        feature.id,
        `Característica creada: ${feature.name}`
      );

      // Invalidate cache after creating property feature
      await cache.invalidate(CacheKeys.propertyFeatures());

      res.json(feature);
    } catch (error) {
      console.error("Error creating property feature:", error);
      res.status(500).json({ message: "Failed to create property feature" });
    }
  });

  app.put("/api/property-features/:id", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body with Zod
      const featureSchema = z.object({
        name: z.string().min(1, "El nombre es requerido").optional(),
        icon: z.string().optional(),
        active: z.boolean().optional(),
      });
      
      const validationResult = featureSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const existingFeature = await storage.getPropertyFeature(id);
      if (!existingFeature) {
        return res.status(404).json({ message: "Característica no encontrada" });
      }

      const feature = await storage.updatePropertyFeature(id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "property_feature",
        feature.id,
        `Característica actualizada: ${feature.name}`
      );

      res.json(feature);
    } catch (error) {
      console.error("Error updating property feature:", error);
      res.status(500).json({ message: "Failed to update property feature" });
    }
  });

  app.delete("/api/property-features/:id", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;

      const existingFeature = await storage.getPropertyFeature(id);
      if (!existingFeature) {
        return res.status(404).json({ message: "Característica no encontrada" });
      }

      await createAuditLog(
        req,
        "delete",
        "property_feature",
        id,
        `Característica eliminada: ${existingFeature.name}`
      );

      await storage.deletePropertyFeature(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting property feature:", error);
      res.status(500).json({ message: "Failed to delete property feature" });
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
        allowsSubleasing,
        limit
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
      if (limit) {
        filters.limit = parseInt(limit as string);
      }

      // Only show published properties in public search (home and search pages) for non-authenticated users
      // Authenticated users (especially admin) can see all properties
      const isUserAuthenticated = req.user || (req.session && (req.session.adminUser || req.session.userId));
      if (!isUserAuthenticated) {
        // Force published = true for non-authenticated users
        filters.published = true;
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

      // Check property limit for owners (admins bypass this check)
      const isAdmin = ["master", "admin", "admin_jr"].includes(user.role);
      const targetOwnerId = propertyData.ownerId;
      const targetOwner = await storage.getUser(targetOwnerId);
      
      if (targetOwner && targetOwner.role === "owner" && !isAdmin) {
        const currentPropertyCount = await storage.getUserPropertyCount(targetOwnerId);
        const propertyLimit = targetOwner.propertyLimit || 3;
        
        if (currentPropertyCount >= propertyLimit) {
          return res.status(403).json({
            message: "Has alcanzado tu límite de propiedades",
            currentCount: currentPropertyCount,
            limit: propertyLimit,
            canRequestIncrease: true,
          });
        }
      }
      
      const property = await storage.createProperty(propertyData);
      
      // Log property creation
      await createAuditLog(
        req,
        "create",
        "property",
        property.id,
        `Propiedad creada: ${getPropertyTitle(property)} - ${property.location}`
      );
      
      res.status(201).json(property);
    } catch (error: any) {
      return handleGenericError(res, error, "al crear la propiedad");
    }
  });

  app.patch("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Handle both admin and regular user sessions
      let isAuthorized = false;
      
      if (req.session?.adminUser) {
        // Admin user session - check admin privileges
        const adminRole = req.session.adminUser.role;
        isAuthorized = ["master", "admin", "admin_jr"].includes(adminRole);
      } else if (req.user?.claims?.sub) {
        // Regular user session
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (user) {
          // User can edit if they own the property or have admin privileges
          isAuthorized = property.ownerId === userId || ["master", "admin", "admin_jr"].includes(user.role);
        }
      }

      if (!isAuthorized) {
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
        `Propiedad actualizada: ${getPropertyTitle(updatedProperty)}`
      );
      
      res.json(updatedProperty);
    } catch (error: any) {
      return handleGenericError(res, error, "al actualizar la propiedad");
    }
  });

  app.delete("/api/properties/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Check if this is a draft ID (format: draft-{uuid})
      if (id.startsWith('draft-')) {
        const draftId = id.substring(6); // Remove 'draft-' prefix
        const draft = await storage.getPropertySubmissionDraft(draftId);

        if (!draft) {
          return res.status(404).json({ message: "Draft not found" });
        }

        // Check authorization for draft deletion
        let isAuthorized = false;
        
        if (req.session?.adminUser) {
          // Admin user session - check admin privileges (only master and admin can delete)
          const adminRole = req.session.adminUser.role;
          isAuthorized = ["master", "admin"].includes(adminRole);
        } else if (req.user?.claims?.sub) {
          // Regular user session
          const userId = req.user.claims.sub;
          const user = await storage.getUser(userId);
          
          if (user) {
            // User can delete if they own the draft or have admin privileges
            isAuthorized = draft.userId === userId || ["master", "admin"].includes(user.role);
          }
        }

        if (!isAuthorized) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Log draft deletion
        await createAuditLog(
          req,
          "delete",
          "property-draft",
          draftId,
          `Borrador de propiedad eliminado: ${draft.basicInfo?.name || 'Sin nombre'}`
        );

        await storage.deletePropertySubmissionDraft(draftId);
        res.status(204).send();
        return;
      }
      
      // Handle regular property deletion
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Handle both admin and regular user sessions
      let isAuthorized = false;
      
      if (req.session?.adminUser) {
        // Admin user session - check admin privileges (only master and admin can delete)
        const adminRole = req.session.adminUser.role;
        isAuthorized = ["master", "admin"].includes(adminRole);
      } else if (req.user?.claims?.sub) {
        // Regular user session
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (user) {
          // User can delete if they own the property or have admin privileges
          isAuthorized = property.ownerId === userId || ["master", "admin"].includes(user.role);
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Log property deletion (before deletion to capture details)
      await createAuditLog(
        req,
        "delete",
        "property",
        id,
        `Propiedad eliminada: ${getPropertyTitle(property)} - ${property.location}`
      );

      await storage.deleteProperty(id);
      res.status(204).send();
    } catch (error: any) {
      return handleGenericError(res, error, "al eliminar la propiedad");
    }
  });

  // Property Documents endpoints
  
  // Get documents for a property
  app.get("/api/properties/:propertyId/documents", isAuthenticated, async (req: any, res) => {
    try {
      const { propertyId } = req.params;
      const { category } = req.query;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }
      
      // Only owner, assigned staff, or admin can view documents
      const isOwner = property.ownerId === userId;
      const isAdmin = user && ["master", "admin", "admin_jr"].includes(user.role);
      const isAssignedStaff = user && await storage.isStaffAssignedToProperty(propertyId, userId);
      
      if (!isOwner && !isAdmin && !isAssignedStaff) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      const documents = await storage.getPropertyDocuments(propertyId, category);
      res.json(documents);
    } catch (error: any) {
      console.error("Error fetching property documents:", error);
      res.status(500).json({ message: "Error al obtener documentos" });
    }
  });

  // Upload document for a property
  app.post("/api/properties/:propertyId/documents", isAuthenticated, async (req: any, res) => {
    try {
      const { propertyId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }
      
      // Only owner or admin can upload documents
      if (property.ownerId !== userId && !["master", "admin", "admin_jr"].includes(user?.role || "")) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const { documentType, category } = req.body;

      // Validate that documentType matches category
      const personaMoralOnlyTypes = ['acta_constitutiva'];
      const personaFisicaTypes = ['ife_ine_frente', 'ife_ine_reverso', 'pasaporte', 'legal_estancia', 'escrituras', 
                                    'contrato_compraventa', 'fideicomiso', 'recibo_agua', 'recibo_luz', 
                                    'recibo_internet', 'comprobante_no_adeudo'];
      const optionalTypes = ['reglas_internas', 'reglamento_condominio'];

      if (personaMoralOnlyTypes.includes(documentType) && category !== 'persona_moral') {
        return res.status(400).json({ 
          message: `El documento ${documentType} solo puede ser de categoría persona_moral` 
        });
      }

      if (optionalTypes.includes(documentType) && category !== 'optional') {
        return res.status(400).json({ 
          message: `El documento ${documentType} debe ser de categoría optional` 
        });
      }

      // If category is persona_moral but documentType is not acta_constitutiva, it's still valid
      // (persona_moral needs same docs as persona_fisica PLUS acta_constitutiva)

      const documentData = {
        ...req.body,
        propertyId,
      };

      const document = await storage.createPropertyDocument(documentData);
      
      await createAuditLog(
        req,
        "create",
        "property_document",
        document.id,
        `Documento subido: ${document.documentType} para propiedad ${propertyId}`
      );
      
      res.status(201).json(document);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Error al subir documento" });
    }
  });

  // Validate document (admin only)
  app.patch("/api/property-documents/:id/validate", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { validationNotes } = req.body;
      const userId = req.user.claims.sub;

      const document = await storage.validatePropertyDocument(id, userId, validationNotes);
      
      await createAuditLog(
        req,
        "update",
        "property_document",
        id,
        `Documento validado: ${document.documentType}`
      );
      
      res.json(document);
    } catch (error: any) {
      console.error("Error validating document:", error);
      res.status(500).json({ message: "Error al validar documento" });
    }
  });

  // Delete document
  app.delete("/api/property-documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const document = await storage.getPropertyDocument(id);
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }
      
      const property = await storage.getProperty(document.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }
      
      // Only owner or admin can delete documents
      if (property.ownerId !== userId && !["master", "admin", "admin_jr"].includes(user?.role || "")) {
        return res.status(403).json({ message: "No autorizado" });
      }

      await createAuditLog(
        req,
        "delete",
        "property_document",
        id,
        `Documento eliminado: ${document.documentType}`
      );

      await storage.deletePropertyDocument(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Error al eliminar documento" });
    }
  });

  // Check if property documents are complete
  app.get("/api/properties/:propertyId/documents/check", isAuthenticated, async (req: any, res) => {
    try {
      const { propertyId } = req.params;
      
      const status = await storage.checkPropertyDocumentsComplete(propertyId);
      res.json(status);
    } catch (error: any) {
      console.error("Error checking documents:", error);
      res.status(500).json({ message: "Error al verificar documentos" });
    }
  });

  // Admin route to reassign property owner
  app.patch("/api/properties/:id/reassign-owner", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { newOwnerId } = req.body;

      if (!newOwnerId) {
        return res.status(400).json({ message: "newOwnerId is required" });
      }

      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const newOwner = await storage.getUser(newOwnerId);
      if (!newOwner) {
        return res.status(404).json({ message: "New owner not found" });
      }

      if (!["owner", "seller"].includes(newOwner.role)) {
        return res.status(400).json({ message: "New owner must have 'owner' or 'seller' role" });
      }

      const previousOwnerId = property.ownerId;
      const updatedProperty = await storage.updateProperty(id, { ownerId: newOwnerId });

      // Log property owner reassignment
      await createAuditLog(
        req,
        "assign",
        "property",
        id,
        `Propietario reasignado de ${previousOwnerId} a ${newOwnerId} - ${updatedProperty.title}`
      );

      res.json(updatedProperty);
    } catch (error: any) {
      return handleGenericError(res, error, "al reasignar el propietario de la propiedad");
    }
  });

  // Owner route to change property status (suspend, rent, activate)
  app.patch("/api/properties/:id/owner-status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { ownerStatus } = req.body;
      const userId = req.user.claims.sub;

      if (!ownerStatus || !["active", "suspended", "rented"].includes(ownerStatus)) {
        return res.status(400).json({ message: "Invalid ownerStatus. Must be: active, suspended, or rented" });
      }

      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can change the property status" });
      }

      const updateData: any = { ownerStatus };

      // If changing from suspended/rented to active, ALWAYS require admin approval again
      // This ensures security and quality control when properties come back online
      if ((property.ownerStatus === "suspended" || property.ownerStatus === "rented") && 
          ownerStatus === "active") {
        // Always downgrade to pending_review when reactivating, EXCEPT for:
        // - draft: still being worked on by owner
        // - pending: waiting for first review
        // - rejected: permanently rejected
        // - changes_requested: owner needs to make changes first
        const statusesToDowngrade = ["published", "approved", "pending_review"];
        if (statusesToDowngrade.includes(property.approvalStatus || "")) {
          updateData.approvalStatus = "pending_review";
          updateData.published = false;
        }
      }

      const updatedProperty = await storage.updateProperty(id, updateData);

      // Log status change
      await createAuditLog(
        req,
        "update",
        "property",
        id,
        `Estado de propiedad cambiado a ${ownerStatus} - ${getPropertyTitle(property)}`
      );

      res.json(updatedProperty);
    } catch (error: any) {
      return handleGenericError(res, error, "al cambiar el estado de la propiedad");
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

      // If email is provided instead of staffId, look up the user by email
      let staffId = req.body.staffId;
      if (req.body.email && !staffId) {
        const staffMember = await storage.getUserByEmail(req.body.email);
        if (!staffMember) {
          return res.status(404).json({ message: "Usuario no encontrado con ese email" });
        }
        staffId = staffMember.id;
      }

      const staffData = insertPropertyStaffSchema.parse({
        propertyId: id,
        staffId,
        role: req.body.role,
        assignedById: userId,
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

  // Get property access information - only for authorized personnel with confirmed appointments
  app.get("/api/properties/:id/access-info", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user has an authorized role
      const adminRoles = ["master", "admin", "admin_jr", "management"];
      const providerRoles = ["provider"]; // maintenance/service personnel - no appointment check needed
      const conciergeRole = "concierge";
      
      const isAdminRole = adminRoles.includes(user.role);
      const isProviderRole = providerRoles.includes(user.role);
      const isConcierge = user.role === conciergeRole;

      if (!isAdminRole && !isProviderRole && !isConcierge) {
        return res.status(403).json({ 
          message: "No tienes permisos para acceder a esta información" 
        });
      }

      // Only concierges need appointment verification
      if (isConcierge) {
        const appointments = await storage.getAppointments({
          propertyId: id,
        });

        const hasConfirmedAppointment = appointments.some(
          (apt: any) => 
            apt.conciergeId === userId && 
            apt.status === "confirmed"
        );

        if (!hasConfirmedAppointment) {
          return res.status(403).json({ 
            message: "Solo puedes acceder a la información de acceso si tienes una cita confirmada en esta propiedad" 
          });
        }
      }

      // Get property with access info
      const property = await storage.getProperty(id);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!property.accessInfo) {
        return res.status(404).json({ 
          message: "Esta propiedad no tiene información de acceso configurada" 
        });
      }

      // Return only the access info
      res.json({ 
        propertyId: property.id,
        propertyTitle: property.title,
        accessInfo: property.accessInfo 
      });

    } catch (error) {
      console.error("Error fetching property access info:", error);
      res.status(500).json({ message: "Failed to fetch property access info" });
    }
  });

  // Property Notes Routes (Internal Annotations for Admins/Sellers)
  app.get("/api/properties/:propertyId/notes", isAuthenticated, async (req: any, res) => {
    try {
      const { propertyId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Solo vendedores y administradores pueden ver anotaciones internas" });
      }

      const notes = await storage.getPropertyNotes(propertyId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching property notes:", error);
      res.status(500).json({ message: "Failed to fetch property notes" });
    }
  });

  app.post("/api/properties/:propertyId/notes", isAuthenticated, async (req: any, res) => {
    try {
      const { propertyId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Solo vendedores y administradores pueden crear anotaciones internas" });
      }

      const { content } = req.body;
      
      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "El contenido de la anotación es requerido" });
      }

      const note = await storage.createPropertyNote({
        propertyId,
        authorId: userId,
        content: content.trim(),
      });

      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating property note:", error);
      res.status(500).json({ message: "Failed to create property note" });
    }
  });

  app.delete("/api/properties/:propertyId/notes/:noteId", isAuthenticated, async (req: any, res) => {
    try {
      const { propertyId, noteId } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const note = await storage.getPropertyNote(noteId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Only the author or admin can delete
      if (note.authorId !== userId && !["admin", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Solo el autor o un administrador pueden eliminar esta anotación" });
      }

      await storage.deletePropertyNote(noteId);
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting property note:", error);
      res.status(500).json({ message: "Failed to delete property note" });
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

      // Get actual properties where user is owner
      const properties = await storage.getProperties({ ownerId: userId });
      
      // Also get submitted/approved drafts that haven't been converted to properties yet
      const drafts = await storage.getPropertySubmissionDrafts({ 
        userId, 
        status: "submitted" 
      });
      
      // Convert drafts to property-like objects with draft flag
      const draftProperties = drafts.map(draft => ({
        id: `draft-${draft.id}`,
        isDraft: true,
        draftId: draft.id,
        condoName: draft.basicInfo?.title || "Propiedad sin título",
        description: draft.basicInfo?.description || "",
        propertyType: draft.basicInfo?.propertyType || "house",
        price: draft.basicInfo?.price || draft.basicInfo?.rentPrice || draft.basicInfo?.salePrice || "0",
        currency: draft.basicInfo?.currency || "MXN",
        bedrooms: draft.details?.bedrooms || 0,
        bathrooms: draft.details?.bathrooms || 0,
        area: draft.details?.area || 0,
        location: draft.locationInfo?.address || draft.locationInfo?.city || "",
        images: draft.media?.images || [],
        primaryImages: draft.media?.primaryImages || [],
        coverImageIndex: draft.media?.coverImageIndex || 0,
        ownerId: draft.userId,
        approvalStatus: "pending_review", // Drafts submitted are pending approval
        ownerStatus: "active",
        published: false,
        active: false,
        status: draft.isForRent ? (draft.isForSale ? "both" : "rent") : "sale",
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      }));
      
      // Combine real properties and draft properties
      const allProperties = [...properties, ...draftProperties];
      
      res.json(allProperties);
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
      
      console.log(`[APPROVE DEBUG] userId: ${userId}, property.ownerId: ${property?.ownerId}, user.role: ${user.role}`);
      
      if (!property || (property.ownerId !== userId && !["admin", "admin_jr", "master"].includes(user.role))) {
        console.log(`[APPROVE DEBUG] Permission denied - property exists: ${!!property}, userId matches: ${property?.ownerId === userId}, is admin: ${["admin", "admin_jr", "master"].includes(user.role)}`);
        return res.status(403).json({ message: "No tienes permisos para aprobar esta cita" });
      }

      // Update appointment approval status
      const updated = await storage.updateAppointment(id, {
        ownerApprovalStatus: "approved",
        ownerApprovedAt: new Date(),
        ownerApprovalNotes: req.body.notes,
      });

      await createAuditLog(
        req,
        "approve",
        "appointment",
        id,
        `Cita aprobada por propietario`
      );

      // Create notifications for concierge, client, and admin
      const notifications = [];
      
      // Notify concierge if assigned
      if (appointment.conciergeId) {
        notifications.push(
          storage.createNotification({
            userId: appointment.conciergeId,
            type: "appointment",
            title: "Cita Aprobada",
            message: `La cita para ${property.title} el ${new Date(appointment.date).toLocaleDateString()} ha sido aprobada por el propietario`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "medium",
          })
        );
      }
      
      // Notify client
      notifications.push(
        storage.createNotification({
          userId: appointment.clientId,
          type: "appointment",
          title: "Cita Aprobada",
          message: `Tu cita para ${property.title} el ${new Date(appointment.date).toLocaleDateString()} ha sido aprobada`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        })
      );
      
      // Notify admins
      const admins = await storage.getUsersByRole("admin");
      for (const admin of admins) {
        notifications.push(
          storage.createNotification({
            userId: admin.id,
            type: "appointment",
            title: "Cita Aprobada",
            message: `Cita para ${property.title} aprobada por propietario el ${new Date(appointment.date).toLocaleDateString()}`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "low",
          })
        );
      }
      
      // Create all notifications
      await Promise.all(notifications);

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
        ownerApprovalNotes: req.body.notes,
      });

      await createAuditLog(
        req,
        "reject",
        "appointment",
        id,
        `Cita rechazada por propietario`
      );

      // Create notifications
      const notifications = [];
      
      // Notify client
      notifications.push(
        storage.createNotification({
          userId: appointment.clientId,
          type: "appointment",
          title: "Cita Rechazada",
          message: `Tu cita para ${property.title} el ${new Date(appointment.date).toLocaleDateString()} ha sido rechazada`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        })
      );
      
      // Notify admins
      const admins = await storage.getUsersByRole("admin");
      for (const admin of admins) {
        notifications.push(
          storage.createNotification({
            userId: admin.id,
            type: "appointment",
            title: "Cita Rechazada",
            message: `Cita para ${property.title} rechazada por propietario el ${new Date(appointment.date).toLocaleDateString()}`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "low",
          })
        );
      }
      
      // Create all notifications
      await Promise.all(notifications);

      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting appointment:", error);
      res.status(500).json({ message: error.message || "Error al rechazar cita" });
    }
  });

  // Request reschedule for appointment (owner requests new date)
  app.patch("/api/owner/appointments/:id/request-reschedule", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rescheduleRequestedDate, rescheduleNotes } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !["owner", "seller", "admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      const property = await storage.getProperty(appointment.propertyId);
      
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Verify owner
      if (property.ownerId !== userId && !["admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "No eres el propietario de esta propiedad" });
      }

      // Update appointment with reschedule request
      const updated = await storage.updateAppointment(id, {
        rescheduleStatus: "requested",
        rescheduleRequestedDate: new Date(rescheduleRequestedDate),
        rescheduleNotes: rescheduleNotes || null,
      });

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `Solicitud de reprogramación enviada`
      );

      // Notify client about reschedule request
      const notifications: Promise<any>[] = [];
      
      notifications.push(
        storage.createNotification({
          userId: appointment.clientId,
          type: "appointment",
          title: "Solicitud de Reprogramación",
          message: `El propietario solicita reprogramar la cita del ${new Date(appointment.date).toLocaleDateString()} al ${new Date(rescheduleRequestedDate).toLocaleDateString()}`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        })
      );

      // Notify concierge if assigned
      if (appointment.conciergeId) {
        notifications.push(
          storage.createNotification({
            userId: appointment.conciergeId,
            type: "appointment",
            title: "Cita - Solicitud de Reprogramación",
            message: `Solicitud de reprogramación para ${property.title} del ${new Date(appointment.date).toLocaleDateString()} al ${new Date(rescheduleRequestedDate).toLocaleDateString()}`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "medium",
          })
        );
      }
      
      // Create all notifications
      await Promise.all(notifications);

      res.json(updated);
    } catch (error: any) {
      console.error("Error requesting reschedule:", error);
      res.status(500).json({ message: error.message || "Error al solicitar reprogramación" });
    }
  });

  // Approve reschedule request (client approves)
  app.post("/api/client/appointments/:id/approve-reschedule", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Verify client
      if (appointment.clientId !== userId) {
        return res.status(403).json({ message: "No eres el cliente de esta cita" });
      }

      // Verify reschedule request exists
      if (appointment.rescheduleStatus !== "requested" || !appointment.rescheduleRequestedDate) {
        return res.status(400).json({ message: "No hay solicitud de reprogramación pendiente" });
      }

      const property = await storage.getProperty(appointment.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Update appointment: approve reschedule and change date
      const updated = await storage.updateAppointment(id, {
        rescheduleStatus: "approved",
        date: appointment.rescheduleRequestedDate,
      });

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `Reprogramación aprobada por cliente`
      );

      // Notify owner about approval
      const notifications: Promise<any>[] = [];
      
      notifications.push(
        storage.createNotification({
          userId: property.ownerId,
          type: "appointment",
          title: "Reprogramación Aprobada",
          message: `El cliente aprobó la reprogramación de la cita para ${property.title} al ${new Date(appointment.rescheduleRequestedDate).toLocaleDateString()}`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        })
      );

      // Notify concierge if assigned
      if (appointment.conciergeId) {
        notifications.push(
          storage.createNotification({
            userId: appointment.conciergeId,
            type: "appointment",
            title: "Cita Reprogramada",
            message: `Cita para ${property.title} reprogramada al ${new Date(appointment.rescheduleRequestedDate).toLocaleDateString()}`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "medium",
          })
        );
      }
      
      // Create all notifications
      await Promise.all(notifications);

      res.json(updated);
    } catch (error: any) {
      console.error("Error approving reschedule:", error);
      res.status(500).json({ message: error.message || "Error al aprobar reprogramación" });
    }
  });

  // Reject reschedule request (client rejects - appointment gets cancelled)
  app.post("/api/client/appointments/:id/reject-reschedule", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Verify client
      if (appointment.clientId !== userId) {
        return res.status(403).json({ message: "No eres el cliente de esta cita" });
      }

      // Verify reschedule request exists
      if (appointment.rescheduleStatus !== "requested") {
        return res.status(400).json({ message: "No hay solicitud de reprogramación pendiente" });
      }

      const property = await storage.getProperty(appointment.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Update appointment: reject reschedule and cancel appointment
      const updated = await storage.updateAppointment(id, {
        rescheduleStatus: "rejected",
        status: "cancelled",
      });

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `Reprogramación rechazada por cliente - cita cancelada`
      );

      // Notify owner about rejection and cancellation
      const notifications: Promise<any>[] = [];
      
      notifications.push(
        storage.createNotification({
          userId: property.ownerId,
          type: "appointment",
          title: "Reprogramación Rechazada",
          message: `El cliente rechazó la reprogramación para ${property.title}. La cita ha sido cancelada.`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        })
      );

      // Notify concierge if assigned
      if (appointment.conciergeId) {
        notifications.push(
          storage.createNotification({
            userId: appointment.conciergeId,
            type: "appointment",
            title: "Cita Cancelada",
            message: `Cita para ${property.title} cancelada debido a rechazo de reprogramación`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "medium",
          })
        );
      }
      
      // Create all notifications
      await Promise.all(notifications);

      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting reschedule:", error);
      res.status(500).json({ message: error.message || "Error al rechazar reprogramación" });
    }
  });

  // Client requests reschedule for appointment (client requests new date)
  app.patch("/api/client/appointments/:id/request-reschedule", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rescheduleRequestedDate, rescheduleNotes } = req.body;
      const userId = req.user.claims.sub;
      
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Verify client
      if (appointment.clientId !== userId) {
        return res.status(403).json({ message: "No eres el cliente de esta cita" });
      }

      // Cannot reschedule cancelled or completed appointments
      if (appointment.status === "cancelled") {
        return res.status(400).json({ message: "No se puede reprogramar una cita cancelada" });
      }

      if (appointment.status === "completed") {
        return res.status(400).json({ message: "No se puede reprogramar una cita ya completada" });
      }

      // Cannot reschedule appointments that already passed
      const appointmentDate = new Date(appointment.date);
      if (appointmentDate < new Date()) {
        return res.status(400).json({ message: "No se puede reprogramar una cita que ya pasó" });
      }

      const property = await storage.getProperty(appointment.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Update appointment with reschedule request
      const updated = await storage.updateAppointment(id, {
        rescheduleStatus: "requested",
        rescheduleRequestedDate: new Date(rescheduleRequestedDate),
        rescheduleNotes: rescheduleNotes || null,
      });

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `Solicitud de reprogramación enviada por cliente`
      );

      // Notify owner about reschedule request
      const notifications: Promise<any>[] = [];
      
      notifications.push(
        storage.createNotification({
          userId: property.ownerId,
          type: "appointment",
          title: "Solicitud de Reprogramación",
          message: `El cliente solicita reprogramar la cita del ${new Date(appointment.date).toLocaleDateString()} al ${new Date(rescheduleRequestedDate).toLocaleDateString()}`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        })
      );

      // Notify concierge if assigned
      if (appointment.conciergeId) {
        notifications.push(
          storage.createNotification({
            userId: appointment.conciergeId,
            type: "appointment",
            title: "Cita - Solicitud de Reprogramación",
            message: `El cliente solicitó reprogramar la cita para ${property.title} del ${new Date(appointment.date).toLocaleDateString()} al ${new Date(rescheduleRequestedDate).toLocaleDateString()}`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "medium",
          })
        );
      }
      
      // Notify admins
      const admins = await storage.getUsersByRole("admin");
      for (const admin of admins) {
        notifications.push(
          storage.createNotification({
            userId: admin.id,
            type: "appointment",
            title: "Cita - Solicitud de Reprogramación",
            message: `Cliente solicitó reprogramar cita para ${property.title} del ${new Date(appointment.date).toLocaleDateString()} al ${new Date(rescheduleRequestedDate).toLocaleDateString()}`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "low",
          })
        );
      }
      
      // Create all notifications
      await Promise.all(notifications);

      res.json(updated);
    } catch (error: any) {
      console.error("Error requesting reschedule:", error);
      res.status(500).json({ message: error.message || "Error al solicitar reprogramación" });
    }
  });

  // Owner approves client reschedule request
  app.post("/api/owner/appointments/:id/approve-reschedule", isAuthenticated, async (req: any, res) => {
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

      const property = await storage.getProperty(appointment.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Verify owner
      if (property.ownerId !== userId && !["admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "No eres el propietario de esta propiedad" });
      }

      // Verify reschedule request exists
      if (appointment.rescheduleStatus !== "requested" || !appointment.rescheduleRequestedDate) {
        return res.status(400).json({ message: "No hay solicitud de reprogramación pendiente" });
      }

      // Update appointment: approve reschedule and change date
      const updated = await storage.updateAppointment(id, {
        rescheduleStatus: "approved",
        date: appointment.rescheduleRequestedDate,
      });

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `Reprogramación aprobada por propietario`
      );

      // Notify client about approval
      const notifications: Promise<any>[] = [];
      
      notifications.push(
        storage.createNotification({
          userId: appointment.clientId,
          type: "appointment",
          title: "Reprogramación Aprobada",
          message: `El propietario aprobó la reprogramación de tu cita para ${property.title} al ${new Date(appointment.rescheduleRequestedDate).toLocaleDateString()}`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        })
      );

      // Notify concierge if assigned
      if (appointment.conciergeId) {
        notifications.push(
          storage.createNotification({
            userId: appointment.conciergeId,
            type: "appointment",
            title: "Cita Reprogramada",
            message: `Cita para ${property.title} reprogramada al ${new Date(appointment.rescheduleRequestedDate).toLocaleDateString()}`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "medium",
          })
        );
      }
      
      // Create all notifications
      await Promise.all(notifications);

      res.json(updated);
    } catch (error: any) {
      console.error("Error approving reschedule:", error);
      res.status(500).json({ message: error.message || "Error al aprobar reprogramación" });
    }
  });

  // Owner rejects client reschedule request
  app.post("/api/owner/appointments/:id/reject-reschedule", isAuthenticated, async (req: any, res) => {
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

      const property = await storage.getProperty(appointment.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Verify owner
      if (property.ownerId !== userId && !["admin", "admin_jr", "master"].includes(user.role)) {
        return res.status(403).json({ message: "No eres el propietario de esta propiedad" });
      }

      // Verify reschedule request exists
      if (appointment.rescheduleStatus !== "requested") {
        return res.status(400).json({ message: "No hay solicitud de reprogramación pendiente" });
      }

      // Update appointment: reject reschedule (keep original date)
      const updated = await storage.updateAppointment(id, {
        rescheduleStatus: "rejected",
      });

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `Reprogramación rechazada por propietario`
      );

      // Notify client about rejection
      const notifications: Promise<any>[] = [];
      
      notifications.push(
        storage.createNotification({
          userId: appointment.clientId,
          type: "appointment",
          title: "Reprogramación Rechazada",
          message: `El propietario rechazó tu solicitud de reprogramación para ${property.title}. La cita se mantiene en la fecha original.`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        })
      );
      
      // Create all notifications
      await Promise.all(notifications);

      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting reschedule:", error);
      res.status(500).json({ message: error.message || "Error al rechazar reprogramación" });
    }
  });

  // Admin auto-approve appointments (bypass owner approval)
  app.patch("/api/admin/appointments/:id/auto-approve", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      const updated = await storage.updateAppointment(id, {
        ownerApprovalStatus: "approved",
        ownerApprovedAt: new Date(),
        status: "confirmed",
      });

      await createAuditLog(
        req,
        "approve",
        "appointment",
        id,
        `Cita auto-aprobada por administrador`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error auto-approving appointment:", error);
      res.status(500).json({ message: error.message || "Error al auto-aprobar cita" });
    }
  });

  // Get appointment with filtered information based on visit type and user role
  app.get("/api/appointments/:id/details", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Get property info
      const property = await storage.getProperty(appointment.propertyId);
      
      // Filter information based on visit type and user role
      let filteredAppointment: any = { ...appointment };
      
      if (appointment.visitType === "visita_cliente") {
        // For client visits, owner gets limited info
        if (user && ["owner", "seller"].includes(user.role)) {
          const client = await storage.getUser(appointment.clientId);
          const presentationCard = appointment.presentationCardId 
            ? await storage.getPresentationCard(appointment.presentationCardId)
            : null;

          filteredAppointment.client = {
            firstName: client?.firstName,
            lastName: client?.lastName,
            profileImageUrl: client?.profileImageUrl,
            presentationCard: presentationCard ? {
              name: presentationCard.name,
              jobTitle: presentationCard.jobTitle,
              company: presentationCard.company,
              bio: presentationCard.bio,
              profileImageUrl: presentationCard.profileImageUrl,
            } : null,
          };
          
          // Remove sensitive client info
          delete filteredAppointment.client?.email;
          delete filteredAppointment.client?.phone;
        }
      } else {
        // For other visit types (maintenance, cleaning, etc.), show full staff info
        if (appointment.staffMemberId) {
          const staffMember = await storage.getUser(appointment.staffMemberId);
          filteredAppointment.staffMember = {
            id: staffMember?.id,
            name: appointment.staffMemberName,
            position: appointment.staffMemberPosition,
            company: appointment.staffMemberCompany,
            whatsapp: appointment.staffMemberWhatsapp,
            email: staffMember?.email,
          };
        }
      }

      // Add property info with condominium and unit details
      if (property) {
        let condoInfo = null;
        if (property.condominiumId) {
          const condo = await storage.getCondominium(property.condominiumId);
          condoInfo = condo;
        }

        filteredAppointment.property = {
          ...property,
          condominium: condoInfo,
        };
      }

      // Add concierge info if available
      if (appointment.conciergeId) {
        const concierge = await storage.getUser(appointment.conciergeId);
        if (concierge) {
          filteredAppointment.concierge = {
            id: concierge.id,
            firstName: concierge.firstName,
            lastName: concierge.lastName,
            email: concierge.email,
            phone: concierge.phone,
            profileImageUrl: concierge.profileImageUrl,
          };
        }
      }

      res.json(filteredAppointment);
    } catch (error: any) {
      console.error("Error fetching appointment details:", error);
      res.status(500).json({ message: error.message || "Error al obtener detalles de cita" });
    }
  });

  // Submit feedback for appointment
  app.patch("/api/appointments/:id/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { feedbackType, feedback } = req.body;
      const userId = req.user.claims.sub;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Validate feedback type
      if (!["client", "staff"].includes(feedbackType)) {
        return res.status(400).json({ message: "Tipo de feedback inválido" });
      }

      let updates: any = {};

      if (feedbackType === "client") {
        // Client feedback - must be the client for this appointment
        if (appointment.clientId !== userId) {
          return res.status(403).json({ message: "No tienes permisos para dejar feedback en esta cita" });
        }
        
        // Validate feedback structure for client (predefined options only)
        if (!feedback || typeof feedback !== "object") {
          return res.status(400).json({ message: "Feedback de cliente debe ser un objeto con opciones predefinidas" });
        }

        updates.clientFeedback = feedback;
      } else if (feedbackType === "staff") {
        // Staff feedback - must be the staff member or concierge
        if (appointment.staffMemberId !== userId && appointment.conciergeId !== userId) {
          return res.status(403).json({ message: "No tienes permisos para dejar feedback en esta cita" });
        }

        updates.staffFeedback = feedback;
      }

      const updated = await storage.updateAppointment(id, updates);

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `Feedback ${feedbackType} agregado a la cita`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: error.message || "Error al enviar feedback" });
    }
  });

  // Send access credentials for appointment
  app.patch("/api/appointments/:id/send-credentials", isAuthenticated, requireRole(["master", "admin", "admin_jr", "management"]), async (req: any, res) => {
    try {
      const { id } = req.params;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      const updated = await storage.updateAppointment(id, {
        accessCredentialsSent: true,
      });

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `Credenciales de acceso enviadas para la cita`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error sending credentials:", error);
      res.status(500).json({ message: error.message || "Error al enviar credenciales" });
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

  // Admin Rental Opportunity Request routes
  app.get("/api/admin/rental-opportunity-requests", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const { status } = req.query;
      
      const allRequests = await storage.getAllRentalOpportunityRequests();
      let requests = allRequests;
      
      if (status) {
        requests = requests.filter(r => r.status === status);
      }
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching rental opportunity requests:", error);
      res.status(500).json({ message: "Error al obtener solicitudes de oportunidad" });
    }
  });

  app.get("/api/admin/rental-opportunity-requests/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const { id } = req.params;
      const request = await storage.getRentalOpportunityRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error fetching rental opportunity request:", error);
      res.status(500).json({ message: "Error al obtener solicitud" });
    }
  });

  app.patch("/api/admin/rental-opportunity-requests/:id/approve", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user?.claims?.sub || req.session?.adminUser?.id;
      
      const request = await storage.getRentalOpportunityRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ 
          message: "Esta solicitud ya fue procesada" 
        });
      }

      const updated = await storage.approveRentalOpportunityRequest(id, adminId);

      // Get property details for notification
      const property = await storage.getProperty(request.propertyId);
      
      // Notify client
      await storage.createNotification({
        userId: request.clientId,
        type: "opportunity",
        title: "Solicitud de Oportunidad Aprobada",
        message: `Tu solicitud para crear una oferta de renta para ${property?.title || 'la propiedad'} ha sido aprobada. Ahora puedes crear tu oferta.`,
        relatedEntityType: "rental_opportunity_request",
        relatedEntityId: request.id,
        priority: "high",
      });

      await createAuditLog(
        req,
        "approve",
        "rental_opportunity_request",
        id,
        `Solicitud de oportunidad de renta aprobada para propiedad ${request.propertyId}`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error approving rental opportunity request:", error);
      res.status(500).json({ message: error.message || "Error al aprobar solicitud" });
    }
  });

  app.patch("/api/admin/rental-opportunity-requests/:id/reject", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const adminId = req.user?.claims?.sub || req.session?.adminUser?.id;

      if (!rejectionReason) {
        return res.status(400).json({ message: "La razón de rechazo es requerida" });
      }
      
      const request = await storage.getRentalOpportunityRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ 
          message: "Esta solicitud ya fue procesada" 
        });
      }

      const updated = await storage.rejectRentalOpportunityRequest(id, adminId, rejectionReason);

      // Get property details for notification
      const property = await storage.getProperty(request.propertyId);
      
      // Notify client
      await storage.createNotification({
        userId: request.clientId,
        type: "opportunity",
        title: "Solicitud de Oportunidad Rechazada",
        message: `Tu solicitud para crear una oferta de renta para ${property?.title || 'la propiedad'} ha sido rechazada. Razón: ${rejectionReason}`,
        relatedEntityType: "rental_opportunity_request",
        relatedEntityId: request.id,
        priority: "high",
      });

      await createAuditLog(
        req,
        "reject",
        "rental_opportunity_request",
        id,
        `Solicitud de oportunidad de renta rechazada para propiedad ${request.propertyId}: ${rejectionReason}`
      );

      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting rental opportunity request:", error);
      res.status(500).json({ message: error.message || "Error al rechazar solicitud" });
    }
  });

  // Admin: Grant rental opportunity directly to a client (without appointment)
  app.post("/api/admin/rental-opportunity-requests/grant", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const adminId = req.user?.claims?.sub || req.session?.adminUser?.id;
      const { userId, propertyId, notes } = req.body;

      if (!userId || !propertyId) {
        return res.status(400).json({ message: "userId y propertyId son requeridos" });
      }

      // Verify user exists and is a client
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      if (user.role !== "cliente") {
        return res.status(400).json({ message: "Solo se puede otorgar oportunidades a clientes" });
      }

      // Verify property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Check if there's already an approved opportunity for this client-property combination
      const existingOpportunities = await db
        .select()
        .from(rentalOpportunityRequests)
        .where(
          and(
            eq(rentalOpportunityRequests.userId, userId),
            eq(rentalOpportunityRequests.propertyId, propertyId),
            eq(rentalOpportunityRequests.status, "approved" as any)
          )
        );

      if (existingOpportunities.length > 0) {
        return res.status(400).json({ 
          message: "Ya existe una oportunidad aprobada para este cliente en esta propiedad" 
        });
      }

      // Create the rental opportunity request directly as approved
      const [opportunityRequest] = await db
        .insert(rentalOpportunityRequests)
        .values({
          userId,
          propertyId,
          appointmentId: null, // No appointment required when admin grants directly
          status: "approved" as any,
          notes: notes || "Oportunidad otorgada directamente por administrador",
          approvedBy: adminId,
          approvedAt: new Date(),
        })
        .returning();

      // Notify client
      await storage.createNotification({
        userId,
        type: "opportunity",
        title: "Oportunidad de Renta Otorgada",
        message: `Se te ha otorgado una oportunidad para crear una oferta de renta para ${property.title}. Puedes proceder a crear tu oferta.`,
        relatedEntityType: "rental_opportunity_request",
        relatedEntityId: opportunityRequest.id,
        priority: "high",
      });

      await createAuditLog(
        req,
        "approve",
        "rental_opportunity_request",
        opportunityRequest.id,
        `Oportunidad de renta otorgada directamente a ${user.firstName} ${user.lastName} para propiedad ${property.title}`
      );

      res.json(opportunityRequest);
    } catch (error: any) {
      console.error("Error granting rental opportunity:", error);
      res.status(500).json({ message: error.message || "Error al otorgar oportunidad" });
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

  // Helper function to filter drafts with all applicable query params
  // Note: Drafts have these fields from basicInfo/locationInfo/media:
  // - title, description, propertyType, price (rentPrice), salePrice, currency
  // - bedrooms, bathrooms, area, location, images, ownerId, approvalStatus
  // Fields NOT in drafts: status (property status), featured, active, published, zones, specific condominium IDs
  const filterDrafts = (drafts: any[], queryParams: any) => {
    let filtered = drafts;
    
    // Text search (applies to: title, description, location)
    if (queryParams.q && typeof queryParams.q === "string") {
      const query = queryParams.q.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query)
      );
    }
    
    // Property type filter
    if (queryParams.propertyType) {
      filtered = filtered.filter(p => p.propertyType === queryParams.propertyType);
    }
    
    // Owner ID filter
    if (queryParams.ownerId) {
      filtered = filtered.filter(p => p.ownerId === queryParams.ownerId);
    }
    
    // Price range filters (check both price and salePrice)
    if (queryParams.minPrice) {
      const minPrice = parseFloat(queryParams.minPrice as string);
      filtered = filtered.filter(p => {
        const rentPrice = parseFloat(p.price || "0");
        const salePrice = parseFloat(p.salePrice || "0");
        // Draft matches if either price meets the minimum
        return rentPrice >= minPrice || salePrice >= minPrice;
      });
    }
    if (queryParams.maxPrice) {
      const maxPrice = parseFloat(queryParams.maxPrice as string);
      filtered = filtered.filter(p => {
        const rentPrice = parseFloat(p.price || "0");
        const salePrice = parseFloat(p.salePrice || "0");
        // If both are 0, filter out. Otherwise check the active price
        if (rentPrice === 0 && salePrice === 0) return false;
        const activePrice = rentPrice > 0 ? rentPrice : salePrice;
        return activePrice <= maxPrice;
      });
    }
    
    // Bedroom/bathroom filters (drafts have these from basicInfo)
    if (queryParams.minBedrooms) {
      const minBed = parseInt(queryParams.minBedrooms as string);
      filtered = filtered.filter(p => (p.bedrooms || 0) >= minBed);
    }
    if (queryParams.maxBedrooms) {
      const maxBed = parseInt(queryParams.maxBedrooms as string);
      filtered = filtered.filter(p => (p.bedrooms || 0) <= maxBed);
    }
    if (queryParams.minBathrooms) {
      const minBath = parseInt(queryParams.minBathrooms as string);
      filtered = filtered.filter(p => (p.bathrooms || 0) >= minBath);
    }
    if (queryParams.maxBathrooms) {
      const maxBath = parseInt(queryParams.maxBathrooms as string);
      filtered = filtered.filter(p => (p.bathrooms || 0) <= maxBath);
    }
    
    // Status filter - drafts don't have property "status" field
    // If status filter is present, exclude ALL drafts (they can never match it)
    if (queryParams.status) {
      filtered = [];
    }
    
    // Virtual tour request filter
    if (queryParams.requestVirtualTour === "true") {
      filtered = filtered.filter(p => p.requestVirtualTour === true);
    }
    
    // Note: approvalStatus filtering is handled upstream (not in filterDrafts)
    // Drafts have approvalStatus "pending_review" when submitted
    
    return filtered;
  };

  // Admin Property Management routes
  app.get("/api/admin/properties", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const { approvalStatus, propertyType, status, featured, q, ownerId, requestVirtualTour } = req.query;
      
      // Get all other query params to detect complex filters
      const allQueryKeys = Object.keys(req.query);
      
      const filters: any = {};
      
      if (approvalStatus) {
        filters.approvalStatus = approvalStatus;
      }
      if (propertyType) {
        filters.propertyType = propertyType;
      }
      if (status) {
        filters.status = status;
      }
      if (featured !== undefined) {
        filters.featured = featured === "true";
      }
      if (q && typeof q === "string") {
        filters.query = q;
      }
      if (requestVirtualTour === "true") {
        filters.requestVirtualTour = true;
      }
      
      // Get real properties
      const properties = await storage.searchPropertiesAdvanced(filters);
      
      // Only include drafts when appropriate based on filters
      let allProperties = [...properties];
      
      // Check if drafts should be included based on approvalStatus
      const shouldIncludeDraftsByApprovalStatus = (
        !approvalStatus ||              // No filter = show all
        approvalStatus === "pending_review" ||  // Pending review includes submitted drafts
        approvalStatus === "draft"       // Drafts
      );
      
      // Detect filters that drafts cannot satisfy
      // Drafts DON'T have: zones, specific condominium IDs, published/active states
      // Drafts DO have: price, bedrooms, bathrooms, propertyType, ownerId, location, etc.
      const hasUnsatisfiableFilters = (
        featured === "true" ||  // Drafts are never featured=true
        allQueryKeys.some(key => [
          'zone', 'zones', 'condominium', 'condominiumId',
          'published', 'active'
        ].includes(key))
      );
      
      // Only include drafts if:
      // 1. Approval status allows it AND
      // 2. No unsatisfiable filters AND
      // 3. Not explicitly filtering by status (unless looking for pending_review/draft approvals)
      const canIncludeDrafts = (
        shouldIncludeDraftsByApprovalStatus &&
        !hasUnsatisfiableFilters &&
        (!status || approvalStatus === "pending_review" || approvalStatus === "draft")
      );
      
      if (canIncludeDrafts) {
        // Get submitted drafts (pending approval) only if showing pending_review or all
        const submittedDrafts = (approvalStatus === "pending_review" || !approvalStatus)
          ? await storage.getPropertySubmissionDrafts({ status: "submitted" })
          : [];
        
        // Get draft status drafts only if showing drafts or all
        const draftStatusDrafts = (approvalStatus === "draft" || !approvalStatus)
          ? await storage.getPropertySubmissionDrafts({ status: "draft" })
          : [];
        
        // Collect all unique amenity IDs from all drafts to fetch their names
        const allDrafts = [...submittedDrafts, ...draftStatusDrafts];
        const allAmenityIds = new Set<string>();
        
        for (const draft of allDrafts) {
          const amenities = (draft.details as any)?.propertyAmenities || [];
          for (const amenityId of amenities) {
            if (amenityId) allAmenityIds.add(amenityId);
          }
        }
        
        // Fetch amenity names in batch
        const amenityMap = new Map<string, string>();
        if (allAmenityIds.size > 0) {
          const amenityRecords = await storage.getAmenitiesByIds(Array.from(allAmenityIds));
          for (const amenity of amenityRecords) {
            amenityMap.set(amenity.id, amenity.name);
          }
        }
        
        // Transform drafts to property-like objects
        const transformDraft = (draft: any) => {
          // Expand amenity IDs to names
          const amenityIds = draft.details?.propertyAmenities || [];
          const amenityNames = amenityIds.map((id: string) => amenityMap.get(id) || id).filter((name: string) => name);
          
          // Expand condominium amenity IDs to names
          const condoAmenityIds = draft.details?.condominiumAmenities || [];
          const condoAmenityNames = condoAmenityIds.map((id: string) => amenityMap.get(id) || id).filter((name: string) => name);
          
          // Transform services structure: servicesInfo.basicServices -> includedServices and notIncludedServices
          const basicServices = draft.servicesInfo?.basicServices || {};
          const includedServices: any = {};
          const notIncludedServices: any = {};
          
          // Map basicServices structure to includedServices and notIncludedServices
          const serviceKeys = ['water', 'electricity', 'internet', 'gas'];
          for (const key of serviceKeys) {
            if (basicServices[key]?.included) {
              includedServices[key] = true;
            } else if (basicServices[key]?.cost) {
              // Service is not included but has cost information
              notIncludedServices[key] = {
                cost: basicServices[key].cost,
                provider: basicServices[key].provider || null,
                billingCycle: basicServices[key].billingCycle || null,
              };
            }
          }
          
          return {
            id: `draft-${draft.id}`,
            isDraft: true,
            draftId: draft.id,
            title: draft.basicInfo?.title || draft.basicInfo?.customListingTitle || "Propiedad sin título",
            customListingTitle: draft.basicInfo?.customListingTitle || "",
            description: draft.basicInfo?.description || "",
            propertyType: draft.basicInfo?.propertyType || "house",
            price: draft.basicInfo?.price || "0",
            salePrice: draft.basicInfo?.salePrice || "0",
            currency: draft.basicInfo?.currency || "MXN",
            bedrooms: draft.details?.bedrooms || 0,
            bathrooms: draft.details?.bathrooms || 0,
            area: draft.details?.area || 0,
            location: draft.locationInfo?.address || "",
            colonyName: draft.locationInfo?.colonyName || "",
            condoName: draft.locationInfo?.condoName || "",
            unitNumber: draft.locationInfo?.unitNumber || "",
            googleMapsUrl: draft.locationInfo?.googleMapsUrl || "",
            amenities: amenityNames,
            condominiumAmenities: condoAmenityNames,
            images: draft.media?.images || [],
            primaryImages: draft.media?.primaryImages || [],
            coverImageIndex: draft.media?.coverImageIndex ?? 0,
            secondaryImages: draft.media?.secondaryImages || [],
            videos: draft.media?.videos || [],
            virtualTourUrl: draft.media?.virtualTourUrl || "",
            requestVirtualTour: draft.media?.requestVirtualTour || false,
            includedServices: includedServices,
            notIncludedServices: notIncludedServices,
            acceptedLeaseDurations: draft.servicesInfo?.acceptedLeaseDurations || [],
            accessInfo: draft.accessInfo || null,
            ownerId: draft.userId,
            ownerFirstName: draft.ownerData?.ownerFirstName || "",
            ownerLastName: draft.ownerData?.ownerLastName || "",
            ownerPhone: draft.ownerData?.ownerPhone || "",
            ownerEmail: draft.ownerData?.ownerEmail || "",
            approvalStatus: draft.status === "submitted" ? "pending_review" : "draft",
            ownerStatus: "active",
            published: false,
            active: false,
            featured: false,
            createdAt: draft.createdAt,
            updatedAt: draft.updatedAt,
          };
        };
        
        let submittedDraftProperties = submittedDrafts.map(transformDraft);
        let draftProperties = draftStatusDrafts.map(transformDraft);
        
        // Apply all filters to drafts using the helper
        submittedDraftProperties = filterDrafts(submittedDraftProperties, req.query);
        draftProperties = filterDrafts(draftProperties, req.query);
        
        // Add filtered drafts to the result
        allProperties = [...properties, ...submittedDraftProperties, ...draftProperties];
      }
      
      res.json(allProperties);
    } catch (error) {
      console.error("Error fetching admin properties:", error);
      res.status(500).json({ message: "Error al obtener propiedades" });
    }
  });

  app.get("/api/admin/properties/stats", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const allProperties = await storage.searchPropertiesAdvanced({});
      
      // Get submitted drafts (pending approval)
      const submittedDrafts = await storage.getPropertySubmissionDrafts({ status: "submitted" });
      
      // Get draft status drafts (work in progress)
      const draftStatusDrafts = await storage.getPropertySubmissionDrafts({ status: "draft" });
      
      const stats = {
        total: allProperties.length + submittedDrafts.length + draftStatusDrafts.length,
        pending: allProperties.filter(p => p.approvalStatus === "pending_review").length + submittedDrafts.length,
        approved: allProperties.filter(p => p.approvalStatus === "approved").length,
        rejected: allProperties.filter(p => p.approvalStatus === "rejected").length,
        draft: allProperties.filter(p => p.approvalStatus === "draft").length + draftStatusDrafts.length,
        inspectionScheduled: allProperties.filter(p => p.approvalStatus === "inspection_scheduled").length,
        inspectionCompleted: allProperties.filter(p => p.approvalStatus === "inspection_completed").length,
        published: allProperties.filter(p => p.published).length,
        featured: allProperties.filter(p => p.featured).length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching property stats:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  app.patch("/api/admin/properties/:id/approve", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes, publish } = req.body;
      const adminId = req.user.claims.sub;
      
      // Check if this is a draft
      if (id.startsWith("draft-")) {
        const draftId = id.replace("draft-", "");
        const draft = await storage.getPropertySubmissionDraft(draftId);
        
        if (!draft) {
          return res.status(404).json({ message: "Draft no encontrado" });
        }
        
        // Approve draft (this creates the real property)
        const newProperty = await storage.approvePropertySubmissionDraft(draftId, adminId);
        
        // Update property if publish flag is provided
        if (publish !== undefined) {
          await storage.updateProperty(newProperty.id, { published: publish });
        }
        
        await createAuditLog(
          req,
          "approve",
          "property_draft",
          draftId,
          `Draft aprobado y convertido a propiedad: ${draft.basicInfo?.title || 'Sin título'}${notes ? ` - ${notes}` : ""}`
        );
        
        return res.json(newProperty);
      }
      
      // Handle regular property approval
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }
      
      const updated = await storage.updateProperty(id, {
        approvalStatus: "approved",
        published: publish !== false,
      });
      
      await createAuditLog(
        req,
        "approve",
        "property",
        id,
        `Propiedad aprobada: ${getPropertyTitle(property)}${notes ? ` - ${notes}` : ""}`
      );
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error approving property:", error);
      res.status(500).json({ message: error.message || "Error al aprobar propiedad" });
    }
  });

  // New endpoint to publish already approved properties
  app.patch("/api/admin/properties/:id/publish", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.claims.sub;
      
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }
      
      // Update to published
      const updated = await storage.updateProperty(id, {
        published: true,
        approvalStatus: "approved", // Ensure it's approved too
      });
      
      await createAuditLog(
        req,
        "publish",
        "property",
        id,
        `Propiedad publicada: ${getPropertyTitle(property)}`
      );
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error publishing property:", error);
      res.status(500).json({ message: error.message || "Error al publicar propiedad" });
    }
  });

  // Endpoint to toggle featured status
  app.patch("/api/admin/properties/:id/featured", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { featured } = req.body;
      const adminId = req.user.claims.sub;
      
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }
      
      const updated = await storage.updateProperty(id, {
        featured: featured,
      });
      
      await createAuditLog(
        req,
        "update",
        "property",
        id,
        `Propiedad ${featured ? 'marcada como destacada' : 'desmarcada como destacada'}: ${property.title}`
      );
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating featured status:", error);
      res.status(500).json({ message: error.message || "Error al actualizar estado destacado" });
    }
  });

  app.patch("/api/admin/properties/:id/reject", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user.claims.sub;
      
      // Check if this is a draft
      if (id.startsWith("draft-")) {
        const draftId = id.replace("draft-", "");
        const draft = await storage.getPropertySubmissionDraft(draftId);
        
        if (!draft) {
          return res.status(404).json({ message: "Draft no encontrado" });
        }
        
        // Update draft status to rejected
        const updated = await storage.updatePropertySubmissionDraft(draftId, {
          status: "rejected",
          reviewedBy: adminId,
          reviewedAt: new Date(),
        });
        
        await createAuditLog(
          req,
          "reject",
          "property_draft",
          draftId,
          `Draft rechazado: ${draft.basicInfo?.title || 'Sin título'}${notes ? ` - ${notes}` : ""}`
        );
        
        return res.json(updated);
      }
      
      // Handle regular property rejection
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }
      
      const updated = await storage.updateProperty(id, {
        approvalStatus: "rejected",
        published: false,
      });
      
      await createAuditLog(
        req,
        "reject",
        "property",
        id,
        `Propiedad rechazada: ${getPropertyTitle(property)}${notes ? ` - ${notes}` : ""}`
      );
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error rejecting property:", error);
      res.status(500).json({ message: error.message || "Error al rechazar propiedad" });
    }
  });

  app.patch("/api/admin/properties/bulk-approve", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { propertyIds, publish } = req.body;
      
      if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
        return res.status(400).json({ message: "IDs de propiedades requeridos" });
      }
      
      const results = await Promise.all(
        propertyIds.map(async (id: string) => {
          try {
            const property = await storage.getProperty(id);
            if (!property) return { id, success: false, error: "No encontrada" };
            
            await storage.updateProperty(id, {
              approvalStatus: "approved",
              published: publish !== false,
            });
            
            await createAuditLog(
              req,
              "approve",
              "property",
              id,
              `Propiedad aprobada en masa: ${getPropertyTitle(property)}`
            );
            
            return { id, success: true };
          } catch (error: any) {
            return { id, success: false, error: error.message };
          }
        })
      );
      
      res.json({ results });
    } catch (error: any) {
      console.error("Error in bulk approve:", error);
      res.status(500).json({ message: error.message || "Error al aprobar propiedades" });
    }
  });

  app.patch("/api/admin/properties/bulk-reject", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { propertyIds, notes } = req.body;
      
      if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
        return res.status(400).json({ message: "IDs de propiedades requeridos" });
      }
      
      const results = await Promise.all(
        propertyIds.map(async (id: string) => {
          try {
            const property = await storage.getProperty(id);
            if (!property) return { id, success: false, error: "No encontrada" };
            
            await storage.updateProperty(id, {
              approvalStatus: "rejected",
              published: false,
            });
            
            await createAuditLog(
              req,
              "reject",
              "property",
              id,
              `Propiedad rechazada en masa: ${property.title}${notes ? ` - ${notes}` : ""}`
            );
            
            return { id, success: true };
          } catch (error: any) {
            return { id, success: false, error: error.message };
          }
        })
      );
      
      res.json({ results });
    } catch (error: any) {
      console.error("Error in bulk reject:", error);
      res.status(500).json({ message: error.message || "Error al rechazar propiedades" });
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

  // Public endpoint for creating property submission drafts via invitation token
  app.post("/api/public/property-submission-drafts", propertySubmissionLimiter, async (req: any, res) => {
    try {
      const { invitationToken, ...draftData } = req.body;
      
      if (!invitationToken) {
        return res.status(400).json({ message: "Token de invitación requerido" });
      }

      console.log("[DRAFT-CREATE-PUBLIC] Token:", invitationToken.substring(0, 10) + "...");

      // Validate token
      const token = await storage.getPropertySubmissionTokenByToken(invitationToken);
      if (!token) {
        return res.status(404).json({ message: "Token de invitación no encontrado" });
      }

      if (token.used) {
        return res.status(400).json({ message: "Este token ya fue utilizado" });
      }

      if (new Date() > new Date(token.expiresAt)) {
        return res.status(400).json({ message: "El token de invitación ha expirado" });
      }

      // Validate draft data
      const validationResult = insertPropertySubmissionDraftSchema.safeParse({
        ...draftData,
        userId: null, // Public submissions have no userId
        tokenId: token.id // Link draft to token
      });

      if (!validationResult.success) {
        console.error("[DRAFT-CREATE-PUBLIC] Validation failed:", validationResult.error.errors);
        return res.status(400).json({
          message: "Datos inválidos",
          errors: validationResult.error.errors,
          code: "VALIDATION_ERROR"
        });
      }

      // Create draft
      const draft = await storage.createPropertySubmissionDraft(validationResult.data);
      console.log("[DRAFT-CREATE-PUBLIC] Success, Draft ID:", draft.id);

      // SECURITY: Link draft to token but DON'T mark as used yet
      // Token will be marked used only when draft is submitted (status changes to submitted/pending_review)
      await storage.updatePropertySubmissionToken(token.id, {
        propertyDraftId: draft.id
      });

      console.log("[DRAFT-CREATE-PUBLIC] Draft linked to token (token not marked used yet)");

      return res.status(201).json(draft);
    } catch (error: any) {
      console.error("[DRAFT-CREATE-PUBLIC] Error:", error);
      return res.status(500).json({
        message: error.message || "Error al crear borrador",
        code: "INTERNAL_ERROR"
      });
    }
  });

  app.post("/api/property-submission-drafts", propertySubmissionLimiter, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      console.log("[DRAFT-CREATE] User:", userId, "Step:", req.body.currentStep);
      
      // CRITICAL: Always inject authenticated userId, never trust client
      const validationResult = insertPropertySubmissionDraftSchema.safeParse({
        ...req.body,
        userId // Enforce server-side userId
      });
      
      if (!validationResult.success) {
        console.error("[DRAFT-CREATE] Validation failed:", validationResult.error.errors);
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors,
          code: "VALIDATION_ERROR"
        });
      }

      const draft = await storage.createPropertySubmissionDraft(validationResult.data);
      console.log("[DRAFT-CREATE] Success, ID:", draft.id);
      
      await createAuditLog(
        req,
        "create",
        "property_submission_draft",
        draft.id,
        "Borrador de propiedad creado"
      ).catch(err => console.error("[DRAFT-CREATE] Audit log failed:", err));

      return res.status(201).json(draft);
    } catch (error: any) {
      console.error("[DRAFT-CREATE] Error:", error);
      return res.status(500).json({ 
        message: error.message || "Error al crear borrador",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // Public endpoint for updating property submission drafts via invitation token
  app.patch("/api/public/property-submission-drafts/:id", propertySubmissionLimiter, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { invitationToken, ...draftData } = req.body;

      if (!invitationToken) {
        return res.status(400).json({ message: "Token de invitación requerido" });
      }

      console.log("[DRAFT-UPDATE-PUBLIC] Draft:", id, "Step:", draftData.currentStep);

      // Validate token
      const token = await storage.getPropertySubmissionTokenByToken(invitationToken);
      if (!token) {
        return res.status(404).json({ message: "Token de invitación no encontrado" });
      }

      // SECURITY: Enforce single-use semantics - once token is marked used, no more updates
      if (token.used) {
        return res.status(403).json({ 
          message: "Este token ya fue utilizado y el borrador no puede ser modificado" 
        });
      }

      if (new Date() > new Date(token.expiresAt)) {
        return res.status(400).json({ message: "El token de invitación ha expirado" });
      }

      // SECURITY: Require token to have a linked draft before allowing updates
      // This prevents attackers from using a token to hijack arbitrary drafts
      if (!token.propertyDraftId) {
        return res.status(400).json({ 
          message: "Token no tiene un borrador asociado. Primero crea un borrador." 
        });
      }

      // SECURITY: Verify that the draft ID in the URL matches the token's linked draft
      if (token.propertyDraftId !== id) {
        return res.status(403).json({ 
          message: "No autorizado: este token no está vinculado a este borrador" 
        });
      }

      // Get existing draft
      const existingDraft = await storage.getPropertySubmissionDraft(id);
      if (!existingDraft) {
        return res.status(404).json({ message: "Borrador no encontrado" });
      }

      // Verify that the draft belongs to this token (double-check)
      if (existingDraft.tokenId !== token.id) {
        return res.status(403).json({ message: "No autorizado para modificar este borrador" });
      }

      // SECURITY: Only allow updates if draft is still in "draft" status
      if (existingDraft.status !== "draft") {
        return res.status(403).json({ 
          message: "Este borrador ya fue enviado y no puede ser modificado" 
        });
      }

      // SECURITY: Prevent updates to drafts created more than 48 hours ago
      const draftAge = Date.now() - new Date(existingDraft.createdAt).getTime();
      const MAX_DRAFT_AGE = 48 * 60 * 60 * 1000; // 48 hours
      if (draftAge > MAX_DRAFT_AGE) {
        return res.status(403).json({
          message: "Este borrador ha expirado y no puede ser modificado"
        });
      }

      // Validate input
      const validationResult = insertPropertySubmissionDraftSchema.partial().safeParse(draftData);
      if (!validationResult.success) {
        console.error("[DRAFT-UPDATE-PUBLIC] Validation failed:", validationResult.error.errors);
        return res.status(400).json({
          message: "Datos inválidos",
          errors: validationResult.error.errors,
          code: "VALIDATION_ERROR"
        });
      }

      // Remove server-controlled fields
      const sanitizedData = { ...validationResult.data };
      delete (sanitizedData as any).id;
      delete (sanitizedData as any).userId;
      delete (sanitizedData as any).tokenId;
      delete (sanitizedData as any).createdAt;
      delete (sanitizedData as any).updatedAt;
      delete (sanitizedData as any).propertyId;
      delete (sanitizedData as any).reviewedBy;
      delete (sanitizedData as any).reviewedAt;

      // Update draft
      const updated = await storage.updatePropertySubmissionDraft(id, sanitizedData);

      if (!updated) {
        console.error("[DRAFT-UPDATE-PUBLIC] Draft not found or storage returned null");
        return res.status(404).json({
          message: "Borrador no encontrado",
          code: "DRAFT_NOT_FOUND"
        });
      }

      console.log("[DRAFT-UPDATE-PUBLIC] Success, updated step:", updated.currentStep);

      // SECURITY: If draft status changed to "submitted", mark token as used
      if (updated.status === "submitted" && !token.used) {
        await storage.updatePropertySubmissionToken(token.id, {
          used: true,
          usedAt: new Date()
        });
        console.log("[DRAFT-UPDATE-PUBLIC] Token marked as used after submission");
      }

      return res.json(updated);
    } catch (error: any) {
      console.error("[DRAFT-UPDATE-PUBLIC] Error:", error);
      return res.status(500).json({
        message: error.message || "Error al actualizar borrador",
        code: "INTERNAL_ERROR"
      });
    }
  });

  app.patch("/api/property-submission-drafts/:id", propertySubmissionLimiter, isAuthenticated, requireResourceOwnership('property-draft', 'userId'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      console.log("[DRAFT-UPDATE] User:", userId, "Draft:", id, "Step:", req.body.currentStep);

      // Validate input but DO NOT include userId from request body
      const validationResult = insertPropertySubmissionDraftSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        console.error("[DRAFT-UPDATE] Validation failed:", validationResult.error.errors);
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors,
          code: "VALIDATION_ERROR"
        });
      }

      // Remove ALL server-controlled fields to prevent unauthorized mutation
      const sanitizedData = { ...validationResult.data };
      delete sanitizedData.userId; // Remove client-provided userId first
      delete (sanitizedData as any).id;
      delete (sanitizedData as any).createdAt;
      delete (sanitizedData as any).updatedAt;
      delete (sanitizedData as any).propertyId;
      delete (sanitizedData as any).reviewedBy;
      delete (sanitizedData as any).reviewedAt;

      // CRITICAL: Re-inject authenticated userId to ensure ownership validation succeeds
      sanitizedData.userId = userId;

      // Attempt update with authenticated userId
      const updated = await storage.updatePropertySubmissionDraft(id, sanitizedData);
      
      if (!updated) {
        console.error("[DRAFT-UPDATE] Draft not found or storage returned null");
        return res.status(404).json({ 
          message: "Borrador no encontrado",
          code: "DRAFT_NOT_FOUND"
        });
      }

      console.log("[DRAFT-UPDATE] Success, updated step:", updated.currentStep);
      
      await createAuditLog(
        req,
        "update",
        "property_submission_draft",
        id,
        `Borrador actualizado - Paso ${updated.currentStep}`
      ).catch(err => console.error("[DRAFT-UPDATE] Audit log failed:", err));

      return res.json(updated);
    } catch (error: any) {
      console.error("[DRAFT-UPDATE] Storage error:", error);
      // Provide structured error responses
      if (error.message?.includes("not found")) {
        return res.status(404).json({ 
          message: "Borrador no encontrado",
          code: "DRAFT_NOT_FOUND"
        });
      }
      if (error.message?.includes("permission")) {
        return res.status(403).json({ 
          message: "No tienes permiso para modificar este borrador",
          code: "PERMISSION_DENIED"
        });
      }
      return res.status(500).json({ 
        message: error.message || "Error al actualizar borrador",
        code: "INTERNAL_ERROR"
      });
    }
  });

  app.delete("/api/property-submission-drafts/:id", isAuthenticated, requireResourceOwnership('property-draft', 'userId'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

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

  // Admin-only: Approve property submission draft and create property
  app.post("/api/property-submission-drafts/:id/approve", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { skipDocumentCheck } = req.body; // Allow admin to force approve without documents
      let adminId: string;

      // Get adminId from session (admin_users) or from user claims (regular users with admin role)
      if (req.session?.adminUser) {
        adminId = req.session.adminUser.id;
      } else {
        adminId = req.user.claims.sub;
      }
      
      // Approve the draft and create property
      const property = await storage.approvePropertySubmissionDraft(id, adminId);
      
      // Check if documents are complete and validated (unless skipped)
      if (!skipDocumentCheck) {
        const documentStatus = await storage.checkPropertyDocumentsComplete(property.id);
        
        if (!documentStatus.complete) {
          await createAuditLog(
            req,
            "approve",
            "property_submission_draft",
            id,
            `Propiedad creada pero documentos incompletos. Faltantes: ${documentStatus.missing.join(', ')}`
          );
          
          return res.status(201).json({
            message: "Propiedad creada pero faltan documentos requeridos",
            property,
            warning: true,
            documentStatus,
          });
        }
        
        if (!documentStatus.validated) {
          await createAuditLog(
            req,
            "approve",
            "property_submission_draft",
            id,
            `Propiedad creada pero documentos sin validar. Sin validar: ${documentStatus.unvalidated.join(', ')}`
          );
          
          return res.status(201).json({
            message: "Propiedad creada pero documentos pendientes de validación",
            property,
            warning: true,
            documentStatus,
          });
        }
      }
      
      await createAuditLog(
        req,
        "approve",
        "property_submission_draft",
        id,
        `Borrador aprobado, propiedad creada: ${property.id}`
      );

      res.status(201).json({
        message: "Propiedad aprobada y creada exitosamente",
        property,
      });
    } catch (error: any) {
      console.error("Error approving property submission draft:", error);
      res.status(500).json({ message: error.message || "Error al aprobar borrador" });
    }
  });

  // Property Submission Token routes (for inviting owners without account)
  
  // Generate a cryptographically secure random token
  function generateSecureToken(): string {
    // Generate professional short code: PROP-XXXXXXXX (13 characters)
    // Using uppercase alphanumeric (excluding confusing chars: 0, O, I, 1, l)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }
    return `PROP-${code}`;
  }

  // Admin: Create property submission token
  app.post("/api/admin/property-tokens", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { inviteeEmail, inviteePhone, inviteeName, notes } = req.body;
      
      // CRITICAL: Ensure admin exists in users table for foreign key constraint
      // This must succeed before creating the token to avoid FK violations
      await storage.upsertUser({
        id: adminId,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name || "Admin",
        lastName: req.user.claims.last_name || "User",
        role: "admin",
      });
      
      // Generate secure token
      const token = generateSecureToken();
      
      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Create token in database
      const tokenRecord = await storage.createPropertySubmissionToken({
        token,
        createdBy: adminId,
        expiresAt,
        used: false,
        inviteeEmail: inviteeEmail || null,
        inviteePhone: inviteePhone || null,
        inviteeName: inviteeName || null,
        notes: notes || null,
      });
      
      await createAuditLog(
        req,
        "create",
        "property_submission_token",
        tokenRecord.id,
        `Token de invitación creado${inviteeName ? ` para ${inviteeName}` : ''}${inviteeEmail ? ` (${inviteeEmail})` : ''}`
      );
      
      // Return token with full URL
      const baseUrl = req.protocol + '://' + req.get('host');
      const inviteUrl = `${baseUrl}/submit-property/${token}`;
      
      res.status(201).json({
        ...tokenRecord,
        inviteUrl,
      });
    } catch (error: any) {
      console.error("Error creating property submission token:", error);
      res.status(500).json({ message: error.message || "Error al crear token de invitación" });
    }
  });

  // Admin: List property submission tokens
  app.get("/api/admin/property-tokens", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      // Get all tokens (admin can see all tokens, not just their own)
      const tokens = await storage.getPropertySubmissionTokens({});
      
      // Add inviteUrl and status to each token
      const baseUrl = req.protocol + '://' + req.get('host');
      const tokensWithUrls = tokens.map(token => {
        const inviteUrl = `${baseUrl}/submit-property/${token.token}`;
        const now = new Date();
        const isExpired = now > token.expiresAt;
        const status = token.used ? 'used' : (isExpired ? 'expired' : 'pending');
        
        return {
          ...token,
          inviteUrl,
          status,
        };
      });
      
      res.json(tokensWithUrls);
    } catch (error: any) {
      console.error("Error fetching property submission tokens:", error);
      res.status(500).json({ message: error.message || "Error al obtener tokens" });
    }
  });

  // Admin: Delete property submission token
  app.delete("/api/admin/property-tokens/:id", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verify token exists
      const existingToken = await storage.getPropertySubmissionToken(id);
      if (!existingToken) {
        return res.status(404).json({ message: "Token no encontrado" });
      }
      
      // Delete the token
      await storage.deletePropertySubmissionToken(id);
      
      await createAuditLog(
        req,
        "delete",
        "property_submission_token",
        id,
        `Token de invitación eliminado${existingToken.inviteeName ? ` (${existingToken.inviteeName})` : ''}`
      );
      
      res.json({ message: "Token eliminado exitosamente" });
    } catch (error: any) {
      console.error("Error deleting property submission token:", error);
      res.status(500).json({ message: error.message || "Error al eliminar el token" });
    }
  });

  // Admin: Regenerate property submission token
  app.post("/api/admin/property-tokens/:id/regenerate", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.claims.sub;
      
      // Get existing token
      const existingToken = await storage.getPropertySubmissionToken(id);
      if (!existingToken) {
        return res.status(404).json({ message: "Token no encontrado" });
      }
      
      // CRITICAL: Ensure admin exists in users table for foreign key constraint
      // This must succeed before creating the token to avoid FK violations
      await storage.upsertUser({
        id: adminId,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name || "Admin",
        lastName: req.user.claims.last_name || "User",
        role: "admin",
      });
      
      // Delete old token
      await storage.deletePropertySubmissionToken(id);
      
      // Generate new secure token
      const token = generatePropertyToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Create new token with same info
      const newTokenRecord = await storage.createPropertySubmissionToken({
        token,
        createdBy: adminId,
        expiresAt,
        inviteeEmail: existingToken.inviteeEmail,
        inviteePhone: existingToken.inviteePhone,
        inviteeName: existingToken.inviteeName,
        notes: existingToken.notes,
      });
      
      await createAuditLog(
        req,
        "update",
        "property_submission_token",
        newTokenRecord.id,
        `Token de invitación regenerado${existingToken.inviteeName ? ` para ${existingToken.inviteeName}` : ''}`
      );
      
      // Return new token with full URL
      const baseUrl = req.protocol + '://' + req.get('host');
      const inviteUrl = `${baseUrl}/submit-property/${token}`;
      
      res.status(201).json({
        ...newTokenRecord,
        inviteUrl,
      });
    } catch (error: any) {
      console.error("Error regenerating property submission token:", error);
      res.status(500).json({ message: error.message || "Error al regenerar el token" });
    }
  });

  // Public: Validate property submission token
  app.get("/api/property-tokens/:token/validate", async (req, res) => {
    try {
      const { token } = req.params;
      
      const tokenRecord = await storage.getPropertySubmissionTokenByToken(token);
      
      if (!tokenRecord) {
        return res.status(404).json({ 
          valid: false,
          message: "Token no encontrado" 
        });
      }
      
      // Check if token is already used
      if (tokenRecord.used) {
        return res.status(400).json({ 
          valid: false,
          message: "Este enlace ya fue utilizado" 
        });
      }
      
      // Check if token is expired
      if (new Date() > tokenRecord.expiresAt) {
        return res.status(400).json({ 
          valid: false,
          message: "Este enlace ha expirado" 
        });
      }
      
      // Token is valid
      res.json({ 
        valid: true,
        inviteeName: tokenRecord.inviteeName,
        inviteeEmail: tokenRecord.inviteeEmail,
        inviteePhone: tokenRecord.inviteePhone,
        expiresAt: tokenRecord.expiresAt,
      });
    } catch (error: any) {
      console.error("Error validating property submission token:", error);
      res.status(500).json({ message: error.message || "Error al validar token" });
    }
  });

  // Get draft linked to invitation token
  app.get("/api/property-tokens/:token/draft", async (req, res) => {
    try {
      const { token } = req.params;
      
      const tokenRecord = await storage.getPropertySubmissionTokenByToken(token);
      
      if (!tokenRecord) {
        return res.status(404).json({ message: "Token no encontrado" });
      }
      
      // Check if token has a linked draft
      if (!tokenRecord.propertyDraftId) {
        return res.status(404).json({ message: "No hay borrador vinculado a este token" });
      }
      
      // Get the draft
      const draft = await storage.getPropertySubmissionDraft(tokenRecord.propertyDraftId);
      
      if (!draft) {
        return res.status(404).json({ message: "Borrador no encontrado" });
      }
      
      res.json(draft);
    } catch (error: any) {
      console.error("Error fetching draft for token:", error);
      res.status(500).json({ message: error.message || "Error al obtener borrador" });
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

  // Sidebar Menu Visibility Configuration routes
  // Admin: Get sidebar configuration for a role
  app.get("/api/admin/sidebar-config/:role", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { role } = req.params;
      
      const config = await storage.getSidebarMenuVisibility(role);
      res.json(config);
    } catch (error: any) {
      console.error("Error fetching sidebar config:", error);
      res.status(500).json({ message: error.message || "Error al obtener configuración del sidebar" });
    }
  });

  // Admin: Update sidebar configuration in bulk
  app.post("/api/admin/sidebar-config", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { configurations } = req.body;
      
      if (!Array.isArray(configurations)) {
        return res.status(400).json({ message: "Se requiere un array de configuraciones" });
      }
      
      const results = await storage.bulkSetSidebarMenuVisibility(configurations);
      
      await createAuditLog(
        req,
        "update",
        "sidebar_menu_visibility",
        null,
        `Configuración del sidebar actualizada para ${configurations.length} items`
      );
      
      res.json(results);
    } catch (error: any) {
      console.error("Error updating sidebar config:", error);
      res.status(500).json({ message: error.message || "Error al actualizar configuración del sidebar" });
    }
  });

  // Admin: Reset sidebar configuration for a role
  app.delete("/api/admin/sidebar-config/:role", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { role } = req.params;
      
      await storage.resetSidebarMenuVisibility(role);
      
      await createAuditLog(
        req,
        "delete",
        "sidebar_menu_visibility",
        null,
        `Configuración del sidebar reseteada para rol ${role}`
      );
      
      res.json({ message: "Configuración reseteada exitosamente" });
    } catch (error: any) {
      console.error("Error resetting sidebar config:", error);
      res.status(500).json({ message: error.message || "Error al resetear configuración del sidebar" });
    }
  });

  // System Settings routes
  // Admin: Get a specific system setting
  app.get("/api/admin/system-settings/:key", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSystemSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Configuración no encontrada" });
      }
      res.json(setting);
    } catch (error: any) {
      console.error("Error fetching system setting:", error);
      res.status(500).json({ message: error.message || "Error al obtener configuración" });
    }
  });

  // Admin: Get all system settings
  app.get("/api/admin/system-settings", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const settings = await storage.getAllSystemSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: error.message || "Error al obtener configuraciones" });
    }
  });

  // Admin: Update a system setting
  app.put("/api/admin/system-settings/:key", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (!value) {
        return res.status(400).json({ message: "El valor es requerido" });
      }

      const setting = await storage.updateSystemSetting(key, value);

      await createAuditLog(
        req,
        "update",
        "system_settings",
        key,
        `Configuración ${key} actualizada a ${value}`
      );

      res.json(setting);
    } catch (error: any) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ message: error.message || "Error al actualizar configuración" });
    }
  });

  // Sidebar Menu Visibility Configuration routes (user-based)
  // Admin: Get users by role
  app.get("/api/admin/users-by-role/:role", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { role } = req.params;
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ message: error.message || "Error al obtener usuarios" });
    }
  });

  // Admin: Get sidebar configuration for a specific user
  app.get("/api/admin/sidebar-config-user/:userId", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const config = await storage.getSidebarMenuVisibilityByUser(userId);
      res.json(config);
    } catch (error: any) {
      console.error("Error fetching user sidebar config:", error);
      res.status(500).json({ message: error.message || "Error al obtener configuración del usuario" });
    }
  });

  // Admin: Update sidebar configuration for a specific user
  app.post("/api/admin/sidebar-config-user/:userId", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { configurations } = req.body;
      
      if (!Array.isArray(configurations)) {
        return res.status(400).json({ message: "Se requiere un array de configuraciones" });
      }
      
      const results = await storage.bulkSetSidebarMenuVisibilityUser(userId, configurations);
      
      await createAuditLog(
        req,
        "update",
        "sidebar_menu_visibility_user",
        userId,
        `Configuración del sidebar actualizada para usuario ${userId}, ${configurations.length} items`
      );
      
      res.json(results);
    } catch (error: any) {
      console.error("Error updating user sidebar config:", error);
      res.status(500).json({ message: error.message || "Error al actualizar configuración del usuario" });
    }
  });

  // Admin: Reset sidebar configuration for a specific user
  app.delete("/api/admin/sidebar-config-user/:userId", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      await storage.resetSidebarMenuVisibilityUser(userId);
      
      await createAuditLog(
        req,
        "delete",
        "sidebar_menu_visibility_user",
        userId,
        `Configuración del sidebar reseteada para usuario ${userId}`
      );
      
      res.json({ message: "Configuración de usuario reseteada exitosamente" });
    } catch (error: any) {
      console.error("Error resetting user sidebar config:", error);
      res.status(500).json({ message: error.message || "Error al resetear configuración del usuario" });
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
      
      // For sellers: get leads they registered OR are assigned to
      if (currentUser.role === "seller") {
        const filters: any = {};
        if (status) filters.status = status;
        if (assignedToId) filters.assignedToId = assignedToId;
        
        // Get leads using the new seller filter
        const leads = await storage.getLeadsForSeller(userId, filters);
        return res.json(leads);
      }
      
      // For admins: apply regular filters
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
      
      // Sellers can only access leads they registered OR are assigned to
      if (currentUser.role === "seller" && lead.registeredById !== userId && lead.assignedToId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para acceder a este lead" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  // Validate phone number for duplicates (real-time validation)
  app.get("/api/leads/validate-phone/:phone", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const { phone } = req.params;
      
      if (!phone) {
        return res.status(400).json({ message: "Teléfono requerido" });
      }

      // Check for existing lead with this phone
      const existingLead = await storage.getActiveLeadByPhone(phone);
      
      if (!existingLead) {
        return res.json({ 
          isDuplicate: false,
          message: "Teléfono disponible"
        });
      }

      // Get original seller information
      const originalSeller = await storage.getUser(existingLead.registeredById);
      
      if (!originalSeller) {
        return res.json({
          isDuplicate: true,
          message: "Lead duplicado detectado"
        });
      }

      // Return duplicate information (excluding phone for security)
      res.json({
        isDuplicate: true,
        lead: {
          id: existingLead.id,
          firstName: existingLead.firstName,
          lastName: existingLead.lastName,
          email: existingLead.email,
          budget: existingLead.budget,
          status: existingLead.status,
          source: existingLead.source,
          notes: existingLead.notes,
          registeredAt: existingLead.createdAt,
          // Exclude phone for security
        },
        originalSeller: {
          id: originalSeller.id,
          firstName: originalSeller.firstName,
          lastName: originalSeller.lastName,
          email: originalSeller.email,
          phone: originalSeller.phone,
        },
        message: `Este teléfono ya fue registrado por ${originalSeller.firstName} ${originalSeller.lastName} el ${new Date(existingLead.createdAt).toLocaleDateString('es-MX')}`
      });
    } catch (error) {
      console.error("Error validating phone:", error);
      res.status(500).json({ message: "Error al validar teléfono" });
    }
  });

  app.post("/api/leads", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Handle both admin and regular users
      let currentUser;
      if (req.user.adminAuth) {
        // Admin user - get from admin table
        const admin = await storage.getAdminById(userId);
        if (!admin) {
          return res.status(404).json({ message: "Usuario no encontrado" });
        }
        // Normalize admin to user shape for consistent downstream access
        currentUser = {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          role: admin.role || 'admin', // Use admin role or default to 'admin'
        };
      } else {
        // Regular user - get from users table
        currentUser = await storage.getUser(userId);
        if (!currentUser) {
          return res.status(404).json({ message: "Usuario no encontrado" });
        }
      }

      const leadData = req.body;
      
      // Obtener configuración del sistema para período de validez
      const validityConfig = await storage.getSystemConfig("lead_validity_months");
      const validityMonths = validityConfig ? parseInt(validityConfig.value) : 3;
      
      // Calcular fecha de validez
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + validityMonths);
      
      // Verificar si existe un lead activo (no expirado) con el mismo teléfono
      const existingLead = await storage.getActiveLeadByPhone(leadData.phone);
      
      if (existingLead) {
        // Lead duplicado detectado - calcular tiempo restante
        const now = new Date();
        const validUntilDate = new Date(existingLead.validUntil);
        const daysRemaining = Math.ceil((validUntilDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const monthsRemaining = Math.floor(daysRemaining / 30);
        const daysRemainingAfterMonths = daysRemaining % 30;
        
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
          message: `El lead ${existingLead.firstName} ${existingLead.lastName} (${existingLead.phone}) fue registrado nuevamente por ${currentUser.firstName} ${currentUser.lastName}`,
          type: "lead_duplicate",
          link: `/leads/${existingLead.id}`,
        });
        
        await createAuditLog(req, "create", "lead", existingLead.id, `Intento de crear lead duplicado: ${leadData.firstName} ${leadData.lastName} (${leadData.phone})`);
        
        // Construir mensaje de tiempo restante
        let timeMessage = "";
        if (monthsRemaining > 0) {
          timeMessage = `${monthsRemaining} ${monthsRemaining === 1 ? 'mes' : 'meses'}`;
          if (daysRemainingAfterMonths > 0) {
            timeMessage += ` y ${daysRemainingAfterMonths} ${daysRemainingAfterMonths === 1 ? 'día' : 'días'}`;
          }
        } else {
          timeMessage = `${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'}`;
        }
        
        return res.status(409).json({ 
          message: `Este lead ya fue registrado por ${originalSeller?.firstName} ${originalSeller?.lastName} el ${new Date(existingLead.createdAt).toLocaleDateString('es-MX')}. Tiempo restante para que se libere: ${timeMessage}`,
          existingLead: {
            id: existingLead.id,
            firstName: existingLead.firstName,
            lastName: existingLead.lastName,
            phone: existingLead.phone,
            registeredBy: `${originalSeller?.firstName} ${originalSeller?.lastName}`,
            createdAt: existingLead.createdAt,
            validUntil: existingLead.validUntil,
            daysRemaining,
          },
          isDuplicate: true
        });
      }
      
      // Crear nuevo lead con fecha de validez
      // Leads registrados por vendedores/admin se marcan como verificados automáticamente
      const lead = await storage.createLead({
        ...leadData,
        registeredById: userId,
        validUntil,
        emailVerified: true, // Auto-verificado cuando es registrado por staff
      });
      
      await createAuditLog(req, "create", "lead", lead.id, `Lead creado: ${lead.firstName} ${lead.lastName}`);
      
      // Calculate lead score automatically
      try {
        await storage.calculateLeadScore(lead.id);
        
        // Create workflow event
        await storage.createWorkflowEvent({
          eventType: "lead_created",
          entityType: "lead",
          entityId: lead.id,
          userId: userId,
          metadata: { firstName: lead.firstName, lastName: lead.lastName, source: lead.source },
        });
      } catch (scoringError) {
        console.error("Error calculating lead score:", scoringError);
        // Don't fail lead creation if scoring fails
      }
      
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
      
      // Recalculate lead score after update
      try {
        await storage.calculateLeadScore(id);
        
        // Create workflow event
        await storage.createWorkflowEvent({
          eventType: "lead_updated",
          entityType: "lead",
          entityId: id,
          userId: userId,
          metadata: { updates: Object.keys(updates) },
        });
      } catch (scoringError) {
        console.error("Error recalculating lead score:", scoringError);
      }
      
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
      
      // Register status change in lead history
      await storage.createLeadHistory({
        leadId: id,
        action: "status_changed",
        field: "status",
        oldValue: existingLead.status,
        newValue: status,
        userId: userId,
        description: `Estado cambió de "${existingLead.status}" a "${status}"`,
      });
      
      await createAuditLog(req, "update", "lead", id, `Estado de lead actualizado a: ${status}`);
      
      // Recalculate lead score after status change
      try {
        await storage.calculateLeadScore(id);
        
        // Create workflow event for status change
        await storage.createWorkflowEvent({
          eventType: "lead_status_changed",
          entityType: "lead",
          entityId: id,
          userId: userId,
          metadata: { newStatus: status, previousStatus: existingLead.status },
        });
        
        // Check if we need to create alerts based on status change
        if (status === "perdido") {
          await storage.createSystemAlert({
            userId: existingLead.registeredById,
            alertType: "lead_lost",
            priority: "medium",
            title: "Lead perdido",
            message: `El lead ${updatedLead.firstName} ${updatedLead.lastName} ha sido marcado como perdido`,
            relatedEntityType: "lead",
            relatedEntityId: id,
          });
        }
      } catch (error) {
        console.error("Error in lead status change automation:", error);
      }
      
      res.json(updatedLead);
    } catch (error: any) {
      console.error("Error updating lead status:", error);
      res.status(400).json({ message: error.message || "Failed to update lead status" });
    }
  });

  // Get lead history
  app.get("/api/leads/:id/history", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
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
      
      // Sellers can only view history of their own leads
      if (currentUser.role === "seller" && lead.registeredById !== userId && lead.assignedToId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para ver el historial de este lead" });
      }
      
      const history = await storage.getLeadHistory(id);
      
      // Enrich history with user info
      const enrichedHistory = await Promise.all(
        history.map(async (entry) => {
          const user = await storage.getUser(entry.userId);
          return {
            ...entry,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
            } : null,
          };
        })
      );
      
      res.json(enrichedHistory);
    } catch (error) {
      console.error("Error fetching lead history:", error);
      res.status(500).json({ message: "Failed to fetch lead history" });
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

  // Reassign lead to another seller (Admin only)
  app.patch("/api/leads/:id/reassign", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { newSellerId } = req.body;
      
      if (!newSellerId) {
        return res.status(400).json({ message: "Nuevo vendedor requerido" });
      }
      
      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      const newSeller = await storage.getUser(newSellerId);
      if (!newSeller || newSeller.role !== "seller") {
        return res.status(400).json({ message: "El usuario seleccionado no es un vendedor válido" });
      }
      
      const previousSeller = await storage.getUser(existingLead.registeredById);
      
      const updatedLead = await storage.updateLead(id, { registeredById: newSellerId });
      
      await createAuditLog(
        req, 
        "update", 
        "lead", 
        id, 
        `Lead reasignado de ${previousSeller?.name || 'vendedor anterior'} a ${newSeller.name}`
      );
      
      // Create notification for new seller
      await storage.createSystemAlert({
        userId: newSellerId,
        alertType: "lead_assigned",
        priority: "high",
        title: "Nuevo lead asignado",
        message: `Se te ha asignado el lead: ${updatedLead.firstName} ${updatedLead.lastName}`,
        relatedEntityType: "lead",
        relatedEntityId: id,
      });
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error reassigning lead:", error);
      res.status(500).json({ message: "Failed to reassign lead" });
    }
  });

  // Get lead appointments history
  app.get("/api/leads/:id/appointments", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead no encontrado" });
      }
      
      // Sellers can only access appointments for their own leads
      if (currentUser.role === "seller" && lead.registeredById !== userId) {
        return res.status(403).json({ message: "No tienes permiso para acceder a las citas de este lead" });
      }
      
      const leadAppointments = await db
        .select()
        .from(appointments)
        .where(eq(appointments.leadId, id))
        .orderBy(desc(appointments.date));
      
      // Enrich with property and staff info
      const enrichedAppointments = await Promise.all(
        leadAppointments.map(async (apt) => {
          const property = apt.propertyId ? await storage.getProperty(apt.propertyId) : null;
          const staff = apt.assignedStaffId ? await storage.getUser(apt.assignedStaffId) : null;
          return {
            ...apt,
            property: property ? {
              id: property.id,
              title: getPropertyTitle(property),
              location: property.location,
            } : null,
            assignedStaff: staff ? {
              id: staff.id,
              name: staff.name,
            } : null,
          };
        })
      );
      
      res.json(enrichedAppointments);
    } catch (error) {
      console.error("Error fetching lead appointments:", error);
      res.status(500).json({ message: "Failed to fetch lead appointments" });
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
  // Admin route to get ALL appointments in the system
  app.get("/api/admin/appointments/all", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const appointments = await storage.getAllAppointmentsAdmin();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching admin appointments:", error);
      res.status(500).json({ message: "Failed to fetch admin appointments" });
    }
  });

  // Admin route to get seller management data
  app.get("/api/admin/sellers/all", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const sellersData = await storage.getSellerManagementData();
      res.json(sellersData);
    } catch (error) {
      console.error("Error fetching seller management data:", error);
      res.status(500).json({ message: "Failed to fetch seller management data" });
    }
  });

  // Admin route to update any appointment
  app.patch("/api/admin/appointments/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      const updatedAppointment = await storage.updateAppointment(id, req.body);

      await createAuditLog(req, "update", "appointment", id, "Cita actualizada por administrador");

      res.json({ 
        message: "Cita actualizada exitosamente",
        appointment: updatedAppointment 
      });
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      res.status(400).json({ message: error.message || "Error al actualizar la cita" });
    }
  });

  // Admin route to cancel any appointment
  app.post("/api/admin/appointments/:id/cancel", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      const updatedAppointment = await storage.updateAppointment(id, {
        status: "cancelled" as any,
      });

      await createAuditLog(req, "update", "appointment", id, "Cita cancelada por administrador");

      res.json({ 
        message: "Cita cancelada exitosamente",
        appointment: updatedAppointment 
      });
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      res.status(400).json({ message: error.message || "Error al cancelar la cita" });
    }
  });

  app.get("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { status, clientId, propertyId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (propertyId) filters.propertyId = propertyId;
      
      // Security: Only admins/masters/sellers can filter by different clientId
      // Clients can only see their own appointments
      if (clientId && clientId !== userId) {
        if (!["master", "admin", "admin_jr", "seller"].includes(user.role)) {
          return res.status(403).json({ message: "No tienes permiso para ver citas de otros clientes" });
        }
        filters.clientId = clientId;
      } else if (user.role === "client") {
        // Clients always see only their own appointments
        filters.clientId = userId;
      } else if (clientId) {
        // Admin/seller requested specific clientId
        filters.clientId = clientId;
      }

      const appointments = await storage.getAppointments(filters);
      
      // Enrich appointments with additional data
      const enrichedAppointments = await Promise.all(
        appointments.map(async (apt) => {
          const enriched: any = { ...apt };
          
          // Add property info
          if (apt.propertyId) {
            enriched.property = await storage.getProperty(apt.propertyId);
          }
          
          // Add client info
          if (apt.clientId) {
            const client = await storage.getUser(apt.clientId);
            if (client) {
              enriched.client = {
                email: client.email,
                firstName: client.firstName,
                lastName: client.lastName,
                phone: client.phone,
                nationality: client.nationality,
                profileImageUrl: client.profileImageUrl,
              };
            }
          }
          
          // Add concierge info with rating
          if (apt.conciergeId) {
            const concierge = await storage.getUser(apt.conciergeId);
            if (concierge) {
              // Get concierge reviews to calculate rating
              const reviews = await storage.getConciergeReviews({ conciergeId: apt.conciergeId });
              const avgRating = reviews.length > 0 
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                : 0;
              
              enriched.concierge = {
                id: concierge.id,
                firstName: concierge.firstName,
                lastName: concierge.lastName,
                email: concierge.email,
                phone: concierge.phone,
                profileImageUrl: concierge.profileImageUrl,
                rating: avgRating || undefined,
                reviewCount: reviews.length || undefined,
              };
            }
          }
          
          // Add presentation card info
          if (apt.presentationCardId) {
            const presentationCard = await storage.getPresentationCard(apt.presentationCardId);
            if (presentationCard) {
              enriched.presentationCard = presentationCard;
            }
          }
          
          return enriched;
        })
      );
      
      res.json(enrichedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Get available concierges for a specific time slot
  app.get("/api/appointments/available-concierges", isAuthenticated, async (req: any, res) => {
    try {
      const { date, mode } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      const slotDate = new Date(date);
      // Convert mode to duration: individual=60min (default), tour=30min
      const durationMinutes = mode === 'tour' ? 30 : 60;
      const availableConcierges = await storage.getAvailableConcierguesForSlot(slotDate, durationMinutes);
      
      // Enrich with ratings
      const enrichedConcierges = await Promise.all(
        availableConcierges.map(async (concierge) => {
          const reviews = await storage.getConciergeReviews({ conciergeId: concierge.id });
          const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;
          
          return {
            ...concierge,
            rating: avgRating || undefined,
            reviewCount: reviews.length || undefined,
          };
        })
      );
      
      res.json(enrichedConcierges);
    } catch (error) {
      console.error("Error fetching available concierges:", error);
      res.status(500).json({ message: "Failed to fetch available concierges" });
    }
  });

  // Get slot availability count
  app.get("/api/appointments/slot-availability", isAuthenticated, async (req: any, res) => {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      const slotDate = new Date(date);
      const availableCount = await storage.getAvailableSlotCount(slotDate);
      
      res.json({ 
        date: slotDate, 
        availableSpaces: availableCount,
        isAvailable: availableCount > 0 
      });
    } catch (error) {
      console.error("Error checking slot availability:", error);
      res.status(500).json({ message: "Failed to check slot availability" });
    }
  });

  // Assign concierge to appointment (for owners and admins)
  app.patch("/api/appointments/:id/assign-concierge", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { conciergeId, accessType, accessCode, accessInstructions } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Check permissions: owner of the property or admin
      const property = await storage.getProperty(appointment.propertyId);
      const isOwner = property?.ownerId === userId;
      const isAdmin = user && ["master", "admin", "admin_jr", "management"].includes(user.role);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "No tienes permiso para asignar conserjes a esta cita" });
      }

      // Validate concierge is available
      const availableConcierges = await storage.getAvailableConcierguesForSlot(appointment.date);
      const isConciergeAvailable = availableConcierges.some(c => c.id === conciergeId);

      if (!isConciergeAvailable) {
        return res.status(400).json({ message: "El conserje seleccionado no está disponible para este horario" });
      }

      // Assign concierge with access information
      const updatedAppointment = await storage.assignConciergeToAppointment(
        id,
        conciergeId,
        userId,
        { accessType, accessCode, accessInstructions }
      );

      await createAuditLog(req, "update", "appointment", id, `Conserje asignado por ${isOwner ? "propietario" : "administrador"}`);

      // Send notifications to all parties
      const concierge = await storage.getUser(conciergeId);
      const client = await storage.getUser(appointment.clientId);
      
      const notifications = [];
      const appointmentDate = new Date(appointment.date).toLocaleString('es-MX', { 
        dateStyle: 'full',
        timeStyle: 'short'
      });
      const propertyLocation = property?.location || "ubicación no disponible";
      const accessTypeLabel = {
        lockbox: "Lockbox",
        electronic: "Cerradura Electrónica",
        manual: "Acceso Manual",
        other: "Otro"
      }[accessType] || accessType;

      // Notify client - confirmation with property address, time, concierge info
      if (client) {
        notifications.push(
          storage.createNotification({
            userId: client.id,
            type: "appointment",
            title: "Conserje Asignado a tu Cita",
            message: `Tu cita para ${property?.title} el ${appointmentDate} ha sido confirmada. Conserje asignado: ${concierge?.firstName} ${concierge?.lastName}. Ubicación: ${propertyLocation}`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "high",
          })
        );
      }

      // Notify property owner - confirmation with concierge assignment
      if (property?.ownerId && property.ownerId !== userId) {
        notifications.push(
          storage.createNotification({
            userId: property.ownerId,
            type: "appointment",
            title: "Conserje Asignado",
            message: `Se ha asignado a ${concierge?.firstName} ${concierge?.lastName} para la cita en ${property.title} el ${appointmentDate}`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "medium",
          })
        );
      }

      // Notify concierge - appointment details, access instructions, property location
      if (concierge) {
        const accessInfo = accessType === "manual" 
          ? `Acceso: ${accessTypeLabel}. ${accessInstructions || 'Sin instrucciones adicionales'}`
          : `Acceso: ${accessTypeLabel}. Código: ${accessCode || 'N/A'}. ${accessInstructions || ''}`;
        
        notifications.push(
          storage.createNotification({
            userId: concierge.id,
            type: "appointment",
            title: "Nueva Cita Asignada",
            message: `Has sido asignado a una cita en ${property?.title} el ${appointmentDate}. Ubicación: ${propertyLocation}. ${accessInfo}`,
            relatedEntityType: "appointment",
            relatedEntityId: appointment.id,
            priority: "high",
          })
        );
      }

      // Notify admins - assignment confirmation
      const admins = await storage.getUsersByRole("admin");
      const masters = await storage.getUsersByRole("master");
      const allAdmins = [...admins, ...masters];
      
      for (const admin of allAdmins) {
        if (admin.id !== userId) { // Don't notify the admin who made the assignment
          notifications.push(
            storage.createNotification({
              userId: admin.id,
              type: "appointment",
              title: "Conserje Asignado a Cita",
              message: `${concierge?.firstName} ${concierge?.lastName} asignado a cita en ${property?.title} el ${appointmentDate} por ${isOwner ? "propietario" : "administrador"}`,
              relatedEntityType: "appointment",
              relatedEntityId: appointment.id,
              priority: "low",
            })
          );
        }
      }

      // Create all notifications
      await Promise.all(notifications);

      res.json({ 
        message: "Conserje asignado exitosamente",
        appointment: updatedAppointment,
        concierge: concierge ? {
          firstName: concierge.firstName,
          lastName: concierge.lastName,
          email: concierge.email,
          phoneNumber: concierge.phoneNumber,
        } : null
      });
    } catch (error: any) {
      console.error("Error assigning concierge:", error);
      res.status(400).json({ message: error.message || "Error al asignar conserje" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req: any, res) => {
    let googleEventId: string | null = null;
    
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Determine clientId: admins/masters can specify, others use their own ID
      let clientId = userId;
      if (req.body.clientId && req.body.clientId !== userId) {
        if (user && ["master", "admin", "admin_jr", "seller"].includes(user.role)) {
          clientId = req.body.clientId;
        }
        // Non-admins cannot specify different clientId, silently use their own
      }
      
      // Validate manual property data (only for sellers and admins)
      const hasPropertyId = !!req.body.propertyId;
      const hasManualProperty = req.body.condominiumName || req.body.unitNumber;
      
      if (hasManualProperty) {
        // Only sellers and admins can create appointments with manual properties
        if (!user || !["master", "admin", "admin_jr", "seller"].includes(user.role)) {
          return res.status(403).json({ 
            message: "Solo vendedores y administradores pueden crear citas con propiedades manuales" 
          });
        }
        
        // Can't have both propertyId and manual property data
        if (hasPropertyId) {
          return res.status(400).json({ 
            message: "No puedes proporcionar propertyId y datos de propiedad manual al mismo tiempo" 
          });
        }
        
        // Both condominiumName and unitNumber are required for manual properties
        if (!req.body.condominiumName || !req.body.unitNumber) {
          return res.status(400).json({ 
            message: "Debes proporcionar tanto el nombre del condominio como el número de unidad" 
          });
        }
      } else if (!hasPropertyId) {
        // Must have either propertyId or manual property data
        return res.status(400).json({ 
          message: "Debes proporcionar una propiedad existente o los datos de condominio y unidad" 
        });
      }
      
      // Clean special values and convert date string to Date object if needed
      const cleanedBody = {
        ...req.body,
        clientId,
        conciergeId: req.body.conciergeId === "none" ? undefined : req.body.conciergeId,
        // Convert date string to Date object (JSON serialization converts Date to string)
        date: req.body.date ? new Date(req.body.date) : req.body.date,
      };
      
      const appointmentData = insertAppointmentSchema.parse(cleanedBody);

      // Validate: Client can only have 1 appointment per day
      // Get start and end of the appointment date
      const appointmentDate = new Date(appointmentData.date);
      const startOfAppointmentDay = new Date(appointmentDate);
      startOfAppointmentDay.setHours(0, 0, 0, 0);
      const endOfAppointmentDay = new Date(appointmentDate);
      endOfAppointmentDay.setHours(23, 59, 59, 999);

      // Check if client already has an appointment on this day (excluding cancelled ones)
      const existingAppointments = await storage.getAppointments();
      const clientAppointmentsOnDay = existingAppointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return apt.clientId === clientId && 
               apt.status !== "cancelled" &&
               aptDate >= startOfAppointmentDay && 
               aptDate <= endOfAppointmentDay;
      });

      if (clientAppointmentsOnDay.length > 0) {
        return res.status(400).json({ 
          message: "Ya tienes una cita programada para este día. Solo puedes coordinar 1 cita por día. Si necesitas coordinar otra cita el mismo día, primero debes cancelar la que tienes." 
        });
      }

      // Create Google Meet event if type is video
      let meetLink = null;
      
      if (appointmentData.type === "video") {
        const property = appointmentData.propertyId ? await storage.getProperty(appointmentData.propertyId) : null;
        const propertyTitle = property?.title || 
          (appointmentData.condominiumName && appointmentData.unitNumber 
            ? `${appointmentData.condominiumName} - ${appointmentData.unitNumber}`
            : "Propiedad");
        
        const appointmentDate = new Date(appointmentData.date);
        const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // 1 hour later

        try {
          const eventResult = await createGoogleMeetEvent({
            summary: `Visita Virtual: ${propertyTitle}`,
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
        const property = appointment.propertyId ? await storage.getProperty(appointment.propertyId) : null;
        const propertyDescription = property?.title || 
          (appointment.condominiumName && appointment.unitNumber 
            ? `${appointment.condominiumName} - ${appointment.unitNumber}`
            : "propiedad");
        
        await createAuditLog(
          req,
          "create",
          "appointment",
          appointment.id,
          `Cita creada para ${propertyDescription} - ${new Date(appointment.date).toLocaleDateString()}`
        );

        // Auto-approval logic (only for properties in system)
        if (property && property.ownerId) {
          const ownerSettings = await storage.getOwnerSettings(property.ownerId);
          
          // Check if auto-approval is enabled and property has valid access
          if (ownerSettings?.autoApproveAppointments) {
            const accessInfo = property.accessInfo as any;
            let shouldAutoApprove = false;
            
            // Check if has lockbox OR smart lock with ongoing validity
            if (accessInfo?.accessType === "unattended") {
              if (accessInfo.method === "lockbox" && accessInfo.lockboxCode) {
                shouldAutoApprove = true;
              } else if (accessInfo.method === "smart_lock" && accessInfo.smartLockCode) {
                // Only auto-approve if smart lock doesn't expire same day or has ongoing validity
                if (accessInfo.smartLockExpirationDuration === "ongoing") {
                  shouldAutoApprove = true;
                }
              }
            }
            
            if (shouldAutoApprove) {
              // Auto-approve the appointment
              const approvedAppointment = await storage.updateAppointment(appointment.id, {
                ownerApprovalStatus: "approved",
                ownerApprovedAt: new Date(),
                ownerApprovalNotes: "Aprobada automáticamente por configuración del propietario",
              });
              
              // Create notifications for concierge, client, and admin
              const notifications = [];
              
              // Notify concierge if assigned
              if (appointment.conciergeId) {
                notifications.push(
                  storage.createNotification({
                    userId: appointment.conciergeId,
                    type: "appointment",
                    title: "Cita Aprobada Automáticamente",
                    message: `La cita para ${property.title} el ${new Date(appointment.date).toLocaleDateString()} ha sido aprobada automáticamente`,
                    relatedEntityType: "appointment",
                    relatedEntityId: appointment.id,
                    priority: "medium",
                  })
                );
              }
              
              // Notify client
              notifications.push(
                storage.createNotification({
                  userId: appointment.clientId,
                  type: "appointment",
                  title: "Cita Aprobada",
                  message: `Tu cita para ${property.title} el ${new Date(appointment.date).toLocaleDateString()} ha sido aprobada`,
                  relatedEntityType: "appointment",
                  relatedEntityId: appointment.id,
                  priority: "high",
                })
              );
              
              // Notify admins
              const admins = await storage.getUsers({ role: "admin" });
              for (const admin of admins) {
                notifications.push(
                  storage.createNotification({
                    userId: admin.id,
                    type: "appointment",
                    title: "Cita Aprobada Automáticamente",
                    message: `Cita para ${property.title} aprobada automáticamente el ${new Date(appointment.date).toLocaleDateString()}`,
                    relatedEntityType: "appointment",
                    relatedEntityId: appointment.id,
                    priority: "low",
                  })
                );
              }
              
              // Create all notifications
              await Promise.all(notifications);
              
              // Log auto-approval
              await createAuditLog(
                req,
                "update",
                "appointment",
                appointment.id,
                `Cita auto-aprobada para ${property.title}`
              );
              
              res.status(201).json(approvedAppointment);
              return;
            }
          }
        }

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

  app.patch("/api/appointments/:id", isAuthenticated, requireResourceOwnership('appointment'), async (req: any, res) => {
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

  app.delete("/api/appointments/:id", isAuthenticated, requireResourceOwnership('appointment'), async (req: any, res) => {
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

  // Seller/Admin Appointment Management Routes
  // Create appointment with lead (seller can only use their own leads)
  app.post("/api/seller/appointments/create-with-lead", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    let googleEventId: string | null = null;
    
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { leadId, propertyId, condominiumName, unitNumber, date, type, notes } = req.body;

      // Validate required fields
      if (!leadId || !date || !type) {
        return res.status(400).json({ message: "Lead, fecha y tipo son requeridos" });
      }

      // Validate property input: must have propertyId OR (condominiumName + unitNumber)
      if (!propertyId && (!condominiumName || !unitNumber)) {
        return res.status(400).json({ message: "Debes proporcionar un ID de propiedad O nombre de condominio y número de unidad" });
      }

      // Verify lead exists and belongs to seller (unless admin)
      const lead = await storage.getLead(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead no encontrado" });
      }

      // Sellers can only create appointments with their own leads
      if (user?.role === "seller" && lead.registeredById !== userId) {
        return res.status(403).json({ message: "Solo puedes crear citas con leads que tú registraste" });
      }

      // Verify property exists and is published (only if propertyId provided)
      let property = null;
      if (propertyId) {
        property = await storage.getProperty(propertyId);
        if (!property) {
          return res.status(404).json({ message: "Propiedad no encontrada" });
        }

        if (!property.published) {
          return res.status(400).json({ message: "Solo puedes crear citas con propiedades publicadas" });
        }
      }

      // Use clientId if lead is registered, otherwise use lead contact info
      const clientId = lead.userId || undefined;
      const leadContactInfo = !clientId ? {
        leadId: lead.id,
        leadEmail: lead.email,
        leadPhone: lead.phoneNumber || undefined,
        leadName: `${lead.firstName} ${lead.lastName}`,
      } : {};

      // Create Google Meet event if type is video
      let meetLink = null;
      const propertyTitle = property ? property.title : `${condominiumName} - ${unitNumber}`;
      
      if (type === "video") {
        const appointmentDate = new Date(date);
        const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // 1 hour later

        try {
          const eventResult = await createGoogleMeetEvent({
            summary: `Visita Virtual: ${propertyTitle}`,
            description: `Cita virtual para visitar la propiedad`,
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
        }
      }

      // Create appointment with auto-approved status
      const appointment = await storage.createAppointment({
        propertyId: propertyId || undefined,
        condominiumName: condominiumName || undefined,
        unitNumber: unitNumber || undefined,
        clientId,
        ...leadContactInfo, // Include lead info if no clientId
        date: new Date(date),
        type,
        mode: "individual",
        status: "confirmed", // Auto-confirmed for seller-created appointments
        ownerApprovalStatus: "approved",
        ownerApprovedAt: new Date(),
        ownerApprovalNotes: `Cita creada por ${user?.role} ${user?.firstName} ${user?.lastName}`,
        visitType: "visita_cliente",
        notes,
        meetLink,
        googleEventId: googleEventId || undefined,
      });

      // Update lead status if needed
      if (lead.status === "nuevo" || lead.status === "contactado" || lead.status === "calificado") {
        await storage.updateLeadStatus(leadId, "visita_agendada");
      }

      await createAuditLog(
        req,
        "create",
        "appointment",
        appointment.id,
        `${user?.role} creó cita con lead ${lead.firstName} ${lead.lastName} para ${propertyTitle}`
      );

      // Notify client about the appointment (only if registered user)
      if (clientId) {
        await storage.createNotification({
          userId: clientId,
          type: "appointment",
          title: "Nueva Cita Agendada",
          message: `Se ha agendado una cita para visitar ${propertyTitle} el ${new Date(date).toLocaleDateString()}`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        });
      }

      res.status(201).json(appointment);
    } catch (error: any) {
      // Rollback Google Meet event if appointment creation fails
      if (googleEventId) {
        try {
          await deleteGoogleMeetEvent(googleEventId);
        } catch (rollbackError) {
          console.error("Error rolling back Google Meet event:", rollbackError);
        }
      }
      console.error("Error creating appointment with lead:", error);
      res.status(500).json({ message: error.message || "Error al crear cita con lead" });
    }
  });

  // Seller/Admin approve appointment directly
  app.post("/api/seller/appointments/:id/approve", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Update appointment to confirmed
      const updated = await storage.updateAppointment(id, {
        status: "confirmed",
        ownerApprovalStatus: "approved",
        ownerApprovedAt: new Date(),
        ownerApprovalNotes: `Aprobada por ${user?.role} ${user?.firstName} ${user?.lastName}`,
      });

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `${user?.role} aprobó cita directamente`
      );

      // Notify client (only if they have a user account)
      if (appointment.clientId) {
        await storage.createNotification({
          userId: appointment.clientId,
          type: "appointment",
          title: "Cita Aprobada",
          message: `Tu cita ha sido aprobada`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error approving appointment:", error);
      res.status(500).json({ message: error.message || "Error al aprobar cita" });
    }
  });

  // Seller/Admin cancel appointment directly
  app.post("/api/seller/appointments/:id/cancel", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      // Cancel appointment
      const updated = await storage.updateAppointment(id, {
        status: "cancelled",
      });

      // Delete Google Meet event if exists
      if (appointment.googleEventId) {
        try {
          await deleteGoogleMeetEvent(appointment.googleEventId);
        } catch (error) {
          console.error("Error deleting Google Meet event:", error);
        }
      }

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `${user?.role} canceló cita${reason ? `: ${reason}` : ""}`
      );

      // Notify client (only if they have a user account)
      if (appointment.clientId) {
        await storage.createNotification({
          userId: appointment.clientId,
          type: "appointment",
          title: "Cita Cancelada",
          message: `Tu cita ha sido cancelada${reason ? `: ${reason}` : ""}`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      res.status(500).json({ message: error.message || "Error al cancelar cita" });
    }
  });

  // Seller/Admin reschedule appointment directly
  app.patch("/api/seller/appointments/:id/reschedule", isAuthenticated, requireRole(["master", "admin", "admin_jr", "seller", "management"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { newDate } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!newDate) {
        return res.status(400).json({ message: "Nueva fecha es requerida" });
      }

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }

      const oldDate = new Date(appointment.date);

      // Update appointment date directly
      const updated = await storage.updateAppointment(id, {
        date: new Date(newDate),
        rescheduleStatus: "none", // Reset reschedule status since this is direct change
      });

      await createAuditLog(
        req,
        "update",
        "appointment",
        id,
        `${user?.role} reprogramó cita de ${oldDate.toLocaleDateString()} a ${new Date(newDate).toLocaleDateString()}`
      );

      // Notify client (only if they have a user account)
      if (appointment.clientId) {
        await storage.createNotification({
          userId: appointment.clientId,
          type: "appointment",
          title: "Cita Reprogramada",
          message: `Tu cita ha sido reprogramada para el ${new Date(newDate).toLocaleDateString()}`,
          relatedEntityType: "appointment",
          relatedEntityId: appointment.id,
          priority: "high",
        });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error rescheduling appointment:", error);
      res.status(500).json({ message: error.message || "Error al reprogramar cita" });
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

  // Business Hours routes
  app.get("/api/business-hours", async (req, res) => {
    try {
      const hours = await storage.getBusinessHours();
      res.json(hours);
    } catch (error) {
      console.error("Error fetching business hours:", error);
      res.status(500).json({ message: "Error al obtener los horarios de atención" });
    }
  });

  app.put("/api/business-hours/:dayOfWeek", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { dayOfWeek } = req.params;
      const { isOpen, openTime, closeTime } = req.body;

      const updatedHours = await storage.upsertBusinessHours({
        dayOfWeek: parseInt(dayOfWeek),
        isOpen,
        openTime,
        closeTime,
      });

      await createAuditLog(
        req,
        "update",
        "business_hours",
        updatedHours.id,
        `Horario de atención actualizado para el día ${dayOfWeek}`
      );

      res.json(updatedHours);
    } catch (error) {
      console.error("Error updating business hours:", error);
      res.status(500).json({ message: "Error al actualizar los horarios de atención" });
    }
  });

  // Concierge Blocked Slots routes
  app.get("/api/concierge-blocked-slots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.adminUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Conserjes ven solo sus slots, admins ven todos
      let slots;
      if (user.role === "concierge") {
        slots = await storage.getConciergeBlockedSlots(userId);
      } else if (["master", "admin", "admin_jr"].includes(user.role)) {
        // Admins can filter by conciergeId
        const { conciergeId } = req.query;
        slots = conciergeId 
          ? await storage.getConciergeBlockedSlots(conciergeId as string)
          : [];
      } else {
        return res.status(403).json({ message: "No autorizado" });
      }

      res.json(slots);
    } catch (error) {
      console.error("Error fetching concierge blocked slots:", error);
      res.status(500).json({ message: "Error al obtener los horarios bloqueados" });
    }
  });

  app.post("/api/concierge-blocked-slots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.adminUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.role !== "concierge") {
        return res.status(403).json({ message: "Solo los conserjes pueden bloquear horarios" });
      }

      const { startTime, endTime, reason } = req.body;

      // Validate no confirmed appointments exist in this timeframe
      const appointments = await storage.getAppointments({
        status: "confirmed",
      });

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      const conflictingAppointments = appointments.filter((apt: any) => {
        if (apt.conciergeId !== userId) return false;
        const aptDate = new Date(apt.date);
        return aptDate >= startDate && aptDate <= endDate;
      });

      if (conflictingAppointments.length > 0) {
        return res.status(400).json({ 
          message: "No puedes bloquear horarios con citas confirmadas",
          conflictingAppointments: conflictingAppointments.length
        });
      }

      const slot = await storage.createConciergeBlockedSlot({
        conciergeId: userId,
        startTime: startDate,
        endTime: endDate,
        reason,
      });

      await createAuditLog(
        req,
        "create",
        "concierge_blocked_slot",
        slot.id,
        `Horario bloqueado: ${startTime} - ${endTime}`
      );

      res.status(201).json(slot);
    } catch (error) {
      console.error("Error creating concierge blocked slot:", error);
      res.status(500).json({ message: "Error al bloquear el horario" });
    }
  });

  app.delete("/api/concierge-blocked-slots/:id", isAuthenticated, requireResourceOwnership('blocked-slot', 'conciergeId'), async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.adminUser?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { id } = req.params;
      const slot = await storage.getConciergeBlockedSlot(id);

      if (!slot) {
        return res.status(404).json({ message: "Horario bloqueado no encontrado" });
      }

      // Only the owner concierge can delete their blocked slots
      if (slot.conciergeId !== userId) {
        return res.status(403).json({ message: "No autorizado para eliminar este horario" });
      }

      await storage.deleteConciergeBlockedSlot(id);

      await createAuditLog(
        req,
        "delete",
        "concierge_blocked_slot",
        id,
        `Horario desbloqueado`
      );

      res.json({ message: "Horario desbloqueado exitosamente" });
    } catch (error) {
      console.error("Error deleting concierge blocked slot:", error);
      res.status(500).json({ message: "Error al desbloquear el horario" });
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
  app.get("/api/presentation-cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Admin and master can see all cards if they pass a clientId
      // Regular users can only see their own cards
      let clientId: string | undefined;
      
      if (user && ["admin", "master"].includes(user.role)) {
        clientId = req.query.clientId as string;
      } else {
        // Force regular users to only see their own cards
        clientId = userId;
      }
      
      const cards = await storage.getPresentationCards(clientId);
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
      // Always use authenticated user's ID as clientId to prevent spoofing
      const clientId = userId;

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

  app.patch("/api/presentation-cards/:id", isAuthenticated, requireResourceOwnership('presentation-card', 'clientId'), async (req, res) => {
    try {
      const { id } = req.params;
      const card = await storage.updatePresentationCard(id, req.body);
      res.json(card);
    } catch (error) {
      console.error("Error updating presentation card:", error);
      res.status(500).json({ message: "Failed to update presentation card" });
    }
  });

  app.delete("/api/presentation-cards/:id", isAuthenticated, requireResourceOwnership('presentation-card', 'clientId'), async (req, res) => {
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
  app.patch("/api/presentation-cards/:id/toggle-active", isAuthenticated, requireResourceOwnership('presentation-card', 'clientId'), async (req: any, res) => {
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

  app.patch("/api/property-recommendations/:id/mark-read", isAuthenticated, requireResourceOwnership('property-recommendation', 'clientId'), async (req: any, res) => {
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

  app.patch("/api/property-recommendations/:id/set-interest", isAuthenticated, requireResourceOwnership('property-recommendation', 'clientId'), async (req: any, res) => {
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

  app.patch("/api/auto-suggestions/:id/mark-read", isAuthenticated, requireResourceOwnership('auto-suggestion', 'clientId'), async (req: any, res) => {
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

  app.patch("/api/auto-suggestions/:id/set-interest", isAuthenticated, requireResourceOwnership('auto-suggestion', 'clientId'), async (req: any, res) => {
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

  app.patch("/api/service-providers/:id", isAuthenticated, requireResourceOwnership('service-provider', 'userId'), async (req, res) => {
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

  app.post("/api/services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get the service provider for this user
      const providers = await storage.getServiceProviders({ userId });
      if (!providers || providers.length === 0) {
        return res.status(403).json({ message: "You must be a registered service provider to create services" });
      }
      
      const provider = providers[0];
      
      // Force providerId from authenticated user's service provider
      const serviceData = insertServiceSchema.parse({
        ...req.body,
        providerId: provider.id,
      });
      
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error: any) {
      console.error("Error creating service:", error);
      res.status(400).json({ message: error.message || "Failed to create service" });
    }
  });

  app.patch("/api/services/:id", isAuthenticated, requireResourceOwnership('service', 'providerId'), async (req, res) => {
    try {
      const { id } = req.params;
      const service = await storage.updateService(id, req.body);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, requireResourceOwnership('service', 'providerId'), async (req, res) => {
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

  app.patch("/api/service-bookings/:id", isAuthenticated, requireResourceOwnership('service-booking', 'clientId'), async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.updateServiceBooking(id, req.body);
      res.json(booking);
    } catch (error) {
      console.error("Error updating service booking:", error);
      res.status(500).json({ message: "Failed to update service booking" });
    }
  });

  app.delete("/api/service-bookings/:id", isAuthenticated, requireResourceOwnership('service-booking', 'clientId'), async (req, res) => {
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

  // Update custom referral percentages for a specific user
  app.patch("/api/admin/users/:userId/referral-config", isAuthenticated, requireFullAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { userId } = req.params;
      const { customClientReferralPercent, customOwnerReferralPercent } = req.body;

      const updates: any = {};
      if (customClientReferralPercent !== undefined) {
        updates.customClientReferralPercent = customClientReferralPercent === null ? null : customClientReferralPercent;
      }
      if (customOwnerReferralPercent !== undefined) {
        updates.customOwnerReferralPercent = customOwnerReferralPercent === null ? null : customOwnerReferralPercent;
      }

      const user = await storage.updateUser(userId, updates);

      await createAuditLog(
        req,
        "update",
        "user",
        userId,
        `Comisiones personalizadas actualizadas - Cliente: ${customClientReferralPercent ?? 'global'}%, Propietario: ${customOwnerReferralPercent ?? 'global'}%`
      );

      res.json(user);
    } catch (error: any) {
      console.error("Error updating user referral config:", error);
      res.status(500).json({ message: error.message || "Failed to update user referral configuration" });
    }
  });

  // Admin: Get all referrals with user information
  app.get("/api/admin/referrals/all", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { userId, type, status } = req.query;
      
      let clientReferrals: any[] = [];
      let ownerReferrals: any[] = [];

      if (!type || type === "client") {
        const clientFilters: any = {};
        if (userId) clientFilters.referrerId = userId;
        if (status) clientFilters.status = status;
        clientReferrals = await storage.getClientReferrals(clientFilters);
      }

      if (!type || type === "owner") {
        const ownerFilters: any = {};
        if (userId) ownerFilters.referrerId = userId;
        if (status) ownerFilters.status = status;
        ownerReferrals = await storage.getOwnerReferrals(ownerFilters);
      }

      // Get unique user IDs
      const userIds = new Set([
        ...clientReferrals.map(r => r.referrerId),
        ...ownerReferrals.map(r => r.referrerId),
      ]);

      // Fetch user information
      const users = await Promise.all(
        Array.from(userIds).map(id => storage.getUser(id as string))
      );

      const usersMap = new Map(
        users.filter(u => u).map(u => [u!.id, u])
      );

      // Group referrals by user
      const referralsByUser = new Map();

      for (const referral of clientReferrals) {
        if (!referralsByUser.has(referral.referrerId)) {
          const user = usersMap.get(referral.referrerId);
          referralsByUser.set(referral.referrerId, {
            user: {
              id: user?.id,
              firstName: user?.firstName,
              lastName: user?.lastName,
              email: user?.email,
              role: user?.role,
              profileImageUrl: user?.profileImageUrl,
            },
            clientReferrals: [],
            ownerReferrals: [],
          });
        }
        referralsByUser.get(referral.referrerId).clientReferrals.push(referral);
      }

      for (const referral of ownerReferrals) {
        if (!referralsByUser.has(referral.referrerId)) {
          const user = usersMap.get(referral.referrerId);
          referralsByUser.set(referral.referrerId, {
            user: {
              id: user?.id,
              firstName: user?.firstName,
              lastName: user?.lastName,
              email: user?.email,
              role: user?.role,
              profileImageUrl: user?.profileImageUrl,
            },
            clientReferrals: [],
            ownerReferrals: [],
          });
        }
        referralsByUser.get(referral.referrerId).ownerReferrals.push(referral);
      }

      res.json(Array.from(referralsByUser.values()));
    } catch (error) {
      console.error("Error fetching all referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
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

  // NOTA: Los vendedores NO pueden referir clientes, solo pueden referir propietarios
  // Este endpoint está restringido solo para administradores
  app.post("/api/referrals/clients", isAuthenticated, requireFullAdmin, async (req: any, res) => {
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

  app.patch("/api/referrals/owners/:id/approve", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
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
      
      await createAuditLog(
        req, 
        "update", 
        "owner_referral", 
        id, 
        `Referido de propietario aprobado con comisión de $${commissionAmount || updatedReferral.commissionAmount}`
      );
      
      res.json({ 
        message: "Referido aprobado exitosamente. Se ha notificado al vendedor.",
        ownerReferral: updatedReferral 
      });
    } catch (error: any) {
      console.error("Error approving owner referral:", error);
      res.status(400).json({ message: error.message || "Error al aprobar referido" });
    }
  });

  app.patch("/api/referrals/owners/:id/reject", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
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
      
      await createAuditLog(
        req, 
        "update", 
        "owner_referral", 
        id, 
        `Referido de propietario rechazado: ${rejectionReason}`
      );
      
      res.json({ 
        message: "Referido rechazado exitosamente",
        ownerReferral: updatedReferral 
      });
    } catch (error: any) {
      console.error("Error rejecting owner referral:", error);
      res.status(400).json({ message: error.message || "Error al rechazar referido" });
    }
  });

  // Offer routes
  app.get("/api/offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { status, clientId, propertyId } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (propertyId) filters.propertyId = propertyId;
      
      // Security: Only admins/masters/sellers can filter by different clientId
      // Clients can only see their own offers
      if (clientId && clientId !== userId) {
        if (!["master", "admin", "admin_jr", "seller"].includes(user.role)) {
          return res.status(403).json({ message: "No tienes permiso para ver ofertas de otros clientes" });
        }
        filters.clientId = clientId;
      } else if (user.role === "client") {
        // Clients always see only their own offers
        filters.clientId = userId;
      } else if (clientId) {
        // Admin/seller requested specific clientId
        filters.clientId = clientId;
      }

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
      const user = await storage.getUser(userId);
      
      // Determine clientId: admins/masters/sellers can specify, others use their own ID
      let clientId = userId;
      if (req.body.clientId && req.body.clientId !== userId) {
        if (user && ["master", "admin", "admin_jr", "seller"].includes(user.role)) {
          clientId = req.body.clientId;
        }
        // Non-admins cannot specify different clientId, silently use their own
      }
      
      // Clean special values
      const cleanedBody = {
        ...req.body,
        clientId,
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

  app.patch("/api/offers/:id", isAuthenticated, requireResourceOwnership('offer'), async (req: any, res) => {
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

  // Owner Offer Management routes
  app.get("/api/owner/offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !["owner", "admin", "master"].includes(user.role)) {
        return res.status(403).json({ message: "Solo propietarios pueden acceder a esta ruta" });
      }

      const offers = await storage.getOffersByOwner(userId);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching owner offers:", error);
      res.status(500).json({ message: "Error al obtener ofertas" });
    }
  });

  app.patch("/api/owner/offers/:id/accept", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify offer exists and user is the owner
      const offer = await storage.getOffer(id);
      if (!offer) {
        return res.status(404).json({ message: "Oferta no encontrada" });
      }

      const property = await storage.getProperty(offer.propertyId);
      if (!property || property.ownerId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para aceptar esta oferta" });
      }

      // Validate workflow state - owner can accept when it's client's turn (pending or countered by client)
      if (offer.status === 'accepted' || offer.status === 'rejected') {
        return res.status(400).json({ message: "Esta oferta ya fue procesada" });
      }

      if (offer.status === 'countered' && offer.lastOfferedBy === 'owner') {
        return res.status(400).json({ message: "No puedes aceptar tu propia contraoferta. Espera la respuesta del cliente." });
      }

      const { offer: acceptedOffer, contract } = await storage.acceptOffer(id);
      
      // Create notification for client about accepted offer
      await storage.createNotification({
        userId: offer.clientId,
        title: "Oferta Aceptada",
        message: `Tu oferta de renta para ${property.title || 'la propiedad'} ha sido aceptada por el propietario.`,
        category: "offer",
        relatedEntityType: "offer",
        relatedEntityId: id,
      });

      // Create notification for client about contract
      if (contract) {
        await storage.createNotification({
          userId: offer.clientId,
          title: "Completar Formato de Inquilino",
          message: `Por favor completa el formato de inquilino para proceder con el contrato de ${property.title || 'la propiedad'}.`,
          category: "contract",
          relatedEntityType: "rental_contract",
          relatedEntityId: contract.id,
        });

        // Create notification for owner about contract
        await storage.createNotification({
          userId: property.ownerId!,
          title: "Completar Formato de Propietario",
          message: `Por favor completa el formato de propietario para proceder con el contrato de ${property.title || 'la propiedad'}.`,
          category: "contract",
          relatedEntityType: "rental_contract",
          relatedEntityId: contract.id,
        });
      }

      await createAuditLog(
        req,
        "update",
        "offer",
        id,
        `Oferta aceptada por propietario - Contrato creado: ${contract?.id}`
      );

      res.json({ offer: acceptedOffer, contract });
    } catch (error) {
      console.error("Error accepting offer:", error);
      res.status(500).json({ message: "Error al aceptar oferta" });
    }
  });

  // POST endpoint for accept (compatibility with testing/external APIs)
  app.post("/api/owner/offers/:id/accept", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify offer exists and user is the owner
      const offer = await storage.getOffer(id);
      if (!offer) {
        return res.status(404).json({ message: "Oferta no encontrada" });
      }

      const property = await storage.getProperty(offer.propertyId);
      if (!property || property.ownerId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para aceptar esta oferta" });
      }

      // Validate workflow state - owner can accept when it's client's turn (pending or countered by client)
      if (offer.status === 'accepted' || offer.status === 'rejected') {
        return res.status(400).json({ message: "Esta oferta ya fue procesada" });
      }

      if (offer.status === 'countered' && offer.lastOfferedBy === 'owner') {
        return res.status(400).json({ message: "No puedes aceptar tu propia contraoferta. Espera la respuesta del cliente." });
      }

      const { offer: acceptedOffer, contract } = await storage.acceptOffer(id);
      
      console.log(`[ACCEPT OFFER] Offer ${id} accepted. Contract created: ${contract?.id}`);
      
      // Create notification for client about accepted offer
      await storage.createNotification({
        userId: offer.clientId,
        title: "Oferta Aceptada",
        message: `Tu oferta de renta para ${property.title || 'la propiedad'} ha sido aceptada por el propietario.`,
        category: "offer",
        relatedEntityType: "offer",
        relatedEntityId: id,
      });

      // Create notification for client about contract
      if (contract) {
        await storage.createNotification({
          userId: offer.clientId,
          title: "Completar Formato de Inquilino",
          message: `Por favor completa el formato de inquilino para proceder con el contrato de ${property.title || 'la propiedad'}.`,
          category: "contract",
          relatedEntityType: "rental_contract",
          relatedEntityId: contract.id,
        });

        // Create notification for owner about contract
        await storage.createNotification({
          userId: property.ownerId!,
          title: "Completar Formato de Propietario",
          message: `Por favor completa el formato de propietario para proceder con el contrato de ${property.title || 'la propiedad'}.`,
          category: "contract",
          relatedEntityType: "rental_contract",
          relatedEntityId: contract.id,
        });
      }

      await createAuditLog(
        req,
        "update",
        "offer",
        id,
        `Oferta aceptada por propietario - Contrato creado: ${contract?.id}`
      );

      res.json({ offer: acceptedOffer, contract });
    } catch (error) {
      console.error("Error accepting offer:", error);
      res.status(500).json({ message: "Error al aceptar oferta" });
    }
  });

  app.patch("/api/owner/offers/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.claims.sub;
      
      // Verify offer exists and user is the owner
      const offer = await storage.getOffer(id);
      if (!offer) {
        return res.status(404).json({ message: "Oferta no encontrada" });
      }

      const property = await storage.getProperty(offer.propertyId);
      if (!property || property.ownerId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para rechazar esta oferta" });
      }

      // Validate workflow state
      if (offer.status === 'accepted' || offer.status === 'rejected') {
        return res.status(400).json({ message: "Esta oferta ya fue procesada" });
      }

      if (offer.status === 'countered' && offer.lastOfferedBy === 'owner') {
        return res.status(400).json({ message: "No puedes rechazar tu propia contraoferta. Espera la respuesta del cliente." });
      }

      const rejectedOffer = await storage.rejectOffer(id, reason);
      
      // Create notification for client
      await storage.createNotification({
        userId: offer.clientId,
        title: "Oferta Rechazada",
        message: `Tu oferta de renta para ${property.title || 'la propiedad'} ha sido rechazada. ${reason ? `Razón: ${reason}` : ''}`,
        category: "offer",
        relatedEntityType: "offer",
        relatedEntityId: id,
      });

      await createAuditLog(
        req,
        "update",
        "offer",
        id,
        `Oferta rechazada por propietario${reason ? ': ' + reason : ''}`
      );

      res.json(rejectedOffer);
    } catch (error) {
      console.error("Error rejecting offer:", error);
      res.status(500).json({ message: "Error al rechazar oferta" });
    }
  });

  app.post("/api/owner/offers/:id/counter-offer", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Validate counter offer payload with Zod
      const counterOfferSchema = z.object({
        counterOfferAmount: z.string().optional(),
        counterOfferServicesIncluded: z.any().optional(),
        counterOfferServicesExcluded: z.any().optional(),
        counterOfferNotes: z.string().optional(),
      });

      const validatedData = counterOfferSchema.parse(req.body);
      
      // Verify offer exists and user is the owner
      const offer = await storage.getOffer(id);
      if (!offer) {
        return res.status(404).json({ message: "Oferta no encontrada" });
      }

      const property = await storage.getProperty(offer.propertyId);
      if (!property || property.ownerId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para contraofertar esta oferta" });
      }

      // Validate workflow state - owner can counter-offer when it's their turn (pending or countered by client)
      if (offer.status === 'accepted' || offer.status === 'rejected') {
        return res.status(400).json({ message: "Esta oferta ya fue procesada" });
      }

      if (offer.status === 'countered' && offer.lastOfferedBy === 'owner') {
        return res.status(400).json({ message: "Ya enviaste una contraoferta. Espera la respuesta del cliente." });
      }

      // Check negotiation round limit
      const currentRound = offer.negotiationRound || 0;
      if (currentRound >= 3) {
        return res.status(400).json({ message: "Se alcanzó el límite máximo de 3 rondas de negociación" });
      }

      const counterOffer = await storage.createCounterOffer(id, {
        ...validatedData,
        offeredBy: 'owner'
      });
      
      // Create notification for client
      await storage.createNotification({
        userId: offer.clientId,
        title: "Contraoferta Recibida",
        message: `El propietario ha enviado una contraoferta para tu solicitud de renta de ${property.title || 'la propiedad'}.`,
        category: "offer",
        relatedEntityType: "offer",
        relatedEntityId: id,
      });

      await createAuditLog(
        req,
        "create",
        "offer",
        id,
        `Contraoferta creada por propietario - Ronda ${counterOffer.negotiationRound}`
      );

      res.json(counterOffer);
    } catch (error: any) {
      console.error("Error creating counter offer:", error);
      res.status(400).json({ message: error.message || "Error al crear contraoferta" });
    }
  });

  // Client Offer Management routes
  app.get("/api/client/my-offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const offers = await storage.getOffers({ clientId: userId });
      
      // Enrich offers with property and owner data
      const enrichedOffers = await Promise.all(
        offers.map(async (offer) => {
          const property = await storage.getProperty(offer.propertyId);
          let owner = null;
          if (property?.ownerId) {
            owner = await storage.getUser(property.ownerId);
          }
          return {
            ...offer,
            property,
            owner
          };
        })
      );
      
      res.json(enrichedOffers);
    } catch (error) {
      console.error("Error fetching client offers:", error);
      res.status(500).json({ message: "Error al obtener ofertas" });
    }
  });

  app.patch("/api/client/offers/:id/accept-counter", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify offer exists and user is the client
      const offer = await storage.getOffer(id);
      if (!offer) {
        return res.status(404).json({ message: "Oferta no encontrada" });
      }

      if (offer.clientId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para aceptar esta contraoferta" });
      }

      // Validate workflow state - client can accept when it's owner's turn (countered by owner)
      if (offer.status === 'accepted' || offer.status === 'rejected') {
        return res.status(400).json({ message: "Esta oferta ya fue procesada" });
      }

      if (offer.status !== 'countered') {
        return res.status(400).json({ message: "No hay contraoferta pendiente para aceptar" });
      }

      if (offer.lastOfferedBy === 'client') {
        return res.status(400).json({ message: "No puedes aceptar tu propia contraoferta. Espera la respuesta del propietario." });
      }

      const { offer: acceptedOffer, contract } = await storage.acceptOffer(id);
      
      // Get property and owner for notification
      const property = await storage.getProperty(offer.propertyId);
      if (property?.ownerId) {
        await storage.createNotification({
          userId: property.ownerId,
          title: "Contraoferta Aceptada",
          message: `El cliente ha aceptado tu contraoferta para ${property.title || 'la propiedad'}.`,
          category: "offer",
          relatedEntityType: "offer",
          relatedEntityId: id,
        });

        // Create notification for owner about contract
        if (contract) {
          await storage.createNotification({
            userId: property.ownerId,
            title: "Completar Formato de Propietario",
            message: `Por favor completa el formato de propietario para proceder con el contrato de ${property.title || 'la propiedad'}.`,
            category: "contract",
            relatedEntityType: "rental_contract",
            relatedEntityId: contract.id,
          });
        }
      }

      // Create notification for client about contract
      if (contract) {
        await storage.createNotification({
          userId: offer.clientId,
          title: "Completar Formato de Inquilino",
          message: `Por favor completa el formato de inquilino para proceder con el contrato de ${property.title || 'la propiedad'}.`,
          category: "contract",
          relatedEntityType: "rental_contract",
          relatedEntityId: contract.id,
        });
      }

      await createAuditLog(
        req,
        "update",
        "offer",
        id,
        `Contraoferta aceptada por cliente - Contrato creado: ${contract?.id}`
      );

      res.json({ offer: acceptedOffer, contract });
    } catch (error) {
      console.error("Error accepting counter offer:", error);
      res.status(500).json({ message: "Error al aceptar contraoferta" });
    }
  });

  app.patch("/api/client/offers/:id/reject-counter", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.claims.sub;
      
      // Verify offer exists and user is the client
      const offer = await storage.getOffer(id);
      if (!offer) {
        return res.status(404).json({ message: "Oferta no encontrada" });
      }

      if (offer.clientId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para rechazar esta contraoferta" });
      }

      // Validate workflow state
      if (offer.status === 'accepted' || offer.status === 'rejected') {
        return res.status(400).json({ message: "Esta oferta ya fue procesada" });
      }

      if (offer.status !== 'countered') {
        return res.status(400).json({ message: "No hay contraoferta pendiente para rechazar" });
      }

      if (offer.lastOfferedBy === 'client') {
        return res.status(400).json({ message: "No puedes rechazar tu propia contraoferta. Espera la respuesta del propietario." });
      }

      const rejectedOffer = await storage.rejectOffer(id, reason);
      
      // Get property and owner for notification
      const property = await storage.getProperty(offer.propertyId);
      if (property?.ownerId) {
        await storage.createNotification({
          userId: property.ownerId,
          title: "Contraoferta Rechazada",
          message: `El cliente ha rechazado tu contraoferta para ${property.title || 'la propiedad'}. ${reason ? `Razón: ${reason}` : ''}`,
          category: "offer",
          relatedEntityType: "offer",
          relatedEntityId: id,
        });
      }

      await createAuditLog(
        req,
        "update",
        "offer",
        id,
        `Contraoferta rechazada por cliente${reason ? ': ' + reason : ''}`
      );

      res.json(rejectedOffer);
    } catch (error) {
      console.error("Error rejecting counter offer:", error);
      res.status(500).json({ message: "Error al rechazar contraoferta" });
    }
  });

  app.post("/api/client/offers/:id/counter-offer", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Validate counter offer payload with Zod
      const counterOfferSchema = z.object({
        counterOfferAmount: z.string().optional(),
        counterOfferServicesIncluded: z.any().optional(),
        counterOfferServicesExcluded: z.any().optional(),
        counterOfferNotes: z.string().optional(),
      });

      const validatedData = counterOfferSchema.parse(req.body);
      
      // Verify offer exists and user is the client
      const offer = await storage.getOffer(id);
      if (!offer) {
        return res.status(404).json({ message: "Oferta no encontrada" });
      }

      if (offer.clientId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para contraofertar" });
      }

      // Validate workflow state - client can counter-offer when it's their turn (countered by owner)
      if (offer.status === 'accepted' || offer.status === 'rejected') {
        return res.status(400).json({ message: "Esta oferta ya fue procesada" });
      }

      if (offer.status === 'countered' && offer.lastOfferedBy === 'client') {
        return res.status(400).json({ message: "Ya enviaste una contraoferta. Espera la respuesta del propietario." });
      }

      // Check negotiation round limit
      const currentRound = offer.negotiationRound || 0;
      if (currentRound >= 3) {
        return res.status(400).json({ message: "Se alcanzó el límite máximo de 3 rondas de negociación" });
      }

      const counterOffer = await storage.createCounterOffer(id, {
        ...validatedData,
        offeredBy: 'client'
      });
      
      // Get property and owner for notification
      const property = await storage.getProperty(offer.propertyId);
      if (property?.ownerId) {
        await storage.createNotification({
          userId: property.ownerId,
          title: "Nueva Contraoferta",
          message: `El cliente ha enviado una contraoferta para tu propiedad ${property.title || ''}.`,
          category: "offer",
          relatedEntityType: "offer",
          relatedEntityId: id,
        });
      }

      await createAuditLog(
        req,
        "create",
        "offer",
        id,
        `Contraoferta creada por cliente - Ronda ${counterOffer.negotiationRound}`
      );

      res.json(counterOffer);
    } catch (error: any) {
      console.error("Error creating counter offer:", error);
      res.status(400).json({ message: error.message || "Error al crear contraoferta" });
    }
  });

  // Contract Routes
  app.get("/api/contracts/:contractId", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      const contract = await storage.getRentalContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      // Verify user has access to this contract (tenant, owner, or admin)
      const property = await storage.getProperty(contract.propertyId);
      const user = await storage.getUser(userId);
      const isAdmin = user && ["master", "admin", "admin_jr"].includes(user.role);
      
      if (contract.tenantId !== userId && property?.ownerId !== userId && !isAdmin) {
        return res.status(403).json({ message: "No tienes permiso para ver este contrato" });
      }

      // Get additional info
      const tenantInfo = await storage.getContractTenantInfo(contractId);
      const ownerInfo = await storage.getContractOwnerInfo(contractId);

      res.json({ contract, tenantInfo, ownerInfo, property });
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ message: "Error al obtener contrato" });
    }
  });

  app.get("/api/contracts/:contractId/tenant-info", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      const contract = await storage.getRentalContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      // Verify user is the tenant
      if (contract.tenantId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para ver esta información" });
      }

      const tenantInfo = await storage.getContractTenantInfo(contractId);
      res.json(tenantInfo || null);
    } catch (error) {
      console.error("Error fetching tenant info:", error);
      res.status(500).json({ message: "Error al obtener información del inquilino" });
    }
  });

  app.post("/api/contracts/:contractId/tenant-info", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      const contract = await storage.getRentalContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      // Verify user is the tenant
      if (contract.tenantId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para actualizar esta información" });
      }

      // Validate request body with Zod schema
      const validationResult = insertContractTenantInfoSchema
        .omit({ rentalContractId: true })
        .partial()
        .safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const sanitizedData = sanitizeObject(validationResult.data);

      // Check if info already exists
      const existingInfo = await storage.getContractTenantInfo(contractId);
      
      let tenantInfo;
      if (existingInfo) {
        tenantInfo = await storage.updateContractTenantInfo(contractId, sanitizedData);
      } else {
        tenantInfo = await storage.createContractTenantInfo({
          ...sanitizedData,
          rentalContractId: contractId
        });
      }

      // Update contract status if both forms are complete
      const ownerInfo = await storage.getContractOwnerInfo(contractId);
      if (ownerInfo) {
        await storage.updateRentalContractStatus(contractId, 'pendiente_verificacion');
        
        // Notify admin to verify
        const admins = await storage.getAllAdmins();
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.userId,
            title: "Contrato Listo para Verificación",
            message: `El contrato ${contractId} ha sido completado y está listo para verificación.`,
            category: "contract",
            relatedEntityType: "rental_contract",
            relatedEntityId: contractId,
          });
        }
      }

      await createAuditLog(
        req,
        existingInfo ? "update" : "create",
        "contract_tenant_info",
        contractId,
        `Información de inquilino ${existingInfo ? 'actualizada' : 'creada'}`
      );

      res.json(tenantInfo);
    } catch (error) {
      console.error("Error saving tenant info:", error);
      res.status(500).json({ message: "Error al guardar información del inquilino" });
    }
  });

  app.get("/api/contracts/:contractId/owner-info", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      const contract = await storage.getRentalContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      const property = await storage.getProperty(contract.propertyId);
      
      // Verify user is the owner
      if (property?.ownerId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para ver esta información" });
      }

      const ownerInfo = await storage.getContractOwnerInfo(contractId);
      res.json(ownerInfo || null);
    } catch (error) {
      console.error("Error fetching owner info:", error);
      res.status(500).json({ message: "Error al obtener información del propietario" });
    }
  });

  app.post("/api/contracts/:contractId/owner-info", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      const contract = await storage.getRentalContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      const property = await storage.getProperty(contract.propertyId);
      
      // Verify user is the owner
      if (property?.ownerId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para actualizar esta información" });
      }

      // Validate request body with Zod schema
      const validationResult = insertContractOwnerInfoSchema
        .omit({ rentalContractId: true })
        .partial()
        .safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const sanitizedData = sanitizeObject(validationResult.data);

      // Check if info already exists
      const existingInfo = await storage.getContractOwnerInfo(contractId);
      
      let ownerInfo;
      if (existingInfo) {
        ownerInfo = await storage.updateContractOwnerInfo(contractId, sanitizedData);
      } else {
        ownerInfo = await storage.createContractOwnerInfo({
          ...sanitizedData,
          rentalContractId: contractId
        });
      }

      // Update contract status if both forms are complete
      const tenantInfo = await storage.getContractTenantInfo(contractId);
      if (tenantInfo) {
        await storage.updateRentalContractStatus(contractId, 'pendiente_verificacion');
        
        // Notify admin to verify
        const admins = await storage.getAllAdmins();
        for (const admin of admins) {
          await storage.createNotification({
            userId: admin.userId,
            title: "Contrato Listo para Verificación",
            message: `El contrato ${contractId} ha sido completado y está listo para verificación.`,
            category: "contract",
            relatedEntityType: "rental_contract",
            relatedEntityId: contractId,
          });
        }
      }

      await createAuditLog(
        req,
        existingInfo ? "update" : "create",
        "contract_owner_info",
        contractId,
        `Información de propietario ${existingInfo ? 'actualizada' : 'creada'}`
      );

      res.json(ownerInfo);
    } catch (error) {
      console.error("Error saving owner info:", error);
      res.status(500).json({ message: "Error al guardar información del propietario" });
    }
  });

  app.patch("/api/contracts/:contractId/verify", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const { verified, notes } = req.body;
      const userId = req.user.claims.sub;
      
      // Verify user is admin
      const user = await storage.getUser(userId);
      if (!user || !["master", "admin", "admin_jr"].includes(user.role)) {
        return res.status(403).json({ message: "No tienes permiso para verificar contratos" });
      }
      
      const contract = await storage.getRentalContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      if (contract.status !== 'pendiente_verificacion') {
        return res.status(400).json({ message: "El contrato no está en estado pendiente de verificación" });
      }

      if (verified) {
        // Approve and move to apartado
        await storage.updateRentalContractStatus(contractId, 'apartado', {
          apartadoDate: new Date()
        });

        // Notify tenant and owner to sign
        await storage.createNotification({
          userId: contract.tenantId,
          title: "Contrato Verificado - Firma Digital",
          message: `Tu contrato ha sido verificado. Por favor firma digitalmente para continuar.`,
          category: "contract",
          relatedEntityType: "rental_contract",
          relatedEntityId: contractId,
        });

        const property = await storage.getProperty(contract.propertyId);
        if (property?.ownerId) {
          await storage.createNotification({
            userId: property.ownerId,
            title: "Contrato Verificado - Firma Digital",
            message: `El contrato ha sido verificado. Por favor firma digitalmente para continuar.`,
            category: "contract",
            relatedEntityType: "rental_contract",
            relatedEntityId: contractId,
          });
        }
      } else {
        // Reject and move back to draft
        await storage.updateRentalContractStatus(contractId, 'draft');

        // Notify about rejection
        await storage.createNotification({
          userId: contract.tenantId,
          title: "Contrato Requiere Correcciones",
          message: `Tu contrato requiere correcciones. ${notes || ''}`,
          category: "contract",
          relatedEntityType: "rental_contract",
          relatedEntityId: contractId,
        });
      }

      await createAuditLog(
        req,
        "update",
        "rental_contract",
        contractId,
        `Contrato ${verified ? 'verificado' : 'rechazado'} por admin${notes ? ': ' + notes : ''}`
      );

      const updatedContract = await storage.getRentalContract(contractId);
      res.json(updatedContract);
    } catch (error) {
      console.error("Error verifying contract:", error);
      res.status(500).json({ message: "Error al verificar contrato" });
    }
  });

  // Offer Token routes - Enlaces privados para ofertas sin login
  app.post("/api/offer-tokens", isAuthenticated, requireRole(["admin", "master", "admin_jr", "seller"]), async (req: any, res) => {
    try {
      const { propertyId, leadId } = req.body;
      const userId = req.user.claims.sub;

      // Validate property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // If leadId provided, validate lead exists
      if (leadId) {
        const lead = await storage.getLead(leadId);
        if (!lead) {
          return res.status(404).json({ message: "Lead no encontrado" });
        }
      }

      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Calculate expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create offer token
      const offerToken = await db.insert(offerTokens).values({
        token,
        propertyId,
        leadId: leadId || null,
        createdBy: userId,
        expiresAt,
        isUsed: false,
      }).returning();

      // Update lead status to "oferta_enviada" if leadId provided
      if (leadId) {
        await storage.updateLeadStatus(leadId, "oferta_enviada");
      }

      await createAuditLog(
        req,
        "create",
        "offer_token",
        offerToken[0].id,
        `Token de oferta creado para propiedad ${property.title || propertyId}${leadId ? ' y lead actualizado a oferta_enviada' : ''}`
      );

      // Return token with property info
      res.status(201).json({
        ...offerToken[0],
        property,
      });
    } catch (error: any) {
      console.error("Error creating offer token:", error);
      res.status(400).json({ message: error.message || "Error al crear token de oferta" });
    }
  });

  // Validate offer token (public route)
  app.get("/api/offer-tokens/:token/validate", async (req, res) => {
    try {
      const { token } = req.params;

      const [offerToken] = await db
        .select()
        .from(offerTokens)
        .where(eq(offerTokens.token, token))
        .limit(1);

      if (!offerToken) {
        return res.status(404).json({ 
          valid: false, 
          message: "Token no encontrado" 
        });
      }

      // Check if expired
      if (new Date() > new Date(offerToken.expiresAt)) {
        return res.status(410).json({ 
          valid: false, 
          message: "Este enlace ha expirado" 
        });
      }

      // Check if already used
      if (offerToken.isUsed) {
        return res.status(410).json({ 
          valid: false, 
          message: "Este enlace ya fue utilizado" 
        });
      }

      // Get property info
      const property = await storage.getProperty(offerToken.propertyId);

      // Get lead info if leadId exists
      let lead = null;
      if (offerToken.leadId) {
        lead = await storage.getLead(offerToken.leadId);
      }

      res.json({
        valid: true,
        property,
        lead,
        expiresAt: offerToken.expiresAt,
      });
    } catch (error) {
      console.error("Error validating offer token:", error);
      res.status(500).json({ message: "Error al validar token" });
    }
  });

  // Upload pet photos for offer (public route)
  app.post("/api/offer-tokens/:token/upload-pet-photos", upload.array('petPhotos', 3), async (req: any, res) => {
    try {
      const { token } = req.params;
      
      // Validate token exists
      const [offerToken] = await db
        .select()
        .from(offerTokens)
        .where(eq(offerTokens.token, token))
        .limit(1);

      if (!offerToken) {
        return res.status(404).json({ message: "Token no encontrado" });
      }

      // Check if expired
      if (new Date() > new Date(offerToken.expiresAt)) {
        return res.status(410).json({ message: "Este enlace ha expirado" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No se subieron archivos" });
      }

      // Generate URLs for uploaded files
      const photoUrls = (req.files as Express.Multer.File[]).map(file => {
        return `/attached_assets/stock_images/${file.filename}`;
      });

      res.json({ 
        message: "Fotos subidas exitosamente",
        urls: photoUrls 
      });
    } catch (error) {
      console.error("Error uploading pet photos:", error);
      res.status(500).json({ message: "Error al subir fotos" });
    }
  });

  // Submit offer via token (public route)
  app.post("/api/offer-tokens/:token/submit", async (req, res) => {
    try {
      const { token } = req.params;
      const offerData = req.body;

      const [offerToken] = await db
        .select()
        .from(offerTokens)
        .where(eq(offerTokens.token, token))
        .limit(1);

      if (!offerToken) {
        return res.status(404).json({ message: "Token no encontrado" });
      }

      // Check if expired
      if (new Date() > new Date(offerToken.expiresAt)) {
        return res.status(410).json({ message: "Este enlace ha expirado" });
      }

      // Check if already used
      if (offerToken.isUsed) {
        return res.status(410).json({ message: "Este enlace ya fue utilizado" });
      }

      // Update offer token with submitted data
      const [updatedToken] = await db
        .update(offerTokens)
        .set({
          offerData: {
            ...offerData,
            submittedAt: new Date().toISOString(),
          },
          isUsed: true,
          updatedAt: new Date(),
        })
        .where(eq(offerTokens.id, offerToken.id))
        .returning();

      // Update lead status to "en_negociacion" if leadId exists
      if (offerToken.leadId) {
        await storage.updateLeadStatus(offerToken.leadId, "en_negociacion");
      }

      res.json({
        message: "Oferta enviada exitosamente",
        tokenId: updatedToken.id,
      });
    } catch (error) {
      console.error("Error submitting offer:", error);
      res.status(500).json({ message: "Error al enviar oferta" });
    }
  });

  // Get all received offers (admins only)
  app.get("/api/offer-tokens", isAuthenticated, requireRole(["admin", "master", "admin_jr"]), async (req, res) => {
    try {
      const { status } = req.query;

      let query = db
        .select()
        .from(offerTokens)
        .orderBy(desc(offerTokens.createdAt));

      if (status === "used") {
        query = query.where(eq(offerTokens.isUsed, true));
      } else if (status === "pending") {
        query = query.where(eq(offerTokens.isUsed, false));
      }

      const tokens = await query;

      // Enrich with property, creator, and lead info
      const enrichedTokens = await Promise.all(
        tokens.map(async (token) => {
          const property = await storage.getProperty(token.propertyId);
          const creator = await storage.getUser(token.createdBy);
          let lead = null;
          if (token.leadId) {
            lead = await storage.getLead(token.leadId);
          }
          return {
            ...token,
            property,
            creator,
            lead,
          };
        })
      );

      res.json(enrichedTokens);
    } catch (error) {
      console.error("Error fetching offer tokens:", error);
      res.status(500).json({ message: "Error al obtener tokens de oferta" });
    }
  });

  // Delete offer token (admins only)
  app.delete("/api/offer-tokens/:id", isAuthenticated, requireRole(["admin", "master", "admin_jr"]), async (req, res) => {
    try {
      const { id } = req.params;

      // Check if token exists
      const [existingToken] = await db
        .select()
        .from(offerTokens)
        .where(eq(offerTokens.id, id))
        .limit(1);

      if (!existingToken) {
        return res.status(404).json({ message: "Token no encontrado" });
      }

      // Delete the token
      await db
        .delete(offerTokens)
        .where(eq(offerTokens.id, id));

      res.json({ message: "Link eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting offer token:", error);
      res.status(500).json({ message: "Error al eliminar link" });
    }
  });

  // Send offer link via email
  app.post("/api/offer-tokens/:id/send-email", isAuthenticated, requireRole(["admin", "master", "admin_jr", "seller"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { clientEmail, clientName } = req.body;

      if (!clientEmail || !clientName) {
        return res.status(400).json({ message: "Email y nombre del cliente son requeridos" });
      }

      // Get offer token
      const [offerToken] = await db
        .select()
        .from(offerTokens)
        .where(eq(offerTokens.id, id))
        .limit(1);

      if (!offerToken) {
        return res.status(404).json({ message: "Token de oferta no encontrado" });
      }

      // Get property info
      const property = await storage.getProperty(offerToken.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Build offer link
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'app.replit.dev'}`
        : 'http://localhost:5000';
      const offerLink = `${baseUrl}/offer/${offerToken.token}`;

      // Send email
      await sendOfferLinkEmail(
        clientEmail,
        clientName,
        property.title || 'la propiedad',
        offerLink
      );

      await createAuditLog(
        req,
        "create",
        "offer_token_email",
        offerToken.id,
        `Email enviado a ${clientEmail} con link de oferta para ${property.title}`
      );

      res.json({ 
        message: "Email enviado exitosamente",
        offerLink 
      });
    } catch (error: any) {
      console.error("Error sending offer link email:", error);
      res.status(500).json({ message: error.message || "Error al enviar email" });
    }
  });

  // Generate PDF for offer
  app.get("/api/offers/:id/pdf", isAuthenticated, requireRole(["admin", "master", "admin_jr"]), async (req, res) => {
    try {
      const { id } = req.params;

      // Get offer token
      const [offerToken] = await db
        .select()
        .from(offerTokens)
        .where(eq(offerTokens.id, id))
        .limit(1);

      if (!offerToken) {
        return res.status(404).json({ message: "Token de oferta no encontrado" });
      }

      if (!offerToken.isUsed || !offerToken.offerData) {
        return res.status(400).json({ message: "La oferta aún no ha sido completada" });
      }

      // Get property info
      const property = await storage.getProperty(offerToken.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Generate PDF
      const pdfBuffer = await generateOfferPDF(offerToken.offerData, property);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="oferta-${offerToken.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Error al generar PDF" });
    }
  });

  // Rental Form Token routes - Enlaces privados para formato de renta de inquilino
  app.post("/api/rental-form-tokens", isAuthenticated, requireRole(["admin", "master", "admin_jr", "seller"]), async (req: any, res) => {
    try {
      const { propertyId, leadId } = req.body;
      const userId = req.user.claims.sub;

      // Validate property exists
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Generate unique token (16 characters - suficiente para enlaces temporales)
      const token = crypto.randomBytes(8).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

      const [rentalFormToken] = await db
        .insert(tenantRentalFormTokens)
        .values({
          token,
          propertyId,
          leadId: leadId || null,
          createdBy: userId,
          expiresAt,
          isUsed: false,
        })
        .returning();

      await createAuditLog(
        req,
        "create",
        "rental_form_token",
        rentalFormToken.id,
        `Token de formato de renta creado para propiedad ${property.title || property.id}`
      );

      res.json({
        ...rentalFormToken,
        property,
      });
    } catch (error: any) {
      console.error("Error creating rental form token:", error);
      res.status(400).json({ message: error.message || "Error al crear token de formato de renta" });
    }
  });

  // Validate rental form token (public route)
  app.get("/api/rental-form-tokens/:token/validate", async (req, res) => {
    try {
      const { token } = req.params;

      const [rentalFormToken] = await db
        .select()
        .from(tenantRentalFormTokens)
        .where(eq(tenantRentalFormTokens.token, token))
        .limit(1);

      if (!rentalFormToken) {
        return res.status(404).json({ message: "Token no encontrado" });
      }

      // Check if token is expired
      if (new Date() > new Date(rentalFormToken.expiresAt)) {
        return res.status(400).json({ message: "Este enlace ha expirado" });
      }

      // Check if token is already used
      if (rentalFormToken.isUsed) {
        return res.status(400).json({ message: "Este enlace ya ha sido utilizado" });
      }

      // Get property info
      const property = await storage.getProperty(rentalFormToken.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      res.json({
        valid: true,
        property,
        expiresAt: rentalFormToken.expiresAt,
      });
    } catch (error) {
      console.error("Error validating rental form token:", error);
      res.status(500).json({ message: "Error al validar token" });
    }
  });

  // Submit rental form via token (public route)
  app.post("/api/rental-form-tokens/:token/submit", async (req, res) => {
    try {
      const { token } = req.params;
      const formData = req.body;

      const [rentalFormToken] = await db
        .select()
        .from(tenantRentalFormTokens)
        .where(eq(tenantRentalFormTokens.token, token))
        .limit(1);

      if (!rentalFormToken) {
        return res.status(404).json({ message: "Token no encontrado" });
      }

      if (new Date() > new Date(rentalFormToken.expiresAt)) {
        return res.status(400).json({ message: "Este enlace ha expirado" });
      }

      if (rentalFormToken.isUsed) {
        return res.status(400).json({ message: "Este enlace ya ha sido utilizado" });
      }

      // Transform date string to Date object if present
      const transformedData: any = { ...formData };
      if (transformedData.checkInDate && typeof transformedData.checkInDate === 'string') {
        // Parse date string as UTC noon to avoid timezone shift issues
        // Input format: "YYYY-MM-DD" -> Parse as "YYYY-MM-DD 12:00:00 UTC"
        const dateParts = transformedData.checkInDate.split('-');
        if (dateParts.length === 3) {
          transformedData.checkInDate = new Date(Date.UTC(
            parseInt(dateParts[0]), // year
            parseInt(dateParts[1]) - 1, // month (0-indexed)
            parseInt(dateParts[2]), // day
            12, 0, 0 // noon UTC to avoid day boundary issues
          ));
        }
      }

      // Validate integer fields to prevent out-of-range errors
      if (transformedData.age !== undefined && transformedData.age !== null) {
        const age = Number(transformedData.age);
        if (!Number.isFinite(age) || age < 18 || age > 150) {
          return res.status(400).json({ message: "Edad debe estar entre 18 y 150 años" });
        }
        transformedData.age = Math.floor(age); // Ensure integer
      }
      
      if (transformedData.numberOfTenants !== undefined && transformedData.numberOfTenants !== null) {
        const numberOfTenants = Number(transformedData.numberOfTenants);
        if (!Number.isFinite(numberOfTenants) || numberOfTenants < 1 || numberOfTenants > 20) {
          return res.status(400).json({ message: "Número de inquilinos debe estar entre 1 y 20" });
        }
        transformedData.numberOfTenants = Math.floor(numberOfTenants); // Ensure integer
      }
      
      if (transformedData.guarantorAge !== undefined && transformedData.guarantorAge !== null) {
        const guarantorAge = Number(transformedData.guarantorAge);
        if (!Number.isFinite(guarantorAge) || guarantorAge < 18 || guarantorAge > 150) {
          return res.status(400).json({ message: "Edad del garante debe estar entre 18 y 150 años" });
        }
        transformedData.guarantorAge = Math.floor(guarantorAge); // Ensure integer
      }

      // Filter out undefined values to prevent Drizzle/Postgres errors
      const cleanedData: any = {};
      for (const [key, value] of Object.entries(transformedData)) {
        if (value !== undefined && value !== '') {
          cleanedData[key] = value;
        }
      }

      // Create tenant rental form
      const [rentalForm] = await db
        .insert(tenantRentalForms)
        .values({
          tokenId: rentalFormToken.id,
          propertyId: rentalFormToken.propertyId,
          leadId: rentalFormToken.leadId,
          ...cleanedData,
          status: 'pendiente',
        })
        .returning();

      // Mark token as used
      await db
        .update(tenantRentalFormTokens)
        .set({ 
          isUsed: true,
          usedAt: new Date(),
        })
        .where(eq(tenantRentalFormTokens.id, rentalFormToken.id));

      // Note: Lead status remains "en_negociacion" after form submission
      // Admin will review the form and then proceed to contract elaboration

      res.json({
        success: true,
        message: "Formato de renta enviado exitosamente",
        formId: rentalForm.id,
      });
    } catch (error) {
      console.error("Error submitting rental form:", error);
      res.status(500).json({ message: "Error al enviar formato de renta" });
    }
  });

  // Send rental form link via email
  app.post("/api/rental-form-tokens/:id/send-email", isAuthenticated, requireRole(["admin", "master", "admin_jr", "seller"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { clientEmail, clientName } = req.body;

      if (!clientEmail || !clientName) {
        return res.status(400).json({ message: "Email y nombre del cliente son requeridos" });
      }

      // Get rental form token
      const [rentalFormToken] = await db
        .select()
        .from(tenantRentalFormTokens)
        .where(eq(tenantRentalFormTokens.id, id))
        .limit(1);

      if (!rentalFormToken) {
        return res.status(404).json({ message: "Token de formato de renta no encontrado" });
      }

      // Get property info
      const property = await storage.getProperty(rentalFormToken.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      // Build rental form link
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'app.replit.dev'}`
        : 'http://localhost:5000';
      const rentalFormLink = `${baseUrl}/rental-form/${rentalFormToken.token}`;

      // TODO: Send email using Resend integration
      // For now, just return success
      console.log(`Would send rental form link email to ${clientEmail}`);

      await createAuditLog(
        req,
        "create",
        "rental_form_token_email",
        rentalFormToken.id,
        `Email enviado a ${clientEmail} con link de formato de renta para ${property.title}`
      );

      res.json({ 
        message: "Email enviado exitosamente",
        rentalFormLink 
      });
    } catch (error: any) {
      console.error("Error sending rental form link email:", error);
      res.status(500).json({ message: error.message || "Error al enviar email" });
    }
  });

  // Get all rental form tokens (admins only)
  app.get("/api/rental-form-tokens", isAuthenticated, requireRole(["admin", "master", "admin_jr"]), async (req, res) => {
    try {
      const { status } = req.query;

      let query = db
        .select()
        .from(tenantRentalFormTokens)
        .orderBy(desc(tenantRentalFormTokens.createdAt));

      if (status === "used") {
        query = query.where(eq(tenantRentalFormTokens.isUsed, true));
      } else if (status === "unused") {
        query = query.where(eq(tenantRentalFormTokens.isUsed, false));
      }

      const tokens = await query;

      // Enrich with property and creator info
      const enrichedTokens = await Promise.all(
        tokens.map(async (token) => {
          const property = await storage.getProperty(token.propertyId);
          const creator = await storage.getUser(token.createdBy);
          return {
            ...token,
            property,
            creator,
          };
        })
      );

      res.json(enrichedTokens);
    } catch (error) {
      console.error("Error fetching rental form tokens:", error);
      res.status(500).json({ message: "Error al obtener tokens de formato de renta" });
    }
  });

  // Get all rental form submissions (admins only)
  app.get("/api/rental-forms", isAuthenticated, requireRole(["admin", "master", "admin_jr"]), async (req, res) => {
    try {
      const { status } = req.query;

      let query = db
        .select()
        .from(tenantRentalForms)
        .orderBy(desc(tenantRentalForms.createdAt));

      if (status && status !== "all") {
        query = query.where(eq(tenantRentalForms.status, status as string));
      }

      const forms = await query;

      // Enrich with property info
      const enrichedForms = await Promise.all(
        forms.map(async (form) => {
          const property = await storage.getProperty(form.propertyId);
          const lead = form.leadId ? await storage.getLead(form.leadId) : null;
          return {
            ...form,
            property,
            lead,
          };
        })
      );

      res.json(enrichedForms);
    } catch (error) {
      console.error("Error fetching rental forms:", error);
      res.status(500).json({ message: "Error al obtener formularios de renta" });
    }
  });

  // Review rental form (approve/reject)
  app.patch("/api/rental-forms/:id/review", isAuthenticated, requireRole(["admin", "master", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const userId = req.user.claims.sub;

      if (!["aprobado", "rechazado", "en_revision"].includes(status)) {
        return res.status(400).json({ message: "Estado inválido" });
      }

      const [rentalForm] = await db
        .select()
        .from(tenantRentalForms)
        .where(eq(tenantRentalForms.id, id))
        .limit(1);

      if (!rentalForm) {
        return res.status(404).json({ message: "Formulario no encontrado" });
      }

      // Update rental form
      await db
        .update(tenantRentalForms)
        .set({
          status,
          reviewedBy: userId,
          reviewedAt: new Date(),
          adminNotes: adminNotes || null,
          updatedAt: new Date(),
        })
        .where(eq(tenantRentalForms.id, id));

      // Note: Lead status remains "en_negociacion" after approval
      // Status will change to "contrato_firmado" when contract is actually signed

      await createAuditLog(
        req,
        "update",
        "rental_form",
        id,
        `Formulario de renta ${status}: ${rentalForm.fullName}`
      );

      res.json({ message: "Formulario actualizado exitosamente" });
    } catch (error) {
      console.error("Error reviewing rental form:", error);
      res.status(500).json({ message: "Error al revisar formulario" });
    }
  });

  // Contract Legal Documents routes
  app.get("/api/contracts/:contractId/legal-documents", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      // Get contract to verify access
      const contract = await storage.getRentalContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      const user = await storage.getUser(userId);
      const property = await storage.getProperty(contract.propertyId);
      
      // Verify user has access (tenant, owner, admin, or lawyer)
      const isAuthorized = 
        contract.tenantId === userId ||
        property?.ownerId === userId ||
        ["master", "admin", "admin_jr", "abogado"].includes(user?.role || "");

      if (!isAuthorized) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const documents = await storage.getContractLegalDocuments(contractId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching legal documents:", error);
      res.status(500).json({ message: "Error al obtener documentos legales" });
    }
  });

  app.post("/api/contracts/:contractId/legal-documents", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      const user = await storage.getUser(userId);
      // Only lawyers can upload legal documents
      if (user?.role !== "abogado") {
        return res.status(403).json({ message: "Solo abogados pueden subir documentos legales" });
      }

      const validationResult = insertContractLegalDocumentSchema.safeParse({
        ...req.body,
        rentalContractId: contractId,
        uploadedById: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.flatten() 
        });
      }

      const sanitizedData = sanitizeObject(validationResult.data);
      const document = await storage.createContractLegalDocument(sanitizedData);

      await createAuditLog(
        req,
        "create",
        "contract_legal_document",
        document.id,
        `Documento legal subido para contrato ${contractId}`
      );

      res.json(document);
    } catch (error) {
      console.error("Error creating legal document:", error);
      res.status(500).json({ message: "Error al crear documento legal" });
    }
  });

  app.patch("/api/legal-documents/:documentId", isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user.claims.sub;
      
      const document = await storage.getContractLegalDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }

      const user = await storage.getUser(userId);
      // Only the lawyer who uploaded or admins can update
      if (document.uploadedById !== userId && !["master", "admin"].includes(user?.role || "")) {
        return res.status(403).json({ message: "No autorizado" });
      }

      // Use dedicated update schema that excludes rentalContractId and uploadedById
      const validationResult = updateContractLegalDocumentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.flatten() 
        });
      }

      const sanitizedData = sanitizeObject(validationResult.data);
      
      // Force immutable fields to their original values to prevent reassignment
      const safeUpdate = {
        ...sanitizedData,
        rentalContractId: document.rentalContractId,
        uploadedById: document.uploadedById,
      };
      
      const updatedDocument = await storage.updateContractLegalDocument(documentId, safeUpdate);

      await createAuditLog(
        req,
        "update",
        "contract_legal_document",
        documentId,
        "Documento legal actualizado"
      );

      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating legal document:", error);
      res.status(500).json({ message: "Error al actualizar documento" });
    }
  });

  // Contract Term Discussions routes
  app.get("/api/legal-documents/:documentId/discussions", isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user.claims.sub;
      
      const document = await storage.getContractLegalDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }

      const contract = await storage.getRentalContract(document.rentalContractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      const user = await storage.getUser(userId);
      const property = await storage.getProperty(contract.propertyId);
      
      // Verify access
      const isAuthorized = 
        contract.tenantId === userId ||
        property?.ownerId === userId ||
        ["master", "admin", "admin_jr", "abogado"].includes(user?.role || "");

      if (!isAuthorized) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const discussions = await storage.getContractTermDiscussions(documentId);
      res.json(discussions);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      res.status(500).json({ message: "Error al obtener discusiones" });
    }
  });

  app.post("/api/legal-documents/:documentId/discussions", isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user.claims.sub;
      
      const document = await storage.getContractLegalDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }

      const validationResult = insertContractTermDiscussionSchema.safeParse({
        ...req.body,
        legalDocumentId: documentId,
        userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.flatten() 
        });
      }

      const sanitizedData = sanitizeObject(validationResult.data);
      const discussion = await storage.createContractTermDiscussion(sanitizedData);

      await createAuditLog(
        req,
        "create",
        "contract_term_discussion",
        discussion.id,
        `Discusión creada en documento ${documentId}`
      );

      res.json(discussion);
    } catch (error) {
      console.error("Error creating discussion:", error);
      res.status(500).json({ message: "Error al crear discusión" });
    }
  });

  app.patch("/api/discussions/:discussionId/resolve", isAuthenticated, async (req: any, res) => {
    try {
      const { discussionId } = req.params;
      const userId = req.user.claims.sub;
      
      const user = await storage.getUser(userId);
      // Only lawyers and admins can resolve discussions
      if (!["abogado", "master", "admin"].includes(user?.role || "")) {
        return res.status(403).json({ message: "No autorizado para resolver discusiones" });
      }

      const discussion = await storage.resolveContractTermDiscussion(discussionId, userId);

      await createAuditLog(
        req,
        "update",
        "contract_term_discussion",
        discussionId,
        "Discusión resuelta"
      );

      res.json(discussion);
    } catch (error) {
      console.error("Error resolving discussion:", error);
      res.status(500).json({ message: "Error al resolver discusión" });
    }
  });

  // Contract Approvals routes
  app.get("/api/legal-documents/:documentId/approvals", isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user.claims.sub;
      
      const document = await storage.getContractLegalDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }

      const contract = await storage.getRentalContract(document.rentalContractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      const user = await storage.getUser(userId);
      const property = await storage.getProperty(contract.propertyId);
      
      // Verify access
      const isAuthorized = 
        contract.tenantId === userId ||
        property?.ownerId === userId ||
        ["master", "admin", "admin_jr", "abogado"].includes(user?.role || "");

      if (!isAuthorized) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const approvals = await storage.getContractApprovals(documentId);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      res.status(500).json({ message: "Error al obtener aprobaciones" });
    }
  });

  app.post("/api/legal-documents/:documentId/approve", isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user.claims.sub;
      
      const document = await storage.getContractLegalDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }

      const contract = await storage.getRentalContract(document.rentalContractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      const property = await storage.getProperty(contract.propertyId);
      
      // Determine user role
      let userRole = "other";
      if (contract.tenantId === userId) userRole = "tenant";
      else if (property?.ownerId === userId) userRole = "owner";

      if (!["tenant", "owner"].includes(userRole)) {
        return res.status(403).json({ message: "Solo inquilinos y propietarios pueden aprobar" });
      }

      const validationResult = insertContractApprovalSchema.safeParse({
        ...req.body,
        legalDocumentId: documentId,
        userId,
        userRole,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.flatten() 
        });
      }

      const sanitizedData = sanitizeObject(validationResult.data);
      const approval = await storage.createContractApproval(sanitizedData);

      // Check if both parties have approved
      const allApprovals = await storage.getContractApprovals(documentId);
      const tenantApproval = allApprovals.find(a => a.userRole === "tenant" && a.approved);
      const ownerApproval = allApprovals.find(a => a.userRole === "owner" && a.approved);

      if (tenantApproval && ownerApproval) {
        // Both approved - update document status
        await storage.updateContractLegalDocument(documentId, { status: "approved" });
        
        // Update contract to firmado status
        await storage.updateRentalContractStatus(contract.id, 'firmado');

        // Notify parties about approval
        await storage.createNotification({
          userId: contract.tenantId,
          title: "Contrato Aprobado",
          message: `El contrato legal ha sido aprobado por ambas partes.`,
          category: "contract",
          relatedEntityType: "rental_contract",
          relatedEntityId: contract.id,
        });

        if (property?.ownerId) {
          await storage.createNotification({
            userId: property.ownerId,
            title: "Contrato Aprobado",
            message: `El contrato legal ha sido aprobado por ambas partes.`,
            category: "contract",
            relatedEntityType: "rental_contract",
            relatedEntityId: contract.id,
          });
        }
      }

      await createAuditLog(
        req,
        "create",
        "contract_approval",
        approval.id,
        `Aprobación registrada para documento ${documentId}`
      );

      res.json(approval);
    } catch (error) {
      console.error("Error creating approval:", error);
      res.status(500).json({ message: "Error al crear aprobación" });
    }
  });

  // Check-in Appointment routes
  app.get("/api/contracts/:contractId/check-in", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      const contract = await storage.getRentalContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      const user = await storage.getUser(userId);
      const property = await storage.getProperty(contract.propertyId);
      
      // Verify access
      const isAuthorized = 
        contract.tenantId === userId ||
        property?.ownerId === userId ||
        ["master", "admin", "admin_jr"].includes(user?.role || "");

      if (!isAuthorized) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const appointments = await storage.getCheckInAppointments({ rentalContractId: contractId });
      res.json(appointments[0] || null);
    } catch (error) {
      console.error("Error fetching check-in appointment:", error);
      res.status(500).json({ message: "Error al obtener cita de check-in" });
    }
  });

  app.post("/api/contracts/:contractId/check-in", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      const user = await storage.getUser(userId);
      // Only admins can schedule check-in appointments
      if (!["master", "admin", "admin_jr"].includes(user?.role || "")) {
        return res.status(403).json({ message: "Solo administradores pueden programar check-in" });
      }

      const contract = await storage.getRentalContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      const property = await storage.getProperty(contract.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Propiedad no encontrada" });
      }

      const validationResult = insertCheckInAppointmentSchema.safeParse({
        ...req.body,
        rentalContractId: contractId,
        propertyId: contract.propertyId,
        tenantId: contract.tenantId,
        ownerId: property.ownerId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.flatten() 
        });
      }

      const sanitizedData = sanitizeObject(validationResult.data);
      const appointment = await storage.createCheckInAppointment(sanitizedData);

      // Notify parties
      await storage.createNotification({
        userId: contract.tenantId,
        title: "Cita de Check-in Programada",
        message: `Se ha programado tu cita de check-in para ${new Date(appointment.scheduledDate).toLocaleString()}.`,
        category: "appointment",
        relatedEntityType: "check_in_appointment",
        relatedEntityId: appointment.id,
      });

      if (property.ownerId) {
        await storage.createNotification({
          userId: property.ownerId,
          title: "Cita de Check-in Programada",
          message: `Se ha programado la cita de check-in para ${new Date(appointment.scheduledDate).toLocaleString()}.`,
          category: "appointment",
          relatedEntityType: "check_in_appointment",
          relatedEntityId: appointment.id,
        });
      }

      await createAuditLog(
        req,
        "create",
        "check_in_appointment",
        appointment.id,
        `Cita de check-in programada para contrato ${contractId}`
      );

      res.json(appointment);
    } catch (error) {
      console.error("Error creating check-in appointment:", error);
      res.status(500).json({ message: "Error al crear cita de check-in" });
    }
  });

  app.patch("/api/check-in/:appointmentId/complete", isAuthenticated, async (req: any, res) => {
    try {
      const { appointmentId } = req.params;
      const userId = req.user.claims.sub;
      
      const user = await storage.getUser(userId);
      if (!["master", "admin", "admin_jr"].includes(user?.role || "")) {
        return res.status(403).json({ message: "Solo administradores pueden completar check-in" });
      }

      const appointment = await storage.completeCheckInAppointment(appointmentId);
      
      // Update contract to check_in status
      await storage.updateRentalContractStatus(appointment.rentalContractId, 'check_in');

      await createAuditLog(
        req,
        "update",
        "check_in_appointment",
        appointmentId,
        "Cita de check-in completada"
      );

      res.json(appointment);
    } catch (error) {
      console.error("Error completing check-in:", error);
      res.status(500).json({ message: "Error al completar check-in" });
    }
  });

  // Contract Signed Documents routes
  app.get("/api/contracts/:contractId/signed-documents", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      const contract = await storage.getRentalContract(contractId);
      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      const user = await storage.getUser(userId);
      const property = await storage.getProperty(contract.propertyId);
      
      // Verify access
      const isAuthorized = 
        contract.tenantId === userId ||
        property?.ownerId === userId ||
        ["master", "admin", "admin_jr"].includes(user?.role || "");

      if (!isAuthorized) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const documents = await storage.getContractSignedDocuments(contractId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching signed documents:", error);
      res.status(500).json({ message: "Error al obtener documentos firmados" });
    }
  });

  app.post("/api/contracts/:contractId/signed-documents", isAuthenticated, async (req: any, res) => {
    try {
      const { contractId } = req.params;
      const userId = req.user.claims.sub;
      
      const user = await storage.getUser(userId);
      // Only admins can upload signed documents
      if (!["master", "admin", "admin_jr"].includes(user?.role || "")) {
        return res.status(403).json({ message: "Solo administradores pueden subir documentos firmados" });
      }

      const validationResult = insertContractSignedDocumentSchema.safeParse({
        ...req.body,
        rentalContractId: contractId,
        uploadedById: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos", 
          errors: validationResult.error.flatten() 
        });
      }

      const sanitizedData = sanitizeObject(validationResult.data);
      const document = await storage.createContractSignedDocument(sanitizedData);

      await createAuditLog(
        req,
        "create",
        "contract_signed_document",
        document.id,
        `Documento firmado subido para contrato ${contractId}`
      );

      res.json(document);
    } catch (error) {
      console.error("Error uploading signed document:", error);
      res.status(500).json({ message: "Error al subir documento firmado" });
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
      const user = await storage.getUser(userId);
      
      // Determine applicantId: admins/masters can specify, others use their own ID
      let applicantId = userId;
      if (req.body.applicantId && req.body.applicantId !== userId) {
        if (user && ["master", "admin", "admin_jr"].includes(user.role)) {
          applicantId = req.body.applicantId;
        }
        // Non-admins cannot specify different applicantId, silently use their own
      }
      
      const applicationData = insertRentalApplicationSchema.parse({
        ...req.body,
        applicantId,
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

  app.patch("/api/rental-applications/:id", isAuthenticated, requireResourceOwnership('rental-application'), async (req: any, res) => {
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

  app.patch("/api/rental-applications/:id/status", isAuthenticated, requireResourceOwnership('rental-application'), async (req: any, res) => {
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

      // Check if owner accepted rental terms during property submission
      const ownerSubmission = await storage.getPropertySubmissionDraftByProperty(propertyId);
      let ownerTermsSignedAt = null;
      
      // If submission draft has termsAcceptance, use it to pre-fill owner terms signature
      if (ownerSubmission?.termsAcceptance) {
        const terms = ownerSubmission.termsAcceptance as any;
        
        // Only use if all terms were properly accepted
        if (terms.acceptedTerms && terms.confirmedAccuracy && terms.acceptedCommission && terms.acceptedAt) {
          ownerTermsSignedAt = new Date(terms.acceptedAt);
        }
        // Note: If terms incomplete, we continue without pre-filling (backward compatible with legacy data)
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
        ownerId: property.ownerId,
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
        ownerTermsSignedAt, // Auto-fill from submission draft acceptance
      });

      const contract = await storage.createRentalContract(contractData);

      await createAuditLog(
        req,
        "create",
        "rental_contract",
        contract.id,
        `Contrato de renta creado - Estado: ${contract.status}, Renta: $${monthlyRent}`
      );

      // Calculate rental health score automatically
      try {
        await storage.calculateRentalHealthScore(contract.id);
        
        // Create workflow event
        await storage.createWorkflowEvent({
          eventType: "contract_created",
          entityType: "contract",
          entityId: contract.id,
          userId: req.user.claims.sub,
          metadata: { propertyId, status: contract.status, monthlyRent: monthlyRent.toString() },
        });
      } catch (error) {
        console.error("Error in contract creation automation:", error);
      }

      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating rental contract:", error);
      res.status(400).json({ message: error.message || "Failed to create rental contract" });
    }
  });

  app.patch("/api/rental-contracts/:id", isAuthenticated, requireResourceOwnership('rental-contract'), async (req: any, res) => {
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

      // Recalculate rental health score
      try {
        await storage.calculateRentalHealthScore(id);
        
        // Create workflow event
        await storage.createWorkflowEvent({
          eventType: "contract_updated",
          entityType: "contract",
          entityId: id,
          userId: req.user.claims.sub,
          metadata: { updates: Object.keys(req.body) },
        });
      } catch (error) {
        console.error("Error in contract update automation:", error);
      }

      res.json(contract);
    } catch (error) {
      console.error("Error updating rental contract:", error);
      res.status(500).json({ message: "Failed to update rental contract" });
    }
  });

  app.patch("/api/rental-contracts/:id/status", isAuthenticated, requireResourceOwnership('rental-contract'), async (req: any, res) => {
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

      // Recalculate rental health score and create alerts
      try {
        const healthScore = await storage.calculateRentalHealthScore(id);
        
        // Create workflow event
        await storage.createWorkflowEvent({
          eventType: "contract_status_changed",
          entityType: "contract",
          entityId: id,
          userId: req.user.claims.sub,
          metadata: { newStatus: status },
        });

        // Create alerts based on health score
        if (healthScore.status === "critical" || healthScore.status === "poor") {
          await storage.createSystemAlert({
            userId: req.user.claims.sub,
            alertType: "rental_health_low",
            priority: healthScore.status === "critical" ? "high" : "medium",
            title: `Salud de Contrato ${healthScore.status === "critical" ? "Crítica" : "Baja"}`,
            message: `El contrato de renta requiere atención: score ${healthScore.score}/100`,
            relatedEntityType: "contract",
            relatedEntityId: id,
          });
        }

        // Alert for contracts near expiry
        if (healthScore.isNearExpiry && status === "check_in") {
          await storage.createSystemAlert({
            userId: req.user.claims.sub,
            alertType: "contract_expiring_soon",
            priority: "high",
            title: "Contrato próximo a vencer",
            message: `El contrato de renta vence pronto. Considerar renovación.`,
            relatedEntityType: "contract",
            relatedEntityId: id,
          });
        }
      } catch (error) {
        console.error("Error in contract status automation:", error);
      }

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

  // Active Rentals routes (for clients/tenants)
  app.get("/api/rentals/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get active rental contracts where user is tenant
      const activeRentals = await storage.getActiveRentalsByTenant(userId);
      
      // Filter sensitive fields before sending to client
      const filteredRentals = activeRentals.map(rental => ({
        id: rental.id,
        propertyId: rental.propertyId,
        rentalType: rental.leaseDurationMonths && rental.leaseDurationMonths <= 6 ? 'short_term' : 'long_term',
        monthlyRent: rental.monthlyRent,
        depositAmount: rental.securityDeposit,
        contractStartDate: rental.startDate,
        contractEndDate: rental.endDate,
        checkInDate: rental.startDate,
        status: rental.status,
        // Property information
        propertyTitle: rental.propertyTitle,
        propertyType: rental.propertyType,
        unitType: rental.unitType,
        condominiumId: rental.condominiumId,
        condoName: rental.condoName,
        unitNumber: rental.unitNumber,
        // Do not expose ownerId, sellerId, or internal notes
      }));
      
      res.json(filteredRentals);
    } catch (error) {
      console.error("Error fetching active rentals:", error);
      res.status(500).json({ message: "Failed to fetch active rentals" });
    }
  });

  // Client Dashboard Active Rentals endpoint
  app.get("/api/client/active-rentals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get active rental contracts where user is tenant
      const activeRentals = await storage.getActiveRentalsByTenant(userId);
      res.json(activeRentals);
    } catch (error) {
      console.error("Error fetching client active rentals:", error);
      res.status(500).json({ message: "Failed to fetch active rentals" });
    }
  });

  // Client Dashboard Maintenance Requests endpoint
  app.get("/api/client/maintenance-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all active rental contracts for this tenant
      const activeRentals = await storage.getActiveRentalsByTenant(userId);
      
      // Get maintenance requests for all active rentals
      const allRequests = [];
      for (const rental of activeRentals) {
        const requests = await storage.getTenantMaintenanceRequests(rental.id);
        allRequests.push(...requests);
      }
      
      res.json(allRequests);
    } catch (error) {
      console.error("Error fetching client maintenance requests:", error);
      res.status(500).json({ message: "Failed to fetch maintenance requests" });
    }
  });

  // Rental Opportunity Request routes
  // Get visited properties for client (completed or past appointments)
  app.get("/api/client/visited-properties", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "cliente") {
        return res.status(403).json({ message: "Solo los clientes pueden ver propiedades visitadas" });
      }
      
      const visitedProperties = await storage.getVisitedPropertiesByClient(userId);
      res.json(visitedProperties);
    } catch (error) {
      console.error("Error fetching visited properties:", error);
      res.status(500).json({ message: "Failed to fetch visited properties" });
    }
  });

  // Create rental opportunity request
  app.post("/api/rental-opportunity-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "cliente") {
        return res.status(403).json({ message: "Solo los clientes pueden solicitar oportunidades de renta" });
      }

      // Check if user already has a pending or approved request for this property
      const existingRequests = await storage.getRentalOpportunityRequestsByClient(userId);
      const propertyId = req.body.propertyId;
      
      const existingRequest = existingRequests.find(
        req => req.propertyId === propertyId && (req.status === 'pending' || req.status === 'approved')
      );
      
      if (existingRequest) {
        return res.status(409).json({ 
          message: existingRequest.status === 'approved' 
            ? "Ya tienes una solicitud aprobada para esta propiedad" 
            : "Ya tienes una solicitud pendiente para esta propiedad" 
        });
      }

      const request = await storage.createRentalOpportunityRequest({
        userId,
        propertyId,
        appointmentId: req.body.appointmentId,
        status: 'pending',
      });

      // Get property details for notification
      const property = await storage.getProperty(propertyId);
      
      // Notify all admins about the new request
      const admins = await storage.getUsersByRole("admin");
      const notificationPromises = admins.map(admin => 
        storage.createNotification({
          userId: admin.id,
          type: "opportunity",
          title: "Nueva Solicitud de Oportunidad de Renta",
          message: `${user.name} ha solicitado crear una oferta de renta para ${property?.title || 'una propiedad'}`,
          relatedEntityType: "rental_opportunity_request",
          relatedEntityId: request.id,
          priority: "medium",
        })
      );
      await Promise.all(notificationPromises);

      // Log the request creation
      await createAuditLog(
        req,
        "create",
        "rental_opportunity_request",
        request.id,
        `Solicitud de oportunidad de renta creada para propiedad ${propertyId}`
      );

      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating rental opportunity request:", error);
      res.status(500).json({ message: "Failed to create rental opportunity request" });
    }
  });

  // Get rental opportunity requests for current client
  app.get("/api/rental-opportunity-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "cliente") {
        return res.status(403).json({ message: "Solo los clientes pueden ver sus solicitudes" });
      }
      
      const requests = await storage.getRentalOpportunityRequestsByClient(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching rental opportunity requests:", error);
      res.status(500).json({ message: "Failed to fetch rental opportunity requests" });
    }
  });

  app.get("/api/rentals/:id/payments", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify user has access to this rental
      const rental = await storage.getRentalContract(id);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      if (rental.tenantId !== userId && rental.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const payments = await storage.getRentalPayments(id);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching rental payments:", error);
      res.status(500).json({ message: "Failed to fetch rental payments" });
    }
  });

  // Register payment with proof endpoint (authorization check first)
  app.post("/api/rentals/payments/:paymentId/register", isAuthenticated, async (req: any, res, next) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user.claims.sub;
      
      // Get payment details and verify authorization BEFORE file upload
      const payment = await storage.getRentalPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Verify user is the tenant
      if (payment.tenantId !== userId) {
        return res.status(403).json({ message: "Only tenant can register payment" });
      }
      
      // Store payment in request for later use
      (req as any).validatedPayment = payment;
      
      // Now proceed with file upload
      uploadPaymentProof.single('proof')(req, res, async (err: any) => {
        if (err) {
          return res.status(400).json({ message: err.message || "File upload failed" });
        }
        
        // Require payment proof file
        if (!req.file) {
          return res.status(400).json({ message: "Payment proof is required" });
        }
        
        const paymentProofUrl = `/attached_assets/payment_proofs/${req.file.filename}`;
        
        // Update payment with proof and status
        const updatedPayment = await storage.updateRentalPayment(paymentId, {
          paymentDate: new Date(),
          paymentProof: paymentProofUrl,
          status: "paid",
          notes: req.body.notes || null,
        });
        
        // Get rental contract for notification
        const rental = await storage.getRentalContract(payment.rentalContractId);
        if (rental) {
          // Notify owner about payment
          await storage.createNotification({
            userId: rental.ownerId,
            type: "payment_received",
            title: "Pago registrado",
            message: `Tu inquilino ha registrado un pago de $${payment.amount}`,
            relatedEntityType: "rental_payment",
            relatedEntityId: paymentId,
          });
        }
        
        res.json(updatedPayment);
      });
    } catch (error: any) {
      console.error("Error registering payment:", error);
      res.status(500).json({ message: error.message || "Failed to register payment" });
    }
  });

  // Owner approves a payment
  app.post("/api/rentals/payments/:paymentId/approve", isAuthenticated, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user.claims.sub;
      
      // Get payment details
      const payment = await storage.getRentalPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Get rental contract to verify user is owner
      const rental = await storage.getRentalContract(payment.rentalContractId);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      if (rental.ownerId !== userId) {
        return res.status(403).json({ message: "Only owner can approve payments" });
      }
      
      // Approve the payment
      const approvedPayment = await storage.approveRentalPayment(paymentId, userId);
      
      // Notify tenant
      await storage.createNotification({
        userId: rental.tenantId,
        type: "payment_approved",
        title: "Pago aprobado",
        message: `El propietario ha aprobado tu pago de ${payment.serviceType === 'rent' ? 'renta' : payment.serviceType}`,
        relatedEntityType: "rental_payment",
        relatedEntityId: paymentId,
      });
      
      res.json(approvedPayment);
    } catch (error: any) {
      console.error("Error approving payment:", error);
      res.status(500).json({ message: error.message || "Failed to approve payment" });
    }
  });

  // Get pending payments for owner to approve
  app.get("/api/owner/pending-payments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'owner' && user?.role !== 'admin' && user?.role !== 'master') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const payments = await storage.getPendingPaymentsByOwner(userId);
      res.json(payments);
    } catch (error: any) {
      console.error("Error fetching pending payments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch pending payments" });
    }
  });

  app.post("/api/rentals/:id/maintenance-request", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify user is tenant of this rental
      const rental = await storage.getRentalContract(id);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      if (rental.tenantId !== userId) {
        return res.status(403).json({ message: "Only tenant can create maintenance requests" });
      }
      
      const requestData = insertTenantMaintenanceRequestSchema.parse({
        ...req.body,
        rentalContractId: id,
        tenantId: userId,
        ownerId: rental.ownerId,
        propertyId: rental.propertyId,
      });
      
      const maintenanceRequest = await storage.createTenantMaintenanceRequest(requestData);
      
      // Create notification for owner
      await storage.createNotification({
        userId: rental.ownerId,
        type: "maintenance_request",
        title: "Nueva solicitud de mantenimiento",
        message: `Tu inquilino ha enviado una solicitud de mantenimiento: ${req.body.title}`,
        relatedEntityType: "maintenance_request",
        relatedEntityId: maintenanceRequest.id,
      });
      
      res.status(201).json(maintenanceRequest);
    } catch (error: any) {
      console.error("Error creating maintenance request:", error);
      res.status(400).json({ message: error.message || "Failed to create maintenance request" });
    }
  });

  app.get("/api/rentals/:id/maintenance-requests", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify user has access to this rental
      const rental = await storage.getRentalContract(id);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      if (rental.tenantId !== userId && rental.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const requests = await storage.getTenantMaintenanceRequests(id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      res.status(500).json({ message: "Failed to fetch maintenance requests" });
    }
  });

  // Get or create chat conversation for a rental
  app.get("/api/rentals/:id/chat-conversation", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify user has access to this rental
      const rental = await storage.getRentalContract(id);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      // Get maintenance staff assigned to the property
      const propertyStaff = await storage.getPropertyStaff(rental.propertyId);
      const maintenanceStaff = propertyStaff.filter(s => s.role === 'maintenance' && s.active);
      const maintenanceStaffIds = maintenanceStaff.map(s => s.staffId);
      
      // Check if user has access (tenant, owner, or maintenance staff)
      const isTenant = rental.tenantId === userId;
      const isOwner = rental.ownerId === userId;
      const isMaintenanceStaff = maintenanceStaffIds.includes(userId);
      
      if (!isTenant && !isOwner && !isMaintenanceStaff) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Check if conversation already exists
      let conversation = await storage.getChatConversationByRentalContractId(id);
      
      if (!conversation) {
        // Create new conversation
        const property = await storage.getProperty(rental.propertyId);
        const title = property 
          ? `Chat - ${property.title || 'Propiedad'}`
          : 'Chat - Renta Activa';
        
        conversation = await storage.createChatConversation({
          type: 'rental' as any,
          title,
          rentalContractId: id,
          createdById: userId,
        });
        
        // Add participants (tenant, owner, and maintenance staff)
        await storage.addChatParticipant({
          conversationId: conversation.id,
          userId: rental.tenantId,
        });
        
        await storage.addChatParticipant({
          conversationId: conversation.id,
          userId: rental.ownerId,
        });
        
        // Add maintenance staff as participants
        for (const staffId of maintenanceStaffIds) {
          await storage.addChatParticipant({
            conversationId: conversation.id,
            userId: staffId,
          });
        }
      } else {
        // Conversation exists - ensure all required participants are added
        const existingParticipants = await storage.getChatParticipants(conversation.id);
        const existingParticipantIds = existingParticipants.map(p => p.userId);
        
        // Collect all required participants
        const requiredParticipants = [
          rental.tenantId,
          rental.ownerId,
          ...maintenanceStaffIds
        ];
        
        // Add any missing participants
        for (const participantId of requiredParticipants) {
          if (!existingParticipantIds.includes(participantId)) {
            await storage.addChatParticipant({
              conversationId: conversation.id,
              userId: participantId,
            });
          }
        }
      }
      
      res.json(conversation);
    } catch (error: any) {
      console.error("Error getting/creating rental chat conversation:", error);
      res.status(500).json({ message: error.message || "Failed to get chat conversation" });
    }
  });

  // Owner Active Rentals routes
  app.get("/api/owner/active-rentals", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rentals = await storage.getActiveRentalsByOwner(userId);
      res.json(rentals);
    } catch (error) {
      console.error("Error fetching owner active rentals:", error);
      res.status(500).json({ message: "Failed to fetch active rentals" });
    }
  });

  app.get("/api/owner/rentals/:id/inventory", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify user is the owner of this rental
      const rental = await storage.getRentalContract(id);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      if (rental.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const inventory = await storage.getPropertyDeliveryInventory(id);
      res.json(inventory || null);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post("/api/owner/rentals/:id/inventory", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify user is the owner of this rental
      const rental = await storage.getRentalContract(id);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      if (rental.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate request body with Zod partial schema for updates
      const updateSchema = insertPropertyDeliveryInventorySchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      // Check if inventory already exists
      const existing = await storage.getPropertyDeliveryInventory(id);
      
      let inventory;
      if (existing) {
        // Update existing inventory
        inventory = await storage.updatePropertyDeliveryInventory(existing.id, validatedData);
      } else {
        // Create new inventory
        const inventoryData = {
          ...validatedData,
          rentalContractId: id,
          propertyId: rental.propertyId,
          ownerId: userId,
          tenantId: rental.tenantId,
        };
        inventory = await storage.createPropertyDeliveryInventory(inventoryData);
      }
      
      res.json(inventory);
    } catch (error: any) {
      console.error("Error saving inventory:", error);
      res.status(400).json({ message: error.message || "Failed to save inventory" });
    }
  });

  app.get("/api/owner/rentals/:id/move-in-form", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify user is the owner of this rental
      const rental = await storage.getRentalContract(id);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      if (rental.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const form = await storage.getTenantMoveInForm(id);
      res.json(form || null);
    } catch (error) {
      console.error("Error fetching move-in form:", error);
      res.status(500).json({ message: "Failed to fetch move-in form" });
    }
  });

  app.post("/api/owner/rentals/:id/move-in-form", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify user is the owner of this rental
      const rental = await storage.getRentalContract(id);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      if (rental.ownerId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate request body with Zod partial schema for updates
      const updateSchema = insertTenantMoveInFormSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      // Check if form already exists
      const existing = await storage.getTenantMoveInForm(id);
      
      let form;
      if (existing) {
        // Update existing form
        form = await storage.updateTenantMoveInForm(existing.id, validatedData);
      } else {
        // Create new form
        const formData = {
          ...validatedData,
          rentalContractId: id,
          tenantId: rental.tenantId,
        };
        form = await storage.createTenantMoveInForm(formData);
      }
      
      res.json(form);
    } catch (error: any) {
      console.error("Error saving move-in form:", error);
      res.status(400).json({ message: error.message || "Failed to save move-in form" });
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
      // Validate request body with Zod
      const removePermissionSchema = z.object({
        userId: z.string().min(1, "El ID del usuario es requerido"),
        permission: z.string().min(1, "El permiso es requerido")
      });
      
      const validationResult = removePermissionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Datos inválidos",
          errors: validationResult.error.errors 
        });
      }
      
      const { userId, permission } = validationResult.data;
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

  app.patch("/api/budgets/:id", isAuthenticated, requireResourceOwnership('budget', 'staffId'), async (req: any, res) => {
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

  app.delete("/api/budgets/:id", isAuthenticated, requireResourceOwnership('budget', 'staffId'), async (req: any, res) => {
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
  app.get("/api/tasks/stats", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const allTasks = await storage.getTasks({});
      const now = new Date();
      
      const stats = {
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === "pending").length,
        inProgress: allTasks.filter(t => t.status === "in-progress").length,
        completed: allTasks.filter(t => t.status === "completed").length,
        overdue: allTasks.filter(t => {
          if (!t.dueDate || t.status === "completed" || t.status === "cancelled") return false;
          return new Date(t.dueDate) < now;
        }).length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching task stats:", error);
      res.status(500).json({ message: "Failed to fetch task stats" });
    }
  });

  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, assignedToId, status, priority, search } = req.query;
      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (assignedToId) filters.assignedToId = assignedToId;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (search) filters.search = search;

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

  app.patch("/api/tasks/:id", isAuthenticated, requireResourceOwnership('task', 'assignedToId'), async (req: any, res) => {
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

  app.delete("/api/tasks/:id", isAuthenticated, requireResourceOwnership('task', 'assignedToId'), async (req: any, res) => {
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

  app.patch("/api/notifications/:id/read", isAuthenticated, requireResourceOwnership('notification', 'userId'), async (req, res) => {
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

  app.patch("/api/notifications/:id/unread", isAuthenticated, requireResourceOwnership('notification', 'userId'), async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsUnread(id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as unread:", error);
      res.status(500).json({ message: "Failed to mark notification as unread" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, requireResourceOwnership('notification', 'userId'), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
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

  app.patch("/api/chat/conversations/:id/mark-read", isAuthenticated, requireResourceOwnership('conversation'), async (req: any, res) => {
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

  // Appointment chat routes
  app.post("/api/chat/appointment/:appointmentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { appointmentId } = req.params;

      // Get the appointment with all details
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Get the property to check ownership
      const property = await storage.getProperty(appointment.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Security: User must be the property owner OR the assigned concierge
      const isOwner = property.ownerId === userId;
      const isConcierge = appointment.conciergeId === userId;
      
      if (!isOwner && !isConcierge) {
        return res.status(403).json({ message: "You do not have access to this appointment chat" });
      }

      // Check if conversation already exists for this appointment
      const existingConversation = await storage.getChatConversationByAppointmentId(appointmentId);
      
      if (existingConversation) {
        // Return existing conversation
        return res.json(existingConversation);
      }

      // Create new appointment chat conversation
      const propertyDisplay = property.customListingTitle || 
        (property.condoId ? `${property.condoName || 'Propiedad'} ${property.unitNumber || ''}` : property.title || 'Propiedad');
      
      const appointmentDate = format(new Date(appointment.date), "dd MMM yyyy HH:mm", { locale: es });
      
      const conversation = await storage.createChatConversation({
        type: "appointment",
        title: `Visita: ${propertyDisplay} - ${appointmentDate}`,
        createdById: userId,
        isBot: false,
        appointmentId: appointmentId,
      });

      // Add both property owner and concierge as participants
      await storage.addChatParticipant({
        conversationId: conversation.id,
        userId: property.ownerId,
      });

      if (appointment.conciergeId) {
        await storage.addChatParticipant({
          conversationId: conversation.id,
          userId: appointment.conciergeId,
        });
      }

      // Create initial system message
      const initialMessage = await storage.createChatMessage({
        conversationId: conversation.id,
        senderId: userId,
        message: `Chat de visita creado. Propiedad: ${propertyDisplay}. Fecha: ${appointmentDate}.`,
        isBot: false,
      });

      res.status(201).json({
        ...conversation,
        initialMessage
      });
    } catch (error: any) {
      console.error("Error creating/getting appointment chat:", error);
      res.status(500).json({ message: error.message || "Failed to create appointment chat" });
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

  // Error Log routes - Automatic error tracking
  app.post("/api/error-logs", async (req: any, res) => {
    try {
      // Allow unauthenticated error logging for critical errors
      const userId = req.user?.claims?.sub || null;
      const user = userId ? await storage.getUser(userId) : null;

      const errorData = {
        ...req.body,
        userId,
        userEmail: user?.email || req.body.userEmail,
        userRole: user?.role || req.body.userRole,
        userAgent: req.headers['user-agent'] || '',
      };

      // Validate error data with Zod
      const validationResult = insertErrorLogSchema.safeParse(errorData);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Datos inválidos",
          errors: validationResult.error.errors,
        });
      }

      const newErrorLog = await storage.createErrorLog(validationResult.data);

      // Notify all admins about new errors
      const admins = await storage.getUsersByRole("admin");
      const masters = await storage.getUsersByRole("master");
      const adminJrs = await storage.getUsersByRole("admin_jr");
      const allAdmins = [...admins, ...masters, ...adminJrs];

      for (const admin of allAdmins) {
        await storage.createNotification({
          userId: admin.id,
          type: "system",
          title: "Nuevo Error en la Aplicación",
          message: `${errorData.errorType}: ${errorData.errorMessage.substring(0, 100)}...`,
          relatedEntityType: "error_log",
          relatedEntityId: newErrorLog.id,
          priority: "high",
        });
      }

      res.status(201).json(newErrorLog);
    } catch (error: any) {
      console.error("Error creating error log:", error);
      res.status(500).json({ message: "Failed to create error log" });
    }
  });

  app.get("/api/error-logs", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { status, errorType, userId } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status;
      if (errorType) filters.errorType = errorType;
      if (userId) filters.userId = userId;
      
      const errorLogs = await storage.getAllErrorLogs(filters);
      res.json(errorLogs);
    } catch (error: any) {
      console.error("Error fetching error logs:", error);
      res.status(500).json({ message: "Failed to fetch error logs" });
    }
  });

  app.patch("/api/error-logs/:id", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const updates: any = { ...req.body };
      
      // Set assignedTo if changing to investigating status
      if (updates.status === "investigating" && !updates.assignedTo) {
        updates.assignedTo = userId;
      }
      
      // Set resolvedAt if changing to resolved status
      if (updates.status === "resolved" && !updates.resolvedAt) {
        updates.resolvedAt = new Date();
      }

      const updatedErrorLog = await storage.updateErrorLog(id, updates);

      await createAuditLog(
        req,
        "update",
        "error_log",
        id,
        `Error log actualizado a: ${updatedErrorLog.status}`
      );

      res.json(updatedErrorLog);
    } catch (error: any) {
      console.error("Error updating error log:", error);
      res.status(500).json({ message: "Failed to update error log" });
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

      if (status === "paid") {
        const transaction = await storage.getIncomeTransaction(req.params.id);
        if (!transaction) {
          return res.status(404).json({ message: "Transaction not found" });
        }

        const beneficiary = await storage.getUser(transaction.beneficiaryId);
        if (!beneficiary) {
          return res.status(404).json({ message: "Beneficiary not found" });
        }

        if (beneficiary.role === "seller") {
          if (!beneficiary.commissionTermsAccepted) {
            return res.status(400).json({ 
              message: "El vendedor debe aceptar los términos y condiciones de comisiones antes de recibir pagos",
              error: "TERMS_NOT_ACCEPTED"
            });
          }

          if (beneficiary.documentApprovalStatus !== "approved") {
            return res.status(400).json({ 
              message: "El vendedor debe tener un documento de identificación aprobado antes de recibir pagos",
              error: "DOCUMENT_NOT_APPROVED",
              documentStatus: beneficiary.documentApprovalStatus || "none"
            });
          }
        }
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

  // SLA Configuration routes
  app.get("/api/sla-configs", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const { isActive } = req.query;
      const configs = await storage.getSlaConfigurations({
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined
      });
      res.json(configs);
    } catch (error: any) {
      console.error("Error fetching SLA configurations:", error);
      res.status(500).json({ message: "Failed to fetch SLA configurations" });
    }
  });

  app.get("/api/sla-configs/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const config = await storage.getSlaConfiguration(req.params.id);
      if (!config) {
        return res.status(404).json({ message: "SLA configuration not found" });
      }
      res.json(config);
    } catch (error: any) {
      console.error("Error fetching SLA configuration:", error);
      res.status(500).json({ message: "Failed to fetch SLA configuration" });
    }
  });

  app.get("/api/sla-configs/process/:processName", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const config = await storage.getSlaConfigurationByProcess(req.params.processName);
      if (!config) {
        return res.status(404).json({ message: "SLA configuration not found for this process" });
      }
      res.json(config);
    } catch (error: any) {
      console.error("Error fetching SLA configuration:", error);
      res.status(500).json({ message: "Failed to fetch SLA configuration" });
    }
  });

  app.post("/api/sla-configs", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const validationResult = insertSlaConfigurationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid SLA configuration data", 
          errors: validationResult.error.errors 
        });
      }

      const config = await storage.createSlaConfiguration(validationResult.data);

      await logAuditAction(
        req,
        "create",
        "sla_configuration",
        config.id,
        `Created SLA configuration for ${config.processName}`
      );

      res.status(201).json(config);
    } catch (error: any) {
      console.error("Error creating SLA configuration:", error);
      res.status(500).json({ message: "Failed to create SLA configuration" });
    }
  });

  app.patch("/api/sla-configs/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const config = await storage.updateSlaConfiguration(req.params.id, req.body);

      await logAuditAction(
        req,
        "update",
        "sla_configuration",
        config.id,
        `Updated SLA configuration for ${config.processName}`
      );

      res.json(config);
    } catch (error: any) {
      console.error("Error updating SLA configuration:", error);
      res.status(500).json({ message: "Failed to update SLA configuration" });
    }
  });

  app.delete("/api/sla-configs/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      await storage.deleteSlaConfiguration(req.params.id);

      await logAuditAction(
        req,
        "delete",
        "sla_configuration",
        req.params.id,
        "Deleted SLA configuration"
      );

      res.json({ message: "SLA configuration deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting SLA configuration:", error);
      res.status(500).json({ message: "Failed to delete SLA configuration" });
    }
  });

  // Lead Scoring Rules routes
  app.get("/api/lead-scoring-rules", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const { isActive } = req.query;
      const rules = await storage.getLeadScoringRules({
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined
      });
      res.json(rules);
    } catch (error: any) {
      console.error("Error fetching lead scoring rules:", error);
      res.status(500).json({ message: "Failed to fetch lead scoring rules" });
    }
  });

  app.post("/api/lead-scoring-rules", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const validationResult = insertLeadScoringRuleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid lead scoring rule data", 
          errors: validationResult.error.errors 
        });
      }

      const rule = await storage.createLeadScoringRule(validationResult.data);

      await logAuditAction(
        req,
        "create",
        "lead_scoring_rule",
        rule.id,
        `Created lead scoring rule: ${rule.name}`
      );

      res.status(201).json(rule);
    } catch (error: any) {
      console.error("Error creating lead scoring rule:", error);
      res.status(500).json({ message: "Failed to create lead scoring rule" });
    }
  });

  app.patch("/api/lead-scoring-rules/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const rule = await storage.updateLeadScoringRule(req.params.id, req.body);

      await logAuditAction(
        req,
        "update",
        "lead_scoring_rule",
        rule.id,
        `Updated lead scoring rule: ${rule.name}`
      );

      res.json(rule);
    } catch (error: any) {
      console.error("Error updating lead scoring rule:", error);
      res.status(500).json({ message: "Failed to update lead scoring rule" });
    }
  });

  app.delete("/api/lead-scoring-rules/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      await storage.deleteLeadScoringRule(req.params.id);

      await logAuditAction(
        req,
        "delete",
        "lead_scoring_rule",
        req.params.id,
        "Deleted lead scoring rule"
      );

      res.json({ message: "Lead scoring rule deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting lead scoring rule:", error);
      res.status(500).json({ message: "Failed to delete lead scoring rule" });
    }
  });

  // Lead Score routes
  app.get("/api/leads/:leadId/score", isAuthenticated, async (req, res) => {
    try {
      const score = await storage.getLeadScore(req.params.leadId);
      if (!score) {
        return res.status(404).json({ message: "Lead score not found" });
      }
      res.json(score);
    } catch (error: any) {
      console.error("Error fetching lead score:", error);
      res.status(500).json({ message: "Failed to fetch lead score" });
    }
  });

  app.post("/api/leads/:leadId/calculate-score", isAuthenticated, async (req, res) => {
    try {
      const score = await storage.calculateLeadScore(req.params.leadId);
      res.json(score);
    } catch (error: any) {
      console.error("Error calculating lead score:", error);
      res.status(500).json({ message: "Failed to calculate lead score" });
    }
  });

  // Contract Checklist Template routes
  app.get("/api/contract-checklist-templates", isAuthenticated, async (req, res) => {
    try {
      const { contractType, isActive } = req.query;
      const templates = await storage.getContractChecklistTemplates({
        contractType: contractType as string,
        isActive: isActive === "true" ? true : isActive === "false" ? false : undefined
      });
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching contract checklist templates:", error);
      res.status(500).json({ message: "Failed to fetch contract checklist templates" });
    }
  });

  app.get("/api/contract-checklist-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const template = await storage.getContractChecklistTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Contract checklist template not found" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Error fetching contract checklist template:", error);
      res.status(500).json({ message: "Failed to fetch contract checklist template" });
    }
  });

  app.post("/api/contract-checklist-templates", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const validationResult = insertContractChecklistTemplateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid contract checklist template data", 
          errors: validationResult.error.errors 
        });
      }

      const template = await storage.createContractChecklistTemplate(validationResult.data);

      await logAuditAction(
        req,
        "create",
        "contract_checklist_template",
        template.id,
        `Created contract checklist template: ${template.name}`
      );

      res.status(201).json(template);
    } catch (error: any) {
      console.error("Error creating contract checklist template:", error);
      res.status(500).json({ message: "Failed to create contract checklist template" });
    }
  });

  app.patch("/api/contract-checklist-templates/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const template = await storage.updateContractChecklistTemplate(req.params.id, req.body);

      await logAuditAction(
        req,
        "update",
        "contract_checklist_template",
        template.id,
        `Updated contract checklist template: ${template.name}`
      );

      res.json(template);
    } catch (error: any) {
      console.error("Error updating contract checklist template:", error);
      res.status(500).json({ message: "Failed to update contract checklist template" });
    }
  });

  app.delete("/api/contract-checklist-templates/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      await storage.deleteContractChecklistTemplate(req.params.id);

      await logAuditAction(
        req,
        "delete",
        "contract_checklist_template",
        req.params.id,
        "Deleted contract checklist template"
      );

      res.json({ message: "Contract checklist template deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting contract checklist template:", error);
      res.status(500).json({ message: "Failed to delete contract checklist template" });
    }
  });

  // Contract Checklist Template Items routes
  app.get("/api/contract-checklist-templates/:templateId/items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getContractChecklistTemplateItems(req.params.templateId);
      res.json(items);
    } catch (error: any) {
      console.error("Error fetching contract checklist template items:", error);
      res.status(500).json({ message: "Failed to fetch contract checklist template items" });
    }
  });

  app.post("/api/contract-checklist-template-items", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const validationResult = insertContractChecklistTemplateItemSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid contract checklist template item data", 
          errors: validationResult.error.errors 
        });
      }

      const item = await storage.createContractChecklistTemplateItem(validationResult.data);
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error creating contract checklist template item:", error);
      res.status(500).json({ message: "Failed to create contract checklist template item" });
    }
  });

  app.patch("/api/contract-checklist-template-items/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const item = await storage.updateContractChecklistTemplateItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      console.error("Error updating contract checklist template item:", error);
      res.status(500).json({ message: "Failed to update contract checklist template item" });
    }
  });

  app.delete("/api/contract-checklist-template-items/:id", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      await storage.deleteContractChecklistTemplateItem(req.params.id);
      res.json({ message: "Contract checklist template item deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting contract checklist template item:", error);
      res.status(500).json({ message: "Failed to delete contract checklist template item" });
    }
  });

  // Contract Checklist Items routes (actual checklist items for contracts)
  app.get("/api/contracts/:contractId/checklist", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getContractChecklistItems(req.params.contractId);
      res.json(items);
    } catch (error: any) {
      console.error("Error fetching contract checklist items:", error);
      res.status(500).json({ message: "Failed to fetch contract checklist items" });
    }
  });

  app.post("/api/contracts/:contractId/checklist/initialize", isAuthenticated, async (req, res) => {
    try {
      const { templateId } = req.body;
      if (!templateId) {
        return res.status(400).json({ message: "Template ID is required" });
      }

      const items = await storage.initializeContractChecklist(req.params.contractId, templateId);

      await logAuditAction(
        req,
        "create",
        "contract_checklist",
        req.params.contractId,
        `Initialized contract checklist with template ${templateId}`
      );

      res.status(201).json(items);
    } catch (error: any) {
      console.error("Error initializing contract checklist:", error);
      res.status(500).json({ message: "Failed to initialize contract checklist" });
    }
  });

  app.patch("/api/contract-checklist-items/:id", isAuthenticated, requireResourceOwnership('checklist-item'), async (req, res) => {
    try {
      const item = await storage.updateContractChecklistItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      console.error("Error updating contract checklist item:", error);
      res.status(500).json({ message: "Failed to update contract checklist item" });
    }
  });

  app.post("/api/contract-checklist-items/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { notes } = req.body;
      const item = await storage.completeContractChecklistItem(req.params.id, userId, notes);

      await logAuditAction(
        req,
        "update",
        "contract_checklist_item",
        item.id,
        `Completed checklist item: ${item.title}`
      );

      res.json(item);
    } catch (error: any) {
      console.error("Error completing contract checklist item:", error);
      res.status(500).json({ message: "Failed to complete contract checklist item" });
    }
  });

  // Rental Health Score routes
  app.get("/api/contracts/:contractId/health-score", isAuthenticated, async (req, res) => {
    try {
      const score = await storage.getRentalHealthScore(req.params.contractId);
      if (!score) {
        return res.status(404).json({ message: "Rental health score not found" });
      }
      res.json(score);
    } catch (error: any) {
      console.error("Error fetching rental health score:", error);
      res.status(500).json({ message: "Failed to fetch rental health score" });
    }
  });

  app.post("/api/contracts/:contractId/calculate-health-score", isAuthenticated, async (req, res) => {
    try {
      const score = await storage.calculateRentalHealthScore(req.params.contractId);
      res.json(score);
    } catch (error: any) {
      console.error("Error calculating rental health score:", error);
      res.status(500).json({ message: "Failed to calculate rental health score" });
    }
  });

  app.get("/api/rental-health-scores/status/:status", isAuthenticated, async (req, res) => {
    try {
      const scores = await storage.getRentalHealthScoresByStatus(req.params.status);
      res.json(scores);
    } catch (error: any) {
      console.error("Error fetching rental health scores by status:", error);
      res.status(500).json({ message: "Failed to fetch rental health scores" });
    }
  });

  // Workflow Event routes
  app.get("/api/workflow-events", isAuthenticated, requireFullAdmin, async (req, res) => {
    try {
      const { eventType, entityType, entityId } = req.query;
      const events = await storage.getWorkflowEvents({
        eventType: eventType as string,
        entityType: entityType as string,
        entityId: entityId as string
      });
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching workflow events:", error);
      res.status(500).json({ message: "Failed to fetch workflow events" });
    }
  });

  app.post("/api/workflow-events", isAuthenticated, async (req, res) => {
    try {
      const validationResult = insertWorkflowEventSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid workflow event data", 
          errors: validationResult.error.errors 
        });
      }

      const event = await storage.createWorkflowEvent(validationResult.data);
      res.status(201).json(event);
    } catch (error: any) {
      console.error("Error creating workflow event:", error);
      res.status(500).json({ message: "Failed to create workflow event" });
    }
  });

  // System Alert routes
  app.get("/api/alerts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { status, priority, alertType } = req.query;
      
      const alerts = await storage.getSystemAlerts({
        userId: userId || undefined,
        status: status as string,
        priority: priority as string,
        alertType: alertType as string
      });
      
      res.json(alerts);
    } catch (error: any) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/pending", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const alerts = await storage.getUserPendingAlerts(userId);
      res.json(alerts);
    } catch (error: any) {
      console.error("Error fetching pending alerts:", error);
      res.status(500).json({ message: "Failed to fetch pending alerts" });
    }
  });

  app.post("/api/alerts", isAuthenticated, async (req, res) => {
    try {
      const validationResult = insertSystemAlertSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid alert data", 
          errors: validationResult.error.errors 
        });
      }

      const alert = await storage.createSystemAlert(validationResult.data);
      res.status(201).json(alert);
    } catch (error: any) {
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  app.patch("/api/alerts/:id/acknowledge", isAuthenticated, requireResourceOwnership('alert', 'userId'), async (req, res) => {
    try {
      const alert = await storage.acknowledgeSystemAlert(req.params.id);
      res.json(alert);
    } catch (error: any) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  app.patch("/api/alerts/:id/resolve", isAuthenticated, requireResourceOwnership('alert', 'userId'), async (req, res) => {
    try {
      const alert = await storage.resolveSystemAlert(req.params.id);
      res.json(alert);
    } catch (error: any) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert" });
    }
  });

  app.patch("/api/alerts/:id/dismiss", isAuthenticated, requireResourceOwnership('alert', 'userId'), async (req, res) => {
    try {
      const alert = await storage.dismissSystemAlert(req.params.id);
      res.json(alert);
    } catch (error: any) {
      console.error("Error dismissing alert:", error);
      res.status(500).json({ message: "Failed to dismiss alert" });
    }
  });

  app.delete("/api/alerts/:id", isAuthenticated, requireResourceOwnership('alert', 'userId'), async (req, res) => {
    try {
      await storage.deleteSystemAlert(req.params.id);
      res.json({ message: "Alert deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting alert:", error);
      res.status(500).json({ message: "Failed to delete alert" });
    }
  });

  // Admin Rental Contracts with relations
  app.get("/api/admin/rental-contracts", isAuthenticated, requireRole(["master", "admin", "admin_jr"]), async (req, res) => {
    try {
      const { status } = req.query;
      const filters: any = {};
      if (status && status !== "all") filters.status = status;

      const contracts = await storage.getRentalContracts(filters);
      
      // Fetch related data for each contract
      const enrichedContracts = await Promise.all(
        contracts.map(async (contract) => {
          const [property, tenant, owner, seller] = await Promise.all([
            storage.getProperty(contract.propertyId),
            storage.getUser(contract.tenantId),
            storage.getUser(contract.ownerId),
            contract.sellerId ? storage.getUser(contract.sellerId) : null,
          ]);

          return {
            ...contract,
            property: property ? { title: property.title, address: property.address } : null,
            tenant: tenant ? { fullName: tenant.fullName, email: tenant.email } : null,
            owner: owner ? { fullName: owner.fullName, email: owner.email } : null,
            seller: seller ? { fullName: seller.fullName, email: seller.email } : null,
          };
        })
      );

      res.json(enrichedContracts);
    } catch (error: any) {
      console.error("Error fetching admin rental contracts:", error);
      res.status(500).json({ message: "Failed to fetch rental contracts" });
    }
  });

  // Admin Integrations Status endpoint
  app.get("/api/admin/integrations/status", isAuthenticated, requireRole(["master", "admin"]), async (req, res) => {
    try {
      const integrations = [];

      // OpenAI
      const openAIConfigured = !!process.env.OPENAI_API_KEY;
      integrations.push({
        id: "openai",
        name: "OpenAI (MARCO)",
        status: openAIConfigured ? "connected" : "disconnected",
        description: "Virtual assistant powered by GPT-5",
        configFields: ["OPENAI_API_KEY"]
      });

      // Gemini
      const geminiConfigured = !!process.env.GEMINI_API_KEY;
      integrations.push({
        id: "gemini",
        name: "Google Gemini",
        status: geminiConfigured ? "connected" : "disconnected",
        description: "AI-powered features",
        configFields: ["GEMINI_API_KEY"]
      });

      // Gmail (connector-based) - Primary email service
      let gmailStatus = "disconnected";
      let gmailConnectionUrl = "";
      try {
        const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
        const xReplitToken = process.env.REPL_IDENTITY
          ? 'repl ' + process.env.REPL_IDENTITY
          : process.env.WEB_REPL_RENEWAL
          ? 'depl ' + process.env.WEB_REPL_RENEWAL
          : null;
        
        if (xReplitToken && hostname) {
          const connectorData = await fetch(
            'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
            {
              headers: {
                'Accept': 'application/json',
                'X_REPLIT_TOKEN': xReplitToken
              }
            }
          ).then(res => res.json());
          
          const accessToken = connectorData.items?.[0]?.settings?.access_token || connectorData.items?.[0]?.settings?.oauth?.credentials?.access_token;
          if (accessToken) {
            gmailStatus = "connected";
          }
          gmailConnectionUrl = connectorData.items?.[0]?.connector_url || "";
        }
      } catch (error) {
        console.error("Error checking Gmail status:", error);
      }

      integrations.push({
        id: "gmail",
        name: "Gmail API",
        status: gmailStatus,
        description: "Primary email delivery service for transactional emails",
        configFields: ["Replit Connector"],
        connectionUrl: gmailConnectionUrl,
        connectorId: "connection:conn_google-mail_01K6X65JFWT1MNBAXJ58YB90E7"
      });

      // Google Calendar (connector-based)
      let calendarStatus = "disconnected";
      let calendarConnectionUrl = "";
      try {
        const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
        const xReplitToken = process.env.REPL_IDENTITY
          ? 'repl ' + process.env.REPL_IDENTITY
          : process.env.WEB_REPL_RENEWAL
          ? 'depl ' + process.env.WEB_REPL_RENEWAL
          : null;
        
        if (xReplitToken && hostname) {
          const connectorData = await fetch(
            'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
            {
              headers: {
                'Accept': 'application/json',
                'X_REPLIT_TOKEN': xReplitToken
              }
            }
          ).then(res => res.json());
          
          const accessToken = connectorData.items?.[0]?.settings?.access_token || connectorData.items?.[0]?.settings?.oauth?.credentials?.access_token;
          if (accessToken) {
            calendarStatus = "connected";
          }
          calendarConnectionUrl = connectorData.items?.[0]?.connector_url || "";
        }
      } catch (error) {
        console.error("Error checking Google Calendar status:", error);
      }

      integrations.push({
        id: "google_calendar",
        name: "Google Calendar",
        status: calendarStatus,
        description: "Event scheduling and Google Meet integration for appointments",
        configFields: ["Replit Connector"],
        connectionUrl: calendarConnectionUrl,
        connectorId: "connection:conn_google-calendar_01K6PJRVNHMM6V7V8F6WMG47F5"
      });

      // PostgreSQL Database
      const databaseConfigured = !!process.env.DATABASE_URL;
      integrations.push({
        id: "database",
        name: "PostgreSQL Database",
        status: databaseConfigured ? "connected" : "disconnected",
        description: "Neon serverless database for data persistence",
        configFields: ["DATABASE_URL"],
        isBuiltIn: true
      });

      res.json({ integrations });
    } catch (error: any) {
      console.error("Error fetching integrations status:", error);
      res.status(500).json({ message: "Failed to fetch integrations status" });
    }
  });

  // ============================================================================
  // NEW BUSINESS MODEL IMPROVEMENTS & AI FEATURES
  // ============================================================================

  // Commission Advance endpoints
  app.get("/api/seller/commission-advances", isAuthenticated, requireRole(["seller", "admin", "master"]), async (req, res) => {
    try {
      const userId = req.session.adminUser?.id || req.user?.claims?.sub;
      const advances = await storage.getCommissionAdvances({ sellerId: userId });
      res.json(advances);
    } catch (error: any) {
      console.error("Error fetching commission advances:", error);
      res.status(500).json({ message: "Failed to fetch commission advances" });
    }
  });

  app.post("/api/seller/commission-advances", isAuthenticated, requireRole(["seller"]), async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const advance = await storage.createCommissionAdvance({
        sellerId: userId,
        amount: req.body.amount,
        reason: sanitizeText(req.body.reason),
        status: "pending"
      });
      res.json(advance);
    } catch (error: any) {
      console.error("Error creating commission advance:", error);
      res.status(500).json({ message: "Failed to create commission advance" });
    }
  });

  app.patch("/api/admin/commission-advances/:id/status", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const userId = req.session.adminUser?.id || req.user?.claims?.sub;
      const advance = await storage.updateCommissionAdvanceStatus(
        req.params.id,
        req.body.status,
        userId,
        req.body.notes
      );
      res.json(advance);
    } catch (error: any) {
      console.error("Error updating commission advance:", error);
      res.status(500).json({ message: "Failed to update commission advance" });
    }
  });

  // Service Favorites endpoints
  app.post("/api/service-favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.adminUser?.id || req.user?.claims?.sub;
      const favorite = await storage.addServiceFavorite({
        userId,
        providerId: req.body.providerId
      });
      res.json(favorite);
    } catch (error: any) {
      console.error("Error adding service favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/service-favorites/:providerId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.adminUser?.id || req.user?.claims?.sub;
      await storage.removeServiceFavorite(userId, req.params.providerId);
      res.json({ message: "Favorite removed" });
    } catch (error: any) {
      console.error("Error removing service favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/service-favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.adminUser?.id || req.user?.claims?.sub;
      const favorites = await storage.getUserServiceFavorites(userId);
      res.json(favorites);
    } catch (error: any) {
      console.error("Error fetching service favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Predictive Analytics endpoints (OpenAI powered)
  app.post("/api/admin/predictive-analytics/rental-probability", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const property = await storage.getProperty(req.body.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const analysis = await openAIService.analyzeRentalProbability(property);
      
      const analytic = await storage.createPredictiveAnalytic({
        propertyId: property.id,
        type: "rental_probability",
        prediction: analysis.prediction,
        confidence: analysis.confidence.toString(),
        recommendedAction: analysis.recommendedAction,
        factors: analysis.factors,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
      
      res.json(analytic);
    } catch (error: any) {
      console.error("Error analyzing rental probability:", error);
      res.status(500).json({ message: "Failed to analyze rental probability" });
    }
  });

  app.post("/api/admin/predictive-analytics/price-recommendation", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const property = await storage.getProperty(req.body.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const analysis = await openAIService.analyzePriceRecommendation(property);
      
      const analytic = await storage.createPredictiveAnalytic({
        propertyId: property.id,
        type: "price_recommendation",
        prediction: analysis.prediction,
        confidence: analysis.confidence.toString(),
        recommendedAction: analysis.recommendedAction,
        factors: analysis.factors,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      
      res.json(analytic);
    } catch (error: any) {
      console.error("Error analyzing price recommendation:", error);
      res.status(500).json({ message: "Failed to analyze price recommendation" });
    }
  });

  app.get("/api/admin/predictive-analytics", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const analytics = await storage.getPredictiveAnalytics({
        propertyId: req.query.propertyId as string,
        type: req.query.type as string
      });
      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching predictive analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Legal Documents endpoints (OpenAI powered)
  app.post("/api/admin/legal-documents/generate-contract", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const userId = req.session.adminUser?.id || req.user?.claims?.sub;
      const property = await storage.getProperty(req.body.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      const result = await openAIService.generateRentalContract(req.body.parties, {
        address: property.address,
        monthlyRent: req.body.monthlyRent,
        deposit: req.body.deposit
      });
      
      const document = await storage.createLegalDocument({
        type: "rental_contract",
        propertyId: property.id,
        parties: req.body.parties,
        content: result.content,
        metadata: result.metadata,
        generatedBy: userId,
        status: "draft"
      });
      
      res.json(document);
    } catch (error: any) {
      console.error("Error generating legal document:", error);
      res.status(500).json({ message: "Failed to generate legal document" });
    }
  });

  app.get("/api/legal-documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getLegalDocuments({
        propertyId: req.query.propertyId as string,
        type: req.query.type as string,
        status: req.query.status as string
      });
      res.json(documents);
    } catch (error: any) {
      console.error("Error fetching legal documents:", error);
      res.status(500).json({ message: "Failed to fetch legal documents" });
    }
  });

  app.patch("/api/admin/legal-documents/:id/status", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const document = await storage.updateLegalDocumentStatus(req.params.id, req.body.status);
      res.json(document);
    } catch (error: any) {
      console.error("Error updating legal document:", error);
      res.status(500).json({ message: "Failed to update legal document" });
    }
  });

  // Tenant Screening endpoints (OpenAI powered)
  app.post("/api/admin/tenant-screening", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const userId = req.session.adminUser?.id || req.user?.claims?.sub;
      
      const screening = await openAIService.screenTenant(req.body.applicationData);
      
      const result = await storage.createTenantScreening({
        applicationId: req.body.applicationId,
        applicantId: req.body.applicantId,
        propertyId: req.body.propertyId,
        status: "completed",
        riskScore: screening.riskScore.toString(),
        riskLevel: screening.riskLevel,
        aiAnalysis: screening.aiAnalysis,
        fraudDetection: screening.fraudDetection,
        incomeVerification: screening.incomeVerification,
        creditAnalysis: screening.creditAnalysis,
        rentalHistory: screening.rentalHistory,
        recommendations: screening.recommendations,
        flags: screening.flags,
        completedAt: new Date()
      });
      
      res.json(result);
    } catch (error: any) {
      console.error("Error screening tenant:", error);
      res.status(500).json({ message: "Failed to screen tenant" });
    }
  });

  app.get("/api/admin/tenant-screenings", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const screenings = await storage.getTenantScreenings({
        applicationId: req.query.applicationId as string,
        applicantId: req.query.applicantId as string,
        propertyId: req.query.propertyId as string,
        status: req.query.status as string
      });
      res.json(screenings);
    } catch (error: any) {
      console.error("Error fetching tenant screenings:", error);
      res.status(500).json({ message: "Failed to fetch tenant screenings" });
    }
  });

  // Marketing Campaigns endpoints
  app.get("/api/admin/marketing-campaigns", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const campaigns = await storage.getMarketingCampaigns({
        status: req.query.status as string,
        type: req.query.type as string
      });
      res.json(campaigns);
    } catch (error: any) {
      console.error("Error fetching marketing campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/admin/marketing-campaigns", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const userId = req.session.adminUser?.id || req.user?.claims?.sub;
      const campaign = await storage.createMarketingCampaign({
        name: sanitizeText(req.body.name),
        type: req.body.type,
        targetAudience: req.body.targetAudience,
        content: req.body.content,
        schedule: req.body.schedule,
        createdBy: userId
      });
      res.json(campaign);
    } catch (error: any) {
      console.error("Error creating marketing campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.patch("/api/admin/marketing-campaigns/:id/status", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const campaign = await storage.updateMarketingCampaignStatus(req.params.id, req.body.status);
      res.json(campaign);
    } catch (error: any) {
      console.error("Error updating campaign status:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.get("/api/admin/marketing-campaigns/stats", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const campaigns = await storage.getMarketingCampaigns({});
      const stats = {
        total: campaigns.length,
        scheduled: campaigns.filter(c => c.status === "scheduled").length,
        sent: campaigns.filter(c => c.status === "sent").length,
        avgOpenRate: campaigns.length > 0 
          ? campaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / campaigns.length
          : 0
      };
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching campaign stats:", error);
      res.status(500).json({ message: "Failed to fetch campaign stats" });
    }
  });

  // Maintenance Schedules endpoints
  app.get("/api/owner/maintenance-schedules", isAuthenticated, requireRole(["owner", "admin", "master"]), async (req, res) => {
    try {
      const schedules = await storage.getMaintenanceSchedules({
        propertyId: req.query.propertyId as string,
        active: req.query.active === "true"
      });
      res.json(schedules);
    } catch (error: any) {
      console.error("Error fetching maintenance schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post("/api/owner/maintenance-schedules", isAuthenticated, requireRole(["owner", "admin", "master"]), async (req, res) => {
    try {
      const schedule = await storage.createMaintenanceSchedule({
        propertyId: req.body.propertyId,
        title: sanitizeText(req.body.title),
        description: sanitizeText(req.body.description),
        frequency: req.body.frequency,
        nextDue: new Date(req.body.nextDue),
        estimatedCost: req.body.estimatedCost,
        assignedTo: req.body.assignedTo
      });
      res.json(schedule);
    } catch (error: any) {
      console.error("Error creating maintenance schedule:", error);
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  app.patch("/api/owner/maintenance-schedules/:id", isAuthenticated, requireRole(["owner", "admin", "master"]), async (req, res) => {
    try {
      const schedule = await storage.updateMaintenanceSchedule(req.params.id, req.body);
      res.json(schedule);
    } catch (error: any) {
      console.error("Error updating maintenance schedule:", error);
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  // ========================================
  // HOA (Homeowners Association) Module Routes
  // ========================================

  // Condominium Units
  app.get("/api/hoa/condominiums/:condominiumId/units", isAuthenticated, requireRole(["admin", "master", "management"]), async (req, res) => {
    try {
      const units = await storage.getCondominiumUnitsByCondominium(req.params.condominiumId);
      res.json(units);
    } catch (error: any) {
      console.error("Error fetching condominium units:", error);
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  app.get("/api/hoa/my-units", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const units = await storage.getCondominiumUnitsByOwner(userId);
      res.json(units);
    } catch (error: any) {
      console.error("Error fetching my units:", error);
      res.status(500).json({ message: "Failed to fetch units" });
    }
  });

  app.get("/api/hoa/units/:id", isAuthenticated, async (req, res) => {
    try {
      const unit = await storage.getCondominiumUnit(req.params.id);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      res.json(unit);
    } catch (error: any) {
      console.error("Error fetching unit:", error);
      res.status(500).json({ message: "Failed to fetch unit" });
    }
  });

  app.post("/api/hoa/units", isAuthenticated, requireRole(["admin", "master", "management"]), async (req, res) => {
    try {
      const validationResult = insertCondominiumUnitSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const unit = await storage.createCondominiumUnit(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "condominium_unit",
        unit.id,
        `Created unit ${unit.unitNumber} in condominium ${unit.condominiumId}`
      );

      res.status(201).json(unit);
    } catch (error: any) {
      console.error("Error creating unit:", error);
      res.status(500).json({ message: "Failed to create unit" });
    }
  });

  app.patch("/api/hoa/units/:id", isAuthenticated, requireRole(["admin", "master", "management"]), async (req, res) => {
    try {
      const validationResult = insertCondominiumUnitSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const existingUnit = await storage.getCondominiumUnit(req.params.id);
      if (!existingUnit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      const unit = await storage.updateCondominiumUnit(req.params.id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "condominium_unit",
        req.params.id,
        `Updated unit ${unit.unitNumber}`
      );

      res.json(unit);
    } catch (error: any) {
      console.error("Error updating unit:", error);
      res.status(500).json({ message: "Failed to update unit" });
    }
  });

  app.delete("/api/hoa/units/:id", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      await storage.deleteCondominiumUnit(req.params.id);

      await createAuditLog(
        req,
        "delete",
        "condominium_unit",
        req.params.id,
        `Deleted unit`
      );

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting unit:", error);
      res.status(500).json({ message: "Failed to delete unit" });
    }
  });

  // Condominium Fees
  app.get("/api/hoa/units/:unitId/fees", isAuthenticated, async (req, res) => {
    try {
      const fees = await storage.getCondominiumFeesByUnit(req.params.unitId);
      res.json(fees);
    } catch (error: any) {
      console.error("Error fetching fees:", error);
      res.status(500).json({ message: "Failed to fetch fees" });
    }
  });

  app.get("/api/hoa/fees/status/:status", isAuthenticated, requireRole(["admin", "master", "management"]), async (req, res) => {
    try {
      const fees = await storage.getCondominiumFeesByStatus(req.params.status);
      res.json(fees);
    } catch (error: any) {
      console.error("Error fetching fees:", error);
      res.status(500).json({ message: "Failed to fetch fees" });
    }
  });

  app.post("/api/hoa/fees", isAuthenticated, requireRole(["admin", "master", "management"]), async (req, res) => {
    try {
      const userId = req.session.adminUser?.id || req.user?.claims?.sub;
      const validationResult = insertCondominiumFeeSchema.safeParse({
        ...req.body,
        createdById: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const fee = await storage.createCondominiumFee(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "condominium_fee",
        fee.id,
        `Created fee for unit ${fee.condominiumUnitId} - ${fee.month}/${fee.year}`
      );

      res.status(201).json(fee);
    } catch (error: any) {
      console.error("Error creating fee:", error);
      res.status(500).json({ message: "Failed to create fee" });
    }
  });

  app.patch("/api/hoa/fees/:id", isAuthenticated, requireRole(["admin", "master", "management"]), async (req, res) => {
    try {
      const validationResult = insertCondominiumFeeSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const existingFee = await storage.getCondominiumFee(req.params.id);
      if (!existingFee) {
        return res.status(404).json({ message: "Fee not found" });
      }

      const fee = await storage.updateCondominiumFee(req.params.id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "condominium_fee",
        req.params.id,
        `Updated fee`
      );

      res.json(fee);
    } catch (error: any) {
      console.error("Error updating fee:", error);
      res.status(500).json({ message: "Failed to update fee" });
    }
  });

  app.patch("/api/hoa/fees/:id/status", isAuthenticated, requireRole(["admin", "master", "management"]), async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const fee = await storage.updateCondominiumFeeStatus(req.params.id, status);

      await createAuditLog(
        req,
        "update",
        "condominium_fee",
        req.params.id,
        `Updated fee status to ${status}`
      );

      res.json(fee);
    } catch (error: any) {
      console.error("Error updating fee status:", error);
      res.status(500).json({ message: "Failed to update fee status" });
    }
  });

  // Condominium Fee Payments
  app.get("/api/hoa/fees/:feeId/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getCondominiumFeePaymentsByFee(req.params.feeId);
      res.json(payments);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/hoa/fees/:feeId/payments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = insertCondominiumFeePaymentSchema.safeParse({
        ...req.body,
        condominiumFeeId: req.params.feeId,
        registeredById: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const payment = await storage.createCondominiumFeePayment(validationResult.data);

      // Update fee status to pagado
      await storage.updateCondominiumFeeStatus(req.params.feeId, "pagado");

      await createAuditLog(
        req,
        "create",
        "condominium_fee_payment",
        payment.id,
        `Registered payment for fee ${req.params.feeId}`
      );

      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Condominium Issues
  app.get("/api/hoa/condominiums/:condominiumId/issues", isAuthenticated, requireRole(["admin", "master", "management"]), async (req, res) => {
    try {
      const issues = await storage.getCondominiumIssuesByCondominium(req.params.condominiumId);
      res.json(issues);
    } catch (error: any) {
      console.error("Error fetching issues:", error);
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.get("/api/hoa/my-issues", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const issues = await storage.getCondominiumIssuesByReporter(userId);
      res.json(issues);
    } catch (error: any) {
      console.error("Error fetching my issues:", error);
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.get("/api/hoa/issues/status/:status", isAuthenticated, requireRole(["admin", "master", "management"]), async (req, res) => {
    try {
      const issues = await storage.getCondominiumIssuesByStatus(req.params.status);
      res.json(issues);
    } catch (error: any) {
      console.error("Error fetching issues:", error);
      res.status(500).json({ message: "Failed to fetch issues" });
    }
  });

  app.get("/api/hoa/issues/:id", isAuthenticated, async (req, res) => {
    try {
      const issue = await storage.getCondominiumIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      res.json(issue);
    } catch (error: any) {
      console.error("Error fetching issue:", error);
      res.status(500).json({ message: "Failed to fetch issue" });
    }
  });

  app.post("/api/hoa/issues", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = insertCondominiumIssueSchema.safeParse({
        ...req.body,
        reportedById: userId,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const issue = await storage.createCondominiumIssue(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "condominium_issue",
        issue.id,
        `Reported issue: ${issue.title}`
      );

      res.status(201).json(issue);
    } catch (error: any) {
      console.error("Error creating issue:", error);
      res.status(500).json({ message: "Failed to create issue" });
    }
  });

  app.patch("/api/hoa/issues/:id", isAuthenticated, async (req, res) => {
    try {
      const validationResult = insertCondominiumIssueSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const existingIssue = await storage.getCondominiumIssue(req.params.id);
      if (!existingIssue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const issue = await storage.updateCondominiumIssue(req.params.id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "condominium_issue",
        req.params.id,
        `Updated issue: ${issue.title}`
      );

      res.json(issue);
    } catch (error: any) {
      console.error("Error updating issue:", error);
      res.status(500).json({ message: "Failed to update issue" });
    }
  });

  app.patch("/api/hoa/issues/:id/status", isAuthenticated, requireRole(["admin", "master", "management"]), async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const existingIssue = await storage.getCondominiumIssue(req.params.id);
      if (!existingIssue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const issue = await storage.updateCondominiumIssueStatus(req.params.id, status);

      await createAuditLog(
        req,
        "update",
        "condominium_issue",
        req.params.id,
        `Updated issue status to ${status}`
      );

      res.json(issue);
    } catch (error: any) {
      console.error("Error updating issue status:", error);
      res.status(500).json({ message: "Failed to update issue status" });
    }
  });

  app.post("/api/hoa/issues/:id/resolve", isAuthenticated, requireRole(["admin", "master", "management"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { resolution } = req.body;

      if (!resolution) {
        return res.status(400).json({ message: "Resolution is required" });
      }

      const existingIssue = await storage.getCondominiumIssue(req.params.id);
      if (!existingIssue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const issue = await storage.resolveCondominiumIssue(req.params.id, userId, resolution);

      await createAuditLog(
        req,
        "update",
        "condominium_issue",
        req.params.id,
        `Resolved issue: ${issue.title}`
      );

      res.json(issue);
    } catch (error: any) {
      console.error("Error resolving issue:", error);
      res.status(500).json({ message: "Failed to resolve issue" });
    }
  });

  // ========================================
  // HOA Manager System Routes
  // ========================================

  // HOA Manager Assignment Routes

  // Request to become HOA manager for a condominium
  app.post("/api/hoa-manager/assignments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = insertHoaManagerAssignmentSchema.safeParse({
        ...req.body,
        managerId: userId,
        status: "pending",
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      // Check if there's already a pending or approved assignment
      const existingAssignments = await storage.getHoaManagerAssignmentsByCondominium(req.body.condominiumId);
      const hasPendingOrApproved = existingAssignments.some(a => a.managerId === userId && (a.status === 'pending' || a.status === 'approved'));
      
      if (hasPendingOrApproved) {
        return res.status(400).json({ message: "You already have a pending or approved assignment for this condominium" });
      }

      const assignment = await storage.createHoaManagerAssignment(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "hoa_manager_assignment",
        assignment.id,
        `Requested HOA manager assignment for condominium ${assignment.condominiumId}`
      );

      res.status(201).json(assignment);
    } catch (error: any) {
      console.error("Error creating HOA manager assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  // Get all assignments (admin only)
  app.get("/api/hoa-manager/assignments", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const assignments = status 
        ? await storage.getHoaManagerAssignmentsByStatus(status)
        : await storage.getHoaManagerAssignmentsByStatus("pending");
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Get all assignments with user and condominium details (admin only)
  app.get("/api/hoa-manager/all-assignments", isAuthenticated, requireRole(["admin", "master"]), async (req, res) => {
    try {
      const allAssignments = await storage.getHoaManagerAssignmentsByStatus("pending");
      
      // Enrich with user and condominium details
      const enriched = await Promise.all(
        allAssignments.map(async (assignment) => {
          const manager = await storage.getUser(assignment.managerId);
          const condominium = await storage.getCondominium(assignment.condominiumId);
          
          return {
            ...assignment,
            manager: manager ? {
              id: manager.id,
              firstName: manager.firstName,
              lastName: manager.lastName,
              email: manager.email,
            } : undefined,
            condominium: condominium ? {
              id: condominium.id,
              name: condominium.name,
            } : undefined,
          };
        })
      );
      
      res.json(enriched);
    } catch (error: any) {
      console.error("Error fetching all assignments:", error);
      res.status(500).json({ message: "Failed to fetch all assignments" });
    }
  });

  // Get my assignments (HOA manager)
  app.get("/api/hoa-manager/my-assignments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assignments = await storage.getHoaManagerAssignmentsByManager(userId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching my assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Get assignment by condominium
  app.get("/api/hoa-manager/assignments/condominium/:condominiumId", isAuthenticated, async (req, res) => {
    try {
      const assignments = await storage.getHoaManagerAssignmentsByCondominium(req.params.condominiumId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Approve HOA manager assignment (admin only)
  app.post("/api/hoa-manager/assignments/:id/approve", isAuthenticated, requireRole(["admin", "master"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Approval reason is required" });
      }

      const assignment = await storage.approveHoaManagerAssignment(req.params.id, userId, reason);

      // Get condominium details for notification
      const condominium = await storage.getCondominium(assignment.condominiumId);

      // Notify the manager about approval
      await storage.createNotification({
        userId: assignment.managerId,
        type: "role_approved",
        title: "Solicitud de HOA Manager Aprobada",
        message: `Tu solicitud para administrar ${condominium?.name || 'el condominio'} ha sido aprobada. Motivo: ${reason}`,
        link: "/perfil"
      });

      await createAuditLog(
        req,
        "approve",
        "hoa_manager_assignment",
        req.params.id,
        `Approved HOA manager assignment for condominium ${assignment.condominiumId}: ${reason}`
      );

      res.json(assignment);
    } catch (error: any) {
      console.error("Error approving assignment:", error);
      res.status(500).json({ message: "Failed to approve assignment" });
    }
  });

  // Reject HOA manager assignment (admin only)
  app.post("/api/hoa-manager/assignments/:id/reject", isAuthenticated, requireRole(["admin", "master"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const assignment = await storage.rejectHoaManagerAssignment(req.params.id, userId, reason);

      // Get condominium details for notification
      const condominium = await storage.getCondominium(assignment.condominiumId);

      // Notify the manager about rejection
      await storage.createNotification({
        userId: assignment.managerId,
        type: "role_rejected",
        title: "Solicitud de HOA Manager Rechazada",
        message: `Tu solicitud para administrar ${condominium?.name || 'el condominio'} ha sido rechazada. Motivo: ${reason}`,
        link: "/perfil"
      });

      await createAuditLog(
        req,
        "reject",
        "hoa_manager_assignment",
        req.params.id,
        `Rejected HOA manager assignment: ${reason}`
      );

      res.json(assignment);
    } catch (error: any) {
      console.error("Error rejecting assignment:", error);
      res.status(500).json({ message: "Failed to reject assignment" });
    }
  });

  // Suspend HOA manager assignment (admin only)
  app.post("/api/hoa-manager/assignments/:id/suspend", isAuthenticated, requireRole(["admin", "master"]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ message: "Suspension reason is required" });
      }

      const assignment = await storage.suspendHoaManagerAssignment(req.params.id, userId, reason);

      await createAuditLog(
        req,
        "update",
        "hoa_manager_assignment",
        req.params.id,
        `Suspended HOA manager assignment: ${reason}`
      );

      res.json(assignment);
    } catch (error: any) {
      console.error("Error suspending assignment:", error);
      res.status(500).json({ message: "Failed to suspend assignment" });
    }
  });

  // HOA Announcement Routes

  // Get announcements for a condominium (only for owners/managers of that condominium or admins)
  app.get("/api/hoa-manager/condominiums/:condominiumId/announcements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const condominiumId = req.params.condominiumId;

      // Check if user is admin, or owner/manager of this condominium
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin' || user?.role === 'master';
      
      if (!isAdmin) {
        // Check if user is an owner of a unit in this condominium or the HOA manager
        const units = await storage.getCondominiumUnitsByOwner(userId);
        const ownsUnitInCondo = units.some(u => u.condominiumId === condominiumId);
        const assignment = await storage.getApprovedHoaManagerByCondominium(condominiumId);
        const isHoaManager = assignment?.managerId === userId;

        if (!ownsUnitInCondo && !isHoaManager) {
          return res.status(403).json({ message: "Not authorized to view announcements for this condominium" });
        }
      }

      const announcements = await storage.getHoaAnnouncementsByCondominium(condominiumId);
      res.json(announcements);
    } catch (error: any) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Get my announcements (HOA manager)
  app.get("/api/hoa-manager/my-announcements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const announcements = await storage.getHoaAnnouncementsByManager(userId);
      res.json(announcements);
    } catch (error: any) {
      console.error("Error fetching my announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Get unread announcements for owner
  app.get("/api/hoa-manager/my-unread-announcements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const announcements = await storage.getUnreadHoaAnnouncementsForOwner(userId);
      res.json(announcements);
    } catch (error: any) {
      console.error("Error fetching unread announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Create announcement (HOA manager only - must be approved for condominium)
  app.post("/api/hoa-manager/announcements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = insertHoaAnnouncementSchema.safeParse({
        ...req.body,
        managerId: userId,
        isActive: false,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      // Check if user is approved HOA manager for this condominium
      const approvedManager = await storage.getApprovedHoaManagerByCondominium(req.body.condominiumId);
      if (!approvedManager || approvedManager.managerId !== userId) {
        return res.status(403).json({ message: "You are not an approved HOA manager for this condominium" });
      }

      // Double-check assignment is not suspended
      if (approvedManager.status === 'suspended') {
        return res.status(403).json({ message: "Your HOA manager assignment is currently suspended" });
      }

      const announcement = await storage.createHoaAnnouncement(validationResult.data);

      await createAuditLog(
        req,
        "create",
        "hoa_announcement",
        announcement.id,
        `Created announcement: ${announcement.title}`
      );

      res.status(201).json(announcement);
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // Update announcement
  app.patch("/api/hoa-manager/announcements/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = insertHoaAnnouncementSchema.partial().safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid data",
          errors: validationResult.error.errors,
        });
      }

      const existingAnnouncement = await storage.getHoaAnnouncement(req.params.id);
      if (!existingAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      // Only the manager who created it can update
      if (existingAnnouncement.managerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this announcement" });
      }

      // Verify manager is still approved and not suspended
      const approvedManager = await storage.getApprovedHoaManagerByCondominium(existingAnnouncement.condominiumId);
      if (!approvedManager || approvedManager.managerId !== userId) {
        return res.status(403).json({ message: "You are no longer an approved HOA manager for this condominium" });
      }

      if (approvedManager.status === 'suspended') {
        return res.status(403).json({ message: "Your HOA manager assignment is currently suspended" });
      }

      const announcement = await storage.updateHoaAnnouncement(req.params.id, validationResult.data);

      await createAuditLog(
        req,
        "update",
        "hoa_announcement",
        req.params.id,
        `Updated announcement: ${announcement.title}`
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  // Publish announcement
  app.post("/api/hoa-manager/announcements/:id/publish", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingAnnouncement = await storage.getHoaAnnouncement(req.params.id);
      
      if (!existingAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      // Only the manager who created it can publish
      if (existingAnnouncement.managerId !== userId) {
        return res.status(403).json({ message: "Not authorized to publish this announcement" });
      }

      // Verify manager is still approved and not suspended
      const approvedManager = await storage.getApprovedHoaManagerByCondominium(existingAnnouncement.condominiumId);
      if (!approvedManager || approvedManager.managerId !== userId) {
        return res.status(403).json({ message: "You are no longer an approved HOA manager for this condominium" });
      }

      if (approvedManager.status === 'suspended') {
        return res.status(403).json({ message: "Your HOA manager assignment is currently suspended" });
      }

      const announcement = await storage.publishHoaAnnouncement(req.params.id);

      await createAuditLog(
        req,
        "update",
        "hoa_announcement",
        req.params.id,
        `Published announcement: ${announcement.title}`
      );

      res.json(announcement);
    } catch (error: any) {
      console.error("Error publishing announcement:", error);
      res.status(500).json({ message: "Failed to publish announcement" });
    }
  });

  // Delete announcement
  app.delete("/api/hoa-manager/announcements/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingAnnouncement = await storage.getHoaAnnouncement(req.params.id);
      
      if (!existingAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      // Only the manager who created it can delete
      if (existingAnnouncement.managerId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this announcement" });
      }

      // Verify manager is still approved and not suspended
      const approvedManager = await storage.getApprovedHoaManagerByCondominium(existingAnnouncement.condominiumId);
      if (!approvedManager || approvedManager.managerId !== userId) {
        return res.status(403).json({ message: "You are no longer an approved HOA manager for this condominium" });
      }

      if (approvedManager.status === 'suspended') {
        return res.status(403).json({ message: "Your HOA manager assignment is currently suspended" });
      }

      await storage.deleteHoaAnnouncement(req.params.id);

      await createAuditLog(
        req,
        "delete",
        "hoa_announcement",
        req.params.id,
        `Deleted announcement: ${existingAnnouncement.title}`
      );

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Mark announcement as read (owner only - must own unit in condominium)
  app.post("/api/hoa-manager/announcements/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get announcement to verify condominium
      const announcement = await storage.getHoaAnnouncement(req.params.id);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      // Verify user owns a unit in this condominium
      const units = await storage.getCondominiumUnitsByOwner(userId);
      const ownsUnitInCondo = units.some(u => u.condominiumId === announcement.condominiumId);

      if (!ownsUnitInCondo) {
        return res.status(403).json({ message: "Not authorized to mark this announcement as read" });
      }

      const read = await storage.markHoaAnnouncementAsRead(req.params.id, userId);
      res.json(read);
    } catch (error: any) {
      console.error("Error marking announcement as read:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  // Get announcement read status
  app.get("/api/hoa-manager/announcements/:id/reads", isAuthenticated, requireRole(["admin", "master", "hoa_manager"]), async (req, res) => {
    try {
      const reads = await storage.getHoaAnnouncementReads(req.params.id);
      res.json(reads);
    } catch (error: any) {
      console.error("Error fetching read status:", error);
      res.status(500).json({ message: "Failed to fetch read status" });
    }
  });

  // ========================================
  // Contact Import Routes (Admin Only)
  // ========================================

  // Parse CSV file and return parsed contacts with property matches
  app.post("/api/admin/contacts/parse-csv", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ message: "Datos CSV inválidos" });
      }

      const Papa = await import('papaparse');
      const { parseContactRow, isValidContact, normalizePhoneNumber } = await import('./utils/contactParser.js');

      // Parse CSV rows
      const parsedContacts = csvData.map((row: any) => parseContactRow(row));

      // Get all properties for matching
      const allProperties = await storage.getProperties({ includeInactive: true });

      // Match contacts with properties
      const contactsWithMatches = parsedContacts.map((contact: any) => {
        if (!contact.parseSuccess) {
          return {
            ...contact,
            matchedProperty: null,
            matchConfidence: 0,
          };
        }

        // Try to find matching property by condominium name + unit number
        const matches = allProperties.filter((prop: any) => {
          const condoNameMatch = prop.condoName?.toLowerCase().includes(contact.condominiumName.toLowerCase()) ||
                                contact.condominiumName.toLowerCase().includes(prop.condoName?.toLowerCase() || '');
          const unitMatch = prop.unitNumber?.toLowerCase() === contact.unitNumber.toLowerCase();
          
          return condoNameMatch && unitMatch;
        });

        let matchedProperty = null;
        let matchConfidence = 0;

        if (matches.length === 1) {
          matchedProperty = matches[0];
          matchConfidence = 100;
        } else if (matches.length > 1) {
          matchedProperty = matches[0];
          matchConfidence = 50; // Multiple matches, uncertain
        }

        return {
          ...contact,
          phoneNumber: contact.phoneNumber ? normalizePhoneNumber(contact.phoneNumber) : undefined,
          matchedProperty,
          matchConfidence,
        };
      });

      // Separate valid and invalid contacts
      const validContacts = contactsWithMatches.filter((c: any) => c.parseSuccess);
      const invalidContacts = contactsWithMatches.filter((c: any) => !c.parseSuccess);

      res.json({
        total: contactsWithMatches.length,
        valid: validContacts.length,
        invalid: invalidContacts.length,
        contacts: contactsWithMatches,
        summary: {
          autoMatched: validContacts.filter((c: any) => c.matchConfidence === 100).length,
          partialMatches: validContacts.filter((c: any) => c.matchConfidence > 0 && c.matchConfidence < 100).length,
          noMatches: validContacts.filter((c: any) => c.matchConfidence === 0).length,
        }
      });

      await createAuditLog(
        req,
        "create",
        "contact_import",
        "csv_parse",
        `Parsed ${contactsWithMatches.length} contacts from CSV`
      );

    } catch (error: any) {
      console.error("Error parsing CSV:", error);
      res.status(500).json({ message: error.message || "Error al procesar CSV" });
    }
  });

  // Batch update properties with owner contact data
  app.post("/api/admin/contacts/batch-update", isAuthenticated, requireRole(["master", "admin"]), async (req: any, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "Datos de actualización inválidos" });
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
      };

      for (const update of updates) {
        try {
          const { propertyId, ownerFirstName, ownerLastName, ownerPhone, ownerEmail, referredByName, referredByLastName, referredByPhone, referredByEmail } = update;

          if (!propertyId) {
            results.failed++;
            results.errors.push({ update, error: "Missing property ID" });
            continue;
          }

          await storage.updateProperty(propertyId, {
            ownerFirstName,
            ownerLastName,
            ownerPhone,
            ownerEmail: ownerEmail || null,
            referredByName: referredByName || null,
            referredByLastName: referredByLastName || null,
            referredByPhone: referredByPhone || null,
            referredByEmail: referredByEmail || null,
          });

          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({ update, error: error.message });
        }
      }

      await createAuditLog(
        req,
        "update",
        "contact_import",
        "batch_update",
        `Batch updated ${results.success} properties with owner contact data`
      );

      res.json(results);

    } catch (error: any) {
      console.error("Error batch updating contacts:", error);
      res.status(500).json({ message: error.message || "Error al actualizar contactos" });
    }
  });

  // =========================================
  // External Management System API Routes
  // =========================================

  // External agency role constants for consistent permissions
  // ADMIN_ONLY: Only master/admin can perform these operations (agency creation, deletion)
  const ADMIN_ONLY = ["master", "admin"];
  // EXTERNAL_ADMIN_ROLES: Admin operations within external agencies
  const EXTERNAL_ADMIN_ROLES = ["master", "admin", "external_agency_admin"];
  // EXTERNAL_ACCOUNTING_ROLES: Payment and accounting operations
  const EXTERNAL_ACCOUNTING_ROLES = ["master", "admin", "external_agency_admin", "external_agency_accounting"];
  // EXTERNAL_MAINTENANCE_ROLES: Property, contract, and maintenance operations
  const EXTERNAL_MAINTENANCE_ROLES = ["master", "admin", "external_agency_admin", "external_agency_maintenance"];
  // EXTERNAL_ALL_ROLES: Read-only access for all external agency users
  const EXTERNAL_ALL_ROLES = ["master", "admin", "external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff"];

  // External Agencies Routes
  app.get("/api/external-agencies", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { isActive } = req.query;
      const filters = isActive !== undefined ? { isActive: isActive === 'true' } : undefined;
      
      let agencies;
      if (req.user.role === "external_agency_admin") {
        // External agency admins can only see their own agency
        agencies = await storage.getExternalAgenciesByCreator(req.user.id);
      } else {
        // Master and admin can see all agencies
        agencies = await storage.getExternalAgencies(filters);
      }
      
      res.json(agencies);
    } catch (error: any) {
      console.error("Error fetching external agencies:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-agencies/:id", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const agency = await storage.getExternalAgency(id);
      
      if (!agency) {
        return res.status(404).json({ message: "Agency not found" });
      }
      
      res.json(agency);
    } catch (error: any) {
      console.error("Error fetching external agency:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-agencies", isAuthenticated, requireRole(ADMIN_ONLY), async (req: any, res) => {
    try {
      const validatedData = insertExternalAgencySchema.parse(req.body);
      
      // Admin can assign an agency to a specific user via createdBy field
      const assignedUserId = validatedData.createdBy || req.user.id;
      
      // Verify that the assigned user exists
      const assignedUser = await storage.getUserById(assignedUserId);
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned user not found" });
      }
      
      // Check if the assigned user already has an agency
      const existingAgencies = await storage.getExternalAgenciesByCreator(assignedUserId);
      if (existingAgencies && existingAgencies.length > 0) {
        return res.status(400).json({ message: "User already has an external agency" });
      }
      
      // Create agency first
      const agency = await storage.createExternalAgency({
        ...validatedData,
        createdBy: assignedUserId,
      });
      
      try {
        // Update assigned user's role to external_agency_admin
        await storage.updateUserRole(assignedUserId, "external_agency_admin");
      } catch (roleError) {
        // Rollback: Delete the agency if role update fails
        console.error("Role update failed, attempting rollback:", roleError);
        try {
          await storage.deleteExternalAgency(agency.id);
          console.log("Successfully rolled back agency creation");
        } catch (deleteError) {
          console.error("CRITICAL: Rollback failed - manual cleanup required for agency", agency.id, deleteError);
          // Agency exists but role was not assigned - admin must manually fix
        }
        throw new Error("Failed to assign user role. Please contact support if this persists.");
      }
      
      await createAuditLog(req, "create", "external_agency", agency.id, `Created external agency for user ${assignedUserId}`);
      res.status(201).json(agency);
    } catch (error: any) {
      console.error("Error creating external agency:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  // Self-registration endpoint for external agencies (available to all authenticated users)
  app.post("/api/external-agencies/register", isAuthenticated, async (req: any, res) => {
    try {
      // Check if user already has an agency
      const existingAgencies = await storage.getExternalAgenciesByCreator(req.user.id);
      if (existingAgencies && existingAgencies.length > 0) {
        return res.status(400).json({ message: "User already has an external agency" });
      }

      const validatedData = insertExternalAgencySchema.parse(req.body);
      const agency = await storage.createExternalAgency({
        ...validatedData,
        createdBy: req.user.id,
      });
      
      // Update user role to external_agency_admin
      await storage.updateUserRole(req.user.id, "external_agency_admin");
      
      await createAuditLog(req, "create", "external_agency", agency.id, "Self-registered external agency");
      res.status(201).json(agency);
    } catch (error: any) {
      console.error("Error registering external agency:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-agencies/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { createdBy: newCreatedBy, ...updateData } = req.body;
      
      // Get current agency to check if createdBy is changing
      const currentAgency = await storage.getExternalAgency(id);
      if (!currentAgency) {
        return res.status(404).json({ message: "Agency not found" });
      }
      
      // Handle user reassignment if createdBy is changing
      if (newCreatedBy && newCreatedBy !== currentAgency.createdBy) {
        // Verify new user exists and is approved
        const newUser = await storage.getUser(newCreatedBy);
        if (!newUser) {
          return res.status(404).json({ message: "New assigned user not found" });
        }
        if (newUser.status !== "approved") {
          return res.status(400).json({ message: "User must be approved" });
        }
        
        // Check if new user already has an agency
        const existingAgencies = await storage.getExternalAgenciesByCreator(newCreatedBy);
        if (existingAgencies && existingAgencies.length > 0) {
          return res.status(400).json({ message: "New user already has an external agency" });
        }
        
        // Update agency with new createdBy
        const agency = await storage.updateExternalAgency(id, {
          ...updateData,
          createdBy: newCreatedBy,
        });
        
        // Update new user's role to external_agency_admin
        await storage.updateUserRole(newCreatedBy, "external_agency_admin");
        
        await createAuditLog(req, "update", "external_agency", id, `Reassigned agency from user ${currentAgency.createdBy} to ${newCreatedBy}`);
        res.json(agency);
      } else {
        // No user reassignment, just update agency data
        const agency = await storage.updateExternalAgency(id, updateData);
        await createAuditLog(req, "update", "external_agency", id, "Updated external agency");
        res.json(agency);
      }
    } catch (error: any) {
      console.error("Error updating external agency:", error);
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-agencies/:id/toggle-active", isAuthenticated, requireRole(ADMIN_ONLY), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const agency = await storage.toggleExternalAgencyActive(id, isActive);
      
      await createAuditLog(req, "update", "external_agency", id, `${isActive ? 'Activated' : 'Deactivated'} external agency`);
      res.json(agency);
    } catch (error: any) {
      console.error("Error toggling external agency status:", error);
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-agencies/:id", isAuthenticated, requireRole(ADMIN_ONLY), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExternalAgency(id);
      
      await createAuditLog(req, "delete", "external_agency", id, "Deleted external agency");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external agency:", error);
      handleGenericError(error, res);
    }
  });

  // External Properties Routes
  app.get("/api/external-properties", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { agencyId, status } = req.query;
      
      if (!agencyId) {
        return res.status(400).json({ message: "Agency ID is required" });
      }
      
      const filters = status ? { status } : undefined;
      const properties = await storage.getExternalPropertiesByAgency(agencyId, filters);
      
      res.json(properties);
    } catch (error: any) {
      console.error("Error fetching external properties:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-properties/:id", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getExternalProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error: any) {
      console.error("Error fetching external property:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-properties", isAuthenticated, requireRole(EXTERNAL_MAINTENANCE_ROLES), async (req: any, res) => {
    try {
      const validatedData = insertExternalPropertySchema.parse(req.body);
      const property = await storage.createExternalProperty({
        ...validatedData,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "external_property", property.id, "Created external property");
      res.status(201).json(property);
    } catch (error: any) {
      console.error("Error creating external property:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-properties/:id", isAuthenticated, requireRole(EXTERNAL_MAINTENANCE_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const property = await storage.updateExternalProperty(id, req.body);
      
      await createAuditLog(req, "update", "external_property", id, "Updated external property");
      res.json(property);
    } catch (error: any) {
      console.error("Error updating external property:", error);
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-properties/:id/link", isAuthenticated, requireRole(ADMIN_ONLY), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { linkedPropertyId } = req.body;
      
      if (!linkedPropertyId) {
        return res.status(400).json({ message: "Linked property ID is required" });
      }
      
      const property = await storage.linkExternalProperty(id, linkedPropertyId);
      
      await createAuditLog(req, "update", "external_property", id, `Linked to property ${linkedPropertyId}`);
      res.json(property);
    } catch (error: any) {
      console.error("Error linking external property:", error);
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-properties/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExternalProperty(id);
      
      await createAuditLog(req, "delete", "external_property", id, "Deleted external property");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external property:", error);
      handleGenericError(error, res);
    }
  });

  // External Rental Contracts Routes
  app.get("/api/external-contracts", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { agencyId, propertyId, status } = req.query;
      
      if (propertyId) {
        const contracts = await storage.getExternalRentalContractsByProperty(propertyId);
        return res.json(contracts);
      }
      
      if (!agencyId) {
        return res.status(400).json({ message: "Agency ID or Property ID is required" });
      }
      
      const filters = status ? { status } : undefined;
      const contracts = await storage.getExternalRentalContractsByAgency(agencyId, filters);
      
      res.json(contracts);
    } catch (error: any) {
      console.error("Error fetching external contracts:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-contracts/:id", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const contract = await storage.getExternalRentalContract(id);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      res.json(contract);
    } catch (error: any) {
      console.error("Error fetching external contract:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-contracts", isAuthenticated, requireRole(EXTERNAL_MAINTENANCE_ROLES), async (req: any, res) => {
    try {
      const validatedData = insertExternalRentalContractSchema.parse(req.body);
      const contract = await storage.createExternalRentalContract({
        ...validatedData,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "external_contract", contract.id, "Created external rental contract");
      res.status(201).json(contract);
    } catch (error: any) {
      console.error("Error creating external contract:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-contracts/:id", isAuthenticated, requireRole(EXTERNAL_MAINTENANCE_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const contract = await storage.updateExternalRentalContract(id, req.body);
      
      await createAuditLog(req, "update", "external_contract", id, "Updated external rental contract");
      res.json(contract);
    } catch (error: any) {
      console.error("Error updating external contract:", error);
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-contracts/:id/status", isAuthenticated, requireRole(EXTERNAL_MAINTENANCE_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const contract = await storage.updateExternalContractStatus(id, status);
      
      await createAuditLog(req, "update", "external_contract", id, `Changed contract status to ${status}`);
      res.json(contract);
    } catch (error: any) {
      console.error("Error updating external contract status:", error);
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-contracts/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExternalRentalContract(id);
      
      await createAuditLog(req, "delete", "external_contract", id, "Deleted external rental contract");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external contract:", error);
      handleGenericError(error, res);
    }
  });

  // External Agency Users Routes
  app.get("/api/external-agency-users", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      // Get all users with external agency roles
      // TODO: Add externalAgencyId field to users table to properly filter by agency
      const externalRoles = ["external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff"];
      const externalUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          role: users.role,
          status: users.status,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(inArray(users.role, externalRoles))
        .orderBy(users.createdAt);

      res.json(externalUsers);
    } catch (error: any) {
      console.error("Error fetching external agency users:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-agency-users", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      // Zod validation schema for create user request
      const createUserSchema = z.object({
        email: z.string().email("Invalid email"),
        firstName: z.string().min(1, "First name required"),
        lastName: z.string().min(1, "Last name required"),
        phone: z.string().optional(),
        role: z.enum(["external_agency_admin", "external_agency_accounting", "external_agency_maintenance", "external_agency_staff"]),
      });

      const validatedData = createUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Generate temporary password
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Create user
      const user = await storage.createUserWithPassword({
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone || null,
        role: validatedData.role,
        status: "approved",
        assignedToUser: agencyId, // Link user to agency via assignedToUser field
      });

      await createAuditLog(req, "create", "user", user.id, `Created external agency user with role ${validatedData.role}`);

      // Return user and temp password (in real app, would send via email)
      res.status(201).json({ user, tempPassword });
    } catch (error: any) {
      console.error("Error creating external agency user:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-agency-users/:id/reset-password", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      // Verify user belongs to this agency
      const user = await storage.getUser(id);
      if (!user || user.assignedToUser !== agencyId) {
        return res.status(403).json({ message: "Unauthorized to reset password for this user" });
      }

      // Generate new temporary password
      const tempPassword = crypto.randomBytes(8).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Update password directly in database
      await db.update(users).set({ 
        passwordHash,
        updatedAt: new Date()
      }).where(eq(users.id, id));

      await createAuditLog(req, "update", "user", id, "Reset password for external agency user");

      res.json({ tempPassword });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-agency-users/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      // Verify user belongs to this agency
      const user = await storage.getUser(id);
      if (!user || user.assignedToUser !== agencyId) {
        return res.status(403).json({ message: "Unauthorized to delete this user" });
      }

      await storage.deleteUser(id);
      await createAuditLog(req, "delete", "user", id, "Deleted external agency user");

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external agency user:", error);
      handleGenericError(error, res);
    }
  });

  // External All Access Controls Routes (Consolidated view)
  // Send access control by email
  app.post("/api/external-access-controls/send-email", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      const sendEmailSchema = z.object({
        accessId: z.string().uuid(),
        userId: z.string().uuid(),
      });

      const { accessId, userId } = sendEmailSchema.parse(req.body);

      // Get access control and verify ownership
      const [accessControl] = await db
        .select({
          id: externalUnitAccessControls.id,
          accessType: externalUnitAccessControls.accessType,
          accessCode: externalUnitAccessControls.accessCode,
          description: externalUnitAccessControls.description,
          unitId: externalUnitAccessControls.unitId,
          unitNumber: externalUnits.unitNumber,
          condominiumId: externalUnits.condominiumId,
        })
        .from(externalUnitAccessControls)
        .innerJoin(externalUnits, eq(externalUnitAccessControls.unitId, externalUnits.id))
        .where(eq(externalUnitAccessControls.id, accessId))
        .limit(1);

      if (!accessControl) {
        return res.status(404).json({ message: "Access control not found" });
      }

      // Verify unit belongs to agency's condominium
      const [condo] = await db
        .select()
        .from(externalCondominiums)
        .where(eq(externalCondominiums.id, accessControl.condominiumId))
        .limit(1);

      if (!condo || condo.agencyId !== agencyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get recipient user and verify they belong to the same agency
      const [recipient] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!recipient || recipient.assignedToUser !== agencyId) {
        return res.status(404).json({ message: "Recipient user not found or not in your agency" });
      }

      // Send email using Resend
      const { sendAccessCodeEmail } = await import('./resend-service');
      
      await sendAccessCodeEmail(
        recipient.email,
        `${recipient.firstName} ${recipient.lastName}`,
        {
          condominiumName: condo.name,
          unitNumber: accessControl.unitNumber,
          accessType: accessControl.accessType,
          accessCode: accessControl.accessCode || '',
          description: accessControl.description || undefined,
        }
      );

      await createAuditLog(
        req,
        "email",
        "access_control",
        accessControl.id,
        `Sent access code to ${recipient.email}`
      );

      res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Error sending access control email:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-all-access-controls", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      // Get all units for this agency
      const units = await storage.getExternalUnitsByAgency(agencyId);
      const unitIds = units.map(u => u.id);

      if (unitIds.length === 0) {
        return res.json([]);
      }

      // Get all access controls for these units
      const accessControls = await db
        .select({
          id: externalUnitAccessControls.id,
          unitId: externalUnitAccessControls.unitId,
          accessType: externalUnitAccessControls.accessType,
          accessCode: externalUnitAccessControls.accessCode,
          description: externalUnitAccessControls.description,
          isActive: externalUnitAccessControls.isActive,
          canShareWithMaintenance: externalUnitAccessControls.canShareWithMaintenance,
          createdAt: externalUnitAccessControls.createdAt,
          updatedAt: externalUnitAccessControls.updatedAt,
          unitNumber: externalUnits.unitNumber,
          condominiumId: externalUnits.condominiumId,
        })
        .from(externalUnitAccessControls)
        .innerJoin(externalUnits, eq(externalUnitAccessControls.unitId, externalUnits.id))
        .where(
          and(
            inArray(externalUnitAccessControls.unitId, unitIds),
            eq(externalUnitAccessControls.isActive, true)
          )
        )
        .orderBy(externalUnits.unitNumber);

      // Get condominium names
      const condoIds = [...new Set(accessControls.map(ac => ac.condominiumId))];
      const condominiums = await db
        .select()
        .from(externalCondominiums)
        .where(inArray(externalCondominiums.id, condoIds));

      const condoMap = Object.fromEntries(condominiums.map(c => [c.id, c.name]));

      // Add condominium names to results
      const enrichedAccessControls = accessControls.map(ac => ({
        ...ac,
        condominiumName: condoMap[ac.condominiumId] || 'Unknown',
      }));

      res.json(enrichedAccessControls);
    } catch (error: any) {
      console.error("Error fetching all access controls:", error);
      handleGenericError(error, res);
    }
  });

  // External Payment Schedules Routes
  app.get("/api/external-payment-schedules", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { agencyId, contractId, isActive } = req.query;
      
      if (contractId) {
        const schedules = await storage.getExternalPaymentSchedulesByContract(contractId);
        return res.json(schedules);
      }
      
      if (!agencyId) {
        return res.status(400).json({ message: "Agency ID or Contract ID is required" });
      }
      
      const filters = isActive !== undefined ? { isActive: isActive === 'true' } : undefined;
      const schedules = await storage.getExternalPaymentSchedulesByAgency(agencyId, filters);
      
      res.json(schedules);
    } catch (error: any) {
      console.error("Error fetching external payment schedules:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-payment-schedules", isAuthenticated, requireRole(EXTERNAL_ACCOUNTING_ROLES), async (req: any, res) => {
    try {
      const validatedData = insertExternalPaymentScheduleSchema.parse(req.body);
      const schedule = await storage.createExternalPaymentSchedule({
        ...validatedData,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "external_payment_schedule", schedule.id, "Created external payment schedule");
      res.status(201).json(schedule);
    } catch (error: any) {
      console.error("Error creating external payment schedule:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-payment-schedules/:id", isAuthenticated, requireRole(EXTERNAL_ACCOUNTING_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const schedule = await storage.updateExternalPaymentSchedule(id, req.body);
      
      await createAuditLog(req, "update", "external_payment_schedule", id, "Updated external payment schedule");
      res.json(schedule);
    } catch (error: any) {
      console.error("Error updating external payment schedule:", error);
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-payment-schedules/:id/toggle-active", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const schedule = await storage.toggleExternalPaymentScheduleActive(id, isActive);
      
      await createAuditLog(req, "update", "external_payment_schedule", id, `${isActive ? 'Activated' : 'Deactivated'} payment schedule`);
      res.json(schedule);
    } catch (error: any) {
      console.error("Error toggling payment schedule status:", error);
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-payment-schedules/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExternalPaymentSchedule(id);
      
      await createAuditLog(req, "delete", "external_payment_schedule", id, "Deleted external payment schedule");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external payment schedule:", error);
      handleGenericError(error, res);
    }
  });

  // External Payments Routes
  app.get("/api/external-payments", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { contractId, status, serviceType, upcomingDays } = req.query;
      
      if (contractId) {
        const filters = status ? { status } : undefined;
        const payments = await storage.getExternalPaymentsByContract(contractId, filters);
        return res.json(payments);
      }
      
      // Get agency ID from authenticated user (admin/master can pass agencyId to view other agencies)
      let agencyId = req.query.agencyId;
      if (!agencyId) {
        agencyId = await getUserAgencyId(req);
        if (!agencyId) {
          return res.status(400).json({ message: "User is not assigned to any agency" });
        }
      }
      
      if (upcomingDays) {
        const payments = await storage.getUpcomingExternalPayments(agencyId, parseInt(upcomingDays));
        return res.json(payments);
      }
      
      const filters: any = {};
      if (status) filters.status = status;
      if (serviceType) filters.serviceType = serviceType;
      
      const payments = await storage.getExternalPaymentsByAgency(agencyId, filters);
      
      res.json(payments);
    } catch (error: any) {
      console.error("Error fetching external payments:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-payments/:id", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getExternalPayment(id);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error: any) {
      console.error("Error fetching external payment:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-payments", isAuthenticated, requireRole(EXTERNAL_ACCOUNTING_ROLES), async (req: any, res) => {
    try {
      const validatedData = insertExternalPaymentSchema.parse(req.body);
      const payment = await storage.createExternalPayment({
        ...validatedData,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "external_payment", payment.id, "Created external payment");
      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Error creating external payment:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-payments/:id", isAuthenticated, requireRole(EXTERNAL_ACCOUNTING_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.updateExternalPayment(id, req.body);
      
      await createAuditLog(req, "update", "external_payment", id, "Updated external payment");
      res.json(payment);
    } catch (error: any) {
      console.error("Error updating external payment:", error);
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-payments/:id/status", isAuthenticated, requireRole(EXTERNAL_ACCOUNTING_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, paidDate } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const payment = await storage.updateExternalPaymentStatus(id, status, paidDate ? new Date(paidDate) : undefined);
      
      await createAuditLog(req, "update", "external_payment", id, `Changed payment status to ${status}`);
      res.json(payment);
    } catch (error: any) {
      console.error("Error updating external payment status:", error);
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-payments/:id/reminder-sent", isAuthenticated, requireRole(EXTERNAL_ACCOUNTING_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.markExternalPaymentReminderSent(id);
      
      await createAuditLog(req, "update", "external_payment", id, "Marked payment reminder as sent");
      res.json(payment);
    } catch (error: any) {
      console.error("Error marking payment reminder sent:", error);
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-payments/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExternalPayment(id);
      
      await createAuditLog(req, "delete", "external_payment", id, "Deleted external payment");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external payment:", error);
      handleGenericError(error, res);
    }
  });

  // External Maintenance Tickets Routes
  app.get("/api/external-tickets", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { propertyId, assignedTo, status, priority } = req.query;
      
      if (propertyId) {
        const tickets = await storage.getExternalMaintenanceTicketsByProperty(propertyId);
        return res.json(tickets);
      }
      
      if (assignedTo) {
        const tickets = await storage.getExternalMaintenanceTicketsByAssignee(assignedTo);
        return res.json(tickets);
      }
      
      // Get agency ID from authenticated user (admin/master can pass agencyId to view other agencies)
      let agencyId = req.query.agencyId;
      if (!agencyId) {
        agencyId = await getUserAgencyId(req);
        if (!agencyId) {
          return res.status(400).json({ message: "User is not assigned to any agency" });
        }
      }
      
      const filters: any = {};
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      
      const tickets = await storage.getExternalMaintenanceTicketsByAgency(agencyId, filters);
      
      res.json(tickets);
    } catch (error: any) {
      console.error("Error fetching external tickets:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-tickets/:id", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const ticket = await storage.getExternalMaintenanceTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error: any) {
      console.error("Error fetching external ticket:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-tickets", isAuthenticated, requireRole(EXTERNAL_MAINTENANCE_ROLES), async (req: any, res) => {
    try {
      const validatedData = insertExternalMaintenanceTicketSchema.parse(req.body);
      const ticket = await storage.createExternalMaintenanceTicket({
        ...validatedData,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "external_ticket", ticket.id, "Created external maintenance ticket");
      res.status(201).json(ticket);
    } catch (error: any) {
      console.error("Error creating external ticket:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-tickets/:id", isAuthenticated, requireRole(EXTERNAL_MAINTENANCE_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const ticket = await storage.updateExternalMaintenanceTicket(id, req.body);
      
      await createAuditLog(req, "update", "external_ticket", id, "Updated external maintenance ticket");
      res.json(ticket);
    } catch (error: any) {
      console.error("Error updating external ticket:", error);
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-tickets/:id/status", isAuthenticated, requireRole(EXTERNAL_MAINTENANCE_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, resolvedDate } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const ticket = await storage.updateExternalTicketStatus(id, status, resolvedDate ? new Date(resolvedDate) : undefined);
      
      await createAuditLog(req, "update", "external_ticket", id, `Changed ticket status to ${status}`);
      res.json(ticket);
    } catch (error: any) {
      console.error("Error updating external ticket status:", error);
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-tickets/:id/assign", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      
      if (!assignedTo) {
        return res.status(400).json({ message: "Assigned To user ID is required" });
      }
      
      const ticket = await storage.assignExternalTicket(id, assignedTo);
      
      await createAuditLog(req, "update", "external_ticket", id, `Assigned ticket to user ${assignedTo}`);
      res.json(ticket);
    } catch (error: any) {
      console.error("Error assigning external ticket:", error);
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-tickets/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExternalMaintenanceTicket(id);
      
      await createAuditLog(req, "delete", "external_ticket", id, "Deleted external maintenance ticket");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external ticket:", error);
      handleGenericError(error, res);
    }
  });

  // External Condominiums Routes
  app.get("/api/external-condominiums", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { isActive } = req.query;
      
      // Get agency ID from authenticated user (admin/master can pass agencyId to view other agencies)
      let agencyId = req.query.agencyId;
      if (!agencyId) {
        agencyId = await getUserAgencyId(req);
        if (!agencyId) {
          return res.status(400).json({ message: "User is not assigned to any agency" });
        }
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, agencyId);
      if (!hasAccess) return; // Response already sent by helper
      
      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const condominiums = await storage.getExternalCondominiumsByAgency(agencyId, filters);
      
      res.json(condominiums);
    } catch (error: any) {
      console.error("Error fetching external condominiums:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-condominiums/:id", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const condominium = await storage.getExternalCondominium(id);
      
      if (!condominium) {
        return res.status(404).json({ message: "Condominium not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, condominium.agencyId);
      if (!hasAccess) return; // Response already sent by helper
      
      res.json(condominium);
    } catch (error: any) {
      console.error("Error fetching external condominium:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-condominiums", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      // Get agency ID from authenticated user
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "User is not assigned to any agency" });
      }
      
      const validatedData = insertExternalCondominiumSchema.parse(req.body);
      const condominium = await storage.createExternalCondominium({
        ...validatedData,
        agencyId,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "external_condominium", condominium.id, "Created external condominium");
      res.status(201).json(condominium);
    } catch (error: any) {
      console.error("Error creating external condominium:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-condominiums/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verify condominium exists
      const existing = await storage.getExternalCondominium(id);
      if (!existing) {
        return res.status(404).json({ message: "Condominium not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, existing.agencyId);
      if (!hasAccess) return; // Response already sent by helper
      
      // Validate update data
      const validatedData = updateExternalCondominiumSchema.parse(req.body);
      
      // Prevent agencyId modification
      const updateData = { ...validatedData };
      delete (updateData as any).agencyId;
      delete (updateData as any).createdBy;
      
      const condominium = await storage.updateExternalCondominium(id, updateData);
      
      await createAuditLog(req, "update", "external_condominium", id, "Updated external condominium");
      res.json(condominium);
    } catch (error: any) {
      console.error("Error updating external condominium:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-condominiums/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getExternalCondominium(id);
      
      if (!existing) {
        return res.status(404).json({ message: "Condominium not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, existing.agencyId);
      if (!hasAccess) return; // Response already sent by helper
      
      // Check if condominium has any units
      const units = await storage.getExternalUnitsByCondominium(id);
      if (units && units.length > 0) {
        return res.status(400).json({ 
          message: `Cannot delete condominium with ${units.length} registered units. Please delete all units first.`
        });
      }
      
      await storage.deleteExternalCondominium(id);
      
      await createAuditLog(req, "delete", "external_condominium", id, "Deleted external condominium");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external condominium:", error);
      handleGenericError(error, res);
    }
  });

  // External Units Routes
  app.get("/api/external-units", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { condominiumId, isActive } = req.query;
      
      // Get agency ID from authenticated user (admin/master can pass agencyId to view other agencies)
      let agencyId = req.query.agencyId;
      if (!agencyId) {
        agencyId = await getUserAgencyId(req);
        if (!agencyId) {
          return res.status(400).json({ message: "User is not assigned to any agency" });
        }
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, agencyId);
      if (!hasAccess) return;
      
      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (condominiumId) filters.condominiumId = condominiumId;
      
      const units = await storage.getExternalUnitsByAgency(agencyId, filters);
      
      res.json(units);
    } catch (error: any) {
      console.error("Error fetching external units:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-units/by-condominium/:condominiumId", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { condominiumId } = req.params;
      
      // Verify condominium exists and get its agency
      const condominium = await storage.getExternalCondominium(condominiumId);
      if (!condominium) {
        return res.status(404).json({ message: "Condominium not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, condominium.agencyId);
      if (!hasAccess) return;
      
      const units = await storage.getExternalUnitsByCondominium(condominiumId);
      
      res.json(units);
    } catch (error: any) {
      console.error("Error fetching units by condominium:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-units/:id", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const unit = await storage.getExternalUnit(id);
      
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      res.json(unit);
    } catch (error: any) {
      console.error("Error fetching external unit:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-units", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const validatedData = insertExternalUnitSchema.parse(req.body);
      
      // Get agency ID from the condominium
      const condominium = await storage.getExternalCondominium(validatedData.condominiumId);
      if (!condominium) {
        return res.status(404).json({ message: "Condominium not found" });
      }
      
      // Verify user has access to this agency
      const hasAccess = await verifyExternalAgencyOwnership(req, res, condominium.agencyId);
      if (!hasAccess) return;
      
      const unit = await storage.createExternalUnit({
        ...validatedData,
        agencyId: condominium.agencyId,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "external_unit", unit.id, "Created external unit");
      res.status(201).json(unit);
    } catch (error: any) {
      console.error("Error creating external unit:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-units/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verify unit exists
      const existing = await storage.getExternalUnit(id);
      if (!existing) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, existing.agencyId);
      if (!hasAccess) return;
      
      // Validate update data
      const validatedData = updateExternalUnitSchema.parse(req.body);
      
      // Prevent agencyId modification
      const updateData = { ...validatedData };
      delete (updateData as any).agencyId;
      delete (updateData as any).createdBy;
      
      const unit = await storage.updateExternalUnit(id, updateData);
      
      await createAuditLog(req, "update", "external_unit", id, "Updated external unit");
      res.json(unit);
    } catch (error: any) {
      console.error("Error updating external unit:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-units/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getExternalUnit(id);
      
      if (!existing) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, existing.agencyId);
      if (!hasAccess) return;
      
      await storage.deleteExternalUnit(id);
      
      await createAuditLog(req, "delete", "external_unit", id, "Deleted external unit");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external unit:", error);
      handleGenericError(error, res);
    }
  });

  // External Unit Owners Routes
  app.get("/api/external-unit-owners/by-unit/:unitId", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { unitId } = req.params;
      
      // Verify unit exists and get its agency
      const unit = await storage.getExternalUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      const owners = await storage.getExternalUnitOwnersByUnit(unitId);
      
      res.json(owners);
    } catch (error: any) {
      console.error("Error fetching unit owners:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-unit-owners/active/:unitId", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { unitId } = req.params;
      
      // Verify unit exists and get its agency
      const unit = await storage.getExternalUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      const owner = await storage.getActiveExternalUnitOwner(unitId);
      
      if (!owner) {
        return res.status(404).json({ message: "No active owner found for this unit" });
      }
      
      res.json(owner);
    } catch (error: any) {
      console.error("Error fetching active unit owner:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-unit-owners/:id", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const owner = await storage.getExternalUnitOwner(id);
      
      if (!owner) {
        return res.status(404).json({ message: "Unit owner not found" });
      }
      
      // Verify unit ownership through unit
      const unit = await storage.getExternalUnit(owner.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Associated unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      res.json(owner);
    } catch (error: any) {
      console.error("Error fetching external unit owner:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-unit-owners", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const validatedData = insertExternalUnitOwnerSchema.parse(req.body);
      const owner = await storage.createExternalUnitOwner({
        ...validatedData,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "external_unit_owner", owner.id, "Created external unit owner");
      res.status(201).json(owner);
    } catch (error: any) {
      console.error("Error creating external unit owner:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-unit-owners/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verify owner exists
      const existing = await storage.getExternalUnitOwner(id);
      if (!existing) {
        return res.status(404).json({ message: "Unit owner not found" });
      }
      
      // Verify unit ownership through unit
      const unit = await storage.getExternalUnit(existing.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Associated unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      // Validate update data
      const validatedData = updateExternalUnitOwnerSchema.parse(req.body);
      
      // Prevent unitId and createdBy modification
      const updateData = { ...validatedData };
      delete (updateData as any).unitId;
      delete (updateData as any).createdBy;
      
      const owner = await storage.updateExternalUnitOwner(id, updateData);
      
      await createAuditLog(req, "update", "external_unit_owner", id, "Updated external unit owner");
      res.json(owner);
    } catch (error: any) {
      console.error("Error updating external unit owner:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-unit-owners/:unitId/set-active/:ownerId", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { unitId, ownerId } = req.params;
      
      // Verify unit exists and get its agency
      const unit = await storage.getExternalUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      const owner = await storage.setActiveExternalUnitOwner(unitId, ownerId);
      
      await createAuditLog(req, "update", "external_unit_owner", ownerId, `Set as active owner for unit ${unitId}`);
      res.json(owner);
    } catch (error: any) {
      console.error("Error setting active unit owner:", error);
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-unit-owners/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getExternalUnitOwner(id);
      
      if (!existing) {
        return res.status(404).json({ message: "Unit owner not found" });
      }
      
      // Verify unit ownership through unit
      const unit = await storage.getExternalUnit(existing.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Associated unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      await storage.deleteExternalUnitOwner(id);
      
      await createAuditLog(req, "delete", "external_unit_owner", id, "Deleted external unit owner");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external unit owner:", error);
      handleGenericError(error, res);
    }
  });

  // External Unit Access Controls Routes
  app.get("/api/external-unit-access-controls/by-unit/:unitId", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { unitId } = req.params;
      const { isActive } = req.query;
      
      // Verify unit exists and get its agency
      const unit = await storage.getExternalUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const controls = await storage.getExternalUnitAccessControlsByUnit(unitId, filters);
      
      res.json(controls);
    } catch (error: any) {
      console.error("Error fetching unit access controls:", error);
      handleGenericError(error, res);
    }
  });

  app.get("/api/external-unit-access-controls/:id", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const control = await storage.getExternalUnitAccessControl(id);
      
      if (!control) {
        return res.status(404).json({ message: "Access control not found" });
      }
      
      // Verify unit ownership through unit
      const unit = await storage.getExternalUnit(control.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Associated unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      res.json(control);
    } catch (error: any) {
      console.error("Error fetching external unit access control:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-unit-access-controls", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const validatedData = insertExternalUnitAccessControlSchema.parse(req.body);
      const control = await storage.createExternalUnitAccessControl({
        ...validatedData,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "external_unit_access_control", control.id, "Created external unit access control");
      res.status(201).json(control);
    } catch (error: any) {
      console.error("Error creating external unit access control:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-unit-access-controls/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verify access control exists
      const existing = await storage.getExternalUnitAccessControl(id);
      if (!existing) {
        return res.status(404).json({ message: "Access control not found" });
      }
      
      // Verify unit ownership through unit
      const unit = await storage.getExternalUnit(existing.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Associated unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      // Validate update data
      const validatedData = updateExternalUnitAccessControlSchema.parse(req.body);
      
      // Prevent unitId and createdBy modification
      const updateData = { ...validatedData };
      delete (updateData as any).unitId;
      delete (updateData as any).createdBy;
      
      const control = await storage.updateExternalUnitAccessControl(id, updateData);
      
      await createAuditLog(req, "update", "external_unit_access_control", id, "Updated external unit access control");
      res.json(control);
    } catch (error: any) {
      console.error("Error updating external unit access control:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-unit-access-controls/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getExternalUnitAccessControl(id);
      
      if (!existing) {
        return res.status(404).json({ message: "Access control not found" });
      }
      
      // Verify unit ownership through unit
      const unit = await storage.getExternalUnit(existing.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Associated unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      await storage.deleteExternalUnitAccessControl(id);
      
      await createAuditLog(req, "delete", "external_unit_access_control", id, "Deleted external unit access control");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting external unit access control:", error);
      handleGenericError(error, res);
    }
  });

  // External Rental Contracts Routes
  app.get("/api/external-rental-contracts/by-unit/:unitId", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const { unitId } = req.params;
      
      // Verify unit exists and get its agency
      const unit = await storage.getExternalUnit(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      const contracts = await storage.getExternalRentalContractsByProperty(unitId);
      
      res.json(contracts);
    } catch (error: any) {
      console.error("Error fetching rental contracts:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external-rental-contracts", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const validatedData = insertExternalRentalContractSchema.parse(req.body);
      
      // Verify unit exists and get its agency
      const unit = await storage.getExternalUnit(validatedData.unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, unit.agencyId);
      if (!hasAccess) return;
      
      const contract = await storage.createExternalRentalContract({
        ...validatedData,
        agencyId: unit.agencyId,
        createdBy: req.user.id,
      });
      
      await createAuditLog(req, "create", "external_rental_contract", contract.id, "Created external rental contract");
      res.status(201).json(contract);
    } catch (error: any) {
      console.error("Error creating rental contract:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.patch("/api/external-rental-contracts/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verify contract exists
      const existing = await storage.getExternalRentalContract(id);
      if (!existing) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, existing.agencyId);
      if (!hasAccess) return;
      
      const validatedData = updateExternalRentalContractSchema.parse(req.body);
      
      // Prevent agencyId modification
      const updateData = { ...validatedData };
      delete (updateData as any).agencyId;
      delete (updateData as any).createdBy;
      
      const contract = await storage.updateExternalRentalContract(id, updateData);
      
      await createAuditLog(req, "update", "external_rental_contract", id, "Updated external rental contract");
      res.json(contract);
    } catch (error: any) {
      console.error("Error updating rental contract:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  app.delete("/api/external-rental-contracts/:id", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getExternalRentalContract(id);
      
      if (!existing) {
        return res.status(404).json({ message: "Contract not found" });
      }
      
      // Verify ownership
      const hasAccess = await verifyExternalAgencyOwnership(req, res, existing.agencyId);
      if (!hasAccess) return;
      
      await storage.deleteExternalRentalContract(id);
      
      await createAuditLog(req, "delete", "external_rental_contract", id, "Deleted external rental contract");
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting rental contract:", error);
      handleGenericError(error, res);
    }
  });

  // External Agency - Owners Routes
  app.get("/api/external/owners", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      // Get all units for this agency
      const units = await db.query.externalUnits.findMany({
        where: eq(externalUnits.agencyId, agencyId),
        with: {
          condominium: true,
        },
      });

      // Get all owners for these units
      const owners = await db.query.externalUnitOwners.findMany({
        where: inArray(
          externalUnitOwners.unitId,
          units.map((u) => u.id)
        ),
      });

      // Combine owners with unit info
      const ownersWithUnits = owners.map((owner) => {
        const unit = units.find((u) => u.id === owner.unitId);
        return {
          ...owner,
          unit: unit
            ? {
                id: unit.id,
                unitNumber: unit.unitNumber,
                condominium: {
                  id: unit.condominium.id,
                  name: unit.condominium.name,
                },
              }
            : undefined,
        };
      });

      res.json(ownersWithUnits);
    } catch (error: any) {
      console.error("Error fetching owners:", error);
      handleGenericError(error, res);
    }
  });

  // External Agency - Owner Charges Routes
  app.get("/api/external/owner-charges", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      const charges = await db.query.externalOwnerCharges.findMany({
        where: eq(externalOwnerCharges.agencyId, agencyId),
        orderBy: desc(externalOwnerCharges.createdAt),
      });

      res.json(charges);
    } catch (error: any) {
      console.error("Error fetching charges:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external/owner-charges", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      const chargeData = insertExternalOwnerChargeSchema.parse(req.body);

      // SECURITY: Verify owner and unit belong to the user's agency
      const [owner] = await db
        .select({ unitId: externalUnitOwners.unitId })
        .from(externalUnitOwners)
        .where(eq(externalUnitOwners.id, chargeData.ownerId))
        .limit(1);

      if (!owner) {
        return res.status(404).json({ message: "Owner not found" });
      }

      // Verify unit belongs to user's agency
      const [unit] = await db
        .select({ agencyId: externalUnits.agencyId })
        .from(externalUnits)
        .where(eq(externalUnits.id, chargeData.unitId))
        .limit(1);

      if (!unit || unit.agencyId !== agencyId) {
        return res.status(403).json({ message: "Forbidden: Cannot create charges for other agencies" });
      }

      const [charge] = await db
        .insert(externalOwnerCharges)
        .values({
          ...chargeData,
          agencyId,
          createdBy: req.user?.id || req.session?.adminUser?.id,
        })
        .returning();

      await createAuditLog(req, "create", "external_owner_charge", charge.id, "Created owner charge");
      res.json(charge);
    } catch (error: any) {
      console.error("Error creating charge:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
    }
  });

  // External Agency - Owner Notifications Routes
  app.get("/api/external/owner-notifications", isAuthenticated, requireRole(EXTERNAL_ALL_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      const notifications = await db.query.externalOwnerNotifications.findMany({
        where: eq(externalOwnerNotifications.agencyId, agencyId),
        orderBy: desc(externalOwnerNotifications.createdAt),
      });

      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      handleGenericError(error, res);
    }
  });

  app.post("/api/external/owner-notifications", isAuthenticated, requireRole(EXTERNAL_ADMIN_ROLES), async (req: any, res) => {
    try {
      const agencyId = await getUserAgencyId(req);
      if (!agencyId) {
        return res.status(400).json({ message: "No agency assigned to user" });
      }

      const notificationData = insertExternalOwnerNotificationSchema.parse(req.body);

      // If no specific owner but condominium is specified, send to all owners in that condominium
      if (!notificationData.ownerId && notificationData.condominiumId) {
        // SECURITY: Verify condominium belongs to user's agency
        const [condo] = await db
          .select({ agencyId: externalCondominiums.agencyId })
          .from(externalCondominiums)
          .where(eq(externalCondominiums.id, notificationData.condominiumId))
          .limit(1);

        if (!condo || condo.agencyId !== agencyId) {
          return res.status(403).json({ message: "Forbidden: Cannot send notifications for other agencies" });
        }

        const units = await db.query.externalUnits.findMany({
          where: and(
            eq(externalUnits.agencyId, agencyId),
            eq(externalUnits.condominiumId, notificationData.condominiumId)
          ),
        });

        const owners = await db.query.externalUnitOwners.findMany({
          where: inArray(
            externalUnitOwners.unitId,
            units.map((u) => u.id)
          ),
        });

        // Create notification for each owner
        const notifications = await Promise.all(
          owners.map((owner) =>
            db
              .insert(externalOwnerNotifications)
              .values({
                ...notificationData,
                agencyId,
                ownerId: owner.id,
                unitId: owner.unitId,
                createdBy: req.user?.id || req.session?.adminUser?.id,
              })
              .returning()
          )
        );

        await createAuditLog(
          req,
          "create",
          "external_owner_notification",
          "bulk",
          `Created ${notifications.length} notifications`
        );

        return res.json({ count: notifications.length, notifications: notifications.flat() });
      }

      // Single notification
      // SECURITY: Verify owner/unit belong to user's agency if specified
      if (notificationData.ownerId) {
        const [owner] = await db
          .select({ unitId: externalUnitOwners.unitId })
          .from(externalUnitOwners)
          .where(eq(externalUnitOwners.id, notificationData.ownerId))
          .limit(1);

        if (!owner) {
          return res.status(404).json({ message: "Owner not found" });
        }

        // Verify owner's unit belongs to user's agency
        const [unit] = await db
          .select({ agencyId: externalUnits.agencyId })
          .from(externalUnits)
          .where(eq(externalUnits.id, owner.unitId))
          .limit(1);

        if (!unit || unit.agencyId !== agencyId) {
          return res.status(403).json({ message: "Forbidden: Cannot send notifications for other agencies" });
        }
      }

      const [notification] = await db
        .insert(externalOwnerNotifications)
        .values({
          ...notificationData,
          agencyId,
          createdBy: req.user?.id || req.session?.adminUser?.id,
        })
        .returning();

      await createAuditLog(req, "create", "external_owner_notification", notification.id, "Created owner notification");
      res.json(notification);
    } catch (error: any) {
      console.error("Error creating notification:", error);
      if (error.name === "ZodError") {
        return handleZodError(error, res);
      }
      handleGenericError(error, res);
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
