-- =============================================================================
-- MIGRATION: Persist Excess Electricity Bill Data in Backend
-- File: supabase/persist_excess_electricity_bill.sql
--
-- Adds nullable billing columns to public.complaints and updates the
-- authoritative submit_public_complaint RPC to validate and store
-- excess electricity bill complaint fields. Also provides public-read
-- mapping for published reports.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Step 1: Add Nullable Bill Columns to public.complaints
-- -----------------------------------------------------------------------------
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS recent_bill_month text,
  ADD COLUMN IF NOT EXISTS recent_bill_amount numeric,
  ADD COLUMN IF NOT EXISTS previous_bill_month text,
  ADD COLUMN IF NOT EXISTS previous_bill_amount numeric;

-- -----------------------------------------------------------------------------
-- Step 2: Update submit_public_complaint RPC to persist bill values
-- -----------------------------------------------------------------------------
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

  -- Normalized form payload variables
  v_segment text;
  v_subcategory text;
  v_title text;
  v_description text;
  v_incident_date date;
  v_incident_time time without time zone;
  v_frequency text;
  v_privacy_choice text;
  v_location jsonb;
  v_division text;
  v_district text;
  v_upazila text;
  v_area text;
  v_road text;
  v_landmark text;
  v_address text;
  v_lat double precision;
  v_lng double precision;
  v_place_id text;
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
  v_recent_bill_month text;
  v_recent_bill_amount numeric;
  v_previous_bill_month text;
  v_previous_bill_amount numeric;
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

  -- -------------------------------------------------------------------------
  -- Step 2: Validate and Extract Client Submission ID (Idempotency Key)
  -- -------------------------------------------------------------------------
  v_client_sub_id := nullif(trim(coalesce(p_client_submission_id, p_payload->>'clientSubmissionId', '')), '');
  IF v_client_sub_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: client_submission_id is required.';
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 3: Idempotency Check
  -- -------------------------------------------------------------------------
  SELECT id, segment_id, subcategory_id, title, status, created_at
  INTO v_existing
  FROM public.complaints
  WHERE client_submission_id = v_client_sub_id
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'reportId', v_existing.id,
      'message', 'Report submitted successfully (idempotent replay).',
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
  -- Step 4: Validate Reporter Device Context (Fail-Closed)
  -- -------------------------------------------------------------------------
  v_rep_ctx := p_reporter_context;
  IF v_rep_ctx IS NULL OR v_rep_ctx = '{}'::jsonb THEN
    v_rep_ctx := p_payload->'reporterContext';
  END IF;

  IF v_rep_ctx IS NULL OR v_rep_ctx = '{}'::jsonb THEN
    RAISE EXCEPTION 'REPORTER_LOCATION_REQUIRED: Valid reporter device location context is strictly required.';
  END IF;

  v_rep_lat := coalesce((v_rep_ctx->>'latitude')::double precision, (v_rep_ctx->>'lat')::double precision);
  v_rep_lng := coalesce((v_rep_ctx->>'longitude')::double precision, (v_rep_ctx->>'lng')::double precision);
  v_rep_accuracy := coalesce((v_rep_ctx->>'accuracy_meters')::double precision, (v_rep_ctx->>'accuracy')::double precision);

  IF v_rep_lat IS NULL OR v_rep_lng IS NULL OR v_rep_accuracy IS NULL THEN
    RAISE EXCEPTION 'REPORTER_LOCATION_REQUIRED: Missing GPS coordinate or accuracy parameters.';
  END IF;

  IF v_rep_lat < -90 OR v_rep_lat > 90 OR v_rep_lng < -180 OR v_rep_lng > 180 THEN
    RAISE EXCEPTION 'REPORTER_LOCATION_REQUIRED: Reporter device coordinates are out of valid range.';
  END IF;

  IF v_rep_accuracy <= 0 OR v_rep_accuracy > 50000 THEN
    RAISE EXCEPTION 'REPORTER_LOCATION_REQUIRED: Reporter device accuracy exceeds acceptable platform threshold.';
  END IF;

  v_rep_captured_at_raw := nullif(trim(coalesce(v_rep_ctx->>'captured_at', v_rep_ctx->>'capturedAt', '')), '');
  IF v_rep_captured_at_raw IS NOT NULL THEN
    BEGIN
      v_rep_captured_at := v_rep_captured_at_raw::timestamptz;
    EXCEPTION WHEN OTHERS THEN
      v_rep_captured_at := now();
    END;
  ELSE
    v_rep_captured_at := now();
  END IF;

  v_rep_visitor_id := nullif(trim(coalesce(v_rep_ctx->>'visitor_id', v_rep_ctx->>'visitorId', '')), '');
  IF v_rep_visitor_id IS NULL THEN
    v_rep_visitor_id := 'vis_anon_' || substring(md5(random()::text) from 1 for 16);
  END IF;

  v_rep_session_id := nullif(trim(coalesce(v_rep_ctx->>'session_id', v_rep_ctx->>'sessionId', '')), '');
  IF v_rep_session_id IS NULL THEN
    v_rep_session_id := 'sess_anon_' || substring(md5(random()::text) from 1 for 16);
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 5: Validate and Extract Complaint Core Form Fields
  -- -------------------------------------------------------------------------
  v_segment := nullif(trim(coalesce(p_payload->>'segment', '')), '');
  v_subcategory := nullif(trim(coalesce(p_payload->>'subcategoryId', '')), '');
  v_title := nullif(trim(coalesce(p_payload->>'title', '')), '');
  v_description := trim(coalesce(p_payload->>'description', ''));

  IF v_segment IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Segment is required.';
  END IF;

  IF v_subcategory IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Subcategory is required.';
  END IF;

  IF v_title IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Title is required.';
  END IF;

  IF length(v_title) > 200 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Title exceeds maximum allowed length of 200 characters.';
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

  -- Subcategory-specific validation and extraction for Excess Electricity Bill
  IF v_subcategory = 'excess-electricity-bill' THEN
    v_recent_bill_month := nullif(trim(coalesce(p_payload->>'recentBillMonth', p_payload->>'recent_bill_month', '')), '');
    v_previous_bill_month := nullif(trim(coalesce(p_payload->>'previousBillMonth', p_payload->>'previous_bill_month', '')), '');
    
    IF v_recent_bill_month IS NULL THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Recent bill month is required for excess electricity bill complaints.';
    END IF;

    IF v_previous_bill_month IS NULL THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Previous bill month is required for excess electricity bill complaints.';
    END IF;

    BEGIN
      v_recent_bill_amount := (p_payload->>'recentBillAmount')::numeric;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        v_recent_bill_amount := (p_payload->>'recent_bill_amount')::numeric;
      EXCEPTION WHEN OTHERS THEN
        v_recent_bill_amount := NULL;
      END;
    END;

    IF v_recent_bill_amount IS NULL THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Recent bill amount is required for excess electricity bill complaints.';
    END IF;

    IF v_recent_bill_amount <= 0 THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Recent bill amount must be greater than zero.';
    END IF;

    BEGIN
      v_previous_bill_amount := (p_payload->>'previousBillAmount')::numeric;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        v_previous_bill_amount := (p_payload->>'previous_bill_amount')::numeric;
      EXCEPTION WHEN OTHERS THEN
        v_previous_bill_amount := NULL;
      END;
    END;

    IF v_previous_bill_amount IS NULL THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Previous bill amount is required for excess electricity bill complaints.';
    END IF;

    IF v_previous_bill_amount <= 0 THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Previous bill amount must be greater than zero.';
    END IF;

    -- Incident date compatibility: fallback to 1st of recentBillMonth if incidentDate not provided
    IF v_incident_date IS NULL OR p_payload->>'incidentDate' IS NULL THEN
      BEGIN
        v_incident_date := (v_recent_bill_month || '-01')::date;
      EXCEPTION WHEN OTHERS THEN
        v_incident_date := CURRENT_DATE;
      END;
    END IF;

    -- For excess electricity bill, incident_time must remain NULL
    v_incident_time := NULL;
  ELSE
    v_recent_bill_month := NULL;
    v_recent_bill_amount := NULL;
    v_previous_bill_month := NULL;
    v_previous_bill_amount := NULL;
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

  -- Required manual incident location validation
  IF v_division IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Incident division is required.';
  END IF;

  IF v_district IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Incident district is required.';
  END IF;

  IF v_upazila IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Incident upazila / thana is required.';
  END IF;

  -- Coordinates are optional if textual address info is provided
  IF (v_lat IS NULL OR v_lng IS NULL) AND v_area IS NULL AND v_address IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Incident location coordinates or area name is required.';
  END IF;

  -- Supporting Evidence
  v_has_supporting_info := coalesce((p_payload->>'hasSupportingInfo')::boolean, false);
  v_evidence_types := coalesce(p_payload->'evidenceTypes', '[]'::jsonb);
  v_evidence_desc := nullif(trim(coalesce(p_payload->>'evidenceDescription', '')), '');

  -- Privacy Preferences
  v_privacy_choice := coalesce(p_payload->>'privacyChoice', 'anonymous');
  IF v_privacy_choice NOT IN ('anonymous', 'admin_only', 'public_identity') THEN
    v_privacy_choice := 'anonymous';
  END IF;

  v_pub_prefs := coalesce(p_payload->'publicationPreferences', jsonb_build_object(
    'showSubjectName', true,
    'showOrganization', true,
    'showGeneralLocation', true,
    'showDescription', true
  ));

  -- Private reporter details (only if provided)
  v_reporter_name := nullif(trim(coalesce(p_payload->>'adminName', p_payload->>'reporterName', '')), '');
  v_reporter_contact := nullif(trim(coalesce(p_payload->>'adminContact', p_payload->>'reporterContact', '')), '');
  v_confirm_public_identity := coalesce((p_payload->>'confirmPublicIdentity')::boolean, false);

  -- Context fields
  v_rel_context := nullif(trim(coalesce(p_payload->>'relationshipContext', '')), '');
  v_intimate_what := p_payload->'intimateWhatHappened';
  v_intimate_platform := p_payload->'intimatePlatform';

  -- -------------------------------------------------------------------------
  -- Step 6: Collision-Resistant Report ID Generation (Format: SJ-YYYY-XXXXXX)
  -- -------------------------------------------------------------------------
  v_year := to_char(CURRENT_DATE, 'YYYY');
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
  -- Step 7: Insert Complaint Record into public.complaints
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
    recent_bill_month,
    recent_bill_amount,
    previous_bill_month,
    previous_bill_amount,
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
    v_recent_bill_month,
    v_recent_bill_amount,
    v_previous_bill_month,
    v_previous_bill_amount,
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
  -- Step 9: Insert Parties into public.complaint_parties
  -- -------------------------------------------------------------------------
  IF (
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
      nullif(trim(coalesce(p_payload->>'reportedSubject', '')), ''),
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

  v_parties := p_payload->'mentionedParties';
  IF v_parties IS NOT NULL AND jsonb_typeof(v_parties) = 'array' THEN
    FOR v_party IN SELECT * FROM jsonb_array_elements(v_parties)
    LOOP
      IF (
        (v_party->>'name' IS NOT NULL AND trim(v_party->>'name') <> '') OR
        (v_party->>'roleOrDesignation' IS NOT NULL AND trim(v_party->>'roleOrDesignation') <> '') OR
        (v_party->>'organization' IS NOT NULL AND trim(v_party->>'organization') <> '') OR
        (v_party->>'phoneOrContact' IS NOT NULL AND trim(v_party->>'phoneOrContact') <> '') OR
        (v_party->>'publicProfileHandle' IS NOT NULL AND trim(v_party->>'publicProfileHandle') <> '') OR
        (v_party->>'identifyingDescription' IS NOT NULL AND trim(v_party->>'identifyingDescription') <> '') OR
        (v_party->>'address' IS NOT NULL AND trim(v_party->>'address') <> '')
      ) THEN
        v_party_type := trim(coalesce(v_party->>'partyType', v_party->>'subjectType', 'unknown'));
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
          nullif(trim(coalesce(v_party->>'name', '')), ''),
          v_party_type,
          nullif(trim(coalesce(v_party->>'roleOrDesignation', '')), ''),
          nullif(trim(coalesce(v_party->>'organization', '')), ''),
          coalesce(nullif(trim(coalesce(v_party->>'phoneOrContact', '')), ''), nullif(trim(coalesce(v_party->>'publicProfileHandle', '')), '')),
          nullif(trim(coalesce(v_party->>'publicProfileHandle', '')), ''),
          nullif(trim(coalesce(v_party->>'address', '')), ''),
          nullif(trim(coalesce(v_party->>'identifyingDescription', '')), ''),
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
      'createdAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'recentBillMonth', v_recent_bill_month,
      'recentBillAmount', v_recent_bill_amount,
      'previousBillMonth', v_previous_bill_month,
      'previousBillAmount', v_previous_bill_amount
    )
  );

  RETURN v_response;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 3: Ensure get_public_published_reports exposes bill fields
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_published_reports()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'segment', c.segment_id,
        'subcategoryId', c.subcategory_id,
        'titleBn', c.title,
        'titleEn', c.title,
        'descriptionBn', c.description,
        'descriptionEn', c.description,
        'reportedSubject', c.reporter_name,
        'organization', NULL,
        'district', c.district,
        'area', c.area,
        'location', coalesce(c.formatted_address, c.area, c.district),
        'incidentDate', to_char(c.incident_date, 'YYYY-MM-DD'),
        'publishedAt', to_char(c.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'priority', 'medium',
        'hasSupportingInfo', c.has_supporting_info,
        'status', c.status,
        'recentBillMonth', c.recent_bill_month,
        'recentBillAmount', c.recent_bill_amount,
        'previousBillMonth', c.previous_bill_month,
        'previousBillAmount', c.previous_bill_amount,
        'recent_bill_month', c.recent_bill_month,
        'recent_bill_amount', c.recent_bill_amount,
        'previous_bill_month', c.previous_bill_month,
        'previous_bill_amount', c.previous_bill_amount
      )
      ORDER BY c.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.complaints c
  WHERE c.status = 'published';

  RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 4: Revoke and Grant Privileges
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.submit_public_complaint(jsonb, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_complaint(jsonb, text, jsonb) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_published_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_reports() TO anon, authenticated;

COMMIT;
