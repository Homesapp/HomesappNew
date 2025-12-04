import { sql, relations } from "drizzle-orm";
import {
  index,
  uniqueIndex,
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
  date,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Generic paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

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
  "hoa_manager",
  "external_agency_admin",
  "external_agency_accounting",
  "external_agency_maintenance",
  "external_agency_staff",
  "external_agency_seller",
  "external_agency_concierge", // Conserje de agencia externa - recibe citas
  "external_agency_lawyer", // Abogado de agencia externa - elabora contratos
  "tenant", // Inquilino con acceso al portal
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
  "reglas_internas",
  "reglamento_condominio",
  "comprobante_no_adeudo",
  // Persona Moral
  "acta_constitutiva",
  "poder_notarial",
  "identificacion_representante",
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
  "cita_agendada",
  "visita_completada",
  "oferta_enviada",
  "en_negociacion",
  "contrato_firmado",
  "ganado",
  "perdido",
]);

export const unitTypeEnum = pgEnum("unit_type", [
  "departamento",
  "casa",
  "estudio",
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

export const serviceTypeEnum = pgEnum("service_type", [
  "rent",            // Renta
  "electricity",     // Luz
  "water",           // Agua
  "internet",        // Internet
  "gas",             // Gas
  "maintenance",     // Mantenimiento
  "hoa",             // Pago HOA/Condominio
  "special",         // Pago especial
  "other",           // Otro
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
  "cleaning",        // Limpieza
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

// External Management System Enums
export const externalPropertyStatusEnum = pgEnum("external_property_status", [
  "active",       // Activa
  "inactive",     // Inactiva
  "rented",       // Rentada
  "linked",       // Vinculada a propiedad real del sistema
]);

export const externalContractStatusEnum = pgEnum("external_contract_status", [
  "pending_validation",   // Pendiente de validación de documentos
  "documents_validated",  // Documentos validados, pendiente de contrato elaborado
  "contract_uploaded",    // Contrato elaborado subido
  "active",               // Activo
  "completed",            // Completado
  "cancelled",            // Cancelado
]);

export const rentalPurposeEnum = pgEnum("rental_purpose", [
  "living",       // Para vivir
  "sublease",     // Para subarrendar
]);

export const rentalNoteTypeEnum = pgEnum("rental_note_type", [
  "general",      // Nota general
  "incident",     // Incidente
  "reminder",     // Recordatorio
  "inspection",   // Inspección
  "complaint",    // Queja
  "maintenance",  // Mantenimiento programado
  "violation",    // Violación de contrato
]);

export const rentalNoteSeverityEnum = pgEnum("rental_note_severity", [
  "info",         // Informativa
  "low",          // Baja
  "medium",       // Media
  "high",          // Alta
  "critical",     // Crítica
]);

export const unitTypologyEnum = pgEnum("unit_typology", [
  "estudio",
  "estudio_plus",
  "1_recamara",
  "2_recamaras",
  "3_recamaras",
  "loft_mini",
  "loft_normal",
  "loft_plus",
]);

export const unitFloorTypeEnum = pgEnum("unit_floor_type", [
  "planta_baja",
  "primer_piso",
  "segundo_piso",
  "tercer_piso",
  "penthouse",
]);

export const externalPaymentStatusEnum = pgEnum("external_payment_status", [
  "pending",      // Pendiente
  "paid",         // Pagado
  "overdue",      // Atrasado
  "cancelled",    // Cancelado
]);

export const externalTicketStatusEnum = pgEnum("external_ticket_status", [
  "open",         // Abierto
  "in_progress",  // En progreso
  "resolved",     // Resuelto
  "closed",       // Cerrado
  "on_hold",      // En espera
]);

export const externalTicketPriorityEnum = pgEnum("external_ticket_priority", [
  "low",          // Baja
  "medium",       // Media
  "high",         // Alta
  "urgent",       // Urgente
]);

export const maintenanceUpdateTypeEnum = pgEnum("maintenance_update_type", [
  "comment",          // Comentario general
  "status_change",    // Cambio de estado
  "assignment",       // Asignación de trabajador
  "cost_update",      // Actualización de costo
  "schedule_change",  // Cambio de programación
  "completion",       // Nota de completación
]);

export const maintenancePhotoPhaseEnum = pgEnum("maintenance_photo_phase", [
  "before",   // Antes del trabajo
  "during",   // Durante el trabajo
  "after",    // Después del trabajo
  "other",    // Otra
]);

export const clientDocumentTypeEnum = pgEnum("client_document_type", [
  "passport",
  "id_card",
  "drivers_license",
  "visa",
  "other"
]);

export const clientIncidentSeverityEnum = pgEnum("client_incident_severity", [
  "low",
  "medium",
  "high",
  "critical"
]);

export const clientIncidentStatusEnum = pgEnum("client_incident_status", [
  "open",
  "in_progress",
  "resolved",
  "closed"
]);

export const leadRegistrationTypeEnum = pgEnum("lead_registration_type", [
  "broker", // Broker externo - solo últimos 4 dígitos del teléfono
  "seller", // Vendedor interno - datos completos
  "client"  // Cliente - registro público de requisitos del cliente
]);

export const externalLeadStatusEnum = pgEnum("external_lead_status", [
  "nuevo_lead",           // Nuevo lead recién registrado
  "cita_coordinada",      // Cita coordinada con el lead
  "interesado",           // Lead mostró interés
  "oferta_enviada",       // Oferta de renta enviada al lead
  "oferta_completada",    // Lead completó la oferta de renta
  "formato_enviado",      // Formato de inquilino enviado
  "formato_completado",   // Lead completó el formato de inquilino
  "proceso_renta",        // En proceso de renta (firma de contrato)
  "renta_concretada",     // Renta completada exitosamente
  "perdido",              // Lead perdido (no interesado)
  "muerto"                // Lead sin respuesta
]);

export const financialTransactionDirectionEnum = pgEnum("financial_transaction_direction", [
  "inflow",       // Dinero que entra (cobros)
  "outflow",      // Dinero que sale (pagos)
]);

export const financialTransactionCategoryEnum = pgEnum("financial_transaction_category", [
  "rent_income",          // Ingreso por renta
  "rent_payout",          // Pago de renta a propietario
  "hoa_fee",              // Cuota de HOA (cobro a propietario)
  "maintenance_charge",   // Cargo por reparación (a propietario o inquilino)
  "service_electricity",  // Cargo por electricidad
  "service_water",        // Cargo por agua
  "service_internet",     // Cargo por internet
  "service_gas",          // Cargo por gas
  "service_other",        // Otro servicio
  "adjustment",           // Ajuste contable
]);

export const externalQuotationStatusEnum = pgEnum("external_quotation_status", [
  "draft",                  // Borrador
  "sent",                   // Enviada
  "approved",               // Aprobada
  "rejected",               // Rechazada
  "converted_to_ticket",    // Convertida a ticket
  "cancelled",              // Cancelada
]);

export const externalTermsTypeEnum = pgEnum("external_terms_type", [
  "tenant", // Términos para inquilinos
  "owner",  // Términos para propietarios
]);

export const financialTransactionStatusEnum = pgEnum("financial_transaction_status", [
  "pending",      // Pendiente
  "posted",       // Contabilizado/Procesado
  "reconciled",   // Conciliado
  "cancelled",    // Cancelado
]);

export const financialTransactionRoleEnum = pgEnum("financial_transaction_role", [
  "tenant",       // Inquilino
  "owner",        // Propietario
  "agency",       // Agencia
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
  "opportunity",
  "role_approved",
  "role_rejected",
  "hoa_announcement",
  "contract_update",
  "payment_reminder",
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

// External Maintenance Specialties Enum
export const maintenanceSpecialtyEnum = pgEnum("maintenance_specialty", [
  "encargado_mantenimiento", // Supervisor/Manager
  "mantenimiento_general", // General Maintenance
  "electrico", // Electrician
  "plomero", // Plumber
  "refrigeracion", // HVAC/Refrigeration
  "carpintero", // Carpenter
  "pintor", // Painter
  "jardinero", // Gardener
  "albanil", // Mason
  "limpieza", // Cleaning
]);

// Users table (required for Replit Auth + extended fields)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  requirePasswordChange: boolean("require_password_change").notNull().default(false),
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
  assignedToUser: varchar("assigned_to_user"),
  maintenanceSpecialty: maintenanceSpecialtyEnum("maintenance_specialty"), // Specialty for external_agency_maintenance role
  googleCalendarEmail: varchar("google_calendar_email"), // Google Calendar email for automatic sync of assigned tasks
  externalAgencyId: varchar("external_agency_id"), // External agency this user belongs to (for multi-tenancy)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
}).partial({ role: true });

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
  yearsOfExperience: z.coerce.number().min(0).optional(),
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

// Set temporary password schema (admin only)
export const setTemporaryPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  temporaryPassword: z.string().min(8, "Temporary password must be at least 8 characters"),
});

export type SetTemporaryPassword = z.infer<typeof setTemporaryPasswordSchema>;

// Change password schema (user)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ChangePassword = z.infer<typeof changePasswordSchema>;

// Force password change schema (first time users)
export const forcePasswordChangeSchema = z.object({
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ForcePasswordChange = z.infer<typeof forcePasswordChangeSchema>;

// Properties table
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  status: propertyStatusEnum("status").notNull(),
  unitType: text("unit_type").notNull().default("private"),
  condominiumId: varchar("condominium_id").notNull().references(() => condominiums.id),
  condoName: text("condo_name"),
  unitNumber: text("unit_number").notNull(),
  showCondoInListing: boolean("show_condo_in_listing").notNull().default(true),
  showUnitNumberInListing: boolean("show_unit_number_in_listing").notNull().default(true),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  primaryImages: text("primary_images").array().default(sql`ARRAY[]::text[]`), // 5 fotos principales max
  coverImageIndex: integer("cover_image_index").default(0), // Índice de la foto de portada en primaryImages
  secondaryImages: text("secondary_images").array().default(sql`ARRAY[]::text[]`), // 20 fotos secundarias max
  videos: text("videos").array().default(sql`ARRAY[]::text[]`), // URLs de videos
  virtualTourUrl: text("virtual_tour_url"), // Link de tour 360
  requestVirtualTour: boolean("request_virtual_tour").default(false), // Solicitud de creación de tour 360
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
  // Datos privados del propietario real
  ownerFirstName: text("owner_first_name"), // Nombre del propietario
  ownerLastName: text("owner_last_name"), // Apellidos del propietario
  ownerPhone: varchar("owner_phone", { length: 20 }), // Teléfono WhatsApp del propietario
  ownerEmail: varchar("owner_email", { length: 255 }), // Email del propietario (opcional)
  // Datos del referido (quien trajo al propietario)
  referredByName: text("referred_by_name"), // Nombre del referido
  referredByLastName: text("referred_by_last_name"), // Apellidos del referido
  referredByPhone: varchar("referred_by_phone", { length: 20 }), // Teléfono WhatsApp del referido
  referredByEmail: varchar("referred_by_email", { length: 255 }), // Email del referido (opcional)
  // Link to external unit (if synced from external system)
  externalUnitId: varchar("external_unit_id"), // ID de la unidad externa (si fue sincronizada)
  externalAgencyId: varchar("external_agency_id"), // ID de la agencia externa origen
  externalAgencyName: varchar("external_agency_name", { length: 255 }), // Nombre de la agencia para mostrar en UI
  externalAgencyLogoUrl: text("external_agency_logo_url"), // Logo de la agencia para mostrar en UI
  slug: text("slug").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Performance indexes for frequently queried fields
  index("idx_properties_status").on(table.status),
  index("idx_properties_owner_id").on(table.ownerId),
  index("idx_properties_active").on(table.active),
  index("idx_properties_created_at").on(table.createdAt),
  index("idx_properties_approval_status").on(table.approvalStatus),
  index("idx_properties_featured").on(table.featured),
  index("idx_properties_rating").on(table.rating),
  index("idx_properties_colony_name").on(table.colonyName),
  index("idx_properties_condo_name").on(table.condoName),
  index("idx_properties_property_type").on(table.propertyType),
  index("idx_properties_slug").on(table.slug),
  // Composite indexes for common query patterns
  index("idx_properties_active_status").on(table.active, table.status),
  index("idx_properties_active_published").on(table.active, table.published),
  index("idx_properties_published_featured").on(table.published, table.featured, table.rating),
  index("idx_properties_external_unit").on(table.externalUnitId),
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

// Property Notes (Internal Annotations) table
export const propertyNotes = pgTable("property_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertyNoteSchema = createInsertSchema(propertyNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyNote = z.infer<typeof insertPropertyNoteSchema>;
export type PropertyNote = typeof propertyNotes.$inferSelect;

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
  slug: text("slug").unique(),
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
  email: varchar("email"), // Ya no es obligatorio
  phone: varchar("phone").notNull(), // WhatsApp obligatorio
  status: leadStatusEnum("status").notNull().default("nuevo"),
  source: text("source").array().default(sql`ARRAY[]::text[]`), // Multi-select: web, referido, llamada, evento, carga manual, etc
  registeredById: varchar("registered_by_id").notNull().references(() => users.id), // Vendedor que registró el lead
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  userId: varchar("user_id").references(() => users.id), // Usuario creado para este lead (después de confirmación)
  budget: decimal("budget", { precision: 12, scale: 2 }).notNull(), // Campo obligatorio
  notes: text("notes"),
  propertyInterests: text("property_interests").array().default(sql`ARRAY[]::text[]`), // Multi-select
  // Campos adicionales para registro completo de leads (todos multi-select)
  contractDuration: text("contract_duration").array().default(sql`ARRAY[]::text[]`), // Multi-select: "6 meses", "1 año", etc
  moveInDate: text("move_in_date").array().default(sql`ARRAY[]::text[]`), // Multi-select: "Noviembre", "finales de octubre", etc
  pets: varchar("pets"), // Mascotas (ej: "un perro", "No", "Si")
  bedrooms: text("bedrooms").array().default(sql`ARRAY[]::text[]`), // Multi-select: "1", "2", "3", "Studio", etc
  zoneOfInterest: text("zone_of_interest").array().default(sql`ARRAY[]::text[]`), // Multi-select: "Veleta", "Aldea Zama", etc (renamed from areaOfInterest)
  unitType: text("unit_type").array().default(sql`ARRAY[]::text[]`), // Multi-select: "Departamento", "Casa", "Studio", etc
  emailVerified: boolean("email_verified").notNull().default(false), // Si el lead confirmó su email
  validUntil: timestamp("valid_until").notNull(), // Fecha de expiración del lead (3 meses por defecto)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
    registeredById: true,
    validUntil: true,
  })
  .extend({
    firstName: z.string().min(1, "El nombre es obligatorio"),
    lastName: z.string().min(1, "El apellido es obligatorio"),
    phone: z.string().min(1, "El teléfono es obligatorio"),
    budget: z.string().min(1, "El presupuesto es obligatorio"),
  });

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Lead History - audit log de cambios en leads
export const leadHistory = pgTable("lead_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  action: varchar("action").notNull(), // "created", "updated", "status_changed", "assigned", "deleted"
  field: varchar("field"), // Campo que cambió (ej: "status", "assignedToId")
  oldValue: text("old_value"), // Valor anterior
  newValue: text("new_value"), // Valor nuevo
  userId: varchar("user_id").notNull().references(() => users.id), // Usuario que realizó el cambio
  description: text("description"), // Descripción del cambio
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadHistorySchema = createInsertSchema(leadHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertLeadHistory = z.infer<typeof insertLeadHistorySchema>;
export type LeadHistory = typeof leadHistory.$inferSelect;

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
  
  // Servicios incluidos en el contrato
  includedServices: jsonb("included_services"), // Array de servicios: ["electricity", "water", "internet", "gas"]
  
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

// Contract Tenant Info table - Información del formato de renta del inquilino
export const contractTenantInfo = pgTable("contract_tenant_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalContractId: varchar("rental_contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  
  // Datos Generales del Arrendatario
  fullName: text("full_name").notNull(),
  address: text("address"),
  nationality: varchar("nationality"),
  age: integer("age"),
  timeInTulum: varchar("time_in_tulum"),
  occupation: text("occupation"),
  company: text("company"),
  workplaceAddress: text("workplace_address"),
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }),
  companyTenure: varchar("company_tenure"),
  maritalStatus: varchar("marital_status"),
  whatsappNumber: varchar("whatsapp_number"),
  cellNumber: varchar("cell_number"),
  email: text("email"),
  idType: varchar("id_type"),
  idNumber: varchar("id_number"),
  checkInDate: timestamp("check_in_date"),
  numberOfTenants: integer("number_of_tenants"),
  paymentMethod: varchar("payment_method"),
  hasPets: boolean("has_pets").default(false),
  petDescription: text("pet_description"),
  propertyToRent: text("property_to_rent"),
  condominiumAndUnit: text("condominium_and_unit"),
  
  // Datos del Garante
  guarantorName: text("guarantor_name"),
  guarantorAddress: text("guarantor_address"),
  guarantorBirthInfo: text("guarantor_birth_info"),
  guarantorNationality: varchar("guarantor_nationality"),
  guarantorAge: integer("guarantor_age"),
  guarantorTimeInTulum: varchar("guarantor_time_in_tulum"),
  guarantorOccupation: text("guarantor_occupation"),
  guarantorCompany: text("guarantor_company"),
  guarantorWorkAddress: text("guarantor_work_address"),
  guarantorWorkPhone: varchar("guarantor_work_phone"),
  guarantorMaritalStatus: varchar("guarantor_marital_status"),
  guarantorLandline: varchar("guarantor_landline"),
  guarantorCell: varchar("guarantor_cell"),
  guarantorEmail: text("guarantor_email"),
  guarantorIdNumber: varchar("guarantor_id_number"),
  
  // Referencias del Arrendamiento Anterior
  previousLandlordName: text("previous_landlord_name"),
  previousLandlordCell: varchar("previous_landlord_cell"),
  previousLandlordAddress: text("previous_landlord_address"),
  previousTenancyDuration: varchar("previous_tenancy_duration"),
  
  // Referencias Laborales
  directBossName: text("direct_boss_name"),
  companyNameAddress: text("company_name_address"),
  companyLandline: varchar("company_landline"),
  companyManagerCell: varchar("company_manager_cell"),
  
  // Referencias No Familiares
  reference1Name: text("reference1_name"),
  reference1Address: text("reference1_address"),
  reference1Landline: varchar("reference1_landline"),
  reference1Cell: varchar("reference1_cell"),
  reference2Name: text("reference2_name"),
  reference2Address: text("reference2_address"),
  reference2Landline: varchar("reference2_landline"),
  reference2Cell: varchar("reference2_cell"),
  
  // Documentos Subidos (URLs)
  idDocumentUrl: text("id_document_url"),
  proofOfAddressUrl: text("proof_of_address_url"),
  solvencyDocumentsUrl: text("solvency_documents_url").array(),
  guarantorIdUrl: text("guarantor_id_url"),
  guarantorProofAddressUrl: text("guarantor_proof_address_url"),
  guarantorSolvencyUrl: text("guarantor_solvency_url").array(),
  
  // Firma Digital y Términos
  digitalSignature: text("digital_signature"),
  acceptedTerms: boolean("accepted_terms").default(false),
  signedAt: timestamp("signed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContractTenantInfoSchema = createInsertSchema(contractTenantInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContractTenantInfo = z.infer<typeof insertContractTenantInfoSchema>;
export type ContractTenantInfo = typeof contractTenantInfo.$inferSelect;

// Contract Owner Info table - Información del formato de renta del propietario
export const contractOwnerInfo = pgTable("contract_owner_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalContractId: varchar("rental_contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  
  // Datos Generales del Arrendador
  fullName: text("full_name").notNull(),
  nationality: varchar("nationality"),
  phone: varchar("phone"),
  whatsapp: varchar("whatsapp"),
  email: text("email"),
  subleaseAllowed: boolean("sublease_allowed").default(false),
  propertyAddress: text("property_address"),
  subdivision: varchar("subdivision"),
  unitNumber: varchar("unit_number"),
  agreedRent: decimal("agreed_rent", { precision: 12, scale: 2 }),
  agreedDeposit: decimal("agreed_deposit", { precision: 12, scale: 2 }),
  checkInDate: timestamp("check_in_date"),
  contractDuration: varchar("contract_duration"),
  includedServices: text("included_services").array(),
  excludedServices: text("excluded_services").array(),
  petsAccepted: boolean("pets_accepted").default(false),
  specialNotes: text("special_notes"),
  
  // Datos Bancarios para Apartado y Pago de Renta
  bankName: varchar("bank_name"),
  clabe: varchar("clabe"),
  accountNumber: varchar("account_number"),
  accountHolderName: text("account_holder_name"),
  swiftCode: varchar("swift_code"),
  bankAddress: text("bank_address"),
  bankEmail: text("bank_email"),
  
  // Documentos Subidos (URLs)
  idDocumentUrl: text("id_document_url"),
  propertyDocumentsUrl: text("property_documents_url").array(),
  serviceReceiptsUrl: text("service_receipts_url").array(),
  noDebtProofUrl: text("no_debt_proof_url").array(),
  servicesFormatUrl: text("services_format_url"),
  rulesRegulationsUrl: text("rules_regulations_url"),
  
  // Firma Digital y Términos
  digitalSignature: text("digital_signature"),
  acceptedTerms: boolean("accepted_terms").default(false),
  signedAt: timestamp("signed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContractOwnerInfoSchema = createInsertSchema(contractOwnerInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContractOwnerInfo = z.infer<typeof insertContractOwnerInfoSchema>;
export type ContractOwnerInfo = typeof contractOwnerInfo.$inferSelect;

// Rental Payments table - Pagos mensuales de renta y servicios
export const rentalPayments = pgTable("rental_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalContractId: varchar("rental_contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceType: serviceTypeEnum("service_type").notNull().default("rent"), // Tipo de servicio
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(), // Fecha de vencimiento del pago
  paymentDate: timestamp("payment_date"), // Fecha cuando se pagó
  status: rentalPaymentStatusEnum("status").notNull().default("pending"),
  paymentProof: text("payment_proof"), // Ruta del comprobante de pago (imagen base64)
  approvedBy: varchar("approved_by").references(() => users.id), // ID del propietario que aprobó
  approvedAt: timestamp("approved_at"), // Fecha de aprobación
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_rental_payments_contract").on(table.rentalContractId),
  index("idx_rental_payments_tenant").on(table.tenantId),
  index("idx_rental_payments_status").on(table.status),
  index("idx_rental_payments_service_type").on(table.serviceType),
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

// Contract Legal Documents table - Documentos PDF elaborados por abogados
export const contractLegalDocuments = pgTable("contract_legal_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalContractId: varchar("rental_contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id), // ID del abogado
  documentUrl: text("document_url").notNull(), // URL del PDF
  documentName: text("document_name").notNull(),
  version: integer("version").notNull().default(1), // Versión del documento
  notes: text("notes"), // Notas del abogado
  status: varchar("status").notNull().default("pending_review"), // pending_review, under_discussion, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_legal_docs_contract").on(table.rentalContractId),
  index("idx_legal_docs_lawyer").on(table.uploadedById),
  index("idx_legal_docs_status").on(table.status),
]);

export const insertContractLegalDocumentSchema = createInsertSchema(contractLegalDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateContractLegalDocumentSchema = insertContractLegalDocumentSchema.pick({
  documentUrl: true,
  documentName: true,
  version: true,
  notes: true,
  status: true,
}).partial();

export type InsertContractLegalDocument = z.infer<typeof insertContractLegalDocumentSchema>;
export type UpdateContractLegalDocument = z.infer<typeof updateContractLegalDocumentSchema>;
export type ContractLegalDocument = typeof contractLegalDocuments.$inferSelect;

// Contract Term Discussions table - Debate de términos del contrato
export const contractTermDiscussions = pgTable("contract_term_discussions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalDocumentId: varchar("legal_document_id").notNull().references(() => contractLegalDocuments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id), // Cliente, propietario o abogado
  userRole: varchar("user_role").notNull(), // 'tenant', 'owner', 'lawyer'
  termSection: varchar("term_section"), // Sección del contrato que se discute
  comment: text("comment").notNull(),
  status: varchar("status").notNull().default("open"), // open, resolved, accepted, rejected
  resolvedById: varchar("resolved_by_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_term_discussions_doc").on(table.legalDocumentId),
  index("idx_term_discussions_user").on(table.userId),
  index("idx_term_discussions_status").on(table.status),
]);

export const insertContractTermDiscussionSchema = createInsertSchema(contractTermDiscussions).omit({
  id: true,
  createdAt: true,
});

export type InsertContractTermDiscussion = z.infer<typeof insertContractTermDiscussionSchema>;
export type ContractTermDiscussion = typeof contractTermDiscussions.$inferSelect;

// Contract Approvals table - Aprobaciones de cliente y propietario
export const contractApprovals = pgTable("contract_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  legalDocumentId: varchar("legal_document_id").notNull().references(() => contractLegalDocuments.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  userRole: varchar("user_role").notNull(), // 'tenant' o 'owner'
  approved: boolean("approved").notNull(),
  digitalSignature: text("digital_signature"), // Firma digital
  comments: text("comments"), // Comentarios opcionales
  ipAddress: varchar("ip_address"), // IP desde donde se aprobó
  approvedAt: timestamp("approved_at").defaultNow().notNull(),
}, (table) => [
  index("idx_contract_approvals_doc").on(table.legalDocumentId),
  index("idx_contract_approvals_user").on(table.userId),
  unique("unique_approval_per_user_doc").on(table.legalDocumentId, table.userId),
]);

export const insertContractApprovalSchema = createInsertSchema(contractApprovals).omit({
  id: true,
  approvedAt: true,
});

export type InsertContractApproval = z.infer<typeof insertContractApprovalSchema>;
export type ContractApproval = typeof contractApprovals.$inferSelect;

// Check-in Appointments table - Citas de check-in
export const checkInAppointments = pgTable("check_in_appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalContractId: varchar("rental_contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  tenantId: varchar("tenant_id").notNull().references(() => users.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").notNull().default(120), // Duración en minutos (default 2 horas)
  location: text("location").notNull(), // Dirección de la propiedad
  assignedAdminId: varchar("assigned_admin_id").references(() => users.id), // Admin encargado
  status: varchar("status").notNull().default("scheduled"), // scheduled, completed, cancelled, rescheduled
  completedAt: timestamp("completed_at"),
  cancellationReason: text("cancellation_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_checkin_contract").on(table.rentalContractId),
  index("idx_checkin_property").on(table.propertyId),
  index("idx_checkin_date").on(table.scheduledDate),
  index("idx_checkin_status").on(table.status),
]);

export const insertCheckInAppointmentSchema = createInsertSchema(checkInAppointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCheckInAppointmentSchema = insertCheckInAppointmentSchema.pick({
  scheduledDate: true,
  duration: true,
  location: true,
  assignedAdminId: true,
  status: true,
  completedAt: true,
  cancellationReason: true,
  notes: true,
}).partial();

export type InsertCheckInAppointment = z.infer<typeof insertCheckInAppointmentSchema>;
export type UpdateCheckInAppointment = z.infer<typeof updateCheckInAppointmentSchema>;
export type CheckInAppointment = typeof checkInAppointments.$inferSelect;

// Contract Signed Documents table - Contratos escaneados subidos en check-in
export const contractSignedDocuments = pgTable("contract_signed_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalContractId: varchar("rental_contract_id").notNull().references(() => rentalContracts.id, { onDelete: "cascade" }),
  checkInAppointmentId: varchar("check_in_appointment_id").references(() => checkInAppointments.id),
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id), // Admin que sube
  documentUrl: text("document_url").notNull(), // URL del PDF escaneado
  documentName: text("document_name").notNull(),
  documentType: varchar("document_type").notNull(), // 'contract', 'addendum', 'inventory', 'other'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_signed_docs_contract").on(table.rentalContractId),
  index("idx_signed_docs_checkin").on(table.checkInAppointmentId),
  index("idx_signed_docs_type").on(table.documentType),
]);

export const insertContractSignedDocumentSchema = createInsertSchema(contractSignedDocuments).omit({
  id: true,
  createdAt: true,
});

export type InsertContractSignedDocument = z.infer<typeof insertContractSignedDocumentSchema>;
export type ContractSignedDocument = typeof contractSignedDocuments.$inferSelect;

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
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }), // Ahora opcional
  clientId: varchar("client_id").references(() => users.id), // Nullable para soportar leads no registrados
  conciergeId: varchar("concierge_id").references(() => users.id),
  presentationCardId: varchar("presentation_card_id").references(() => presentationCards.id), // Tarjeta de presentación requerida
  opportunityRequestId: varchar("opportunity_request_id").references(() => rentalOpportunityRequests.id, { onDelete: "set null" }), // Link to SOR
  
  // Campos para leads no registrados (cuando clientId es null)
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }), // ID del lead si viene de CRM
  leadEmail: varchar("lead_email"), // Email del lead no registrado
  leadPhone: varchar("lead_phone"), // Teléfono del lead no registrado
  leadName: text("lead_name"), // Nombre completo del lead no registrado
  
  // Campos para propiedades no registradas en el sistema
  condominiumName: text("condominium_name"), // Nombre del condominio
  unitNumber: text("unit_number"), // Número de unidad o nombre de casa
  
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
  
  // Campos para claves de acceso para conserje
  accessType: varchar("access_type"), // lockbox, electronic, manual, other
  accessCode: text("access_code"), // Código/clave de acceso
  accessInstructions: text("access_instructions"), // Instrucciones adicionales
  conciergeAssignedBy: varchar("concierge_assigned_by").references(() => users.id), // Quién asignó al conserje (propietario o admin)
  conciergeAssignedAt: timestamp("concierge_assigned_at"), // Cuándo se asignó
  
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

export const insertAppointmentSchema = createInsertSchema(appointments)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(
    (data) => {
      // Must have either clientId OR (leadEmail AND leadName)
      const hasClient = !!data.clientId;
      const hasLeadInfo = !!data.leadEmail && !!data.leadName;
      return hasClient || hasLeadInfo;
    },
    {
      message: "Debe proporcionar clientId o (leadEmail y leadName) para la cita",
    }
  );

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

// Offers table - Extended for rental offers with complete client profile and offer details
// Schema matches existing database structure
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityRequestId: varchar("opportunity_request_id").references(() => rentalOpportunityRequests.id, { onDelete: "set null" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id),
  appointmentId: varchar("appointment_id").references(() => appointments.id),
  
  // Client Profile Information (matching existing DB columns)
  clientNationality: varchar("client_nationality"),
  clientTimeInTulum: varchar("client_time_in_tulum"),
  clientOccupation: varchar("client_occupation"),
  clientCompany: varchar("client_company"),
  clientHasPets: boolean("client_has_pets").default(false),
  clientPetDescription: text("client_pet_description"),
  clientMonthlyIncome: decimal("client_monthly_income", { precision: 12, scale: 2 }),
  clientNumTenants: integer("client_num_tenants"),
  clientGuarantorName: varchar("client_guarantor_name"),
  clientGuarantorPhone: varchar("client_guarantor_phone"),
  clientPropertyUse: varchar("client_property_use"),
  
  // Offer Details (matching existing DB columns)
  offerAmount: decimal("offer_amount", { precision: 12, scale: 2 }).notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 12, scale: 2 }),
  firstMonthAdvance: boolean("first_month_advance").default(false),
  secondMonthAdvance: boolean("second_month_advance").default(false),
  depositAmount: decimal("deposit_amount", { precision: 12, scale: 2 }),
  moveInDate: timestamp("move_in_date", { mode: 'date' }),
  contractDurationMonths: integer("contract_duration_months"),
  servicesIncluded: text("services_included").array(),
  servicesExcluded: text("services_excluded").array(),
  specialRequests: text("special_requests"),
  
  // Digital signature
  digitalSignature: text("digital_signature"),
  
  // Status and notes
  status: offerStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  
  // Counter offer fields (matching existing DB columns)
  counterOfferAmount: decimal("counter_offer_amount", { precision: 12, scale: 2 }),
  counterOfferServicesIncluded: jsonb("counter_offer_services_included"),
  counterOfferServicesExcluded: jsonb("counter_offer_services_excluded"),
  counterOfferNotes: text("counter_offer_notes"),
  
  // Negotiation tracking (matching existing DB columns)
  negotiationRound: integer("negotiation_round").default(0),
  lastOfferedBy: varchar("last_offered_by"),
  negotiationHistory: jsonb("negotiation_history"),
  
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
// Clients who completed a visit can request to create an offer
export const rentalOpportunityRequests = pgTable("rental_opportunity_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  appointmentId: varchar("appointment_id").references(() => appointments.id), // Link to completed appointment
  status: opportunityRequestStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  desiredMoveInDate: timestamp("desired_move_in_date"),
  preferredContactMethod: varchar("preferred_contact_method").default("email"), // email, phone, whatsapp
  
  // Admin approval fields
  approvedBy: varchar("approved_by").references(() => users.id), // Admin who approved/rejected
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"), // If rejected, admin can provide reason
  
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
  legalDocumentId: varchar("legal_document_id").references(() => contractLegalDocuments.id, { onDelete: "cascade" }), // Para chat tripartito de términos del contrato
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
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Nullable for token-based submissions
  tokenId: varchar("token_id"), // Token used to create this draft - will add FK constraint later
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
  ownerData: jsonb("owner_data"), // datos privados del propietario, referido y documentos
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

// Property Submission Tokens - for inviting property owners without requiring account creation
export const propertySubmissionTokens = pgTable("property_submission_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token", { length: 20 }).notNull().unique(), // Short professional code like PROP-A1B2C3D4
  createdBy: varchar("created_by").notNull().references(() => users.id), // Admin who created the token
  expiresAt: timestamp("expires_at").notNull(), // Token expiration (24 hours from creation)
  used: boolean("used").notNull().default(false), // Whether token has been used
  propertyDraftId: varchar("property_draft_id").references(() => propertySubmissionDrafts.id, { onDelete: "set null" }), // Draft created using this token
  // Optional metadata about the invitee
  inviteeEmail: varchar("invitee_email", { length: 255 }),
  inviteePhone: varchar("invitee_phone", { length: 50 }),
  inviteeName: text("invitee_name"),
  notes: text("notes"), // Admin notes about this invitation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"), // When the token was used
});

export const insertPropertySubmissionTokenSchema = createInsertSchema(propertySubmissionTokens).omit({
  id: true,
  createdAt: true,
});

export type InsertPropertySubmissionToken = z.infer<typeof insertPropertySubmissionTokenSchema>;
export type PropertySubmissionToken = typeof propertySubmissionTokens.$inferSelect;

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
  ownerReferralCommissionPercent: decimal("owner_referral_commission_percent", { precision: 5, scale: 2 }).notNull().default("20.00"), // Vendedores ganan 20% por propiedad referida
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

// Sidebar Menu Visibility Configuration
export const sidebarMenuVisibility = pgTable("sidebar_menu_visibility", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: userRoleEnum("role").notNull(),
  menuItemKey: varchar("menu_item_key", { length: 255 }).notNull(),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("unique_role_menu_item").on(table.role, table.menuItemKey),
]);

export const insertSidebarMenuVisibilitySchema = createInsertSchema(sidebarMenuVisibility).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSidebarMenuVisibility = z.infer<typeof insertSidebarMenuVisibilitySchema>;
export type SidebarMenuVisibility = typeof sidebarMenuVisibility.$inferSelect;

// Sidebar Menu Visibility Configuration - Per User
export const sidebarMenuVisibilityUser = pgTable("sidebar_menu_visibility_user", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  menuItemKey: varchar("menu_item_key", { length: 255 }).notNull(),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("unique_user_menu_item").on(table.userId, table.menuItemKey),
  index("idx_user_sidebar_visibility").on(table.userId),
]);

export const insertSidebarMenuVisibilityUserSchema = createInsertSchema(sidebarMenuVisibilityUser).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSidebarMenuVisibilityUser = z.infer<typeof insertSidebarMenuVisibilityUserSchema>;
export type SidebarMenuVisibilityUser = typeof sidebarMenuVisibilityUser.$inferSelect;

// System Settings Configuration
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar("setting_key", { length: 255 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

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
  notes: many(propertyNotes),
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

export const propertyNotesRelations = relations(propertyNotes, ({ one }) => ({
  property: one(properties, {
    fields: [propertyNotes.propertyId],
    references: [properties.id],
  }),
  author: one(users, {
    fields: [propertyNotes.authorId],
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

// ========================================
// HOA (Homeowners Association) Module
// ========================================

// HOA Enums
export const condominiumIssueStatusEnum = pgEnum("condominium_issue_status", [
  "pendiente",
  "en_proceso",
  "resuelto",
  "cerrado",
]);

export const condominiumFeeStatusEnum = pgEnum("condominium_fee_status", [
  "pendiente",  // Pending payment
  "pagado",     // Paid
  "vencido",    // Overdue
  "cancelado",  // Cancelled
]);

// Condominium Units - Unidades dentro de un condominio
export const condominiumUnits = pgTable("condominium_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  condominiumId: varchar("condominium_id").notNull().references(() => condominiums.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  ownerId: varchar("owner_id").references(() => users.id),
  area: decimal("area", { precision: 10, scale: 2 }), // m² de la unidad
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  parkingSpaces: integer("parking_spaces").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUnit: unique().on(table.condominiumId, table.unitNumber),
}));

export const insertCondominiumUnitSchema = createInsertSchema(condominiumUnits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCondominiumUnit = z.infer<typeof insertCondominiumUnitSchema>;
export type CondominiumUnit = typeof condominiumUnits.$inferSelect;

// Condominium Fees - Cuotas de mantenimiento mensual
export const condominiumFees = pgTable("condominium_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  condominiumUnitId: varchar("condominium_unit_id").notNull().references(() => condominiumUnits.id, { onDelete: "cascade" }),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: condominiumFeeStatusEnum("status").notNull().default("pendiente"),
  description: text("description"),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueFee: unique().on(table.condominiumUnitId, table.month, table.year),
}));

export const insertCondominiumFeeSchema = createInsertSchema(condominiumFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCondominiumFee = z.infer<typeof insertCondominiumFeeSchema>;
export type CondominiumFee = typeof condominiumFees.$inferSelect;

// Condominium Fee Payments - Pagos de cuotas de mantenimiento
export const condominiumFeePayments = pgTable("condominium_fee_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  condominiumFeeId: varchar("condominium_fee_id").notNull().references(() => condominiumFees.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // "efectivo", "transferencia", "tarjeta"
  paidAt: timestamp("paid_at").notNull(),
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  registeredById: varchar("registered_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCondominiumFeePaymentSchema = createInsertSchema(condominiumFeePayments).omit({
  id: true,
  createdAt: true,
});

export type InsertCondominiumFeePayment = z.infer<typeof insertCondominiumFeePaymentSchema>;
export type CondominiumFeePayment = typeof condominiumFeePayments.$inferSelect;

// Condominium Issues - Incidencias/reportes de áreas comunes
export const condominiumIssues = pgTable("condominium_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  condominiumId: varchar("condominium_id").notNull().references(() => condominiums.id, { onDelete: "cascade" }),
  condominiumUnitId: varchar("condominium_unit_id").references(() => condominiumUnits.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"), // "mantenimiento", "seguridad", "limpieza", "otro"
  priority: text("priority").notNull().default("media"), // "baja", "media", "alta", "urgente"
  status: condominiumIssueStatusEnum("status").notNull().default("pendiente"),
  photos: jsonb("photos").$type<string[]>(),
  reportedById: varchar("reported_by_id").notNull().references(() => users.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCondominiumIssueSchema = createInsertSchema(condominiumIssues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCondominiumIssue = z.infer<typeof insertCondominiumIssueSchema>;
export type CondominiumIssue = typeof condominiumIssues.$inferSelect;

// HOA Relations
export const condominiumUnitsRelations = relations(condominiumUnits, ({ one, many }) => ({
  condominium: one(condominiums, {
    fields: [condominiumUnits.condominiumId],
    references: [condominiums.id],
  }),
  owner: one(users, {
    fields: [condominiumUnits.ownerId],
    references: [users.id],
  }),
  fees: many(condominiumFees),
  issues: many(condominiumIssues),
}));

export const condominiumFeesRelations = relations(condominiumFees, ({ one, many }) => ({
  unit: one(condominiumUnits, {
    fields: [condominiumFees.condominiumUnitId],
    references: [condominiumUnits.id],
  }),
  createdBy: one(users, {
    fields: [condominiumFees.createdById],
    references: [users.id],
  }),
  payments: many(condominiumFeePayments),
}));

export const condominiumFeePaymentsRelations = relations(condominiumFeePayments, ({ one }) => ({
  fee: one(condominiumFees, {
    fields: [condominiumFeePayments.condominiumFeeId],
    references: [condominiumFees.id],
  }),
  registeredBy: one(users, {
    fields: [condominiumFeePayments.registeredById],
    references: [users.id],
  }),
}));

export const condominiumIssuesRelations = relations(condominiumIssues, ({ one }) => ({
  condominium: one(condominiums, {
    fields: [condominiumIssues.condominiumId],
    references: [condominiums.id],
  }),
  unit: one(condominiumUnits, {
    fields: [condominiumIssues.condominiumUnitId],
    references: [condominiumUnits.id],
  }),
  reportedBy: one(users, {
    fields: [condominiumIssues.reportedById],
    references: [users.id],
    relationName: "issueReporter",
  }),
  assignedTo: one(users, {
    fields: [condominiumIssues.assignedToId],
    references: [users.id],
    relationName: "issueAssignee",
  }),
}));

// ========================================
// HOA Manager System
// ========================================

// HOA Manager Assignment Status Enum
export const hoaManagerStatusEnum = pgEnum("hoa_manager_status", [
  "pending",      // Solicitud pendiente de aprobación
  "approved",     // Aprobado por admin
  "rejected",     // Rechazado por admin
  "suspended",    // Suspendido temporalmente
]);

// HOA Announcement Priority Enum
export const hoaAnnouncementPriorityEnum = pgEnum("hoa_announcement_priority", [
  "baja",
  "media",
  "alta",
  "urgente",
]);

// HOA Manager Assignments - Asignación de managers a condominios
export const hoaManagerAssignments = pgTable("hoa_manager_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  managerId: varchar("manager_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  condominiumId: varchar("condominium_id").notNull().references(() => condominiums.id, { onDelete: "cascade" }),
  status: hoaManagerStatusEnum("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  approvedById: varchar("approved_by_id").references(() => users.id), // Admin que aprobó
  approvedAt: timestamp("approved_at"),
  approvalReason: text("approval_reason"), // Motivo de aprobación
  rejectedById: varchar("rejected_by_id").references(() => users.id), // Admin que rechazó
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  suspendedById: varchar("suspended_by_id").references(() => users.id),
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: text("suspension_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueAssignment: unique().on(table.managerId, table.condominiumId),
}));

export const insertHoaManagerAssignmentSchema = createInsertSchema(hoaManagerAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertHoaManagerAssignment = z.infer<typeof insertHoaManagerAssignmentSchema>;
export type HoaManagerAssignment = typeof hoaManagerAssignments.$inferSelect;

// HOA Announcements - Anuncios/Noticias del HOA Manager para propietarios
export const hoaAnnouncements = pgTable("hoa_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  condominiumId: varchar("condominium_id").notNull().references(() => condominiums.id, { onDelete: "cascade" }),
  managerId: varchar("manager_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: hoaAnnouncementPriorityEnum("priority").notNull().default("media"),
  category: text("category"), // "mantenimiento", "reunion", "aviso", "emergencia", "otro"
  attachments: jsonb("attachments").$type<string[]>(), // URLs de documentos adjuntos
  targetAllUnits: boolean("target_all_units").notNull().default(true), // Si es para todos los propietarios
  targetUnitIds: text("target_unit_ids").array(), // IDs específicos de unidades si no es para todos
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"), // Fecha de expiración del anuncio
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHoaAnnouncementSchema = createInsertSchema(hoaAnnouncements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertHoaAnnouncement = z.infer<typeof insertHoaAnnouncementSchema>;
export type HoaAnnouncement = typeof hoaAnnouncements.$inferSelect;

// HOA Announcement Reads - Tracking de lectura de anuncios por propietarios
export const hoaAnnouncementReads = pgTable("hoa_announcement_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  announcementId: varchar("announcement_id").notNull().references(() => hoaAnnouncements.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").defaultNow().notNull(),
}, (table) => ({
  uniqueRead: unique().on(table.announcementId, table.ownerId),
}));

export const insertHoaAnnouncementReadSchema = createInsertSchema(hoaAnnouncementReads).omit({
  id: true,
  readAt: true,
});

export type InsertHoaAnnouncementRead = z.infer<typeof insertHoaAnnouncementReadSchema>;
export type HoaAnnouncementRead = typeof hoaAnnouncementReads.$inferSelect;

// HOA Manager Relations
export const hoaManagerAssignmentsRelations = relations(hoaManagerAssignments, ({ one }) => ({
  manager: one(users, {
    fields: [hoaManagerAssignments.managerId],
    references: [users.id],
    relationName: "hoaManager",
  }),
  condominium: one(condominiums, {
    fields: [hoaManagerAssignments.condominiumId],
    references: [condominiums.id],
  }),
  approvedBy: one(users, {
    fields: [hoaManagerAssignments.approvedById],
    references: [users.id],
    relationName: "assignmentApprover",
  }),
  rejectedBy: one(users, {
    fields: [hoaManagerAssignments.rejectedById],
    references: [users.id],
    relationName: "assignmentRejecter",
  }),
  suspendedBy: one(users, {
    fields: [hoaManagerAssignments.suspendedById],
    references: [users.id],
    relationName: "assignmentSuspender",
  }),
}));

export const hoaAnnouncementsRelations = relations(hoaAnnouncements, ({ one, many }) => ({
  condominium: one(condominiums, {
    fields: [hoaAnnouncements.condominiumId],
    references: [condominiums.id],
  }),
  manager: one(users, {
    fields: [hoaAnnouncements.managerId],
    references: [users.id],
  }),
  reads: many(hoaAnnouncementReads),
}));

export const hoaAnnouncementReadsRelations = relations(hoaAnnouncementReads, ({ one }) => ({
  announcement: one(hoaAnnouncements, {
    fields: [hoaAnnouncementReads.announcementId],
    references: [hoaAnnouncements.id],
  }),
  owner: one(users, {
    fields: [hoaAnnouncementReads.ownerId],
    references: [users.id],
  }),
}));

// Offer Tokens - Enlaces privados para ofertas de renta sin login (soporta sistema interno y externo)
export const offerTokens = pgTable("offer_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token").notNull().unique(), // Token único para la URL
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }), // Para sistema interno
  externalUnitId: varchar("external_unit_id").references(() => externalUnits.id, { onDelete: "cascade" }), // Para sistema externo
  externalClientId: varchar("external_client_id").references(() => externalClients.id, { onDelete: "cascade" }), // Cliente externo (opcional)
  externalLeadId: varchar("external_lead_id").references(() => externalLeads.id, { onDelete: "set null" }), // Lead externo asociado (opcional)
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }), // Lead interno asociado al token (opcional)
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }), // Vendedor o admin que creó el link
  createdByName: varchar("created_by_name", { length: 255 }), // Nombre del creador (desnormalizado para consultas)
  expiresAt: timestamp("expires_at").notNull(), // 24 horas después de creación
  isUsed: boolean("is_used").notNull().default(false),
  offerData: jsonb("offer_data").$type<{
    // Perfil del Cliente
    nombreCompleto?: string;
    nacionalidad?: string;
    edad?: number;
    tiempoResidenciaTulum?: string;
    trabajoPosicion?: string;
    companiaTrabaja?: string;
    tieneMascotas?: string;
    petPhotos?: string[]; // URLs de fotos de mascotas
    ingresoMensualPromedio?: string;
    numeroInquilinos?: number;
    tieneGarante?: string;
    usoInmueble?: "vivienda" | "subarrendamiento";
    // Detalles de la Oferta
    rentaOfertada?: number;
    rentasAdelantadas?: number;
    fechaIngreso?: string;
    fechaSalida?: string; // Para contratos personalizados
    duracionContrato?: string;
    contractCost?: number; // 2500 para vivienda, 3800 para subarrendamiento
    securityDeposit?: number; // 1 o 2 meses según tipo de uso
    serviciosIncluidos?: string;
    serviciosNoIncluidos?: string;
    propertyRequiredServices?: string[]; // Servicios que requiere el propietario
    offeredServices?: string[]; // Servicios que el cliente ofrece pagar
    pedidoEspecial?: string;
    signature?: string; // Base64 de la firma
    // Metadata
    submittedAt?: string;
    clientEmail?: string;
    clientPhone?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOfferTokenSchema = createInsertSchema(offerTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOfferToken = z.infer<typeof insertOfferTokenSchema>;
export type OfferToken = typeof offerTokens.$inferSelect;

export const offerTokensRelations = relations(offerTokens, ({ one }) => ({
  property: one(properties, {
    fields: [offerTokens.propertyId],
    references: [properties.id],
  }),
  externalUnit: one(externalUnits, {
    fields: [offerTokens.externalUnitId],
    references: [externalUnits.id],
  }),
  externalClient: one(externalClients, {
    fields: [offerTokens.externalClientId],
    references: [externalClients.id],
  }),
  externalLead: one(externalLeads, {
    fields: [offerTokens.externalLeadId],
    references: [externalLeads.id],
  }),
  lead: one(leads, {
    fields: [offerTokens.leadId],
    references: [leads.id],
  }),
  creator: one(users, {
    fields: [offerTokens.createdBy],
    references: [users.id],
  }),
}));

// Tenant Rental Form Tokens table - Links temporales para completar formato de renta de inquilino/propietario (soporta sistema interno y externo)
export const tenantRentalFormTokens = pgTable("tenant_rental_form_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token").notNull().unique(),
  recipientType: varchar("recipient_type", { length: 20 }).notNull().default('tenant'), // 'tenant' o 'owner'
  rentalFormGroupId: varchar("rental_form_group_id"), // ID para vincular tokens de tenant + owner de la misma renta
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }), // Para sistema interno
  externalUnitId: varchar("external_unit_id").references(() => externalUnits.id, { onDelete: "cascade" }), // Para sistema externo
  externalClientId: varchar("external_client_id").references(() => externalClients.id, { onDelete: "cascade" }), // Cliente externo (opcional)
  externalLeadId: varchar("external_lead_id").references(() => externalLeads.id, { onDelete: "set null" }), // Lead externo asociado (opcional)
  externalUnitOwnerId: varchar("external_unit_owner_id"), // Owner externo (para recipient_type='owner') - referencia se agregará después
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdByName: varchar("created_by_name", { length: 255 }), // Nombre del creador (desnormalizado para consultas)
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  usedAt: timestamp("used_at"),
  tenantData: jsonb("tenant_data"), // Datos del formulario de tenant (cuando recipientType='tenant')
  ownerData: jsonb("owner_data"), // Datos del formulario de owner (cuando recipientType='owner')
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTenantRentalFormTokenSchema = createInsertSchema(tenantRentalFormTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTenantRentalFormToken = z.infer<typeof insertTenantRentalFormTokenSchema>;
export type TenantRentalFormToken = typeof tenantRentalFormTokens.$inferSelect;

// Tenant Rental Forms table - Formularios de renta de inquilino completados
export const tenantRentalForms = pgTable("tenant_rental_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").notNull().references(() => tenantRentalFormTokens.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => properties.id, { onDelete: "cascade" }), // Para sistema interno
  externalUnitId: varchar("external_unit_id").references(() => externalUnits.id, { onDelete: "cascade" }), // Para sistema externo
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  
  // Datos Generales del Arrendatario
  fullName: text("full_name").notNull(),
  address: text("address"),
  nationality: varchar("nationality"),
  age: integer("age"),
  timeInTulum: varchar("time_in_tulum"),
  jobPosition: varchar("job_position"),
  companyName: varchar("company_name"),
  workplaceAddress: text("workplace_address"),
  monthlyIncome: varchar("monthly_income"),
  companyTenure: varchar("company_tenure"),
  maritalStatus: varchar("marital_status"),
  whatsappNumber: varchar("whatsapp_number"),
  cellphone: varchar("cellphone"),
  email: varchar("email"),
  idType: varchar("id_type"),
  idNumber: varchar("id_number"),
  checkInDate: timestamp("check_in_date", { mode: 'date' }),
  numberOfTenants: integer("number_of_tenants"),
  paymentMethod: varchar("payment_method"),
  hasPets: boolean("has_pets").default(false),
  petDetails: text("pet_details"),
  desiredProperty: text("desired_property"),
  desiredCondoUnit: varchar("desired_condo_unit"),
  
  // Datos del Garante (opcional)
  hasGuarantor: boolean("has_guarantor").default(false),
  guarantorFullName: text("guarantor_full_name"),
  guarantorAddress: text("guarantor_address"),
  guarantorBirthDatePlace: varchar("guarantor_birth_date_place"),
  guarantorNationality: varchar("guarantor_nationality"),
  guarantorAge: integer("guarantor_age"),
  guarantorTimeInTulum: varchar("guarantor_time_in_tulum"),
  guarantorJobPosition: varchar("guarantor_job_position"),
  guarantorCompanyName: varchar("guarantor_company_name"),
  guarantorWorkAddress: text("guarantor_work_address"),
  guarantorWorkPhone: varchar("guarantor_work_phone"),
  guarantorMaritalStatus: varchar("guarantor_marital_status"),
  guarantorLandline: varchar("guarantor_landline"),
  guarantorCellphone: varchar("guarantor_cellphone"),
  guarantorEmail: varchar("guarantor_email"),
  guarantorIdNumber: varchar("guarantor_id_number"),
  
  // Referencias del Arrendamiento Anterior
  previousLandlordName: varchar("previous_landlord_name"),
  previousLandlordPhone: varchar("previous_landlord_phone"),
  previousAddress: text("previous_address"),
  previousTenancy: varchar("previous_tenancy"),
  
  // Referencias Laborales
  directSupervisorName: varchar("direct_supervisor_name"),
  companyNameAddress: text("company_name_address"),
  companyLandline: varchar("company_landline"),
  supervisorCellphone: varchar("supervisor_cellphone"),
  
  // Referencias Personales (no familiares)
  reference1Name: varchar("reference1_name"),
  reference1Address: text("reference1_address"),
  reference1Landline: varchar("reference1_landline"),
  reference1Cellphone: varchar("reference1_cellphone"),
  reference2Name: varchar("reference2_name"),
  reference2Address: text("reference2_address"),
  reference2Landline: varchar("reference2_landline"),
  reference2Cellphone: varchar("reference2_cellphone"),
  
  // Documentos subidos (URLs de archivos)
  tenantIdDocument: text("tenant_id_document"),
  tenantProofOfAddress: text("tenant_proof_of_address"),
  tenantProofOfIncome: text("tenant_proof_of_income").array(),
  guarantorIdDocument: text("guarantor_id_document"),
  guarantorProofOfAddress: text("guarantor_proof_of_address"),
  guarantorProofOfIncome: text("guarantor_proof_of_income").array(),
  
  // Términos y Condiciones
  acceptedTerms: boolean("accepted_terms").notNull().default(false),
  digitalSignature: text("digital_signature"),
  signedAt: timestamp("signed_at"),
  
  // Status y metadata
  status: varchar("status").notNull().default("submitted"), // submitted, under_review, approved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTenantRentalFormSchema = createInsertSchema(tenantRentalForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
});

export type InsertTenantRentalForm = z.infer<typeof insertTenantRentalFormSchema>;
export type TenantRentalForm = typeof tenantRentalForms.$inferSelect;

// Owner Rental Form Data table - Formularios de renta de propietario completados (para sistema externo)
export const ownerRentalFormData = pgTable("owner_rental_form_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").notNull().references(() => tenantRentalFormTokens.id, { onDelete: "cascade" }),
  externalUnitId: varchar("external_unit_id").references(() => externalUnits.id, { onDelete: "cascade" }),
  externalUnitOwnerId: varchar("external_unit_owner_id"), // Referencia se agregará después de que externalUnitOwners esté definido
  rentalFormGroupId: varchar("rental_form_group_id"), // Vincula con el token del inquilino
  
  // Datos Generales del Arrendador
  fullName: text("full_name").notNull(),
  nationality: varchar("nationality"),
  phoneNumber: varchar("phone_number"),
  whatsappNumber: varchar("whatsapp_number"),
  email: varchar("email").notNull(),
  subleasingAllowed: boolean("subleasing_allowed").default(false),
  
  // Datos de la Propiedad
  propertyAddress: text("property_address"),
  subdivision: varchar("subdivision"), // Fraccionamiento
  unitNumber: varchar("unit_number"),
  agreedRent: decimal("agreed_rent", { precision: 12, scale: 2 }),
  agreedDeposit: decimal("agreed_deposit", { precision: 12, scale: 2 }),
  moveInDate: timestamp("move_in_date", { mode: 'date' }),
  contractDuration: varchar("contract_duration"),
  servicesIncluded: text("services_included").array(),
  servicesNotIncluded: text("services_not_included").array(),
  petsAllowed: boolean("pets_allowed").default(false),
  specialNotes: text("special_notes"),
  
  // Datos Bancarios
  bankName: varchar("bank_name"),
  interbankCode: varchar("interbank_code"), // CLABE
  accountOrCardNumber: varchar("account_or_card_number"),
  accountHolderName: varchar("account_holder_name"),
  swiftCode: varchar("swift_code"),
  bankAddress: text("bank_address"),
  bankEmail: varchar("bank_email"),
  
  // Documentos subidos (URLs de archivos en object storage)
  idDocumentUrl: text("id_document_url"), // INE/Pasaporte
  constitutiveActUrl: text("constitutive_act_url"), // Acta constitutiva (empresas)
  propertyDocumentsUrls: text("property_documents_urls").array(), // Escrituras, contrato, fideicomiso
  serviceReceiptsUrls: text("service_receipts_urls").array(), // CAPA, CFE, Internet
  noDebtProofUrls: text("no_debt_proof_urls").array(), // Comprobantes no adeudo
  servicesFormatUrl: text("services_format_url"),
  internalRulesUrl: text("internal_rules_url"),
  condoRegulationsUrl: text("condo_regulations_url"),
  
  // Términos y Condiciones
  acceptedTerms: boolean("accepted_terms").notNull().default(false),
  digitalSignature: text("digital_signature"),
  signedAt: timestamp("signed_at"),
  
  // Status y metadata
  status: varchar("status").notNull().default("submitted"), // submitted, under_review, approved, rejected
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOwnerRentalFormDataSchema = createInsertSchema(ownerRentalFormData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
});

export type InsertOwnerRentalFormData = z.infer<typeof insertOwnerRentalFormDataSchema>;
export type OwnerRentalFormData = typeof ownerRentalFormData.$inferSelect;

// Owner Document Tokens table - Links privados para propietarios
export const ownerDocumentTokens = pgTable("owner_document_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token").notNull().unique(),
  tenantRentalFormId: varchar("tenant_rental_form_id").notNull().references(() => tenantRentalForms.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOwnerDocumentTokenSchema = createInsertSchema(ownerDocumentTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOwnerDocumentToken = z.infer<typeof insertOwnerDocumentTokenSchema>;
export type OwnerDocumentToken = typeof ownerDocumentTokens.$inferSelect;

// Owner Document Submissions table - Documentos del propietario para contrato
export const ownerDocumentSubmissions = pgTable("owner_document_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").notNull().references(() => ownerDocumentTokens.id, { onDelete: "cascade" }),
  tenantRentalFormId: varchar("tenant_rental_form_id").notNull().references(() => tenantRentalForms.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Documentos del propietario
  ownerIdDocument: text("owner_id_document"),
  ownerProofOfOwnership: text("owner_proof_of_ownership"),
  propertyDocuments: text("property_documents").array(),
  taxDocuments: text("tax_documents").array(),
  utilityBills: text("utility_bills").array(),
  otherDocuments: text("other_documents").array(),
  
  // Firma digital y términos
  acceptedTerms: boolean("accepted_terms").notNull().default(false),
  digitalSignature: text("digital_signature"),
  signedAt: timestamp("signed_at"),
  
  // Status
  status: varchar("status").notNull().default("submitted"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOwnerDocumentSubmissionSchema = createInsertSchema(ownerDocumentSubmissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
});

export type InsertOwnerDocumentSubmission = z.infer<typeof insertOwnerDocumentSubmissionSchema>;
export type OwnerDocumentSubmission = typeof ownerDocumentSubmissions.$inferSelect;

// Property Owner Terms - Términos y condiciones editables para propietarios
export const propertyOwnerTerms = pgTable("property_owner_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(), // Título en español
  titleEn: text("title_en").notNull(), // Título en inglés
  content: text("content").notNull(), // Contenido en español
  contentEn: text("content_en").notNull(), // Contenido en inglés
  orderIndex: integer("order_index").notNull().default(0), // Orden de visualización
  isActive: boolean("is_active").notNull().default(true), // Si está activo
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPropertyOwnerTermsSchema = createInsertSchema(propertyOwnerTerms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPropertyOwnerTerms = z.infer<typeof insertPropertyOwnerTermsSchema>;
export type PropertyOwnerTerms = typeof propertyOwnerTerms.$inferSelect;

// ============================================================================
// EXTERNAL PROPERTY MANAGEMENT SYSTEM
// Sistema independiente para gestionar propiedades externas sin proceso de aprobación
// ============================================================================

// External Agencies - Agencias externas que usan el sistema
export const externalAgencies = pgTable("external_agencies", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(), // Nombre de la agencia
  slug: varchar("slug", { length: 100 }), // URL-friendly slug (e.g., tulumrentalhomes)
  description: text("description"), // Descripción
  agencyLogoUrl: text("agency_logo_url"), // Logo de la agencia
  pdfTemplateStyle: varchar("pdf_template_style", { length: 50 }).default('professional'), // Estilo de plantilla PDF: 'professional', 'modern', 'elegant'
  contactName: varchar("contact_name", { length: 255 }), // Nombre de contacto
  contactEmail: varchar("contact_email", { length: 255 }), // Email de contacto
  contactPhone: varchar("contact_phone", { length: 50 }), // Teléfono de contacto
  assignedToUser: varchar("assigned_to_user").references(() => users.id), // Usuario responsable de la agencia
  autoApprovePublications: boolean("auto_approve_publications").notNull().default(false), // Auto-aprobar publicaciones sin revisión manual
  aiCreditsEnabled: boolean("ai_credits_enabled").notNull().default(true), // Si las funciones de IA con créditos están habilitadas
  aiCreditBalance: integer("ai_credit_balance").default(100), // Balance de créditos de IA disponibles (null = ilimitado)
  aiCreditsMonthlyReset: boolean("ai_credits_monthly_reset").default(false), // Si se reinician los créditos mensualmente
  // Watermark/Logo configuration for photo editing
  watermarkEnabled: boolean("watermark_enabled").default(false), // Si el watermark está habilitado
  watermarkImageUrl: text("watermark_image_url"), // URL del logo/imagen para watermark
  watermarkPosition: varchar("watermark_position", { length: 20 }).default('bottom-right'), // Posición: top-left, top-right, bottom-left, bottom-right, center
  watermarkOpacity: integer("watermark_opacity").default(50), // Opacidad del watermark (0-100)
  watermarkScale: integer("watermark_scale").default(20), // Tamaño del watermark (% del ancho de imagen)
  watermarkText: varchar("watermark_text", { length: 255 }), // Texto alternativo si no hay imagen
  isActive: boolean("is_active").notNull().default(true), // Si está activa
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_agencies_active").on(table.isActive),
  index("idx_external_agencies_assigned_user").on(table.assignedToUser),
  index("idx_external_agencies_created_by").on(table.createdBy),
  index("idx_external_agencies_created_at").on(table.createdAt),
]);

export const insertExternalAgencySchema = createInsertSchema(externalAgencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  isActive: z.boolean().optional().default(true),
  agencyLogoUrl: z.string().optional(),
  autoApprovePublications: z.boolean().optional().default(false),
  aiCreditsEnabled: z.boolean().optional().default(true),
  createdBy: z.string().optional(),
  watermarkEnabled: z.boolean().optional().default(false),
  watermarkImageUrl: z.string().optional(),
  watermarkPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).optional().default('bottom-right'),
  watermarkOpacity: z.number().min(0).max(100).optional().default(50),
  watermarkScale: z.number().min(5).max(50).optional().default(20),
  watermarkText: z.string().optional(),
});

export type InsertExternalAgency = z.infer<typeof insertExternalAgencySchema>;
export type ExternalAgency = typeof externalAgencies.$inferSelect;

// Summary type for list views (excludes large fields like logo base64)
export interface ExternalAgencySummary {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  propertyCount: number;
  leadCount: number;
  contractCount: number;
  assignedUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface ExternalAgencyListResponse {
  agencies: ExternalAgencySummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// External Agency Integrations - Configuraciones de integraciones por agencia
export const externalAgencyIntegrations = pgTable("external_agency_integrations", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }).unique(),
  
  // Google Calendar OAuth
  googleCalendarAccessToken: text("google_calendar_access_token"), // Token de acceso
  googleCalendarRefreshToken: text("google_calendar_refresh_token"), // Token de refresco
  googleCalendarTokenExpiry: timestamp("google_calendar_token_expiry"), // Expiración del token
  googleCalendarId: varchar("google_calendar_id", { length: 255 }), // ID del calendario a usar
  googleCalendarConnectedAt: timestamp("google_calendar_connected_at"), // Cuándo se conectó
  
  // OpenAI Configuration
  openaiApiKey: text("openai_api_key"), // API key encriptada (null si usa Replit Integration)
  openaiUseReplitIntegration: boolean("openai_use_replit_integration").default(true), // Si usa la integración de Replit
  openaiConnectedAt: timestamp("openai_connected_at"), // Cuándo se configuró
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_agency_integrations_agency").on(table.agencyId),
]);

export const insertExternalAgencyIntegrationSchema = createInsertSchema(externalAgencyIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalAgencyIntegration = z.infer<typeof insertExternalAgencyIntegrationSchema>;
export type ExternalAgencyIntegration = typeof externalAgencyIntegrations.$inferSelect;

// External AI Credit Events - Tracking de uso de créditos de IA por agencia
export const externalAiCreditEventTypeEnum = pgEnum("external_ai_credit_event_type", [
  "usage",           // Consumo por generación de contenido
  "adjustment",      // Ajuste manual por admin
  "reset",           // Reset mensual
  "purchase",        // Compra de créditos adicionales
]);

export const externalAiCreditEvents = pgTable("external_ai_credit_events", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").references(() => users.id, { onDelete: "set null" }), // Vendedor que usó los créditos
  eventType: externalAiCreditEventTypeEnum("event_type").notNull(),
  credits: integer("credits").notNull(), // Positivo para ajustes/resets, negativo para uso
  balanceAfter: integer("balance_after"), // Balance después de esta transacción
  source: varchar("source", { length: 100 }), // Fuente del uso: 'social_media_generator', 'chatbot', etc.
  metadata: jsonb("metadata").$type<{
    platform?: string;
    category?: string;
    unitId?: string;
    promptTokens?: number;
    completionTokens?: number;
    model?: string;
    reason?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_ai_credit_events_agency").on(table.agencyId),
  index("idx_external_ai_credit_events_seller").on(table.sellerId),
  index("idx_external_ai_credit_events_created").on(table.createdAt),
]);

export const insertExternalAiCreditEventSchema = createInsertSchema(externalAiCreditEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertExternalAiCreditEvent = z.infer<typeof insertExternalAiCreditEventSchema>;
export type ExternalAiCreditEvent = typeof externalAiCreditEvents.$inferSelect;

// External Social Link Tracking - Links rastreables para marketing en redes sociales
export const externalSocialLinkClicks = pgTable("external_social_link_clicks", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").references(() => users.id, { onDelete: "set null" }), // Vendedor propietario del link
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }), // Unidad relacionada
  token: varchar("token", { length: 50 }).notNull().unique(), // Token único para el link
  targetUrl: text("target_url").notNull(), // URL destino (Google Maps, listado público, etc.)
  platform: varchar("platform", { length: 50 }), // facebook, instagram, whatsapp
  clickCount: integer("click_count").default(0), // Contador de clicks
  lastClickedAt: timestamp("last_clicked_at"),
  expiresAt: timestamp("expires_at"), // Expiración opcional
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_social_link_clicks_agency").on(table.agencyId),
  index("idx_external_social_link_clicks_seller").on(table.sellerId),
  index("idx_external_social_link_clicks_token").on(table.token),
  index("idx_external_social_link_clicks_unit").on(table.unitId),
]);

export const insertExternalSocialLinkClickSchema = createInsertSchema(externalSocialLinkClicks).omit({
  id: true,
  clickCount: true,
  lastClickedAt: true,
  createdAt: true,
});

export type InsertExternalSocialLinkClick = z.infer<typeof insertExternalSocialLinkClickSchema>;
export type ExternalSocialLinkClick = typeof externalSocialLinkClicks.$inferSelect;

// External Permission Sections - Sections of the external agency system
export const EXTERNAL_PERMISSION_SECTIONS = [
  "dashboard",
  "condominiums", 
  "units",
  "owners",
  "clients",
  "leads",
  "rentals",
  "payments",
  "maintenance",
  "workers",
  "calendar",
  "accounting",
  "configuration",
  "accounts",
  "quotations",
  "accesses",
  "appointments", // Citas y tours de propiedades
] as const;

export type ExternalPermissionSection = typeof EXTERNAL_PERMISSION_SECTIONS[number];

// External Permission Actions - Actions that can be performed in each section
export const EXTERNAL_PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "import",
  "export",
  "assign",
  "reassign",
  "approve",
  "cancel",
  "generate_pdf",
  "share",
  "send_reminder",
  "mark_paid",
  "toggle_status",
  "send_codes",
  "sync",
  "manage_permissions",
] as const;

export type ExternalPermissionAction = typeof EXTERNAL_PERMISSION_ACTIONS[number];

// Default permissions per role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<ExternalPermissionSection, ExternalPermissionAction[]>> = {
  external_agency_admin: {
    dashboard: ["view"],
    condominiums: ["view", "create", "edit", "delete", "import"],
    units: ["view", "create", "edit", "delete", "toggle_status", "import"],
    owners: ["view", "create", "edit", "delete"],
    clients: ["view", "create", "edit", "delete", "assign"],
    leads: ["view", "create", "edit", "delete", "import", "reassign"],
    rentals: ["view", "create", "edit", "delete", "cancel", "generate_pdf"],
    payments: ["view", "create", "edit", "delete", "mark_paid", "send_reminder"],
    maintenance: ["view", "create", "edit", "delete", "assign"],
    workers: ["view", "create", "edit", "delete", "assign"],
    calendar: ["view", "create", "edit", "delete", "sync"],
    accounting: ["view", "create", "edit", "delete", "export"],
    configuration: ["view", "edit"],
    accounts: ["view", "create", "edit", "delete", "manage_permissions"],
    quotations: ["view", "create", "edit", "delete", "generate_pdf", "share"],
    accesses: ["view", "create", "edit", "delete", "send_codes"],
    appointments: ["view", "create", "edit", "delete", "cancel", "assign", "reassign"],
  },
  external_agency_accounting: {
    dashboard: ["view"],
    condominiums: ["view"],
    units: ["view"],
    owners: ["view"],
    clients: ["view"],
    leads: ["view"],
    rentals: ["view", "generate_pdf"],
    payments: ["view", "create", "edit", "mark_paid", "send_reminder"],
    maintenance: ["view"],
    workers: ["view"],
    calendar: ["view"],
    accounting: ["view", "create", "edit", "export"],
    configuration: ["view"],
    accounts: ["view"],
    quotations: ["view", "create", "edit", "generate_pdf", "share"],
    accesses: ["view"],
    appointments: ["view"],
  },
  external_agency_maintenance: {
    dashboard: ["view"],
    condominiums: ["view"],
    units: ["view", "edit"],
    owners: ["view"],
    clients: ["view"],
    leads: ["view"],
    rentals: ["view"],
    payments: ["view"],
    maintenance: ["view", "create", "edit", "assign"],
    workers: ["view", "edit", "assign"],
    calendar: ["view", "create", "edit"],
    accounting: ["view"],
    configuration: ["view"],
    accounts: ["view"],
    quotations: ["view", "create", "edit", "generate_pdf"],
    accesses: ["view", "create", "edit", "send_codes"],
    appointments: ["view"],
  },
  external_agency_staff: {
    dashboard: ["view"],
    condominiums: ["view"],
    units: ["view"],
    owners: ["view"],
    clients: ["view", "create", "edit"],
    leads: ["view", "create", "edit"],
    rentals: ["view", "generate_pdf"],
    payments: ["view"],
    maintenance: ["view", "create"],
    workers: ["view"],
    calendar: ["view"],
    accounting: ["view"],
    configuration: ["view"],
    accounts: ["view"],
    quotations: ["view", "generate_pdf"],
    accesses: ["view"],
    appointments: ["view", "create", "edit"],
  },
  external_agency_seller: {
    dashboard: ["view"],
    condominiums: ["view"],
    units: ["view"],
    owners: ["view"],
    clients: ["view", "create", "edit"],
    leads: ["view", "create", "edit"],
    rentals: ["view"],
    payments: ["view"],
    maintenance: ["view"],
    workers: ["view"],
    calendar: ["view"],
    accounting: [],
    configuration: [],
    accounts: [],
    quotations: ["view"],
    accesses: ["view"],
    appointments: ["view", "create", "edit", "cancel"],
  },
  external_agency_concierge: {
    dashboard: ["view"],
    condominiums: ["view"],
    units: ["view"],
    owners: ["view"],
    clients: ["view"],
    leads: ["view"],
    rentals: ["view"],
    payments: [],
    maintenance: ["view", "create"],
    workers: ["view"],
    calendar: ["view"],
    accounting: [],
    configuration: [],
    accounts: [],
    quotations: [],
    accesses: ["view", "send_codes"],
    appointments: ["view", "edit"], // Can view and update appointment status/reports
  },
  external_agency_lawyer: {
    dashboard: ["view"],
    condominiums: ["view"],
    units: ["view"],
    owners: ["view"],
    clients: ["view"],
    leads: ["view"],
    rentals: ["view", "create", "edit", "generate_pdf"], // Can create and manage contracts
    payments: ["view"],
    maintenance: [],
    workers: [],
    calendar: ["view"],
    accounting: [],
    configuration: [],
    accounts: [],
    quotations: ["view", "generate_pdf"],
    accesses: ["view"],
    appointments: ["view"], // Can view appointments
  },
};

// Section labels for UI
export const PERMISSION_SECTION_LABELS = {
  es: {
    dashboard: "Panel Principal",
    condominiums: "Condominios",
    units: "Unidades",
    owners: "Propietarios",
    clients: "Clientes",
    leads: "Leads",
    rentals: "Rentas/Contratos",
    payments: "Pagos",
    maintenance: "Mantenimiento",
    workers: "Trabajadores",
    calendar: "Calendario",
    accounting: "Contabilidad",
    configuration: "Configuración",
    accounts: "Cuentas de Usuario",
    quotations: "Cotizaciones",
    accesses: "Control de Accesos",
    appointments: "Citas",
  },
  en: {
    dashboard: "Dashboard",
    condominiums: "Condominiums",
    units: "Units",
    owners: "Owners",
    clients: "Clients",
    leads: "Leads",
    rentals: "Rentals/Contracts",
    payments: "Payments",
    maintenance: "Maintenance",
    workers: "Workers",
    calendar: "Calendar",
    accounting: "Accounting",
    configuration: "Configuration",
    accounts: "User Accounts",
    quotations: "Quotations",
    accesses: "Access Control",
    appointments: "Appointments",
  },
};

// Action labels for UI
export const PERMISSION_ACTION_LABELS = {
  es: {
    view: "Ver",
    create: "Crear",
    edit: "Editar",
    delete: "Eliminar",
    import: "Importar",
    export: "Exportar",
    assign: "Asignar",
    reassign: "Reasignar",
    approve: "Aprobar",
    cancel: "Cancelar",
    generate_pdf: "Generar PDF",
    share: "Compartir",
    send_reminder: "Enviar Recordatorio",
    mark_paid: "Marcar Pagado",
    toggle_status: "Cambiar Estado",
    send_codes: "Enviar Códigos",
    sync: "Sincronizar",
    manage_permissions: "Gestionar Permisos",
  },
  en: {
    view: "View",
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    import: "Import",
    export: "Export",
    assign: "Assign",
    reassign: "Reassign",
    approve: "Approve",
    cancel: "Cancel",
    generate_pdf: "Generate PDF",
    share: "Share",
    send_reminder: "Send Reminder",
    mark_paid: "Mark Paid",
    toggle_status: "Toggle Status",
    send_codes: "Send Codes",
    sync: "Sync",
    manage_permissions: "Manage Permissions",
  },
};

// External Role Permissions - Permisos por rol para cada agencia
export const externalRolePermissions = pgTable("external_role_permissions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull(), // external_agency_admin, external_agency_accounting, etc.
  section: varchar("section", { length: 50 }).notNull(), // dashboard, condominiums, etc.
  action: varchar("action", { length: 50 }).notNull(), // view, create, edit, delete, etc.
  allowed: boolean("allowed").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_role_permissions_agency").on(table.agencyId),
  index("idx_external_role_permissions_role").on(table.role),
  uniqueIndex("idx_external_role_permissions_unique").on(table.agencyId, table.role, table.section, table.action),
]);

export const insertExternalRolePermissionSchema = createInsertSchema(externalRolePermissions).omit({
  id: true,
  updatedAt: true,
});

export type InsertExternalRolePermission = z.infer<typeof insertExternalRolePermissionSchema>;
export type ExternalRolePermission = typeof externalRolePermissions.$inferSelect;

// External User Permissions - Permisos específicos por usuario (sobrescriben los de rol)
export const externalUserPermissions = pgTable("external_user_permissions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  section: varchar("section", { length: 50 }).notNull(), // dashboard, condominiums, etc.
  action: varchar("action", { length: 50 }).notNull(), // view, create, edit, delete, etc.
  allowed: boolean("allowed").notNull(), // true = grant, false = deny (override)
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_user_permissions_agency").on(table.agencyId),
  index("idx_external_user_permissions_user").on(table.userId),
  uniqueIndex("idx_external_user_permissions_unique").on(table.agencyId, table.userId, table.section, table.action),
]);

export const insertExternalUserPermissionSchema = createInsertSchema(externalUserPermissions).omit({
  id: true,
  updatedAt: true,
});

export type InsertExternalUserPermission = z.infer<typeof insertExternalUserPermissionSchema>;
export type ExternalUserPermission = typeof externalUserPermissions.$inferSelect;
// Appointment Feedback Outcome Enum - Outcomes for completed appointments
// External Appointment Status Enum
export const externalAppointmentStatusEnum = pgEnum("external_appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentFeedbackOutcomeEnum = pgEnum("appointment_feedback_outcome", [
  "liked",           // El cliente mostro interes en la propiedad
  "disliked",        // Al cliente no le gusto la propiedad
  "no_show",         // El cliente no se presento
  "will_make_offer", // El cliente va a presentar oferta
  "rescheduled",     // La cita fue reagendada
  "needs_followup",  // Requiere seguimiento
  "not_qualified",   // Cliente no calificado
  "other",           // Otro resultado
]);

// External Appointments - Citas para agencias externas
export const externalAppointments = pgTable("external_appointments", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Unit link (for individual appointments) - tours use externalAppointmentUnits
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  
  // Appointment type and mode
  type: appointmentTypeEnum("type").notNull().default("in-person"), // in-person or video
  mode: appointmentModeEnum("mode").notNull().default("individual"), // individual (1hr) or tour (30min each)
  tourGroupId: varchar("tour_group_id"), // Groups tour stops together
  
  // Scheduling
  date: timestamp("date").notNull(), // Start time of appointment
  durationMinutes: integer("duration_minutes").notNull().default(60), // 60 for individual, 30 per unit for tours
  
  // Status
  status: externalAppointmentStatusEnum("status").notNull().default("pending"),
  
  // Assignment
  salespersonId: varchar("salesperson_id").references(() => users.id, { onDelete: "set null" }), // Vendedor asignado
  conciergeId: varchar("concierge_id").references(() => users.id, { onDelete: "set null" }), // Conserje asignado
  
  // Client/Lead information
  clientId: varchar("client_id").references(() => externalClients.id, { onDelete: "set null" }), // Linked to existing client
  leadId: varchar("lead_id").references(() => externalLeads.id, { onDelete: "set null" }), // Linked to existing lead
  presentationCardId: varchar("presentation_card_id"), // Linked to presentation card (search profile)
  // Snapshot fields for leads not in system
  clientName: varchar("client_name", { length: 255 }),
  clientEmail: varchar("client_email", { length: 255 }),
  clientPhone: varchar("client_phone", { length: 50 }),
  
  // Google Calendar integration
  googleEventId: text("google_event_id"), // ID del evento en Google Calendar
  meetLink: text("meet_link"), // Link para videollamadas
  
  // Notes and reports
  notes: text("notes"), // Notas de la cita
  conciergeReport: text("concierge_report"), // Reporte del conserje después de la cita
  accessIssues: text("access_issues"), // Problemas de acceso reportados
  clientFeedback: text("client_feedback"), // Feedback del cliente
  
  // Tracking
  createdBy: varchar("created_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  // Feedback after appointment completion
  feedbackOutcome: appointmentFeedbackOutcomeEnum("feedback_outcome"), // Resultado predefinido
  feedbackNotes: text("feedback_notes"), // Notas del conserje sobre la cita
  feedbackRatingDelta: integer("feedback_rating_delta"), // Cambio de rating aplicado al cliente
  feedbackSubmittedAt: timestamp("feedback_submitted_at"), // Cuando se envio el feedback
  feedbackSubmittedBy: varchar("feedback_submitted_by").references(() => users.id), // Quien envio el feedback
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_appointments_agency").on(table.agencyId),
  index("idx_external_appointments_date").on(table.date),
  index("idx_external_appointments_status").on(table.status),
  index("idx_external_appointments_salesperson").on(table.salespersonId),
  index("idx_external_appointments_concierge").on(table.conciergeId),
  index("idx_external_appointments_tour_group").on(table.tourGroupId),
  index("idx_external_appointments_agency_date_status").on(table.agencyId, table.date, table.status),
]);

export const insertExternalAppointmentSchema = createInsertSchema(externalAppointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalAppointment = z.infer<typeof insertExternalAppointmentSchema>;
export type ExternalAppointment = typeof externalAppointments.$inferSelect;

// External Appointment Units - Tour stops (for tours with multiple units)
export const externalAppointmentUnits = pgTable("external_appointment_units", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  appointmentId: varchar("appointment_id").notNull().references(() => externalAppointments.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }),
  
  // Sequence in tour (1, 2, 3 - max 3)
  sequence: integer("sequence").notNull().default(1),
  
  // Timing offset from appointment start (0, 30, 60 minutes)
  offsetMinutes: integer("offset_minutes").notNull().default(0),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  
  // Per-unit status and notes
  status: externalAppointmentStatusEnum("status").notNull().default("pending"),
  visitNotes: text("visit_notes"), // Notas específicas de esta visita
  clientInterest: varchar("client_interest", { length: 50 }), // interested, not_interested, considering
  
  // Google Calendar (separate event for each tour stop if needed)
  googleEventId: text("google_event_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_appointment_units_appointment").on(table.appointmentId),
  index("idx_external_appointment_units_unit").on(table.unitId),
  index("idx_external_appointment_units_sequence").on(table.appointmentId, table.sequence),
]);

export const insertExternalAppointmentUnitSchema = createInsertSchema(externalAppointmentUnits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalAppointmentUnit = z.infer<typeof insertExternalAppointmentUnitSchema>;
export type ExternalAppointmentUnit = typeof externalAppointmentUnits.$inferSelect;

// External Properties - Propiedades gestionadas externamente
export const externalProperties = pgTable("external_properties", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  linkedPropertyId: varchar("linked_property_id").references(() => properties.id), // Si se vincula a propiedad real
  name: varchar("name", { length: 255 }).notNull(), // Nombre de la propiedad
  address: text("address"), // Dirección completa
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).default("México"),
  postalCode: varchar("postal_code", { length: 20 }),
  propertyType: varchar("property_type", { length: 50 }), // casa, departamento, etc
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  area: decimal("area", { precision: 10, scale: 2 }), // m²
  status: externalPropertyStatusEnum("status").notNull().default("active"),
  notes: text("notes"), // Notas adicionales
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_properties_agency").on(table.agencyId),
  index("idx_external_properties_status").on(table.status),
  index("idx_external_properties_linked").on(table.linkedPropertyId),
]);

export const insertExternalPropertySchema = createInsertSchema(externalProperties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalProperty = z.infer<typeof insertExternalPropertySchema>;
export type ExternalProperty = typeof externalProperties.$inferSelect;

// External Rental Contracts - Contratos de renta externos
export const externalRentalContracts = pgTable("external_rental_contracts", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }), // Unidad/propiedad
  propertyId: varchar("property_id").references(() => externalProperties.id, { onDelete: "cascade" }), // Deprecated - usar unitId
  clientId: varchar("client_id").references(() => externalClients.id, { onDelete: "set null" }), // Referencia a cliente existente (opcional)
  rentalFormGroupId: varchar("rental_form_group_id"), // Vincula con los tokens de formularios duales (tenant + owner)
  tenantName: varchar("tenant_name", { length: 255 }).notNull(), // Nombre del inquilino principal
  tenantEmail: varchar("tenant_email", { length: 255 }),
  tenantPhone: varchar("tenant_phone", { length: 50 }),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(), // Renta mensual
  currency: varchar("currency", { length: 10 }).notNull().default("MXN"), // MXN o USD
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }), // Depósito de seguridad
  rentalPurpose: rentalPurposeEnum("rental_purpose").notNull().default("living"), // Propósito de la renta
  leaseDurationMonths: integer("lease_duration_months").notNull(), // 6, 12, etc
  startDate: timestamp("start_date").notNull(), // Inicio del contrato
  endDate: timestamp("end_date").notNull(), // Fin del contrato
  status: externalContractStatusEnum("status").notNull().default("pending_validation"),
  // Mascotas
  hasPet: boolean("has_pet").notNull().default(false), // Si tiene mascota
  petName: varchar("pet_name", { length: 100 }), // Nombre de la mascota
  petPhotoUrl: text("pet_photo_url"), // URL de la foto de la mascota
  petDescription: text("pet_description"), // Descripción de la mascota (raza, tamaño, etc)
  // Documentos
  leaseContractUrl: text("lease_contract_url"), // URL del contrato de arrendamiento (PDF, imagen, etc)
  inventoryUrl: text("inventory_url"), // URL del inventario (PDF, imagen, etc)
  // Validación de documentos
  tenantDocsValidated: boolean("tenant_docs_validated").notNull().default(false), // Documentos del inquilino validados
  ownerDocsValidated: boolean("owner_docs_validated").notNull().default(false), // Documentos del propietario validados
  tenantDocsValidatedBy: varchar("tenant_docs_validated_by").references(() => users.id), // Usuario que validó documentos del inquilino
  ownerDocsValidatedBy: varchar("owner_docs_validated_by").references(() => users.id), // Usuario que validó documentos del propietario
  tenantDocsValidatedAt: timestamp("tenant_docs_validated_at"), // Fecha de validación de documentos del inquilino
  ownerDocsValidatedAt: timestamp("owner_docs_validated_at"), // Fecha de validación de documentos del propietario
  // Contrato elaborado
  elaboratedContractUrl: text("elaborated_contract_url"), // URL del contrato elaborado final subido por el abogado
  elaboratedContractUploadedBy: varchar("elaborated_contract_uploaded_by").references(() => users.id), // Usuario que subió el contrato elaborado
  elaboratedContractUploadedAt: timestamp("elaborated_contract_uploaded_at"), // Fecha de subida del contrato elaborado
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  cancelledAt: timestamp("cancelled_at"), // Soft delete - cuando se cancela el contrato
  cancelledBy: varchar("cancelled_by").references(() => users.id), // Usuario que canceló el contrato
}, (table) => [
  index("idx_external_contracts_agency").on(table.agencyId),
  index("idx_external_contracts_unit").on(table.unitId),
  index("idx_external_contracts_property").on(table.propertyId),
  index("idx_external_contracts_client").on(table.clientId),
  index("idx_external_contracts_rental_form_group").on(table.rentalFormGroupId),
  index("idx_external_contracts_status").on(table.status),
  index("idx_external_contracts_dates").on(table.startDate, table.endDate),
  unique("unique_rental_form_group_id").on(table.rentalFormGroupId),
]);

export const insertExternalRentalContractSchema = createInsertSchema(externalRentalContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rentalPurpose: z.enum(["living", "sublease"]).default("living"),
});

export const updateExternalRentalContractSchema = insertExternalRentalContractSchema.partial().omit({
  agencyId: true,
  createdBy: true,
}).extend({
  rentalPurpose: z.enum(["living", "sublease"]).optional(),
});

export type InsertExternalRentalContract = z.infer<typeof insertExternalRentalContractSchema>;
export type ExternalRentalContract = typeof externalRentalContracts.$inferSelect;

// Extended schema for creating rental contracts with payment schedules in a single request
export const createRentalContractWithServicesSchema = z.object({
  contract: insertExternalRentalContractSchema,
  additionalServices: z.array(z.object({
    serviceType: z.enum(["rent", "water", "electricity", "internet", "gas", "maintenance", "cleaning", "parking", "other"]),
    amount: z.number().positive(),
    currency: z.string().default("MXN"),
    dayOfMonth: z.number().int().min(1).max(31),
    paymentFrequency: z.enum(["monthly", "bimonthly"]).default("monthly"),
    chargeType: z.enum(["fixed", "variable"]).default("fixed"),
    sendReminderDaysBefore: z.number().int().min(0).max(30).optional(),
    notes: z.string().optional(),
  })).optional().default([]),
});

export type CreateRentalContractWithServices = z.infer<typeof createRentalContractWithServicesSchema>;

// External Rental Tenants - Inquilinos adicionales (múltiples inquilinos por contrato)
export const externalRentalTenants = pgTable("external_rental_tenants", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => externalClients.id, { onDelete: "set null" }), // Referencia opcional a cliente existente
  fullName: varchar("full_name", { length: 255 }).notNull(), // Nombre completo del inquilino
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  idPhotoUrl: text("id_photo_url"), // URL de la foto de identificación oficial
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_tenants_contract").on(table.contractId),
  index("idx_external_tenants_client").on(table.clientId),
]);

export const insertExternalRentalTenantSchema = createInsertSchema(externalRentalTenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalRentalTenant = z.infer<typeof insertExternalRentalTenantSchema>;
export type ExternalRentalTenant = typeof externalRentalTenants.$inferSelect;

// External Rental Notes - Notas e incidencias del contrato de renta (immutable audit log)
export const externalRentalNotes = pgTable("external_rental_notes", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  noteType: rentalNoteTypeEnum("note_type").notNull().default("general"), // Tipo de nota
  severity: rentalNoteSeverityEnum("severity").default("info"), // Severidad (opcional)
  content: text("content").notNull(), // Contenido de la nota
  attachments: jsonb("attachments"), // URLs de archivos adjuntos {type: 'image'|'document', url: string, name: string}[]
  isArchived: boolean("is_archived").notNull().default(false), // Soft delete para ocultar sin perder historial
  createdBy: varchar("created_by").notNull().references(() => users.id), // Usuario que creó la nota
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_rental_notes_agency").on(table.agencyId),
  index("idx_external_rental_notes_contract").on(table.contractId),
  index("idx_external_rental_notes_type").on(table.noteType),
  index("idx_external_rental_notes_created").on(table.createdAt),
]);

export const insertExternalRentalNoteSchema = createInsertSchema(externalRentalNotes).omit({
  id: true,
  createdAt: true,
});

export const updateExternalRentalNoteSchema = z.object({
  isArchived: z.boolean().optional(), // Solo permitir archivar/desarchivar
});

export type InsertExternalRentalNote = z.infer<typeof insertExternalRentalNoteSchema>;
export type UpdateExternalRentalNote = z.infer<typeof updateExternalRentalNoteSchema>;
export type ExternalRentalNote = typeof externalRentalNotes.$inferSelect;

// Check-Out Reports - Reportes de salida para contratos completados
export const externalCheckoutReports = pgTable("external_checkout_reports", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  
  // Información del check-out
  checkoutDate: timestamp("checkout_date").notNull(), // Fecha de la inspección
  inspector: varchar("inspector", { length: 255 }), // Nombre del inspector
  inspectorSignatureUrl: text("inspector_signature_url"), // Firma del inspector
  tenantSignatureUrl: text("tenant_signature_url"), // Firma del inquilino
  
  // Inventario de salida (JSON array)
  inventoryItems: jsonb("inventory_items").notNull().default([]), // [{item: string, condition: 'good'|'fair'|'poor'|'missing', notes: string, estimatedCost?: number}]
  
  // Mantenimiento necesario (JSON array)
  maintenanceItems: jsonb("maintenance_items").notNull().default([]), // [{item: string, description: string, estimatedCost: number, photoUrl?: string}]
  
  // Limpieza (JSON array)
  cleaningChecklist: jsonb("cleaning_checklist").notNull().default([]), // [{area: string, status: 'clean'|'needs_cleaning', notes: string, estimatedCost?: number}]
  
  // Deducciones del depósito
  deductions: jsonb("deductions").notNull().default([]), // [{concept: string, amount: number, description: string}]
  totalDeductions: decimal("total_deductions", { precision: 10, scale: 2 }).notNull().default("0"),
  depositRefundAmount: decimal("deposit_refund_amount", { precision: 10, scale: 2 }), // Monto a devolver
  
  // Documentación
  photosUrls: text("photos_urls").array().default(sql`ARRAY[]::text[]`), // URLs de fotos de la unidad
  reportPdfUrl: text("report_pdf_url"), // URL del PDF generado
  
  // Estado y notas
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, completed
  notes: text("notes"),
  
  createdBy: varchar("created_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_checkout_agency").on(table.agencyId),
  index("idx_external_checkout_contract").on(table.contractId),
  index("idx_external_checkout_status").on(table.status),
]);

export const insertExternalCheckoutReportSchema = createInsertSchema(externalCheckoutReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
}).extend({
  checkoutDate: z.coerce.date(),
});

export const updateExternalCheckoutReportSchema = insertExternalCheckoutReportSchema.partial().omit({
  agencyId: true,
  contractId: true,
  createdBy: true,
});

export type InsertExternalCheckoutReport = z.infer<typeof insertExternalCheckoutReportSchema>;
export type UpdateExternalCheckoutReport = z.infer<typeof updateExternalCheckoutReportSchema>;
export type ExternalCheckoutReport = typeof externalCheckoutReports.$inferSelect;

// Payment frequency enum
export const paymentFrequencyEnum = pgEnum("payment_frequency", ["monthly", "bimonthly"]);

// Charge type enum
export const chargeTypeEnum = pgEnum("charge_type", ["fixed", "variable"]);

// External Payment Schedules - Pagos programados/recurrentes
export const externalPaymentSchedules = pgTable("external_payment_schedules", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  serviceType: serviceTypeEnum("service_type").notNull(), // rent, electricity, water, internet, etc
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Monto a pagar
  currency: varchar("currency", { length: 10 }).notNull().default("MXN"),
  dayOfMonth: integer("day_of_month").notNull(), // Día del mes para pagar (1-31)
  paymentFrequency: paymentFrequencyEnum("payment_frequency").notNull().default("monthly"), // Frecuencia de pago
  chargeType: chargeTypeEnum("charge_type").notNull().default("fixed"), // Tipo de cargo (fijo o variable)
  isActive: boolean("is_active").notNull().default(true), // Si está activo
  sendReminderDaysBefore: integer("send_reminder_days_before").default(3), // Días antes para enviar recordatorio
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_schedules_agency").on(table.agencyId),
  index("idx_external_schedules_contract").on(table.contractId),
  index("idx_external_schedules_active").on(table.isActive),
]);

export const insertExternalPaymentScheduleSchema = createInsertSchema(externalPaymentSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExternalPaymentScheduleSchema = insertExternalPaymentScheduleSchema.partial().omit({
  agencyId: true,
  contractId: true,
  createdBy: true,
});

export type InsertExternalPaymentSchedule = z.infer<typeof insertExternalPaymentScheduleSchema>;
export type UpdateExternalPaymentSchedule = z.infer<typeof updateExternalPaymentScheduleSchema>;
export type ExternalPaymentSchedule = typeof externalPaymentSchedules.$inferSelect;

// External Payments - Registro de pagos realizados
export const externalPayments = pgTable("external_payments", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  scheduleId: varchar("schedule_id").references(() => externalPaymentSchedules.id), // Si viene de un schedule
  serviceType: serviceTypeEnum("service_type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("MXN"),
  dueDate: timestamp("due_date").notNull(), // Fecha de vencimiento
  paidDate: timestamp("paid_date"), // Fecha de pago real
  status: externalPaymentStatusEnum("status").notNull().default("pending"),
  paymentMethod: varchar("payment_method", { length: 100 }), // Transferencia, efectivo, etc
  paymentReference: varchar("payment_reference", { length: 255 }), // Número de referencia
  paymentProofUrl: text("payment_proof_url"), // URL del comprobante
  reminderSentAt: timestamp("reminder_sent_at"), // Cuándo se envió el recordatorio
  notes: text("notes"),
  // Audit trail for payment processing
  paidBy: varchar("paid_by").references(() => users.id), // Usuario que registró el pago
  confirmedBy: varchar("confirmed_by").references(() => users.id), // Usuario que confirmó el pago
  confirmedAt: timestamp("confirmed_at"), // Cuándo se confirmó el pago
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_payments_agency").on(table.agencyId),
  index("idx_external_payments_contract").on(table.contractId),
  index("idx_external_payments_status").on(table.status),
  index("idx_external_payments_due_date").on(table.dueDate),
  index("idx_external_payments_service_type").on(table.serviceType),
  // TODO: Add unique index manually with SQL to prevent duplicate payments:
  // CREATE UNIQUE INDEX idx_external_payments_schedule_date_unique 
  // ON external_payments (schedule_id, DATE(due_date));
]);

export const insertExternalPaymentSchema = createInsertSchema(externalPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const markPaymentAsPaidSchema = z.object({
  paidDate: z.coerce.date(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentReference: z.string().optional(),
  paymentProofUrl: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertExternalPayment = z.infer<typeof insertExternalPaymentSchema>;
export type MarkPaymentAsPaid = z.infer<typeof markPaymentAsPaidSchema>;
export type ExternalPayment = typeof externalPayments.$inferSelect;

// External Notifications - Sistema de notificaciones automáticas
export const externalNotifications = pgTable("external_notifications", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Notification details
  type: notificationTypeEnum("type").notNull(), // payment_overdue, ticket_created, contract_expiring, etc
  priority: notificationPriorityEnum("priority").notNull().default("medium"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  
  // Recipients
  recipientUserId: varchar("recipient_user_id").references(() => users.id, { onDelete: "cascade" }), // Usuario específico (si aplica)
  recipientEmail: varchar("recipient_email", { length: 255 }), // Email directo (para externos)
  recipientPhone: varchar("recipient_phone", { length: 50 }), // Teléfono para SMS
  
  // Related entities
  contractId: varchar("contract_id").references(() => externalRentalContracts.id, { onDelete: "set null" }),
  paymentId: varchar("payment_id").references(() => externalPayments.id, { onDelete: "set null" }),
  ticketId: varchar("ticket_id").references(() => externalMaintenanceTickets.id, { onDelete: "set null" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  
  // Delivery tracking
  emailSent: boolean("email_sent").notNull().default(false),
  emailSentAt: timestamp("email_sent_at"),
  smsSent: boolean("sms_sent").notNull().default(false),
  smsSentAt: timestamp("sms_sent_at"),
  
  // Status
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  scheduledFor: timestamp("scheduled_for"), // Para notificaciones programadas
  expiresAt: timestamp("expires_at"), // Cuándo expira la notificación
  
  // Metadata
  metadata: jsonb("metadata"), // Datos adicionales flexibles
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ext_notif_agency").on(table.agencyId),
  index("idx_ext_notif_type").on(table.type),
  index("idx_ext_notif_priority").on(table.priority),
  index("idx_ext_notif_recipient_user").on(table.recipientUserId),
  index("idx_ext_notif_is_read").on(table.isRead),
  index("idx_ext_notif_scheduled").on(table.scheduledFor),
  index("idx_ext_notif_contract").on(table.contractId),
  index("idx_ext_notif_payment").on(table.paymentId),
  index("idx_ext_notif_ticket").on(table.ticketId),
]);

export const insertExternalNotificationSchema = createInsertSchema(externalNotifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExternalNotificationSchema = insertExternalNotificationSchema.partial().omit({
  agencyId: true,
});

export type InsertExternalNotification = z.infer<typeof insertExternalNotificationSchema>;
export type UpdateExternalNotification = z.infer<typeof updateExternalNotificationSchema>;
export type ExternalNotification = typeof externalNotifications.$inferSelect;

// External Maintenance Tickets - Sistema de tickets de mantenimiento
export const externalMaintenanceTickets = pgTable("external_maintenance_tickets", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }), // Unidad/propiedad
  contractId: varchar("contract_id").references(() => externalRentalContracts.id, { onDelete: "set null" }),
  propertyId: varchar("property_id").references(() => externalProperties.id, { onDelete: "cascade" }), // Deprecated - usar unitId
  quotationId: varchar("quotation_id").references(() => externalQuotations.id, { onDelete: "set null" }), // Cotización de origen
  title: varchar("title", { length: 255 }).notNull(), // Título del ticket
  description: text("description").notNull(), // Descripción del problema
  category: tenantMaintenanceTypeEnum("category").notNull(), // plumbing, electrical, etc
  priority: externalTicketPriorityEnum("priority").notNull().default("medium"),
  status: externalTicketStatusEnum("status").notNull().default("open"),
  reportedBy: varchar("reported_by", { length: 255 }), // Quién lo reportó
  assignedTo: varchar("assigned_to").references(() => users.id), // A quién está asignado
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }), // Costo estimado
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }), // Costo real
  quotedTotal: decimal("quoted_total", { precision: 12, scale: 2 }), // Total de la cotización (si viene de cotización)
  quotedAdminFee: decimal("quoted_admin_fee", { precision: 12, scale: 2 }), // Fee administrativo de la cotización
  quotedServices: jsonb("quoted_services"), // Snapshot de servicios cotizados
  scheduledDate: timestamp("scheduled_date"), // Fecha programada para resolver (deprecated - usar scheduledWindowStart/End)
  scheduledWindowStart: timestamp("scheduled_window_start"), // Inicio de ventana de programación
  scheduledWindowEnd: timestamp("scheduled_window_end"), // Fin de ventana de programación
  resolvedDate: timestamp("resolved_date"), // Fecha de resolución
  completionNotes: text("completion_notes"), // Notas de completación
  closedBy: varchar("closed_by").references(() => users.id), // Usuario que cerró el ticket
  closedAt: timestamp("closed_at"), // Fecha de cierre
  photos: text("photos").array().default(sql`ARRAY[]::text[]`), // URLs de fotos (deprecated - usar externalMaintenancePhotos)
  notes: text("notes"),
  
  // Closure report fields - Campos del reporte de cierre
  closureWorkNotes: text("closure_work_notes"), // Notas detalladas del trabajo realizado
  invoiceDate: timestamp("invoice_date"), // Fecha en la que se debe cobrar
  finalChargeAmount: decimal("final_charge_amount", { precision: 12, scale: 2 }), // Monto del trabajo a cobrar
  applyAdminFee: boolean("apply_admin_fee").default(true), // Si aplicar el 15% de costo administrativo
  adminFeeAmount: decimal("admin_fee_amount", { precision: 12, scale: 2 }), // Monto del fee administrativo (15%)
  totalChargeAmount: decimal("total_charge_amount", { precision: 12, scale: 2 }), // Total a cobrar (finalChargeAmount + adminFeeAmount)
  afterWorkPhotos: text("after_work_photos").array().default(sql`ARRAY[]::text[]`), // Fotos del después del trabajo
  accountingTransactionId: varchar("accounting_transaction_id"), // ID de la transacción contable generada
  accountingSyncStatus: varchar("accounting_sync_status", { length: 50 }).default("pending"), // pending, synced, error
  
  // Payment tracking - Estado de pagos
  workerPaymentStatus: varchar("worker_payment_status", { length: 50 }).default("pending"), // pending, paid - Si ya se le pagó al trabajador
  workerPaymentDate: timestamp("worker_payment_date"), // Fecha en que se pagó al trabajador
  agencyCollectedStatus: varchar("agency_collected_status", { length: 50 }).default("pending"), // pending, collected - Si la agencia ya cobró
  agencyCollectedDate: timestamp("agency_collected_date"), // Fecha en que la agencia cobró
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_tickets_agency").on(table.agencyId),
  index("idx_external_tickets_unit").on(table.unitId),
  index("idx_external_tickets_property").on(table.propertyId),
  index("idx_external_tickets_status").on(table.status),
  index("idx_external_tickets_priority").on(table.priority),
  index("idx_external_tickets_assigned").on(table.assignedTo),
  index("idx_external_tickets_scheduled").on(table.scheduledDate),
  index("idx_external_tickets_scheduled_window").on(table.scheduledWindowStart),
]);

export const insertExternalMaintenanceTicketSchema = createInsertSchema(externalMaintenanceTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalMaintenanceTicket = z.infer<typeof insertExternalMaintenanceTicketSchema>;
export type ExternalMaintenanceTicket = typeof externalMaintenanceTickets.$inferSelect;

// External Maintenance Updates - Actualizaciones y seguimiento de tickets de mantenimiento
export const externalMaintenanceUpdates = pgTable("external_maintenance_updates", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketId: varchar("ticket_id").notNull().references(() => externalMaintenanceTickets.id, { onDelete: "cascade" }),
  type: maintenanceUpdateTypeEnum("type").notNull(), // comment, status_change, assignment, etc
  notes: text("notes").notNull(), // Contenido de la actualización
  statusSnapshot: externalTicketStatusEnum("status_snapshot"), // Estado del ticket en este momento
  prioritySnapshot: externalTicketPriorityEnum("priority_snapshot"), // Prioridad en este momento
  assignedToSnapshot: varchar("assigned_to_snapshot"), // Usuario asignado en este momento
  createdBy: varchar("created_by").notNull().references(() => users.id), // Quien creó la actualización
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_maintenance_updates_ticket").on(table.ticketId),
  index("idx_maintenance_updates_created").on(table.createdAt),
]);

export const insertExternalMaintenanceUpdateSchema = createInsertSchema(externalMaintenanceUpdates).omit({
  id: true,
  createdAt: true,
});

export type InsertExternalMaintenanceUpdate = z.infer<typeof insertExternalMaintenanceUpdateSchema>;
export type ExternalMaintenanceUpdate = typeof externalMaintenanceUpdates.$inferSelect;

// External Maintenance Photos - Fotos de tickets de mantenimiento
export const externalMaintenancePhotos = pgTable("external_maintenance_photos", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketId: varchar("ticket_id").notNull().references(() => externalMaintenanceTickets.id, { onDelete: "cascade" }),
  updateId: varchar("update_id").references(() => externalMaintenanceUpdates.id, { onDelete: "set null" }), // Opcional: asociar con una actualización específica
  phase: maintenancePhotoPhaseEnum("phase").notNull().default("other"), // before, during, after, other
  storageKey: text("storage_key").notNull(), // Clave del archivo en object storage
  caption: text("caption"), // Descripción de la foto
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id), // Quien subió la foto
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => [
  index("idx_maintenance_photos_ticket").on(table.ticketId),
  index("idx_maintenance_photos_update").on(table.updateId),
  index("idx_maintenance_photos_phase").on(table.phase),
]);

export const insertExternalMaintenancePhotoSchema = createInsertSchema(externalMaintenancePhotos).omit({
  id: true,
  uploadedAt: true,
});

export type InsertExternalMaintenancePhoto = z.infer<typeof insertExternalMaintenancePhotoSchema>;
export type ExternalMaintenancePhoto = typeof externalMaintenancePhotos.$inferSelect;

// External Clients - Registro de clientes/inquilinos gestionados por agencias externas
export const externalClients = pgTable("external_clients", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Personal Information
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phoneCountryCode: varchar("phone_country_code", { length: 10 }).default("+52"),
  phone: varchar("phone", { length: 50 }),
  alternatePhone: varchar("alternate_phone", { length: 50 }),
  dateOfBirth: date("date_of_birth"),
  nationality: varchar("nationality", { length: 100 }),
  
  // Document Information
  idType: varchar("id_type", { length: 50 }), // passport, dni, driver_license, etc
  idNumber: varchar("id_number", { length: 100 }),
  idCountry: varchar("id_country", { length: 100 }),
  idExpirationDate: date("id_expiration_date"),
  
  // Contact Information
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  
  // Emergency Contact
  emergencyContactName: varchar("emergency_contact_name", { length: 200 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 50 }),
  emergencyContactRelation: varchar("emergency_contact_relation", { length: 100 }),
  
  // Preferences
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("es"), // es, en
  propertyTypePreference: varchar("property_type_preference", { length: 100 }), // apartment, house, studio, etc
  budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
  budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
  bedroomsPreference: integer("bedrooms_preference"),
  bathroomsPreference: integer("bathrooms_preference"),
  
  // Status & Verification
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, inactive, archived
  isVerified: boolean("is_verified").notNull().default(false),
  source: varchar("source", { length: 100 }), // referral, website, agent, social_media, lead_conversion, etc
  sourceLeadId: varchar("source_lead_id"), // ID del lead si el cliente fue convertido de un lead
  
  // Reconversión a Lead (cuando termina renta o manualmente)
  convertedBackToLeadId: varchar("converted_back_to_lead_id"), // ID del nuevo lead creado cuando se reconvierte
  convertedBackToLeadAt: timestamp("converted_back_to_lead_at"), // Fecha de reconversión a lead
  convertedBackReason: varchar("converted_back_reason", { length: 100 }), // rental_ended, manual, etc
  
  // Blacklist Management
  blacklistStatus: varchar("blacklist_status", { length: 50 }).default("none"), // none, warned, blacklisted
  blacklistReason: text("blacklist_reason"),
  blacklistedAt: timestamp("blacklisted_at"),
  blacklistedBy: varchar("blacklisted_by").references(() => users.id),
  
  // Notes & Tags
  notes: text("notes"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`), // Array de etiquetas para categorizar
  
  // History
  firstContactDate: timestamp("first_contact_date"),
  lastContactDate: timestamp("last_contact_date"),
  
  // Metadata
  // Rating
  cumulativeRating: integer("cumulative_rating").default(0), // Puntos de rating acumulados
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_clients_agency").on(table.agencyId),
  index("idx_external_clients_email").on(table.email),
  index("idx_external_clients_phone").on(table.phone),
  index("idx_external_clients_status").on(table.status),
  index("idx_external_clients_verified").on(table.isVerified),
  index("idx_external_clients_source_lead").on(table.sourceLeadId),
  index("idx_external_clients_converted_back").on(table.convertedBackToLeadId),
  index("idx_external_clients_blacklist").on(table.blacklistStatus),
]);

export const insertExternalClientSchema = createInsertSchema(externalClients).omit({
  id: true,
  agencyId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExternalClientSchema = insertExternalClientSchema.partial();

export type InsertExternalClient = z.infer<typeof insertExternalClientSchema>;
export type UpdateExternalClient = z.infer<typeof updateExternalClientSchema>;
export type ExternalClient = typeof externalClients.$inferSelect;

// External Client Documents - Documentos de identidad de clientes
export const externalClientDocuments = pgTable("external_client_documents", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: varchar("client_id").notNull().references(() => externalClients.id, { onDelete: "cascade" }),
  documentType: clientDocumentTypeEnum("document_type").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  storageKey: text("storage_key").notNull(), // Ruta en object storage
  notes: text("notes"),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => [
  index("idx_client_documents_client").on(table.clientId),
  index("idx_client_documents_type").on(table.documentType),
]);

export const insertExternalClientDocumentSchema = createInsertSchema(externalClientDocuments).omit({
  id: true,
  uploadedAt: true,
});

export type InsertExternalClientDocument = z.infer<typeof insertExternalClientDocumentSchema>;
export type ExternalClientDocument = typeof externalClientDocuments.$inferSelect;

// External Client Incidents - Incidencias/reportes de clientes
export const externalClientIncidents = pgTable("external_client_incidents", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: varchar("client_id").notNull().references(() => externalClients.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  severity: clientIncidentSeverityEnum("severity").notNull().default("low"),
  status: clientIncidentStatusEnum("status").notNull().default("open"),
  occurredAt: timestamp("occurred_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  reportedBy: varchar("reported_by").notNull().references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_client_incidents_client").on(table.clientId),
  index("idx_client_incidents_severity").on(table.severity),
  index("idx_client_incidents_status").on(table.status),
  index("idx_client_incidents_occurred").on(table.occurredAt),
]);

export const insertExternalClientIncidentSchema = createInsertSchema(externalClientIncidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  occurredAt: z.coerce.date(),
  resolvedAt: z.coerce.date().optional(),
});

export const updateExternalClientIncidentSchema = insertExternalClientIncidentSchema.partial();

export type InsertExternalClientIncident = z.infer<typeof insertExternalClientIncidentSchema>;
export type UpdateExternalClientIncident = z.infer<typeof updateExternalClientIncidentSchema>;
export type ExternalClientIncident = typeof externalClientIncidents.$inferSelect;

// External Presentation Card Status Enum
export const presentationCardStatusEnum = pgEnum("presentation_card_status", [
  "active",
  "inactive",
  "archived",
]);

// External Property Showing Outcome Enum
export const showingOutcomeEnum = pgEnum("showing_outcome", [
  "interested",
  "not_interested", 
  "pending",
  "visited",
  "no_show",
  "cancelled",
]);

// External Presentation Cards - Search profiles for leads/clients
export const externalPresentationCards = pgTable("external_presentation_cards", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Link to lead OR client (one required)
  leadId: varchar("lead_id").references(() => externalLeads.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => externalClients.id, { onDelete: "cascade" }),
  
  // Card Info
  title: varchar("title", { length: 200 }).notNull(), // "Búsqueda #1", "Renta Corta Playa", etc.
  cardNumber: integer("card_number").notNull().default(1), // Auto-incrementing per lead/client
  
  // Property Preferences
  propertyType: varchar("property_type", { length: 100 }), // departamento, casa, estudio, etc.
  modality: varchar("modality", { length: 50 }).default("rent"), // rent, sale, both
  minBudget: decimal("min_budget", { precision: 10, scale: 2 }),
  maxBudget: decimal("max_budget", { precision: 10, scale: 2 }),
  budgetText: varchar("budget_text", { length: 100 }), // "25-35mil", flexible text
  bedrooms: integer("bedrooms"),
  bedroomsText: varchar("bedrooms_text", { length: 20 }), // "1-2", "2/3"
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  
  // Location & Timing
  preferredZone: varchar("preferred_zone", { length: 200 }), // La Veleta, Aldea Zama, etc.
  moveInDate: timestamp("move_in_date"),
  moveInDateText: varchar("move_in_date_text", { length: 100 }), // "Noviembre", "Inmediato"
  contractDuration: varchar("contract_duration", { length: 100 }), // "6 meses", "1 año"
  
  // Pets
  hasPets: boolean("has_pets").default(false),
  petsDescription: varchar("pets_description", { length: 200 }), // "2 perros pequeños"
  
  // Additional Requirements
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`), // pool, gym, parking, etc. (legacy text)
  desiredCharacteristics: text("desired_characteristics").array().default(sql`ARRAY[]::text[]`), // IDs of agency characteristics
  desiredAmenities: text("desired_amenities").array().default(sql`ARRAY[]::text[]`), // IDs of agency amenities
  additionalRequirements: text("additional_requirements"),
  specificProperty: varchar("specific_property", { length: 200 }), // "Naia Naay E302"
  
  // Status & Usage
  status: presentationCardStatusEnum("status").notNull().default("active"),
  isDefault: boolean("is_default").notNull().default(false), // Primary search profile
  usageCount: integer("usage_count").notNull().default(0), // How many times used for showings
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_presentation_cards_agency").on(table.agencyId),
  index("idx_presentation_cards_lead").on(table.leadId),
  index("idx_presentation_cards_client").on(table.clientId),
  index("idx_presentation_cards_status").on(table.status),
]);

export const insertExternalPresentationCardSchema = createInsertSchema(externalPresentationCards).omit({
  id: true,
  agencyId: true,
  cardNumber: true,
  usageCount: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  moveInDate: z.coerce.date().optional(),
});

export const updateExternalPresentationCardSchema = insertExternalPresentationCardSchema.partial();

export type InsertExternalPresentationCard = z.infer<typeof insertExternalPresentationCardSchema>;
export type UpdateExternalPresentationCard = z.infer<typeof updateExternalPresentationCardSchema>;
export type ExternalPresentationCard = typeof externalPresentationCards.$inferSelect;

// External Property Showings - Track property visits linked to cards
export const externalPropertyShowings = pgTable("external_property_showings", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Links
  presentationCardId: varchar("presentation_card_id").references(() => externalPresentationCards.id, { onDelete: "set null" }),
  appointmentId: varchar("appointment_id").references(() => externalAppointments.id, { onDelete: "set null" }),
  leadId: varchar("lead_id").references(() => externalLeads.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => externalClients.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }),
  
  // Showing Details
  shownAt: timestamp("shown_at").notNull(), // When the property was shown
  outcome: showingOutcomeEnum("outcome").notNull().default("pending"),
  
  // Feedback
  clientFeedback: text("client_feedback"), // What the client said
  agentNotes: text("agent_notes"), // Internal notes from agent
  rating: integer("rating"), // 1-5 star rating from client
  
  // Follow-up
  followUpDate: timestamp("follow_up_date"),
  followUpNotes: text("follow_up_notes"),
  
  // Metadata
  recordedBy: varchar("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_property_showings_agency").on(table.agencyId),
  index("idx_property_showings_card").on(table.presentationCardId),
  index("idx_property_showings_appointment").on(table.appointmentId),
  index("idx_property_showings_lead").on(table.leadId),
  index("idx_property_showings_client").on(table.clientId),
  index("idx_property_showings_unit").on(table.unitId),
  index("idx_property_showings_outcome").on(table.outcome),
  index("idx_property_showings_shown_at").on(table.shownAt),
]);

export const insertExternalPropertyShowingSchema = createInsertSchema(externalPropertyShowings).omit({
  id: true,
  agencyId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  shownAt: z.coerce.date(),
  followUpDate: z.coerce.date().optional(),
});

export const updateExternalPropertyShowingSchema = insertExternalPropertyShowingSchema.partial();

export type InsertExternalPropertyShowing = z.infer<typeof insertExternalPropertyShowingSchema>;
export type UpdateExternalPropertyShowing = z.infer<typeof updateExternalPropertyShowingSchema>;
export type ExternalPropertyShowing = typeof externalPropertyShowings.$inferSelect;

// External Brokers - Brokers/referidores externos que comparten leads con la agencia
export const externalBrokers = pgTable("external_brokers", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Personal Information
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phoneCountryCode: varchar("phone_country_code", { length: 10 }).default("+52"),
  phone: varchar("phone", { length: 50 }),
  
  // Company Information
  company: varchar("company", { length: 200 }), // Nombre de su inmobiliaria/empresa
  companyLogo: text("company_logo"), // URL del logo de la empresa
  website: varchar("website", { length: 255 }), // Sitio web del broker
  
  // Commission & Financial
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("20.00"), // Porcentaje de comisión (default 20%)
  
  // Status & Tracking
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, inactive, blocked
  totalLeadsShared: integer("total_leads_shared").default(0), // Total de leads compartidos
  totalLeadsConverted: integer("total_leads_converted").default(0), // Leads que se convirtieron en rentas
  totalCommissionsEarned: decimal("total_commissions_earned", { precision: 12, scale: 2 }).default("0.00"),
  
  // Notes & Tags
  notes: text("notes"),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  
  // Freelancer flag
  isFreelancer: boolean("is_freelancer").default(false), // true = freelancer, false = works for company
  
  // Terms Acceptance
  termsAcceptedAt: timestamp("terms_accepted_at"), // When broker accepted commission terms
  termsVersion: varchar("terms_version", { length: 50 }), // Version of terms accepted (e.g., "1.0")
  
  // Referral tracking
  referredBySellerId: varchar("referred_by_seller_id").references(() => users.id, { onDelete: "set null" }), // Seller who invited this broker
  registrationSource: varchar("registration_source", { length: 50 }).default("public_link"), // "public_link" | "seller_invite"
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_brokers_agency").on(table.agencyId),
  index("idx_external_brokers_email").on(table.email),
  index("idx_external_brokers_phone").on(table.phone),
  index("idx_external_brokers_status").on(table.status),
  index("idx_external_brokers_company").on(table.company),
  index("idx_external_brokers_referred_by").on(table.referredBySellerId),
]);

export const insertExternalBrokerSchema = createInsertSchema(externalBrokers).omit({
  id: true,
  agencyId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  totalLeadsShared: true,
  totalLeadsConverted: true,
  totalCommissionsEarned: true,
  termsAcceptedAt: true, // Set by backend when terms are accepted
  termsVersion: true, // Set by backend when terms are accepted
});

export const updateExternalBrokerSchema = insertExternalBrokerSchema.partial();

export type InsertExternalBroker = z.infer<typeof insertExternalBrokerSchema>;
export type UpdateExternalBroker = z.infer<typeof updateExternalBrokerSchema>;
export type ExternalBroker = typeof externalBrokers.$inferSelect;

// External Leads - Leads registrados por brokers o sellers que se convierten en clientes
export const externalLeads = pgTable("external_leads", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Tipo de registro
  registrationType: leadRegistrationTypeEnum("registration_type").notNull(), // broker o seller
  
  // Información básica
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  phoneLast4: varchar("phone_last4", { length: 4 }), // Solo últimos 4 dígitos para broker
  
  // Detalles de búsqueda de propiedad
  contractDuration: varchar("contract_duration", { length: 50 }), // e.g., "6 meses", "1 año"
  checkInDate: timestamp("check_in_date"), // Fecha deseada de entrada (timestamp)
  checkInDateText: varchar("check_in_date_text", { length: 100 }), // Fecha de mudanza como texto (ej: "Noviembre", "Inmediato")
  hasPets: varchar("has_pets", { length: 100 }), // "Sí", "No", "1 Gato", "2 perros", etc.
  petQuantity: integer("pet_quantity"), // Cantidad de mascotas
  budgetMin: decimal("budget_min", { precision: 12, scale: 2 }), // Presupuesto mínimo del cliente
  budgetMax: decimal("budget_max", { precision: 12, scale: 2 }), // Presupuesto máximo del cliente
  estimatedRentCost: integer("estimated_rent_cost"), // [DEPRECATED] Usar budgetMin/budgetMax
  estimatedRentCostText: varchar("estimated_rent_cost_text", { length: 50 }), // [DEPRECATED] Usar budgetMin/budgetMax
  bedrooms: integer("bedrooms"), // Número de recámaras deseadas (número)
  bedroomsText: varchar("bedrooms_text", { length: 20 }), // Recámaras como texto (ej: "1/2", "1-2", "2/3")
  desiredUnitType: varchar("desired_unit_type", { length: 100 }), // Casa, Departamento, etc.
  desiredProperty: varchar("desired_property", { length: 200 }), // Propiedad específica de interés (ej: "Naia naay E302", "Stella D101")
  desiredNeighborhood: varchar("desired_neighborhood", { length: 200 }), // Colonia preferida (ej: "La veleta", "Aldea zama")
  
  // Propiedad de interés (vinculada a propiedades existentes)
  interestedCondominiumId: varchar("interested_condominium_id"), // Condominio de interés (ID de externalCondominiums) - deprecated, usar array
  interestedUnitId: varchar("interested_unit_id"), // Unidad específica de interés (ID de externalUnits) - deprecated, usar array
  interestedCondominiumIds: text("interested_condominium_ids").array(), // Condominios de interés (múltiple selección)
  interestedUnitIds: text("interested_unit_ids").array(), // Unidades específicas de interés (múltiple selección)
  
  // Preferencias de características y amenidades
  desiredCharacteristics: text("desired_characteristics").array(), // IDs de características deseadas
  desiredAmenities: text("desired_amenities").array(), // IDs de amenidades deseadas
  requiresPavedStreet: boolean("requires_paved_street"), // Requiere calle asfaltada
  
  // Vendedor (puede ser seleccionado o escrito manualmente)
  sellerId: varchar("seller_id").references(() => users.id), // Vendedor asignado (si es seleccionado)
  sellerName: varchar("seller_name", { length: 200 }), // Nombre del vendedor (si es texto libre)
  assistantSellerName: varchar("assistant_seller_name", { length: 200 }), // Vendedor secundario/asistente
  
  // Broker externo (para leads compartidos por brokers)
  brokerId: varchar("broker_id").references(() => externalBrokers.id, { onDelete: "set null" }), // Broker que compartió el lead
  
  // Estado y origen
  status: externalLeadStatusEnum("status").notNull().default("nuevo_lead"),
  source: varchar("source", { length: 100 }), // de dónde vino el lead
  notes: text("notes"),
  
  // Contact dates
  firstContactDate: timestamp("first_contact_date"),
  lastContactDate: timestamp("last_contact_date"),
  
  // Expiración del lead (3 meses por defecto)
  validUntil: timestamp("valid_until"), // Fecha de expiración del lead
  
  // Lead Conversion - cuando el lead se convierte en cliente
  convertedToClientId: varchar("converted_to_client_id"), // ID del cliente creado (si fue convertido)
  convertedAt: timestamp("converted_at"), // Fecha de conversión
  
  // Offer & Form tracking
  offerSentAt: timestamp("offer_sent_at"), // Cuando se envió la oferta de renta
  offerCompletedAt: timestamp("offer_completed_at"), // Cuando el lead completó la oferta
  formSentAt: timestamp("form_sent_at"), // Cuando se envió el formato de inquilino
  formCompletedAt: timestamp("form_completed_at"), // Cuando el lead completó el formato
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  originalCreatedAt: timestamp("original_created_at"), // Fecha original del registro (para importaciones)
  // Rating
  cumulativeRating: integer("cumulative_rating").default(0), // Puntos de rating acumulados

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_leads_agency").on(table.agencyId),
  index("idx_external_leads_status").on(table.status),
  index("idx_external_leads_registration_type").on(table.registrationType),
  index("idx_external_leads_valid_until").on(table.validUntil),
  index("idx_external_leads_converted").on(table.convertedToClientId),
  index("idx_external_leads_broker").on(table.brokerId),
  index("idx_external_leads_seller").on(table.sellerId),
  index("idx_external_leads_agency_seller").on(table.agencyId, table.sellerId),
  index("idx_external_leads_agency_status").on(table.agencyId, table.status),
  index("idx_external_leads_created_at").on(table.createdAt),
]);

const baseExternalLeadSchema = createInsertSchema(externalLeads).omit({
  id: true,
  agencyId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  validUntil: true, // Se calcula automáticamente (3 meses desde registro)
  originalCreatedAt: true, // Solo para importaciones
}).extend({
  // Override budgetMin/budgetMax to accept both numbers and strings (decimals from DB come as numbers)
  budgetMin: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : val
  ),
  budgetMax: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : val
  ),
});

export const insertExternalLeadSchema = baseExternalLeadSchema.refine((data) => {
  // Broker validation: must provide phoneLast4
  if (data.registrationType === 'broker') {
    return data.phoneLast4 && data.phoneLast4.length === 4;
  }
  // Seller validation: must provide full phone (email is optional)
  if (data.registrationType === 'seller') {
    return data.phone && data.phone.length > 0;
  }
  return true;
}, {
  message: "Broker must provide last 4 digits of phone. Seller must provide full phone.",
});

export const updateExternalLeadSchema = baseExternalLeadSchema.partial().refine((data) => {
  // Only validate if registrationType is being updated or is present
  if (!data.registrationType) return true;
  
  // Broker validation: if phoneLast4 is provided, must be 4 digits
  if (data.registrationType === 'broker' && data.phoneLast4) {
    return data.phoneLast4.length === 4;
  }
  // Seller validation: if updating to seller, ensure phone and email exist
  if (data.registrationType === 'seller') {
    if (data.phone !== undefined || data.email !== undefined) {
      return (!data.phone || data.phone.length > 0) && (!data.email || data.email.length > 0);
    }
  }
  return true;
}, {
  message: "Invalid data for registration type.",
});

export type InsertExternalLead = z.infer<typeof insertExternalLeadSchema>;
export type UpdateExternalLead = z.infer<typeof updateExternalLeadSchema>;
export type ExternalLead = typeof externalLeads.$inferSelect;

// Active Card summary for enriched lead responses
export interface ActiveCardSummary {
  id: string;
  title: string | null;
  propertyType: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  budgetText: string | null;
  bedrooms: number | null;
  bedroomsText: string | null;
  bathrooms: number | null;
  hasPets: string | null;
  zone: string | null;
  moveInDate: Date | string | null;
  contractDuration: string | null;
  interestedUnitIds: string[] | null;
}

// Enriched lead type with active presentation card data
export type ExternalLeadWithActiveCard = ExternalLead & {
  activeCard: ActiveCardSummary | null;
};

// External Lead Registration Tokens - Links públicos para registro de leads (vendedores/brokers)
export const externalLeadRegistrationTokens = pgTable("external_lead_registration_tokens", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: varchar("token").notNull().unique(), // Token único para la URL pública
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  agencyName: varchar("agency_name", { length: 255 }).notNull(), // Nombre de agencia para mostrar en formulario
  registrationType: leadRegistrationTypeEnum("registration_type").notNull(), // seller o broker
  expiresAt: timestamp("expires_at").notNull(), // 7 días de expiración
  completedAt: timestamp("completed_at"), // Cuando se completó el registro
  leadId: varchar("lead_id").references(() => externalLeads.id, { onDelete: "set null" }), // Lead creado a partir de este token
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_lead_reg_tokens_agency").on(table.agencyId),
  index("idx_external_lead_reg_tokens_expires").on(table.expiresAt),
  index("idx_external_lead_reg_tokens_completed").on(table.completedAt),
]);

export const insertExternalLeadRegistrationTokenSchema = createInsertSchema(externalLeadRegistrationTokens).omit({
  id: true,
  completedAt: true,
  leadId: true,
  createdAt: true,
  updatedAt: true,
});

// Schema simplificado para crear links desde el frontend (solo requiere registrationType)
export const createLeadRegistrationLinkSchema = z.object({
  registrationType: z.enum(["broker", "seller", "client"]),
});

export type InsertExternalLeadRegistrationToken = z.infer<typeof insertExternalLeadRegistrationTokenSchema>;
export type CreateLeadRegistrationLink = z.infer<typeof createLeadRegistrationLinkSchema>;
export type ExternalLeadRegistrationToken = typeof externalLeadRegistrationTokens.$inferSelect;

// ========================================
// CRM TABLES - Lead & Client Activity Tracking
// ========================================

// Enum for activity types
export const crmActivityTypeEnum = pgEnum("crm_activity_type", [
  "call",
  "email", 
  "meeting",
  "whatsapp",
  "showing",
  "note",
  "status_change",
  "document_upload",
  "contract_created",
  "payment",
  "other"
]);

// Lead Activities - Track all interactions with leads
export const externalLeadActivities = pgTable("external_lead_activities", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: varchar("lead_id").notNull().references(() => externalLeads.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  activityType: crmActivityTypeEnum("activity_type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // For scheduled activities
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  
  // Outcome/result of the activity
  outcome: varchar("outcome", { length: 100 }), // positive, negative, neutral, pending
  outcomeNotes: text("outcome_notes"),
  
  // Related references
  relatedPropertyId: varchar("related_property_id").references(() => externalProperties.id, { onDelete: "set null" }),
  relatedUnitId: varchar("related_unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  
  // Metadata
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_lead_activities_lead").on(table.leadId),
  index("idx_lead_activities_agency").on(table.agencyId),
  index("idx_lead_activities_type").on(table.activityType),
  index("idx_lead_activities_created").on(table.createdAt),
]);

export const insertExternalLeadActivitySchema = createInsertSchema(externalLeadActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalLeadActivity = z.infer<typeof insertExternalLeadActivitySchema>;
export type ExternalLeadActivity = typeof externalLeadActivities.$inferSelect;

// Lead Status History - Track status changes for leads
export const externalLeadStatusHistory = pgTable("external_lead_status_history", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: varchar("lead_id").notNull().references(() => externalLeads.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }).notNull(),
  reason: text("reason"),
  
  changedBy: varchar("changed_by").notNull().references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
}, (table) => [
  index("idx_lead_status_history_lead").on(table.leadId),
  index("idx_lead_status_history_agency").on(table.agencyId),
  index("idx_lead_status_history_changed").on(table.changedAt),
]);

export const insertExternalLeadStatusHistorySchema = createInsertSchema(externalLeadStatusHistory).omit({
  id: true,
  changedAt: true,
});

export type InsertExternalLeadStatusHistory = z.infer<typeof insertExternalLeadStatusHistorySchema>;
export type ExternalLeadStatusHistory = typeof externalLeadStatusHistory.$inferSelect;

// Lead Showings - Track property showings for leads
export const externalLeadShowings = pgTable("external_lead_showings", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: varchar("lead_id").notNull().references(() => externalLeads.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => externalProperties.id, { onDelete: "set null" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  
  // Property details (in case property is deleted)
  propertyName: varchar("property_name", { length: 255 }),
  unitNumber: varchar("unit_number", { length: 50 }),
  
  // Scheduling
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").default(30), // minutes
  
  // Status and outcome
  status: varchar("status", { length: 50 }).notNull().default("scheduled"), // scheduled, completed, cancelled, no_show
  outcome: varchar("outcome", { length: 50 }), // interested, not_interested, needs_follow_up, made_offer
  
  // Feedback
  leadFeedback: text("lead_feedback"),
  agentNotes: text("agent_notes"),
  rating: integer("rating"), // 1-5 stars for the property from lead's perspective
  
  // Agent
  agentId: varchar("agent_id").references(() => users.id, { onDelete: "set null" }),
  
  // Metadata
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_lead_showings_lead").on(table.leadId),
  index("idx_lead_showings_agency").on(table.agencyId),
  index("idx_lead_showings_property").on(table.propertyId),
  index("idx_lead_showings_scheduled").on(table.scheduledAt),
  index("idx_lead_showings_status").on(table.status),
]);

export const insertExternalLeadShowingSchema = createInsertSchema(externalLeadShowings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledAt: z.coerce.date(),
});

export const updateExternalLeadShowingSchema = insertExternalLeadShowingSchema.partial();

export type InsertExternalLeadShowing = z.infer<typeof insertExternalLeadShowingSchema>;
export type UpdateExternalLeadShowing = z.infer<typeof updateExternalLeadShowingSchema>;
export type ExternalLeadShowing = typeof externalLeadShowings.$inferSelect;

// Lead Reminders - Private reminders for sellers about their leads
export const externalLeadReminders = pgTable("external_lead_reminders", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: varchar("lead_id").notNull().references(() => externalLeads.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Reminder details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reminderDate: timestamp("reminder_date").notNull(),
  reminderTime: varchar("reminder_time", { length: 10 }), // HH:mm format
  
  // Type and priority
  reminderType: varchar("reminder_type", { length: 50 }).notNull().default("follow_up"), // follow_up, call, meeting, deadline, other
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, dismissed
  completedAt: timestamp("completed_at"),
  
  // Notification settings
  notifyBefore: integer("notify_before").default(30), // minutes before to notify
  isNotified: boolean("is_notified").default(false),
  
  // Privacy - only visible to the seller who created it
  isPrivate: boolean("is_private").default(true),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_lead_reminders_lead").on(table.leadId),
  index("idx_lead_reminders_seller").on(table.sellerId),
  index("idx_lead_reminders_agency").on(table.agencyId),
  index("idx_lead_reminders_date").on(table.reminderDate),
  index("idx_lead_reminders_status").on(table.status),
]);

export const insertExternalLeadReminderSchema = createInsertSchema(externalLeadReminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  reminderDate: z.coerce.date(),
});

export const updateExternalLeadReminderSchema = insertExternalLeadReminderSchema.partial();

export type InsertExternalLeadReminder = z.infer<typeof insertExternalLeadReminderSchema>;
export type UpdateExternalLeadReminder = z.infer<typeof updateExternalLeadReminderSchema>;
export type ExternalLeadReminder = typeof externalLeadReminders.$inferSelect;

// Lead Property Sent - Track properties sent/shared with leads
export const externalLeadPropertySent = pgTable("external_lead_property_sent", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: varchar("lead_id").notNull().references(() => externalLeads.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => externalProperties.id, { onDelete: "set null" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  
  // Property snapshot (in case property is deleted)
  propertyName: varchar("property_name", { length: 255 }),
  unitNumber: varchar("unit_number", { length: 50 }),
  rentPrice: decimal("rent_price", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("MXN"),
  bedrooms: integer("bedrooms"),
  zone: varchar("zone", { length: 100 }),
  
  // Sharing details
  sharedVia: varchar("shared_via", { length: 50 }).notNull().default("whatsapp"), // whatsapp, email, in_person, catalog
  message: text("message"), // Custom message sent with property
  templateUsed: varchar("template_used", { length: 100 }), // Template name if used
  
  // Lead response
  leadResponse: varchar("lead_response", { length: 50 }), // interested, not_interested, pending, visited
  responseNotes: text("response_notes"),
  respondedAt: timestamp("responded_at"),
  
  // If this led to a rental offer
  rentalOfferId: varchar("rental_offer_id"),
  
  // Metadata
  sentBy: varchar("sent_by").notNull().references(() => users.id),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (table) => [
  index("idx_lead_property_sent_lead").on(table.leadId),
  index("idx_lead_property_sent_agency").on(table.agencyId),
  index("idx_lead_property_sent_property").on(table.propertyId),
  index("idx_lead_property_sent_at").on(table.sentAt),
  index("idx_lead_property_sent_response").on(table.leadResponse),
]);

export const insertExternalLeadPropertySentSchema = createInsertSchema(externalLeadPropertySent).omit({
  id: true,
  sentAt: true,
});

export const updateExternalLeadPropertySentSchema = insertExternalLeadPropertySentSchema.partial();

export type InsertExternalLeadPropertySent = z.infer<typeof insertExternalLeadPropertySentSchema>;
export type UpdateExternalLeadPropertySent = z.infer<typeof updateExternalLeadPropertySentSchema>;
export type ExternalLeadPropertySent = typeof externalLeadPropertySent.$inferSelect;

// Client Activities - Track all interactions with clients
export const externalClientActivities = pgTable("external_client_activities", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: varchar("client_id").notNull().references(() => externalClients.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  activityType: crmActivityTypeEnum("activity_type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // For scheduled activities
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  
  // Outcome/result
  outcome: varchar("outcome", { length: 100 }), // positive, negative, neutral, pending
  outcomeNotes: text("outcome_notes"),
  
  // Related references
  relatedContractId: varchar("related_contract_id").references(() => externalRentalContracts.id, { onDelete: "set null" }),
  relatedPropertyId: varchar("related_property_id").references(() => externalProperties.id, { onDelete: "set null" }),
  relatedUnitId: varchar("related_unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  
  // Metadata
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_client_activities_client").on(table.clientId),
  index("idx_client_activities_agency").on(table.agencyId),
  index("idx_client_activities_type").on(table.activityType),
  index("idx_client_activities_created").on(table.createdAt),
]);

export const insertExternalClientActivitySchema = createInsertSchema(externalClientActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalClientActivity = z.infer<typeof insertExternalClientActivitySchema>;
export type ExternalClientActivity = typeof externalClientActivities.$inferSelect;

// Client Property History - Track all properties a client has been associated with
export const externalClientPropertyHistory = pgTable("external_client_property_history", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: varchar("client_id").notNull().references(() => externalClients.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => externalProperties.id, { onDelete: "set null" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  contractId: varchar("contract_id").references(() => externalRentalContracts.id, { onDelete: "set null" }),
  
  // Property details snapshot (in case property is deleted)
  propertyName: varchar("property_name", { length: 255 }),
  unitNumber: varchar("unit_number", { length: 50 }),
  
  // Tenure details
  relationshipType: varchar("relationship_type", { length: 50 }).notNull(), // tenant, owner, prospect, previous_tenant
  startDate: date("start_date"),
  endDate: date("end_date"),
  
  // Financial snapshot
  monthlyRent: decimal("monthly_rent", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("MXN"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_client_property_history_client").on(table.clientId),
  index("idx_client_property_history_agency").on(table.agencyId),
  index("idx_client_property_history_property").on(table.propertyId),
  index("idx_client_property_history_unit").on(table.unitId),
  index("idx_client_property_history_type").on(table.relationshipType),
]);

export const insertExternalClientPropertyHistorySchema = createInsertSchema(externalClientPropertyHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type InsertExternalClientPropertyHistory = z.infer<typeof insertExternalClientPropertyHistorySchema>;
export type ExternalClientPropertyHistory = typeof externalClientPropertyHistory.$inferSelect;

// External Quotations - Cotizaciones profesionales para trabajos de mantenimiento
export const externalQuotations = pgTable("external_quotations", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => externalClients.id, { onDelete: "set null" }),
  propertyId: varchar("property_id").references(() => externalProperties.id, { onDelete: "set null" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"), // Descripción del trabajo/problema
  solutionDescription: text("solution_description"), // Descripción de la solución propuesta
  
  // Servicios como JSONB array: [{ id, name, description, quantity, unitPrice, subtotal }]
  services: jsonb("services").notNull().default("[]"),
  
  // Cálculos financieros
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  adminFee: decimal("admin_fee", { precision: 12, scale: 2 }).notNull().default("0"), // 15% del subtotal
  adminFeePercentage: decimal("admin_fee_percentage", { precision: 5, scale: 2 }).notNull().default("15.00"), // Configurable, default 15%
  total: decimal("total", { precision: 12, scale: 2 }).notNull().default("0"), // subtotal + adminFee
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  
  // Información adicional
  notes: text("notes"),
  terms: text("terms"), // Términos y condiciones de la cotización
  
  // Estado y fechas
  status: externalQuotationStatusEnum("status").notNull().default("draft"),
  sentAt: timestamp("sent_at"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Referencias
  convertedTicketId: varchar("converted_ticket_id").references(() => externalMaintenanceTickets.id, { onDelete: "set null" }),
  shareTokenId: varchar("share_token_id"), // ID del token de compartir
  
  // Metadata
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_quotations_agency").on(table.agencyId),
  index("idx_external_quotations_client").on(table.clientId),
  index("idx_external_quotations_property").on(table.propertyId),
  index("idx_external_quotations_unit").on(table.unitId),
  index("idx_external_quotations_status").on(table.status),
  index("idx_external_quotations_created_by").on(table.createdBy),
]);

export const insertExternalQuotationSchema = createInsertSchema(externalQuotations).omit({
  id: true,
  sentAt: true,
  approvedAt: true,
  rejectedAt: true,
  cancelledAt: true,
  convertedTicketId: true,
  shareTokenId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExternalQuotationSchema = insertExternalQuotationSchema.partial().omit({
  agencyId: true,
  createdBy: true,
});

export type InsertExternalQuotation = z.infer<typeof insertExternalQuotationSchema>;
export type UpdateExternalQuotation = z.infer<typeof updateExternalQuotationSchema>;
export type ExternalQuotation = typeof externalQuotations.$inferSelect;

// External Quotation Tokens - Links públicos para compartir cotizaciones
export const externalQuotationTokens = pgTable("external_quotation_tokens", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  quotationId: varchar("quotation_id").notNull().references(() => externalQuotations.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(), // Token único para la URL pública
  expiresAt: timestamp("expires_at"), // Opcional - puede no expirar
  accessCount: integer("access_count").notNull().default(0), // Contador de accesos
  lastAccessedAt: timestamp("last_accessed_at"), // Última vez que se accedió
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_quotation_tokens_quotation").on(table.quotationId),
  index("idx_external_quotation_tokens_expires").on(table.expiresAt),
]);

export const insertExternalQuotationTokenSchema = createInsertSchema(externalQuotationTokens).omit({
  id: true,
  accessCount: true,
  lastAccessedAt: true,
  createdAt: true,
});

export type InsertExternalQuotationToken = z.infer<typeof insertExternalQuotationTokenSchema>;
export type ExternalQuotationToken = typeof externalQuotationTokens.$inferSelect;

// External Terms and Conditions - Términos y condiciones para inquilinos y propietarios del sistema externo
export const externalTermsAndConditions = pgTable("external_terms_and_conditions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  type: externalTermsTypeEnum("type").notNull(), // tenant o owner
  version: varchar("version", { length: 50 }).notNull(), // e.g., "1.0", "1.1", "2.0"
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(), // Markdown o HTML del contenido
  isActive: boolean("is_active").notNull().default(false), // Solo una versión activa a la vez por tipo y agencia
  publishedAt: timestamp("published_at"),
  publishedBy: varchar("published_by").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_terms_agency").on(table.agencyId),
  index("idx_external_terms_type").on(table.type),
  index("idx_external_terms_active").on(table.isActive),
  index("idx_external_terms_published").on(table.publishedAt),
  unique("unique_external_terms_active").on(table.agencyId, table.type, table.isActive), // Solo una versión activa por tipo y agencia
]);

export const insertExternalTermsAndConditionsSchema = createInsertSchema(externalTermsAndConditions).omit({
  id: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExternalTermsAndConditionsSchema = insertExternalTermsAndConditionsSchema.partial().omit({
  agencyId: true,
  createdBy: true,
});

export type InsertExternalTermsAndConditions = z.infer<typeof insertExternalTermsAndConditionsSchema>;
export type UpdateExternalTermsAndConditions = z.infer<typeof updateExternalTermsAndConditionsSchema>;
export type ExternalTermsAndConditions = typeof externalTermsAndConditions.$inferSelect;

// Broker Terms - Términos y condiciones para el programa de brokers
export const brokerTerms = pgTable("broker_terms", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  version: varchar("version", { length: 50 }).notNull().unique(), // e.g., "1.0", "1.1", "2.0"
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(), // Markdown o HTML del contenido
  isActive: boolean("is_active").notNull().default(false), // Solo una versión activa a la vez
  publishedAt: timestamp("published_at"),
  publishedBy: varchar("published_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_broker_terms_active").on(table.isActive),
  index("idx_broker_terms_published").on(table.publishedAt),
]);

export const insertBrokerTermsSchema = createInsertSchema(brokerTerms).omit({
  id: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBrokerTerms = z.infer<typeof insertBrokerTermsSchema>;
export type BrokerTerms = typeof brokerTerms.$inferSelect;

// Broker Terms Acceptances - Registro de aceptación de términos por brokers
export const brokerTermsAcceptances = pgTable("broker_terms_acceptances", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: varchar("lead_id").notNull().references(() => externalLeads.id, { onDelete: "cascade" }),
  termsId: varchar("terms_id").notNull().references(() => brokerTerms.id, { onDelete: "cascade" }),
  termsVersion: varchar("terms_version", { length: 50 }).notNull(), // Versión aceptada
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 o IPv6
  userAgent: text("user_agent"), // Browser info
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
}, (table) => [
  index("idx_broker_terms_acc_lead").on(table.leadId),
  index("idx_broker_terms_acc_terms").on(table.termsId),
  unique("unique_lead_terms").on(table.leadId, table.termsId), // Un lead solo acepta una vez cada versión
]);

export const insertBrokerTermsAcceptanceSchema = createInsertSchema(brokerTermsAcceptances).omit({
  id: true,
  acceptedAt: true,
});

export type InsertBrokerTermsAcceptance = z.infer<typeof insertBrokerTermsAcceptanceSchema>;
export type BrokerTermsAcceptance = typeof brokerTermsAcceptances.$inferSelect;

// External Condominiums - Condominios gestionados por agencias externas
export const externalCondominiums = pgTable("external_condominiums", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(), // Nombre del condominio
  address: varchar("address", { length: 500 }), // Dirección del condominio
  zone: varchar("zone", { length: 100 }), // Zona/colonia donde se ubica el condominio
  description: text("description"), // Descripción
  totalUnits: integer("total_units"), // Total de unidades en el condominio
  propertyCategory: varchar("property_category", { length: 50 }).default("condominium"), // 'condominium' o 'house' (casa privada)
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_condominiums_agency").on(table.agencyId),
  index("idx_external_condominiums_active").on(table.isActive),
  index("idx_external_condominiums_zone").on(table.zone),
  index("idx_external_condominiums_category").on(table.propertyCategory),
]);

export const insertExternalCondominiumSchema = createInsertSchema(externalCondominiums).omit({
  id: true,
  agencyId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const updateExternalCondominiumSchema = insertExternalCondominiumSchema.partial();

export type InsertExternalCondominium = z.infer<typeof insertExternalCondominiumSchema>;
export type UpdateExternalCondominium = z.infer<typeof updateExternalCondominiumSchema>;
export type ExternalCondominium = typeof externalCondominiums.$inferSelect;

// External Units - Unidades/apartamentos dentro de condominios
export const externalUnits = pgTable("external_units", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  condominiumId: varchar("condominium_id").references(() => externalCondominiums.id, { onDelete: "cascade" }), // Null si es propiedad independiente
  slug: varchar("slug", { length: 150 }), // URL-friendly slug (e.g., departamento-d1-105)
  unitNumber: varchar("unit_number", { length: 50 }).notNull(), // Número de unidad/apartamento
  zone: varchar("zone", { length: 100 }), // Zona/colonia donde se ubica la unidad
  city: varchar("city", { length: 100 }), // Ciudad
  propertyType: varchar("property_type", { length: 50 }), // Tipo de propiedad
  typology: unitTypologyEnum("typology"), // Tipología de la unidad (deprecado)
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  area: decimal("area", { precision: 10, scale: 2 }), // m²
  floor: unitFloorTypeEnum("floor"), // Piso
  photosDriveLink: text("photos_drive_link"), // Link de fotos (Airbnb o Google Drive)
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  
  // === NUEVOS CAMPOS DE MARKETING Y LISTADO ===
  // Información de marketing
  title: varchar("title", { length: 255 }), // Título del listado
  description: text("description"), // Descripción completa
  
  // Precios
  price: decimal("price", { precision: 12, scale: 2 }), // Precio de renta mensual (12 meses)
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }), // Precio de venta (para cuando aplique)
  currency: varchar("currency", { length: 3 }).default("MXN"), // Moneda de renta
  saleCurrency: varchar("sale_currency", { length: 3 }).default("MXN"), // Moneda de venta
  listingType: varchar("listing_type", { length: 20 }).default("rent"), // rent, sale, both
  
  // Estado de disponibilidad y términos
  minimumTerm: varchar("minimum_term", { length: 50 }).default("6 meses"), // Plazo mínimo: 6 meses
  maximumTerm: varchar("maximum_term", { length: 50 }).default("5 años"), // Plazo máximo: 5 años
  allowsSublease: boolean("allows_sublease").default(false), // Acepta subarriendo
  
  // Sistema de comisiones y referidos (exclusivo para TRH)
  commissionType: varchar("commission_type", { length: 30 }).default("completa"), // completa (100%) o referido (80% agencia, 20% referidor)
  referrerName: varchar("referrer_name", { length: 255 }), // Nombre de quien refirió la propiedad
  referrerPhone: varchar("referrer_phone", { length: 50 }), // Teléfono del referido
  referrerEmail: varchar("referrer_email", { length: 255 }), // Email del referido
  
  // Datos de sincronización con sheet
  sheetRowId: varchar("sheet_row_id", { length: 20 }), // ID de la fila en Google Sheets para sincronización
  syncedFromSheet: boolean("synced_from_sheet").default(false), // Si fue importado del sheet
  lastSheetSync: timestamp("last_sheet_sync"), // Última sincronización
  
  // Links externos (Easybroker, Tokko, etc)
  externalLinks: jsonb("external_links"), // {easybroker: true, tokko: true, fichaUrl: "...", driveUrl: "..."}
  
  // Medios
  primaryImages: text("primary_images").array().default(sql`ARRAY[]::text[]`), // 5 fotos principales max
  secondaryImages: text("secondary_images").array().default(sql`ARRAY[]::text[]`), // 20 fotos secundarias max
  videos: text("videos").array().default(sql`ARRAY[]::text[]`), // URLs de videos
  virtualTourUrl: text("virtual_tour_url"), // Link de tour 360
  
  // Ubicación
  address: text("address"), // Dirección completa
  googleMapsUrl: text("google_maps_url"), // Link de Google Maps
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // Coordenada latitud
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // Coordenada longitud
  locationConfidence: varchar("location_confidence", { length: 20 }).default("manual"), // manual, parsed, geocoded
  
  // Características
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`), // Amenidades
  petFriendly: boolean("pet_friendly").default(false), // Acepta mascotas
  includedServices: jsonb("included_services"), // Servicios incluidos {water, electricity, internet, gas}
  
  // Acceso
  accessInfo: jsonb("access_info"), // {lockboxCode, contactPerson, contactPhone}
  
  // Publicación en sitio principal
  publishToMain: boolean("publish_to_main").default(false), // Solicitar publicación
  publishStatus: varchar("publish_status", { length: 20 }).default("draft"), // draft, pending, approved, rejected
  publishedAt: timestamp("published_at"), // Fecha de publicación
  
  // Verificación interna del listing (control de calidad)
  verificationStatus: varchar("verification_status", { length: 20 }).default("unverified"), // unverified, pending_review, verified
  verifiedAt: timestamp("verified_at"), // Fecha de verificación
  verifiedBy: varchar("verified_by").references(() => users.id), // Quién verificó
  verificationNotes: text("verification_notes"), // Notas de verificación
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_units_agency").on(table.agencyId),
  index("idx_external_units_condominium").on(table.condominiumId),
  index("idx_external_units_active").on(table.isActive),
  index("idx_external_units_zone").on(table.zone),
  index("idx_external_units_publish_status").on(table.publishStatus),
  unique("unique_unit_number_per_condominium").on(table.condominiumId, table.unitNumber),
]);

export const insertExternalUnitSchema = createInsertSchema(externalUnits).omit({
  id: true,
  agencyId: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
  publishStatus: true,
  publishedAt: true,
}).extend({
  typology: z.enum(["estudio", "estudio_plus", "1_recamara", "2_recamaras", "3_recamaras", "loft_mini", "loft_normal", "loft_plus"]).optional(),
  floor: z.enum(["planta_baja", "primer_piso", "segundo_piso", "tercer_piso", "penthouse"]).optional(),
  bathrooms: z.union([z.string(), z.number(), z.null()]).transform(val => (val === undefined || val === null || val === '') ? undefined : String(val)).optional().nullable(),
  area: z.union([z.string(), z.number(), z.null()]).transform(val => (val === undefined || val === null || val === '') ? undefined : String(val)).optional().nullable(),
  price: z.union([z.string(), z.number(), z.null()]).transform(val => (val === undefined || val === null || val === '') ? undefined : String(val)).optional().nullable(),
  salePrice: z.union([z.string(), z.number(), z.null()]).transform(val => (val === undefined || val === null || val === '') ? undefined : String(val)).optional().nullable(),
  listingType: z.enum(["rent", "sale", "both"]).optional(),
  latitude: z.union([z.string(), z.number(), z.null()]).transform(val => (val === undefined || val === null || val === '') ? undefined : String(val)).optional().nullable(),
  longitude: z.union([z.string(), z.number(), z.null()]).transform(val => (val === undefined || val === null || val === '') ? undefined : String(val)).optional().nullable(),
  locationConfidence: z.enum(["manual", "parsed", "geocoded"]).optional(),
  primaryImages: z.array(z.string()).optional(),
  secondaryImages: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  includedServices: z.object({
    water: z.boolean().optional(),
    electricity: z.boolean().optional(),
    internet: z.boolean().optional(),
    gas: z.boolean().optional(),
    hoaMaintenance: z.boolean().optional(), // Mantenimiento condominal / HOA fees
  }).optional().nullable(),
  accessInfo: z.object({
    lockboxCode: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),
  }).optional().nullable(),
});

export const updateExternalUnitSchema = insertExternalUnitSchema.partial().extend({
  isActive: z.boolean().optional(),
  verificationStatus: z.enum(["unverified", "pending_review", "verified"]).optional(),
  verificationNotes: z.string().optional().nullable(),
});

export type InsertExternalUnit = z.infer<typeof insertExternalUnitSchema>;
export type UpdateExternalUnit = z.infer<typeof updateExternalUnitSchema>;
export type ExternalUnit = typeof externalUnits.$inferSelect;

// External Unit Media - Photos and Videos with AI classification
export const externalUnitMediaTypeEnum = pgEnum("external_unit_media_type", [
  "photo",
  "video",
]);

export const externalUnitMediaStatusEnum = pgEnum("external_unit_media_status", [
  "pending",      // Not yet analyzed
  "processing",   // Currently being analyzed
  "processed",    // Analysis complete
  "error",        // Analysis failed
]);

export const externalUnitMediaLabelEnum = pgEnum("external_unit_media_label", [
  "kitchen",         // Cocina
  "bedroom",         // Recámara
  "bathroom",        // Baño
  "dining_room",     // Comedor
  "living_room",     // Sala
  "balcony",         // Balcón/terraza
  "rooftop",         // Rooftop
  "pool",            // Alberca
  "gym",             // Gimnasio
  "entrance",        // Entrada/lobby
  "facade",          // Fachada exterior
  "other",           // Otro
]);

export const externalUnitMedia = pgTable("external_unit_media", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }),
  
  // Media type and source
  mediaType: externalUnitMediaTypeEnum("media_type").notNull(),
  driveFileId: varchar("drive_file_id", { length: 100 }), // Google Drive file ID
  driveWebViewUrl: text("drive_web_view_url"), // URL to view in Drive/embed
  thumbnailUrl: text("thumbnail_url"), // Thumbnail in Object Storage (for photos)
  
  // Original file info
  fileName: varchar("file_name", { length: 500 }),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: integer("file_size"), // Size in bytes
  
  // AI Classification
  status: externalUnitMediaStatusEnum("status").default("pending").notNull(),
  aiLabels: jsonb("ai_labels").$type<string[]>().default([]), // Multiple AI-detected labels
  aiPrimaryLabel: externalUnitMediaLabelEnum("ai_primary_label"), // Main detected label
  aiConfidence: real("ai_confidence"), // Confidence score 0-1
  aiDescription: text("ai_description"), // AI-generated description
  
  // Manual override and section assignment
  manualLabel: externalUnitMediaLabelEnum("manual_label"), // Human-assigned label
  sectionIndex: integer("section_index").default(1), // Index within section (e.g., Bedroom 1 vs Bedroom 2)
  displayOrder: integer("display_order").default(0), // Order within category
  isHidden: boolean("is_hidden").default(false), // Hide from public view
  isCover: boolean("is_cover").default(false), // Cover image for the unit
  
  // Metadata
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_unit_media_unit").on(table.unitId),
  index("idx_external_unit_media_type").on(table.mediaType),
  index("idx_external_unit_media_status").on(table.status),
  index("idx_external_unit_media_label").on(table.aiPrimaryLabel),
]);

export const insertExternalUnitMediaSchema = createInsertSchema(externalUnitMedia).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalUnitMedia = z.infer<typeof insertExternalUnitMediaSchema>;
export type ExternalUnitMedia = typeof externalUnitMedia.$inferSelect;

// External Unit Legal Documents - Documentos legales de propiedades
export const externalUnitDocumentTypeEnum = pgEnum("external_unit_document_type", [
  "escritura",           // Property deed
  "titulo_propiedad",    // Property title
  "predial",             // Property tax
  "agua",                // Water bill/certificate
  "luz",                 // Electricity bill
  "contrato_arrendamiento", // Lease agreement
  "permiso_uso_suelo",   // Land use permit
  "licencia_construccion", // Construction license
  "avaluo",              // Property appraisal
  "certificado_libertad_gravamen", // Lien-free certificate
  "reglamento_condominio", // Condo bylaws
  "poliza_seguro",       // Insurance policy
  "identificacion_propietario", // Owner ID
  "comprobante_domicilio", // Proof of address
  "otro",                // Other
]);

export const externalUnitDocuments = pgTable("external_unit_documents", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  documentType: externalUnitDocumentTypeEnum("document_type").notNull(),
  documentName: varchar("document_name", { length: 255 }).notNull(), // User-friendly name
  fileName: varchar("file_name", { length: 500 }).notNull(), // Original file name
  fileUrl: text("file_url").notNull(), // Storage URL
  fileSize: integer("file_size"), // Size in bytes
  mimeType: varchar("mime_type", { length: 100 }),
  expirationDate: timestamp("expiration_date"), // For documents that expire
  notes: text("notes"), // Additional notes
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_unit_docs_unit").on(table.unitId),
  index("idx_external_unit_docs_agency").on(table.agencyId),
  index("idx_external_unit_docs_type").on(table.documentType),
]);

export const insertExternalUnitDocumentSchema = createInsertSchema(externalUnitDocuments).omit({
  id: true,
  agencyId: true,
  uploadedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExternalUnitDocumentSchema = insertExternalUnitDocumentSchema.partial();

export type InsertExternalUnitDocument = z.infer<typeof insertExternalUnitDocumentSchema>;
export type UpdateExternalUnitDocument = z.infer<typeof updateExternalUnitDocumentSchema>;
export type ExternalUnitDocument = typeof externalUnitDocuments.$inferSelect;

// Extended type for units with condominium data (used when joining with condominium table)
export type ExternalUnitWithCondominium = ExternalUnit & {
  condominium: {
    id: string;
    name: string;
    address: string;
  } | null;
};

// ============================================================================
// EXTERNAL PUBLICATION REQUESTS
// Solicitudes de publicación de unidades externas en el sitio principal
// ============================================================================

export const externalPublicationRequestStatusEnum = pgEnum("external_publication_request_status", [
  "pending",    // Pendiente de revisión
  "approved",   // Aprobada para publicación
  "rejected",   // Rechazada
  "withdrawn",  // Retirada por la agencia
]);

export const externalPublicationRequests = pgTable("external_publication_requests", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  requestedBy: varchar("requested_by").references(() => users.id), // Usuario que solicitó
  reviewedBy: varchar("reviewed_by").references(() => users.id), // Admin que revisó
  status: externalPublicationRequestStatusEnum("status").notNull().default("pending"),
  adminFeedback: text("admin_feedback"), // Comentarios del admin
  linkedPropertyId: varchar("linked_property_id").references(() => properties.id), // Property creada al aprobar
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ext_pub_requests_unit").on(table.unitId),
  index("idx_ext_pub_requests_agency").on(table.agencyId),
  index("idx_ext_pub_requests_status").on(table.status),
  unique("unique_pending_request_per_unit").on(table.unitId, table.status),
]);

export const insertExternalPublicationRequestSchema = createInsertSchema(externalPublicationRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  requestedAt: true,
});

export type InsertExternalPublicationRequest = z.infer<typeof insertExternalPublicationRequestSchema>;
export type ExternalPublicationRequest = typeof externalPublicationRequests.$inferSelect;

// Extended type with unit and agency data for admin review
export type ExternalPublicationRequestWithDetails = ExternalPublicationRequest & {
  unit: ExternalUnit & {
    condominium: { id: string; name: string; address: string } | null;
  };
  agency: { id: string; name: string };
  requestedByUser?: { id: string; email: string; firstName?: string; lastName?: string } | null;
};

// Helper to convert strings to numbers, handling empty strings as undefined
const optionalNumber = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  },
  z.number().int().optional()
);

// Helper to convert to string or undefined
const optionalString = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : String(val)),
  z.string().optional()
);

// Unit data that frontend sends (without server-populated fields)
export const externalUnitFormSchema = z.object({
  unitNumber: z.string().min(1),
  propertyType: z.string().optional(),
  typology: z.enum(["estudio", "estudio_plus", "1_recamara", "2_recamaras", "3_recamaras", "loft_mini", "loft_normal", "loft_plus"]).optional(),
  bedrooms: optionalNumber,
  bathrooms: optionalString,
  area: optionalString,
  floor: z.enum(["planta_baja", "primer_piso", "segundo_piso", "tercer_piso", "penthouse"]).optional(),
  photosDriveLink: z.string().optional(),
  parkingSpots: optionalNumber,
  squareMeters: optionalNumber,
});

// Create Condominium with Units Schema - For atomic creation
export const createCondominiumWithUnitsSchema = z.object({
  condominium: insertExternalCondominiumSchema,
  units: z.array(externalUnitFormSchema).default([]),
});

export const addUnitsToCondominiumSchema = z.object({
  units: z.array(externalUnitFormSchema).min(1, "At least one unit is required"),
});

export type ExternalUnitForm = z.infer<typeof externalUnitFormSchema>;
export type CreateCondominiumWithUnits = z.infer<typeof createCondominiumWithUnitsSchema>;
export type AddUnitsToCondominium = z.infer<typeof addUnitsToCondominiumSchema>;

// External Unit Owners - Propietarios de unidades
export const externalUnitOwners = pgTable("external_unit_owners", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }),
  ownerName: varchar("owner_name", { length: 255 }).notNull(), // Nombre del propietario
  ownerEmail: varchar("owner_email", { length: 255 }),
  ownerPhone: varchar("owner_phone", { length: 50 }),
  ownershipPercentage: decimal("ownership_percentage", { precision: 5, scale: 2 }).default("100.00"), // Porcentaje de propiedad
  isActive: boolean("is_active").notNull().default(true), // Si es el propietario actual
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_unit_owners_unit").on(table.unitId),
  index("idx_external_unit_owners_active").on(table.isActive),
]);

export const insertExternalUnitOwnerSchema = createInsertSchema(externalUnitOwners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExternalUnitOwnerSchema = insertExternalUnitOwnerSchema.partial();

export type InsertExternalUnitOwner = z.infer<typeof insertExternalUnitOwnerSchema>;
export type UpdateExternalUnitOwner = z.infer<typeof updateExternalUnitOwnerSchema>;
export type ExternalUnitOwner = typeof externalUnitOwners.$inferSelect;

// External Financial Transactions - Sistema unificado de contabilidad
export const externalFinancialTransactions = pgTable("external_financial_transactions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Transaction details
  direction: financialTransactionDirectionEnum("direction").notNull(), // inflow or outflow
  category: financialTransactionCategoryEnum("category").notNull(), // rent_income, hoa_fee, etc
  status: financialTransactionStatusEnum("status").notNull().default("pending"),
  
  // Monetary fields
  grossAmount: decimal("gross_amount", { precision: 12, scale: 2 }).notNull(), // Monto bruto
  fees: decimal("fees", { precision: 12, scale: 2 }).default("0.00"), // Comisiones/cargos
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }).notNull(), // Monto neto
  currency: varchar("currency", { length: 10 }).notNull().default("MXN"),
  
  // Dates
  dueDate: timestamp("due_date").notNull(), // Fecha de vencimiento
  performedDate: timestamp("performed_date"), // Fecha en que se realizó/pagó
  reconciledDate: timestamp("reconciled_date"), // Fecha de conciliación
  
  // Parties involved
  payerRole: financialTransactionRoleEnum("payer_role").notNull(), // Quien paga: tenant, owner, agency
  payeeRole: financialTransactionRoleEnum("payee_role").notNull(), // Quien recibe: tenant, owner, agency
  ownerId: varchar("owner_id").references(() => externalUnitOwners.id, { onDelete: "set null" }), // Si involucra propietario
  tenantName: varchar("tenant_name", { length: 255 }), // Nombre del inquilino si aplica
  
  // Relations to other entities
  contractId: varchar("contract_id").references(() => externalRentalContracts.id, { onDelete: "set null" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  paymentId: varchar("payment_id").references(() => externalPayments.id, { onDelete: "set null" }), // Link to external payment if applicable
  maintenanceTicketId: varchar("maintenance_ticket_id").references(() => externalMaintenanceTickets.id, { onDelete: "set null" }),
  scheduleId: varchar("schedule_id").references(() => externalPaymentSchedules.id, { onDelete: "set null" }),
  
  // Payment details
  paymentMethod: varchar("payment_method", { length: 100 }), // Transferencia, efectivo, cheque, etc
  paymentReference: varchar("payment_reference", { length: 255 }), // Número de referencia/folio
  paymentProofUrl: text("payment_proof_url"), // URL del comprobante
  
  // Additional info
  description: text("description").notNull(), // Descripción de la transacción
  notes: text("notes"), // Notas adicionales
  metadata: jsonb("metadata"), // JSON para datos adicionales flexibles
  
  // Audit
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_transactions_agency").on(table.agencyId),
  index("idx_external_transactions_direction").on(table.direction),
  index("idx_external_transactions_category").on(table.category),
  index("idx_external_transactions_status").on(table.status),
  index("idx_external_transactions_due_date").on(table.dueDate),
  index("idx_external_transactions_owner").on(table.ownerId),
  index("idx_external_transactions_contract").on(table.contractId),
  index("idx_external_transactions_unit").on(table.unitId),
  index("idx_external_transactions_payer").on(table.payerRole),
  index("idx_external_transactions_payee").on(table.payeeRole),
]);

export const insertExternalFinancialTransactionSchema = createInsertSchema(externalFinancialTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  agencyId: true,  // Server adds this
  createdBy: true, // Server adds this
}).extend({
  dueDate: z.coerce.date(),
  performedDate: z.coerce.date().optional().nullable(),
  reconciledDate: z.coerce.date().optional().nullable(),
  agencyId: z.string().optional(),  // Optional for client, server will add
  createdBy: z.string().optional(), // Optional for client, server will add
});

export const updateExternalFinancialTransactionSchema = insertExternalFinancialTransactionSchema.partial().omit({
  agencyId: true,
  createdBy: true,
});

export type InsertExternalFinancialTransaction = z.infer<typeof insertExternalFinancialTransactionSchema>;
export type UpdateExternalFinancialTransaction = z.infer<typeof updateExternalFinancialTransactionSchema>;
export type ExternalFinancialTransaction = typeof externalFinancialTransactions.$inferSelect;

// External Unit Access Controls - Controles de acceso/claves de unidades
export const externalUnitAccessControls = pgTable("external_unit_access_controls", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }),
  accessType: varchar("access_type", { length: 100 }).notNull(), // door_code, wifi, gate, etc
  accessCode: text("access_code"), // Código/clave de acceso (puede ser encriptado)
  description: text("description"), // Descripción del acceso
  isActive: boolean("is_active").notNull().default(true),
  canShareWithMaintenance: boolean("can_share_with_maintenance").notNull().default(false), // Si se puede compartir con personal de mantenimiento
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_access_controls_unit").on(table.unitId),
  index("idx_external_access_controls_active").on(table.isActive),
]);

export const insertExternalUnitAccessControlSchema = createInsertSchema(externalUnitAccessControls).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExternalUnitAccessControlSchema = insertExternalUnitAccessControlSchema.partial();

export type InsertExternalUnitAccessControl = z.infer<typeof insertExternalUnitAccessControlSchema>;
export type UpdateExternalUnitAccessControl = z.infer<typeof updateExternalUnitAccessControlSchema>;
export type ExternalUnitAccessControl = typeof externalUnitAccessControls.$inferSelect;

// Relations
export const tenantRentalFormTokensRelations = relations(tenantRentalFormTokens, ({ one }) => ({
  property: one(properties, {
    fields: [tenantRentalFormTokens.propertyId],
    references: [properties.id],
  }),
  lead: one(leads, {
    fields: [tenantRentalFormTokens.leadId],
    references: [leads.id],
  }),
  creator: one(users, {
    fields: [tenantRentalFormTokens.createdBy],
    references: [users.id],
  }),
}));

export const tenantRentalFormsRelations = relations(tenantRentalForms, ({ one }) => ({
  token: one(tenantRentalFormTokens, {
    fields: [tenantRentalForms.tokenId],
    references: [tenantRentalFormTokens.id],
  }),
  property: one(properties, {
    fields: [tenantRentalForms.propertyId],
    references: [properties.id],
  }),
  lead: one(leads, {
    fields: [tenantRentalForms.leadId],
    references: [leads.id],
  }),
  reviewer: one(users, {
    fields: [tenantRentalForms.reviewedBy],
    references: [users.id],
  }),
}));

export const ownerDocumentTokensRelations = relations(ownerDocumentTokens, ({ one }) => ({
  tenantRentalForm: one(tenantRentalForms, {
    fields: [ownerDocumentTokens.tenantRentalFormId],
    references: [tenantRentalForms.id],
  }),
  property: one(properties, {
    fields: [ownerDocumentTokens.propertyId],
    references: [properties.id],
  }),
  owner: one(users, {
    fields: [ownerDocumentTokens.ownerId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [ownerDocumentTokens.createdBy],
    references: [users.id],
  }),
}));

export const ownerDocumentSubmissionsRelations = relations(ownerDocumentSubmissions, ({ one }) => ({
  token: one(ownerDocumentTokens, {
    fields: [ownerDocumentSubmissions.tokenId],
    references: [ownerDocumentTokens.id],
  }),
  tenantRentalForm: one(tenantRentalForms, {
    fields: [ownerDocumentSubmissions.tenantRentalFormId],
    references: [tenantRentalForms.id],
  }),
  property: one(properties, {
    fields: [ownerDocumentSubmissions.propertyId],
    references: [properties.id],
  }),
  owner: one(users, {
    fields: [ownerDocumentSubmissions.ownerId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [ownerDocumentSubmissions.reviewedBy],
    references: [users.id],
  }),
}));

// External Worker Assignments - Asignación de trabajadores a condominios/unidades
export const externalWorkerAssignments = pgTable("external_worker_assignments", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Trabajador
  condominiumId: varchar("condominium_id").references(() => externalCondominiums.id, { onDelete: "cascade" }), // Opcional: asignado a condominio específico
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "cascade" }), // Opcional: asignado a unidad específica
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_worker_assignments_agency").on(table.agencyId),
  index("idx_external_worker_assignments_user").on(table.userId),
  index("idx_external_worker_assignments_condo").on(table.condominiumId),
  index("idx_external_worker_assignments_unit").on(table.unitId),
]);

export const insertExternalWorkerAssignmentSchema = createInsertSchema(externalWorkerAssignments).omit({
  id: true,
  agencyId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalWorkerAssignment = z.infer<typeof insertExternalWorkerAssignmentSchema>;
export type ExternalWorkerAssignment = typeof externalWorkerAssignments.$inferSelect;

// External Owner Charges - Cobros a propietarios
export const externalOwnerCharges = pgTable("external_owner_charges", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").notNull().references(() => externalUnitOwners.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }),
  description: text("description").notNull(), // Descripción del cobro
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("MXN"),
  dueDate: timestamp("due_date").notNull(), // Fecha límite de pago
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, paid, overdue
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_charges_agency").on(table.agencyId),
  index("idx_external_charges_owner").on(table.ownerId),
  index("idx_external_charges_unit").on(table.unitId),
  index("idx_external_charges_status").on(table.status),
  index("idx_external_charges_due_date").on(table.dueDate),
]);

export const insertExternalOwnerChargeSchema = createInsertSchema(externalOwnerCharges).omit({
  id: true,
  agencyId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalOwnerCharge = z.infer<typeof insertExternalOwnerChargeSchema>;
export type ExternalOwnerCharge = typeof externalOwnerCharges.$inferSelect;

// External Owner Notifications - Notificaciones a propietarios
export const externalOwnerNotifications = pgTable("external_owner_notifications", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  condominiumId: varchar("condominium_id").references(() => externalCondominiums.id, { onDelete: "cascade" }), // Notificación a nivel condominio
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "cascade" }), // Notificación a unidad específica
  ownerId: varchar("owner_id").references(() => externalUnitOwners.id, { onDelete: "cascade" }), // Propietario específico
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // work, failure, general, emergency
  priority: varchar("priority", { length: 20 }).notNull().default("normal"), // low, normal, high, urgent
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_external_notifications_agency").on(table.agencyId),
  index("idx_external_notifications_condo").on(table.condominiumId),
  index("idx_external_notifications_unit").on(table.unitId),
  index("idx_external_notifications_owner").on(table.ownerId),
  index("idx_external_notifications_type").on(table.type),
  index("idx_external_notifications_read").on(table.isRead),
]);

export const insertExternalOwnerNotificationSchema = createInsertSchema(externalOwnerNotifications).omit({
  id: true,
  agencyId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalOwnerNotification = z.infer<typeof insertExternalOwnerNotificationSchema>;
export type ExternalOwnerNotification = typeof externalOwnerNotifications.$inferSelect;

// External Relations - Defined at the end after all tables are declared
export const externalCondominiumsRelations = relations(externalCondominiums, ({ one, many }) => ({
  agency: one(externalAgencies, {
    fields: [externalCondominiums.agencyId],
    references: [externalAgencies.id],
  }),
  units: many(externalUnits),
}));

export const externalUnitsRelations = relations(externalUnits, ({ one, many }) => ({
  agency: one(externalAgencies, {
    fields: [externalUnits.agencyId],
    references: [externalAgencies.id],
  }),
  condominium: one(externalCondominiums, {
    fields: [externalUnits.condominiumId],
    references: [externalCondominiums.id],
  }),
  owners: many(externalUnitOwners),
  rentalContracts: many(externalRentalContracts),
  appointments: many(externalAppointments),
  appointmentUnits: many(externalAppointmentUnits),
}));

export const externalUnitOwnersRelations = relations(externalUnitOwners, ({ one }) => ({
  unit: one(externalUnits, {
    fields: [externalUnitOwners.unitId],
    references: [externalUnits.id],
  }),
}));

export const externalOwnerChargesRelations = relations(externalOwnerCharges, ({ one }) => ({
  agency: one(externalAgencies, {
    fields: [externalOwnerCharges.agencyId],
    references: [externalAgencies.id],
  }),
  owner: one(externalUnitOwners, {
    fields: [externalOwnerCharges.ownerId],
    references: [externalUnitOwners.id],
  }),
  unit: one(externalUnits, {
    fields: [externalOwnerCharges.unitId],
    references: [externalUnits.id],
  }),
}));

export const externalOwnerNotificationsRelations = relations(externalOwnerNotifications, ({ one }) => ({
  agency: one(externalAgencies, {
    fields: [externalOwnerNotifications.agencyId],
    references: [externalAgencies.id],
  }),
  owner: one(externalUnitOwners, {
    fields: [externalOwnerNotifications.ownerId],
    references: [externalUnitOwners.id],
  }),
  unit: one(externalUnits, {
    fields: [externalOwnerNotifications.unitId],
    references: [externalUnits.id],
  }),
  condominium: one(externalCondominiums, {
    fields: [externalOwnerNotifications.condominiumId],
    references: [externalCondominiums.id],
  }),
}));

export const externalWorkerAssignmentsRelations = relations(externalWorkerAssignments, ({ one }) => ({
  agency: one(externalAgencies, {
    fields: [externalWorkerAssignments.agencyId],
    references: [externalAgencies.id],
  }),
  worker: one(users, {
    fields: [externalWorkerAssignments.userId],
    references: [users.id],
  }),
  condominium: one(externalCondominiums, {
    fields: [externalWorkerAssignments.condominiumId],
    references: [externalCondominiums.id],
  }),
  unit: one(externalUnits, {
    fields: [externalWorkerAssignments.unitId],
    references: [externalUnits.id],
  }),
}));

export const externalMaintenanceTicketsRelations = relations(externalMaintenanceTickets, ({ one, many }) => ({
  agency: one(externalAgencies, {
    fields: [externalMaintenanceTickets.agencyId],
    references: [externalAgencies.id],
  }),
  unit: one(externalUnits, {
    fields: [externalMaintenanceTickets.unitId],
    references: [externalUnits.id],
  }),
  updates: many(externalMaintenanceUpdates),
  photos: many(externalMaintenancePhotos),
}));

export const externalMaintenanceUpdatesRelations = relations(externalMaintenanceUpdates, ({ one, many }) => ({
  ticket: one(externalMaintenanceTickets, {
    fields: [externalMaintenanceUpdates.ticketId],
    references: [externalMaintenanceTickets.id],
  }),
  createdByUser: one(users, {
    fields: [externalMaintenanceUpdates.createdBy],
    references: [users.id],
  }),
  photos: many(externalMaintenancePhotos),
}));

export const externalMaintenancePhotosRelations = relations(externalMaintenancePhotos, ({ one }) => ({
  ticket: one(externalMaintenanceTickets, {
    fields: [externalMaintenancePhotos.ticketId],
    references: [externalMaintenanceTickets.id],
  }),
  update: one(externalMaintenanceUpdates, {
    fields: [externalMaintenancePhotos.updateId],
    references: [externalMaintenanceUpdates.id],
  }),
  uploadedByUser: one(users, {
    fields: [externalMaintenancePhotos.uploadedBy],
    references: [users.id],
  }),
}));

export const externalClientsRelations = relations(externalClients, ({ one }) => ({
  agency: one(externalAgencies, {
    fields: [externalClients.agencyId],
    references: [externalAgencies.id],
  }),
  createdByUser: one(users, {
    fields: [externalClients.createdBy],
    references: [users.id],
  }),
}));

export const externalBrokersRelations = relations(externalBrokers, ({ one, many }) => ({
  agency: one(externalAgencies, {
    fields: [externalBrokers.agencyId],
    references: [externalAgencies.id],
  }),
  createdByUser: one(users, {
    fields: [externalBrokers.createdBy],
    references: [users.id],
  }),
  referredBySeller: one(users, {
    fields: [externalBrokers.referredBySellerId],
    references: [users.id],
  }),
  leads: many(externalLeads),
}));

// Agency-configurable zones (colonias)
export const externalAgencyZones = pgTable("external_agency_zones", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_agency_zones_agency").on(table.agencyId),
  unique("unique_zone_name_per_agency").on(table.agencyId, table.name),
]);

export const insertExternalAgencyZoneSchema = createInsertSchema(externalAgencyZones).omit({
  id: true, createdAt: true,
});
export type InsertExternalAgencyZone = z.infer<typeof insertExternalAgencyZoneSchema>;
export type ExternalAgencyZone = typeof externalAgencyZones.$inferSelect;

// Agency-configurable property types/typologies
export const externalAgencyPropertyTypes = pgTable("external_agency_property_types", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_agency_property_types_agency").on(table.agencyId),
  unique("unique_property_type_name_per_agency").on(table.agencyId, table.name),
]);

export const insertExternalAgencyPropertyTypeSchema = createInsertSchema(externalAgencyPropertyTypes).omit({
  id: true, createdAt: true,
});
export type InsertExternalAgencyPropertyType = z.infer<typeof insertExternalAgencyPropertyTypeSchema>;
export type ExternalAgencyPropertyType = typeof externalAgencyPropertyTypes.$inferSelect;

// Agency-configurable unit characteristics (features inside the unit)
export const externalAgencyUnitCharacteristics = pgTable("external_agency_unit_characteristics", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }), // English translation
  category: varchar("category", { length: 50 }), // kitchen, bathroom, bedroom, living, etc.
  icon: varchar("icon", { length: 50 }), // Lucide icon name
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_agency_unit_characteristics_agency").on(table.agencyId),
  unique("unique_unit_char_name_per_agency").on(table.agencyId, table.name),
]);

export const insertExternalAgencyUnitCharacteristicSchema = createInsertSchema(externalAgencyUnitCharacteristics).omit({
  id: true, createdAt: true,
});
export type InsertExternalAgencyUnitCharacteristic = z.infer<typeof insertExternalAgencyUnitCharacteristicSchema>;
export type ExternalAgencyUnitCharacteristic = typeof externalAgencyUnitCharacteristics.$inferSelect;

// Agency-configurable amenities (condominium/building amenities)
export const externalAgencyAmenities = pgTable("external_agency_amenities", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }), // English translation
  category: varchar("category", { length: 50 }), // common_areas, security, services, etc.
  icon: varchar("icon", { length: 50 }), // Lucide icon name
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_agency_amenities_agency").on(table.agencyId),
  unique("unique_amenity_name_per_agency").on(table.agencyId, table.name),
]);

export const insertExternalAgencyAmenitySchema = createInsertSchema(externalAgencyAmenities).omit({
  id: true, createdAt: true,
});
export type InsertExternalAgencyAmenity = z.infer<typeof insertExternalAgencyAmenitySchema>;
export type ExternalAgencyAmenity = typeof externalAgencyAmenities.$inferSelect;

// External Appointments Relations
export const externalAppointmentsRelations = relations(externalAppointments, ({ one, many }) => ({
  agency: one(externalAgencies, {
    fields: [externalAppointments.agencyId],
    references: [externalAgencies.id],
  }),
  unit: one(externalUnits, {
    fields: [externalAppointments.unitId],
    references: [externalUnits.id],
  }),
  salesperson: one(users, {
    fields: [externalAppointments.salespersonId],
    references: [users.id],
    relationName: "salesperson",
  }),
  concierge: one(users, {
    fields: [externalAppointments.conciergeId],
    references: [users.id],
    relationName: "concierge",
  }),
  client: one(externalClients, {
    fields: [externalAppointments.clientId],
    references: [externalClients.id],
  }),
  lead: one(externalLeads, {
    fields: [externalAppointments.leadId],
    references: [externalLeads.id],
  }),
  createdByUser: one(users, {
    fields: [externalAppointments.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  tourUnits: many(externalAppointmentUnits),
}));

export const externalAppointmentUnitsRelations = relations(externalAppointmentUnits, ({ one }) => ({
  appointment: one(externalAppointments, {
    fields: [externalAppointmentUnits.appointmentId],
    references: [externalAppointments.id],
  }),
  unit: one(externalUnits, {
    fields: [externalAppointmentUnits.unitId],
    references: [externalUnits.id],
  }),
}));

// =================================
// CLIENT RATINGS - Track client rating history
// =================================
export const externalClientRatings = pgTable("external_client_ratings", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => externalClients.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").references(() => externalLeads.id, { onDelete: "cascade" }),
  appointmentId: varchar("appointment_id").references(() => externalAppointments.id, { onDelete: "set null" }),
  ratingDelta: integer("rating_delta").notNull(), // +/- points based on outcome
  reason: varchar("reason", { length: 100 }).notNull(), // e.g., "liked", "no_show", etc.
  notes: text("notes"), // Additional context
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_client_ratings_agency").on(table.agencyId),
  index("idx_client_ratings_client").on(table.clientId),
  index("idx_client_ratings_lead").on(table.leadId),
]);

export const insertExternalClientRatingSchema = createInsertSchema(externalClientRatings).omit({
  id: true, createdAt: true,
});
export type InsertExternalClientRating = z.infer<typeof insertExternalClientRatingSchema>;
export type ExternalClientRating = typeof externalClientRatings.$inferSelect;

// =================================
// PROPERTY RATINGS - Reviews and ratings for properties
// =================================
export const externalPropertyRatings = pgTable("external_property_ratings", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => externalProperties.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "cascade" }),
  appointmentId: varchar("appointment_id").references(() => externalAppointments.id, { onDelete: "set null" }),
  clientId: varchar("client_id").references(() => externalClients.id, { onDelete: "set null" }),
  leadId: varchar("lead_id").references(() => externalLeads.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"), // Written feedback
  wouldRecommend: boolean("would_recommend"),
  visitDate: timestamp("visit_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_property_ratings_agency").on(table.agencyId),
  index("idx_property_ratings_property").on(table.propertyId),
  index("idx_property_ratings_unit").on(table.unitId),
]);

export const insertExternalPropertyRatingSchema = createInsertSchema(externalPropertyRatings).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertExternalPropertyRating = z.infer<typeof insertExternalPropertyRatingSchema>;
export type ExternalPropertyRating = typeof externalPropertyRatings.$inferSelect;

// =================================
// PORTAL ACCESS SYSTEM - Tenant & Owner Portals
// =================================

export const portalRoleEnum = pgEnum("portal_role", ["tenant", "owner"]);
export const portalTokenStatusEnum = pgEnum("portal_token_status", ["active", "expired", "revoked", "used"]);
export const paymentReceiptStatusEnum = pgEnum("payment_receipt_status", ["pending", "approved", "rejected"]);
export const terminationRequestStatusEnum = pgEnum("termination_request_status", ["pending", "approved", "rejected", "cancelled"]);

// Portal Access Tokens - Credentials for tenant/owner portal access
export const externalPortalAccessTokens = pgTable("external_portal_access_tokens", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  role: portalRoleEnum("role").notNull(),
  
  accessCode: varchar("access_code", { length: 8 }).notNull(), // Simple 8-char code for easy sharing
  hashedSecret: text("hashed_secret").notNull(), // bcrypt hash of the full access token
  
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  recipientName: varchar("recipient_name", { length: 255 }),
  
  invitedUserId: varchar("invited_user_id").references(() => users.id), // If linked to existing user
  
  status: portalTokenStatusEnum("status").notNull().default("active"),
  expiresAt: timestamp("expires_at"), // Null = expires when contract ends
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").notNull().default(0),
  
  invitationSentAt: timestamp("invitation_sent_at"),
  invitationMethod: varchar("invitation_method", { length: 20 }), // email, sms, whatsapp
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_portal_tokens_agency").on(table.agencyId),
  index("idx_portal_tokens_contract").on(table.contractId),
  index("idx_portal_tokens_access_code").on(table.accessCode),
  index("idx_portal_tokens_role").on(table.role),
  index("idx_portal_tokens_status").on(table.status),
]);

export const insertExternalPortalAccessTokenSchema = createInsertSchema(externalPortalAccessTokens).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertExternalPortalAccessToken = z.infer<typeof insertExternalPortalAccessTokenSchema>;
export type ExternalPortalAccessToken = typeof externalPortalAccessTokens.$inferSelect;

// Portal Sessions - Track active portal sessions
export const externalPortalSessions = pgTable("external_portal_sessions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tokenId: varchar("token_id").notNull().references(() => externalPortalAccessTokens.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  role: portalRoleEnum("role").notNull(),
  
  sessionToken: text("session_token").notNull().unique(), // JWT or session ID
  
  ipHash: varchar("ip_hash", { length: 64 }), // Hashed IP for security
  userAgent: text("user_agent"),
  deviceInfo: jsonb("device_info"), // {browser, os, device}
  
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
}, (table) => [
  index("idx_portal_sessions_token").on(table.tokenId),
  index("idx_portal_sessions_contract").on(table.contractId),
  index("idx_portal_sessions_session_token").on(table.sessionToken),
]);

export const insertExternalPortalSessionSchema = createInsertSchema(externalPortalSessions).omit({
  id: true,
});
export type InsertExternalPortalSession = z.infer<typeof insertExternalPortalSessionSchema>;
export type ExternalPortalSession = typeof externalPortalSessions.$inferSelect;

// Payment Receipts - Tenant uploads, owner verifies
export const externalPaymentReceipts = pgTable("external_payment_receipts", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  paymentScheduleId: varchar("payment_schedule_id").references(() => externalPaymentSchedules.id, { onDelete: "set null" }),
  
  uploadedByRole: portalRoleEnum("uploaded_by_role").notNull().default("tenant"),
  uploadedByTokenId: varchar("uploaded_by_token_id").references(() => externalPortalAccessTokens.id),
  uploadedByUserId: varchar("uploaded_by_user_id").references(() => users.id),
  
  receiptUrl: text("receipt_url").notNull(),
  receiptFileName: varchar("receipt_file_name", { length: 255 }),
  
  paymentType: varchar("payment_type", { length: 50 }).notNull(), // rent, deposit, service, special_charge
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("MXN"),
  paymentDate: timestamp("payment_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }), // transfer, cash, card, etc.
  referenceNumber: varchar("reference_number", { length: 100 }),
  notes: text("notes"),
  
  status: paymentReceiptStatusEnum("status").notNull().default("pending"),
  
  reviewedByRole: portalRoleEnum("reviewed_by_role"),
  reviewedByTokenId: varchar("reviewed_by_token_id").references(() => externalPortalAccessTokens.id),
  reviewedByUserId: varchar("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_payment_receipts_agency").on(table.agencyId),
  index("idx_payment_receipts_contract").on(table.contractId),
  index("idx_payment_receipts_schedule").on(table.paymentScheduleId),
  index("idx_payment_receipts_status").on(table.status),
]);

export const insertExternalPaymentReceiptSchema = createInsertSchema(externalPaymentReceipts).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertExternalPaymentReceipt = z.infer<typeof insertExternalPaymentReceiptSchema>;
export type ExternalPaymentReceipt = typeof externalPaymentReceipts.$inferSelect;

// Service Accounts - Utility bills and payment info managed by owner
export const externalServiceAccounts = pgTable("external_service_accounts", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  
  serviceType: serviceTypeEnum("service_type").notNull(),
  serviceName: varchar("service_name", { length: 100 }), // Custom name like "CFE", "CAPA", etc.
  accountNumber: varchar("account_number", { length: 100 }),
  providerName: varchar("provider_name", { length: 100 }),
  
  paymentInstructions: text("payment_instructions"),
  paymentUrl: text("payment_url"),
  paymentLocations: text("payment_locations"),
  
  dueDay: integer("due_day"), // Day of month payment is due (1-31)
  estimatedAmount: decimal("estimated_amount", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("MXN"),
  
  ownerVisible: boolean("owner_visible").notNull().default(true),
  tenantVisible: boolean("tenant_visible").notNull().default(true),
  
  notes: text("notes"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdByRole: portalRoleEnum("created_by_role"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_service_accounts_agency").on(table.agencyId),
  index("idx_service_accounts_contract").on(table.contractId),
  index("idx_service_accounts_unit").on(table.unitId),
  index("idx_service_accounts_type").on(table.serviceType),
]);

export const insertExternalServiceAccountSchema = createInsertSchema(externalServiceAccounts).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertExternalServiceAccount = z.infer<typeof insertExternalServiceAccountSchema>;
export type ExternalServiceAccount = typeof externalServiceAccounts.$inferSelect;

// Termination Requests - Tenant requests to end rental early
export const externalTerminationRequests = pgTable("external_termination_requests", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  
  requestedByRole: portalRoleEnum("requested_by_role").notNull(),
  requestedByTokenId: varchar("requested_by_token_id").references(() => externalPortalAccessTokens.id),
  requestedByUserId: varchar("requested_by_user_id").references(() => users.id),
  
  requestedEndDate: timestamp("requested_end_date").notNull(),
  reason: text("reason").notNull(),
  additionalNotes: text("additional_notes"),
  
  status: terminationRequestStatusEnum("status").notNull().default("pending"),
  
  reviewedByUserId: varchar("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  approvedEndDate: timestamp("approved_end_date"),
  depositDeductions: decimal("deposit_deductions", { precision: 10, scale: 2 }),
  depositDeductionReason: text("deposit_deduction_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_termination_requests_agency").on(table.agencyId),
  index("idx_termination_requests_contract").on(table.contractId),
  index("idx_termination_requests_status").on(table.status),
]);

export const insertExternalTerminationRequestSchema = createInsertSchema(externalTerminationRequests).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertExternalTerminationRequest = z.infer<typeof insertExternalTerminationRequestSchema>;
export type ExternalTerminationRequest = typeof externalTerminationRequests.$inferSelect;

// Owner Payment Confirmations - Owner confirms tenant payments
export const externalOwnerPaymentConfirmations = pgTable("external_owner_payment_confirmations", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  paymentScheduleId: varchar("payment_schedule_id").references(() => externalPaymentSchedules.id, { onDelete: "set null" }),
  receiptId: varchar("receipt_id").references(() => externalPaymentReceipts.id, { onDelete: "set null" }),
  
  confirmedByRole: portalRoleEnum("confirmed_by_role").notNull().default("owner"),
  confirmedByTokenId: varchar("confirmed_by_token_id").references(() => externalPortalAccessTokens.id),
  confirmedByUserId: varchar("confirmed_by_user_id").references(() => users.id),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("MXN"),
  paymentDate: timestamp("payment_date").notNull(),
  
  isConfirmed: boolean("is_confirmed").notNull().default(true),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_owner_confirmations_agency").on(table.agencyId),
  index("idx_owner_confirmations_contract").on(table.contractId),
  index("idx_owner_confirmations_schedule").on(table.paymentScheduleId),
  index("idx_owner_confirmations_receipt").on(table.receiptId),
]);

export const insertExternalOwnerPaymentConfirmationSchema = createInsertSchema(externalOwnerPaymentConfirmations).omit({
  id: true, createdAt: true,
});
export type InsertExternalOwnerPaymentConfirmation = z.infer<typeof insertExternalOwnerPaymentConfirmationSchema>;
export type ExternalOwnerPaymentConfirmation = typeof externalOwnerPaymentConfirmations.$inferSelect;

// Portal Chat Messages - AI-powered support chat for portal users
export const externalPortalChatMessages = pgTable("external_portal_chat_messages", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  contractId: varchar("contract_id").notNull().references(() => externalRentalContracts.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").references(() => externalPortalSessions.id, { onDelete: "set null" }),
  
  role: portalRoleEnum("role").notNull(), // tenant or owner
  tokenId: varchar("token_id").references(() => externalPortalAccessTokens.id),
  
  messageType: varchar("message_type", { length: 20 }).notNull().default("user"), // user, assistant, system
  content: text("content").notNull(),
  
  metadata: jsonb("metadata"), // For storing context, references, etc.
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_portal_chat_agency").on(table.agencyId),
  index("idx_portal_chat_contract").on(table.contractId),
  index("idx_portal_chat_session").on(table.sessionId),
  index("idx_portal_chat_role").on(table.role),
]);

export const insertExternalPortalChatMessageSchema = createInsertSchema(externalPortalChatMessages).omit({
  id: true, createdAt: true,
});
export type InsertExternalPortalChatMessage = z.infer<typeof insertExternalPortalChatMessageSchema>;
export type ExternalPortalChatMessage = typeof externalPortalChatMessages.$inferSelect;

// ============================================
// SELLER WORKSPACE TABLES
// ============================================

// Message Template Types
export const sellerTemplateTypeEnum = pgEnum("seller_template_type", [
  "greeting",      // Saludo inicial
  "follow_up",     // Seguimiento
  "property_share", // Compartir propiedad
  "closing",       // Cierre
  "custom",        // Personalizado
]);

// Follow-up Task Status
export const followUpTaskStatusEnum = pgEnum("follow_up_task_status", [
  "pending",       // Pendiente
  "completed",     // Completado
  "snoozed",       // Pospuesto
  "cancelled",     // Cancelado
]);

// Seller Message Templates - Plantillas de mensajes para vendedores
export const sellerMessageTemplates = pgTable("seller_message_templates", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").references(() => users.id, { onDelete: "cascade" }), // null = shared template for agency
  
  templateType: sellerTemplateTypeEnum("template_type").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  body: text("body").notNull(), // Template body with variables like {{lead.name}}, {{property.name}}
  
  isDefault: boolean("is_default").notNull().default(false), // Default template for this type
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_seller_templates_agency").on(table.agencyId),
  index("idx_seller_templates_seller").on(table.sellerId),
  index("idx_seller_templates_type").on(table.templateType),
]);

export const insertSellerMessageTemplateSchema = createInsertSchema(sellerMessageTemplates).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSellerMessageTemplate = z.infer<typeof insertSellerMessageTemplateSchema>;
export type SellerMessageTemplate = typeof sellerMessageTemplates.$inferSelect;

// Seller Follow-up Tasks - Recordatorios de seguimiento para vendedores
export const sellerFollowUpTasks = pgTable("seller_follow_up_tasks", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").notNull().references(() => externalLeads.id, { onDelete: "cascade" }),
  
  status: followUpTaskStatusEnum("status").notNull().default("pending"),
  dueDate: timestamp("due_date").notNull(),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high
  
  reason: varchar("reason", { length: 255 }), // Why follow-up is needed
  notes: text("notes"),
  
  autoGenerated: boolean("auto_generated").notNull().default(false), // System-generated vs manual
  lastContactedAt: timestamp("last_contacted_at"), // When lead was last contacted
  
  completedAt: timestamp("completed_at"),
  snoozedUntil: timestamp("snoozed_until"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_follow_up_agency").on(table.agencyId),
  index("idx_follow_up_seller").on(table.sellerId),
  index("idx_follow_up_lead").on(table.leadId),
  index("idx_follow_up_status").on(table.status),
  index("idx_follow_up_due_date").on(table.dueDate),
]);

export const insertSellerFollowUpTaskSchema = createInsertSchema(sellerFollowUpTasks).omit({
  id: true, createdAt: true, updatedAt: true, completedAt: true,
});
export type InsertSellerFollowUpTask = z.infer<typeof insertSellerFollowUpTaskSchema>;
export type SellerFollowUpTask = typeof sellerFollowUpTasks.$inferSelect;

// External Lead Property Offers - Propiedades enviadas a leads
export const externalLeadPropertyOffers = pgTable("external_lead_property_offers", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").notNull().references(() => externalLeads.id, { onDelete: "cascade" }),
  propertyId: varchar("property_id").references(() => externalProperties.id, { onDelete: "set null" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  
  sellerId: varchar("seller_id").notNull().references(() => users.id), // Seller who sent the property
  
  channel: varchar("channel", { length: 20 }).notNull().default("whatsapp"), // whatsapp, email, sms
  templateId: varchar("template_id").references(() => sellerMessageTemplates.id, { onDelete: "set null" }),
  message: text("message"), // Actual message sent
  
  // Lead response
  isViewed: boolean("is_viewed").notNull().default(false),
  viewedAt: timestamp("viewed_at"),
  isInterested: boolean("is_interested"), // null = no response, true = interested, false = not interested
  respondedAt: timestamp("responded_at"),
  leadResponse: text("lead_response"), // Lead's feedback/response
  
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ext_lead_offers_agency").on(table.agencyId),
  index("idx_ext_lead_offers_lead").on(table.leadId),
  index("idx_ext_lead_offers_property").on(table.propertyId),
  index("idx_ext_lead_offers_unit").on(table.unitId),
  index("idx_ext_lead_offers_seller").on(table.sellerId),
  index("idx_ext_lead_offers_sent").on(table.sentAt),
]);

export const insertExternalLeadPropertyOfferSchema = createInsertSchema(externalLeadPropertyOffers).omit({
  id: true, createdAt: true, sentAt: true,
});
export type InsertExternalLeadPropertyOffer = z.infer<typeof insertExternalLeadPropertyOfferSchema>;
export type ExternalLeadPropertyOffer = typeof externalLeadPropertyOffers.$inferSelect;

// =====================================================
// Seller Goals - Metas para vendedores
// =====================================================

export const sellerGoalTypeEnum = pgEnum("seller_goal_type", [
  "leads",
  "conversions", 
  "revenue",
  "showings"
]);

export const sellerGoalPeriodEnum = pgEnum("seller_goal_period", [
  "weekly",
  "monthly",
  "quarterly"
]);

// Seller Goals - Metas asignadas por admin a vendedores
export const sellerGoals = pgTable("seller_goals", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").references(() => users.id, { onDelete: "cascade" }), // null = applies to all sellers in agency
  
  // Bilingual names
  nameEs: varchar("name_es", { length: 200 }).notNull(),
  nameEn: varchar("name_en", { length: 200 }).notNull(),
  descriptionEs: text("description_es"),
  descriptionEn: text("description_en"),
  
  goalType: sellerGoalTypeEnum("goal_type").notNull(),
  target: integer("target").notNull(), // Target number to achieve
  period: sellerGoalPeriodEnum("period").notNull().default("monthly"),
  
  // Date range
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Audit
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_seller_goals_agency").on(table.agencyId),
  index("idx_seller_goals_seller").on(table.sellerId),
  index("idx_seller_goals_type").on(table.goalType),
  index("idx_seller_goals_period").on(table.period),
  index("idx_seller_goals_dates").on(table.startDate, table.endDate),
]);

export const insertSellerGoalSchema = createInsertSchema(sellerGoals).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertSellerGoal = z.infer<typeof insertSellerGoalSchema>;
export type SellerGoal = typeof sellerGoals.$inferSelect;

// =====================================================
// SELLER PROFILES & COMMISSIONS - Admin management of sellers
// =====================================================

export const sellerStatusEnum = pgEnum("seller_status", [
  "active",
  "inactive",
  "on_leave",
  "terminated"
]);

export const commissionTypeEnum = pgEnum("commission_type", [
  "percentage",
  "fixed",
  "tiered"
]);

// Note: payoutStatusEnum already exists at line 568

// External Seller Profiles - Admin-managed seller information
// Note: Matches actual database structure
export const externalSellerProfiles = pgTable("external_seller_profiles", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Employment info (matches DB column names)
  sellerCode: varchar("seller_code", { length: 50 }), // Internal code
  hireDate: date("hire_date"),
  contractType: varchar("contract_type", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  
  // Salary & Commission configuration
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).default("10.00"),
  bonusPercent: decimal("bonus_percent", { precision: 5, scale: 2 }),
  
  // Sales tracking
  totalSalesCount: integer("total_sales_count").default(0),
  totalSalesAmount: decimal("total_sales_amount", { precision: 12, scale: 2 }).default("0"),
  monthlyGoal: decimal("monthly_goal", { precision: 12, scale: 2 }),
  annualGoal: decimal("annual_goal", { precision: 12, scale: 2 }),
  
  // AI Credits - Per-seller credit tracking (starts with 10 credits)
  aiCreditBalance: integer("ai_credit_balance").notNull().default(10), // Current available credits
  aiCreditTotalAssigned: integer("ai_credit_total_assigned").notNull().default(10), // Total credits ever assigned by admin
  aiCreditUsed: integer("ai_credit_used").notNull().default(0), // Total credits used
  
  // Notes
  notes: text("notes"),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_seller_profiles_agency").on(table.agencyId),
  index("idx_seller_profiles_user").on(table.userId),
]);

export const insertExternalSellerProfileSchema = createInsertSchema(externalSellerProfiles).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertExternalSellerProfile = z.infer<typeof insertExternalSellerProfileSchema>;
export type ExternalSellerProfile = typeof externalSellerProfiles.$inferSelect;

// External Seller Commissions - Individual commission records
// Note: Matches actual database structure
export const externalSellerCommissions = pgTable("external_seller_commissions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerProfileId: varchar("seller_profile_id").references(() => externalSellerProfiles.id, { onDelete: "set null" }),
  
  // Source of commission
  contractId: varchar("contract_id").references(() => externalRentalContracts.id, { onDelete: "set null" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  
  // Commission details
  saleType: varchar("sale_type", { length: 50 }), // rental, sale, etc.
  baseAmount: decimal("base_amount", { precision: 12, scale: 2 }).notNull(),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }).notNull(),
  bonusPercent: decimal("bonus_percent", { precision: 5, scale: 2 }),
  bonusAmount: decimal("bonus_amount", { precision: 12, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  
  // Status and payment
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  payoutId: varchar("payout_id"),
  
  // Notes
  notes: text("notes"),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_seller_commissions_agency").on(table.agencyId),
  index("idx_seller_commissions_profile").on(table.sellerProfileId),
  index("idx_seller_commissions_contract").on(table.contractId),
]);

export const insertExternalSellerCommissionSchema = createInsertSchema(externalSellerCommissions).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertExternalSellerCommission = z.infer<typeof insertExternalSellerCommissionSchema>;
export type ExternalSellerCommission = typeof externalSellerCommissions.$inferSelect;

// External Seller Payouts - Payout records for sellers
// Note: Matches actual database structure
export const externalSellerPayouts = pgTable("external_seller_payouts", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerProfileId: varchar("seller_profile_id").references(() => externalSellerProfiles.id, { onDelete: "set null" }),
  
  // Payout details
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  payoutDate: timestamp("payout_date"),
  
  // Payment info
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentReference: varchar("payment_reference", { length: 200 }),
  
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  
  notes: text("notes"),
  
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_seller_payouts_agency").on(table.agencyId),
  index("idx_seller_payouts_profile").on(table.sellerProfileId),
  index("idx_seller_payouts_status").on(table.status),
]);

export const insertExternalSellerPayoutSchema = createInsertSchema(externalSellerPayouts).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertExternalSellerPayout = z.infer<typeof insertExternalSellerPayoutSchema>;
export type ExternalSellerPayout = typeof externalSellerPayouts.$inferSelect;

// =====================================================
// Public Chatbot Conversations - For homepage AI assistant
// =====================================================

export const publicChatbotConversations = pgTable("public_chatbot_conversations", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  
  visitorName: varchar("visitor_name", { length: 200 }),
  visitorEmail: varchar("visitor_email", { length: 255 }),
  visitorPhone: varchar("visitor_phone", { length: 50 }),
  
  messages: jsonb("messages").notNull().default(sql`'[]'::jsonb`),
  
  convertedToLeadId: varchar("converted_to_lead_id").references(() => externalLeads.id, { onDelete: "set null" }),
  appointmentId: varchar("appointment_id").references(() => externalAppointments.id, { onDelete: "set null" }),
  presentationCardId: varchar("presentation_card_id").references(() => presentationCards.id, { onDelete: "set null" }),
  
  status: varchar("status", { length: 20 }).notNull().default("active"),
  metadata: jsonb("metadata"),
  
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_public_chatbot_agency").on(table.agencyId),
  index("idx_public_chatbot_session").on(table.sessionId),
  index("idx_public_chatbot_email").on(table.visitorEmail),
]);

export const insertPublicChatbotConversationSchema = createInsertSchema(publicChatbotConversations).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertPublicChatbotConversation = z.infer<typeof insertPublicChatbotConversationSchema>;
export type PublicChatbotConversation = typeof publicChatbotConversations.$inferSelect;

export interface ChatbotMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  quickReplies?: QuickReply[];
  inputType?: "text" | "phone" | "select" | "date" | "number" | "none";
  metadata?: {
    action?: "recommend_properties" | "capture_lead" | "schedule_appointment" | "generate_card";
    propertyIds?: number[];
    leadId?: string;
    appointmentId?: string;
    cardId?: string;
    step?: ChatFlowStep;
  };
}

export type ChatFlowStep = 
  | "greeting"
  | "operation_type" 
  | "name"
  | "phone"
  | "budget"
  | "zone"
  | "move_date"
  | "bedrooms"
  | "confirm_lead"
  | "lead_saved"
  | "appointment_offer"
  | "appointment_date"
  | "appointment_time"
  | "appointment_saved"
  | "complete"
  | "incomplete";

export interface QuickReply {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

export interface ChatbotLeadData {
  name?: string;
  phone?: string;
  email?: string;
  operationType?: "rent_long" | "rent_short" | "buy" | "list_property" | "other";
  budget?: string;
  zone?: string;
  moveDate?: string;
  bedrooms?: string;
  peopleCount?: string;
  propertyId?: string;
  condominiumId?: string;
  sourcePage?: string;
}

export interface ChatbotAppointmentData {
  preferredDate?: string;
  preferredTime?: "morning" | "afternoon" | "evening";
  propertyId?: string;
  notes?: string;
}

// =====================================================
// Property Activity History - Track all activities on properties
// =====================================================

export const propertyActivityTypeEnum = pgEnum("property_activity_type", [
  "offer_sent",
  "offer_completed",
  "offer_expired",
  "rental_form_sent",
  "rental_form_completed",
  "rental_form_expired",
  "appointment_scheduled",
  "appointment_completed",
  "appointment_cancelled",
  "lead_interested",
  "contract_started",
  "contract_ended",
  "showing_scheduled",
  "showing_completed",
]);

export const externalPropertyActivityHistory = pgTable("external_property_activity_history", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  unitId: varchar("unit_id").notNull().references(() => externalUnits.id, { onDelete: "cascade" }),
  condominiumId: varchar("condominium_id").references(() => externalCondominiums.id, { onDelete: "set null" }),
  
  activityType: propertyActivityTypeEnum("activity_type").notNull(),
  
  leadId: varchar("lead_id").references(() => externalLeads.id, { onDelete: "set null" }),
  leadName: varchar("lead_name", { length: 255 }),
  
  clientId: varchar("client_id").references(() => externalClients.id, { onDelete: "set null" }),
  clientName: varchar("client_name", { length: 255 }),
  
  offerTokenId: varchar("offer_token_id").references(() => offerTokens.id, { onDelete: "set null" }),
  appointmentId: varchar("appointment_id").references(() => externalAppointments.id, { onDelete: "set null" }),
  showingId: varchar("showing_id").references(() => externalLeadShowings.id, { onDelete: "set null" }),
  contractId: varchar("contract_id").references(() => externalRentalContracts.id, { onDelete: "set null" }),
  
  performedBy: varchar("performed_by").references(() => users.id, { onDelete: "set null" }),
  performedByName: varchar("performed_by_name", { length: 255 }),
  
  details: jsonb("details").$type<{
    recipientType?: "tenant" | "owner";
    channel?: string;
    status?: string;
    notes?: string;
    outcome?: string;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_property_activity_agency").on(table.agencyId),
  index("idx_property_activity_unit").on(table.unitId),
  index("idx_property_activity_condominium").on(table.condominiumId),
  index("idx_property_activity_type").on(table.activityType),
  index("idx_property_activity_lead").on(table.leadId),
  index("idx_property_activity_client").on(table.clientId),
  index("idx_property_activity_created").on(table.createdAt),
]);

export const insertExternalPropertyActivityHistorySchema = createInsertSchema(externalPropertyActivityHistory).omit({
  id: true, createdAt: true,
});
export type InsertExternalPropertyActivityHistory = z.infer<typeof insertExternalPropertyActivityHistorySchema>;
export type ExternalPropertyActivityHistory = typeof externalPropertyActivityHistory.$inferSelect;

// ==========================================
// PROPERTY RECRUITMENT SYSTEM
// Sistema de Reclutamiento de Propiedades para Vendedores
// ==========================================

// Estados del prospecto de propiedad en el pipeline de reclutamiento
export const propertyProspectStatusEnum = pgEnum("property_prospect_status", [
  "identified",        // Propiedad identificada
  "contacted",         // Propietario contactado
  "documentation",     // Recopilando documentación
  "inspection_scheduled", // Inspección agendada
  "inspection_completed", // Inspección completada
  "owner_invited",     // Invitación enviada al propietario
  "owner_registered",  // Propietario registrado
  "property_approved", // Propiedad aprobada y publicada
  "rejected",          // Rechazada
  "cancelled"          // Cancelada
]);

// Tipos de propiedad prospecto
export const propertyProspectTypeEnum = pgEnum("property_prospect_type", [
  "casa",
  "departamento", 
  "penthouse",
  "estudio",
  "villa",
  "terreno",
  "local_comercial",
  "oficina",
  "otro"
]);

// Estados de confianza del propietario
export const ownerTrustStatusEnum = pgEnum("owner_trust_status", [
  "pending",           // Pendiente de verificación
  "documents_requested", // Documentos solicitados
  "documents_submitted", // Documentos enviados
  "verified",          // Verificado
  "trusted"            // Confiable (historial positivo)
]);

// Prospectos de propiedades para reclutamiento
export const externalPropertyProspects = pgTable("external_property_prospects", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Vendedor que recluta la propiedad (referidor)
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerName: varchar("seller_name", { length: 255 }),
  
  // Categoría de propiedad (condominio vs casa privada)
  propertyCategory: varchar("property_category", { length: 50 }).default("condominium"), // condominium, private_house
  condominiumId: varchar("condominium_id").references(() => externalCondominiums.id, { onDelete: "set null" }),
  newCondominiumName: varchar("new_condominium_name", { length: 255 }), // Para crear nuevo condominio
  unitNumber: varchar("unit_number", { length: 50 }), // Número de unidad si es condominio
  
  // Información de la propiedad
  propertyName: varchar("property_name", { length: 255 }), // Nombre/referencia de la propiedad
  propertyType: propertyProspectTypeEnum("property_type"),
  
  // Ubicación
  address: varchar("address", { length: 500 }),
  neighborhood: varchar("neighborhood", { length: 200 }), // Colonia/Zona
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  googleMapsUrl: varchar("google_maps_url", { length: 500 }),
  
  // Características
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }), // Permite 2.5 baños
  squareMeters: decimal("square_meters", { precision: 10, scale: 2 }),
  parkingSpaces: integer("parking_spaces"),
  floors: integer("floors"),
  yearBuilt: integer("year_built"),
  
  // Estimaciones de renta/venta
  estimatedRentPrice: decimal("estimated_rent_price", { precision: 12, scale: 2 }),
  estimatedSalePrice: decimal("estimated_sale_price", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("MXN"),
  listingType: varchar("listing_type", { length: 20 }).default("rent"), // rent, sale, both
  
  // Información del propietario
  ownerFirstName: varchar("owner_first_name", { length: 100 }),
  ownerLastName: varchar("owner_last_name", { length: 100 }),
  ownerEmail: varchar("owner_email", { length: 255 }),
  ownerPhone: varchar("owner_phone", { length: 50 }),
  ownerWhatsApp: varchar("owner_whatsapp", { length: 50 }),
  ownerPreferredContact: varchar("owner_preferred_contact", { length: 50 }), // email, phone, whatsapp
  
  // Estado y verificación
  status: propertyProspectStatusEnum("status").notNull().default("identified"),
  ownerTrustStatus: ownerTrustStatusEnum("owner_trust_status").default("pending"),
  
  // Referido y comisiones
  isReferral: boolean("is_referral").default(true), // El vendedor es referido de esta propiedad
  referralAgreementSigned: boolean("referral_agreement_signed").default(false),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }), // % de comisión acordada
  
  // Documentación
  hasPropertyTitle: boolean("has_property_title").default(false),
  hasPredialReceipt: boolean("has_predial_receipt").default(false),
  hasIdVerification: boolean("has_id_verification").default(false),
  documentsJson: jsonb("documents_json").$type<{
    propertyTitle?: { uploaded: boolean; url?: string; verifiedAt?: string };
    predialReceipt?: { uploaded: boolean; url?: string; verifiedAt?: string };
    ownerIdFront?: { uploaded: boolean; url?: string; verifiedAt?: string };
    ownerIdBack?: { uploaded: boolean; url?: string; verifiedAt?: string };
    otherDocuments?: Array<{ name: string; url: string; uploadedAt: string }>;
  }>(),
  
  // Imágenes de la propiedad
  images: text("images").array(),
  
  // Inspección
  inspectionScheduledAt: timestamp("inspection_scheduled_at"),
  inspectionCompletedAt: timestamp("inspection_completed_at"),
  inspectionNotes: text("inspection_notes"),
  inspectedBy: varchar("inspected_by").references(() => users.id),
  
  // Token de invitación para propietario
  ownerInviteToken: varchar("owner_invite_token").unique(),
  ownerInviteExpiresAt: timestamp("owner_invite_expires_at"),
  ownerInviteSentAt: timestamp("owner_invite_sent_at"),
  ownerInviteSentVia: varchar("owner_invite_sent_via", { length: 50 }), // email, whatsapp, sms
  
  // Conversión
  convertedToUnitId: varchar("converted_to_unit_id").references(() => externalUnits.id, { onDelete: "set null" }),
  convertedAt: timestamp("converted_at"),
  
  // Notas y seguimiento
  notes: text("notes"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  lastContactDate: timestamp("last_contact_date"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_property_prospects_agency").on(table.agencyId),
  index("idx_property_prospects_seller").on(table.sellerId),
  index("idx_property_prospects_status").on(table.status),
  index("idx_property_prospects_owner_email").on(table.ownerEmail),
  index("idx_property_prospects_owner_phone").on(table.ownerPhone),
  index("idx_property_prospects_invite_token").on(table.ownerInviteToken),
  index("idx_property_prospects_next_followup").on(table.nextFollowUpDate),
  index("idx_property_prospects_created").on(table.createdAt),
]);

export const insertExternalPropertyProspectSchema = createInsertSchema(externalPropertyProspects).omit({
  id: true,
  agencyId: true,
  createdAt: true,
  updatedAt: true,
  ownerInviteToken: true,
  ownerInviteExpiresAt: true,
  convertedToUnitId: true,
  convertedAt: true,
}).extend({
  bathrooms: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : val
  ),
  squareMeters: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : val
  ),
  estimatedRentPrice: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : val
  ),
  estimatedSalePrice: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : val
  ),
  commissionPercentage: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : val
  ),
});

export const updateExternalPropertyProspectSchema = insertExternalPropertyProspectSchema.partial();

export type InsertExternalPropertyProspect = z.infer<typeof insertExternalPropertyProspectSchema>;
export type UpdateExternalPropertyProspect = z.infer<typeof updateExternalPropertyProspectSchema>;
export type ExternalPropertyProspect = typeof externalPropertyProspects.$inferSelect;

// Historial de actividades del prospecto de propiedad
export const propertyProspectActivityTypeEnum = pgEnum("property_prospect_activity_type", [
  "created",           // Prospecto creado
  "status_changed",    // Estado cambiado
  "owner_contacted",   // Propietario contactado
  "call_made",         // Llamada realizada
  "whatsapp_sent",     // WhatsApp enviado
  "email_sent",        // Email enviado
  "meeting_scheduled", // Reunión agendada
  "meeting_completed", // Reunión completada
  "document_uploaded", // Documento subido
  "document_verified", // Documento verificado
  "inspection_scheduled", // Inspección agendada
  "inspection_completed", // Inspección completada
  "invite_sent",       // Invitación enviada
  "owner_registered",  // Propietario se registró
  "property_approved", // Propiedad aprobada
  "note_added",        // Nota agregada
  "followup_scheduled" // Seguimiento programado
]);

export const externalPropertyProspectActivities = pgTable("external_property_prospect_activities", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  prospectId: varchar("prospect_id").notNull().references(() => externalPropertyProspects.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  activityType: propertyProspectActivityTypeEnum("activity_type").notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Estado anterior y nuevo (para cambios de estado)
  previousStatus: propertyProspectStatusEnum("previous_status"),
  newStatus: propertyProspectStatusEnum("new_status"),
  
  // Detalles adicionales
  details: jsonb("details").$type<{
    channel?: string;
    outcome?: string;
    duration?: number; // minutos
    documentType?: string;
    scheduledDate?: string;
    notes?: string;
  }>(),
  
  performedBy: varchar("performed_by").references(() => users.id, { onDelete: "set null" }),
  performedByName: varchar("performed_by_name", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_prospect_activities_prospect").on(table.prospectId),
  index("idx_prospect_activities_agency").on(table.agencyId),
  index("idx_prospect_activities_type").on(table.activityType),
  index("idx_prospect_activities_created").on(table.createdAt),
]);

export const insertExternalPropertyProspectActivitySchema = createInsertSchema(externalPropertyProspectActivities).omit({
  id: true,
  createdAt: true,
});

export type InsertExternalPropertyProspectActivity = z.infer<typeof insertExternalPropertyProspectActivitySchema>;
export type ExternalPropertyProspectActivity = typeof externalPropertyProspectActivities.$inferSelect;

// ============================================================================
// COMMISSION MANAGEMENT SYSTEM
// Sistema jerárquico de gestión de comisiones para vendedores
// ============================================================================

// External Commission Profiles - Default commission rates for the agency
export const externalCommissionProfiles = pgTable("external_commission_profiles", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }).unique(),
  
  // Commission percentages (0-100)
  rentalCommission: decimal("rental_commission", { precision: 5, scale: 2 }).notNull().default("10.00"), // % por renta cerrada
  listedPropertyCommission: decimal("listed_property_commission", { precision: 5, scale: 2 }).notNull().default("5.00"), // % por propiedad enlistada
  recruitedPropertyCommission: decimal("recruited_property_commission", { precision: 5, scale: 2 }).notNull().default("15.00"), // % por propiedad reclutada
  
  // Notes
  notes: text("notes"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_commission_profiles_agency").on(table.agencyId),
]);

export const insertExternalCommissionProfileSchema = createInsertSchema(externalCommissionProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rentalCommission: z.union([z.string(), z.number()]).transform(val => String(val)),
  listedPropertyCommission: z.union([z.string(), z.number()]).transform(val => String(val)),
  recruitedPropertyCommission: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export type InsertExternalCommissionProfile = z.infer<typeof insertExternalCommissionProfileSchema>;
export type ExternalCommissionProfile = typeof externalCommissionProfiles.$inferSelect;

// External Commission Role Overrides - Commission rates by role (overrides agency defaults)
export const externalCommissionRoleOverrides = pgTable("external_commission_role_overrides", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Role this override applies to
  role: varchar("role", { length: 50 }).notNull(), // e.g., "external_agency_seller"
  
  // Commission percentages (null means use agency default)
  rentalCommission: decimal("rental_commission", { precision: 5, scale: 2 }),
  listedPropertyCommission: decimal("listed_property_commission", { precision: 5, scale: 2 }),
  recruitedPropertyCommission: decimal("recruited_property_commission", { precision: 5, scale: 2 }),
  
  // Notes
  notes: text("notes"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_commission_role_overrides_agency").on(table.agencyId),
  index("idx_commission_role_overrides_role").on(table.role),
  uniqueIndex("idx_commission_role_overrides_unique").on(table.agencyId, table.role),
]);

export const insertExternalCommissionRoleOverrideSchema = createInsertSchema(externalCommissionRoleOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rentalCommission: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : null
  ),
  listedPropertyCommission: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : null
  ),
  recruitedPropertyCommission: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : null
  ),
});

export type InsertExternalCommissionRoleOverride = z.infer<typeof insertExternalCommissionRoleOverrideSchema>;
export type ExternalCommissionRoleOverride = typeof externalCommissionRoleOverrides.$inferSelect;

// External Commission User Overrides - Commission rates for specific users (overrides role defaults)
export const externalCommissionUserOverrides = pgTable("external_commission_user_overrides", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // User this override applies to
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Commission percentages (null means use role/agency default)
  rentalCommission: decimal("rental_commission", { precision: 5, scale: 2 }),
  listedPropertyCommission: decimal("listed_property_commission", { precision: 5, scale: 2 }),
  recruitedPropertyCommission: decimal("recruited_property_commission", { precision: 5, scale: 2 }),
  
  // Notes
  notes: text("notes"),
  
  // Validity period (optional)
  effectiveFrom: timestamp("effective_from"),
  effectiveUntil: timestamp("effective_until"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_commission_user_overrides_agency").on(table.agencyId),
  index("idx_commission_user_overrides_user").on(table.userId),
  uniqueIndex("idx_commission_user_overrides_unique").on(table.agencyId, table.userId),
]);

export const insertExternalCommissionUserOverrideSchema = createInsertSchema(externalCommissionUserOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rentalCommission: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : null
  ),
  listedPropertyCommission: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : null
  ),
  recruitedPropertyCommission: z.union([z.string(), z.number()]).optional().nullable().transform(val => 
    val !== null && val !== undefined ? String(val) : null
  ),
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveUntil: z.coerce.date().optional().nullable(),
});

export type InsertExternalCommissionUserOverride = z.infer<typeof insertExternalCommissionUserOverrideSchema>;
export type ExternalCommissionUserOverride = typeof externalCommissionUserOverrides.$inferSelect;

// External Commission Lead Overrides - Commission rates for specific leads/deals (highest priority)
export const externalCommissionLeadOverrides = pgTable("external_commission_lead_overrides", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Lead or property prospect this override applies to
  leadId: varchar("lead_id").references(() => externalLeads.id, { onDelete: "cascade" }),
  prospectId: varchar("prospect_id").references(() => externalPropertyProspects.id, { onDelete: "cascade" }),
  
  // User who gets this custom commission
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Commission type being overridden
  commissionType: varchar("commission_type", { length: 50 }).notNull(), // 'rental', 'listed', 'recruited'
  
  // Commission percentage for this specific deal
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  
  // Reason for the custom rate
  reason: text("reason"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_commission_lead_overrides_agency").on(table.agencyId),
  index("idx_commission_lead_overrides_lead").on(table.leadId),
  index("idx_commission_lead_overrides_prospect").on(table.prospectId),
  index("idx_commission_lead_overrides_user").on(table.userId),
]);

export const insertExternalCommissionLeadOverrideSchema = createInsertSchema(externalCommissionLeadOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  commissionRate: z.union([z.string(), z.number()]).transform(val => String(val)),
  commissionType: z.enum(['rental', 'listed', 'recruited']),
});

export type InsertExternalCommissionLeadOverride = z.infer<typeof insertExternalCommissionLeadOverrideSchema>;
export type ExternalCommissionLeadOverride = typeof externalCommissionLeadOverrides.$inferSelect;

// Commission Change Audit Log - Track all commission changes
export const externalCommissionAuditLogs = pgTable("external_commission_audit_logs", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // What changed
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'profile', 'role_override', 'user_override', 'lead_override'
  entityId: varchar("entity_id").notNull(), // ID of the changed record
  action: varchar("action", { length: 20 }).notNull(), // 'create', 'update', 'delete'
  
  // Change details
  previousValues: jsonb("previous_values").$type<Record<string, any>>(),
  newValues: jsonb("new_values").$type<Record<string, any>>(),
  
  // Who made the change
  changedBy: varchar("changed_by").references(() => users.id),
  changedByName: varchar("changed_by_name", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_commission_audit_agency").on(table.agencyId),
  index("idx_commission_audit_entity").on(table.entityType, table.entityId),
  index("idx_commission_audit_created").on(table.createdAt),
]);

export const insertExternalCommissionAuditLogSchema = createInsertSchema(externalCommissionAuditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertExternalCommissionAuditLog = z.infer<typeof insertExternalCommissionAuditLogSchema>;
export type ExternalCommissionAuditLog = typeof externalCommissionAuditLogs.$inferSelect;

// ============================================================================
// EXTERNAL AGENCY TEAM CHAT SYSTEM
// Real-time messaging, activity notifications, and gamification
// ============================================================================

// Enum for chat message types
export const chatMessageTypeEnum = pgEnum("chat_message_type", [
  "text",           // Regular text message
  "image",          // Image attachment
  "audio",          // Audio/voice message
  "file",           // Other file types
  "system_activity" // System-generated activity notification
]);

// Enum for activity action types (for tracking and points)
export const activityActionTypeEnum = pgEnum("activity_action_type", [
  "lead_registered",      // Seller registered a new lead
  "offer_sent",           // Seller sent an offer to a lead
  "rental_form_sent",     // Seller sent a rental form to a lead
  "owner_registered",     // Seller registered a new property owner
  "lead_converted",       // Lead converted to client
  "rental_completed",     // Rental was completed/signed
  "showing_scheduled",    // Property showing scheduled
  "property_listed",      // New property listed
  "client_registered"     // New client registered
]);

// External Agency Chat Messages - Main chat messages table
export const externalAgencyChatMessages = pgTable("external_agency_chat_messages", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Sender info
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  senderRole: varchar("sender_role", { length: 50 }).notNull(),
  senderAvatarUrl: text("sender_avatar_url"),
  
  // Message content
  messageType: chatMessageTypeEnum("message_type").notNull().default("text"),
  content: text("content"), // Text content or description for attachments
  
  // For activity messages - reference to the activity log
  activityLogId: varchar("activity_log_id"),
  
  // Read tracking
  readBy: jsonb("read_by").$type<string[]>().default([]),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").notNull().default(false),
}, (table) => [
  index("idx_chat_messages_agency").on(table.agencyId),
  index("idx_chat_messages_sender").on(table.senderId),
  index("idx_chat_messages_created").on(table.createdAt),
  index("idx_chat_messages_type").on(table.messageType),
]);

export const insertExternalAgencyChatMessageSchema = createInsertSchema(externalAgencyChatMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalAgencyChatMessage = z.infer<typeof insertExternalAgencyChatMessageSchema>;
export type ExternalAgencyChatMessage = typeof externalAgencyChatMessages.$inferSelect;

// External Agency Chat Attachments - Files, images, audio for messages
export const externalAgencyChatAttachments = pgTable("external_agency_chat_attachments", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: varchar("message_id").notNull().references(() => externalAgencyChatMessages.id, { onDelete: "cascade" }),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // File info
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(), // MIME type
  fileSize: integer("file_size").notNull(), // Size in bytes
  
  // Storage location - object storage path
  storagePath: text("storage_path").notNull(),
  publicUrl: text("public_url"),
  
  // For audio messages - duration in seconds
  audioDuration: integer("audio_duration"),
  
  // Image dimensions if applicable
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  
  // Thumbnail for images/videos
  thumbnailPath: text("thumbnail_path"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_attachments_message").on(table.messageId),
  index("idx_chat_attachments_agency").on(table.agencyId),
]);

export const insertExternalAgencyChatAttachmentSchema = createInsertSchema(externalAgencyChatAttachments).omit({
  id: true,
  createdAt: true,
});

export type InsertExternalAgencyChatAttachment = z.infer<typeof insertExternalAgencyChatAttachmentSchema>;
export type ExternalAgencyChatAttachment = typeof externalAgencyChatAttachments.$inferSelect;

// External Agency Activity Logs - Track all seller actions for notifications and points
export const externalAgencyActivityLogs = pgTable("external_agency_activity_logs", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Actor (who performed the action)
  actorId: varchar("actor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  actorName: varchar("actor_name", { length: 255 }).notNull(),
  actorRole: varchar("actor_role", { length: 50 }).notNull(),
  
  // Action type
  actionType: activityActionTypeEnum("action_type").notNull(),
  
  // Subject (who/what the action was performed on) - basic info only
  subjectType: varchar("subject_type", { length: 50 }).notNull(), // 'lead', 'client', 'owner', 'property'
  subjectId: varchar("subject_id").notNull(),
  subjectName: varchar("subject_name", { length: 255 }).notNull(), // Name for display
  subjectInfo: jsonb("subject_info").$type<{
    email?: string;
    phone?: string;
    propertyName?: string;
    unitNumber?: string;
    [key: string]: any;
  }>(),
  
  // Points awarded for this action
  pointsAwarded: integer("points_awarded").notNull().default(0),
  
  // Reference to the chat message that was created for this activity
  chatMessageId: varchar("chat_message_id"),
  
  // Whether notification was sent to chat
  notifiedToChat: boolean("notified_to_chat").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_activity_logs_agency").on(table.agencyId),
  index("idx_activity_logs_actor").on(table.actorId),
  index("idx_activity_logs_action").on(table.actionType),
  index("idx_activity_logs_created").on(table.createdAt),
]);

export const insertExternalAgencyActivityLogSchema = createInsertSchema(externalAgencyActivityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertExternalAgencyActivityLog = z.infer<typeof insertExternalAgencyActivityLogSchema>;
export type ExternalAgencyActivityLog = typeof externalAgencyActivityLogs.$inferSelect;

// External Agency Point Configuration - Points per action type
export const externalAgencyPointConfig = pgTable("external_agency_point_config", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Action and its point value
  actionType: activityActionTypeEnum("action_type").notNull(),
  points: integer("points").notNull().default(0),
  
  // Description for display
  descriptionEs: varchar("description_es", { length: 255 }),
  descriptionEn: varchar("description_en", { length: 255 }),
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_point_config_agency").on(table.agencyId),
  uniqueIndex("idx_point_config_unique").on(table.agencyId, table.actionType),
]);

export const insertExternalAgencyPointConfigSchema = createInsertSchema(externalAgencyPointConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalAgencyPointConfig = z.infer<typeof insertExternalAgencyPointConfigSchema>;
export type ExternalAgencyPointConfig = typeof externalAgencyPointConfig.$inferSelect;

// External Agency Seller Points - Track seller point totals
export const externalAgencySellerPoints = pgTable("external_agency_seller_points", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Aggregated point totals
  totalPoints: integer("total_points").notNull().default(0),
  weeklyPoints: integer("weekly_points").notNull().default(0),
  monthlyPoints: integer("monthly_points").notNull().default(0),
  
  // Action counts
  leadsRegistered: integer("leads_registered").notNull().default(0),
  offersSent: integer("offers_sent").notNull().default(0),
  rentalFormsSent: integer("rental_forms_sent").notNull().default(0),
  ownersRegistered: integer("owners_registered").notNull().default(0),
  rentalsCompleted: integer("rentals_completed").notNull().default(0),
  
  // Rank/level
  currentRank: integer("current_rank").notNull().default(1),
  
  // Last reset dates for weekly/monthly
  weeklyResetAt: timestamp("weekly_reset_at").defaultNow().notNull(),
  monthlyResetAt: timestamp("monthly_reset_at").defaultNow().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_seller_points_agency").on(table.agencyId),
  index("idx_seller_points_seller").on(table.sellerId),
  uniqueIndex("idx_seller_points_unique").on(table.agencyId, table.sellerId),
  index("idx_seller_points_total").on(table.totalPoints),
]);

export const insertExternalAgencySellerPointsSchema = createInsertSchema(externalAgencySellerPoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalAgencySellerPoints = z.infer<typeof insertExternalAgencySellerPointsSchema>;
export type ExternalAgencySellerPoints = typeof externalAgencySellerPoints.$inferSelect;

// External Agency Rewards - Available rewards catalog
export const externalAgencyRewards = pgTable("external_agency_rewards", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Reward details
  nameEs: varchar("name_es", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  descriptionEs: text("description_es"),
  descriptionEn: text("description_en"),
  
  // Points required to redeem
  pointsCost: integer("points_cost").notNull(),
  
  // Reward type
  rewardType: varchar("reward_type", { length: 50 }).notNull(), // 'bonus', 'gift', 'day_off', 'commission_boost', 'other'
  rewardValue: varchar("reward_value", { length: 255 }), // Value description
  
  // Availability
  isActive: boolean("is_active").notNull().default(true),
  availableQuantity: integer("available_quantity"), // null = unlimited
  
  // Image
  imageUrl: text("image_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_rewards_agency").on(table.agencyId),
  index("idx_rewards_points").on(table.pointsCost),
]);

export const insertExternalAgencyRewardSchema = createInsertSchema(externalAgencyRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalAgencyReward = z.infer<typeof insertExternalAgencyRewardSchema>;
export type ExternalAgencyReward = typeof externalAgencyRewards.$inferSelect;

// External Agency Reward Redemptions - Track reward claims
export const externalAgencyRewardRedemptions = pgTable("external_agency_reward_redemptions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  rewardId: varchar("reward_id").notNull().references(() => externalAgencyRewards.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Points spent
  pointsSpent: integer("points_spent").notNull(),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'approved', 'delivered', 'rejected'
  
  // Admin notes
  adminNotes: text("admin_notes"),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_redemptions_agency").on(table.agencyId),
  index("idx_redemptions_seller").on(table.sellerId),
  index("idx_redemptions_reward").on(table.rewardId),
  index("idx_redemptions_status").on(table.status),
]);

export const insertExternalAgencyRewardRedemptionSchema = createInsertSchema(externalAgencyRewardRedemptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalAgencyRewardRedemption = z.infer<typeof insertExternalAgencyRewardRedemptionSchema>;
export type ExternalAgencyRewardRedemption = typeof externalAgencyRewardRedemptions.$inferSelect;

// ========================================
// EMAIL LEAD IMPORT SYSTEM
// ========================================

// Enum for email providers
export const emailLeadProviderEnum = pgEnum("email_lead_provider", [
  "tokko",
  "easybroker",
  "inmuebles24",
  "mercadolibre",
  "other",
]);

// Enum for import status
export const emailImportStatusEnum = pgEnum("email_import_status", [
  "success",
  "duplicate",
  "parse_error",
  "skipped",
]);

// External Lead Email Sources - Configuration for email lead import per agency
export const externalLeadEmailSources = pgTable("external_lead_email_sources", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Provider configuration
  provider: emailLeadProviderEnum("provider").notNull(),
  providerName: varchar("provider_name", { length: 100 }).notNull(), // Display name
  
  // Email matching criteria
  senderEmails: text("sender_emails").array().notNull(), // Array of sender emails to match (e.g., ["noreply@tokkobroker.com"])
  subjectPatterns: text("subject_patterns").array(), // Optional subject line patterns to match
  
  // Default values for imported leads
  defaultSellerId: varchar("default_seller_id").references(() => users.id, { onDelete: "set null" }),
  defaultSource: varchar("default_source", { length: 100 }).default("email_import"),
  defaultRegistrationType: leadRegistrationTypeEnum("default_registration_type").notNull().default("seller"),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncMessageId: varchar("last_sync_message_id", { length: 255 }), // Gmail message ID of last processed email
  
  // Statistics
  totalImported: integer("total_imported").notNull().default(0),
  totalDuplicates: integer("total_duplicates").notNull().default(0),
  totalErrors: integer("total_errors").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_sources_agency").on(table.agencyId),
  index("idx_email_sources_provider").on(table.provider),
  index("idx_email_sources_active").on(table.isActive),
]);

export const insertExternalLeadEmailSourceSchema = createInsertSchema(externalLeadEmailSources).omit({
  id: true,
  lastSyncAt: true,
  lastSyncMessageId: true,
  totalImported: true,
  totalDuplicates: true,
  totalErrors: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalLeadEmailSource = z.infer<typeof insertExternalLeadEmailSourceSchema>;
export type ExternalLeadEmailSource = typeof externalLeadEmailSources.$inferSelect;

// External Lead Email Import Logs - Track each email import attempt
export const externalLeadEmailImportLogs = pgTable("external_lead_email_import_logs", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sourceId: varchar("source_id").notNull().references(() => externalLeadEmailSources.id, { onDelete: "cascade" }),
  
  // Gmail message info
  gmailMessageId: varchar("gmail_message_id", { length: 255 }).notNull(),
  gmailThreadId: varchar("gmail_thread_id", { length: 255 }),
  emailSubject: varchar("email_subject", { length: 500 }),
  emailFrom: varchar("email_from", { length: 255 }),
  emailDate: timestamp("email_date"),
  
  // Import result
  status: emailImportStatusEnum("status").notNull(),
  leadId: varchar("lead_id").references(() => externalLeads.id, { onDelete: "set null" }), // Lead created if successful
  
  // Parsed data (stored for debugging)
  parsedData: jsonb("parsed_data"), // JSON with extracted lead info
  
  // Error info
  errorMessage: text("error_message"),
  
  // Duplicate detection
  duplicateOfLeadId: varchar("duplicate_of_lead_id").references(() => externalLeads.id, { onDelete: "set null" }),
  duplicateReason: varchar("duplicate_reason", { length: 255 }), // e.g., "matching_phone", "matching_email_name"
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_import_logs_agency").on(table.agencyId),
  index("idx_email_import_logs_source").on(table.sourceId),
  index("idx_email_import_logs_status").on(table.status),
  index("idx_email_import_logs_gmail_id").on(table.gmailMessageId),
  index("idx_email_import_logs_lead").on(table.leadId),
  index("idx_email_import_logs_created").on(table.createdAt),
]);

export const insertExternalLeadEmailImportLogSchema = createInsertSchema(externalLeadEmailImportLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertExternalLeadEmailImportLog = z.infer<typeof insertExternalLeadEmailImportLogSchema>;
export type ExternalLeadEmailImportLog = typeof externalLeadEmailImportLogs.$inferSelect;

// ========================================
// SELLER COMMISSION RATES SYSTEM
// ========================================

// Commission concept enum
export const sellerCommissionConceptEnum = pgEnum("seller_commission_concept", [
  "rental_no_referral",    // Renta de propiedad sin referido
  "rental_with_referral",  // Renta de propiedad con referido
  "property_recruitment",  // Reclutamiento de propiedad
  "broker_referral",       // Referir a un broker
]);

// External Seller Commission Defaults - Default commission rates per agency
export const externalSellerCommissionDefaults = pgTable("external_seller_commission_defaults", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Commission concept
  concept: sellerCommissionConceptEnum("concept").notNull(),
  
  // Rate percentage (0-100)
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  
  // Description
  descriptionEs: varchar("description_es", { length: 255 }),
  descriptionEn: varchar("description_en", { length: 255 }),
  
  // Audit
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_commission_defaults_agency").on(table.agencyId),
  unique("unique_commission_defaults_agency_concept").on(table.agencyId, table.concept),
]);

export const insertExternalSellerCommissionDefaultSchema = createInsertSchema(externalSellerCommissionDefaults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalSellerCommissionDefault = z.infer<typeof insertExternalSellerCommissionDefaultSchema>;
export type ExternalSellerCommissionDefault = typeof externalSellerCommissionDefaults.$inferSelect;

// External Seller Commission Overrides - Override rates by role or user
export const externalSellerCommissionOverrides = pgTable("external_seller_commission_overrides", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  
  // Commission concept
  concept: sellerCommissionConceptEnum("concept").notNull(),
  
  // Override type: 'role' or 'user'
  overrideType: varchar("override_type", { length: 20 }).notNull(), // 'role' or 'user'
  
  // Either role name or user ID
  roleValue: varchar("role_value", { length: 50 }), // e.g., "vendedor", "vendedor_senior"
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  
  // Rate percentage (0-100)
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  
  // Notes
  notes: text("notes"),
  
  // Audit
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_commission_overrides_agency").on(table.agencyId),
  index("idx_commission_overrides_role").on(table.roleValue),
  index("idx_commission_overrides_user").on(table.userId),
  index("idx_commission_overrides_concept").on(table.concept),
]);

export const insertExternalSellerCommissionOverrideSchema = createInsertSchema(externalSellerCommissionOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalSellerCommissionOverride = z.infer<typeof insertExternalSellerCommissionOverrideSchema>;
export type ExternalSellerCommissionOverride = typeof externalSellerCommissionOverrides.$inferSelect;

// Featured Properties - Maximum 30 featured properties with custom ordering
export const featuredProperties = pgTable("featured_properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: 'cascade' }).notNull(),
  sortOrder: integer("sort_order").notNull(),
  addedBy: varchar("added_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_featured_properties_sort_order").on(table.sortOrder),
  index("idx_featured_properties_unit_id").on(table.unitId),
]);

export const insertFeaturedPropertySchema = createInsertSchema(featuredProperties).omit({
  id: true,
  createdAt: true,
});

export type InsertFeaturedProperty = z.infer<typeof insertFeaturedPropertySchema>;
export type FeaturedProperty = typeof featuredProperties.$inferSelect;

// ==========================================
// External Unit Media - Section-based image organization
// ==========================================


// Media section labels for UI
export const mediaSectionLabels = {
  es: {
    cover: "Portada",
    bedroom: "Recámara",
    bathroom: "Baño",
    half_bath: "Medio Baño",
    kitchen: "Cocina",
    living_room: "Sala",
    dining_room: "Comedor",
    garden: "Jardín",
    terrace: "Terraza",
    pool: "Alberca",
    balcony: "Balcón",
    rooftop: "Rooftop",
    parking: "Estacionamiento",
    amenities: "Amenidades",
    common_areas: "Áreas Comunes",
    exterior: "Exterior / Fachada",
    view: "Vista",
    floor_plan: "Plano",
    other: "Otras Fotos",
  },
  en: {
    cover: "Cover",
    bedroom: "Bedroom",
    bathroom: "Bathroom",
    half_bath: "Half Bath",
    kitchen: "Kitchen",
    living_room: "Living Room",
    dining_room: "Dining Room",
    garden: "Garden",
    terrace: "Terrace",
    pool: "Pool",
    balcony: "Balcony",
    rooftop: "Rooftop",
    parking: "Parking",
    amenities: "Amenities",
    common_areas: "Common Areas",
    exterior: "Exterior / Facade",
    view: "View",
    floor_plan: "Floor Plan",
    other: "Other Photos",
  },
} as const;

// ============================================
// SELLER SOCIAL MEDIA MARKETING SYSTEM
// ============================================

// Social Media Platform Types
export const socialMediaPlatformEnum = pgEnum("social_media_platform", [
  "facebook",
  "instagram", 
  "whatsapp",
]);

// Social Media Template Category
export const socialMediaTemplateCategoryEnum = pgEnum("social_media_template_category", [
  "new_listing",      // Nueva propiedad
  "price_update",     // Actualización de precio
  "open_house",       // Casa abierta
  "featured",         // Destacada
  "promotion",        // Promoción
  "general",          // General
]);

// Seller Social Media Templates - Plantillas para publicaciones en redes sociales
export const sellerSocialMediaTemplates = pgTable("seller_social_media_templates", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").references(() => users.id, { onDelete: "cascade" }), // null = shared template for agency
  
  title: varchar("title", { length: 150 }).notNull(),
  platform: socialMediaPlatformEnum("platform").notNull(),
  category: socialMediaTemplateCategoryEnum("category").notNull().default("general"),
  
  content: text("content").notNull(), // Template content with variables like {{property.name}}, {{property.price}}
  hashtags: text("hashtags"), // Suggested hashtags for the post
  
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  
  usageCount: integer("usage_count").notNull().default(0), // Track how many times template was used
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_social_templates_agency").on(table.agencyId),
  index("idx_social_templates_seller").on(table.sellerId),
  index("idx_social_templates_platform").on(table.platform),
  index("idx_social_templates_category").on(table.category),
]);

export const insertSellerSocialMediaTemplateSchema = createInsertSchema(sellerSocialMediaTemplates).omit({
  id: true, createdAt: true, updatedAt: true, usageCount: true,
});
export type InsertSellerSocialMediaTemplate = z.infer<typeof insertSellerSocialMediaTemplateSchema>;
export type SellerSocialMediaTemplate = typeof sellerSocialMediaTemplates.$inferSelect;

// Seller Social Media Reminders - Recordatorios para re-publicar en redes sociales
export const sellerSocialMediaReminders = pgTable("seller_social_media_reminders", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  agencyId: varchar("agency_id").notNull().references(() => externalAgencies.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  unitId: varchar("unit_id").references(() => externalUnits.id, { onDelete: "cascade" }),
  
  platform: socialMediaPlatformEnum("platform").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  notes: text("notes"),
  
  scheduledAt: timestamp("scheduled_at").notNull(), // When to remind
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_social_reminders_agency").on(table.agencyId),
  index("idx_social_reminders_seller").on(table.sellerId),
  index("idx_social_reminders_unit").on(table.unitId),
  index("idx_social_reminders_scheduled").on(table.scheduledAt),
  index("idx_social_reminders_completed").on(table.isCompleted),
]);

export const insertSellerSocialMediaReminderSchema = createInsertSchema(sellerSocialMediaReminders).omit({
  id: true, createdAt: true, updatedAt: true, completedAt: true,
});
export type InsertSellerSocialMediaReminder = z.infer<typeof insertSellerSocialMediaReminderSchema>;
export type SellerSocialMediaReminder = typeof sellerSocialMediaReminders.$inferSelect;
