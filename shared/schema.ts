import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
  decimal,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Enums
export const userRoleEnum = pgEnum("user_role", [
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
]);

export const userStatusEnum = pgEnum("user_status", [
  "pending",
  "approved",
  "rejected",
  "inactive",
]);

export const propertyStatusEnum = pgEnum("property_status", [
  "rent",
  "sale",
  "both",
]);

export const appointmentTypeEnum = pgEnum("appointment_type", [
  "in-person",
  "video",
]);

export const appointmentModeEnum = pgEnum("appointment_mode", [
  "individual", // Cita individual de 1 hora
  "tour", // Tour de propiedades de 30 min cada una
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const rescheduleStatusEnum = pgEnum("reschedule_status", [
  "none", // No hay solicitud de reprogramación
  "requested", // El owner solicitó reprogramación
  "approved", // El cliente aprobó la reprogramación
  "rejected", // El cliente rechazó la reprogramación (cita se cancela)
]);

export const visitTypeEnum = pgEnum("visit_type", [
  "visita_cliente",
  "visita_mantenimiento",
  "visita_limpieza",
  "visita_reconocimiento",
  "material_multimedia",
  "visita_inspeccion",
  "otra",
]);

export const offerStatusEnum = pgEnum("offer_status", [
  "pending",
  "accepted",
  "rejected",
  "countered", // contraoferta realizada
  "under-review",
]);

export const budgetStatusEnum = pgEnum("budget_status", [
  "pending",
  "approved",
  "rejected",
  "completed",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in-progress",
  "completed",
  "cancelled",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "approve",
  "reject",
  "view",
  "assign",
]);

export const propertyDocumentCategoryEnum = pgEnum("property_document_category", [
  "persona_fisica",
  "persona_moral",
  "optional",
]);

export const propertyDocumentTypeEnum = pgEnum("property_document_type", [
  // Persona Física
  "ife_ine_frente",
  "ife_ine_reverso",
  "pasaporte",
  "legal_estancia",
  "escrituras",
  "contrato_compraventa",
  "fideicomiso",
  "recibo_agua",
  "recibo_luz",
  "recibo_internet",
  "comprobante_no_adeudo",
  // Persona Moral
  "acta_constitutiva",
  // Opcionales
  "reglas_internas",
  "reglamento_condominio",
]);

export const roleRequestStatusEnum = pgEnum("role_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const condominiumApprovalStatusEnum = pgEnum("condominium_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const wizardModeEnum = pgEnum("wizard_mode", [
  "simple",
  "extended",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "bank",   // Banco Mexicano
  "zelle",  // Zelle
  "wise",   // Wise
]);

export const waterServiceEnum = pgEnum("water_service", [
  "capa", // CAPA
  "well", // Pozo
]);

export const electricityServiceEnum = pgEnum("electricity_service", [
  "cfe", // CFE
  "solar", // Autosuficiente con paneles solares
]);

export const electricityPaymentEnum = pgEnum("electricity_payment", [
  "monthly", // Mensual
  "bimonthly", // Bimensual
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "nuevo",
  "contactado",
  "calificado",
  "interesado",
  "visita_agendada",
  "en_negociacion",
  "ganado",
  "perdido",
]);

export const reviewRatingEnum = pgEnum("review_rating", [
  "1",
  "2",
  "3",
  "4",
  "5",
]);

export const rentalApplicationStatusEnum = pgEnum("rental_application_status", [
  "solicitud_enviada",
  "revision_documentos",
  "verificacion_credito",
  "aprobado",
  "contrato_enviado",
  "contrato_firmado",
  "pago_deposito",
  "activo",
  "rechazado",
  "cancelado",
]);

export const rentalContractStatusEnum = pgEnum("rental_contract_status", [
  "draft",           // Borrador
  "apartado",        // Apartado con depósito
  "firmado",         // Contrato firmado por ambas partes
  "check_in",        // Cliente hizo check-in
  "activo",          // Contrato activo
  "completado",      // Contrato completado
  "cancelado",       // Cancelado
]);

export const rentalPaymentStatusEnum = pgEnum("rental_payment_status", [
  "pending",         // Pendiente de pago
  "paid",            // Pagado
  "overdue",         // Atrasado
  "cancelled",       // Cancelado
]);

export const tenantMaintenanceRequestStatusEnum = pgEnum("tenant_maintenance_request_status", [
  "requested",       // Solicitado por inquilino
  "owner_notified",  // Propietario notificado
  "in_progress",     // En progreso
  "completed",       // Completado
  "cancelled",       // Cancelado
]);

export const tenantMaintenanceTypeEnum = pgEnum("tenant_maintenance_type", [
  "plumbing",        // Plomería
  "electrical",      // Eléctrico
  "appliances",      // Electrodomésticos
  "hvac",            // Aire acondicionado/calefacción
  "general",         // General
  "emergency",       // Emergencia
  "other",           // Otro
]);

export const propertyApprovalStatusEnum = pgEnum("property_approval_status", [
  "draft",              // Borrador, aún no enviada
  "pending_review",     // Enviada, esperando revisión inicial
  "inspection_scheduled", // Inspección programada
  "inspection_completed", // Inspección realizada
  "approved",           // Aprobada para publicación
  "published",          // Publicada en el sitio
  "changes_requested",  // Se solicitaron cambios
  "rejected",           // Rechazada
]);

export const ownerPropertyStatusEnum = pgEnum("owner_property_status", [
  "active",             // Activa y disponible
  "suspended",          // Suspendida por propietario
  "rented",             // Rentada (no disponible)
]);

export const changeRequestStatusEnum = pgEnum("change_request_status", [
  "pending",   // Pendiente de revisión
  "approved",  // Aprobado
  "rejected",  // Rechazado
]);

export const changelogCategoryEnum = pgEnum("changelog_category", [
  "feature",      // Nueva funcionalidad
  "enhancement",  // Mejora de funcionalidad existente
  "bugfix",       // Corrección de errores
  "security",     // Mejoras de seguridad
  "performance",  // Optimizaciones de rendimiento
  "ui",           // Cambios de interfaz
  "database",     // Cambios en base de datos
]);

export const amenityCategoryEnum = pgEnum("amenity_category", [
  "property",     // Características de la propiedad
  "condo",        // Amenidades del condominio
]);

export const amenityApprovalStatusEnum = pgEnum("amenity_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const ownerApprovalStatusEnum = pgEnum("owner_approval_status", [
  "pending",   // Pendiente de aprobación
  "approved",  // Aprobado
  "rejected",  // Rechazado
]);

export const leadJourneyActionEnum = pgEnum("lead_journey_action", [
  "search",
  "view_layer1",
  "view_layer2",
  "view_layer3",
  "favorite",
  "unfavorite",
  "request_opportunity",
  "schedule_visit",
  "complete_visit",
  "submit_offer",
  "counter_offer",
  "accept_offer",
  "reject_offer",
]);

export const opportunityRequestStatusEnum = pgEnum("opportunity_request_status", [
  "pending",
  "scheduled_visit",
  "visit_completed", // visita completada, puede hacer oferta
  "offer_submitted", // usuario hizo oferta
  "offer_negotiation", // en proceso de negociación
  "offer_accepted", // oferta aceptada, pasa a contrato
  "accepted",
  "rejected",
  "expired",
  "cancelled",
]);

export const incomeCategoryEnum = pgEnum("income_category", [
  "referral_client",  // Comisión por referido de cliente
  "referral_owner",   // Comisión por referido de propietario
  "rental_commission", // Comisión por renta completada
  "other",            // Otros ingresos
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "draft",      // Borrador, en preparación
  "pending",    // Pendiente de aprobación
  "approved",   // Aprobado, listo para pagar
  "paid",       // Pagado
  "rejected",   // Rechazado
  "cancelled",  // Cancelado
]);

export const accountantAssignmentTypeEnum = pgEnum("accountant_assignment_type", [
  "property",  // Asignado a propiedad específica
  "user",      // Asignado a usuario específico (vendedor, propietario, etc)
  "all",       // Acceso a todos los registros
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "appointment",
  "offer",
  "message",
  "property_update",
  "system",
  "rental_update",
]);

export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const chatTypeEnum = pgEnum("chat_type", [
  "appointment", // Chat de citas
  "rental", // Chat de rentas en curso
  "internal", // Chat interno (administración, mantenimiento, limpieza)
  "support", // Chat con HomesApp (soporte + chatbot)
]);

export const agreementTemplateTypeEnum = pgEnum("agreement_template_type", [
  "terms_and_conditions",   // Términos y condiciones generales
  "rent_authorization",     // Autorización de renta
  "sale_authorization",     // Autorización de venta
]);

export const propertySubmissionStatusEnum = pgEnum("property_submission_status", [
  "draft",      // En progreso, guardando pasos
  "submitted",  // Enviado para revisión
  "approved",   // Aprobado, se creó la propiedad
  "rejected",   // Rechazado
]);

export const agreementSignatureStatusEnum = pgEnum("agreement_signature_status", [
  "pending",    // Pendiente de firma
  "signed",     // Firmado
  "declined",   // Rechazado
]);

export const clientReferralStatusEnum = pgEnum("client_referral_status", [
  "pendiente_confirmacion",  // Pending confirmation
  "confirmado",              // Confirmed
  "en_revision",             // Under review
  "seleccion_propiedad",     // Property selection process
  "proceso_renta",           // Rental process
  "lead_cancelado",          // Lead cancelled
  "completado",              // Completed (rental signed)
]);

export const ownerReferralStatusEnum = pgEnum("owner_referral_status", [
  "pendiente_confirmacion",  // Pending confirmation
  "confirmado",              // Confirmed
  "en_revision",             // Under review
  "propiedad_enlistada",     // Property listed
  "pendiente_aprobacion_admin", // Pending admin approval for commission payment
  "aprobado",                // Approved (admin approved commission payment)
  "rechazado",               // Rejected
  "pagado",                  // Commission paid
  "cancelado",               // Cancelled
]);

export const feedbackTypeEnum = pgEnum("feedback_type", [
  "bug",        // Reporte de bug
  "mejora",     // Sugerencia de mejora
]);

export const feedbackStatusEnum = pgEnum("feedback_status", [
  "nuevo",       // Nuevo reporte
  "en_revision", // En revisión por administrador
  "resuelto",    // Resuelto
  "rechazado",   // Rechazado/No se implementará
]);

export const calendarEventTypeEnum = pgEnum("calendar_event_type", [
  "appointment",     // Cita con cliente
  "maintenance",     // Mantenimiento de propiedad
  "cleaning",        // Limpieza de propiedad
  "inspection",      // Inspección
  "administrative",  // Tarea administrativa
  "meeting",         // Reunión interna
]);

export const calendarEventStatusEnum = pgEnum("calendar_event_status", [
  "scheduled",   // Programado
  "in_progress", // En progreso
  "completed",   // Completado
  "cancelled",   // Cancelado
]);

export const documentTypeEnum = pgEnum("document_type", [
  "passport",    // Pasaporte
  "ine",         // INE Mexicano
]);

export const documentApprovalStatusEnum = pgEnum("document_approval_status", [
  "pending",     // Pendiente de revisión
  "approved",    // Aprobado
  "rejected",    // Rechazado
]);

// Lead Quality Enum
export const leadQualityEnum = pgEnum("lead_quality", [
  "hot",     // Alta probabilidad de conversión
  "warm",    // Probabilidad media
  "cold",    // Baja probabilidad
]);

// Workflow Event Type Enum
export const workflowEventTypeEnum = pgEnum("workflow_event_type", [
  "lead_created",
  "lead_assigned",
  "appointment_scheduled",
  "appointment_completed",
  "offer_submitted",
  "offer_accepted",
  "contract_signed",
  "check_in_completed",
  "rental_started",
  "payment_overdue",
  "contract_expiring",
  "task_assigned",
  "task_overdue",
]);

// Alert Priority Enum
export const alertPriorityEnum = pgEnum("alert_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

// Alert Status Enum
export const alertStatusEnum = pgEnum("alert_status", [
  "pending",
  "acknowledged",
  "resolved",
  "dismissed",
]);

// Health Score Status Enum
export const healthScoreStatusEnum = pgEnum("health_score_status", [
  "excellent",   // 90-100
  "good",        // 70-89
  "fair",        // 50-69
  "poor",        // 30-49
  "critical",    // 0-29
]);

// Suspension Type Enum
export const suspensionTypeEnum = pgEnum("suspension_type", [
  "temporary",   // Temporal
  "permanent",   // Permanente
]);

// Users table (required for Replit Auth + extended fields)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  role: userRoleEnum("role").notNull().default("cliente"),
  additionalRole: userRoleEnum("additional_role"),
  status: userStatusEnum("status").notNull().default("approved"),
  phone: varchar("phone"),
  emailVerified: boolean("email_verified").notNull().default(false),
  preferredLanguage: varchar("preferred_language", { length: 2 }).notNull().default("es"),
  hasSeenWelcome: boolean("has_seen_welcome").notNull().default(false),
  lastWelcomeShown: timestamp("last_welcome_shown"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  onboardingSteps: jsonb("onboarding_steps"), // Tracks completed onboarding steps
  documentType: documentTypeEnum("document_type"),
  documentUrl: varchar("document_url"),
  documentApprovalStatus: documentApprovalStatusEnum("document_approval_status"),
  documentReviewedAt: timestamp("document_reviewed_at"),
  documentRejectionReason: text("document_rejection_reason"),
  commissionTermsAccepted: boolean("commission_terms_accepted").notNull().default(false),
  commissionTermsAcceptedAt: timestamp("commission_terms_accepted_at"),
  paymentMethod: paymentMethodEnum("payment_method"),
  bankName: varchar("bank_name"),
  bankAccountName: varchar("bank_account_name"),
  bankAccountNumber: varchar("bank_account_number"),
  bankClabe: varchar("bank_clabe"),
  bankEmail: varchar("bank_email"),
  bankAddress: text("bank_address"),
  customClientReferralPercent: decimal("custom_client_referral_percent", { precision: 5, scale: 2 }), // Custom % for client referrals (overrides global)
  customOwnerReferralPercent: decimal("custom_owner_referral_percent", { precision: 5, scale: 2 }), // Custom % for owner referrals (overrides global)
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspensionType: suspensionTypeEnum("suspension_type"),
  suspensionReason: text("suspension_reason"),
  suspensionEndDate: timestamp("suspension_end_date"),
  suspendedAt: timestamp("suspended_at"),
  suspendedById: varchar("suspended_by_id").references((): any => users.id),
  propertyLimit: integer("property_limit").notNull().default(3), // Maximum number of properties an owner can upload
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").max(100).optional(),
  lastName: z.string().min(1, "El apellido es requerido").max(100).optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  profileImageUrl: z.string().optional().or(z.literal("")),
  preferredLanguage: z.enum(["es", "en"]).optional(),
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export const updateBankInfoSchema = z.object({
  paymentMethod: z.enum(["bank", "zelle", "wise"]),
  bankName: z.string().optional(),
  bankAccountName: z.string().min(1, "El nombre del titular es requerido").max(200),
  bankAccountNumber: z.string().min(1, "El número de cuenta es requerido").max(100),
  bankClabe: z.string().optional(),
  bankEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  bankAddress: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  // Si es banco mexicano, CLABE y nombre de banco son requeridos
  if (data.paymentMethod === "bank") {
    if (!data.bankName || data.bankName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El nombre del banco es requerido para cuentas bancarias mexicanas",
        path: ["bankName"],
      });
    }
    if (!data.bankClabe || data.bankClabe.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La CLABE es requerida para cuentas bancarias mexicanas",
        path: ["bankClabe"],
      });
    }
  }
});

export type UpdateBankInfo = z.infer<typeof updateBankInfoSchema>;

export const uploadSellerDocumentSchema = z.object({
  documentType: z.enum(["passport", "ine"]),
  documentUrl: z.string().min(1, "El documento es requerido"),
});

export type UploadSellerDocument = z.infer<typeof uploadSellerDocumentSchema>;

// Password Reset Tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Password reset request schema
export const requestPasswordResetSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type RequestPasswordReset = z.infer<typeof requestPasswordResetSchema>;

// Reset password with token schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token es requerido"),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type ResetPassword = z.infer<typeof resetPasswordSchema>;

// Suspend user schema
export const suspendUserSchema = z.object({
  userId: z.string().min(1, "User ID es requerido"),
  suspensionType: z.enum(["temporary", "permanent"]),
  reason: z.string().min(1, "La razón es requerida"),
  endDate: z.string().optional(), // ISO date string for temporary suspension
});

export type SuspendUser = z.infer<typeof suspendUserSchema>;

// Unsuspend user schema
export const unsuspendUserSchema = z.object({
  userId: z.string().min(1, "User ID es requerido"),
});

export type UnsuspendUser = z.infer<typeof unsuspendUserSchema>;

export const acceptCommissionTermsSchema = z.object({
  accepted: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
});

export type AcceptCommissionTerms = z.infer<typeof acceptCommissionTermsSchema>;

export const updateDocumentStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

export type UpdateDocumentStatus = z.infer<typeof updateDocumentStatusSchema>;

// Admin users table for local authentication
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: userRoleEnum("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  onboardingSteps: jsonb("onboarding_steps"), // Tracks completed onboarding steps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

// Admin login schema
export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateAdminProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100).optional(),
  lastName: z.string().min(1, "Last name is required").max(100).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  profileImageUrl: z.string().optional().or(z.literal("")),
});

export type UpdateAdminProfile = z.infer<typeof updateAdminProfileSchema>;

export const updateAdminPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type UpdateAdminPassword = z.infer<typeof updateAdminPasswordSchema>;

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({
  id: true,
  createdAt: true,
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;

// Role requests table
export const roleRequests = pgTable("role_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestedRole: userRoleEnum("requested_role").notNull(),
  status: roleRequestStatusEnum("status").notNull().default("pending"),
  email: varchar("email", { length: 255 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
  reason: text("reason"),
  yearsOfExperience: integer("years_of_experience"),
  experience: text("experience"),
  additionalInfo: text("additional_info"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRoleRequestSchema = createInsertSchema(roleRequests).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewedAt: true,
  reviewNotes: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Correo electrónico inválido"),
  whatsapp: z.string().min(10, "WhatsApp debe tener al menos 10 dígitos"),
  yearsOfExperience: z.number().min(0).optional(),
});

export type RoleRequest = typeof roleRequests.$inferSelect;
export type InsertRoleRequest = z.infer<typeof insertRoleRequestSchema>;

// User registration schema
export const userRegistrationSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  firstName: z.string().min(1, "Nombre es requerido"),
  lastName: z.string().min(1, "Apellido es requerido"),
  phone: z.string().optional(),
  preferredLanguage: z.enum(["es", "en"]).default("es"),
  nationality: z.string().min(1, "Nacionalidad es requerida"),
});

export type UserRegistration = z.infer<typeof userRegistrationSchema>;

// User login schema
export const userLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña es requerida"),
});

export type UserLogin = z.infer<typeof userLoginSchema>;

// Properties table
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  propertyType: text("property_type").notNull().default("house"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).notNull(),
  area: decimal("area", { precision: 8, scale: 2 }),
  location: text("location").notNull(),
  colonyId: varchar("colony_id").references(() => colonies.id),
  colonyName: text("colony_name"),
  customListingTitle: varchar("custom_listing_title", { length: 60 }),
  status: propertyStatusEnum("status").notNull(),
  unitType: text("unit_type").notNull().default("private"),
  condominiumId: varchar("condominium_id").references(() => condominiums.id),
  condoName: text("condo_name"),
  unitNumber: text("unit_number"),
  showCondoInListing: boolean("show_condo_in_listing").notNull().default(true),
  showUnitNumberInListing: boolean("show_unit_number_in_listing").notNull().default(true),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  primaryImages: text("primary_images").array().default(sql`ARRAY[]::text[]`), // 5 fotos principales max
  coverImageIndex: integer("cover_image_index").default(0), // Índice de la foto de portada en primaryImages
  secondaryImages: text("secondary_images").array().default(sql`ARRAY[]::text[]`), // 20 fotos secundarias max
  videos: text("videos").array().default(sql`ARRAY[]::text[]`), // URLs de videos
  virtualTourUrl: text("virtual_tour_url"), // Link de tour 360
  googleMapsUrl: text("google_maps_url"), // Link de Google Maps
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // Coordenada latitud
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // Coordenada longitud
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  specifications: jsonb("specifications"),
  accessInfo: jsonb("access_info"), // lockboxCode, contactPerson, contactPhone
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  managementId: varchar("management_id").references(() => users.id),
  approvalStatus: propertyApprovalStatusEnum("approval_status").notNull().default("draft"),
  ownerStatus: ownerPropertyStatusEnum("owner_status").notNull().default("active"),
  active: boolean("active").notNull().default(true),
  published: boolean("published").notNull().default(false), // Solo publicada si está aprobada
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  allowsSubleasing: boolean("allows_subleasing").notNull().default(false),
  petFriendly: boolean("pet_friendly").notNull().default(false), // Acepta mascotas
  referralPartnerId: varchar("referral_partner_id").references(() => users.id), // Socio que refirió la propiedad
  referralPercent: decimal("referral_percent", { precision: 5, scale: 2 }).default("20.00"), // Porcentaje del referido (default 20%)
  wizardMode: wizardModeEnum("wizard_mode").default("simple"), // Modo de wizard: simple o extendido
  includedServices: jsonb("included_services"), // Servicios incluidos en renta (agua, luz, internet)
  acceptedLeaseDurations: text("accepted_lease_durations").array().default(sql`ARRAY[]::text[]`), // Duraciones de contrato aceptadas
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Performance indexes for frequently queried fields
  index("idx_properties_status").on(table.status),
  index("idx_properties_owner_id").on(table.ownerId),
  index("idx_properties_active").on(table.active),
  index("idx_properties_created_at").on(table.createdAt),
  index("idx_properties_approval_status").on(table.approvalStatus),
  // Composite indexes for common query patterns
  index("idx_properties_active_status").on(table.active, table.status),
  index("idx_properties_active_published").on(table.active, table.published),
]);

// Schema for property access information
const accessInfoSchema = z.discriminatedUnion("accessType", [
  // Unattended access - with lockbox or smart lock
  z.object({
    accessType: z.literal("unattended"),
    method: z.enum(["lockbox", "smart_lock"]),
    // Lockbox fields
    lockboxCode: z.string().optional(),
    lockboxLocation: z.string().optional(),
    // Smart lock fields
    smartLockCode: z.string().optional(), // Código de la cerradura
    smartLockInstructions: z.string().optional(),
    smartLockProvider: z.string().optional(),
    smartLockExpirationDuration: z.enum(["same_day", "ongoing"]).optional(), // "same_day" = vence el día de la cita, "ongoing" = válido indefinidamente
    smartLockExpirationNotes: z.string().optional(), // Notas sobre la vigencia del código
  }),
  // Attended access - someone will open
  z.object({
    accessType: z.literal("attended"),
    contactPerson: z.string().min(1, "Nombre de contacto requerido"),
    contactPhone: z.string().min(1, "Teléfono de contacto requerido"),
    contactNotes: z.string().optional(),
  }),
]).optional();

// Schema for services - separates included (free) from not included (with provider/cost details)
const includedServicesSchema = z.object({
  basicServices: z.object({
    water: z.object({
      included: z.boolean().default(false), // Si está incluido en la renta
      provider: z.string().optional(), // Solo si NO está incluido
      cost: z.string().optional(), // Solo si NO está incluido
    }).optional(),
    electricity: z.object({
      included: z.boolean().default(false),
      provider: z.string().optional(), // Solo si NO está incluido
      cost: z.string().optional(), // Solo si NO está incluido
    }).optional(),
    internet: z.object({
      included: z.boolean().default(false),
      speed: z.string().optional(), // Velocidad del internet (ej: "100 Mbps", "1 Gbps")
      provider: z.string().optional(), // Solo si NO está incluido  
      cost: z.string().optional(), // Solo si NO está incluido
    }).optional(),
  }).optional(),
  // Additional services (pool cleaning, garden, gas, etc)
  additionalServices: z.array(z.object({
    type: z.enum(["pool_cleaning", "garden", "gas"]),
    provider: z.string().optional(),
    cost: z.string().optional(),
  })).optional(),
}).optional();

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  accessInfo: accessInfoSchema,
  includedServices: includedServicesSchema,
  customListingTitle: z.string().max(60, "El título personalizado no puede exceder 60 caracteres").optional(),
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Property Documents table
export const propertyDocuments = pgTable("property_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  documentType: propertyDocumentTypeEnum("document_type").notNull(),
  category: propertyDocumentCategoryEnum("category").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"), // en bytes
  mimeType: text("mime_type"),
  isRequired: boolean("is_required").notNull().default(true),
  isValidated: boolean("is_validated").notNull().default(false),
  validatedAt: timestamp("validated_at"),
  validatedBy: varchar("validated_by").references(() => users.id),
  validationNotes: text("validation_notes"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertyDocumentSchema = createInsertSchema(propertyDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  uploadedAt: true,
});

export type InsertPropertyDocument = z.infer<typeof insertPropertyDocumentSchema>;
export type PropertyDocument = typeof propertyDocuments.$inferSelect;

// Colonies table
export const colonies = pgTable("colonies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  active: boolean("active").notNull().default(true),
  approvalStatus: condominiumApprovalStatusEnum("approval_status").notNull().default("approved"),
  requestedBy: varchar("requested_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertColonySchema = createInsertSchema(colonies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertColony = z.infer<typeof insertColonySchema>;
export type Colony = typeof colonies.$inferSelect;

// Condominiums table
export const condominiums = pgTable("condominiums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  colonyId: varchar("colony_id").references(() => colonies.id),
  zone: text("zone"),
  address: text("address"),
  active: boolean("active").notNull().default(true),
  approvalStatus: condominiumApprovalStatusEnum("approval_status").notNull().default("approved"),
  requestedBy: varchar("requested_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCondominiumSchema = createInsertSchema(condominiums).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCondominium = z.infer<typeof insertCondominiumSchema>;
export type Condominium = typeof condominiums.$inferSelect;

// Amenities table
export const amenities = pgTable("amenities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: amenityCategoryEnum("category").notNull(),
  approvalStatus: amenityApprovalStatusEnum("approval_status").notNull().default("approved"),
  requestedBy: varchar("requested_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.name, table.category),
]);

export const insertAmenitySchema = createInsertSchema(amenities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAmenity = z.infer<typeof insertAmenitySchema>;
export type Amenity = typeof amenities.$inferSelect;

// Property features table (características de propiedades)
export const propertyFeatures = pgTable("property_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  icon: text("icon"), // Optional icon name from lucide-react
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertyFeatureSchema = createInsertSchema(propertyFeatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyFeature = z.infer<typeof insertPropertyFeatureSchema>;
export type PropertyFeature = typeof propertyFeatures.$inferSelect;

// Property staff assignment table
export const propertyStaff = pgTable(
  "property_staff",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    staffId: varchar("staff_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role").notNull(), // cleaning, maintenance, concierge, accounting, legal
    assignedById: varchar("assigned_by_id").notNull().references(() => users.id),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.propertyId, table.staffId, table.role),
  ]
);

export const insertPropertyStaffSchema = createInsertSchema(propertyStaff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyStaff = z.infer<typeof insertPropertyStaffSchema>;
export type PropertyStaff = typeof propertyStaff.$inferSelect;

// Leads/Clients CRM table (Kanban Board)
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  status: leadStatusEnum("status").notNull().default("nuevo"),
  source: varchar("source"), // web, referido, llamada, evento, etc
  registeredById: varchar("registered_by_id").notNull().references(() => users.id), // Vendedor que registró el lead
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  userId: varchar("user_id").references(() => users.id), // Usuario creado para este lead (después de confirmación)
  budget: decimal("budget", { precision: 12, scale: 2 }),
  notes: text("notes"),
  propertyInterests: text("property_interests").array().default(sql`ARRAY[]::text[]`),
  emailVerified: boolean("email_verified").notNull().default(false), // Si el lead confirmó su email
  validUntil: timestamp("valid_until").notNull(), // Fecha de expiración del lead (3 meses por defecto)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Lead Property Offers - tracking de propiedades ofrecidas a cada lead
export const leadPropertyOffers = pgTable("lead_property_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  offeredById: varchar("offered_by_id").notNull().references(() => users.id), // Vendedor que ofreció la propiedad
  message: text("message"), // Mensaje personalizado del vendedor
  isInterested: boolean("is_interested"), // null = no respondido, true = interesado, false = no interesado
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadPropertyOfferSchema = createInsertSchema(leadPropertyOffers).omit({
  id: true,
  createdAt: true,
});

export type InsertLeadPropertyOffer = z.infer<typeof insertLeadPropertyOfferSchema>;
export type LeadPropertyOffer = typeof leadPropertyOffers.$inferSelect;

// System Configuration - configuraciones del sistema (validez de leads, etc)
export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(), // Clave de configuración (ej: "lead_validity_months")
  value: text("value").notNull(), // Valor de configuración
  description: text("description"), // Descripción de qué hace esta configuración
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;

// Rental Applications table (Rental Process Kanban)
export const rentalApplications = pgTable("rental_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  applicantId: varchar("applicant_id").notNull().references(() => users.id),
  status: rentalApplicationStatusEnum("status").notNull().default("solicitud_enviada"),
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }),
  employmentStatus: varchar("employment_status"),
  moveInDate: timestamp("move_in_date"),
  leaseDuration: integer("lease_duration"),
  depositAmount: decimal("deposit_amount", { precision: 12, scale: 2 }),
  documents: text("documents").array().default(sql`ARRAY[]::text[]`),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRentalApplicationSchema = createInsertSchema(rentalApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRentalApplication = z.infer<typeof insertRentalApplicationSchema>;
export type RentalApplication = typeof rentalApplications.$inferSelect;

// Rental Contracts table - Contratos de arrendamiento con comisiones
export const rentalContracts = pgTable("rental_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalApplicationId: varchar("rental_application_id").references(() => rentalApplications.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Inquilino
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Propietario
  sellerId: varchar("seller_id").references(() => users.id), // Vendedor que cerró la renta
  status: rentalContractStatusEnum("status").notNull().default("draft"),
  
  // Términos del contrato
  monthlyRent: decimal("monthly_rent", { precision: 12, scale: 2 }).notNull(), // Precio de renta mensual acordado
  leaseDurationMonths: integer("lease_duration_months").notNull(), // Duración en meses
  depositAmount: decimal("deposit_amount", { precision: 12, scale: 2 }), // Depósito del apartado
  administrativeFee: decimal("administrative_fee", { precision: 12, scale: 2 }), // Costo administrativo ($2,500 o $3,800 MXN)
  isForSublease: boolean("is_for_sublease").notNull().default(false), // Si es para subarrendar
  
  // Comisiones calculadas
  totalCommissionMonths: decimal("total_commission_months", { precision: 5, scale: 2 }).notNull(), // Meses de comisión según duración
  totalCommissionAmount: decimal("total_commission_amount", { precision: 12, scale: 2 }).notNull(), // Monto total de comisión
  
  // Distribución de comisiones (porcentajes)
  sellerCommissionPercent: decimal("seller_commission_percent", { precision: 5, scale: 2 }).notNull(), // % del vendedor
  referralCommissionPercent: decimal("referral_commission_percent", { precision: 5, scale: 2 }).default("0"), // % del referido
  homesappCommissionPercent: decimal("homesapp_commission_percent", { precision: 5, scale: 2 }).notNull(), // % de HomesApp
  
  // Montos de comisiones
  sellerCommissionAmount: decimal("seller_commission_amount", { precision: 12, scale: 2 }).notNull(),
  referralCommissionAmount: decimal("referral_commission_amount", { precision: 12, scale: 2 }).default("0"),
  homesappCommissionAmount: decimal("homesapp_commission_amount", { precision: 12, scale: 2 }).notNull(),
  
  // Referido de la propiedad (si aplica)
  referralPartnerId: varchar("referral_partner_id").references(() => users.id), // ID del socio referido
  
  // Fechas importantes
  apartadoDate: timestamp("apartado_date"), // Fecha cuando se hizo el apartado
  contractSignedDate: timestamp("contract_signed_date"), // Fecha de firma del contrato
  checkInDate: timestamp("check_in_date"), // Fecha de check-in
  leaseStartDate: timestamp("lease_start_date").notNull(), // Inicio del arrendamiento
  leaseEndDate: timestamp("lease_end_date").notNull(), // Fin del arrendamiento
  payoutReleasedAt: timestamp("payout_released_at"), // Fecha cuando se liberaron los pagos a vendedores
  
  // Términos y condiciones
  ownerTermsSignedAt: timestamp("owner_terms_signed_at"), // Propietario firmó términos
  tenantTermsSignedAt: timestamp("tenant_terms_signed_at"), // Inquilino firmó términos
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRentalContractSchema = createInsertSchema(rentalContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRentalContract = z.infer<typeof insertRentalContractSchema>;
export type RentalContract = typeof rentalContracts.$inferSelect;

// Rental Payments table - Pagos mensuales de renta
export const rentalPayments = pgTable("rental_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalContractId: varchar("rental_contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(), // Fecha de vencimiento del pago
  paymentDate: timestamp("payment_date"), // Fecha cuando se pagó
  status: rentalPaymentStatusEnum("status").notNull().default("pending"),
  paymentProof: text("payment_proof"), // Ruta del comprobante de pago (imagen)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_rental_payments_contract").on(table.rentalContractId),
  index("idx_rental_payments_tenant").on(table.tenantId),
  index("idx_rental_payments_status").on(table.status),
  index("idx_rental_payments_due_date").on(table.dueDate),
]);

export const insertRentalPaymentSchema = createInsertSchema(rentalPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRentalPayment = z.infer<typeof insertRentalPaymentSchema>;
export type RentalPayment = typeof rentalPayments.$inferSelect;

// Tenant Maintenance Requests table - Solicitudes de mantenimiento del inquilino
export const tenantMaintenanceRequests = pgTable("tenant_maintenance_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalContractId: varchar("rental_contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // Título de la solicitud
  description: text("description").notNull(),
  urgency: varchar("urgency").notNull().default("medium"), // low, medium, high, emergency
  photoData: text("photo_data"), // Foto del problema en base64
  status: varchar("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  adminNotes: text("admin_notes"), // Notas del administrador
  resolvedAt: timestamp("resolved_at"), // Fecha de resolución
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tenant_maintenance_contract").on(table.rentalContractId),
  index("idx_tenant_maintenance_tenant").on(table.tenantId),
  index("idx_tenant_maintenance_status").on(table.status),
]);

export const insertTenantMaintenanceRequestSchema = createInsertSchema(tenantMaintenanceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTenantMaintenanceRequest = z.infer<typeof insertTenantMaintenanceRequestSchema>;
export type TenantMaintenanceRequest = typeof tenantMaintenanceRequests.$inferSelect;

// Property Delivery Inventories table - Inventarios de entrega de propiedad
export const propertyDeliveryInventories = pgTable("property_delivery_inventories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalContractId: varchar("rental_contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Estado general de la propiedad
  generalCondition: varchar("general_condition").notNull().default("good"), // excellent, good, fair, poor
  generalNotes: text("general_notes"),
  
  // Inventario por áreas (JSON)
  livingRoomItems: jsonb("living_room_items"), // { item: string, quantity: number, condition: string, notes: string }[]
  kitchenItems: jsonb("kitchen_items"),
  bedroomItems: jsonb("bedroom_items"),
  bathroomItems: jsonb("bathroom_items"),
  otherItems: jsonb("other_items"),
  
  // Servicios y utilidades
  waterMeterReading: varchar("water_meter_reading"), // Lectura del medidor de agua
  electricityMeterReading: varchar("electricity_meter_reading"), // Lectura del medidor de luz
  gasMeterReading: varchar("gas_meter_reading"), // Lectura del medidor de gas
  
  // Llaves y accesos
  keysProvided: integer("keys_provided").notNull().default(0), // Número de llaves entregadas
  remoteControls: integer("remote_controls").notNull().default(0), // Controles remotos
  accessCards: integer("access_cards").notNull().default(0), // Tarjetas de acceso
  
  // Fotos del inventario
  photos: text("photos").array().default(sql`ARRAY[]::text[]`),
  
  // Firmas digitales
  ownerSignedAt: timestamp("owner_signed_at"),
  tenantSignedAt: timestamp("tenant_signed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_delivery_inventory_contract").on(table.rentalContractId),
  index("idx_delivery_inventory_property").on(table.propertyId),
]);

export const insertPropertyDeliveryInventorySchema = createInsertSchema(propertyDeliveryInventories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyDeliveryInventory = z.infer<typeof insertPropertyDeliveryInventorySchema>;
export type PropertyDeliveryInventory = typeof propertyDeliveryInventories.$inferSelect;

// Tenant Move-In Forms table - Formularios de ingreso de inquilinos
export const tenantMoveInForms = pgTable("tenant_move_in_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalContractId: varchar("rental_contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Información personal del inquilino
  fullName: varchar("full_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  nationality: varchar("nationality"),
  occupation: varchar("occupation"),
  employer: varchar("employer"),
  
  // Documentos de identificación
  idType: varchar("id_type"), // passport, ine, driver_license
  idNumber: varchar("id_number"),
  idExpiry: timestamp("id_expiry"),
  idPhotos: text("id_photos").array().default(sql`ARRAY[]::text[]`),
  
  // Contactos de emergencia
  emergencyContact1Name: varchar("emergency_contact1_name"),
  emergencyContact1Phone: varchar("emergency_contact1_phone"),
  emergencyContact1Relationship: varchar("emergency_contact1_relationship"),
  
  emergencyContact2Name: varchar("emergency_contact2_name"),
  emergencyContact2Phone: varchar("emergency_contact2_phone"),
  emergencyContact2Relationship: varchar("emergency_contact2_relationship"),
  
  // Información de vehículos
  hasVehicle: boolean("has_vehicle").notNull().default(false),
  vehicleMake: varchar("vehicle_make"),
  vehicleModel: varchar("vehicle_model"),
  vehiclePlate: varchar("vehicle_plate"),
  vehicleColor: varchar("vehicle_color"),
  vehiclePhotos: text("vehicle_photos").array().default(sql`ARRAY[]::text[]`),
  
  // Mascotas
  hasPets: boolean("has_pets").notNull().default(false),
  petDetails: text("pet_details"), // Descripción de las mascotas
  petPhotos: text("pet_photos").array().default(sql`ARRAY[]::text[]`),
  
  // Ocupantes adicionales
  additionalOccupants: jsonb("additional_occupants"), // { name: string, age: number, relationship: string }[]
  
  // Preferencias y notas
  specialRequests: text("special_requests"),
  allergies: text("allergies"),
  medicalConditions: text("medical_conditions"),
  
  // Firma digital del inquilino
  tenantSignedAt: timestamp("tenant_signed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_move_in_form_contract").on(table.rentalContractId),
  index("idx_move_in_form_tenant").on(table.tenantId),
]);

export const insertTenantMoveInFormSchema = createInsertSchema(tenantMoveInForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTenantMoveInForm = z.infer<typeof insertTenantMoveInFormSchema>;
export type TenantMoveInForm = typeof tenantMoveInForms.$inferSelect;

// Appointments table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id),
  conciergeId: varchar("concierge_id").references(() => users.id),
  presentationCardId: varchar("presentation_card_id").references(() => presentationCards.id), // Tarjeta de presentación requerida
  opportunityRequestId: varchar("opportunity_request_id").references(() => rentalOpportunityRequests.id, { onDelete: "set null" }), // Link to SOR
  date: timestamp("date").notNull(),
  type: appointmentTypeEnum("type").notNull(),
  mode: appointmentModeEnum("mode").notNull().default("individual"), // individual (1hr) or tour (30min/property)
  tourGroupId: varchar("tour_group_id"), // Groups multiple appointments in same tour
  status: appointmentStatusEnum("status").notNull().default("pending"),
  ownerApprovalStatus: ownerApprovalStatusEnum("owner_approval_status").notNull().default("pending"),
  ownerApprovedAt: timestamp("owner_approved_at"),
  meetLink: text("meet_link"),
  googleEventId: text("google_event_id"),
  notes: text("notes"),
  conciergeReport: text("concierge_report"), // Report after appointment
  accessIssues: text("access_issues"), // Access problems reported
  
  // Campos para tipos de visitas
  visitType: visitTypeEnum("visit_type").notNull().default("visita_cliente"),
  staffMemberId: varchar("staff_member_id").references(() => users.id), // ID del staff (no cliente)
  staffMemberName: text("staff_member_name"), // Nombre del staff
  staffMemberPosition: text("staff_member_position"), // Cargo/posición
  staffMemberCompany: text("staff_member_company"), // Empresa
  staffMemberWhatsapp: varchar("staff_member_whatsapp"), // WhatsApp del staff
  accessCredentialsSent: boolean("access_credentials_sent").default(false), // Si se enviaron credenciales
  clientFeedback: jsonb("client_feedback"), // Feedback del cliente (opciones predefinidas)
  staffFeedback: text("staff_feedback"), // Feedback del staff (texto libre)
  
  // Campos de reprogramación
  rescheduleStatus: rescheduleStatusEnum("reschedule_status").notNull().default("none"),
  rescheduleRequestedDate: timestamp("reschedule_requested_date"), // Nueva fecha propuesta
  rescheduleNotes: text("reschedule_notes"), // Motivo de reprogramación
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Performance indexes for frequently queried fields
  index("idx_appointments_date").on(table.date),
  index("idx_appointments_status").on(table.status),
  index("idx_appointments_client_id").on(table.clientId),
  index("idx_appointments_property_id").on(table.propertyId),
  index("idx_appointments_concierge_id").on(table.conciergeId),
  // Composite indexes for common query patterns
  index("idx_appointments_status_date").on(table.status, table.date),
]);

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Business Hours Configuration - Horarios de atención
export const businessHours = pgTable("business_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  isOpen: boolean("is_open").notNull().default(true),
  openTime: varchar("open_time").notNull().default("10:00"), // formato HH:mm
  closeTime: varchar("close_time").notNull().default("18:00"), // formato HH:mm
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBusinessHoursSchema = createInsertSchema(businessHours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBusinessHours = z.infer<typeof insertBusinessHoursSchema>;
export type BusinessHours = typeof businessHours.$inferSelect;

// Concierge Blocked Slots - Horarios bloqueados por conserjes
export const conciergeBlockedSlots = pgTable("concierge_blocked_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conciergeId: varchar("concierge_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  reason: text("reason"), // Motivo opcional del bloqueo
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertConciergeBlockedSlotSchema = createInsertSchema(conciergeBlockedSlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConciergeBlockedSlot = z.infer<typeof insertConciergeBlockedSlotSchema>;
export type ConciergeBlockedSlot = typeof conciergeBlockedSlots.$inferSelect;

// Calendar Events table - for maintenance, cleaning, inspections, etc.
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  eventType: calendarEventTypeEnum("event_type").notNull(),
  status: calendarEventStatusEnum("status").notNull().default("scheduled"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }),
  assignedToId: varchar("assigned_to_id").references(() => users.id), // Staff assigned (concierge, maintenance, cleaning)
  appointmentId: varchar("appointment_id").references(() => appointments.id, { onDelete: "set null" }), // Link to appointment if applicable
  clientId: varchar("client_id").references(() => users.id), // Client if applicable
  googleEventId: text("google_event_id"),
  notes: text("notes"),
  color: varchar("color", { length: 7 }).default("#3b82f6"), // Hex color for calendar display
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Property Reviews table
export const propertyReviews = pgTable("property_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  appointmentId: varchar("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  rating: reviewRatingEnum("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertyReviewSchema = createInsertSchema(propertyReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyReview = z.infer<typeof insertPropertyReviewSchema>;
export type PropertyReview = typeof propertyReviews.$inferSelect;

// Appointment Reviews table
export const appointmentReviews = pgTable("appointment_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appointmentId: varchar("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: reviewRatingEnum("rating").notNull(),
  comment: text("comment"),
  experienceRating: reviewRatingEnum("experience_rating"),
  punctualityRating: reviewRatingEnum("punctuality_rating"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppointmentReviewSchema = createInsertSchema(appointmentReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointmentReview = z.infer<typeof insertAppointmentReviewSchema>;
export type AppointmentReview = typeof appointmentReviews.$inferSelect;

// Concierge Reviews (from clients)
export const conciergeReviews = pgTable("concierge_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conciergeId: varchar("concierge_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  appointmentId: varchar("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  rating: reviewRatingEnum("rating").notNull(),
  professionalismRating: reviewRatingEnum("professionalism_rating"),
  knowledgeRating: reviewRatingEnum("knowledge_rating"),
  communicationRating: reviewRatingEnum("communication_rating"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertConciergeReviewSchema = createInsertSchema(conciergeReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConciergeReview = z.infer<typeof insertConciergeReviewSchema>;
export type ConciergeReview = typeof conciergeReviews.$inferSelect;

// Client Reviews (from concierges)
export const clientReviews = pgTable("client_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  conciergeId: varchar("concierge_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  appointmentId: varchar("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  rating: reviewRatingEnum("rating").notNull(),
  punctualityRating: reviewRatingEnum("punctuality_rating"),
  attitudeRating: reviewRatingEnum("attitude_rating"),
  seriousnessRating: reviewRatingEnum("seriousness_rating"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientReviewSchema = createInsertSchema(clientReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClientReview = z.infer<typeof insertClientReviewSchema>;
export type ClientReview = typeof clientReviews.$inferSelect;

// Client presentation cards table
export const presentationCards = pgTable("presentation_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  propertyType: text("property_type").notNull(),
  modality: propertyStatusEnum("modality").notNull(),
  minPrice: decimal("min_price", { precision: 12, scale: 2 }).notNull(),
  maxPrice: decimal("max_price", { precision: 12, scale: 2 }).notNull(),
  location: text("location").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  additionalRequirements: text("additional_requirements"),
  moveInDate: timestamp("move_in_date"),
  contractDuration: text("contract_duration"),
  hasPets: boolean("has_pets").default(false),
  petPhotoUrl: text("pet_photo_url"),
  isActive: boolean("is_active").notNull().default(false), // Tarjeta activa para recibir oportunidades
  timesUsed: integer("times_used").notNull().default(0), // Tracking de uso
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPresentationCardSchema = createInsertSchema(presentationCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPresentationCard = z.infer<typeof insertPresentationCardSchema>;
export type PresentationCard = typeof presentationCards.$inferSelect;

// Property Recommendations table (recomendaciones de vendedores a clientes)
export const propertyRecommendations = pgTable("property_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  presentationCardId: varchar("presentation_card_id").references(() => presentationCards.id, { onDelete: "set null" }),
  message: text("message"), // Mensaje personalizado del vendedor
  isRead: boolean("is_read").notNull().default(false),
  isInterested: boolean("is_interested"), // null = no respondido, true = interesado, false = no interesado
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertyRecommendationSchema = createInsertSchema(propertyRecommendations).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export type InsertPropertyRecommendation = z.infer<typeof insertPropertyRecommendationSchema>;
export type PropertyRecommendation = typeof propertyRecommendations.$inferSelect;

// Auto Suggestions table (sugerencias automáticas basadas en tarjeta activa)
export const autoSuggestions = pgTable("auto_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  presentationCardId: varchar("presentation_card_id").notNull().references(() => presentationCards.id, { onDelete: "cascade" }),
  matchScore: integer("match_score"), // Score de coincidencia (0-100)
  matchReasons: text("match_reasons").array().default(sql`ARRAY[]::text[]`), // Razones de coincidencia
  isRead: boolean("is_read").notNull().default(false),
  isInterested: boolean("is_interested"), // null = no respondido, true = interesado, false = no interesado
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAutoSuggestionSchema = createInsertSchema(autoSuggestions).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export type InsertAutoSuggestion = z.infer<typeof insertAutoSuggestionSchema>;
export type AutoSuggestion = typeof autoSuggestions.$inferSelect;

// Service providers table
export const serviceProviders = pgTable("service_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  specialty: text("specialty").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect;

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => serviceProviders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  estimatedDuration: integer("estimated_duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Offers table
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityRequestId: varchar("opportunity_request_id").references(() => rentalOpportunityRequests.id, { onDelete: "set null" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  offerAmount: decimal("offer_amount", { precision: 12, scale: 2 }).notNull(),
  counterOfferAmount: decimal("counter_offer_amount", { precision: 12, scale: 2 }),
  status: offerStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  counterOfferNotes: text("counter_offer_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;

// Budgets/Quotes table (presupuestos y cotizaciones)
export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  status: budgetStatusEnum("status").notNull().default("pending"),
  attachments: text("attachments").array().default(sql`ARRAY[]::text[]`),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

// Tasks table (tareas para el personal)
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  assignedToId: varchar("assigned_to_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  status: taskStatusEnum("status").notNull().default("pending"),
  priority: varchar("priority").notNull().default("medium"), // low, medium, high
  budgetId: varchar("budget_id").references(() => budgets.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Work Reports table (reportes antes y después de trabajos)
export const workReports = pgTable("work_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  staffId: varchar("staff_id").notNull().references(() => users.id),
  reportType: varchar("report_type").notNull(), // before, after
  description: text("description").notNull(),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkReportSchema = createInsertSchema(workReports).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkReport = z.infer<typeof insertWorkReportSchema>;
export type WorkReport = typeof workReports.$inferSelect;

// Property Change Requests table (cambios pendientes de aprobación)
export const propertyChangeRequests = pgTable("property_change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  requestedById: varchar("requested_by_id").notNull().references(() => users.id),
  status: changeRequestStatusEnum("status").notNull().default("pending"),
  changedFields: jsonb("changed_fields").notNull(), // { price: { old: 1000, new: 1500 }, title: { old: "...", new: "..." } }
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertyChangeRequestSchema = createInsertSchema(propertyChangeRequests).omit({
  id: true,
  status: true,
  reviewedById: true,
  reviewedAt: true,
  reviewNotes: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for validating property change fields (whitelist of allowed fields)
export const propertyChangeFieldsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  propertyType: z.string().optional(),
  price: z.number().optional(),
  salePrice: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  area: z.number().optional(),
  location: z.string().optional(),
  colonyId: z.string().nullable().optional(),
  condominiumId: z.string().nullable().optional(),
  unitNumber: z.string().nullable().optional(),
  googleMapsUrl: z.string().nullable().optional(),
  petFriendly: z.boolean().optional(),
  amenities: z.array(z.string()).optional(),
  includedServices: z.any().optional(),
  acceptedLeaseDurations: z.array(z.string()).optional(),
  specifications: z.any().optional(),
  accessInfo: z.any().optional(),
  images: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  virtualTourUrl: z.string().optional(),
  availableFrom: z.date().optional(),
  availableTo: z.date().optional(),
});

// Schema for creating property change request
export const createPropertyChangeRequestSchema = z.object({
  propertyId: z.string(),
  changedFields: propertyChangeFieldsSchema,
});

export type InsertPropertyChangeRequest = z.infer<typeof insertPropertyChangeRequestSchema>;
export type PropertyChangeRequest = typeof propertyChangeRequests.$inferSelect;

// Property Limit Requests table (solicitudes de aumento de límite de propiedades)
export const propertyLimitRequests = pgTable("property_limit_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestedLimit: integer("requested_limit").notNull(), // New limit requested
  currentLimit: integer("current_limit").notNull(), // Current limit at time of request
  reason: text("reason").notNull(), // Why they need more properties
  status: changeRequestStatusEnum("status").notNull().default("pending"),
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertyLimitRequestSchema = createInsertSchema(propertyLimitRequests).omit({
  id: true,
  status: true,
  reviewedById: true,
  reviewedAt: true,
  reviewNotes: true,
  createdAt: true,
  updatedAt: true,
});

export const createPropertyLimitRequestSchema = z.object({
  requestedLimit: z.number().int().min(4, "El límite solicitado debe ser mayor que 3"),
  reason: z.string().min(20, "Por favor proporciona una razón detallada (mínimo 20 caracteres)").max(500),
});

export type InsertPropertyLimitRequest = z.infer<typeof insertPropertyLimitRequestSchema>;
export type PropertyLimitRequest = typeof propertyLimitRequests.$inferSelect;

// Inspection Reports table (reportes de inspección de propiedades)
export const inspectionReports = pgTable("inspection_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  inspectorId: varchar("inspector_id").notNull().references(() => users.id),
  inspectionDate: timestamp("inspection_date").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, scheduled, completed
  overallCondition: varchar("overall_condition"), // excellent, good, fair, poor
  observations: text("observations"),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  approved: boolean("approved"),
  approvalNotes: text("approval_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInspectionReportSchema = createInsertSchema(inspectionReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for creating inspection report (admin only)
export const createInspectionReportSchema = z.object({
  propertyId: z.string(),
  inspectionDate: z.date(),
  notes: z.string().optional(),
  observations: z.string().optional(),
});

// Schema for updating inspection report (admin only)
export const updateInspectionReportSchema = z.object({
  inspectionDate: z.date().optional(),
  status: z.string().optional(),
  overallCondition: z.string().optional(),
  observations: z.string().optional(),
  images: z.array(z.string()).optional(),
  approved: z.boolean().optional(),
  approvalNotes: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertInspectionReport = z.infer<typeof insertInspectionReportSchema>;
export type InspectionReport = typeof inspectionReports.$inferSelect;

// Property Tasks table (tareas de propiedades)
export const propertyTasks = pgTable("property_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  assignedToId: varchar("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "urgent"
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed", "cancelled"
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertyTaskSchema = createInsertSchema(propertyTasks).omit({
  id: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyTask = z.infer<typeof insertPropertyTaskSchema>;
export type PropertyTask = typeof propertyTasks.$inferSelect;

// Owner Settings table (configuración de propietarios)
export const ownerSettings = pgTable("owner_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  autoApproveAppointments: boolean("auto_approve_appointments").notNull().default(false),
  autoAcceptOffers: boolean("auto_accept_offers").notNull().default(false),
  notificationPreferences: jsonb("notification_preferences"), // { email: true, sms: false, push: true }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOwnerSettingsSchema = createInsertSchema(ownerSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for updating owner settings
export const updateOwnerSettingsSchema = z.object({
  autoApproveAppointments: z.boolean().optional(),
  autoAcceptOffers: z.boolean().optional(),
  notificationPreferences: z.any().optional(),
});

export type InsertOwnerSettings = z.infer<typeof insertOwnerSettingsSchema>;
export type OwnerSettings = typeof ownerSettings.$inferSelect;

// Permissions table (for admin_jr granular permissions)
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission").notNull(), // e.g., "properties:read", "properties:write", "users:approve"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.permission),
]);

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

// Audit Logs table (para rastrear acciones de usuarios)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: auditActionEnum("action").notNull(),
  entityType: varchar("entity_type").notNull(), // property, appointment, user, offer, etc.
  entityId: varchar("entity_id"),
  details: jsonb("details"), // JSON with additional details
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Feedback table (para reportar bugs y sugerir mejoras)
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: feedbackTypeEnum("type").notNull(),
  status: feedbackStatusEnum("status").notNull().default("nuevo"),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  adminNotes: true,
});

export const updateFeedbackSchema = createInsertSchema(feedback).pick({
  status: true,
  adminNotes: true,
});

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type UpdateFeedback = z.infer<typeof updateFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

// Favorites table
export const favorites = pgTable(
  "favorites",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.userId, table.propertyId),
  ]
);

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Lead Journeys - Tracking de acciones del usuario en el proceso de captación
export const leadJourneys = pgTable("lead_journeys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }),
  action: leadJourneyActionEnum("action").notNull(),
  metadata: jsonb("metadata"), // Para guardar detalles como filtros de búsqueda, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadJourneySchema = createInsertSchema(leadJourneys).omit({
  id: true,
  createdAt: true,
});

export type InsertLeadJourney = z.infer<typeof insertLeadJourneySchema>;
export type LeadJourney = typeof leadJourneys.$inferSelect;

// Rental Opportunity Requests (SOR) - Solicitudes de Oportunidad de Renta
export const rentalOpportunityRequests = pgTable("rental_opportunity_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  status: opportunityRequestStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  desiredMoveInDate: timestamp("desired_move_in_date"),
  preferredContactMethod: varchar("preferred_contact_method").default("email"), // email, phone, whatsapp
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRentalOpportunityRequestSchema = createInsertSchema(rentalOpportunityRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRentalOpportunityRequest = z.infer<typeof insertRentalOpportunityRequestSchema>;
export type RentalOpportunityRequest = typeof rentalOpportunityRequests.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  priority: notificationPriorityEnum("priority").notNull().default("medium"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  slaDeadline: timestamp("sla_deadline"), // SLA deadline for response
  relatedEntityType: varchar("related_entity_type"), // property, appointment, offer, etc.
  relatedEntityId: varchar("related_entity_id"),
  metadata: jsonb("metadata"), // Additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Chat Conversations table
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: chatTypeEnum("type").notNull(),
  title: text("title").notNull(),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }), // Para chats de rentas
  rentalApplicationId: varchar("rental_application_id").references(() => rentalApplications.id, { onDelete: "cascade" }), // Para chats de rentas en curso
  rentalContractId: varchar("rental_contract_id").references(() => rentalContracts.id, { onDelete: "cascade" }), // Para chats de rentas activas
  appointmentId: varchar("appointment_id").references(() => appointments.id, { onDelete: "cascade" }), // Para chats de citas
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  isBot: boolean("is_bot").notNull().default(false), // Indicates if this is a chatbot conversation
  closedAt: timestamp("closed_at"), // When chat is locked (1 hour after appointment for appointment chats)
  archivedAt: timestamp("archived_at"), // When chat is archived (7 days after closedAt for appointment chats)
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;

// Chat Participants table
export const chatParticipants = pgTable(
  "chat_participants",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.conversationId, table.userId),
  ]
);

export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({
  id: true,
  createdAt: true,
});

export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;

// Chat Messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  attachments: text("attachments").array().default(sql`ARRAY[]::text[]`),
  isBot: boolean("is_bot").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Chatbot Configuration table
export const chatbotConfig = pgTable("chatbot_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().default("MARCO"),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  welcomeMessage: text("welcome_message").notNull(),
  conversationalMode: boolean("conversational_mode").notNull().default(true),
  canSuggestPresentationCards: boolean("can_suggest_presentation_cards").notNull().default(true),
  canScheduleAppointments: boolean("can_schedule_appointments").notNull().default(true),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChatbotConfigSchema = createInsertSchema(chatbotConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateChatbotConfigSchema = insertChatbotConfigSchema.partial();

export type InsertChatbotConfig = z.infer<typeof insertChatbotConfigSchema>;
export type UpdateChatbotConfig = z.infer<typeof updateChatbotConfigSchema>;
export type ChatbotConfig = typeof chatbotConfig.$inferSelect;

// Agreement Templates table - for admin-editable templates
export const agreementTemplates = pgTable("agreement_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: agreementTemplateTypeEnum("type").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description"),
  content: text("content").notNull(), // Template content with variables like {{owner.name}}, {{property.title}}
  allowedVariables: text("allowed_variables").array().default(sql`ARRAY[]::text[]`), // List of allowed variables
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAgreementTemplateSchema = createInsertSchema(agreementTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgreementTemplate = z.infer<typeof insertAgreementTemplateSchema>;
export type AgreementTemplate = typeof agreementTemplates.$inferSelect;

// Property Submission Drafts - for saving wizard progress
export const propertySubmissionDrafts = pgTable("property_submission_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "set null" }), // Set when approved and property created
  status: propertySubmissionStatusEnum("status").notNull().default("draft"),
  currentStep: integer("current_step").notNull().default(1),
  // Property data stored as JSON (will be converted to property record when submitted)
  basicInfo: jsonb("basic_info"), // title, description, propertyType, price, etc.
  locationInfo: jsonb("location_info"), // location, address details
  details: jsonb("details"), // bedrooms, bathrooms, area, amenities
  media: jsonb("media"), // images, videos, virtualTourUrl
  servicesInfo: jsonb("services_info"), // servicios incluidos y duraciones de contrato
  accessInfo: jsonb("access_info"), // información de acceso a la propiedad
  commercialTerms: jsonb("commercial_terms"), // rental/sale specific terms
  termsAcceptance: jsonb("terms_acceptance"), // acceptance flags and timestamp
  // Property type selection
  isForRent: boolean("is_for_rent").notNull().default(false),
  isForSale: boolean("is_for_sale").notNull().default(false),
  // Review/rejection info
  reviewNotes: text("review_notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertySubmissionDraftSchema = createInsertSchema(propertySubmissionDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertySubmissionDraft = z.infer<typeof insertPropertySubmissionDraftSchema>;
export type PropertySubmissionDraft = typeof propertySubmissionDrafts.$inferSelect;

// Property Agreements - for storing signed agreements
export const propertyAgreements = pgTable("property_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionDraftId: varchar("submission_draft_id").references(() => propertySubmissionDrafts.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").notNull().references(() => agreementTemplates.id),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateType: agreementTemplateTypeEnum("template_type").notNull(),
  status: agreementSignatureStatusEnum("status").notNull().default("pending"),
  // Rendered content with variables replaced
  renderedContent: text("rendered_content").notNull(),
  // Signature information
  signedAt: timestamp("signed_at"),
  signerName: varchar("signer_name"),
  signerIp: varchar("signer_ip"),
  // Variable data used for rendering (stored for record)
  variableData: jsonb("variable_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropertyAgreementSchema = createInsertSchema(propertyAgreements).omit({
  id: true,
  createdAt: true,
});

export type InsertPropertyAgreement = z.infer<typeof insertPropertyAgreementSchema>;
export type PropertyAgreement = typeof propertyAgreements.$inferSelect;

// Service Booking Status Enum
export const serviceBookingStatusEnum = pgEnum("service_booking_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

// Service Bookings table - for hiring service providers
export const serviceBookings = pgTable("service_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id").notNull().references(() => serviceProviders.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "set null" }),
  status: serviceBookingStatusEnum("status").notNull().default("pending"),
  scheduledDate: timestamp("scheduled_date"),
  notes: text("notes"),
  clientMessage: text("client_message"), // Message from client when booking
  providerResponse: text("provider_response"), // Response from provider
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertServiceBookingSchema = createInsertSchema(serviceBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertServiceBooking = z.infer<typeof insertServiceBookingSchema>;
export type ServiceBooking = typeof serviceBookings.$inferSelect;

// Provider Application Status Enum
export const providerApplicationStatusEnum = pgEnum("provider_application_status", [
  "pending",
  "approved",
  "rejected",
]);

// Provider Applications table - for service provider applications
export const providerApplications = pgTable("provider_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  specialty: text("specialty").notNull(), // e.g., "Limpieza", "Mantenimiento", "Jardinería"
  experience: text("experience").notNull(), // Years of experience description
  description: text("description").notNull(), // Why they want to join
  references: text("references"), // Optional references
  status: providerApplicationStatusEnum("status").notNull().default("pending"),
  reviewedBy: varchar("reviewed_by").references(() => adminUsers.id), // Admin who reviewed
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"), // Admin notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProviderApplicationSchema = createInsertSchema(providerApplications).omit({
  id: true,
  createdAt: true,
});

export type InsertProviderApplication = z.infer<typeof insertProviderApplicationSchema>;
export type ProviderApplication = typeof providerApplications.$inferSelect;

// Referral Configuration table
export const referralConfig = pgTable("referral_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientReferralCommissionPercent: decimal("client_referral_commission_percent", { precision: 5, scale: 2 }).notNull().default("5.00"),
  ownerReferralCommissionPercent: decimal("owner_referral_commission_percent", { precision: 5, scale: 2 }).notNull().default("10.00"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralConfigSchema = createInsertSchema(referralConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReferralConfig = z.infer<typeof insertReferralConfigSchema>;
export type ReferralConfig = typeof referralConfig.$inferSelect;

// Client Referrals table
export const clientReferrals = pgTable("client_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: "set null" }),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email").notNull(),
  status: clientReferralStatusEnum("status").notNull().default("pendiente_confirmacion"),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }),
  commissionPaid: boolean("commission_paid").notNull().default(false),
  commissionPaidAt: timestamp("commission_paid_at"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  linkedLeadId: varchar("linked_lead_id").references(() => leads.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientReferralSchema = createInsertSchema(clientReferrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClientReferral = z.infer<typeof insertClientReferralSchema>;
export type ClientReferral = typeof clientReferrals.$inferSelect;

// Owner Referrals table
export const ownerReferrals = pgTable("owner_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: "set null" }),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  nationality: varchar("nationality"),
  phone: varchar("phone").notNull(),
  whatsappNumber: varchar("whatsapp_number"),
  email: varchar("email").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  propertyType: varchar("property_type").notNull(), // "private" or "condominium"
  condominiumName: varchar("condominium_name"),
  unitNumber: varchar("unit_number"),
  propertyAddress: text("property_address"),
  propertyDescription: text("property_description"),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  status: ownerReferralStatusEnum("status").notNull().default("pendiente_confirmacion"),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).notNull().default("20.00"),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }),
  commissionPaid: boolean("commission_paid").notNull().default(false),
  commissionPaidAt: timestamp("commission_paid_at"),
  adminApprovedById: varchar("admin_approved_by_id").references(() => users.id),
  adminApprovedAt: timestamp("admin_approved_at"),
  rejectedById: varchar("rejected_by_id").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  linkedOwnerId: varchar("linked_owner_id").references(() => users.id, { onDelete: "set null" }),
  linkedPropertyId: varchar("linked_property_id").references(() => properties.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOwnerReferralSchema = createInsertSchema(ownerReferrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOwnerReferral = z.infer<typeof insertOwnerReferralSchema>;
export type OwnerReferral = typeof ownerReferrals.$inferSelect;

// Rental Commission Configuration table
export const rentalCommissionConfigs = pgTable("rental_commission_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  defaultCommissionPercent: decimal("default_commission_percent", { precision: 5, scale: 2 }).notNull().default("10.00"),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }), // Override for specific property
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Override for specific user
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }),
  fixedFee: decimal("fixed_fee", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRentalCommissionConfigSchema = createInsertSchema(rentalCommissionConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRentalCommissionConfig = z.infer<typeof insertRentalCommissionConfigSchema>;
export type RentalCommissionConfig = typeof rentalCommissionConfigs.$inferSelect;

// Accountant Assignments table - defines which properties/users each accountant manages
export const accountantAssignments = pgTable("accountant_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountantId: varchar("accountant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignmentType: accountantAssignmentTypeEnum("assignment_type").notNull(),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }), // For property assignments
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // For user assignments
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"), // NULL means active indefinitely
  notes: text("notes"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAccountantAssignmentSchema = createInsertSchema(accountantAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAccountantAssignment = z.infer<typeof insertAccountantAssignmentSchema>;
export type AccountantAssignment = typeof accountantAssignments.$inferSelect;

// Payout Batches table - groups multiple income transactions for bulk payment processing
export const payoutBatches = pgTable("payout_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchNumber: varchar("batch_number").notNull().unique(), // e.g., "PAYOUT-2025-001"
  status: payoutStatusEnum("status").notNull().default("draft"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method"), // e.g., "bank_transfer", "check", "cash"
  paymentReference: varchar("payment_reference"), // Bank reference number, check number, etc.
  notes: text("notes"),
  scheduledPaymentDate: timestamp("scheduled_payment_date"),
  actualPaymentDate: timestamp("actual_payment_date"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidBy: varchar("paid_by").references(() => users.id),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPayoutBatchSchema = createInsertSchema(payoutBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPayoutBatch = z.infer<typeof insertPayoutBatchSchema>;
export type PayoutBatch = typeof payoutBatches.$inferSelect;

// Income Transactions table - unified table for all income types
export const incomeTransactions = pgTable("income_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: incomeCategoryEnum("category").notNull(),
  beneficiaryId: varchar("beneficiary_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Who receives the payment
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "set null" }), // Related property if applicable
  sourceReferralClientId: varchar("source_referral_client_id").references(() => clientReferrals.id, { onDelete: "set null" }), // For referral_client category
  sourceReferralOwnerId: varchar("source_referral_owner_id").references(() => ownerReferrals.id, { onDelete: "set null" }), // For referral_owner category
  sourceOfferId: varchar("source_offer_id").references(() => offers.id, { onDelete: "set null" }), // For rental_commission category
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }),
  description: text("description").notNull(),
  notes: text("notes"),
  payoutBatchId: varchar("payout_batch_id").references(() => payoutBatches.id, { onDelete: "set null" }),
  status: payoutStatusEnum("status").notNull().default("pending"),
  scheduledPaymentDate: timestamp("scheduled_payment_date"),
  actualPaymentDate: timestamp("actual_payment_date"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Performance indexes for frequently queried fields
  index("idx_income_transactions_beneficiary_id").on(table.beneficiaryId),
  index("idx_income_transactions_property_id").on(table.propertyId),
  index("idx_income_transactions_category").on(table.category),
  index("idx_income_transactions_status").on(table.status),
  index("idx_income_transactions_created_at").on(table.createdAt),
  // Composite indexes for common query patterns  
  index("idx_income_transactions_status_beneficiary").on(table.status, table.beneficiaryId),
  index("idx_income_transactions_category_status").on(table.category, table.status),
]);

export const insertIncomeTransactionSchema = createInsertSchema(incomeTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIncomeTransaction = z.infer<typeof insertIncomeTransactionSchema>;
export type IncomeTransaction = typeof incomeTransactions.$inferSelect;

// Changelogs table - tracks all system implementations and changes
export const changelogs = pgTable("changelogs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  version: varchar("version"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: changelogCategoryEnum("category").notNull(),
  implementedBy: varchar("implemented_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChangelogSchema = createInsertSchema(changelogs).omit({
  id: true,
  createdAt: true,
});

export type InsertChangelog = z.infer<typeof insertChangelogSchema>;
export type Changelog = typeof changelogs.$inferSelect;

// SLA Configurations table - Define SLAs for different processes
export const slaConfigurations = pgTable("sla_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  processName: varchar("process_name").notNull().unique(), // e.g., "lead_first_response", "contract_approval"
  targetMinutes: integer("target_minutes").notNull(), // Tiempo objetivo en minutos
  warningMinutes: integer("warning_minutes").notNull(), // Tiempo de advertencia antes del vencimiento
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSlaConfigurationSchema = createInsertSchema(slaConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSlaConfiguration = z.infer<typeof insertSlaConfigurationSchema>;
export type SlaConfiguration = typeof slaConfigurations.$inferSelect;

// Lead Scoring Rules table
export const leadScoringRules = pgTable("lead_scoring_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  criteriaField: varchar("criteria_field").notNull(), // e.g., "budget", "moveInDate", "source"
  criteriaOperator: varchar("criteria_operator").notNull(), // e.g., "greater_than", "equals", "contains"
  criteriaValue: text("criteria_value").notNull(),
  scorePoints: integer("score_points").notNull(), // Puntos a sumar/restar
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0), // Orden de evaluación
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeadScoringRuleSchema = createInsertSchema(leadScoringRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLeadScoringRule = z.infer<typeof insertLeadScoringRuleSchema>;
export type LeadScoringRule = typeof leadScoringRules.$inferSelect;

// Lead Scores table - calculated scores for leads
export const leadScores = pgTable("lead_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0), // Puntaje total
  quality: leadQualityEnum("quality").notNull(), // hot/warm/cold
  reasons: text("reasons").array().default(sql`ARRAY[]::text[]`), // Razones del score
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadScoreSchema = createInsertSchema(leadScores).omit({
  id: true,
  createdAt: true,
});

export type InsertLeadScore = z.infer<typeof insertLeadScoreSchema>;
export type LeadScore = typeof leadScores.$inferSelect;

// Contract Checklist Templates table
export const contractChecklistTemplates = pgTable("contract_checklist_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  contractType: varchar("contract_type").notNull(), // "rental", "sale"
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContractChecklistTemplateSchema = createInsertSchema(contractChecklistTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContractChecklistTemplate = z.infer<typeof insertContractChecklistTemplateSchema>;
export type ContractChecklistTemplate = typeof contractChecklistTemplates.$inferSelect;

// Contract Checklist Template Items table
export const contractChecklistTemplateItems = pgTable("contract_checklist_template_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => contractChecklistTemplates.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  requiredRole: userRoleEnum("required_role"), // Rol que debe completar este paso
  order: integer("order").notNull(), // Orden de ejecución
  isOptional: boolean("is_optional").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractChecklistTemplateItemSchema = createInsertSchema(contractChecklistTemplateItems).omit({
  id: true,
  createdAt: true,
});

export type InsertContractChecklistTemplateItem = z.infer<typeof insertContractChecklistTemplateItemSchema>;
export type ContractChecklistTemplateItem = typeof contractChecklistTemplateItems.$inferSelect;

// Contract Checklist Items table - Instance of checklist for a specific contract
export const contractChecklistItems = pgTable("contract_checklist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  templateItemId: varchar("template_item_id").references(() => contractChecklistTemplateItems.id),
  title: varchar("title").notNull(),
  description: text("description"),
  requiredRole: userRoleEnum("required_role"),
  order: integer("order").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedBy: varchar("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractChecklistItemSchema = createInsertSchema(contractChecklistItems).omit({
  id: true,
  createdAt: true,
});

export type InsertContractChecklistItem = z.infer<typeof insertContractChecklistItemSchema>;
export type ContractChecklistItem = typeof contractChecklistItems.$inferSelect;

// Rental Health Scores table
export const rentalHealthScores = pgTable("rental_health_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().unique().references(() => rentalContracts.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(100), // 0-100
  status: healthScoreStatusEnum("status").notNull(),
  // Factores que afectan el score
  paymentScore: integer("payment_score").notNull().default(100), // Basado en historial de pagos
  incidentScore: integer("incident_score").notNull().default(100), // Basado en incidentes reportados
  communicationScore: integer("communication_score").notNull().default(100), // Basado en respuesta en chats
  // Banderas de riesgo
  hasPaymentDelay: boolean("has_payment_delay").notNull().default(false),
  hasOpenIncidents: boolean("has_open_incidents").notNull().default(false),
  isNearExpiry: boolean("is_near_expiry").notNull().default(false), // < 90 días para expirar
  // Probabilidad de renovación
  renewalProbability: decimal("renewal_probability", { precision: 5, scale: 2 }), // 0-100%
  reasons: text("reasons").array().default(sql`ARRAY[]::text[]`),
  lastCalculatedAt: timestamp("last_calculated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRentalHealthScoreSchema = createInsertSchema(rentalHealthScores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRentalHealthScore = z.infer<typeof insertRentalHealthScoreSchema>;
export type RentalHealthScore = typeof rentalHealthScores.$inferSelect;

// Lead Response Metrics table
export const leadResponseMetrics = pgTable("lead_response_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  assignedTo: varchar("assigned_to").references(() => users.id),
  firstResponseAt: timestamp("first_response_at"),
  responseTimeMinutes: integer("response_time_minutes"), // Tiempo hasta primera respuesta
  slaTargetMinutes: integer("sla_target_minutes"),
  metSla: boolean("met_sla"), // Si cumplió o no el SLA
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadResponseMetricSchema = createInsertSchema(leadResponseMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertLeadResponseMetric = z.infer<typeof insertLeadResponseMetricSchema>;
export type LeadResponseMetric = typeof leadResponseMetrics.$inferSelect;

// Contract Cycle Metrics table
export const contractCycleMetrics = pgTable("contract_cycle_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  offerSubmittedAt: timestamp("offer_submitted_at"),
  contractCreatedAt: timestamp("contract_created_at"),
  ownerSignedAt: timestamp("owner_signed_at"),
  tenantSignedAt: timestamp("tenant_signed_at"),
  checkInAt: timestamp("check_in_at"),
  // Tiempos de ciclo en minutos
  offerToContractMinutes: integer("offer_to_contract_minutes"),
  contractToSignaturesMinutes: integer("contract_to_signatures_minutes"),
  signaturesToCheckInMinutes: integer("signatures_to_check_in_minutes"),
  totalCycleMinutes: integer("total_cycle_minutes"),
  slaTargetMinutes: integer("sla_target_minutes"),
  metSla: boolean("met_sla"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractCycleMetricSchema = createInsertSchema(contractCycleMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertContractCycleMetric = z.infer<typeof insertContractCycleMetricSchema>;
export type ContractCycleMetric = typeof contractCycleMetrics.$inferSelect;

// Workflow Events table - Log of automated events
export const workflowEvents = pgTable("workflow_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: workflowEventTypeEnum("event_type").notNull(),
  entityType: varchar("entity_type").notNull(), // "lead", "contract", "appointment", etc.
  entityId: varchar("entity_id").notNull(),
  triggeredBy: varchar("triggered_by").references(() => users.id), // Usuario que disparó el evento (null si automático)
  metadata: jsonb("metadata"), // Datos adicionales del evento
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkflowEventSchema = createInsertSchema(workflowEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflowEvent = z.infer<typeof insertWorkflowEventSchema>;
export type WorkflowEvent = typeof workflowEvents.$inferSelect;

// System Alerts table - Automated alerts for users
export const systemAlerts = pgTable("system_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  priority: alertPriorityEnum("priority").notNull().default("medium"),
  status: alertStatusEnum("status").notNull().default("pending"),
  alertType: varchar("alert_type").notNull(), // "sla_warning", "task_overdue", "payment_due", etc.
  relatedEntityType: varchar("related_entity_type"), // "lead", "contract", "task", etc.
  relatedEntityId: varchar("related_entity_id"),
  actionUrl: varchar("action_url"), // URL para resolver la alerta
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  dismissedAt: timestamp("dismissed_at"),
  expiresAt: timestamp("expires_at"), // Las alertas pueden expirar automáticamente
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true,
});

export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
export type SystemAlert = typeof systemAlerts.$inferSelect;

// Error Log Type Enum
export const errorLogTypeEnum = pgEnum("error_log_type", [
  "frontend_error",
  "api_error",
  "console_error",
  "unhandled_rejection",
]);

// Error Log Status Enum
export const errorLogStatusEnum = pgEnum("error_log_status", [
  "new",
  "investigating",
  "resolved",
  "dismissed",
]);

// Error Logs table - Automatic error tracking and reporting
export const errorLogs = pgTable("error_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  userEmail: varchar("user_email"), // Store email in case user is deleted
  userRole: varchar("user_role"), // Store role for context
  errorType: errorLogTypeEnum("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  errorStack: text("error_stack"), // Stack trace
  errorCode: varchar("error_code"), // HTTP status code or custom error code
  url: varchar("url"), // URL where error occurred
  userAgent: text("user_agent"), // Browser/device info
  componentStack: text("component_stack"), // React component stack
  additionalInfo: jsonb("additional_info"), // Any extra context
  status: errorLogStatusEnum("status").notNull().default("new"),
  reportedByUser: boolean("reported_by_user").notNull().default(false), // If user manually reported
  userComment: text("user_comment"), // User's description if they reported it
  assignedTo: varchar("assigned_to").references(() => users.id), // Admin assigned to fix
  resolutionNotes: text("resolution_notes"), // How it was resolved
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;

// Commission Advances (Sistema de Adelantos de Comisión)
export const commissionAdvanceStatusEnum = pgEnum("commission_advance_status", [
  "pending",
  "approved",
  "rejected",
  "paid",
]);

export const commissionAdvances = pgTable("commission_advances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: commissionAdvanceStatusEnum("status").notNull().default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommissionAdvanceSchema = createInsertSchema(commissionAdvances).omit({
  id: true,
  createdAt: true,
});

export type InsertCommissionAdvance = z.infer<typeof insertCommissionAdvanceSchema>;
export type CommissionAdvance = typeof commissionAdvances.$inferSelect;

// Service Favorites (Favoritos de Proveedores de Servicios)
export const serviceFavorites = pgTable("service_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  providerId: varchar("provider_id").notNull().references(() => serviceProviders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("unique_user_provider").on(table.userId, table.providerId),
]);

export const insertServiceFavoriteSchema = createInsertSchema(serviceFavorites).omit({
  id: true,
  createdAt: true,
});

export type InsertServiceFavorite = z.infer<typeof insertServiceFavoriteSchema>;
export type ServiceFavorite = typeof serviceFavorites.$inferSelect;

// Predictive Analytics (Análisis Predictivo con OpenAI)
export const predictiveAnalyticTypeEnum = pgEnum("predictive_analytic_type", [
  "rental_probability", // Probabilidad de rentarse
  "price_recommendation", // Recomendación de precio
  "market_trend", // Tendencia de mercado
  "churn_risk", // Riesgo de abandono
]);

export const predictiveAnalytics = pgTable("predictive_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").references(() => properties.id),
  type: predictiveAnalyticTypeEnum("type").notNull(),
  prediction: jsonb("prediction").notNull(), // Datos de predicción de OpenAI
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100%
  recommendedAction: text("recommended_action"),
  factors: jsonb("factors"), // Factores que influyen en la predicción
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPredictiveAnalyticSchema = createInsertSchema(predictiveAnalytics).omit({
  id: true,
  createdAt: true,
});

export type InsertPredictiveAnalytic = z.infer<typeof insertPredictiveAnalyticSchema>;
export type PredictiveAnalytic = typeof predictiveAnalytics.$inferSelect;

// Marketing Campaigns (Campañas de Marketing Automatizadas)
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "active",
  "paused",
  "completed",
]);

export const campaignTypeEnum = pgEnum("campaign_type", [
  "email", // Email marketing
  "push", // Notificaciones push
  "social", // Redes sociales
]);

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: campaignTypeEnum("type").notNull(),
  status: campaignStatusEnum("status").notNull().default("draft"),
  targetAudience: jsonb("target_audience").notNull(), // Criterios de segmentación
  content: jsonb("content").notNull(), // Contenido de la campaña
  schedule: jsonb("schedule"), // Programación automática
  sentCount: integer("sent_count").notNull().default(0),
  openCount: integer("open_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  conversionCount: integer("conversion_count").notNull().default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  createdAt: true,
});

export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;

// Maintenance Schedules (Calendario de Mantenimiento Preventivo)
export const maintenanceFrequencyEnum = pgEnum("maintenance_frequency", [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
]);

export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  title: text("title").notNull(),
  description: text("description"),
  frequency: maintenanceFrequencyEnum("frequency").notNull(),
  lastCompleted: timestamp("last_completed"),
  nextDue: timestamp("next_due").notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  assignedTo: varchar("assigned_to").references(() => users.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedules).omit({
  id: true,
  createdAt: true,
});

export type InsertMaintenanceSchedule = z.infer<typeof insertMaintenanceScheduleSchema>;
export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;

// Legal Documents (Documentos Legales Auto-generados con OpenAI)
export const legalDocumentTypeEnum = pgEnum("legal_document_type", [
  "rental_contract", // Contrato de renta
  "sale_contract", // Contrato de venta
  "service_agreement", // Acuerdo de servicio
  "lease_renewal", // Renovación de contrato
  "termination_notice", // Aviso de terminación
]);

export const legalDocumentStatusEnum = pgEnum("legal_document_status", [
  "draft",
  "pending_review",
  "approved",
  "signed",
  "active",
  "expired",
]);

export const legalDocuments = pgTable("legal_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: legalDocumentTypeEnum("type").notNull(),
  propertyId: varchar("property_id").references(() => properties.id),
  parties: jsonb("parties").notNull(), // Partes involucradas
  content: text("content").notNull(), // Contenido generado por OpenAI
  metadata: jsonb("metadata"), // Términos clave extraídos
  status: legalDocumentStatusEnum("status").notNull().default("draft"),
  generatedBy: varchar("generated_by").notNull().references(() => users.id),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  signedBy: jsonb("signed_by"), // Array de firmas digitales
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLegalDocumentSchema = createInsertSchema(legalDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLegalDocument = z.infer<typeof insertLegalDocumentSchema>;
export type LegalDocument = typeof legalDocuments.$inferSelect;

// Tenant Screenings (Screening Automático de Inquilinos con OpenAI)
export const screeningStatusEnum = pgEnum("screening_status", [
  "pending",
  "in_progress",
  "completed",
  "approved",
  "rejected",
]);

export const riskLevelEnum = pgEnum("risk_level", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const tenantScreenings = pgTable("tenant_screenings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => rentalApplications.id),
  applicantId: varchar("applicant_id").notNull().references(() => users.id),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  status: screeningStatusEnum("status").notNull().default("pending"),
  riskScore: decimal("risk_score", { precision: 5, scale: 2 }), // 0-100
  riskLevel: riskLevelEnum("risk_level"),
  aiAnalysis: jsonb("ai_analysis"), // Análisis completo de OpenAI
  fraudDetection: jsonb("fraud_detection"), // Detección de fraude
  incomeVerification: jsonb("income_verification"),
  creditAnalysis: jsonb("credit_analysis"),
  rentalHistory: jsonb("rental_history"),
  recommendations: text("recommendations"),
  flags: jsonb("flags"), // Banderas rojas detectadas
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertTenantScreeningSchema = createInsertSchema(tenantScreenings).omit({
  id: true,
  createdAt: true,
});

export type InsertTenantScreening = z.infer<typeof insertTenantScreeningSchema>;
export type TenantScreening = typeof tenantScreenings.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties, { relationName: "owner" }),
  managedProperties: many(properties, { relationName: "manager" }),
  appointments: many(appointments, { relationName: "client" }),
  conciergeAppointments: many(appointments, { relationName: "concierge" }),
  presentationCards: many(presentationCards),
  offers: many(offers),
  permissions: many(permissions),
  serviceProvider: many(serviceProviders),
  staffAssignments: many(propertyStaff),
  budgets: many(budgets),
  assignedTasks: many(tasks),
  workReports: many(workReports),
  auditLogs: many(auditLogs),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
    relationName: "owner",
  }),
  manager: one(users, {
    fields: [properties.managementId],
    references: [users.id],
    relationName: "manager",
  }),
  appointments: many(appointments),
  offers: many(offers),
  staff: many(propertyStaff),
  budgets: many(budgets),
  tasks: many(tasks),
  documents: many(propertyDocuments),
}));

export const propertyDocumentsRelations = relations(propertyDocuments, ({ one }) => ({
  property: one(properties, {
    fields: [propertyDocuments.propertyId],
    references: [properties.id],
  }),
  validator: one(users, {
    fields: [propertyDocuments.validatedBy],
    references: [users.id],
  }),
}));

export const propertyStaffRelations = relations(propertyStaff, ({ one }) => ({
  property: one(properties, {
    fields: [propertyStaff.propertyId],
    references: [properties.id],
  }),
  staff: one(users, {
    fields: [propertyStaff.staffId],
    references: [users.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  property: one(properties, {
    fields: [appointments.propertyId],
    references: [properties.id],
  }),
  client: one(users, {
    fields: [appointments.clientId],
    references: [users.id],
    relationName: "client",
  }),
  concierge: one(users, {
    fields: [appointments.conciergeId],
    references: [users.id],
    relationName: "concierge",
  }),
}));

export const presentationCardsRelations = relations(presentationCards, ({ one }) => ({
  client: one(users, {
    fields: [presentationCards.clientId],
    references: [users.id],
  }),
}));

export const serviceProvidersRelations = relations(serviceProviders, ({ one, many }) => ({
  user: one(users, {
    fields: [serviceProviders.userId],
    references: [users.id],
  }),
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  provider: one(serviceProviders, {
    fields: [services.providerId],
    references: [serviceProviders.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  property: one(properties, {
    fields: [offers.propertyId],
    references: [properties.id],
  }),
  client: one(users, {
    fields: [offers.clientId],
    references: [users.id],
  }),
  appointment: one(appointments, {
    fields: [offers.appointmentId],
    references: [appointments.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  user: one(users, {
    fields: [permissions.userId],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  property: one(properties, {
    fields: [budgets.propertyId],
    references: [properties.id],
  }),
  staff: one(users, {
    fields: [budgets.staffId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  property: one(properties, {
    fields: [tasks.propertyId],
    references: [properties.id],
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
  }),
  budget: one(budgets, {
    fields: [tasks.budgetId],
    references: [budgets.id],
  }),
  workReports: many(workReports),
}));

export const workReportsRelations = relations(workReports, ({ one }) => ({
  task: one(tasks, {
    fields: [workReports.taskId],
    references: [tasks.id],
  }),
  staff: one(users, {
    fields: [workReports.staffId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

export const ownerReferralsRelations = relations(ownerReferrals, ({ one }) => ({
  referrer: one(users, {
    fields: [ownerReferrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  linkedProperty: one(properties, {
    fields: [ownerReferrals.linkedPropertyId],
    references: [properties.id],
  }),
  adminApprovedBy: one(users, {
    fields: [ownerReferrals.adminApprovedById],
    references: [users.id],
    relationName: "adminApprover",
  }),
  rejectedBy: one(users, {
    fields: [ownerReferrals.rejectedById],
    references: [users.id],
    relationName: "rejector",
  }),
  linkedOwner: one(users, {
    fields: [ownerReferrals.linkedOwnerId],
    references: [users.id],
    relationName: "linkedOwner",
  }),
}));
