-- =============================================================================
-- MIGRATION: Phase 2 - Create public.complaint_responses & public.submit_public_response
-- File: supabase/create_public_complaint_responses.sql
--
-- Requirements Enforced:
--   1. Public table `public.complaint_responses` to store citizen and subject responses.
--   2. Strict Row Level Security (RLS) ensures response records and private contact info
--      are NEVER readable via raw anon/public SELECT.
--   3. Authoritative RPC:
--        submit_public_response(text, text, jsonb)
--   4. Validates that referenced complaint exists AND status = 'published'.
--   5. Accepts exactly two canonical response types:
--        'citizen_information' and 'subject_response'
--   6. Enforces server-side field validation and minimum character lengths.
--   7. Generates canonical Response IDs: SR-{YEAR}-{6 DIGIT RANDOM NUMBER}.
--   8. Inserts new responses with status = 'pending_review'.
--   9. SECURITY DEFINER with fixed search_path = public, pg_temp.
-- =============================================================================

-- Step 1: Create Table public.complaint_responses
CREATE TABLE IF NOT EXISTS public.complaint_responses (
  id text PRIMARY KEY,
  complaint_id text NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  response_type text NOT NULL CHECK (response_type IN ('citizen_information', 'subject_response')),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'published', 'rejected', 'unpublished')),
  content text NOT NULL,
  incident_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,

  -- Citizen information specific fields
  contact_consent boolean NOT NULL DEFAULT false,
  contact_info text,

  -- Subject response specific fields
  responder_type text CHECK (responder_type IS NULL OR responder_type IN ('mentioned_person', 'organization_rep', 'legal_rep')),
  responder_name text,
  designation text,
  organization_name text,
  contact_email_or_phone text,
  official_statement text,
  supporting_documents_note text,
  request_correction_or_removal boolean NOT NULL DEFAULT false,
  correction_details text
);

-- Step 2: Create Indexes
CREATE INDEX IF NOT EXISTS idx_complaint_responses_complaint_id
  ON public.complaint_responses(complaint_id);

CREATE INDEX IF NOT EXISTS idx_complaint_responses_status
  ON public.complaint_responses(status);

CREATE INDEX IF NOT EXISTS idx_complaint_responses_type_status
  ON public.complaint_responses(response_type, status);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.complaint_responses ENABLE ROW LEVEL SECURITY;

-- Block raw table access from anon and authenticated users (fail-closed privacy)
-- All public interaction MUST occur through the authoritative SECURITY DEFINER RPC.
REVOKE ALL ON TABLE public.complaint_responses FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.complaint_responses TO service_role;

-- Step 4: Create Authoritative Public Submission RPC
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
    -- Citizen Information: content required (min 10 characters)
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

    -- Optional incident date
    v_incident_date_text := nullif(trim(coalesce(p_payload->>'incidentDate', p_payload->>'incident_date', p_payload->>'witnessDate', '')), '');
    IF v_incident_date_text IS NOT NULL THEN
      BEGIN
        v_incident_date := v_incident_date_text::date;
      EXCEPTION WHEN OTHERS THEN
        v_incident_date := NULL;
      END;
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

    -- official_statement required (min 10 chars)
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

-- Step 5: Configure Permissions
REVOKE ALL ON FUNCTION public.submit_public_response(text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_response(text, text, jsonb) TO anon, authenticated;
