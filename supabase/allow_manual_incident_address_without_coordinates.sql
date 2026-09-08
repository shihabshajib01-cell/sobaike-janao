-- =============================================================================
-- Migration: Allow Manual Incident Address Without Coordinates
-- File: supabase/allow_manual_incident_address_without_coordinates.sql
--
-- Description:
--   1. Ensures public.complaints.latitude and public.complaints.longitude are nullable,
--      allowing manual-address-only citizen incident location entry.
--   2. Historical complaint submission RPC superseded by:
--      supabase/phase3_safe_reporter_context.sql
-- =============================================================================

-- Step 1: Ensure latitude and longitude in public.complaints are nullable (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'complaints' 
      AND column_name = 'latitude'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.complaints ALTER COLUMN latitude DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'complaints' 
      AND column_name = 'longitude'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.complaints ALTER COLUMN longitude DROP NOT NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 2: Complaint Submission RPC (Superseded)
-- -----------------------------------------------------------------------------
-- Submission RPC definition removed.
-- Authoritative submit_public_complaint(jsonb, text, jsonb)
-- is maintained in supabase/phase3_safe_reporter_context.sql.
-- Running this historical migration must not downgrade the current RPC.
