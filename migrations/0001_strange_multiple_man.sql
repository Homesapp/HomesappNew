CREATE TYPE "public"."lead_registration_type" AS ENUM('broker', 'seller');--> statement-breakpoint
ALTER TYPE "public"."external_contract_status" ADD VALUE 'pending_validation' BEFORE 'active';--> statement-breakpoint
ALTER TYPE "public"."external_contract_status" ADD VALUE 'documents_validated' BEFORE 'active';--> statement-breakpoint
ALTER TYPE "public"."external_contract_status" ADD VALUE 'contract_uploaded' BEFORE 'active';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'external_agency_seller';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'tenant';--> statement-breakpoint
CREATE TABLE "external_lead_registration_tokens" (
	"id" varchar PRIMARY KEY NOT NULL,
	"token" varchar NOT NULL,
	"agency_id" varchar NOT NULL,
	"agency_name" varchar(255) NOT NULL,
	"registration_type" "lead_registration_type" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"lead_id" varchar,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "external_lead_registration_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "external_leads" (
	"id" varchar PRIMARY KEY NOT NULL,
	"agency_id" varchar NOT NULL,
	"registration_type" "lead_registration_type" NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"phone_last_4" varchar(4),
	"contract_duration" integer,
	"check_in_date" date,
	"allows_pets" boolean DEFAULT false,
	"estimated_rent_cost" numeric(10, 2),
	"bedrooms_desired" integer,
	"unit_type_desired" varchar(100),
	"neighborhood_desired" varchar(200),
	"notes" text,
	"status" varchar(50) DEFAULT 'new' NOT NULL,
	"converted_to_client_id" varchar,
	"converted_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_rental_form_data" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" varchar NOT NULL,
	"external_unit_id" varchar,
	"external_unit_owner_id" varchar,
	"rental_form_group_id" varchar,
	"full_name" text NOT NULL,
	"nationality" varchar,
	"phone_number" varchar,
	"whatsapp_number" varchar,
	"email" varchar NOT NULL,
	"subleasing_allowed" boolean DEFAULT false,
	"property_address" text,
	"subdivision" varchar,
	"unit_number" varchar,
	"agreed_rent" numeric(12, 2),
	"agreed_deposit" numeric(12, 2),
	"move_in_date" timestamp,
	"contract_duration" varchar,
	"services_included" text[],
	"services_not_included" text[],
	"pets_allowed" boolean DEFAULT false,
	"special_notes" text,
	"bank_name" varchar,
	"interbank_code" varchar,
	"account_or_card_number" varchar,
	"account_holder_name" varchar,
	"swift_code" varchar,
	"bank_address" text,
	"bank_email" varchar,
	"id_document_url" text,
	"constitutive_act_url" text,
	"property_documents_urls" text[],
	"service_receipts_urls" text[],
	"no_debt_proof_urls" text[],
	"services_format_url" text,
	"internal_rules_url" text,
	"condo_regulations_url" text,
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
ALTER TABLE "external_rental_contracts" ALTER COLUMN "status" SET DEFAULT 'pending_validation';--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "rental_form_group_id" varchar;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "tenant_docs_validated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "owner_docs_validated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "tenant_docs_validated_by" varchar;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "owner_docs_validated_by" varchar;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "tenant_docs_validated_at" timestamp;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "owner_docs_validated_at" timestamp;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "elaborated_contract_url" text;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "elaborated_contract_uploaded_by" varchar;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "elaborated_contract_uploaded_at" timestamp;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD COLUMN "cancelled_by" varchar;--> statement-breakpoint
ALTER TABLE "tenant_rental_form_tokens" ADD COLUMN "recipient_type" varchar(20) DEFAULT 'tenant' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_rental_form_tokens" ADD COLUMN "rental_form_group_id" varchar;--> statement-breakpoint
ALTER TABLE "tenant_rental_form_tokens" ADD COLUMN "external_unit_owner_id" varchar;--> statement-breakpoint
ALTER TABLE "tenant_rental_form_tokens" ADD COLUMN "tenant_data" jsonb;--> statement-breakpoint
ALTER TABLE "tenant_rental_form_tokens" ADD COLUMN "owner_data" jsonb;--> statement-breakpoint
ALTER TABLE "external_lead_registration_tokens" ADD CONSTRAINT "external_lead_registration_tokens_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_lead_registration_tokens" ADD CONSTRAINT "external_lead_registration_tokens_lead_id_external_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."external_leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_lead_registration_tokens" ADD CONSTRAINT "external_lead_registration_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_leads" ADD CONSTRAINT "external_leads_agency_id_external_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."external_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_leads" ADD CONSTRAINT "external_leads_converted_to_client_id_external_clients_id_fk" FOREIGN KEY ("converted_to_client_id") REFERENCES "public"."external_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_leads" ADD CONSTRAINT "external_leads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_rental_form_data" ADD CONSTRAINT "owner_rental_form_data_token_id_tenant_rental_form_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."tenant_rental_form_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_rental_form_data" ADD CONSTRAINT "owner_rental_form_data_external_unit_id_external_units_id_fk" FOREIGN KEY ("external_unit_id") REFERENCES "public"."external_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_rental_form_data" ADD CONSTRAINT "owner_rental_form_data_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_external_lead_reg_tokens_agency" ON "external_lead_registration_tokens" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_lead_reg_tokens_expires" ON "external_lead_registration_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_external_lead_reg_tokens_completed" ON "external_lead_registration_tokens" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "idx_external_leads_agency" ON "external_leads" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_external_leads_status" ON "external_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_external_leads_registration_type" ON "external_leads" USING btree ("registration_type");--> statement-breakpoint
CREATE INDEX "idx_external_leads_converted" ON "external_leads" USING btree ("converted_to_client_id");--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD CONSTRAINT "external_rental_contracts_tenant_docs_validated_by_users_id_fk" FOREIGN KEY ("tenant_docs_validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD CONSTRAINT "external_rental_contracts_owner_docs_validated_by_users_id_fk" FOREIGN KEY ("owner_docs_validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD CONSTRAINT "external_rental_contracts_elaborated_contract_uploaded_by_users_id_fk" FOREIGN KEY ("elaborated_contract_uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD CONSTRAINT "external_rental_contracts_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_external_contracts_rental_form_group" ON "external_rental_contracts" USING btree ("rental_form_group_id");--> statement-breakpoint
ALTER TABLE "external_rental_contracts" ADD CONSTRAINT "unique_rental_form_group_id" UNIQUE("rental_form_group_id");