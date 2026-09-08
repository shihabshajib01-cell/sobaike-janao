-- =============================================================================
-- Migration: Fix Primary Complaint Party Persistence
-- File: supabase/fix_primary_complaint_party_persistence.sql
--
-- Description:
--   1. Ensures public.complaint_parties.name is nullable so useful structured
--      party info (contact, identifying description, role, etc.) can be stored
--      even when the specific person/business name is unknown.
--   2. Historical complaint submission RPC superseded by:
--      supabase/phase3_safe_reporter_context.sql
-- =============================================================================

-- Step 1: Ensure name in public.complaint_parties is nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'complaint_parties' 
      AND column_name = 'name'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.complaint_parties ALTER COLUMN name DROP NOT NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 2: Complaint Submission RPC (Superseded)
-- -----------------------------------------------------------------------------
-- Submission RPC definition removed.
-- Authoritative submit_public_complaint(jsonb, text, jsonb)
-- is maintained in supabase/phase3_safe_reporter_context.sql.
-- Running this historical migration must not downgrade the current RPC.
