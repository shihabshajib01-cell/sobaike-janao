-- =============================================================================
-- Migration: Phase 3 - Link Safe Reporter Context to Each Complaint
-- Description:
--   1. Creates private `public.complaint_submission_contexts` table to securely
--      store reporter device submission context (GPS, visitor/session IDs, device info).
--   2. Enforces strict Row Level Security (RLS) so reporter context is NEVER
--      accessible by public/anon/authenticated users.
--   3. Updates `submit_public_complaint` RPC with server-side fail-closed validation:
--      - Validates reporter device coordinates (numeric, not 0,0, lat -90..90, lng -180..180, accuracy > 0)
--      - Validates visitor_id and session_id
--      - Atomically links reporter context record to the complaint
--      - Preserves idempotency on retry with client_submission_id
--      - Never compares reporter location with incident location
-- =============================================================================

-- Step 1: Create private complaint_submission_contexts table
CREATE TABLE IF NOT EXISTS public.complaint_submission_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  client_submission_id text NOT NULL,
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  reporter_latitude double precision NOT NULL,
  reporter_longitude double precision NOT NULL,
  accuracy_meters double precision NOT NULL,
  captured_at timestamptz NOT NULL,
  browser_name text,
  browser_version text,
  os_name text,
  device_category text,
  platform text,
  language text,
  timezone text,
  screen_width integer,
  screen_height integer,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT complaint_submission_contexts_complaint_id_key UNIQUE (complaint_id),
  CONSTRAINT complaint_submission_contexts_client_sub_id_key UNIQUE (client_submission_id)
);

-- Coordinate and accuracy constraints
ALTER TABLE public.complaint_submission_contexts
  DROP CONSTRAINT IF EXISTS chk_reporter_lat_range,
  DROP CONSTRAINT IF EXISTS chk_reporter_lng_range,
  DROP CONSTRAINT IF EXISTS chk_reporter_not_zero_zero,
  DROP CONSTRAINT IF EXISTS chk_reporter_accuracy_positive;

ALTER TABLE public.complaint_submission_contexts
  ADD CONSTRAINT chk_reporter_lat_range CHECK (reporter_latitude >= -90.0 AND reporter_latitude <= 90.0),
  ADD CONSTRAINT chk_reporter_lng_range CHECK (reporter_longitude >= -180.0 AND reporter_longitude <= 180.0),
  ADD CONSTRAINT chk_reporter_not_zero_zero CHECK (NOT (reporter_latitude = 0.0 AND reporter_longitude = 0.0)),
  ADD CONSTRAINT chk_reporter_accuracy_positive CHECK (accuracy_meters > 0.0);

-- Indexes for future admin abuse investigation & moderation tooling
CREATE INDEX IF NOT EXISTS idx_submission_contexts_visitor_id ON public.complaint_submission_contexts(visitor_id);
CREATE INDEX IF NOT EXISTS idx_submission_contexts_session_id ON public.complaint_submission_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_submission_contexts_captured_at ON public.complaint_submission_contexts(captured_at);

-- Privacy & Security: Revoke all public direct access. RLS enabled.
ALTER TABLE public.complaint_submission_contexts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.complaint_submission_contexts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.complaint_submission_contexts TO service_role;

-- Step 2: Drop existing function signatures if necessary to allow signature replacement
DROP FUNCTION IF EXISTS public.submit_public_complaint(jsonb, text);
DROP FUNCTION IF EXISTS public.submit_public_complaint(jsonb, text, jsonb);

-- Step 3: Create authoritative submit_public_complaint RPC
CREATE OR REPLACE FUNCTION public.submit_public_complaint(
  p_payload jsonb,
  p_client_submission_id text,
  p_reporter_context jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_sub_id text;
  v_existing record;
  v_report_id text;
  v_year int;
  v_seq_val int;
  v_seq_str text;
  v_segment text;
  v_subcategory text;
  v_title text;
  v_description text;
  v_incident_date date;
  v_incident_time text;
  v_frequency text;
  v_subject_type text;
  v_reported_subject text;
  v_org text;
  v_role text;
  v_location jsonb;
  v_lat double precision;
  v_lng double precision;
  v_area text;
  v_district text;
  v_division text;
  v_address text;
  v_privacy_choice text;
  v_admin_name text;
  v_admin_contact text;
  v_pub_prefs jsonb;
  v_parties jsonb;
  v_party jsonb;
  v_response jsonb;
  v_evidence_types jsonb;
  v_evidence_desc text;

  -- Reporter Submission Context variables
  v_rep_ctx jsonb;
  v_rep_lat double precision;
  v_rep_lng double precision;
  v_rep_accuracy double precision;
  v_rep_captured_at_raw text;
  v_rep_captured_at timestamptz;
  v_rep_visitor_id text;
  v_rep_session_id text;
BEGIN
  -- -------------------------------------------------------------------------
  -- Step 1: Honeypot & Anti-Bot Protection
  -- -------------------------------------------------------------------------
  IF (p_payload->>'website') IS NOT NULL AND trim(p_payload->>'website') <> '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Invalid submission parameters.';
  END IF;

  IF (p_payload->>'hp_comment') IS NOT NULL AND trim(p_payload->>'hp_comment') <> '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Invalid submission parameters.';
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 2: Validate Client Submission ID
  -- -------------------------------------------------------------------------
  v_client_sub_id := trim(coalesce(p_client_submission_id, p_payload->>'client_submission_id', ''));
  IF v_client_sub_id = '' OR length(v_client_sub_id) < 8 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: A valid client_submission_id is required.';
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 3: Extract & Validate Reporter Device Location Context (FAIL CLOSED)
  -- -------------------------------------------------------------------------
  v_rep_ctx := coalesce(p_reporter_context, p_payload->'reporterContext', p_payload->'reporter_context');

  IF v_rep_ctx IS NULL OR jsonb_typeof(v_rep_ctx) <> 'object' THEN
    RAISE EXCEPTION 'REPORTER_LOCATION_REQUIRED: Valid reporter device location is required for platform safety and spam prevention.';
  END IF;

  BEGIN
    v_rep_lat := (v_rep_ctx->>'latitude')::double precision;
    v_rep_lng := (v_rep_ctx->>'longitude')::double precision;
    v_rep_accuracy := coalesce(
      (v_rep_ctx->>'accuracy_meters')::double precision,
      (v_rep_ctx->>'accuracyMeters')::double precision,
      (v_rep_ctx->>'accuracy')::double precision
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'INVALID_REPORTER_COORDINATES: Reporter latitude, longitude, and accuracy must be valid numbers.';
  END;

  IF v_rep_lat IS NULL OR v_rep_lng IS NULL OR v_rep_accuracy IS NULL THEN
    RAISE EXCEPTION 'REPORTER_LOCATION_REQUIRED: Numeric reporter coordinates and accuracy are required.';
  END IF;

  IF v_rep_lat < -90.0 OR v_rep_lat > 90.0 THEN
    RAISE EXCEPTION 'INVALID_REPORTER_COORDINATES: Reporter latitude must be between -90 and 90 degrees.';
  END IF;

  IF v_rep_lng < -180.0 OR v_rep_lng > 180.0 THEN
    RAISE EXCEPTION 'INVALID_REPORTER_COORDINATES: Reporter longitude must be between -180 and 180 degrees.';
  END IF;

  IF v_rep_lat = 0.0 AND v_rep_lng = 0.0 THEN
    RAISE EXCEPTION 'INVALID_REPORTER_COORDINATES: Reporter coordinates cannot be exactly 0,0.';
  END IF;

  IF v_rep_accuracy <= 0.0 THEN
    RAISE EXCEPTION 'INVALID_REPORTER_ACCURACY: Reporter accuracy must be a positive number.';
  END IF;

  v_rep_captured_at_raw := coalesce(v_rep_ctx->>'captured_at', v_rep_ctx->>'capturedAt');
  IF v_rep_captured_at_raw IS NOT NULL AND trim(v_rep_captured_at_raw) <> '' THEN
    BEGIN
      v_rep_captured_at := v_rep_captured_at_raw::timestamptz;
    EXCEPTION WHEN OTHERS THEN
      v_rep_captured_at := now();
    END;
  ELSE
    v_rep_captured_at := now();
  END IF;

  v_rep_visitor_id := trim(coalesce(v_rep_ctx->>'visitor_id', v_rep_ctx->>'visitorId', ''));
  v_rep_session_id := trim(coalesce(v_rep_ctx->>'session_id', v_rep_ctx->>'sessionId', ''));

  IF v_rep_visitor_id = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Visitor identifier is required.';
  END IF;

  IF v_rep_session_id = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Session identifier is required.';
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 4: Idempotency Check
  -- -------------------------------------------------------------------------
  SELECT id, segment_id, subcategory_id, title, status, created_at
  INTO v_existing
  FROM public.complaints
  WHERE client_submission_id = v_client_sub_id
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    -- Ensure reporter context is safely linked on retry without creating duplicates
    INSERT INTO public.complaint_submission_contexts (
      complaint_id,
      client_submission_id,
      visitor_id,
      session_id,
      reporter_latitude,
      reporter_longitude,
      accuracy_meters,
      captured_at,
      browser_name,
      browser_version,
      os_name,
      device_category,
      platform,
      language,
      timezone,
      screen_width,
      screen_height,
      user_agent,
      created_at
    ) VALUES (
      v_existing.id,
      v_client_sub_id,
      v_rep_visitor_id,
      v_rep_session_id,
      v_rep_lat,
      v_rep_lng,
      v_rep_accuracy,
      v_rep_captured_at,
      nullif(trim(coalesce(v_rep_ctx->>'browser_name', v_rep_ctx->>'browserName', '')), ''),
      nullif(trim(coalesce(v_rep_ctx->>'browser_version', v_rep_ctx->>'browserVersion', '')), ''),
      nullif(trim(coalesce(v_rep_ctx->>'os_name', v_rep_ctx->>'osName', '')), ''),
      nullif(trim(coalesce(v_rep_ctx->>'device_category', v_rep_ctx->>'deviceCategory', '')), ''),
      nullif(trim(coalesce(v_rep_ctx->>'platform', '')), ''),
      nullif(trim(coalesce(v_rep_ctx->>'language', '')), ''),
      nullif(trim(coalesce(v_rep_ctx->>'timezone', '')), ''),
      (v_rep_ctx->>'screen_width')::int,
      (v_rep_ctx->>'screen_height')::int,
      nullif(trim(coalesce(v_rep_ctx->>'user_agent', v_rep_ctx->>'userAgent', '')), ''),
      now()
    )
    ON CONFLICT (client_submission_id) DO NOTHING;

    RETURN jsonb_build_object(
      'success', true,
      'reportId', v_existing.id,
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
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 5: Validate Incident Complaint Payload
  -- -------------------------------------------------------------------------
  v_segment := trim(coalesce(p_payload->>'segment', ''));
  v_subcategory := trim(coalesce(p_payload->>'subcategoryId', p_payload->>'subcategory_id', ''));
  v_title := trim(coalesce(p_payload->>'title', ''));
  v_description := trim(coalesce(p_payload->>'description', ''));

  IF v_segment NOT IN ('harassment', 'rickshaw', 'extortion') THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Invalid segment %', v_segment;
  END IF;

  IF v_subcategory = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Subcategory is required.';
  END IF;

  IF v_title = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Title is required.';
  END IF;

  IF v_description = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Description is required.';
  END IF;

  IF length(v_description) > 2000 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Description exceeds maximum allowed length of 2000 characters.';
  END IF;

  -- Incident date
  BEGIN
    v_incident_date := (p_payload->>'incidentDate')::date;
  EXCEPTION WHEN OTHERS THEN
    v_incident_date := CURRENT_DATE;
  END IF;
  IF v_incident_date IS NULL THEN
    v_incident_date := CURRENT_DATE;
  END IF;

  v_incident_time := nullif(trim(coalesce(p_payload->>'incidentTime', '')), '');
  v_frequency := coalesce(p_payload->>'frequency', 'one-time');
  IF v_frequency NOT IN ('one-time', 'repeated') THEN
    v_frequency := 'one-time';
  END IF;

  v_subject_type := coalesce(p_payload->>'subjectType', 'individual');
  v_reported_subject := nullif(trim(coalesce(p_payload->>'reportedSubject', '')), '');
  v_org := nullif(trim(coalesce(p_payload->>'organization', '')), '');
  v_role := nullif(trim(coalesce(p_payload->>'roleOrDesignation', '')), '');

  -- Incident Location Coordinates (Distinct from reporter device coordinates)
  v_location := p_payload->'location';
  IF v_location IS NOT NULL THEN
    v_lat := (v_location->>'lat')::double precision;
    v_lng := (v_location->>'lng')::double precision;
    v_area := nullif(trim(coalesce(v_location->>'area', '')), '');
    v_district := nullif(trim(coalesce(v_location->>'district', '')), '');
    v_division := nullif(trim(coalesce(v_location->>'division', '')), '');
    v_address := nullif(trim(coalesce(v_location->>'formattedAddress', '')), '');
  END IF;

  IF v_lat IS NULL OR v_lng IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Incident location coordinates (lat, lng) are required.';
  END IF;

  IF v_lat < -90.0 OR v_lat > 90.0 OR v_lng < -180.0 OR v_lng > 180.0 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Incident coordinates out of bounds.';
  END IF;

  IF v_lat = 0.0 AND v_lng = 0.0 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Incident coordinates cannot be 0,0.';
  END IF;

  v_privacy_choice := coalesce(p_payload->>'privacyChoice', 'anonymous');
  IF v_privacy_choice NOT IN ('anonymous', 'admin_only', 'public_identity') THEN
    v_privacy_choice := 'anonymous';
  END IF;

  v_admin_name := nullif(trim(coalesce(p_payload->>'adminName', '')), '');
  v_admin_contact := nullif(trim(coalesce(p_payload->>'adminContact', '')), '');
  v_pub_prefs := coalesce(p_payload->'publicationPreferences', '{}'::jsonb);
  v_evidence_types := coalesce(p_payload->'evidenceTypes', '[]'::jsonb);
  v_evidence_desc := nullif(trim(coalesce(p_payload->>'evidenceDescription', '')), '');

  -- -------------------------------------------------------------------------
  -- Step 6: Generate Sequential Report ID (SJ-YYYY-XXXXXX)
  -- -------------------------------------------------------------------------
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::int;
  v_seq_val := nextval('public.complaint_id_seq');
  v_seq_str := lpad(v_seq_val::text, 6, '0');
  v_report_id := 'SJ-' || v_year::text || '-' || v_seq_str;

  -- -------------------------------------------------------------------------
  -- Step 7: Insert into Complaints Table (Public incident coordinates)
  -- -------------------------------------------------------------------------
  INSERT INTO public.complaints (
    id,
    client_submission_id,
    segment_id,
    subcategory_id,
    title,
    description,
    incident_date,
    incident_time,
    frequency,
    subject_type,
    reported_subject,
    organization,
    role_or_designation,
    latitude,
    longitude,
    area,
    district,
    division,
    formatted_address,
    privacy_choice,
    admin_name,
    admin_contact,
    publication_preferences,
    evidence_types,
    evidence_description,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_report_id,
    v_client_sub_id,
    v_segment,
    v_subcategory,
    v_title,
    v_description,
    v_incident_date,
    v_incident_time,
    v_frequency,
    v_subject_type,
    v_reported_subject,
    v_org,
    v_role,
    v_lat,
    v_lng,
    v_area,
    v_district,
    v_division,
    v_address,
    v_privacy_choice,
    v_admin_name,
    v_admin_contact,
    v_pub_prefs,
    v_evidence_types,
    v_evidence_desc,
    'submitted',
    now(),
    now()
  );

  -- -------------------------------------------------------------------------
  -- Step 8: Insert Reporter Device Submission Context (Private admin data)
  -- -------------------------------------------------------------------------
  INSERT INTO public.complaint_submission_contexts (
    complaint_id,
    client_submission_id,
    visitor_id,
    session_id,
    reporter_latitude,
    reporter_longitude,
    accuracy_meters,
    captured_at,
    browser_name,
    browser_version,
    os_name,
    device_category,
    platform,
    language,
    timezone,
    screen_width,
    screen_height,
    user_agent,
    created_at
  ) VALUES (
    v_report_id,
    v_client_sub_id,
    v_rep_visitor_id,
    v_rep_session_id,
    v_rep_lat,
    v_rep_lng,
    v_rep_accuracy,
    v_rep_captured_at,
    nullif(trim(coalesce(v_rep_ctx->>'browser_name', v_rep_ctx->>'browserName', '')), ''),
    nullif(trim(coalesce(v_rep_ctx->>'browser_version', v_rep_ctx->>'browserVersion', '')), ''),
    nullif(trim(coalesce(v_rep_ctx->>'os_name', v_rep_ctx->>'osName', '')), ''),
    nullif(trim(coalesce(v_rep_ctx->>'device_category', v_rep_ctx->>'deviceCategory', '')), ''),
    nullif(trim(coalesce(v_rep_ctx->>'platform', '')), ''),
    nullif(trim(coalesce(v_rep_ctx->>'language', '')), ''),
    nullif(trim(coalesce(v_rep_ctx->>'timezone', '')), ''),
    (v_rep_ctx->>'screen_width')::int,
    (v_rep_ctx->>'screen_height')::int,
    nullif(trim(coalesce(v_rep_ctx->>'user_agent', v_rep_ctx->>'userAgent', '')), ''),
    now()
  );

  -- -------------------------------------------------------------------------
  -- Step 9: Insert Mentioned Parties if Provided
  -- -------------------------------------------------------------------------
  v_parties := p_payload->'mentionedParties';
  IF v_parties IS NOT NULL AND jsonb_typeof(v_parties) = 'array' THEN
    FOR v_party IN SELECT * FROM jsonb_array_elements(v_parties)
    LOOP
      IF trim(coalesce(v_party->>'name', '')) <> '' THEN
        INSERT INTO public.complaint_parties (
          complaint_id,
          name,
          role_or_designation,
          organization,
          phone_or_contact,
          public_profile_handle,
          party_type,
          created_at
        ) VALUES (
          v_report_id,
          trim(v_party->>'name'),
          nullif(trim(coalesce(v_party->>'roleOrDesignation', '')), ''),
          nullif(trim(coalesce(v_party->>'organization', '')), ''),
          nullif(trim(coalesce(v_party->>'phoneOrContact', '')), ''),
          nullif(trim(coalesce(v_party->>'publicProfileHandle', '')), ''),
          coalesce(v_party->>'type', 'individual'),
          now()
        );
      END IF;
    END LOOP;
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 10: Insert Initial Status History
  -- -------------------------------------------------------------------------
  INSERT INTO public.complaint_updates (
    complaint_id,
    previous_status,
    new_status,
    note_en,
    note_bn,
    actor,
    created_at
  ) VALUES (
    v_report_id,
    NULL,
    'submitted',
    'Complaint received and queued for review.',
    'অভিযোগ জমা হয়েছে এবং পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে।',
    'system',
    now()
  );

  -- -------------------------------------------------------------------------
  -- Step 11: Return Standardized Client Response Payload
  -- -------------------------------------------------------------------------
  v_response := jsonb_build_object(
    'success', true,
    'reportId', v_report_id,
    'message', 'Report submitted successfully.',
    'report', jsonb_build_object(
      'id', v_report_id,
      'segment', v_segment,
      'subcategoryId', v_subcategory,
      'title', v_title,
      'status', 'submitted',
      'createdAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  );

  RETURN v_response;
END;
$$;

-- Revoke all permissions from public, then grant execute to anon and authenticated
REVOKE ALL ON FUNCTION public.submit_public_complaint(jsonb, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_complaint(jsonb, text, jsonb) TO anon, authenticated;
