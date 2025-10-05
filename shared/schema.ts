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

export const condominiumApprovalStatusEnum = pgEnum("condominium_approval_status", [
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

export const notificationTypeEnum = pgEnum("notification_type", [
  "appointment",
  "offer",
  "message",
  "property_update",
  "system",
  "rental_update",
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
  "aprobado",                // Approved as owner
  "rechazado",               // Rejected
  "activo",                  // Active (property published)
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
  preferredLanguage: z.enum(["es", "en"]).default("es"),
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
  area: decimal("area", { precision: 8, scale: 2 }).notNull(),
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
  active: boolean("active").notNull().default(true),
  published: boolean("published").notNull().default(false), // Solo publicada si está aprobada
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  allowsSubleasing: boolean("allows_subleasing").notNull().default(false),
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
  customListingTitle: z.string().max(60, "El título personalizado no puede exceder 60 caracteres").optional(),
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Colonies table
export const colonies = pgTable("colonies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  active: boolean("active").notNull().default(true),
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

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
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
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  isBot: boolean("is_bot").notNull().default(false), // Indicates if this is a chatbot conversation
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
  status: propertySubmissionStatusEnum("status").notNull().default("draft"),
  currentStep: integer("current_step").notNull().default(1),
  // Property data stored as JSON (will be converted to property record when submitted)
  basicInfo: jsonb("basic_info"), // title, description, propertyType, price, etc.
  locationInfo: jsonb("location_info"), // location, address details
  details: jsonb("details"), // bedrooms, bathrooms, area, amenities
  media: jsonb("media"), // images, videos, virtualTourUrl
  commercialTerms: jsonb("commercial_terms"), // rental/sale specific terms
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
  propertyType: varchar("property_type").notNull(), // "private" or "condominium"
  condominiumName: varchar("condominium_name"),
  unitNumber: varchar("unit_number"),
  status: ownerReferralStatusEnum("status").notNull().default("pendiente_confirmacion"),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }),
  commissionPaid: boolean("commission_paid").notNull().default(false),
  commissionPaidAt: timestamp("commission_paid_at"),
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
