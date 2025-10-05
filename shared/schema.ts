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

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
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

export const roleRequestStatusEnum = pgEnum("role_request_status", [
  "pending",
  "approved",
  "rejected",
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

export const changeRequestStatusEnum = pgEnum("change_request_status", [
  "pending",   // Pendiente de revisión
  "approved",  // Aprobado
  "rejected",  // Rechazado
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

// Users table (required for Replit Auth + extended fields)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("cliente"),
  additionalRole: userRoleEnum("additional_role"),
  status: userStatusEnum("status").notNull().default("approved"),
  phone: varchar("phone"),
  emailVerified: boolean("email_verified").notNull().default(false),
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

// Admin users table for local authentication
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: userRoleEnum("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
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

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
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
  reason: text("reason"),
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
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).notNull(),
  area: decimal("area", { precision: 8, scale: 2 }).notNull(),
  location: text("location").notNull(),
  status: propertyStatusEnum("status").notNull(),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  videos: text("videos").array().default(sql`ARRAY[]::text[]`), // URLs de videos
  virtualTourUrl: text("virtual_tour_url"), // Link de tour 360
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  specifications: jsonb("specifications"),
  accessInfo: jsonb("access_info"), // lockboxCode, contactPerson, contactPhone
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  managementId: varchar("management_id").references(() => users.id),
  approvalStatus: propertyApprovalStatusEnum("approval_status").notNull().default("draft"),
  active: boolean("active").notNull().default(true),
  published: boolean("published").notNull().default(false), // Solo publicada si está aprobada
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const accessInfoSchema = z.object({
  lockboxCode: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
}).optional();

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  accessInfo: accessInfoSchema,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Property staff assignment table
export const propertyStaff = pgTable(
  "property_staff",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    staffId: varchar("staff_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role").notNull(), // cleaning, maintenance, concierge, accounting, legal
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique().on(table.propertyId, table.staffId, table.role),
  ]
);

export const insertPropertyStaffSchema = createInsertSchema(propertyStaff).omit({
  id: true,
  createdAt: true,
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
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  notes: text("notes"),
  propertyInterests: text("property_interests").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

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
  status: appointmentStatusEnum("status").notNull().default("pending"),
  ownerApprovalStatus: ownerApprovalStatusEnum("owner_approval_status").notNull().default("pending"),
  ownerApprovedAt: timestamp("owner_approved_at"),
  meetLink: text("meet_link"),
  googleEventId: text("google_event_id"),
  notes: text("notes"),
  conciergeReport: text("concierge_report"), // Report after appointment
  accessIssues: text("access_issues"), // Access problems reported
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Client presentation cards table
export const presentationCards = pgTable("presentation_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyType: text("property_type").notNull(),
  modality: propertyStatusEnum("modality").notNull(),
  minPrice: decimal("min_price", { precision: 12, scale: 2 }).notNull(),
  maxPrice: decimal("max_price", { precision: 12, scale: 2 }).notNull(),
  location: text("location").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  additionalRequirements: text("additional_requirements"),
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
  price: z.string().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  area: z.number().optional(),
  location: z.string().optional(),
  amenities: z.array(z.string()).optional(),
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
