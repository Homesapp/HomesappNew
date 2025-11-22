CREATE TYPE "public"."accountant_assignment_type" AS ENUM('property', 'user', 'all');--> statement-breakpoint
CREATE TYPE "public"."agreement_signature_status" AS ENUM('pending', 'signed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."agreement_template_type" AS ENUM('terms_and_conditions', 'rent_authorization', 'sale_authorization');--> statement-breakpoint
CREATE TYPE "public"."alert_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."alert_status" AS ENUM('pending', 'acknowledged', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."amenity_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."amenity_category" AS ENUM('property', 'condo');--> statement-breakpoint
CREATE TYPE "public"."appointment_mode" AS ENUM('individual', 'tour');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."appointment_type" AS ENUM('in-person', 'video');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'view', 'assign');--> statement-breakpoint
CREATE TYPE "public"."budget_status" AS ENUM('pending', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."calendar_event_type" AS ENUM('appointment', 'maintenance', 'cleaning', 'inspection', 'administrative', 'meeting');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('email', 'push', 'social');--> statement-breakpoint
CREATE TYPE "public"."change_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."changelog_category" AS ENUM('feature', 'enhancement', 'bugfix', 'security', 'performance', 'ui', 'database');--> statement-breakpoint
CREATE TYPE "public"."charge_type" AS ENUM('fixed', 'variable');--> statement-breakpoint
CREATE TYPE "public"."chat_type" AS ENUM('appointment', 'rental', 'internal', 'support');--> statement-breakpoint
CREATE TYPE "public"."client_document_type" AS ENUM('passport', 'id_card', 'drivers_license', 'visa', 'other');--> statement-breakpoint
CREATE TYPE "public"."client_incident_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."client_incident_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."client_referral_status" AS ENUM('pendiente_confirmacion', 'confirmado', 'en_revision', 'seleccion_propiedad', 'proceso_renta', 'lead_cancelado', 'completado');--> statement-breakpoint
CREATE TYPE "public"."commission_advance_status" AS ENUM('pending', 'approved', 'rejected', 'paid');--> statement-breakpoint
CREATE TYPE "public"."condominium_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."condominium_fee_status" AS ENUM('pendiente', 'pagado', 'vencido', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."condominium_issue_status" AS ENUM('pendiente', 'en_proceso', 'resuelto', 'cerrado');--> statement-breakpoint
CREATE TYPE "public"."document_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('passport', 'ine');--> statement-breakpoint
CREATE TYPE "public"."electricity_payment" AS ENUM('monthly', 'bimonthly');--> statement-breakpoint
CREATE TYPE "public"."electricity_service" AS ENUM('cfe', 'solar');--> statement-breakpoint
CREATE TYPE "public"."error_log_status" AS ENUM('new', 'investigating', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."error_log_type" AS ENUM('frontend_error', 'api_error', 'console_error', 'unhandled_rejection');--> statement-breakpoint
CREATE TYPE "public"."external_contract_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."external_payment_status" AS ENUM('pending', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."external_property_status" AS ENUM('active', 'inactive', 'rented', 'linked');--> statement-breakpoint
CREATE TYPE "public"."external_ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."external_ticket_status" AS ENUM('open', 'in_progress', 'resolved', 'closed', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('nuevo', 'en_revision', 'resuelto', 'rechazado');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'mejora');--> statement-breakpoint
CREATE TYPE "public"."financial_transaction_category" AS ENUM('rent_income', 'rent_payout', 'hoa_fee', 'maintenance_charge', 'service_electricity', 'service_water', 'service_internet', 'service_gas', 'service_other', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."financial_transaction_direction" AS ENUM('inflow', 'outflow');--> statement-breakpoint
CREATE TYPE "public"."financial_transaction_role" AS ENUM('tenant', 'owner', 'agency');--> statement-breakpoint
CREATE TYPE "public"."financial_transaction_status" AS ENUM('pending', 'posted', 'reconciled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."health_score_status" AS ENUM('excellent', 'good', 'fair', 'poor', 'critical');--> statement-breakpoint
CREATE TYPE "public"."hoa_announcement_priority" AS ENUM('baja', 'media', 'alta', 'urgente');--> statement-breakpoint
CREATE TYPE "public"."hoa_manager_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."income_category" AS ENUM('referral_client', 'referral_owner', 'rental_commission', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_journey_action" AS ENUM('search', 'view_layer1', 'view_layer2', 'view_layer3', 'favorite', 'unfavorite', 'request_opportunity', 'schedule_visit', 'complete_visit', 'submit_offer', 'counter_offer', 'accept_offer', 'reject_offer');--> statement-breakpoint
CREATE TYPE "public"."lead_quality" AS ENUM('hot', 'warm', 'cold');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('nuevo', 'contactado', 'calificado', 'cita_agendada', 'visita_completada', 'oferta_enviada', 'en_negociacion', 'contrato_firmado', 'ganado', 'perdido');--> statement-breakpoint
CREATE TYPE "public"."legal_document_status" AS ENUM('draft', 'pending_review', 'approved', 'signed', 'active', 'expired');--> statement-breakpoint
CREATE TYPE "public"."legal_document_type" AS ENUM('rental_contract', 'sale_contract', 'service_agreement', 'lease_renewal', 'termination_notice');--> statement-breakpoint
CREATE TYPE "public"."maintenance_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual');--> statement-breakpoint
CREATE TYPE "public"."maintenance_photo_phase" AS ENUM('before', 'during', 'after', 'other');--> statement-breakpoint
CREATE TYPE "public"."maintenance_specialty" AS ENUM('encargado_mantenimiento', 'mantenimiento_general', 'electrico', 'plomero', 'refrigeracion', 'carpintero', 'pintor', 'jardinero', 'albanil', 'limpieza');--> statement-breakpoint
CREATE TYPE "public"."maintenance_update_type" AS ENUM('comment', 'status_change', 'assignment', 'cost_update', 'schedule_change', 'completion');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('appointment', 'offer', 'message', 'property_update', 'system', 'rental_update', 'opportunity', 'role_approved', 'role_rejected', 'hoa_announcement', 'contract_update', 'payment_reminder');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('pending', 'accepted', 'rejected', 'countered', 'under-review');--> statement-breakpoint
CREATE TYPE "public"."opportunity_request_status" AS ENUM('pending', 'scheduled_visit', 'visit_completed', 'offer_submitted', 'offer_negotiation', 'offer_accepted', 'accepted', 'rejected', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."owner_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."owner_property_status" AS ENUM('active', 'suspended', 'rented');--> statement-breakpoint
CREATE TYPE "public"."owner_referral_status" AS ENUM('pendiente_confirmacion', 'confirmado', 'en_revision', 'propiedad_enlistada', 'pendiente_aprobacion_admin', 'aprobado', 'rechazado', 'pagado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."payment_frequency" AS ENUM('monthly', 'bimonthly');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank', 'zelle', 'wise');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('draft', 'pending', 'approved', 'paid', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."predictive_analytic_type" AS ENUM('rental_probability', 'price_recommendation', 'market_trend', 'churn_risk');--> statement-breakpoint
CREATE TYPE "public"."property_approval_status" AS ENUM('draft', 'pending_review', 'inspection_scheduled', 'inspection_completed', 'approved', 'published', 'changes_requested', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."property_document_category" AS ENUM('persona_fisica', 'persona_moral', 'optional');--> statement-breakpoint
CREATE TYPE "public"."property_document_type" AS ENUM('ife_ine_frente', 'ife_ine_reverso', 'pasaporte', 'legal_estancia', 'escrituras', 'contrato_compraventa', 'fideicomiso', 'recibo_agua', 'recibo_luz', 'recibo_internet', 'reglas_internas', 'reglamento_condominio', 'comprobante_no_adeudo', 'acta_constitutiva', 'poder_notarial', 'identificacion_representante');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('rent', 'sale', 'both');--> statement-breakpoint
CREATE TYPE "public"."property_submission_status" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."provider_application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."rental_application_status" AS ENUM('solicitud_enviada', 'revision_documentos', 'verificacion_credito', 'aprobado', 'contrato_enviado', 'contrato_firmado', 'pago_deposito', 'activo', 'rechazado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."rental_contract_status" AS ENUM('draft', 'apartado', 'firmado', 'check_in', 'activo', 'completado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."rental_note_severity" AS ENUM('info', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."rental_note_type" AS ENUM('general', 'incident', 'reminder', 'inspection', 'complaint', 'maintenance', 'violation');--> statement-breakpoint
CREATE TYPE "public"."rental_payment_status" AS ENUM('pending', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."rental_purpose" AS ENUM('living', 'sublease');--> statement-breakpoint
CREATE TYPE "public"."reschedule_status" AS ENUM('none', 'requested', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."review_rating" AS ENUM('1', '2', '3', '4', '5');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."role_request_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."screening_status" AS ENUM('pending', 'in_progress', 'completed', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."service_booking_status" AS ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('rent', 'electricity', 'water', 'internet', 'gas', 'maintenance', 'hoa', 'special', 'other');--> statement-breakpoint
CREATE TYPE "public"."suspension_type" AS ENUM('temporary', 'permanent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in-progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."tenant_maintenance_request_status" AS ENUM('requested', 'owner_notified', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."tenant_maintenance_type" AS ENUM('plumbing', 'electrical', 'appliances', 'hvac', 'general', 'emergency', 'other');--> statement-breakpoint
CREATE TYPE "public"."unit_floor_type" AS ENUM('planta_baja', 'primer_piso', 'segundo_piso', 'tercer_piso', 'penthouse');--> statement-breakpoint
CREATE TYPE "public"."unit_type" AS ENUM('departamento', 'casa', 'estudio');--> statement-breakpoint
CREATE TYPE "public"."unit_typology" AS ENUM('estudio', 'estudio_plus', '1_recamara', '2_recamaras', '3_recamaras', 'loft_mini', 'loft_normal', 'loft_plus');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('master', 'admin', 'admin_jr', 'cliente', 'seller', 'owner', 'management', 'concierge', 'provider', 'abogado', 'contador', 'agente_servicios_especiales', 'hoa_manager', 'external_agency_admin', 'external_agency_accounting', 'external_agency_maintenance', 'external_agency_staff');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'approved', 'rejected', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."visit_type" AS ENUM('visita_cliente', 'visita_mantenimiento', 'visita_limpieza', 'visita_reconocimiento', 'material_multimedia', 'visita_inspeccion', 'otra');--> statement-breakpoint
CREATE TYPE "public"."water_service" AS ENUM('capa', 'well');--> statement-breakpoint
CREATE TYPE "public"."wizard_mode" AS ENUM('simple', 'extended');--> statement-breakpoint
CREATE TYPE "public"."workflow_event_type" AS ENUM('lead_created', 'lead_assigned', 'appointment_scheduled', 'appointment_completed', 'offer_submitted', 'offer_accepted', 'contract_signed', 'check_in_completed', 'rental_started', 'payment_overdue', 'contract_expiring', 'task_assigned', 'task_overdue');--> statement-breakpoint
CREATE TABLE "accountant_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"accountant_id" varchar NOT NULL,
	"assignment_type" "accountant_assignment_type" NOT NULL,
	"property_id" varchar,
	"user_id" varchar,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"notes" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" text,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"onboarding_steps" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "agreement_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "agreement_template_type" NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"allowed_variables" text[] DEFAULT ARRAY[]::text[],
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agreement_templates_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "amenity_category" NOT NULL,
	"approval_status" "amenity_approval_status" DEFAULT 'approved' NOT NULL,
	"requested_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "amenities_name_category_unique" UNIQUE("name","category")
);
--> statement-breakpoint
CREATE TABLE "appointment_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"rating" "review_rating" NOT NULL,
	"comment" text,
	"experience_rating" "review_rating",
	"punctuality_rating" "review_rating",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar,
	"client_id" varchar,
	"concierge_id" varchar,
	"presentation_card_id" varchar,
	"opportunity_request_id" varchar,
	"lead_id" varchar,
	"lead_email" varchar,
	"lead_phone" varchar,
	"lead_name" text,
	"condominium_name" text,
	"unit_number" text,
	"date" timestamp NOT NULL,
	"type" "appointment_type" NOT NULL,
	"mode" "appointment_mode" DEFAULT 'individual' NOT NULL,
	"tour_group_id" varchar,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"owner_approval_status" "owner_approval_status" DEFAULT 'pending' NOT NULL,
	"owner_approved_at" timestamp,
	"meet_link" text,
	"google_event_id" text,
	"notes" text,
	"concierge_report" text,
	"access_issues" text,
	"visit_type" "visit_type" DEFAULT 'visita_cliente' NOT NULL,
	"staff_member_id" varchar,
	"staff_member_name" text,
	"staff_member_position" text,
	"staff_member_company" text,
	"staff_member_whatsapp" varchar,
	"access_credentials_sent" boolean DEFAULT false,
	"access_type" varchar,
	"access_code" text,
	"access_instructions" text,
	"concierge_assigned_by" varchar,
	"concierge_assigned_at" timestamp,
	"client_feedback" jsonb,
	"staff_feedback" text,
	"reschedule_status" "reschedule_status" DEFAULT 'none' NOT NULL,
	"reschedule_requested_date" timestamp,
	"reschedule_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"action" "audit_action" NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"details" jsonb,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_suggestions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"presentation_card_id" varchar NOT NULL,
	"match_score" integer,
	"match_reasons" text[] DEFAULT ARRAY[]::text[],
	"is_read" boolean DEFAULT false NOT NULL,
	"is_interested" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"estimated_cost" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"status" "budget_status" DEFAULT 'pending' NOT NULL,
	"attachments" text[] DEFAULT ARRAY[]::text[],
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_hours" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_of_week" integer NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"open_time" varchar DEFAULT '10:00' NOT NULL,
	"close_time" varchar DEFAULT '18:00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"event_type" "calendar_event_type" NOT NULL,
	"status" "calendar_event_status" DEFAULT 'scheduled' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"property_id" varchar,
	"assigned_to_id" varchar,
	"appointment_id" varchar,
	"client_id" varchar,
	"google_event_id" text,
	"notes" text,
	"color" varchar(7) DEFAULT '#3b82f6',
	"created_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "changelogs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" varchar,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" "changelog_category" NOT NULL,
	"implemented_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "chat_type" NOT NULL,
	"title" text NOT NULL,
	"property_id" varchar,
	"rental_application_id" varchar,
	"rental_contract_id" varchar,
	"legal_document_id" varchar,
	"appointment_id" varchar,
	"created_by_id" varchar NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"closed_at" timestamp,
	"archived_at" timestamp,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"message" text NOT NULL,
	"attachments" text[] DEFAULT ARRAY[]::text[],
	"is_bot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"last_read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_participants_conversation_id_user_id_unique" UNIQUE("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "chatbot_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar DEFAULT 'MARCO' NOT NULL,
	"system_prompt" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"welcome_message" text NOT NULL,
	"conversational_mode" boolean DEFAULT true NOT NULL,
	"can_suggest_presentation_cards" boolean DEFAULT true NOT NULL,
	"can_schedule_appointments" boolean DEFAULT true NOT NULL,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_in_appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_contract_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"duration" integer DEFAULT 120 NOT NULL,
	"location" text NOT NULL,
	"assigned_admin_id" varchar,
	"status" varchar DEFAULT 'scheduled' NOT NULL,
	"completed_at" timestamp,
	"cancellation_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_referrals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" varchar NOT NULL,
	"assigned_to" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"email" varchar NOT NULL,
	"status" "client_referral_status" DEFAULT 'pendiente_confirmacion' NOT NULL,
	"commission_percent" numeric(5, 2) NOT NULL,
	"commission_amount" numeric(12, 2),
	"commission_paid" boolean DEFAULT false NOT NULL,
	"commission_paid_at" timestamp,
	"notes" text,
	"admin_notes" text,
	"linked_lead_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"concierge_id" varchar NOT NULL,
	"appointment_id" varchar,
	"rating" "review_rating" NOT NULL,
	"punctuality_rating" "review_rating",
	"attitude_rating" "review_rating",
	"seriousness_rating" "review_rating",
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "colonies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"approval_status" "condominium_approval_status" DEFAULT 'approved' NOT NULL,
	"requested_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "colonies_name_unique" UNIQUE("name"),
	CONSTRAINT "colonies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "commission_advances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"status" "commission_advance_status" DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concierge_blocked_slots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"concierge_id" varchar NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "concierge_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"concierge_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"appointment_id" varchar,
	"rating" "review_rating" NOT NULL,
	"professionalism_rating" "review_rating",
	"knowledge_rating" "review_rating",
	"communication_rating" "review_rating",
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "condominium_fee_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condominium_fee_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"paid_at" timestamp NOT NULL,
	"receipt_url" text,
	"notes" text,
	"registered_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "condominium_fees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condominium_unit_id" varchar NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" "condominium_fee_status" DEFAULT 'pendiente' NOT NULL,
	"description" text,
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "condominium_fees_condominium_unit_id_month_year_unique" UNIQUE("condominium_unit_id","month","year")
);
--> statement-breakpoint
CREATE TABLE "condominium_issues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condominium_id" varchar NOT NULL,
	"condominium_unit_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"priority" text DEFAULT 'media' NOT NULL,
	"status" "condominium_issue_status" DEFAULT 'pendiente' NOT NULL,
	"photos" jsonb,
	"reported_by_id" varchar NOT NULL,
	"assigned_to_id" varchar,
	"resolved_at" timestamp,
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "condominium_units" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condominium_id" varchar NOT NULL,
	"unit_number" text NOT NULL,
	"owner_id" varchar,
	"area" numeric(10, 2),
	"bedrooms" integer,
	"bathrooms" integer,
	"parking_spaces" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "condominium_units_condominium_id_unit_number_unique" UNIQUE("condominium_id","unit_number")
);
--> statement-breakpoint
CREATE TABLE "condominiums" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"colony_id" varchar,
	"zone" text,
	"address" text,
	"active" boolean DEFAULT true NOT NULL,
	"approval_status" "condominium_approval_status" DEFAULT 'approved' NOT NULL,
	"requested_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "condominiums_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "contract_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_document_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"user_role" varchar NOT NULL,
	"approved" boolean NOT NULL,
	"digital_signature" text,
	"comments" text,
	"ip_address" varchar,
	"approved_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_approval_per_user_doc" UNIQUE("legal_document_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "contract_checklist_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"template_item_id" varchar,
	"title" varchar NOT NULL,
	"description" text,
	"required_role" "user_role",
	"order" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_by" varchar,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_checklist_template_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"required_role" "user_role",
	"order" integer NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_checklist_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"contract_type" varchar NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_cycle_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"offer_submitted_at" timestamp,
	"contract_created_at" timestamp,
	"owner_signed_at" timestamp,
	"tenant_signed_at" timestamp,
	"check_in_at" timestamp,
	"offer_to_contract_minutes" integer,
	"contract_to_signatures_minutes" integer,
	"signatures_to_check_in_minutes" integer,
	"total_cycle_minutes" integer,
	"sla_target_minutes" integer,
	"met_sla" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_legal_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_contract_id" varchar NOT NULL,
	"uploaded_by_id" varchar NOT NULL,
	"document_url" text NOT NULL,
	"document_name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"status" varchar DEFAULT 'pending_review' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_owner_info" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_contract_id" varchar NOT NULL,
	"full_name" text NOT NULL,
	"nationality" varchar,
	"phone" varchar,
	"whatsapp" varchar,
	"email" text,
	"sublease_allowed" boolean DEFAULT false,
	"property_address" text,
	"subdivision" varchar,
	"unit_number" varchar,
	"agreed_rent" numeric(12, 2),
	"agreed_deposit" numeric(12, 2),
	"check_in_date" timestamp,
	"contract_duration" varchar,
	"included_services" text[],
	"excluded_services" text[],
	"pets_accepted" boolean DEFAULT false,
	"special_notes" text,
	"bank_name" varchar,
	"clabe" varchar,
	"account_number" varchar,
	"account_holder_name" text,
	"swift_code" varchar,
	"bank_address" text,
	"bank_email" text,
	"id_document_url" text,
	"property_documents_url" text[],
	"service_receipts_url" text[],
	"no_debt_proof_url" text[],
	"services_format_url" text,
	"rules_regulations_url" text,
	"digital_signature" text,
	"accepted_terms" boolean DEFAULT false,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_signed_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_contract_id" varchar NOT NULL,
	"check_in_appointment_id" varchar,
	"uploaded_by_id" varchar NOT NULL,
	"document_url" text NOT NULL,
	"document_name" text NOT NULL,
	"document_type" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_tenant_info" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_contract_id" varchar NOT NULL,
	"full_name" text NOT NULL,
	"address" text,
	"nationality" varchar,
	"age" integer,
	"time_in_tulum" varchar,
	"occupation" text,
	"company" text,
	"workplace_address" text,
	"monthly_income" numeric(12, 2),
	"company_tenure" varchar,
	"marital_status" varchar,
	"whatsapp_number" varchar,
	"cell_number" varchar,
	"email" text,
	"id_type" varchar,
	"id_number" varchar,
	"check_in_date" timestamp,
	"number_of_tenants" integer,
	"payment_method" varchar,
	"has_pets" boolean DEFAULT false,
	"pet_description" text,
	"property_to_rent" text,
	"condominium_and_unit" text,
	"guarantor_name" text,
	"guarantor_address" text,
	"guarantor_birth_info" text,
	"guarantor_nationality" varchar,
	"guarantor_age" integer,
	"guarantor_time_in_tulum" varchar,
	"guarantor_occupation" text,
	"guarantor_company" text,
	"guarantor_work_address" text,
	"guarantor_work_phone" varchar,
	"guarantor_marital_status" varchar,
	"guarantor_landline" varchar,
	"guarantor_cell" varchar,
	"guarantor_email" text,
	"guarantor_id_number" varchar,
	"previous_landlord_name" text,
	"previous_landlord_cell" varchar,
	"previous_landlord_address" text,
	"previous_tenancy_duration" varchar,
	"direct_boss_name" text,
	"company_name_address" text,
	"company_landline" varchar,
	"company_manager_cell" varchar,
	"reference1_name" text,
	"reference1_address" text,
	"reference1_landline" varchar,
	"reference1_cell" varchar,
	"reference2_name" text,
	"reference2_address" text,
	"reference2_landline" varchar,
	"reference2_cell" varchar,
	"id_document_url" text,
	"proof_of_address_url" text,
	"solvency_documents_url" text[],
	"guarantor_id_url" text,
	"guarantor_proof_address_url" text,
	"guarantor_solvency_url" text[],
	"digital_signature" text,
	"accepted_terms" boolean DEFAULT false,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_term_discussions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_document_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"user_role" varchar NOT NULL,
	"term_section" varchar,
	"comment" text NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"resolved_by_id" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"code" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"user_email" varchar,
	"user_role" varchar,
	"error_type" "error_log_type" NOT NULL,
	"error_message" text NOT NULL,
	"error_stack" text,
	"error_code" varchar,
	"url" varchar,
	"user_agent" text,
	"component_stack" text,
	"additional_info" jsonb,
	"status" "error_log_status" DEFAULT 'new' NOT NULL,
	"reported_by_user" boolean DEFAULT false NOT NULL,
	"user_comment" text,
	"assigned_to" varchar,
	"resolution_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_agencies" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"agency_logo_url" text,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"assigned_to_user" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_checkout_reports" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"contract_id" varchar NOT NULL,
	"checkout_date" timestamp NOT NULL,
	"inspector" varchar(255),
	"inspector_signature_url" text,
	"tenant_signature_url" text,
	"inventory_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"maintenance_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cleaning_checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deductions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_deductions" numeric(10, 2) DEFAULT '0' NOT NULL,
	"deposit_refund_amount" numeric(10, 2),
	"photos_urls" text[] DEFAULT ARRAY[]::text[],
	"report_pdf_url" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_by" varchar,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_client_documents" (
	"id" varchar PRIMARY KEY NOT NULL,
	"client_id" varchar NOT NULL,
	"document_type" "client_document_type" NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"storage_key" text NOT NULL,
	"notes" text,
	"uploaded_by" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_client_incidents" (
	"id" varchar PRIMARY KEY NOT NULL,
	"client_id" varchar NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"severity" "client_incident_severity" DEFAULT 'low' NOT NULL,
	"status" "client_incident_status" DEFAULT 'open' NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	"resolution" text,
	"reported_by" varchar NOT NULL,
	"assigned_to" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_clients" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone_country_code" varchar(10) DEFAULT '+52',
	"phone" varchar(50),
	"alternate_phone" varchar(50),
	"date_of_birth" date,
	"nationality" varchar(100),
	"id_type" varchar(50),
	"id_number" varchar(100),
	"id_country" varchar(100),
	"id_expiration_date" date,
	"address" varchar(500),
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100),
	"emergency_contact_name" varchar(200),
	"emergency_contact_phone" varchar(50),
	"emergency_contact_relation" varchar(100),
	"preferred_language" varchar(10) DEFAULT 'es',
	"property_type_preference" varchar(100),
	"budget_min" numeric(10, 2),
	"budget_max" numeric(10, 2),
	"bedrooms_preference" integer,
	"bathrooms_preference" integer,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"source" varchar(100),
	"notes" text,
	"tags" text[] DEFAULT ARRAY[]::text[],
	"first_contact_date" timestamp,
	"last_contact_date" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_condominiums" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(500),
	"description" text,
	"total_units" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_financial_transactions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"direction" "financial_transaction_direction" NOT NULL,
	"category" "financial_transaction_category" NOT NULL,
	"status" "financial_transaction_status" DEFAULT 'pending' NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"fees" numeric(12, 2) DEFAULT '0.00',
	"net_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'MXN' NOT NULL,
	"due_date" timestamp NOT NULL,
	"performed_date" timestamp,
	"reconciled_date" timestamp,
	"payer_role" "financial_transaction_role" NOT NULL,
	"payee_role" "financial_transaction_role" NOT NULL,
	"owner_id" varchar,
	"tenant_name" varchar(255),
	"contract_id" varchar,
	"unit_id" varchar,
	"payment_id" varchar,
	"maintenance_ticket_id" varchar,
	"schedule_id" varchar,
	"payment_method" varchar(100),
	"payment_reference" varchar(255),
	"payment_proof_url" text,
	"description" text NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_maintenance_photos" (
	"id" varchar PRIMARY KEY NOT NULL,
	"ticket_id" varchar NOT NULL,
	"update_id" varchar,
	"phase" "maintenance_photo_phase" DEFAULT 'other' NOT NULL,
	"storage_key" text NOT NULL,
	"caption" text,
	"uploaded_by" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_maintenance_tickets" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"unit_id" varchar NOT NULL,
	"contract_id" varchar,
	"property_id" varchar,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" "tenant_maintenance_type" NOT NULL,
	"priority" "external_ticket_priority" DEFAULT 'medium' NOT NULL,
	"status" "external_ticket_status" DEFAULT 'open' NOT NULL,
	"reported_by" varchar(255),
	"assigned_to" varchar,
	"estimated_cost" numeric(10, 2),
	"actual_cost" numeric(10, 2),
	"scheduled_date" timestamp,
	"scheduled_window_start" timestamp,
	"scheduled_window_end" timestamp,
	"resolved_date" timestamp,
	"completion_notes" text,
	"closed_by" varchar,
	"closed_at" timestamp,
	"photos" text[] DEFAULT ARRAY[]::text[],
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_maintenance_updates" (
	"id" varchar PRIMARY KEY NOT NULL,
	"ticket_id" varchar NOT NULL,
	"type" "maintenance_update_type" NOT NULL,
	"notes" text NOT NULL,
	"status_snapshot" "external_ticket_status",
	"priority_snapshot" "external_ticket_priority",
	"assigned_to_snapshot" varchar,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_notifications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"type" "notification_type" NOT NULL,
	"priority" "notification_priority" DEFAULT 'medium' NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"recipient_user_id" varchar,
	"recipient_email" varchar(255),
	"recipient_phone" varchar(50),
	"contract_id" varchar,
	"payment_id" varchar,
	"ticket_id" varchar,
	"unit_id" varchar,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp,
	"sms_sent" boolean DEFAULT false NOT NULL,
	"sms_sent_at" timestamp,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"scheduled_for" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_owner_charges" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"unit_id" varchar NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'MXN' NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"paid_date" timestamp,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_owner_notifications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"condominium_id" varchar,
	"unit_id" varchar,
	"owner_id" varchar,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_payment_schedules" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"contract_id" varchar NOT NULL,
	"service_type" "service_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'MXN' NOT NULL,
	"day_of_month" integer NOT NULL,
	"payment_frequency" "payment_frequency" DEFAULT 'monthly' NOT NULL,
	"charge_type" charge_type DEFAULT 'fixed' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"send_reminder_days_before" integer DEFAULT 3,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_payments" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"contract_id" varchar NOT NULL,
	"schedule_id" varchar,
	"service_type" "service_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'MXN' NOT NULL,
	"due_date" timestamp NOT NULL,
	"paid_date" timestamp,
	"status" "external_payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(100),
	"payment_reference" varchar(255),
	"payment_proof_url" text,
	"reminder_sent_at" timestamp,
	"notes" text,
	"paid_by" varchar,
	"confirmed_by" varchar,
	"confirmed_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_properties" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"linked_property_id" varchar,
	"name" varchar(255) NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100) DEFAULT 'México',
	"postal_code" varchar(20),
	"property_type" varchar(50),
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"area" numeric(10, 2),
	"status" "external_property_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_rental_contracts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"unit_id" varchar NOT NULL,
	"property_id" varchar,
	"client_id" varchar,
	"tenant_name" varchar(255) NOT NULL,
	"tenant_email" varchar(255),
	"tenant_phone" varchar(50),
	"monthly_rent" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'MXN' NOT NULL,
	"security_deposit" numeric(10, 2),
	"rental_purpose" "rental_purpose" DEFAULT 'living' NOT NULL,
	"lease_duration_months" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" "external_contract_status" DEFAULT 'active' NOT NULL,
	"has_pet" boolean DEFAULT false NOT NULL,
	"pet_name" varchar(100),
	"pet_photo_url" text,
	"pet_description" text,
	"lease_contract_url" text,
	"inventory_url" text,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_rental_notes" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"contract_id" varchar NOT NULL,
	"note_type" "rental_note_type" DEFAULT 'general' NOT NULL,
	"severity" "rental_note_severity" DEFAULT 'info',
	"content" text NOT NULL,
	"attachments" jsonb,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_rental_tenants" (
	"id" varchar PRIMARY KEY NOT NULL,
	"contract_id" varchar NOT NULL,
	"client_id" varchar,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"id_photo_url" text,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_unit_access_controls" (
	"id" varchar PRIMARY KEY NOT NULL,
	"unit_id" varchar NOT NULL,
	"access_type" varchar(100) NOT NULL,
	"access_code" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"can_share_with_maintenance" boolean DEFAULT false NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_unit_owners" (
	"id" varchar PRIMARY KEY NOT NULL,
	"unit_id" varchar NOT NULL,
	"owner_name" varchar(255) NOT NULL,
	"owner_email" varchar(255),
	"owner_phone" varchar(50),
	"ownership_percentage" numeric(5, 2) DEFAULT '100.00',
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_units" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"condominium_id" varchar,
	"unit_number" varchar(50) NOT NULL,
	"property_type" varchar(50),
	"typology" "unit_typology",
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"area" numeric(10, 2),
	"floor" "unit_floor_type",
	"airbnb_photos_link" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_unit_number_per_condominium" UNIQUE("condominium_id","unit_number")
);
--> statement-breakpoint
CREATE TABLE "external_worker_assignments" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"condominium_id" varchar,
	"unit_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_property_id_unique" UNIQUE("user_id","property_id")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "feedback_type" NOT NULL,
	"status" "feedback_status" DEFAULT 'nuevo' NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hoa_announcement_reads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hoa_announcement_reads_announcement_id_owner_id_unique" UNIQUE("announcement_id","owner_id")
);
--> statement-breakpoint
CREATE TABLE "hoa_announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condominium_id" varchar NOT NULL,
	"manager_id" varchar NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"priority" "hoa_announcement_priority" DEFAULT 'media' NOT NULL,
	"category" text,
	"attachments" jsonb,
	"target_all_units" boolean DEFAULT true NOT NULL,
	"target_unit_ids" text[],
	"published_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hoa_manager_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manager_id" varchar NOT NULL,
	"condominium_id" varchar NOT NULL,
	"status" "hoa_manager_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_by_id" varchar,
	"approved_at" timestamp,
	"approval_reason" text,
	"rejected_by_id" varchar,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"suspended_by_id" varchar,
	"suspended_at" timestamp,
	"suspension_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hoa_manager_assignments_manager_id_condominium_id_unique" UNIQUE("manager_id","condominium_id")
);
--> statement-breakpoint
CREATE TABLE "income_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "income_category" NOT NULL,
	"beneficiary_id" varchar NOT NULL,
	"property_id" varchar,
	"source_referral_client_id" varchar,
	"source_referral_owner_id" varchar,
	"source_offer_id" varchar,
	"amount" numeric(12, 2) NOT NULL,
	"commission_percent" numeric(5, 2),
	"description" text NOT NULL,
	"notes" text,
	"payout_batch_id" varchar,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"scheduled_payment_date" timestamp,
	"actual_payment_date" timestamp,
	"created_by" varchar NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"inspector_id" varchar NOT NULL,
	"inspection_date" timestamp NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"overall_condition" varchar,
	"observations" text,
	"images" text[] DEFAULT ARRAY[]::text[],
	"approved" boolean,
	"approval_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"field" varchar,
	"old_value" text,
	"new_value" text,
	"user_id" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_journeys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"property_id" varchar,
	"action" "lead_journey_action" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_property_offers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"offered_by_id" varchar NOT NULL,
	"message" text,
	"is_interested" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_response_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"assigned_to" varchar,
	"first_response_at" timestamp,
	"response_time_minutes" integer,
	"sla_target_minutes" integer,
	"met_sla" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"quality" "lead_quality" NOT NULL,
	"reasons" text[] DEFAULT ARRAY[]::text[],
	"last_calculated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_scoring_rules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"criteria_field" varchar NOT NULL,
	"criteria_operator" varchar NOT NULL,
	"criteria_value" text NOT NULL,
	"score_points" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar NOT NULL,
	"status" "lead_status" DEFAULT 'nuevo' NOT NULL,
	"source" text[] DEFAULT ARRAY[]::text[],
	"registered_by_id" varchar NOT NULL,
	"assigned_to_id" varchar,
	"user_id" varchar,
	"budget" numeric(12, 2) NOT NULL,
	"notes" text,
	"property_interests" text[] DEFAULT ARRAY[]::text[],
	"contract_duration" text[] DEFAULT ARRAY[]::text[],
	"move_in_date" text[] DEFAULT ARRAY[]::text[],
	"pets" varchar,
	"bedrooms" text[] DEFAULT ARRAY[]::text[],
	"zone_of_interest" text[] DEFAULT ARRAY[]::text[],
	"unit_type" text[] DEFAULT ARRAY[]::text[],
	"email_verified" boolean DEFAULT false NOT NULL,
	"valid_until" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "legal_document_type" NOT NULL,
	"property_id" varchar,
	"parties" jsonb NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"status" "legal_document_status" DEFAULT 'draft' NOT NULL,
	"generated_by" varchar NOT NULL,
	"reviewed_by" varchar,
	"signed_by" jsonb,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"frequency" "maintenance_frequency" NOT NULL,
	"last_completed" timestamp,
	"next_due" timestamp NOT NULL,
	"estimated_cost" numeric(10, 2),
	"assigned_to" varchar,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "campaign_type" NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"target_audience" jsonb NOT NULL,
	"content" jsonb NOT NULL,
	"schedule" jsonb,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"open_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"conversion_count" integer DEFAULT 0 NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "notification_type" NOT NULL,
	"priority" "notification_priority" DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"sla_deadline" timestamp,
	"related_entity_type" varchar,
	"related_entity_id" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar NOT NULL,
	"property_id" varchar,
	"external_unit_id" varchar,
	"external_client_id" varchar,
	"lead_id" varchar,
	"created_by" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"offer_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "offer_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_request_id" varchar,
	"property_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"appointment_id" varchar,
	"client_nationality" varchar,
	"client_time_in_tulum" varchar,
	"client_occupation" varchar,
	"client_company" varchar,
	"client_has_pets" boolean DEFAULT false,
	"client_pet_description" text,
	"client_monthly_income" numeric(12, 2),
	"client_num_tenants" integer,
	"client_guarantor_name" varchar,
	"client_guarantor_phone" varchar,
	"client_property_use" varchar,
	"offer_amount" numeric(12, 2) NOT NULL,
	"monthly_rent" numeric(12, 2),
	"first_month_advance" boolean DEFAULT false,
	"second_month_advance" boolean DEFAULT false,
	"deposit_amount" numeric(12, 2),
	"move_in_date" timestamp,
	"contract_duration_months" integer,
	"services_included" text[],
	"services_excluded" text[],
	"special_requests" text,
	"digital_signature" text,
	"status" "offer_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"counter_offer_amount" numeric(12, 2),
	"counter_offer_services_included" jsonb,
	"counter_offer_services_excluded" jsonb,
	"counter_offer_notes" text,
	"negotiation_round" integer DEFAULT 0,
	"last_offered_by" varchar,
	"negotiation_history" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_document_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" varchar NOT NULL,
	"tenant_rental_form_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"owner_id_document" text,
	"owner_proof_of_ownership" text,
	"property_documents" text[],
	"tax_documents" text[],
	"utility_bills" text[],
	"other_documents" text[],
	"accepted_terms" boolean DEFAULT false NOT NULL,
	"digital_signature" text,
	"signed_at" timestamp,
	"status" varchar DEFAULT 'submitted' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_document_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar NOT NULL,
	"tenant_rental_form_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "owner_document_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "owner_referrals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" varchar NOT NULL,
	"assigned_to" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"nationality" varchar,
	"phone" varchar NOT NULL,
	"whatsapp_number" varchar,
	"email" varchar NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar,
	"verification_token_expiry" timestamp,
	"property_type" varchar NOT NULL,
	"condominium_name" varchar,
	"unit_number" varchar,
	"property_address" text,
	"property_description" text,
	"estimated_value" numeric(12, 2),
	"status" "owner_referral_status" DEFAULT 'pendiente_confirmacion' NOT NULL,
	"commission_percent" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"commission_amount" numeric(12, 2),
	"commission_paid" boolean DEFAULT false NOT NULL,
	"commission_paid_at" timestamp,
	"admin_approved_by_id" varchar,
	"admin_approved_at" timestamp,
	"rejected_by_id" varchar,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"notes" text,
	"admin_notes" text,
	"linked_owner_id" varchar,
	"linked_property_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"auto_approve_appointments" boolean DEFAULT false NOT NULL,
	"auto_accept_offers" boolean DEFAULT false NOT NULL,
	"notification_preferences" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "owner_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payout_batches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_number" varchar NOT NULL,
	"status" "payout_status" DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar,
	"payment_reference" varchar,
	"notes" text,
	"scheduled_payment_date" timestamp,
	"actual_payment_date" timestamp,
	"created_by" varchar NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"paid_by" varchar,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payout_batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"permission" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_user_id_permission_unique" UNIQUE("user_id","permission")
);
--> statement-breakpoint
CREATE TABLE "predictive_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar,
	"type" "predictive_analytic_type" NOT NULL,
	"prediction" jsonb NOT NULL,
	"confidence" numeric(5, 2),
	"recommended_action" text,
	"factors" jsonb,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presentation_cards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"name" text,
	"property_type" text NOT NULL,
	"modality" "property_status" NOT NULL,
	"min_price" numeric(12, 2) NOT NULL,
	"max_price" numeric(12, 2) NOT NULL,
	"location" text NOT NULL,
	"bedrooms" integer,
	"bathrooms" integer,
	"amenities" text[] DEFAULT ARRAY[]::text[],
	"additional_requirements" text,
	"move_in_date" timestamp,
	"contract_duration" text,
	"has_pets" boolean DEFAULT false,
	"pet_photo_url" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"times_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text,
	"property_type" text DEFAULT 'house' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"sale_price" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" numeric(3, 1) NOT NULL,
	"area" numeric(8, 2),
	"location" text NOT NULL,
	"colony_id" varchar,
	"colony_name" text,
	"status" "property_status" NOT NULL,
	"unit_type" text DEFAULT 'private' NOT NULL,
	"condominium_id" varchar NOT NULL,
	"condo_name" text,
	"unit_number" text NOT NULL,
	"show_condo_in_listing" boolean DEFAULT true NOT NULL,
	"show_unit_number_in_listing" boolean DEFAULT true NOT NULL,
	"images" text[] DEFAULT ARRAY[]::text[],
	"primary_images" text[] DEFAULT ARRAY[]::text[],
	"cover_image_index" integer DEFAULT 0,
	"secondary_images" text[] DEFAULT ARRAY[]::text[],
	"videos" text[] DEFAULT ARRAY[]::text[],
	"virtual_tour_url" text,
	"request_virtual_tour" boolean DEFAULT false,
	"google_maps_url" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"amenities" text[] DEFAULT ARRAY[]::text[],
	"specifications" jsonb,
	"access_info" jsonb,
	"owner_id" varchar NOT NULL,
	"management_id" varchar,
	"approval_status" "property_approval_status" DEFAULT 'draft' NOT NULL,
	"owner_status" "owner_property_status" DEFAULT 'active' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"available_from" timestamp,
	"available_to" timestamp,
	"rating" numeric(3, 2) DEFAULT '0',
	"review_count" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"allows_subleasing" boolean DEFAULT false NOT NULL,
	"pet_friendly" boolean DEFAULT false NOT NULL,
	"referral_partner_id" varchar,
	"referral_percent" numeric(5, 2) DEFAULT '20.00',
	"wizard_mode" "wizard_mode" DEFAULT 'simple',
	"included_services" jsonb,
	"accepted_lease_durations" text[] DEFAULT ARRAY[]::text[],
	"owner_first_name" text,
	"owner_last_name" text,
	"owner_phone" varchar(20),
	"owner_email" varchar(255),
	"referred_by_name" text,
	"referred_by_last_name" text,
	"referred_by_phone" varchar(20),
	"referred_by_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_agreements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_draft_id" varchar,
	"property_id" varchar,
	"template_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"template_type" "agreement_template_type" NOT NULL,
	"status" "agreement_signature_status" DEFAULT 'pending' NOT NULL,
	"rendered_content" text NOT NULL,
	"signed_at" timestamp,
	"signer_name" varchar,
	"signer_ip" varchar,
	"variable_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_change_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"requested_by_id" varchar NOT NULL,
	"status" "change_request_status" DEFAULT 'pending' NOT NULL,
	"changed_fields" jsonb NOT NULL,
	"reviewed_by_id" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_delivery_inventories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_contract_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"general_condition" varchar DEFAULT 'good' NOT NULL,
	"general_notes" text,
	"living_room_items" jsonb,
	"kitchen_items" jsonb,
	"bedroom_items" jsonb,
	"bathroom_items" jsonb,
	"other_items" jsonb,
	"water_meter_reading" varchar,
	"electricity_meter_reading" varchar,
	"gas_meter_reading" varchar,
	"keys_provided" integer DEFAULT 0 NOT NULL,
	"remote_controls" integer DEFAULT 0 NOT NULL,
	"access_cards" integer DEFAULT 0 NOT NULL,
	"photos" text[] DEFAULT ARRAY[]::text[],
	"owner_signed_at" timestamp,
	"tenant_signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"document_type" "property_document_type" NOT NULL,
	"category" "property_document_category" NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_validated" boolean DEFAULT false NOT NULL,
	"validated_at" timestamp,
	"validated_by" varchar,
	"validation_notes" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_features" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_features_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "property_limit_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"requested_limit" integer NOT NULL,
	"current_limit" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "change_request_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"author_id" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_owner_terms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_en" text NOT NULL,
	"content" text NOT NULL,
	"content_en" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"presentation_card_id" varchar,
	"message" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_interested" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"appointment_id" varchar,
	"rating" "review_rating" NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_staff" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"role" varchar NOT NULL,
	"assigned_by_id" varchar NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "property_staff_property_id_staff_id_role_unique" UNIQUE("property_id","staff_id","role")
);
--> statement-breakpoint
CREATE TABLE "property_submission_drafts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"token_id" varchar,
	"property_id" varchar,
	"status" "property_submission_status" DEFAULT 'draft' NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"basic_info" jsonb,
	"location_info" jsonb,
	"details" jsonb,
	"media" jsonb,
	"services_info" jsonb,
	"access_info" jsonb,
	"owner_data" jsonb,
	"commercial_terms" jsonb,
	"terms_acceptance" jsonb,
	"is_for_rent" boolean DEFAULT false NOT NULL,
	"is_for_sale" boolean DEFAULT false NOT NULL,
	"review_notes" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_submission_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(20) NOT NULL,
	"created_by" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"property_draft_id" varchar,
	"invitee_email" varchar(255),
	"invitee_phone" varchar(50),
	"invitee_name" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"used_at" timestamp,
	CONSTRAINT "property_submission_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "property_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"assigned_to_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"specialty" text NOT NULL,
	"experience" text NOT NULL,
	"description" text NOT NULL,
	"references" text,
	"status" "provider_application_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_referral_commission_percent" numeric(5, 2) DEFAULT '5.00' NOT NULL,
	"owner_referral_commission_percent" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"applicant_id" varchar NOT NULL,
	"status" "rental_application_status" DEFAULT 'solicitud_enviada' NOT NULL,
	"monthly_income" numeric(12, 2),
	"employment_status" varchar,
	"move_in_date" timestamp,
	"lease_duration" integer,
	"deposit_amount" numeric(12, 2),
	"documents" text[] DEFAULT ARRAY[]::text[],
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_commission_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"default_commission_percent" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"property_id" varchar,
	"user_id" varchar,
	"commission_percent" numeric(5, 2),
	"fixed_fee" numeric(12, 2),
	"notes" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_application_id" varchar,
	"property_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"owner_id" varchar NOT NULL,
	"seller_id" varchar,
	"status" "rental_contract_status" DEFAULT 'draft' NOT NULL,
	"monthly_rent" numeric(12, 2) NOT NULL,
	"lease_duration_months" integer NOT NULL,
	"deposit_amount" numeric(12, 2),
	"administrative_fee" numeric(12, 2),
	"is_for_sublease" boolean DEFAULT false NOT NULL,
	"total_commission_months" numeric(5, 2) NOT NULL,
	"total_commission_amount" numeric(12, 2) NOT NULL,
	"seller_commission_percent" numeric(5, 2) NOT NULL,
	"referral_commission_percent" numeric(5, 2) DEFAULT '0',
	"homesapp_commission_percent" numeric(5, 2) NOT NULL,
	"seller_commission_amount" numeric(12, 2) NOT NULL,
	"referral_commission_amount" numeric(12, 2) DEFAULT '0',
	"homesapp_commission_amount" numeric(12, 2) NOT NULL,
	"referral_partner_id" varchar,
	"included_services" jsonb,
	"apartado_date" timestamp,
	"contract_signed_date" timestamp,
	"check_in_date" timestamp,
	"lease_start_date" timestamp NOT NULL,
	"lease_end_date" timestamp NOT NULL,
	"payout_released_at" timestamp,
	"owner_terms_signed_at" timestamp,
	"tenant_terms_signed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_health_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" varchar NOT NULL,
	"score" integer DEFAULT 100 NOT NULL,
	"status" "health_score_status" NOT NULL,
	"payment_score" integer DEFAULT 100 NOT NULL,
	"incident_score" integer DEFAULT 100 NOT NULL,
	"communication_score" integer DEFAULT 100 NOT NULL,
	"has_payment_delay" boolean DEFAULT false NOT NULL,
	"has_open_incidents" boolean DEFAULT false NOT NULL,
	"is_near_expiry" boolean DEFAULT false NOT NULL,
	"renewal_probability" numeric(5, 2),
	"reasons" text[] DEFAULT ARRAY[]::text[],
	"last_calculated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rental_health_scores_contract_id_unique" UNIQUE("contract_id")
);
--> statement-breakpoint
CREATE TABLE "rental_opportunity_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"appointment_id" varchar,
	"status" "opportunity_request_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"desired_move_in_date" timestamp,
	"preferred_contact_method" varchar DEFAULT 'email',
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_contract_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"service_type" "service_type" DEFAULT 'rent' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"due_date" timestamp NOT NULL,
	"payment_date" timestamp,
	"status" "rental_payment_status" DEFAULT 'pending' NOT NULL,
	"payment_proof" text,
	"approved_by" varchar,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"requested_role" "user_role" NOT NULL,
	"status" "role_request_status" DEFAULT 'pending' NOT NULL,
	"email" varchar(255) NOT NULL,
	"whatsapp" varchar(20) NOT NULL,
	"reason" text,
	"years_of_experience" integer,
	"experience" text,
	"additional_info" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" varchar NOT NULL,
	"provider_id" varchar NOT NULL,
	"client_id" varchar NOT NULL,
	"property_id" varchar,
	"status" "service_booking_status" DEFAULT 'pending' NOT NULL,
	"scheduled_date" timestamp,
	"notes" text,
	"client_message" text,
	"provider_response" text,
	"total_cost" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_favorites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_provider" UNIQUE("user_id","provider_id")
);
--> statement-breakpoint
CREATE TABLE "service_providers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"specialty" text NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0',
	"review_count" integer DEFAULT 0,
	"available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_providers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"estimated_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sidebar_menu_visibility" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "user_role" NOT NULL,
	"menu_item_key" varchar(255) NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_role_menu_item" UNIQUE("role","menu_item_key")
);
--> statement-breakpoint
CREATE TABLE "sidebar_menu_visibility_user" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"menu_item_key" varchar(255) NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_menu_item" UNIQUE("user_id","menu_item_key")
);
--> statement-breakpoint
CREATE TABLE "sla_configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_name" varchar NOT NULL,
	"target_minutes" integer NOT NULL,
	"warning_minutes" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sla_configurations_process_name_unique" UNIQUE("process_name")
);
--> statement-breakpoint
CREATE TABLE "system_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"priority" "alert_priority" DEFAULT 'medium' NOT NULL,
	"status" "alert_status" DEFAULT 'pending' NOT NULL,
	"alert_type" varchar NOT NULL,
	"related_entity_type" varchar,
	"related_entity_id" varchar,
	"action_url" varchar,
	"acknowledged_at" timestamp,
	"resolved_at" timestamp,
	"dismissed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" varchar(255) NOT NULL,
	"setting_value" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"assigned_to_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"budget_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_maintenance_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_contract_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"urgency" varchar DEFAULT 'medium' NOT NULL,
	"photo_data" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_move_in_forms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rental_contract_id" varchar NOT NULL,
	"tenant_id" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"date_of_birth" timestamp,
	"nationality" varchar,
	"occupation" varchar,
	"employer" varchar,
	"id_type" varchar,
	"id_number" varchar,
	"id_expiry" timestamp,
	"id_photos" text[] DEFAULT ARRAY[]::text[],
	"emergency_contact1_name" varchar,
	"emergency_contact1_phone" varchar,
	"emergency_contact1_relationship" varchar,
	"emergency_contact2_name" varchar,
	"emergency_contact2_phone" varchar,
	"emergency_contact2_relationship" varchar,
	"has_vehicle" boolean DEFAULT false NOT NULL,
	"vehicle_make" varchar,
	"vehicle_model" varchar,
	"vehicle_plate" varchar,
	"vehicle_color" varchar,
	"vehicle_photos" text[] DEFAULT ARRAY[]::text[],
	"has_pets" boolean DEFAULT false NOT NULL,
	"pet_details" text,
	"pet_photos" text[] DEFAULT ARRAY[]::text[],
	"additional_occupants" jsonb,
	"special_requests" text,
	"allergies" text,
	"medical_conditions" text,
	"tenant_signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_rental_form_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar NOT NULL,
	"property_id" varchar,
	"external_unit_id" varchar,
	"external_client_id" varchar,
	"lead_id" varchar,
	"created_by" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_rental_form_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tenant_rental_forms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"lead_id" varchar,
	"full_name" text NOT NULL,
	"address" text,
	"nationality" varchar,
	"age" integer,
	"time_in_tulum" varchar,
	"job_position" varchar,
	"company_name" varchar,
	"workplace_address" text,
	"monthly_income" varchar,
	"company_tenure" varchar,
	"marital_status" varchar,
	"whatsapp_number" varchar,
	"cellphone" varchar,
	"email" varchar,
	"id_type" varchar,
	"id_number" varchar,
	"check_in_date" timestamp,
	"number_of_tenants" integer,
	"payment_method" varchar,
	"has_pets" boolean DEFAULT false,
	"pet_details" text,
	"desired_property" text,
	"desired_condo_unit" varchar,
	"has_guarantor" boolean DEFAULT false,
	"guarantor_full_name" text,
	"guarantor_address" text,
	"guarantor_birth_date_place" varchar,
	"guarantor_nationality" varchar,
	"guarantor_age" integer,
	"guarantor_time_in_tulum" varchar,
	"guarantor_job_position" varchar,
	"guarantor_company_name" varchar,
	"guarantor_work_address" text,
	"guarantor_work_phone" varchar,
	"guarantor_marital_status" varchar,
	"guarantor_landline" varchar,
	"guarantor_cellphone" varchar,
	"guarantor_email" varchar,
	"guarantor_id_number" varchar,
	"previous_landlord_name" varchar,
	"previous_landlord_phone" varchar,
	"previous_address" text,
	"previous_tenancy" varchar,
	"direct_supervisor_name" varchar,
	"company_name_address" text,
	"company_landline" varchar,
	"supervisor_cellphone" varchar,
	"reference1_name" varchar,
	"reference1_address" text,
	"reference1_landline" varchar,
	"reference1_cellphone" varchar,
	"reference2_name" varchar,
	"reference2_address" text,
	"reference2_landline" varchar,
	"reference2_cellphone" varchar,
	"tenant_id_document" text,
	"tenant_proof_of_address" text,
	"tenant_proof_of_income" text[],
	"guarantor_id_document" text,
	"guarantor_proof_of_address" text,
	"guarantor_proof_of_income" text[],
	"accepted_terms" boolean DEFAULT false NOT NULL,
	"digital_signature" text,
	"signed_at" timestamp,
	"status" varchar DEFAULT 'submitted' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_screenings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" varchar NOT NULL,
	"applicant_id" varchar NOT NULL,
	"property_id" varchar NOT NULL,
	"status" "screening_status" DEFAULT 'pending' NOT NULL,
	"risk_score" numeric(5, 2),
	"risk_level" "risk_level",
	"ai_analysis" jsonb,
	"fraud_detection" jsonb,
	"income_verification" jsonb,
	"credit_analysis" jsonb,
	"rental_history" jsonb,
	"recommendations" text,
	"flags" jsonb,
	"reviewed_by" varchar,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar,
	"require_password_change" boolean DEFAULT false NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"bio" text,
	"role" "user_role" DEFAULT 'cliente' NOT NULL,
	"additional_role" "user_role",
	"status" "user_status" DEFAULT 'approved' NOT NULL,
	"phone" varchar,
	"email_verified" boolean DEFAULT false NOT NULL,
	"preferred_language" varchar(2) DEFAULT 'es' NOT NULL,
	"has_seen_welcome" boolean DEFAULT false NOT NULL,
	"last_welcome_shown" timestamp,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"onboarding_steps" jsonb,
	"document_type" "document_type",
	"document_url" varchar,
	"document_approval_status" "document_approval_status",
	"document_reviewed_at" timestamp,
	"document_rejection_reason" text,
	"commission_terms_accepted" boolean DEFAULT false NOT NULL,
	"commission_terms_accepted_at" timestamp,
	"payment_method" "payment_method",
	"bank_name" varchar,
	"bank_account_name" varchar,
	"bank_account_number" varchar,
	"bank_clabe" varchar,
	"bank_email" varchar,
	"bank_address" text,
	"custom_client_referral_percent" numeric(5, 2),
	"custom_owner_referral_percent" numeric(5, 2),
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspension_type" "suspension_type",
	"suspension_reason" text,
	"suspension_end_date" timestamp,
	"suspended_at" timestamp,
	"suspended_by_id" varchar,
	"property_limit" integer DEFAULT 3 NOT NULL,
	"assigned_to_user" varchar,
	"maintenance_specialty" "maintenance_specialty",
	"google_calendar_email" varchar,
	"external_agency_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "work_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"staff_id" varchar NOT NULL,
	"report_type" varchar NOT NULL,
	"description" text NOT NULL,
	"images" text[] DEFAULT ARRAY[]::text[],
	"observations" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "workflow_event_type" NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"triggered_by" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accountant_assignments" ADD CONSTRAINT "accountant_assignments_accountant_id_users_id_fk" FOREIGN KEY ("accountant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountant_assignments" ADD CONSTRAINT "accountant_assignments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountant_assignments" ADD CONSTRAINT "accountant_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountant_assignments" ADD CONSTRAINT "accountant_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_reviews" ADD CONSTRAINT "appointment_reviews_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_reviews" ADD CONSTRAINT "appointment_reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_concierge_id_users_id_fk" FOREIGN KEY ("concierge_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_presentation_card_id_presentation_cards_id_fk" FOREIGN KEY ("presentation_card_id") REFERENCES "public"."presentation_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_opportunity_request_id_rental_opportunity_requests_id_fk" FOREIGN KEY ("opportunity_request_id") REFERENCES "public"."rental_opportunity_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_member_id_users_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_concierge_assigned_by_users_id_fk" FOREIGN KEY ("concierge_assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_suggestions" ADD CONSTRAINT "auto_suggestions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_suggestions" ADD CONSTRAINT "auto_suggestions_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_suggestions" ADD CONSTRAINT "auto_suggestions_presentation_card_id_presentation_cards_id_fk" FOREIGN KEY ("presentation_card_id") REFERENCES "public"."presentation_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_rental_application_id_rental_applications_id_fk" FOREIGN KEY ("rental_application_id") REFERENCES "public"."rental_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_rental_contract_id_rental_contracts_id_fk" FOREIGN KEY ("rental_contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_legal_document_id_contract_legal_documents_id_fk" FOREIGN KEY ("legal_document_id") REFERENCES "public"."contract_legal_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_config" ADD CONSTRAINT "chatbot_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in_appointments" ADD CONSTRAINT "check_in_appointments_rental_contract_id_rental_contracts_id_fk" FOREIGN KEY ("rental_contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in_appointments" ADD CONSTRAINT "check_in_appointments_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in_appointments" ADD CONSTRAINT "check_in_appointments_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in_appointments" ADD CONSTRAINT "check_in_appointments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in_appointments" ADD CONSTRAINT "check_in_appointments_assigned_admin_id_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_referrals" ADD CONSTRAINT "client_referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_referrals" ADD CONSTRAINT "client_referrals_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_referrals" ADD CONSTRAINT "client_referrals_linked_lead_id_leads_id_fk" FOREIGN KEY ("linked_lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_concierge_id_users_id_fk" FOREIGN KEY ("concierge_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_reviews" ADD CONSTRAINT "client_reviews_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colonies" ADD CONSTRAINT "colonies_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_advances" ADD CONSTRAINT "commission_advances_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_advances" ADD CONSTRAINT "commission_advances_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concierge_blocked_slots" ADD CONSTRAINT "concierge_blocked_slots_concierge_id_users_id_fk" FOREIGN KEY ("concierge_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concierge_reviews" ADD CONSTRAINT "concierge_reviews_concierge_id_users_id_fk" FOREIGN KEY ("concierge_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concierge_reviews" ADD CONSTRAINT "concierge_reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concierge_reviews" ADD CONSTRAINT "concierge_reviews_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium_fee_payments" ADD CONSTRAINT "condominium_fee_payments_condominium_fee_id_condominium_fees_id_fk" FOREIGN KEY ("condominium_fee_id") REFERENCES "public"."condominium_fees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium_fee_payments" ADD CONSTRAINT "condominium_fee_payments_registered_by_id_users_id_fk" FOREIGN KEY ("registered_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium_fees" ADD CONSTRAINT "condominium_fees_condominium_unit_id_condominium_units_id_fk" FOREIGN KEY ("condominium_unit_id") REFERENCES "public"."condominium_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium_fees" ADD CONSTRAINT "condominium_fees_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium_issues" ADD CONSTRAINT "condominium_issues_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium_issues" ADD CONSTRAINT "condominium_issues_condominium_unit_id_condominium_units_id_fk" FOREIGN KEY ("condominium_unit_id") REFERENCES "public"."condominium_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium_issues" ADD CONSTRAINT "condominium_issues_reported_by_id_users_id_fk" FOREIGN KEY ("reported_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium_issues" ADD CONSTRAINT "condominium_issues_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium_units" ADD CONSTRAINT "condominium_units_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium_units" ADD CONSTRAINT "condominium_units_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominiums" ADD CONSTRAINT "condominiums_colony_id_colonies_id_fk" FOREIGN KEY ("colony_id") REFERENCES "public"."colonies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominiums" ADD CONSTRAINT "condominiums_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_legal_document_id_contract_legal_documents_id_fk" FOREIGN KEY ("legal_document_id") REFERENCES "public"."contract_legal_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_approvals" ADD CONSTRAINT "contract_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_checklist_items" ADD CONSTRAINT "contract_checklist_items_contract_id_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_checklist_items" ADD CONSTRAINT "contract_checklist_items_template_item_id_contract_checklist_template_items_id_fk" FOREIGN KEY ("template_item_id") REFERENCES "public"."contract_checklist_template_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_checklist_items" ADD CONSTRAINT "contract_checklist_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_checklist_template_items" ADD CONSTRAINT "contract_checklist_template_items_template_id_contract_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."contract_checklist_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_checklist_templates" ADD CONSTRAINT "contract_checklist_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_cycle_metrics" ADD CONSTRAINT "contract_cycle_metrics_contract_id_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_legal_documents" ADD CONSTRAINT "contract_legal_documents_rental_contract_id_rental_contracts_id_fk" FOREIGN KEY ("rental_contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_legal_documents" ADD CONSTRAINT "contract_legal_documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_owner_info" ADD CONSTRAINT "contract_owner_info_rental_contract_id_rental_contracts_id_fk" FOREIGN KEY ("rental_contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signed_documents" ADD CONSTRAINT "contract_signed_documents_rental_contract_id_rental_contracts_id_fk" FOREIGN KEY ("rental_contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signed_documents" ADD CONSTRAINT "contract_signed_documents_check_in_appointment_id_check_in_appointments_id_fk" FOREIGN KEY ("check_in_appointment_id") REFERENCES "public"."check_in_appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_signed_documents" ADD CONSTRAINT "contract_signed_documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_tenant_info" ADD CONSTRAINT "contract_tenant_info_rental_contract_id_rental_contracts_id_fk" FOREIGN KEY ("rental_contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_term_discussions" ADD CONSTRAINT "contract_term_discussions_legal_document_id_contract_legal_documents_id_fk" FOREIGN KEY ("legal_document_id") REFERENCES "public"."contract_legal_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_term_discussions" ADD CONSTRAINT "contract_term_discussions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_term_discussions" ADD CONSTRAINT "contract_term_discussions_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_agencies" ADD CONSTRAINT "external_agencies_assigned_to_user_users_id_fk" FOREIGN KEY ("assigned_to_user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_agencies" ADD CONSTRAINT "external_agencies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_checkout_reports" ADD CONSTRAINT "external_checkout_reports_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_checkout_reports" ADD CONSTRAINT "external_checkout_reports_contract_id_external_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."external_rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_checkout_reports" ADD CONSTRAINT "external_checkout_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_client_documents" ADD CONSTRAINT "external_client_documents_client_id_external_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."external_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_client_documents" ADD CONSTRAINT "external_client_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_client_incidents" ADD CONSTRAINT "external_client_incidents_client_id_external_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."external_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_client_incidents" ADD CONSTRAINT "external_client_incidents_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_client_incidents" ADD CONSTRAINT "external_client_incidents_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_clients" ADD CONSTRAINT "external_clients_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_clients" ADD CONSTRAINT "external_clients_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_condominiums" ADD CONSTRAINT "external_condominiums_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_condominiums" ADD CONSTRAINT "external_condominiums_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_owner_id_external_unit_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."external_unit_owners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_contract_id_external_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."external_rental_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_unit_id_external_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."external_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_payment_id_external_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."external_payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_maintenance_ticket_id_external_maintenance_tickets_id_fk" FOREIGN KEY ("maintenance_ticket_id") REFERENCES "public"."external_maintenance_tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_schedule_id_external_payment_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."external_payment_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_financial_transactions" ADD CONSTRAINT "external_financial_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_photos" ADD CONSTRAINT "external_maintenance_photos_ticket_id_external_maintenance_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."external_maintenance_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_photos" ADD CONSTRAINT "external_maintenance_photos_update_id_external_maintenance_updates_id_fk" FOREIGN KEY ("update_id") REFERENCES "public"."external_maintenance_updates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_photos" ADD CONSTRAINT "external_maintenance_photos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_tickets" ADD CONSTRAINT "external_maintenance_tickets_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_tickets" ADD CONSTRAINT "external_maintenance_tickets_unit_id_external_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."external_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_tickets" ADD CONSTRAINT "external_maintenance_tickets_contract_id_external_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."external_rental_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_tickets" ADD CONSTRAINT "external_maintenance_tickets_property_id_external_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."external_properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_tickets" ADD CONSTRAINT "external_maintenance_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_tickets" ADD CONSTRAINT "external_maintenance_tickets_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_tickets" ADD CONSTRAINT "external_maintenance_tickets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_updates" ADD CONSTRAINT "external_maintenance_updates_ticket_id_external_maintenance_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."external_maintenance_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_maintenance_updates" ADD CONSTRAINT "external_maintenance_updates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_notifications" ADD CONSTRAINT "external_notifications_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_notifications" ADD CONSTRAINT "external_notifications_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_notifications" ADD CONSTRAINT "external_notifications_contract_id_external_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."external_rental_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_notifications" ADD CONSTRAINT "external_notifications_payment_id_external_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."external_payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_notifications" ADD CONSTRAINT "external_notifications_ticket_id_external_maintenance_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."external_maintenance_tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_notifications" ADD CONSTRAINT "external_notifications_unit_id_external_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."external_units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_owner_charges" ADD CONSTRAINT "external_owner_charges_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_owner_charges" ADD CONSTRAINT "external_owner_charges_owner_id_external_unit_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."external_unit_owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_owner_charges" ADD CONSTRAINT "external_owner_charges_unit_id_external_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."external_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_owner_charges" ADD CONSTRAINT "external_owner_charges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_owner_notifications" ADD CONSTRAINT "external_owner_notifications_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_owner_notifications" ADD CONSTRAINT "external_owner_notifications_condominium_id_external_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."external_condominiums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_owner_notifications" ADD CONSTRAINT "external_owner_notifications_unit_id_external_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."external_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_owner_notifications" ADD CONSTRAINT "external_owner_notifications_owner_id_external_unit_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."external_unit_owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_owner_notifications" ADD CONSTRAINT "external_owner_notifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_payment_schedules" ADD CONSTRAINT "external_payment_schedules_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_payment_schedules" ADD CONSTRAINT "external_payment_schedules_contract_id_external_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."external_rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_payment_schedules" ADD CONSTRAINT "external_payment_schedules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_payments" ADD CONSTRAINT "external_payments_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_payments" ADD CONSTRAINT "external_payments_contract_id_external_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."external_rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_payments" ADD CONSTRAINT "external_payments_schedule_id_external_payment_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."external_payment_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_payments" ADD CONSTRAINT "external_payments_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_payments" ADD CONSTRAINT "external_payments_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_payments" ADD CONSTRAINT "external_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_properties" ADD CONSTRAINT "external_properties_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_properties" ADD CONSTRAINT "external_properties_linked_property_id_properties_id_fk" FOREIGN KEY ("linked_property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_properties" ADD CONSTRAINT "external_properties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD CONSTRAINT "external_rental_contracts_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD CONSTRAINT "external_rental_contracts_unit_id_external_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."external_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD CONSTRAINT "external_rental_contracts_property_id_external_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."external_properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD CONSTRAINT "external_rental_contracts_client_id_external_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."external_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD CONSTRAINT "external_rental_contracts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_notes" ADD CONSTRAINT "external_rental_notes_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_notes" ADD CONSTRAINT "external_rental_notes_contract_id_external_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."external_rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_notes" ADD CONSTRAINT "external_rental_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_tenants" ADD CONSTRAINT "external_rental_tenants_contract_id_external_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."external_rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_tenants" ADD CONSTRAINT "external_rental_tenants_client_id_external_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."external_clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_tenants" ADD CONSTRAINT "external_rental_tenants_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_unit_access_controls" ADD CONSTRAINT "external_unit_access_controls_unit_id_external_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."external_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_unit_access_controls" ADD CONSTRAINT "external_unit_access_controls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_unit_owners" ADD CONSTRAINT "external_unit_owners_unit_id_external_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."external_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_unit_owners" ADD CONSTRAINT "external_unit_owners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_units" ADD CONSTRAINT "external_units_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_units" ADD CONSTRAINT "external_units_condominium_id_external_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."external_condominiums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_units" ADD CONSTRAINT "external_units_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_worker_assignments" ADD CONSTRAINT "external_worker_assignments_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_worker_assignments" ADD CONSTRAINT "external_worker_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_worker_assignments" ADD CONSTRAINT "external_worker_assignments_condominium_id_external_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."external_condominiums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_worker_assignments" ADD CONSTRAINT "external_worker_assignments_unit_id_external_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."external_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_worker_assignments" ADD CONSTRAINT "external_worker_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_announcement_reads" ADD CONSTRAINT "hoa_announcement_reads_announcement_id_hoa_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."hoa_announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_announcement_reads" ADD CONSTRAINT "hoa_announcement_reads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_announcements" ADD CONSTRAINT "hoa_announcements_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_announcements" ADD CONSTRAINT "hoa_announcements_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_manager_assignments" ADD CONSTRAINT "hoa_manager_assignments_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_manager_assignments" ADD CONSTRAINT "hoa_manager_assignments_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_manager_assignments" ADD CONSTRAINT "hoa_manager_assignments_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_manager_assignments" ADD CONSTRAINT "hoa_manager_assignments_rejected_by_id_users_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hoa_manager_assignments" ADD CONSTRAINT "hoa_manager_assignments_suspended_by_id_users_id_fk" FOREIGN KEY ("suspended_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_transactions" ADD CONSTRAINT "income_transactions_beneficiary_id_users_id_fk" FOREIGN KEY ("beneficiary_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_transactions" ADD CONSTRAINT "income_transactions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_transactions" ADD CONSTRAINT "income_transactions_source_referral_client_id_client_referrals_id_fk" FOREIGN KEY ("source_referral_client_id") REFERENCES "public"."client_referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_transactions" ADD CONSTRAINT "income_transactions_source_referral_owner_id_owner_referrals_id_fk" FOREIGN KEY ("source_referral_owner_id") REFERENCES "public"."owner_referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_transactions" ADD CONSTRAINT "income_transactions_source_offer_id_offers_id_fk" FOREIGN KEY ("source_offer_id") REFERENCES "public"."offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_transactions" ADD CONSTRAINT "income_transactions_payout_batch_id_payout_batches_id_fk" FOREIGN KEY ("payout_batch_id") REFERENCES "public"."payout_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_transactions" ADD CONSTRAINT "income_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_transactions" ADD CONSTRAINT "income_transactions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_transactions" ADD CONSTRAINT "income_transactions_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_reports" ADD CONSTRAINT "inspection_reports_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_reports" ADD CONSTRAINT "inspection_reports_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_journeys" ADD CONSTRAINT "lead_journeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_journeys" ADD CONSTRAINT "lead_journeys_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_property_offers" ADD CONSTRAINT "lead_property_offers_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_property_offers" ADD CONSTRAINT "lead_property_offers_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_property_offers" ADD CONSTRAINT "lead_property_offers_offered_by_id_users_id_fk" FOREIGN KEY ("offered_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_response_metrics" ADD CONSTRAINT "lead_response_metrics_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_response_metrics" ADD CONSTRAINT "lead_response_metrics_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_registered_by_id_users_id_fk" FOREIGN KEY ("registered_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "maintenance_schedules_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_tokens" ADD CONSTRAINT "offer_tokens_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_tokens" ADD CONSTRAINT "offer_tokens_external_unit_id_external_units_id_fk" FOREIGN KEY ("external_unit_id") REFERENCES "public"."external_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_tokens" ADD CONSTRAINT "offer_tokens_external_client_id_external_clients_id_fk" FOREIGN KEY ("external_client_id") REFERENCES "public"."external_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_tokens" ADD CONSTRAINT "offer_tokens_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_tokens" ADD CONSTRAINT "offer_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_opportunity_request_id_rental_opportunity_requests_id_fk" FOREIGN KEY ("opportunity_request_id") REFERENCES "public"."rental_opportunity_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_document_submissions" ADD CONSTRAINT "owner_document_submissions_token_id_owner_document_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."owner_document_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_document_submissions" ADD CONSTRAINT "owner_document_submissions_tenant_rental_form_id_tenant_rental_forms_id_fk" FOREIGN KEY ("tenant_rental_form_id") REFERENCES "public"."tenant_rental_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_document_submissions" ADD CONSTRAINT "owner_document_submissions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_document_submissions" ADD CONSTRAINT "owner_document_submissions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_document_submissions" ADD CONSTRAINT "owner_document_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_document_tokens" ADD CONSTRAINT "owner_document_tokens_tenant_rental_form_id_tenant_rental_forms_id_fk" FOREIGN KEY ("tenant_rental_form_id") REFERENCES "public"."tenant_rental_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_document_tokens" ADD CONSTRAINT "owner_document_tokens_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_document_tokens" ADD CONSTRAINT "owner_document_tokens_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_document_tokens" ADD CONSTRAINT "owner_document_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_referrals" ADD CONSTRAINT "owner_referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_referrals" ADD CONSTRAINT "owner_referrals_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_referrals" ADD CONSTRAINT "owner_referrals_admin_approved_by_id_users_id_fk" FOREIGN KEY ("admin_approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_referrals" ADD CONSTRAINT "owner_referrals_rejected_by_id_users_id_fk" FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_referrals" ADD CONSTRAINT "owner_referrals_linked_owner_id_users_id_fk" FOREIGN KEY ("linked_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_referrals" ADD CONSTRAINT "owner_referrals_linked_property_id_properties_id_fk" FOREIGN KEY ("linked_property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_settings" ADD CONSTRAINT "owner_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictive_analytics" ADD CONSTRAINT "predictive_analytics_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_cards" ADD CONSTRAINT "presentation_cards_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_colony_id_colonies_id_fk" FOREIGN KEY ("colony_id") REFERENCES "public"."colonies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_condominium_id_condominiums_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominiums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_management_id_users_id_fk" FOREIGN KEY ("management_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_referral_partner_id_users_id_fk" FOREIGN KEY ("referral_partner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_agreements" ADD CONSTRAINT "property_agreements_submission_draft_id_property_submission_drafts_id_fk" FOREIGN KEY ("submission_draft_id") REFERENCES "public"."property_submission_drafts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_agreements" ADD CONSTRAINT "property_agreements_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_agreements" ADD CONSTRAINT "property_agreements_template_id_agreement_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."agreement_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_agreements" ADD CONSTRAINT "property_agreements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_change_requests" ADD CONSTRAINT "property_change_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_change_requests" ADD CONSTRAINT "property_change_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_change_requests" ADD CONSTRAINT "property_change_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_delivery_inventories" ADD CONSTRAINT "property_delivery_inventories_rental_contract_id_rental_contracts_id_fk" FOREIGN KEY ("rental_contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_delivery_inventories" ADD CONSTRAINT "property_delivery_inventories_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_delivery_inventories" ADD CONSTRAINT "property_delivery_inventories_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_delivery_inventories" ADD CONSTRAINT "property_delivery_inventories_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_limit_requests" ADD CONSTRAINT "property_limit_requests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_limit_requests" ADD CONSTRAINT "property_limit_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_notes" ADD CONSTRAINT "property_notes_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_notes" ADD CONSTRAINT "property_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_owner_terms" ADD CONSTRAINT "property_owner_terms_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_recommendations" ADD CONSTRAINT "property_recommendations_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_recommendations" ADD CONSTRAINT "property_recommendations_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_recommendations" ADD CONSTRAINT "property_recommendations_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_recommendations" ADD CONSTRAINT "property_recommendations_presentation_card_id_presentation_cards_id_fk" FOREIGN KEY ("presentation_card_id") REFERENCES "public"."presentation_cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_reviews" ADD CONSTRAINT "property_reviews_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_reviews" ADD CONSTRAINT "property_reviews_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_reviews" ADD CONSTRAINT "property_reviews_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_staff" ADD CONSTRAINT "property_staff_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_staff" ADD CONSTRAINT "property_staff_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_staff" ADD CONSTRAINT "property_staff_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_submission_drafts" ADD CONSTRAINT "property_submission_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_submission_drafts" ADD CONSTRAINT "property_submission_drafts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_submission_drafts" ADD CONSTRAINT "property_submission_drafts_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_submission_tokens" ADD CONSTRAINT "property_submission_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_submission_tokens" ADD CONSTRAINT "property_submission_tokens_property_draft_id_property_submission_drafts_id_fk" FOREIGN KEY ("property_draft_id") REFERENCES "public"."property_submission_drafts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_tasks" ADD CONSTRAINT "property_tasks_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_tasks" ADD CONSTRAINT "property_tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_tasks" ADD CONSTRAINT "property_tasks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_applications" ADD CONSTRAINT "provider_applications_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_config" ADD CONSTRAINT "referral_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_applications" ADD CONSTRAINT "rental_applications_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_commission_configs" ADD CONSTRAINT "rental_commission_configs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_commission_configs" ADD CONSTRAINT "rental_commission_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_commission_configs" ADD CONSTRAINT "rental_commission_configs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_rental_application_id_rental_applications_id_fk" FOREIGN KEY ("rental_application_id") REFERENCES "public"."rental_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_referral_partner_id_users_id_fk" FOREIGN KEY ("referral_partner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_health_scores" ADD CONSTRAINT "rental_health_scores_contract_id_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_opportunity_requests" ADD CONSTRAINT "rental_opportunity_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_opportunity_requests" ADD CONSTRAINT "rental_opportunity_requests_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_opportunity_requests" ADD CONSTRAINT "rental_opportunity_requests_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_opportunity_requests" ADD CONSTRAINT "rental_opportunity_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_payments" ADD CONSTRAINT "rental_payments_rental_contract_id_rental_contracts_id_fk" FOREIGN KEY ("rental_contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_payments" ADD CONSTRAINT "rental_payments_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_payments" ADD CONSTRAINT "rental_payments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_requests" ADD CONSTRAINT "role_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_requests" ADD CONSTRAINT "role_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_provider_id_service_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."service_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_favorites" ADD CONSTRAINT "service_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_favorites" ADD CONSTRAINT "service_favorites_provider_id_service_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."service_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_provider_id_service_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."service_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidebar_menu_visibility_user" ADD CONSTRAINT "sidebar_menu_visibility_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sla_configurations" ADD CONSTRAINT "sla_configurations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_alerts" ADD CONSTRAINT "system_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_maintenance_requests" ADD CONSTRAINT "tenant_maintenance_requests_rental_contract_id_rental_contracts_id_fk" FOREIGN KEY ("rental_contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_maintenance_requests" ADD CONSTRAINT "tenant_maintenance_requests_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_move_in_forms" ADD CONSTRAINT "tenant_move_in_forms_rental_contract_id_rental_contracts_id_fk" FOREIGN KEY ("rental_contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_move_in_forms" ADD CONSTRAINT "tenant_move_in_forms_tenant_id_users_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rental_form_tokens" ADD CONSTRAINT "tenant_rental_form_tokens_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rental_form_tokens" ADD CONSTRAINT "tenant_rental_form_tokens_external_unit_id_external_units_id_fk" FOREIGN KEY ("external_unit_id") REFERENCES "public"."external_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rental_form_tokens" ADD CONSTRAINT "tenant_rental_form_tokens_external_client_id_external_clients_id_fk" FOREIGN KEY ("external_client_id") REFERENCES "public"."external_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rental_form_tokens" ADD CONSTRAINT "tenant_rental_form_tokens_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rental_form_tokens" ADD CONSTRAINT "tenant_rental_form_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rental_forms" ADD CONSTRAINT "tenant_rental_forms_token_id_tenant_rental_form_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tenant_rental_form_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rental_forms" ADD CONSTRAINT "tenant_rental_forms_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rental_forms" ADD CONSTRAINT "tenant_rental_forms_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_rental_forms" ADD CONSTRAINT "tenant_rental_forms_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_screenings" ADD CONSTRAINT "tenant_screenings_application_id_rental_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."rental_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_screenings" ADD CONSTRAINT "tenant_screenings_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_screenings" ADD CONSTRAINT "tenant_screenings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_screenings" ADD CONSTRAINT "tenant_screenings_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_suspended_by_id_users_id_fk" FOREIGN KEY ("suspended_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_reports" ADD CONSTRAINT "work_reports_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_reports" ADD CONSTRAINT "work_reports_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_appointments_date" ON "appointments" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_appointments_status" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_appointments_client_id" ON "appointments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_property_id" ON "appointments" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_concierge_id" ON "appointments" USING btree ("concierge_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_status_date" ON "appointments" USING btree ("status","date");--> statement-breakpoint
CREATE INDEX "idx_checkin_contract" ON "check_in_appointments" USING btree ("rental_contract_id");--> statement-breakpoint
CREATE INDEX "idx_checkin_property" ON "check_in_appointments" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_checkin_date" ON "check_in_appointments" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_checkin_status" ON "check_in_appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contract_approvals_doc" ON "contract_approvals" USING btree ("legal_document_id");--> statement-breakpoint
CREATE INDEX "idx_contract_approvals_user" ON "contract_approvals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_legal_docs_contract" ON "contract_legal_documents" USING btree ("rental_contract_id");--> statement-breakpoint
CREATE INDEX "idx_legal_docs_lawyer" ON "contract_legal_documents" USING btree ("uploaded_by_id");--> statement-breakpoint
CREATE INDEX "idx_legal_docs_status" ON "contract_legal_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_signed_docs_contract" ON "contract_signed_documents" USING btree ("rental_contract_id");--> statement-breakpoint
CREATE INDEX "idx_signed_docs_checkin" ON "contract_signed_documents" USING btree ("check_in_appointment_id");--> statement-breakpoint
CREATE INDEX "idx_signed_docs_type" ON "contract_signed_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_term_discussions_doc" ON "contract_term_discussions" USING btree ("legal_document_id");--> statement-breakpoint
CREATE INDEX "idx_term_discussions_user" ON "contract_term_discussions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_term_discussions_status" ON "contract_term_discussions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_external_agencies_active" ON "external_agencies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_external_agencies_assigned_user" ON "external_agencies" USING btree ("assigned_to_user");--> statement-breakpoint
CREATE INDEX "idx_external_checkout_agency" ON "external_checkout_reports" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_checkout_contract" ON "external_checkout_reports" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_external_checkout_status" ON "external_checkout_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_client_documents_client" ON "external_client_documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_documents_type" ON "external_client_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_client_incidents_client" ON "external_client_incidents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_incidents_severity" ON "external_client_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_client_incidents_status" ON "external_client_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_client_incidents_occurred" ON "external_client_incidents" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_external_clients_agency" ON "external_clients" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_clients_email" ON "external_clients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_external_clients_phone" ON "external_clients" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_external_clients_status" ON "external_clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_external_clients_verified" ON "external_clients" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_external_condominiums_agency" ON "external_condominiums" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_condominiums_active" ON "external_condominiums" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_agency" ON "external_financial_transactions" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_direction" ON "external_financial_transactions" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_category" ON "external_financial_transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_status" ON "external_financial_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_due_date" ON "external_financial_transactions" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_owner" ON "external_financial_transactions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_contract" ON "external_financial_transactions" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_unit" ON "external_financial_transactions" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_payer" ON "external_financial_transactions" USING btree ("payer_role");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_payee" ON "external_financial_transactions" USING btree ("payee_role");--> statement-breakpoint
CREATE INDEX "idx_maintenance_photos_ticket" ON "external_maintenance_photos" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_maintenance_photos_update" ON "external_maintenance_photos" USING btree ("update_id");--> statement-breakpoint
CREATE INDEX "idx_maintenance_photos_phase" ON "external_maintenance_photos" USING btree ("phase");--> statement-breakpoint
CREATE INDEX "idx_external_tickets_agency" ON "external_maintenance_tickets" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_tickets_unit" ON "external_maintenance_tickets" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_external_tickets_property" ON "external_maintenance_tickets" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_external_tickets_status" ON "external_maintenance_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_external_tickets_priority" ON "external_maintenance_tickets" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_external_tickets_assigned" ON "external_maintenance_tickets" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_external_tickets_scheduled" ON "external_maintenance_tickets" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_external_tickets_scheduled_window" ON "external_maintenance_tickets" USING btree ("scheduled_window_start");--> statement-breakpoint
CREATE INDEX "idx_maintenance_updates_ticket" ON "external_maintenance_updates" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_maintenance_updates_created" ON "external_maintenance_updates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ext_notif_agency" ON "external_notifications" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_ext_notif_type" ON "external_notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_ext_notif_priority" ON "external_notifications" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_ext_notif_recipient_user" ON "external_notifications" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "idx_ext_notif_is_read" ON "external_notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_ext_notif_scheduled" ON "external_notifications" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "idx_ext_notif_contract" ON "external_notifications" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_ext_notif_payment" ON "external_notifications" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_ext_notif_ticket" ON "external_notifications" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_external_charges_agency" ON "external_owner_charges" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_charges_owner" ON "external_owner_charges" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_external_charges_unit" ON "external_owner_charges" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_external_charges_status" ON "external_owner_charges" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_external_charges_due_date" ON "external_owner_charges" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_external_notifications_agency" ON "external_owner_notifications" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_notifications_condo" ON "external_owner_notifications" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX "idx_external_notifications_unit" ON "external_owner_notifications" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_external_notifications_owner" ON "external_owner_notifications" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_external_notifications_type" ON "external_owner_notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_external_notifications_read" ON "external_owner_notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_external_schedules_agency" ON "external_payment_schedules" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_schedules_contract" ON "external_payment_schedules" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_external_schedules_active" ON "external_payment_schedules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_external_payments_agency" ON "external_payments" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_payments_contract" ON "external_payments" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_external_payments_status" ON "external_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_external_payments_due_date" ON "external_payments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_external_payments_service_type" ON "external_payments" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "idx_external_properties_agency" ON "external_properties" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_properties_status" ON "external_properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_external_properties_linked" ON "external_properties" USING btree ("linked_property_id");--> statement-breakpoint
CREATE INDEX "idx_external_contracts_agency" ON "external_rental_contracts" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_contracts_unit" ON "external_rental_contracts" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_external_contracts_property" ON "external_rental_contracts" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_external_contracts_client" ON "external_rental_contracts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_external_contracts_status" ON "external_rental_contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_external_contracts_dates" ON "external_rental_contracts" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_external_rental_notes_agency" ON "external_rental_notes" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_rental_notes_contract" ON "external_rental_notes" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_external_rental_notes_type" ON "external_rental_notes" USING btree ("note_type");--> statement-breakpoint
CREATE INDEX "idx_external_rental_notes_created" ON "external_rental_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_external_tenants_contract" ON "external_rental_tenants" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_external_tenants_client" ON "external_rental_tenants" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_external_access_controls_unit" ON "external_unit_access_controls" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_external_access_controls_active" ON "external_unit_access_controls" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_external_unit_owners_unit" ON "external_unit_owners" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_external_unit_owners_active" ON "external_unit_owners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_external_units_agency" ON "external_units" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_units_condominium" ON "external_units" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX "idx_external_units_active" ON "external_units" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_external_worker_assignments_agency" ON "external_worker_assignments" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_worker_assignments_user" ON "external_worker_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_external_worker_assignments_condo" ON "external_worker_assignments" USING btree ("condominium_id");--> statement-breakpoint
CREATE INDEX "idx_external_worker_assignments_unit" ON "external_worker_assignments" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "idx_income_transactions_beneficiary_id" ON "income_transactions" USING btree ("beneficiary_id");--> statement-breakpoint
CREATE INDEX "idx_income_transactions_property_id" ON "income_transactions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_income_transactions_category" ON "income_transactions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_income_transactions_status" ON "income_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_income_transactions_created_at" ON "income_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_income_transactions_status_beneficiary" ON "income_transactions" USING btree ("status","beneficiary_id");--> statement-breakpoint
CREATE INDEX "idx_income_transactions_category_status" ON "income_transactions" USING btree ("category","status");--> statement-breakpoint
CREATE INDEX "idx_properties_status" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_properties_owner_id" ON "properties" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_properties_active" ON "properties" USING btree ("active");--> statement-breakpoint
CREATE INDEX "idx_properties_created_at" ON "properties" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_properties_approval_status" ON "properties" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "idx_properties_featured" ON "properties" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "idx_properties_rating" ON "properties" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_properties_colony_name" ON "properties" USING btree ("colony_name");--> statement-breakpoint
CREATE INDEX "idx_properties_condo_name" ON "properties" USING btree ("condo_name");--> statement-breakpoint
CREATE INDEX "idx_properties_property_type" ON "properties" USING btree ("property_type");--> statement-breakpoint
CREATE INDEX "idx_properties_active_status" ON "properties" USING btree ("active","status");--> statement-breakpoint
CREATE INDEX "idx_properties_active_published" ON "properties" USING btree ("active","published");--> statement-breakpoint
CREATE INDEX "idx_properties_published_featured" ON "properties" USING btree ("published","featured","rating");--> statement-breakpoint
CREATE INDEX "idx_delivery_inventory_contract" ON "property_delivery_inventories" USING btree ("rental_contract_id");--> statement-breakpoint
CREATE INDEX "idx_delivery_inventory_property" ON "property_delivery_inventories" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "idx_rental_payments_contract" ON "rental_payments" USING btree ("rental_contract_id");--> statement-breakpoint
CREATE INDEX "idx_rental_payments_tenant" ON "rental_payments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_rental_payments_status" ON "rental_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rental_payments_service_type" ON "rental_payments" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "idx_rental_payments_due_date" ON "rental_payments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_user_sidebar_visibility" ON "sidebar_menu_visibility_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_maintenance_contract" ON "tenant_maintenance_requests" USING btree ("rental_contract_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_maintenance_tenant" ON "tenant_maintenance_requests" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_maintenance_status" ON "tenant_maintenance_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_move_in_form_contract" ON "tenant_move_in_forms" USING btree ("rental_contract_id");--> statement-breakpoint
CREATE INDEX "idx_move_in_form_tenant" ON "tenant_move_in_forms" USING btree ("tenant_id");