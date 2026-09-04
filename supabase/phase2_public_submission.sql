-- ============================================================================
-- HISTORICAL MIGRATION NOTICE: DO NOT RUN THIS FILE IN PRODUCTION!
-- This migration has been SUPERSEDED by:
--   supabase/phase3_safe_reporter_context.sql
-- Rerunning this migration will overwrite the authoritative Phase 3 submission
-- RPC and restore obsolete signatures and tracking PIN logic.
-- ============================================================================
-- Sobaike Janao - Phase 2 Public Complaint Submission Migration & RPC (ARCHIVED)
-- File: supabase/phase2_public_submission.sql
-- 
-- IMPORTANT:
-- This SQL migration file is designed for manual execution in the Supabase SQL
-- Editor by the project owner. It prepares the schema and deploys the secure
-- SECURITY DEFINER RPC function for public complaint submissions.
-- ============================================================================

-- 1. Enable pgcrypto extension for secure PIN hashing (bcrypt via crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Schema Alignment on public.complaints
-- ONLY add the missing approved columns without altering or redefining existing columns
ALTER TABLE public.complaints 
  ADD COLUMN IF NOT EXISTS relationship_context text,
  ADD COLUMN IF NOT EXISTS has_supporting_info boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS client_submission_id text;

-- 3. Idempotency Index
-- Ensures client_submission_id is unique across complaints when non-null
CREATE UNIQUE INDEX IF NOT EXISTS complaints_client_submission_id_idx
  ON public.complaints (client_submission_id)
  WHERE client_submission_id IS NOT NULL;

-- 4. Ensure Row Level Security (RLS) remains enabled on sensitive complaint tables
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_info_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_responses ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing function signature if needed to allow clean recreation
DROP FUNCTION IF EXISTS public.submit_public_complaint(jsonb, text, text);

-- 6. Create Secure SECURITY DEFINER RPC: submit_public_complaint
CREATE OR REPLACE FUNCTION public.submit_public_complaint(
  p_payload jsonb,
  p_client_submission_id text,
  p_tracking_pin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, public, pg_temp
AS $$
DECLARE
  v_client_sub_id text;
  v_clean_pin text;
  v_existing record;
  v_segment text;
  v_subcat_id text;
  v_title text;
  v_description text;
  v_incident_date_raw text;
  v_incident_date date;
  v_incident_time_raw text;
  v_incident_time time;
  v_frequency text;
  v_privacy_choice text;
  v_division text;
  v_district text;
  v_lat double precision;
  v_lng double precision;
  v_publication_prefs jsonb;
  v_evidence_types jsonb;
  v_pin_hash text;
  v_report_id text;
  v_year text;
  v_random_suffix int;
  v_collision_check boolean;
  v_attempts int := 0;
  v_party jsonb;
  v_party_type text;
BEGIN
  -- --------------------------------------------------------------------------
  -- Step 1: Honeypot Anti-Bot Check
  -- Reject immediately if hidden bot fields contain any content
  -- --------------------------------------------------------------------------
  IF (p_payload->>'website' IS NOT NULL AND trim(p_payload->>'website') <> '') OR
     (p_payload->>'honeypot' IS NOT NULL AND trim(p_payload->>'honeypot') <> '') THEN
    RAISE EXCEPTION 'SUBMISSION_REJECTED: The submission could not be accepted.';
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 2: Validate Client Submission ID & Tracking PIN Format
  -- --------------------------------------------------------------------------
  v_client_sub_id := trim(coalesce(p_client_submission_id, ''));
  IF v_client_sub_id = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Client submission identifier is required.';
  END IF;

  v_clean_pin := trim(coalesce(p_tracking_pin, ''));
  IF v_clean_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Tracking PIN must be exactly 6 numeric digits.';
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 3: Idempotency Check
  -- If client_submission_id already exists, verify PIN and return existing report
  -- --------------------------------------------------------------------------
  SELECT id, pin_hash, segment_id, subcategory_id, title, status, created_at
  INTO v_existing
  FROM public.complaints
  WHERE client_submission_id = v_client_sub_id
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    -- Verify provided PIN against the stored bcrypt hash
    IF v_existing.pin_hash IS NOT NULL AND crypt(v_clean_pin, v_existing.pin_hash) = v_existing.pin_hash THEN
      RETURN jsonb_build_object(
        'success', true,
        'reportId', v_existing.id,
        'pin', v_clean_pin,
        'message', 'Report has already been submitted.',
        'report', jsonb_build_object(
          'id', v_existing.id,
          'segment', v_existing.segment_id,
          'subcategoryId', v_existing.subcategory_id,
          'title', v_existing.title,
          'status', v_existing.status,
          'createdAt', to_char(v_existing.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        )
      );
    ELSE
      RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT: Submission ID belongs to an existing report with non-matching credentials.';
    END IF;
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 4: Validate Segment & Subcategory from Database
  -- --------------------------------------------------------------------------
  v_segment := trim(coalesce(p_payload->>'segment', ''));
  IF v_segment = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Valid segment is required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.segments 
    WHERE id = v_segment AND active = true
  ) THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Selected segment is invalid or inactive.';
  END IF;

  v_subcat_id := trim(coalesce(p_payload->>'subcategoryId', ''));
  IF v_subcat_id = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Subcategory is required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.subcategories 
    WHERE id = v_subcat_id 
      AND segment_id = v_segment 
      AND active = true
  ) THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Selected subcategory does not belong to the selected segment or is inactive.';
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 5: Validate Title & Description Lengths
  -- --------------------------------------------------------------------------
  v_title := trim(coalesce(p_payload->>'title', ''));
  IF length(v_title) < 3 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Title is required (at least 3 characters).';
  END IF;

  v_description := trim(coalesce(p_payload->>'description', ''));
  IF length(v_description) < 10 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Description is required (at least 10 characters).';
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 6: Validate and Parse Incident Date & Incident Time
  -- --------------------------------------------------------------------------
  v_incident_date_raw := trim(coalesce(p_payload->>'incidentDate', ''));
  IF v_incident_date_raw = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Incident date is required.';
  END IF;

  BEGIN
    v_incident_date := v_incident_date_raw::date;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Invalid incident date format. Expected YYYY-MM-DD.';
  END;

  v_incident_time_raw := trim(coalesce(p_payload->>'incidentTime', ''));
  IF v_incident_time_raw <> '' THEN
    BEGIN
      v_incident_time := v_incident_time_raw::time;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Invalid incident time format.';
    END;
  ELSE
    v_incident_time := NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 7: Validate Frequency & Privacy Choice
  -- --------------------------------------------------------------------------
  v_frequency := coalesce(nullif(trim(coalesce(p_payload->>'frequency', '')), ''), 'one-time');
  IF v_frequency NOT IN ('one-time', 'repeated') THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Invalid frequency choice. Allowed: one-time, repeated.';
  END IF;

  v_privacy_choice := trim(coalesce(p_payload->>'privacyChoice', 'anonymous'));
  IF v_privacy_choice NOT IN ('anonymous', 'admin_only', 'public_identity') THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Valid reporter privacy choice is required.';
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 8: Validate Location (Division NOT NULL compatibility & District required)
  -- --------------------------------------------------------------------------
  v_division := trim(coalesce(p_payload->'location'->>'division', ''));

  v_district := trim(coalesce(p_payload->'location'->>'district', ''));
  IF v_district = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Location district is required.';
  END IF;

  IF p_payload->'location'->>'lat' IS NOT NULL AND trim(p_payload->'location'->>'lat') <> '' THEN
    BEGIN
      v_lat := (p_payload->'location'->>'lat')::double precision;
    EXCEPTION WHEN OTHERS THEN
      v_lat := NULL;
    END;
  ELSE
    v_lat := NULL;
  END IF;

  IF p_payload->'location'->>'lng' IS NOT NULL AND trim(p_payload->'location'->>'lng') <> '' THEN
    BEGIN
      v_lng := (p_payload->'location'->>'lng')::double precision;
    EXCEPTION WHEN OTHERS THEN
      v_lng := NULL;
    END;
  ELSE
    v_lng := NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 9: Publication Preferences & Evidence Types JSONB Handling
  -- --------------------------------------------------------------------------
  IF p_payload->'publicationPreferences' IS NOT NULL AND jsonb_typeof(p_payload->'publicationPreferences') = 'object' THEN
    v_publication_prefs := p_payload->'publicationPreferences';
  ELSE
    v_publication_prefs := jsonb_build_object(
      'showSubjectName', false,
      'showOrganization', false,
      'showGeneralLocation', true,
      'showDescription', true
    );
  END IF;

  IF p_payload->'evidenceTypes' IS NOT NULL AND jsonb_typeof(p_payload->'evidenceTypes') = 'array' THEN
    v_evidence_types := p_payload->'evidenceTypes';
  ELSE
    v_evidence_types := '[]'::jsonb;
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 10: Hash PIN using pgcrypto (bcrypt with work factor 10)
  -- --------------------------------------------------------------------------
  v_pin_hash := crypt(v_clean_pin, gen_salt('bf', 10));

  -- --------------------------------------------------------------------------
  -- Step 11: Generate Unique Report ID (SJ-{YEAR}-{6 DIGIT NUMBER})
  -- --------------------------------------------------------------------------
  v_year := to_char(now(), 'YYYY');
  LOOP
    v_attempts := v_attempts + 1;
    v_random_suffix := floor(100000 + random() * 900000)::int;
    v_report_id := 'SJ-' || v_year || '-' || v_random_suffix::text;

    SELECT EXISTS (SELECT 1 FROM public.complaints WHERE id = v_report_id)
    INTO v_collision_check;

    IF NOT v_collision_check THEN
      EXIT;
    END IF;

    IF v_attempts >= 50 THEN
      RAISE EXCEPTION 'REPORT_ID_GENERATION_FAILED: Unable to generate a unique report ID after multiple attempts. Please try again.';
    END IF;
  END LOOP;

  -- --------------------------------------------------------------------------
  -- Step 12: Insert Complaint Record
  -- Notice: priority is omitted so the table default 'medium' applies.
  -- --------------------------------------------------------------------------
  INSERT INTO public.complaints (
    id,
    client_submission_id,
    pin_hash,
    segment_id,
    subcategory_id,
    title,
    description,
    incident_date,
    incident_time,
    frequency,
    privacy_choice,
    relationship_context,
    intimate_what_happened,
    intimate_platform,
    division,
    district,
    upazila_or_thana,
    area,
    road,
    landmark,
    formatted_address,
    latitude,
    longitude,
    place_id,
    has_supporting_info,
    evidence_types,
    evidence_description,
    publication_preferences,
    reporter_name,
    reporter_contact,
    confirm_public_identity,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_report_id,
    v_client_sub_id,
    v_pin_hash,
    v_segment,
    v_subcat_id,
    v_title,
    v_description,
    v_incident_date,
    v_incident_time,
    v_frequency,
    v_privacy_choice,
    nullif(trim(coalesce(p_payload->>'relationshipContext', '')), ''),
    p_payload->'intimateWhatHappened',
    p_payload->'intimatePlatform',
    v_division,
    v_district,
    nullif(trim(coalesce(p_payload->'location'->>'upazilaOrThana', '')), ''),
    nullif(trim(coalesce(p_payload->'location'->>'area', '')), ''),
    nullif(trim(coalesce(p_payload->'location'->>'road', '')), ''),
    nullif(trim(coalesce(p_payload->'location'->>'landmark', '')), ''),
    nullif(trim(coalesce(p_payload->'location'->>'formattedAddress', '')), ''),
    v_lat,
    v_lng,
    nullif(trim(coalesce(p_payload->'location'->>'placeId', '')), ''),
    coalesce((p_payload->>'hasSupportingInfo')::boolean, false),
    v_evidence_types,
    nullif(trim(coalesce(p_payload->>'evidenceDescription', '')), ''),
    v_publication_prefs,
    nullif(trim(coalesce(p_payload->'adminContact'->>'name', '')), ''),
    nullif(trim(coalesce(p_payload->'adminContact'->>'contact', '')), ''),
    coalesce((p_payload->'adminContact'->>'consentPublic')::boolean, false),
    'submitted',
    now(),
    now()
  );

  -- --------------------------------------------------------------------------
  -- Step 13: Insert Parties into public.complaint_parties
  -- --------------------------------------------------------------------------
  IF p_payload->'mentionedParties' IS NOT NULL AND 
     jsonb_typeof(p_payload->'mentionedParties') = 'array' AND 
     jsonb_array_length(p_payload->'mentionedParties') > 0 THEN
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_payload->'mentionedParties')
    LOOP
      IF v_party->>'name' IS NOT NULL AND trim(v_party->>'name') <> '' THEN
        v_party_type := trim(coalesce(v_party->>'type', 'unknown'));
        IF v_party_type NOT IN ('individual', 'business', 'group', 'organization', 'unknown') THEN
          v_party_type := 'unknown';
        END IF;

        INSERT INTO public.complaint_parties (
          complaint_id,
          name,
          party_type,
          role_or_designation,
          organization,
          phone_or_contact,
          public_profile_handle,
          address,
          identifying_description,
          created_at
        ) VALUES (
          v_report_id,
          trim(v_party->>'name'),
          v_party_type,
          nullif(trim(coalesce(v_party->>'roleOrDesignation', '')), ''),
          nullif(trim(coalesce(v_party->>'organization', '')), ''),
          nullif(trim(coalesce(v_party->>'phoneOrContact', '')), ''),
          nullif(trim(coalesce(v_party->>'publicProfileHandle', '')), ''),
          nullif(trim(coalesce(v_party->>'address', '')), ''),
          nullif(trim(coalesce(v_party->>'identifyingDescription', '')), ''),
          now()
        );
      END IF;
    END LOOP;
  ELSIF p_payload->>'reportedSubject' IS NOT NULL AND trim(p_payload->>'reportedSubject') <> '' THEN
    v_party_type := trim(coalesce(p_payload->>'subjectType', 'unknown'));
    IF v_party_type NOT IN ('individual', 'business', 'group', 'organization', 'unknown') THEN
      v_party_type := 'unknown';
    END IF;

    INSERT INTO public.complaint_parties (
      complaint_id,
      name,
      party_type,
      role_or_designation,
      organization,
      phone_or_contact,
      public_profile_handle,
      address,
      identifying_description,
      created_at
    ) VALUES (
      v_report_id,
      trim(p_payload->>'reportedSubject'),
      v_party_type,
      nullif(trim(coalesce(p_payload->>'roleOrDesignation', '')), ''),
      nullif(trim(coalesce(p_payload->>'organization', '')), ''),
      nullif(trim(coalesce(p_payload->>'phoneOrContact', '')), ''),
      nullif(trim(coalesce(p_payload->>'publicProfileHandle', '')), ''),
      nullif(trim(coalesce(p_payload->>'address', '')), ''),
      nullif(trim(coalesce(p_payload->>'identifyingDescription', '')), ''),
      now()
    );
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 14: Insert Initial Complaint Update Event (is_public = false)
  -- Uses only existing columns: complaint_id, update_type, note, is_public, created_at
  -- --------------------------------------------------------------------------
  INSERT INTO public.complaint_updates (
    complaint_id,
    update_type,
    note,
    is_public,
    created_at
  ) VALUES (
    v_report_id,
    'submitted',
    'Report received and queued for moderation review.',
    false,
    now()
  );

  -- --------------------------------------------------------------------------
  -- Step 15: Return Standardized Client Response Payload
  -- --------------------------------------------------------------------------
  RETURN jsonb_build_object(
    'success', true,
    'reportId', v_report_id,
    'pin', v_clean_pin,
    'message', 'Report submitted successfully.',
    'report', jsonb_build_object(
      'id', v_report_id,
      'segment', v_segment,
      'subcategoryId', v_subcat_id,
      'title', v_title,
      'status', 'submitted',
      'createdAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  );
END;
$$;

-- 7. Secure Privileges for the RPC
-- Revoke all permissions from PUBLIC to prevent unauthorized schema access
REVOKE ALL ON FUNCTION public.submit_public_complaint(jsonb, text, text) FROM PUBLIC;

-- Grant execute privilege only to anon and authenticated roles for public form submission
GRANT EXECUTE ON FUNCTION public.submit_public_complaint(jsonb, text, text) TO anon, authenticated;

-- ============================================================================
-- End of Phase 2 Migration File
-- ============================================================================

