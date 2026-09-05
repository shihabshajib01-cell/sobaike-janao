-- =============================================================================
-- AUTHORITATIVE MIGRATION: Phase 3 - Link Safe Reporter Context to Each Complaint
-- File: supabase/phase3_safe_reporter_context.sql
-- 
-- NOTICE:
-- This is the FINAL and AUTHORITATIVE public complaint submission migration.
-- It supersedes and replaces:
--   - supabase/phase2_public_submission.sql (ARCHIVED)
--   - supabase/remove_public_tracking.sql (ARCHIVED)
-- Older migrations must NOT be rerun after this migration.
--
-- Requirements Enforced:
--   1. Private `public.complaint_submission_contexts` table stores reporter GPS,
--      visitor/session IDs, and device info.
--   2. Strict Row Level Security (RLS) ensures reporter context is NEVER accessible
--      by public, anon, or authenticated users (service_role only).
--   3. Authoritative 3-argument signature:
--        submit_public_complaint(jsonb, text, jsonb)
--      All obsolete 2-argument and PIN signatures are permanently dropped.
--   4. Reporter device location is mandatory and validated server-side.
--   5. Reporter device location is strictly private and NEVER exposed in public feeds/RPCs.
--   6. Admin contact payload mismatch resolved: reads adminContact.name,
--      adminContact.contact, and adminContact.consentPublic safely.
--   7. Idempotency on retry via client_submission_id remains safe and duplicate-free.
--   8. Anonymous complaint submission, evidence flow, and moderation remain intact.
-- =============================================================================

-- Step 1: Schema alignment on public.complaints
DO $$
BEGIN
  -- If legacy pin_hash column exists from older installations, ensure it is nullable
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'complaints' 
      AND column_name = 'pin_hash'
  ) THEN
    ALTER TABLE public.complaints ALTER COLUMN pin_hash DROP NOT NULL;
  END IF;

  -- Ensure complaint_parties.name is nullable when table exists
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

ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS relationship_context text,
  ADD COLUMN IF NOT EXISTS has_supporting_info boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS client_submission_id text,
  ADD COLUMN IF NOT EXISTS reporter_name text,
  ADD COLUMN IF NOT EXISTS reporter_contact text,
  ADD COLUMN IF NOT EXISTS confirm_public_identity boolean DEFAULT false;

-- Ensure idempotency index exists
CREATE UNIQUE INDEX IF NOT EXISTS complaints_client_submission_id_idx
  ON public.complaints (client_submission_id)
  WHERE client_submission_id IS NOT NULL;

-- Step 2: Create private complaint_submission_contexts table
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

-- Indexes for admin moderation and abuse investigation tooling
CREATE INDEX IF NOT EXISTS idx_submission_contexts_visitor_id ON public.complaint_submission_contexts(visitor_id);
CREATE INDEX IF NOT EXISTS idx_submission_contexts_session_id ON public.complaint_submission_contexts(session_id);
CREATE INDEX IF NOT EXISTS idx_submission_contexts_captured_at ON public.complaint_submission_contexts(captured_at);

-- Privacy & Security: Revoke all public direct access. RLS enabled.
ALTER TABLE public.complaint_submission_contexts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.complaint_submission_contexts FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.complaint_submission_contexts TO service_role;

-- Step 3: Drop all obsolete function signatures
DROP FUNCTION IF EXISTS public.submit_public_complaint(jsonb, text);
DROP FUNCTION IF EXISTS public.submit_public_complaint(jsonb, text, text);
DROP FUNCTION IF EXISTS public.submit_public_complaint(jsonb, text, jsonb);

-- Step 4: Create authoritative submit_public_complaint RPC (3 arguments)
CREATE OR REPLACE FUNCTION public.submit_public_complaint(
  p_payload jsonb,
  p_client_submission_id text,
  p_reporter_context jsonb
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
  v_year text;
  v_attempts int := 0;
  v_random_suffix int;
  v_collision_check boolean;
  v_segment text;
  v_subcategory text;
  v_title text;
  v_description text;
  v_incident_date date;
  v_incident_time time without time zone;
  v_frequency text;
  v_location jsonb;
  v_lat double precision;
  v_lng double precision;
  v_division text;
  v_district text;
  v_upazila text;
  v_area text;
  v_road text;
  v_landmark text;
  v_address text;
  v_place_id text;
  v_privacy_choice text;
  v_rel_context text;
  v_intimate_what jsonb;
  v_intimate_platform jsonb;
  v_reporter_name text;
  v_reporter_contact text;
  v_confirm_public_identity boolean;
  v_pub_prefs jsonb;
  v_parties jsonb;
  v_party jsonb;
  v_party_type text;
  v_evidence_types jsonb;
  v_evidence_desc text;
  v_has_supporting_info boolean;
  v_response jsonb;

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
  -- Step 1: Honeypot Anti-Bot Protection
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

  v_incident_time := NULL;
  IF nullif(trim(coalesce(p_payload->>'incidentTime', '')), '') IS NOT NULL THEN
    BEGIN
      v_incident_time := (trim(p_payload->>'incidentTime'))::time without time zone;
    EXCEPTION WHEN OTHERS THEN
      v_incident_time := NULL;
    END;
  END IF;
  v_frequency := coalesce(p_payload->>'frequency', 'one-time');
  IF v_frequency NOT IN ('one-time', 'repeated') THEN
    v_frequency := 'one-time';
  END IF;

  -- Incident Location (Distinct from reporter device location)
  v_location := p_payload->'location';
  IF v_location IS NOT NULL THEN
    v_lat := coalesce((v_location->>'lat')::double precision, (v_location->>'latitude')::double precision);
    v_lng := coalesce((v_location->>'lng')::double precision, (v_location->>'longitude')::double precision);
    v_division := nullif(trim(coalesce(v_location->>'division', '')), '');
    v_district := nullif(trim(coalesce(v_location->>'district', '')), '');
    v_upazila := nullif(trim(coalesce(v_location->>'upazilaOrThana', v_location->>'upazila_or_thana', '')), '');
    v_area := nullif(trim(coalesce(v_location->>'area', '')), '');
    v_road := nullif(trim(coalesce(v_location->>'road', '')), '');
    v_landmark := nullif(trim(coalesce(v_location->>'landmark', '')), '');
    v_address := nullif(trim(coalesce(v_location->>'formattedAddress', v_location->>'formatted_address', '')), '');
    v_place_id := nullif(trim(coalesce(v_location->>'placeId', v_location->>'place_id', '')), '');
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

  v_rel_context := nullif(trim(coalesce(p_payload->>'relationshipContext', '')), '');
  v_intimate_what :=
    CASE
      WHEN p_payload ? 'intimateWhatHappened'
           AND p_payload->'intimateWhatHappened' <> 'null'::jsonb
      THEN p_payload->'intimateWhatHappened'
      ELSE NULL
    END;

  v_intimate_platform :=
    CASE
      WHEN p_payload ? 'intimatePlatform'
           AND p_payload->'intimatePlatform' <> 'null'::jsonb
      THEN p_payload->'intimatePlatform'
      ELSE NULL
    END;

  -- -------------------------------------------------------------------------
  -- Step 6: Extract Admin Contact (harassment reporter details)
  -- Preferred shape from frontend:
  --   adminContact.name
  --   adminContact.contact
  --   adminContact.consentPublic
  -- Private and admin-only unless approved public identity consent applies.
  -- -------------------------------------------------------------------------
  v_reporter_name := nullif(trim(coalesce(
    p_payload->'adminContact'->>'name',
    p_payload->>'adminName',
    p_payload->>'reporterName',
    ''
  )), '');

  v_reporter_contact := nullif(trim(coalesce(
    p_payload->'adminContact'->>'contact',
    p_payload->>'adminContact',
    p_payload->>'reporterContact',
    ''
  )), '');

  v_confirm_public_identity := coalesce(
    (p_payload->'adminContact'->>'consentPublic')::boolean,
    (p_payload->>'confirmPublicIdentity')::boolean,
    false
  );

  v_pub_prefs := coalesce(p_payload->'publicationPreferences', '{}'::jsonb);
  v_has_supporting_info := coalesce((p_payload->>'hasSupportingInfo')::boolean, false);
  v_evidence_types := coalesce(p_payload->'evidenceTypes', '[]'::jsonb);
  v_evidence_desc := nullif(trim(coalesce(p_payload->>'evidenceDescription', '')), '');

  -- -------------------------------------------------------------------------
  -- Step 7: Generate Unique Report ID (SJ-{YEAR}-{6 DIGIT RANDOM NUMBER})
  -- -------------------------------------------------------------------------
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

  -- -------------------------------------------------------------------------
  -- Step 8: Insert Complaint Record into public.complaints
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
    v_segment,
    v_subcategory,
    v_title,
    v_description,
    v_incident_date,
    v_incident_time,
    v_frequency,
    v_privacy_choice,
    v_rel_context,
    v_intimate_what,
    v_intimate_platform,
    v_division,
    v_district,
    v_upazila,
    v_area,
    v_road,
    v_landmark,
    v_address,
    v_lat,
    v_lng,
    v_place_id,
    v_has_supporting_info,
    v_evidence_types,
    v_evidence_desc,
    v_pub_prefs,
    v_reporter_name,
    v_reporter_contact,
    v_confirm_public_identity,
    'submitted',
    now(),
    now()
  );

  -- -------------------------------------------------------------------------
  -- Step 9: Insert Reporter Device Submission Context (Private admin data)
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
  -- Step 10: Insert Parties into public.complaint_parties
  -- -------------------------------------------------------------------------
  v_parties := p_payload->'mentionedParties';
  IF v_parties IS NOT NULL AND jsonb_typeof(v_parties) = 'array' AND jsonb_array_length(v_parties) > 0 THEN
    FOR v_party IN SELECT * FROM jsonb_array_elements(v_parties)
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
  ELSIF (
    (p_payload->>'reportedSubject' IS NOT NULL AND trim(p_payload->>'reportedSubject') <> '') OR
    (p_payload->>'roleOrDesignation' IS NOT NULL AND trim(p_payload->>'roleOrDesignation') <> '') OR
    (p_payload->>'organization' IS NOT NULL AND trim(p_payload->>'organization') <> '') OR
    (p_payload->>'phoneOrContact' IS NOT NULL AND trim(p_payload->>'phoneOrContact') <> '') OR
    (p_payload->>'publicProfileHandle' IS NOT NULL AND trim(p_payload->>'publicProfileHandle') <> '') OR
    (p_payload->>'identifyingDescription' IS NOT NULL AND trim(p_payload->>'identifyingDescription') <> '') OR
    (p_payload->>'address' IS NOT NULL AND trim(p_payload->>'address') <> '') OR
    (p_payload->>'subjectType' IS NOT NULL AND trim(p_payload->>'subjectType') IN ('individual', 'business', 'group', 'organization'))
  ) THEN
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
      coalesce(nullif(trim(coalesce(p_payload->>'reportedSubject', '')), ''), nullif(trim(coalesce(p_payload->>'organization', '')), '')),
      v_party_type,
      nullif(trim(coalesce(p_payload->>'roleOrDesignation', '')), ''),
      nullif(trim(coalesce(p_payload->>'organization', '')), ''),
      coalesce(nullif(trim(coalesce(p_payload->>'phoneOrContact', '')), ''), nullif(trim(coalesce(p_payload->>'publicProfileHandle', '')), '')),
      nullif(trim(coalesce(p_payload->>'publicProfileHandle', '')), ''),
      nullif(trim(coalesce(p_payload->>'address', '')), ''),
      nullif(trim(coalesce(p_payload->>'identifyingDescription', '')), ''),
      now()
    );
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 11: Insert Initial Status History
  -- -------------------------------------------------------------------------
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

  -- -------------------------------------------------------------------------
  -- Step 12: Return Standardized Client Response Payload
  -- (Never exposes private reporter coordinates or contact info)
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

-- =============================================================================
-- End of Phase 3 Authoritative Migration File
-- =============================================================================
