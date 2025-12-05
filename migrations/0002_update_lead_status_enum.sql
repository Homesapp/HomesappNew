-- Migration: Update external_leads status values from old to new
-- This migration updates the text status values in the database

-- Map old status values to new ones
UPDATE external_leads SET status = 
  CASE status
    WHEN 'oferta_completada' THEN 'oferta_enviada'
    WHEN 'formato_enviado' THEN 'formato_renta_enviado'
    WHEN 'formato_completado' THEN 'proceso_renta'
    WHEN 'perdido' THEN 'no_dar_servicio'
    ELSE status
  END
WHERE status IN ('oferta_completada', 'formato_enviado', 'formato_completado', 'perdido');

-- Also update status history table
UPDATE external_lead_status_history SET status = 
  CASE status
    WHEN 'oferta_completada' THEN 'oferta_enviada'
    WHEN 'formato_enviado' THEN 'formato_renta_enviado'
    WHEN 'formato_completado' THEN 'proceso_renta'
    WHEN 'perdido' THEN 'no_dar_servicio'
    ELSE status
  END
WHERE status IN ('oferta_completada', 'formato_enviado', 'formato_completado', 'perdido');
