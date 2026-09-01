-- ============================================================================
-- Sobaike Janao - Phase 2 Public Complaint Submission Migration & RPC
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
-- Safely add existing product fields without altering existing data or breaking constraints
ALTER TABLE public.complaints 
  ADD COLUMN IF NOT EXISTS client_submission_id text,
  ADD COLUMN IF NOT EXISTS pin_hash text,
  ADD COLUMN IF NOT EXISTS segment_id text,
  ADD COLUMN IF NOT EXISTS subcategory_id text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS incident_date text,
  ADD COLUMN IF NOT EXISTS incident_time text,
  ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'one-time',
  ADD COLUMN IF NOT EXISTS privacy_choice text DEFAULT 'anonymous',
  ADD COLUMN IF NOT EXISTS relationship_context text,
  ADD COLUMN IF NOT EXISTS intimate_what_happened text,
  ADD COLUMN IF NOT EXISTS intimate_platform text,
  ADD COLUMN IF NOT EXISTS division text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS upazila_or_thana text,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS road text,
  ADD COLUMN IF NOT EXISTS landmark text,
  ADD COLUMN IF NOT EXISTS formatted_address text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS has_supporting_info boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS evidence_types text[],
  ADD COLUMN IF NOT EXISTS evidence_description text,
  ADD COLUMN IF NOT EXISTS publication_preferences jsonb DEFAULT '{"showSubjectName": false, "showOrganization": false, "showGeneralLocation": true, "showDescription": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS reporter_name text,
  ADD COLUMN IF NOT EXISTS reporter_contact text,
  ADD COLUMN IF NOT EXISTS confirm_public_identity boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

-- 3. Idempotency Index
-- Ensures client_submission_id is unique across complaints when non-null
CREATE UNIQUE INDEX IF NOT EXISTS complaints_client_submission_id_idx
  ON public.complaints (client_submission_id)
  WHERE client_submission_id IS NOT NULL;

-- 4. Schema Alignment on public.complaint_parties
ALTER TABLE public.complaint_parties
  ADD COLUMN IF NOT EXISTS complaint_id text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS party_type text DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS role_or_designation text,
  ADD COLUMN IF NOT EXISTS organization text,
  ADD COLUMN IF NOT EXISTS phone_or_contact text,
  ADD COLUMN IF NOT EXISTS public_profile_handle text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS identifying_description text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

-- 5. Schema Alignment on public.complaint_updates
ALTER TABLE public.complaint_updates
  ADD COLUMN IF NOT EXISTS complaint_id text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS status_bn text,
  ADD COLUMN IF NOT EXISTS status_en text,
  ADD COLUMN IF NOT EXISTS note_bn text,
  ADD COLUMN IF NOT EXISTS note_en text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

-- 6. Ensure Row Level Security (RLS) remains enabled on sensitive complaint tables
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_info_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_responses ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing function signature if needed to allow clean recreation
DROP FUNCTION IF EXISTS public.submit_public_complaint(jsonb, text, text);

-- 8. Create Secure SECURITY DEFINER RPC: submit_public_complaint
CREATE OR REPLACE FUNCTION public.submit_public_complaint(
  p_payload jsonb,
  p_client_submission_id text,
  p_tracking_pin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_client_sub_id text;
  v_clean_pin text;
  v_existing record;
  v_segment text;
  v_subcat_id text;
  v_title text;
  v_description text;
  v_incident_date text;
  v_district text;
  v_privacy_choice text;
  v_publication_prefs jsonb;
  v_evidence_types text[];
  v_pin_hash text;
  v_report_id text;
  v_year text;
  v_random_suffix int;
  v_collision_check boolean;
  v_attempts int := 0;
  v_party jsonb;
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
    -- Verify provided PIN against the stored hash
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
  -- Step 4: Validate Core Fields (Mirroring backend/validation/validator.ts)
  -- --------------------------------------------------------------------------
  -- Segment validation
  v_segment := trim(coalesce(p_payload->>'segment', ''));
  IF v_segment = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Valid segment is required.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.segments LIMIT 1) THEN
    IF NOT EXISTS (SELECT 1 FROM public.segments WHERE id = v_segment AND (active = true OR active IS NULL)) THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Selected segment is invalid or inactive.';
    END IF;
  ELSE
    IF v_segment NOT IN ('harassment', 'rickshaw', 'extortion') THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Valid segment is required.';
    END IF;
  END IF;

  -- Subcategory validation
  v_subcat_id := trim(coalesce(p_payload->>'subcategoryId', ''));
  IF v_subcat_id = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Subcategory is required.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.subcategories WHERE segment_id = v_segment LIMIT 1) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.subcategories 
      WHERE id = v_subcat_id 
        AND segment_id = v_segment 
        AND (active = true OR active IS NULL)
    ) THEN
      RAISE EXCEPTION 'VALIDATION_FAILED: Selected subcategory does not belong to the selected segment or is inactive.';
    END IF;
  END IF;

  -- Title validation (>= 3 chars)
  v_title := trim(coalesce(p_payload->>'title', ''));
  IF length(v_title) < 3 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Title is required (at least 3 characters).';
  END IF;

  -- Description validation (>= 10 chars)
  v_description := trim(coalesce(p_payload->>'description', ''));
  IF length(v_description) < 10 THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Description is required (at least 10 characters).';
  END IF;

  -- Incident date validation
  v_incident_date := trim(coalesce(p_payload->>'incidentDate', ''));
  IF v_incident_date = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Incident date is required.';
  END IF;

  -- Location district validation
  v_district := trim(coalesce(p_payload->'location'->>'district', ''));
  IF v_district = '' THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Location district is required.';
  END IF;

  -- Privacy choice validation
  v_privacy_choice := trim(coalesce(p_payload->>'privacyChoice', 'anonymous'));
  IF v_privacy_choice NOT IN ('anonymous', 'admin_only', 'public_identity') THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Valid reporter privacy choice is required.';
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 5: Publication Preferences Fallback Resolution
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

  -- Evidence types array parsing
  IF p_payload->'evidenceTypes' IS NOT NULL AND jsonb_typeof(p_payload->'evidenceTypes') = 'array' THEN
    SELECT array_agg(value::text)
    INTO v_evidence_types
    FROM jsonb_array_elements_text(p_payload->'evidenceTypes');
  ELSE
    v_evidence_types := ARRAY[]::text[];
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 6: Hash PIN using pgcrypto (bcrypt with work factor 10)
  -- --------------------------------------------------------------------------
  v_pin_hash := crypt(v_clean_pin, gen_salt('bf', 10));

  -- --------------------------------------------------------------------------
  -- Step 7: Generate Unique Report ID (SJ-{YEAR}-{6 DIGIT NUMBER})
  -- --------------------------------------------------------------------------
  v_year := to_char(now(), 'YYYY');
  LOOP
    v_attempts := v_attempts + 1;
    v_random_suffix := floor(100000 + random() * 900000)::int;
    v_report_id := 'SJ-' || v_year || '-' || v_random_suffix::text;

    SELECT EXISTS (SELECT 1 FROM public.complaints WHERE id = v_report_id)
    INTO v_collision_check;

    IF NOT v_collision_check OR v_attempts > 50 THEN
      EXIT;
    END IF;
  END LOOP;

  -- --------------------------------------------------------------------------
  -- Step 8: Insert Complaint Record
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
    priority,
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
    nullif(trim(coalesce(p_payload->>'incidentTime', '')), ''),
    coalesce(nullif(trim(coalesce(p_payload->>'frequency', '')), ''), 'one-time'),
    v_privacy_choice,
    nullif(trim(coalesce(p_payload->>'relationshipContext', '')), ''),
    nullif(trim(coalesce(p_payload->>'intimateWhatHappened', '')), ''),
    nullif(trim(coalesce(p_payload->>'intimatePlatform', '')), ''),
    nullif(trim(coalesce(p_payload->'location'->>'division', '')), ''),
    v_district,
    nullif(trim(coalesce(p_payload->'location'->>'upazilaOrThana', '')), ''),
    nullif(trim(coalesce(p_payload->'location'->>'area', '')), ''),
    nullif(trim(coalesce(p_payload->'location'->>'road', '')), ''),
    nullif(trim(coalesce(p_payload->'location'->>'landmark', '')), ''),
    nullif(trim(coalesce(p_payload->'location'->>'formattedAddress', '')), ''),
    CASE 
      WHEN p_payload->'location'->>'lat' IS NOT NULL AND trim(p_payload->'location'->>'lat') <> ''
      THEN (p_payload->'location'->>'lat')::double precision 
      ELSE NULL 
    END,
    CASE 
      WHEN p_payload->'location'->>'lng' IS NOT NULL AND trim(p_payload->'location'->>'lng') <> '' 
      THEN (p_payload->'location'->>'lng')::double precision 
      ELSE NULL 
    END,
    nullif(trim(coalesce(p_payload->'location'->>'placeId', '')), ''),
    coalesce((p_payload->>'hasSupportingInfo')::boolean, false),
    v_evidence_types,
    nullif(trim(coalesce(p_payload->>'evidenceDescription', '')), ''),
    v_publication_prefs,
    nullif(trim(coalesce(p_payload->'adminContact'->>'name', '')), ''),
    nullif(trim(coalesce(p_payload->'adminContact'->>'contact', '')), ''),
    coalesce((p_payload->'adminContact'->>'consentPublic')::boolean, false),
    'submitted',
    'normal',
    NOW(),
    NOW()
  );

  -- --------------------------------------------------------------------------
  -- Step 9: Insert Parties into public.complaint_parties
  -- --------------------------------------------------------------------------
  IF p_payload->'mentionedParties' IS NOT NULL AND 
     jsonb_typeof(p_payload->'mentionedParties') = 'array' AND 
     jsonb_array_length(p_payload->'mentionedParties') > 0 THEN
    FOR v_party IN SELECT * FROM jsonb_array_elements(p_payload->'mentionedParties')
    LOOP
      IF v_party->>'name' IS NOT NULL AND trim(v_party->>'name') <> '' THEN
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
          coalesce(nullif(trim(coalesce(v_party->>'type', '')), ''), 'individual'),
          nullif(trim(coalesce(v_party->>'roleOrDesignation', '')), ''),
          nullif(trim(coalesce(v_party->>'organization', '')), ''),
          nullif(trim(coalesce(v_party->>'phoneOrContact', '')), ''),
          nullif(trim(coalesce(v_party->>'publicProfileHandle', '')), ''),
          nullif(trim(coalesce(v_party->>'address', '')), ''),
          nullif(trim(coalesce(v_party->>'identifyingDescription', '')), ''),
          NOW()
        );
      END IF;
    END LOOP;
  ELSIF p_payload->>'reportedSubject' IS NOT NULL AND trim(p_payload->>'reportedSubject') <> '' THEN
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
      coalesce(nullif(trim(coalesce(p_payload->>'subjectType', '')), ''), 'individual'),
      nullif(trim(coalesce(p_payload->>'roleOrDesignation', '')), ''),
      nullif(trim(coalesce(p_payload->>'organization', '')), ''),
      nullif(trim(coalesce(p_payload->>'phoneOrContact', '')), ''),
      nullif(trim(coalesce(p_payload->>'publicProfileHandle', '')), ''),
      nullif(trim(coalesce(p_payload->>'address', '')), ''),
      nullif(trim(coalesce(p_payload->>'identifyingDescription', '')), ''),
      NOW()
    );
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 10: Insert Initial Complaint Update Event (is_public = false)
  -- --------------------------------------------------------------------------
  INSERT INTO public.complaint_updates (
    complaint_id,
    status,
    status_bn,
    status_en,
    note_bn,
    note_en,
    is_public,
    created_at
  ) VALUES (
    v_report_id,
    'submitted',
    'প্রতিবেদন গৃহীত হয়েছে',
    'Report Received',
    'প্রতিবেদনটি সফলভাবে জমা হয়েছে এবং সম্পাদকীয় পর্যালোচনার জন্য অপেক্ষমাণ।',
    'Report has been submitted for moderation review and queued for editorial review.',
    false,
    NOW()
  );

  -- --------------------------------------------------------------------------
  -- Step 11: Return Standardized Client Response Payload
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
      'createdAt', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )
  );
END;
$$;

-- 9. Secure Privileges for the RPC
-- Revoke all permissions from PUBLIC to prevent unauthorized schema access
REVOKE ALL ON FUNCTION public.submit_public_complaint(jsonb, text, text) FROM PUBLIC;

-- Grant execute privilege only to anon and authenticated roles for public form submission
GRANT EXECUTE ON FUNCTION public.submit_public_complaint(jsonb, text, text) TO anon, authenticated;

-- ============================================================================
-- End of Phase 2 Migration File
-- ============================================================================
