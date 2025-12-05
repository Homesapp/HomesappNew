-- Migration: Update external_lead_status enum with new statuses
-- This migration replaces the old enum values with new ones

-- Step 1: Create new enum type with all new values
CREATE TYPE external_lead_status_v2 AS ENUM (
  'nuevo_lead',
  'opciones_enviadas',
  'cita_coordinada',
  'cita_concretada',
  'cita_cancelada',
  'reprogramar_cita',
  'interesado',
  'oferta_enviada',
  'formato_renta_enviado',
  'proceso_renta',
  'renta_concretada',
  'no_responde',
  'muerto',
  'no_dar_servicio'
);

-- Step 2: Migrate existing data - map old status values to new ones
UPDATE external_leads SET status = 
  CASE status::text
    WHEN 'oferta_completada' THEN 'oferta_enviada'
    WHEN 'formato_enviado' THEN 'formato_renta_enviado'
    WHEN 'formato_completado' THEN 'proceso_renta'
    WHEN 'perdido' THEN 'no_dar_servicio'
    ELSE status::text
  END::external_lead_status;

-- Step 3: Also update status history if needed
UPDATE external_lead_status_history SET status = 
  CASE status::text
    WHEN 'oferta_completada' THEN 'oferta_enviada'
    WHEN 'formato_enviado' THEN 'formato_renta_enviado'
    WHEN 'formato_completado' THEN 'proceso_renta'
    WHEN 'perdido' THEN 'no_dar_servicio'
    ELSE status::text
  END::external_lead_status;

-- Step 4: Alter columns to use new enum type
ALTER TABLE external_leads 
  ALTER COLUMN status TYPE external_lead_status_v2 
  USING status::text::external_lead_status_v2;

ALTER TABLE external_lead_status_history 
  ALTER COLUMN status TYPE external_lead_status_v2 
  USING status::text::external_lead_status_v2;

-- Step 5: Drop old enum and rename new one
DROP TYPE external_lead_status;
ALTER TYPE external_lead_status_v2 RENAME TO external_lead_status;
