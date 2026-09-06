-- =============================================================================
-- MIGRATION: Phase 2 - Production Response Hardening
-- File: supabase/create_public_complaint_responses.sql
--
-- Requirements Enforced:
--   1. Transaction-safe migration (BEGIN / COMMIT with pre-commit fail-closed assertions).
--   2. Validates prerequisite complaint infrastructure (public.complaints exists with id, status).
--   3. Idempotent & non-destructive: safe to re-run, protects existing response records.
--   4. Public table `public.complaint_responses` stores both citizen and subject responses.
--   5. Strict Row Level Security (RLS) and revoked raw permissions block direct table access
--      from anon and authenticated users (fail-closed privacy).
--   6. Authoritative RPC:
--        submit_public_response(text, text, jsonb)
--   7. Validates that referenced complaint exists AND status = 'published'.
--   8. Accepts exactly two canonical response types:
--        'citizen_information' and 'subject_response'
--   9. Strict server-side field validation:
--        - Incident date validated (no invalid dates, no future dates).
--        - Contact info cleared to NULL if contact_consent is false.
--        - Subject response required fields and official statement validated.
--        - Correction details cleared to NULL if request_correction_or_removal is false.
--  10. Generates canonical Response IDs: SR-{YEAR}-{6 DIGIT RANDOM NUMBER} with collision retry loop.
--  11. Inserts new responses with status = 'pending_review' and published_at = NULL.
--  12. SECURITY DEFINER with safe fixed search_path = public, pg_temp.
--  13. Comprehensive catalog-based self-verification output.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Step 1: Prerequisite Validation
-- Ensure public.complaints exists and has required id and status columns.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'complaints'
  ) THEN
    RAISE EXCEPTION 'PREREQUISITE_FAILED: public.complaints table does not exist.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'PREREQUISITE_FAILED: public.complaints.id column is missing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'PREREQUISITE_FAILED: public.complaints.status column is missing.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 2: Safe Existing-Table Schema Validation
-- If public.complaint_responses already exists, ensure it is structurally compatible.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_missing_col text;
  v_required_cols text[] := ARRAY[
    'id', 'complaint_id', 'response_type', 'status', 'content',
    'incident_date', 'created_at', 'updated_at', 'published_at',
    'contact_consent', 'contact_info', 'responder_type', 'responder_name',
    'designation', 'organization_name', 'contact_email_or_phone',
    'official_statement', 'supporting_documents_note',
    'request_correction_or_removal', 'correction_details'
  ];
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'complaint_responses'
  ) THEN
    SELECT col INTO v_missing_col
    FROM unnest(v_required_cols) AS col
    WHERE col NOT IN (
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'complaint_responses'
    )
    LIMIT 1;

    IF v_missing_col IS NOT NULL THEN
      RAISE EXCEPTION 'INCOMPATIBLE_EXISTING_TABLE: public.complaint_responses exists but is missing required column "%". Manual review required.', v_missing_col;
    END IF;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 3: Create Table public.complaint_responses (if not already present)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_responses (
  id text PRIMARY KEY,
  complaint_id text NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  response_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending_review',
  content text NOT NULL,
  incident_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,

  -- Citizen information specific fields
  contact_consent boolean NOT NULL DEFAULT false,
  contact_info text,

  -- Subject response specific fields
  responder_type text,
  responder_name text,
  designation text,
  organization_name text,
  contact_email_or_phone text,
  official_statement text,
  supporting_documents_note text,
  request_correction_or_removal boolean NOT NULL DEFAULT false,
  correction_details text
);

-- -----------------------------------------------------------------------------
-- Step 4: Ensure Named Database Constraints
-- Idempotently attach constraints with stable explicit names.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- Constraint: response_type must be one of two canonical types
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_complaint_responses_response_type'
      AND conrelid = 'public.complaint_responses'::regclass
  ) THEN
    ALTER TABLE public.complaint_responses
      ADD CONSTRAINT chk_complaint_responses_response_type
      CHECK (response_type IN ('citizen_information', 'subject_response'));
  END IF;

  -- Constraint: status lifecycle values
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_complaint_responses_status'
      AND conrelid = 'public.complaint_responses'::regclass
  ) THEN
    ALTER TABLE public.complaint_responses
      ADD CONSTRAINT chk_complaint_responses_status
      CHECK (status IN ('pending_review', 'published', 'rejected', 'unpublished'));
  END IF;

  -- Constraint: responder_type values for subject responses
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_complaint_responses_responder_type'
      AND conrelid = 'public.complaint_responses'::regclass
  ) THEN
    ALTER TABLE public.complaint_responses
      ADD CONSTRAINT chk_complaint_responses_responder_type
      CHECK (responder_type IS NULL OR responder_type IN ('mentioned_person', 'organization_rep', 'legal_rep'));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 5: Create Indexes for Query Performance
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_complaint_responses_complaint_id
  ON public.complaint_responses(complaint_id);

CREATE INDEX IF NOT EXISTS idx_complaint_responses_status
  ON public.complaint_responses(status);

CREATE INDEX IF NOT EXISTS idx_complaint_responses_type_status
  ON public.complaint_responses(response_type, status);

-- -----------------------------------------------------------------------------
-- Step 6: Enable Row Level Security (RLS) & Configure Privacy Privileges
-- Fail-closed: raw table access is revoked from PUBLIC, anon, and authenticated.
-- -----------------------------------------------------------------------------
ALTER TABLE public.complaint_responses ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.complaint_responses FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE public.complaint_responses TO service_role;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 7: Check for Conflicting submit_public_response Overloads
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_bad_args text;
BEGIN
  SELECT oidvectortypes(p.proargtypes) INTO v_bad_args
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'submit_public_response'
    AND oidvectortypes(p.proargtypes) <> 'text, text, jsonb'
  LIMIT 1;

  IF v_bad_args IS NOT NULL THEN
    RAISE EXCEPTION 'AMBIGUOUS_FUNCTION_OVERLOAD: Detected existing submit_public_response with conflicting argument types: (%). Expected only (text, text, jsonb). Manual review required.', v_bad_args;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 8: Create/Replace Authoritative Public Submission RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_public_response(
  p_report_id text,
  p_response_type text,
  p_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_report_id text;
  v_complaint_status text;
  v_response_type text;
  v_year text;
  v_response_id text;
  v_attempts int := 0;
  v_collision_check boolean;

  -- Common fields
  v_content text;
  v_incident_date date;
  v_incident_date_text text;

  -- Citizen information fields
  v_contact_consent boolean := false;
  v_contact_info text;

  -- Subject response fields
  v_responder_type text;
  v_responder_name text;
  v_designation text;
  v_organization_name text;
  v_contact_email_or_phone text;
  v_official_statement text;
  v_supporting_documents_note text;
  v_request_correction_or_removal boolean := false;
  v_correction_details text;
BEGIN
  -- -------------------------------------------------------------------------
  -- 1. Validate Target Report Existence & Published Status
  -- -------------------------------------------------------------------------
  v_report_id := nullif(trim(coalesce(p_report_id, '')), '');
  IF v_report_id IS NULL THEN
    RAISE EXCEPTION 'REPORT_ID_REQUIRED: A valid report ID must be provided.';
  END IF;

  SELECT status INTO v_complaint_status
  FROM public.complaints
  WHERE id = v_report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REPORT_NOT_FOUND: Referenced complaint % does not exist.', v_report_id;
  END IF;

  IF v_complaint_status <> 'published' THEN
    RAISE EXCEPTION 'INVALID_REPORT_STATUS: Responses can only be submitted for published complaints. (Current status: %)', v_complaint_status;
  END IF;

  -- -------------------------------------------------------------------------
  -- 2. Validate Response Type
  -- -------------------------------------------------------------------------
  v_response_type := nullif(trim(coalesce(p_response_type, '')), '');
  IF v_response_type IS NULL OR v_response_type NOT IN ('citizen_information', 'subject_response') THEN
    RAISE EXCEPTION 'INVALID_RESPONSE_TYPE: Response type must be citizen_information or subject_response.';
  END IF;

  -- -------------------------------------------------------------------------
  -- 3. Validate Payload According to Canonical Type
  -- -------------------------------------------------------------------------
  IF v_response_type = 'citizen_information' THEN
    -- Citizen Information: content/description required (min 10 chars after trim)
    v_content := nullif(trim(coalesce(p_payload->>'content', p_payload->>'description', '')), '');
    IF v_content IS NULL OR length(v_content) < 10 THEN
      RAISE EXCEPTION 'CONTENT_TOO_SHORT: Description or content must be at least 10 characters.';
    END IF;

    -- Contact Consent & Info
    v_contact_consent := coalesce(
      (p_payload->>'contactConsent')::boolean,
      (p_payload->>'contact_consent')::boolean,
      false
    );

    IF v_contact_consent THEN
      v_contact_info := nullif(trim(coalesce(p_payload->>'contactInfo', p_payload->>'contact_info', '')), '');
    ELSE
      v_contact_info := NULL;
    END IF;

    -- Optional incident date: must be valid date format and cannot be in future
    v_incident_date_text := nullif(trim(coalesce(p_payload->>'incidentDate', p_payload->>'incident_date', p_payload->>'witnessDate', '')), '');
    IF v_incident_date_text IS NOT NULL THEN
      BEGIN
        v_incident_date := v_incident_date_text::date;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'INVALID_INCIDENT_DATE: Provided incident date "%" is not a valid date format (expected YYYY-MM-DD).', v_incident_date_text;
      END;

      IF v_incident_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'FUTURE_INCIDENT_DATE: Incident date cannot be in the future (provided: %, current: %).', v_incident_date, CURRENT_DATE;
      END IF;
    ELSE
      v_incident_date := NULL;
    END IF;

  ELSIF v_response_type = 'subject_response' THEN
    -- Subject Response: responder_type required
    v_responder_type := nullif(trim(coalesce(p_payload->>'responderType', p_payload->>'responder_type', '')), '');
    IF v_responder_type IS NULL OR v_responder_type NOT IN ('mentioned_person', 'organization_rep', 'legal_rep') THEN
      RAISE EXCEPTION 'INVALID_RESPONDER_TYPE: Responder type must be mentioned_person, organization_rep, or legal_rep.';
    END IF;

    -- responder_name required
    v_responder_name := nullif(trim(coalesce(p_payload->>'responderName', p_payload->>'responder_name', '')), '');
    IF v_responder_name IS NULL THEN
      RAISE EXCEPTION 'RESPONDER_NAME_REQUIRED: Responder name is required.';
    END IF;

    -- contact_email_or_phone required
    v_contact_email_or_phone := nullif(trim(coalesce(p_payload->>'contactEmailOrPhone', p_payload->>'contact_email_or_phone', '')), '');
    IF v_contact_email_or_phone IS NULL THEN
      RAISE EXCEPTION 'CONTACT_REQUIRED: Contact email or phone is required.';
    END IF;

    -- official_statement required (min 10 chars after trim)
    v_official_statement := nullif(trim(coalesce(p_payload->>'officialStatement', p_payload->>'official_statement', p_payload->>'content', '')), '');
    IF v_official_statement IS NULL OR length(v_official_statement) < 10 THEN
      RAISE EXCEPTION 'STATEMENT_REQUIRED: Official statement must be at least 10 characters.';
    END IF;
    v_content := v_official_statement;

    -- Optional subject metadata
    v_designation := nullif(trim(coalesce(p_payload->>'designation', '')), '');
    v_organization_name := nullif(trim(coalesce(p_payload->>'organizationName', p_payload->>'organization_name', '')), '');
    v_supporting_documents_note := nullif(trim(coalesce(p_payload->>'supportingDocumentsNote', p_payload->>'supporting_documents_note', '')), '');

    -- Correction / Removal request
    v_request_correction_or_removal := coalesce(
      (p_payload->>'requestCorrectionOrRemoval')::boolean,
      (p_payload->>'request_correction_or_removal')::boolean,
      false
    );

    IF v_request_correction_or_removal THEN
      v_correction_details := nullif(trim(coalesce(p_payload->>'correctionDetails', p_payload->>'correction_details', '')), '');
    ELSE
      v_correction_details := NULL;
    END IF;

    -- Optional incident date for subject response (if provided)
    v_incident_date_text := nullif(trim(coalesce(p_payload->>'incidentDate', p_payload->>'incident_date', '')), '');
    IF v_incident_date_text IS NOT NULL THEN
      BEGIN
        v_incident_date := v_incident_date_text::date;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'INVALID_INCIDENT_DATE: Provided incident date "%" is not a valid date format (expected YYYY-MM-DD).', v_incident_date_text;
      END;

      IF v_incident_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'FUTURE_INCIDENT_DATE: Incident date cannot be in the future (provided: %, current: %).', v_incident_date, CURRENT_DATE;
      END IF;
    ELSE
      v_incident_date := NULL;
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- 4. Generate Unique Response ID: SR-{YEAR}-{6 DIGIT RANDOM NUMBER}
  -- -------------------------------------------------------------------------
  v_year := to_char(now(), 'YYYY');
  LOOP
    v_attempts := v_attempts + 1;
    v_response_id := 'SR-' || v_year || '-' || floor(100000 + random() * 900000)::int::text;

    SELECT EXISTS (SELECT 1 FROM public.complaint_responses WHERE id = v_response_id)
    INTO v_collision_check;

    IF NOT v_collision_check THEN
      EXIT;
    END IF;

    IF v_attempts >= 50 THEN
      RAISE EXCEPTION 'RESPONSE_ID_GENERATION_FAILED: Unable to generate a unique response ID after multiple attempts. Please try again.';
    END IF;
  END LOOP;

  -- -------------------------------------------------------------------------
  -- 5. Insert Record into public.complaint_responses
  -- -------------------------------------------------------------------------
  INSERT INTO public.complaint_responses (
    id,
    complaint_id,
    response_type,
    status,
    content,
    incident_date,
    created_at,
    updated_at,
    published_at,
    contact_consent,
    contact_info,
    responder_type,
    responder_name,
    designation,
    organization_name,
    contact_email_or_phone,
    official_statement,
    supporting_documents_note,
    request_correction_or_removal,
    correction_details
  ) VALUES (
    v_response_id,
    v_report_id,
    v_response_type,
    'pending_review',
    v_content,
    v_incident_date,
    now(),
    now(),
    NULL,
    coalesce(v_contact_consent, false),
    v_contact_info,
    v_responder_type,
    v_responder_name,
    v_designation,
    v_organization_name,
    v_contact_email_or_phone,
    v_official_statement,
    v_supporting_documents_note,
    coalesce(v_request_correction_or_removal, false),
    v_correction_details
  );

  -- -------------------------------------------------------------------------
  -- 6. Return Standardized Client Response Payload
  -- Safe metadata only; never exposes private contact or internal fields.
  -- -------------------------------------------------------------------------
  RETURN jsonb_build_object(
    'success', true,
    'responseId', v_response_id,
    'reportId', v_report_id,
    'status', 'pending_review',
    'message', 'Response submitted successfully.'
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 9: Configure RPC Permissions
-- Revoke all permissions from PUBLIC, grant execution to anon and authenticated.
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.submit_public_response(text, text, jsonb) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT EXECUTE ON FUNCTION public.submit_public_response(text, text, jsonb) TO anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT EXECUTE ON FUNCTION public.submit_public_response(text, text, jsonb) TO authenticated;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 10: Fail-Closed Structural Assertions (Pre-COMMIT)
-- Abort transaction if any critical security, structural, or permission requirement fails.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_has_table boolean;
  v_rls_enabled boolean;
  v_has_rpc boolean;
  v_is_secdef boolean;
  v_search_path text;
  v_anon_execute boolean;
  v_auth_execute boolean;
  v_anon_select boolean;
  v_auth_select boolean;
  v_type_chk boolean;
  v_status_chk boolean;
  v_responder_chk boolean;
  v_idx_comp boolean;
  v_idx_status boolean;
  v_idx_type_status boolean;
BEGIN
  -- 1. Table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'complaint_responses'
  ) INTO v_has_table;
  IF NOT v_has_table THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: public.complaint_responses table does not exist.';
  END IF;

  -- 2. RLS enabled
  SELECT coalesce(relrowsecurity, false) FROM pg_class
  WHERE oid = 'public.complaint_responses'::regclass
  INTO v_rls_enabled;
  IF NOT v_rls_enabled THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: RLS is not enabled on public.complaint_responses.';
  END IF;

  -- 3. Required columns exist
  IF EXISTS (
    SELECT unnest(ARRAY[
      'id', 'complaint_id', 'response_type', 'status', 'content',
      'incident_date', 'created_at', 'updated_at', 'published_at',
      'contact_consent', 'contact_info', 'responder_type', 'responder_name',
      'designation', 'organization_name', 'contact_email_or_phone',
      'official_statement', 'supporting_documents_note',
      'request_correction_or_removal', 'correction_details'
    ])
    EXCEPT
    SELECT column_name::text FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaint_responses'
  ) THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: public.complaint_responses is missing one or more required columns.';
  END IF;

  -- 4. RPC exists with exact signature
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'submit_public_response'
      AND oidvectortypes(p.proargtypes) = 'text, text, jsonb'
  ) INTO v_has_rpc;
  IF NOT v_has_rpc THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: public.submit_public_response(text, text, jsonb) function does not exist.';
  END IF;

  -- 5. RPC is SECURITY DEFINER
  SELECT coalesce(p.prosecdef, false) FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'submit_public_response'
    AND oidvectortypes(p.proargtypes) = 'text, text, jsonb'
  INTO v_is_secdef;
  IF NOT v_is_secdef THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: submit_public_response is not SECURITY DEFINER.';
  END IF;

  -- 6. Safe search_path (public, pg_temp)
  SELECT coalesce(proconfig::text, '') FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'submit_public_response'
    AND oidvectortypes(p.proargtypes) = 'text, text, jsonb'
  INTO v_search_path;
  IF v_search_path NOT LIKE '%search_path=public, pg_temp%' THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: submit_public_response does not have safe search_path (public, pg_temp). Actual: %', v_search_path;
  END IF;

  -- 7 & 8. Anon and authenticated have EXECUTE (if roles exist in environment)
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    SELECT has_function_privilege('anon', 'public.submit_public_response(text, text, jsonb)', 'EXECUTE')
    INTO v_anon_execute;
    IF NOT coalesce(v_anon_execute, false) THEN
      RAISE EXCEPTION 'VERIFICATION_FAILED: anon role does not have EXECUTE privilege on submit_public_response.';
    END IF;

    SELECT has_table_privilege('anon', 'public.complaint_responses', 'SELECT') INTO v_anon_select;
    IF coalesce(v_anon_select, false) THEN
      RAISE EXCEPTION 'VERIFICATION_FAILED: anon has direct SELECT privilege on public.complaint_responses.';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    SELECT has_function_privilege('authenticated', 'public.submit_public_response(text, text, jsonb)', 'EXECUTE')
    INTO v_auth_execute;
    IF NOT coalesce(v_auth_execute, false) THEN
      RAISE EXCEPTION 'VERIFICATION_FAILED: authenticated role does not have EXECUTE privilege on submit_public_response.';
    END IF;

    SELECT has_table_privilege('authenticated', 'public.complaint_responses', 'SELECT') INTO v_auth_select;
    IF coalesce(v_auth_select, false) THEN
      RAISE EXCEPTION 'VERIFICATION_FAILED: authenticated has direct SELECT privilege on public.complaint_responses.';
    END IF;
  END IF;

  -- 9. Constraints exist
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_complaint_responses_response_type'
      AND conrelid = 'public.complaint_responses'::regclass
  ) INTO v_type_chk;
  IF NOT v_type_chk THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: chk_complaint_responses_response_type constraint missing.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_complaint_responses_status'
      AND conrelid = 'public.complaint_responses'::regclass
  ) INTO v_status_chk;
  IF NOT v_status_chk THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: chk_complaint_responses_status constraint missing.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_complaint_responses_responder_type'
      AND conrelid = 'public.complaint_responses'::regclass
  ) INTO v_responder_chk;
  IF NOT v_responder_chk THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: chk_complaint_responses_responder_type constraint missing.';
  END IF;

  -- 10. Required indexes exist
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'complaint_responses' AND indexname = 'idx_complaint_responses_complaint_id'
  ) INTO v_idx_comp;
  IF NOT v_idx_comp THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: idx_complaint_responses_complaint_id index missing.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'complaint_responses' AND indexname = 'idx_complaint_responses_status'
  ) INTO v_idx_status;
  IF NOT v_idx_status THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: idx_complaint_responses_status index missing.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'complaint_responses' AND indexname = 'idx_complaint_responses_type_status'
  ) INTO v_idx_type_status;
  IF NOT v_idx_type_status THEN
    RAISE EXCEPTION 'VERIFICATION_FAILED: idx_complaint_responses_type_status index missing.';
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- Final Verification Output: Catalog-Based Health Check
-- Copy and run directly in Supabase SQL Editor to verify complete status.
-- =============================================================================
SELECT
  check_name,
  result
FROM (
  VALUES
    (
      'response_table',
      CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'complaint_responses'
      ) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'response_rls',
      CASE WHEN coalesce((
        SELECT relrowsecurity FROM pg_class
        WHERE oid = 'public.complaint_responses'::regclass
      ), false) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'response_rpc',
      CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'submit_public_response'
          AND oidvectortypes(p.proargtypes) = 'text, text, jsonb'
      ) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'security_definer',
      CASE WHEN coalesce((
        SELECT p.prosecdef FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'submit_public_response'
          AND oidvectortypes(p.proargtypes) = 'text, text, jsonb'
      ), false) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'safe_search_path',
      CASE WHEN coalesce((
        SELECT proconfig::text FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'submit_public_response'
          AND oidvectortypes(p.proargtypes) = 'text, text, jsonb'
      ), '') LIKE '%search_path=public, pg_temp%' THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'anon_rpc_execute',
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN 'PASS (role not in environment)'
        WHEN has_function_privilege('anon', 'public.submit_public_response(text, text, jsonb)', 'EXECUTE') THEN 'PASS'
        ELSE 'FAIL'
      END
    ),
    (
      'authenticated_rpc_execute',
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN 'PASS (role not in environment)'
        WHEN has_function_privilege('authenticated', 'public.submit_public_response(text, text, jsonb)', 'EXECUTE') THEN 'PASS'
        ELSE 'FAIL'
      END
    ),
    (
      'anon_raw_select_blocked',
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN 'PASS'
        WHEN NOT has_table_privilege('anon', 'public.complaint_responses', 'SELECT') THEN 'PASS'
        ELSE 'FAIL'
      END
    ),
    (
      'authenticated_raw_select_blocked',
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN 'PASS'
        WHEN NOT has_table_privilege('authenticated', 'public.complaint_responses', 'SELECT') THEN 'PASS'
        ELSE 'FAIL'
      END
    ),
    (
      'response_type_constraint',
      CASE WHEN EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_complaint_responses_response_type'
          AND conrelid = 'public.complaint_responses'::regclass
      ) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'response_status_constraint',
      CASE WHEN EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_complaint_responses_status'
          AND conrelid = 'public.complaint_responses'::regclass
      ) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'response_indexes',
      CASE WHEN (
        SELECT count(*) FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'complaint_responses'
          AND indexname IN (
            'idx_complaint_responses_complaint_id',
            'idx_complaint_responses_status',
            'idx_complaint_responses_type_status'
          )
      ) = 3 THEN 'PASS' ELSE 'FAIL' END
    )
) AS t(check_name, result);
