-- =============================================================================
-- MIGRATION: Phase 8 — Shadow Location Ranking + Public Coordinate Privacy Hardening
-- File: supabase/phase8_shadow_location_ranking_privacy.sql
--
-- Purpose:
--   1. Implements public.get_public_home_feed(p_visitor_lat, p_visitor_lng, p_filter, p_district)
--      which performs location-aware ranking entirely in the shadow on the backend.
--   2. Updates public.get_public_published_reports() and public.get_public_published_report(text)
--      to completely remove 'latitude' and 'longitude' keys from public outputs.
--   3. Updates public.record_public_visit_session to never persist browse coordinates.
--   4. Cleanses historical browse session coordinates from public.public_visit_sessions.
--
-- Privacy & Security Guarantees:
--   - Zero incident coordinates (lat/lng), zero visitor coordinates, zero distance in public RPC outputs.
--   - Strict fail-closed coordinate eligibility: uses complaints.latitude/longitude for shadow
--     ranking ONLY when publication_preferences->'showGeneralLocation' is exact JSON boolean true.
--   - Never accesses private complaint_submission_contexts (reporter GPS) for public feeds.
--   - Preserves Phase 5 'all', Phase 6 'latest', 'popular', 'most_shared' ordering semantics.
--   - Hardened SECURITY DEFINER with fixed search_path = pg_catalog, public.
--   - All calculations performed inline without exposing public distance helpers.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Step 0: Ensure any previously created Haversine helper is not publicly callable
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'calculate_haversine_km'
  ) THEN
    REVOKE ALL ON FUNCTION public.calculate_haversine_km(double precision, double precision, double precision, double precision) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.calculate_haversine_km(double precision, double precision, double precision, double precision) FROM anon;
    REVOKE ALL ON FUNCTION public.calculate_haversine_km(double precision, double precision, double precision, double precision) FROM authenticated;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 1: Dedicated Shadow-Ranking Home Feed RPC
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_home_feed(
  p_visitor_lat double precision DEFAULT NULL,
  p_visitor_lng double precision DEFAULT NULL,
  p_filter text DEFAULT 'all',
  p_district text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_result jsonb;
  v_has_visitor_loc boolean := false;
  v_clean_filter text;
  v_clean_district text;
BEGIN
  -- 1. Validate visitor location parameters (fail-closed, valid non-zero finite coordinates)
  IF p_visitor_lat IS NOT NULL AND p_visitor_lng IS NOT NULL THEN
    IF p_visitor_lat >= -90.0 AND p_visitor_lat <= 90.0 AND
       p_visitor_lng >= -180.0 AND p_visitor_lng <= 180.0 AND
       NOT (p_visitor_lat = 0.0 AND p_visitor_lng = 0.0) THEN
      v_has_visitor_loc := true;
    END IF;
  END IF;

  v_clean_filter := lower(trim(coalesce(p_filter, 'all')));
  v_clean_district := lower(trim(coalesce(p_district, 'all')));

  WITH base_complaints AS (
    SELECT
      c.id,
      c.segment_id,
      c.subcategory_id,
      c.title,
      c.description,
      c.district,
      c.area,
      coalesce(c.formatted_address, c.area, c.district) AS location_display,
      c.incident_date,
      c.created_at,
      c.has_supporting_info,
      c.status,
      c.recent_bill_month,
      c.recent_bill_amount,
      c.previous_bill_month,
      c.previous_bill_amount,
      party.name AS party_name,
      party.organization AS party_org,
      -- Internal distance in km for shadow ranking only (NEVER returned to client).
      -- Strict fail-closed rule: only when showGeneralLocation is explicit 'true'::jsonb.
      CASE
        WHEN v_has_visitor_loc AND
             (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb AND
             c.latitude IS NOT NULL AND c.longitude IS NOT NULL AND
             NOT (c.latitude = 0.0 AND c.longitude = 0.0) AND
             c.latitude >= -90.0 AND c.latitude <= 90.0 AND
             c.longitude >= -180.0 AND c.longitude <= 180.0
        THEN (
          6371.0 * 2.0 * atan2(
            sqrt(
              sin(radians(c.latitude - p_visitor_lat) / 2.0) * sin(radians(c.latitude - p_visitor_lat) / 2.0) +
              cos(radians(p_visitor_lat)) * cos(radians(c.latitude)) *
              sin(radians(c.longitude - p_visitor_lng) / 2.0) * sin(radians(c.longitude - p_visitor_lng) / 2.0)
            ),
            sqrt(
              greatest(0.0, 1.0 - (
                sin(radians(c.latitude - p_visitor_lat) / 2.0) * sin(radians(c.latitude - p_visitor_lat) / 2.0) +
                cos(radians(p_visitor_lat)) * cos(radians(c.latitude)) *
                sin(radians(c.longitude - p_visitor_lng) / 2.0) * sin(radians(c.longitude - p_visitor_lng) / 2.0)
              ))
            )
          )
        )
        ELSE NULL
      END AS internal_distance_km
    FROM public.complaints c
    LEFT JOIN LATERAL (
      SELECT
        CASE
          WHEN count(*) = 1 THEN max(nullif(trim(cp.name), ''))
          ELSE NULL
        END AS name,
        CASE
          WHEN count(*) = 1 THEN max(nullif(trim(cp.organization), ''))
          ELSE NULL
        END AS organization
      FROM public.complaint_parties cp
      WHERE cp.complaint_id = c.id
        AND (
          nullif(trim(cp.name), '') IS NOT NULL
          OR nullif(trim(cp.organization), '') IS NOT NULL
          OR nullif(trim(cp.role_or_designation), '') IS NOT NULL
          OR nullif(trim(cp.phone_or_contact), '') IS NOT NULL
          OR nullif(trim(cp.public_profile_handle), '') IS NOT NULL
          OR nullif(trim(cp.identifying_description), '') IS NOT NULL
          OR nullif(trim(cp.address), '') IS NOT NULL
          OR trim(coalesce(cp.party_type, '')) IN ('individual', 'business', 'group', 'organization')
        )
    ) party ON true
    WHERE c.status = 'published'
      AND (
        v_clean_district = 'all'
        OR lower(coalesce(c.district, '')) LIKE '%' || v_clean_district || '%'
      )
  )
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', bc.id,
        'segment', bc.segment_id,
        'subcategoryId', bc.subcategory_id,
        'titleBn', bc.title,
        'titleEn', bc.title,
        'descriptionBn', bc.description,
        'descriptionEn', bc.description,
        'reportedSubject', bc.party_name,
        'organization', bc.party_org,
        'district', bc.district,
        'area', bc.area,
        'location', bc.location_display,
        'incidentDate', to_char(bc.incident_date, 'YYYY-MM-DD'),
        'publishedAt', to_char(bc.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'priority', 'medium',
        'hasSupportingInfo', bc.has_supporting_info,
        'status', bc.status,
        'recentBillMonth', bc.recent_bill_month,
        'recentBillAmount', bc.recent_bill_amount,
        'previousBillMonth', bc.previous_bill_month,
        'previousBillAmount', bc.previous_bill_amount,
        'recent_bill_month', bc.recent_bill_month,
        'recent_bill_amount', bc.recent_bill_amount,
        'previous_bill_month', bc.previous_bill_month,
        'previous_bill_amount', bc.previous_bill_amount
      )
      ORDER BY
        -- Phase 5 & 6 Ranking Logic:
        -- CASE A: ALL Filter
        -- When visitor location available:
        -- 1. Reports with eligible incident coordinates come first (internal_distance_km ASC NULLS LAST)
        -- 2. Reports without eligible incident coordinates, preserving created_at DESC
        -- When visitor location unavailable: created_at DESC
        CASE WHEN v_clean_filter = 'all' AND v_has_visitor_loc THEN
          bc.internal_distance_km
        END ASC NULLS LAST,

        -- CASE B: LATEST Filter (Primary: created_at; Secondary tie-breaker: distance; Fallback: id)
        CASE WHEN v_clean_filter = 'latest' THEN bc.created_at END DESC NULLS LAST,
        CASE WHEN v_clean_filter = 'latest' AND v_has_visitor_loc THEN
          bc.internal_distance_km
        END ASC NULLS LAST,

        -- CASE C: POPULAR Filter
        -- In the absence of an external popularity count, all reports have an equal score;
        -- distance breaks the genuine tie when visitor location is available, then created_at DESC
        CASE WHEN v_clean_filter = 'popular' AND v_has_visitor_loc THEN
          bc.internal_distance_km
        END ASC NULLS LAST,
        CASE WHEN v_clean_filter = 'popular' THEN bc.created_at END DESC NULLS LAST,

        -- CASE D: MOST SHARED Filter (Primary: created_at; Secondary tie-breaker: distance; Fallback: id)
        CASE WHEN v_clean_filter = 'most_shared' THEN bc.created_at END DESC NULLS LAST,
        CASE WHEN v_clean_filter = 'most_shared' AND v_has_visitor_loc THEN
          bc.internal_distance_km
        END ASC NULLS LAST,

        -- Default Base Fallback Order (Deterministic ID & creation date)
        bc.created_at DESC,
        bc.id DESC
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM base_complaints bc;

  RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 2: Update get_public_published_reports (Strip Raw Coordinates from Public List)
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
        'reportedSubject', party.name,
        'organization', party.organization,
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
      ORDER BY c.created_at DESC, c.id DESC
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.complaints c
  LEFT JOIN LATERAL (
    SELECT
      CASE
        WHEN count(*) = 1 THEN max(nullif(trim(cp.name), ''))
        ELSE NULL
      END AS name,
      CASE
        WHEN count(*) = 1 THEN max(nullif(trim(cp.organization), ''))
        ELSE NULL
      END AS organization
    FROM public.complaint_parties cp
    WHERE cp.complaint_id = c.id
      AND (
        nullif(trim(cp.name), '') IS NOT NULL
        OR nullif(trim(cp.organization), '') IS NOT NULL
        OR nullif(trim(cp.role_or_designation), '') IS NOT NULL
        OR nullif(trim(cp.phone_or_contact), '') IS NOT NULL
        OR nullif(trim(cp.public_profile_handle), '') IS NOT NULL
        OR nullif(trim(cp.identifying_description), '') IS NOT NULL
        OR nullif(trim(cp.address), '') IS NOT NULL
        OR trim(coalesce(cp.party_type, '')) IN ('individual', 'business', 'group', 'organization')
      )
  ) party ON true
  WHERE c.status = 'published';

  RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 3: Update get_public_published_report (Detail RPC - Strip Raw Coordinates)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_published_report(
  p_report_id text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_result jsonb;
  v_clean_id text;
BEGIN
  v_clean_id := upper(trim(coalesce(p_report_id, '')));
  IF v_clean_id = '' THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', c.id,
    'segment', c.segment_id,
    'subcategoryId', c.subcategory_id,
    'titleBn', c.title,
    'titleEn', c.title,
    'descriptionBn', c.description,
    'descriptionEn', c.description,
    'reportedSubject', party.name,
    'organization', party.organization,
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
  INTO v_result
  FROM public.complaints c
  LEFT JOIN LATERAL (
    SELECT
      CASE
        WHEN count(*) = 1 THEN max(nullif(trim(cp.name), ''))
        ELSE NULL
      END AS name,
      CASE
        WHEN count(*) = 1 THEN max(nullif(trim(cp.organization), ''))
        ELSE NULL
      END AS organization
    FROM public.complaint_parties cp
    WHERE cp.complaint_id = c.id
      AND (
        nullif(trim(cp.name), '') IS NOT NULL
        OR nullif(trim(cp.organization), '') IS NOT NULL
        OR nullif(trim(cp.role_or_designation), '') IS NOT NULL
        OR nullif(trim(cp.phone_or_contact), '') IS NOT NULL
        OR nullif(trim(cp.public_profile_handle), '') IS NOT NULL
        OR nullif(trim(cp.identifying_description), '') IS NOT NULL
        OR nullif(trim(cp.address), '') IS NOT NULL
        OR trim(coalesce(cp.party_type, '')) IN ('individual', 'business', 'group', 'organization')
      )
  ) party ON true
  WHERE upper(c.id) = v_clean_id
    AND c.status = 'published';

  RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 4: Update record_public_visit_session (Zero Browse Coordinates Persisted)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_public_visit_session(
  p_visitor_id text,
  p_session_id text,
  p_permission_status text,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL,
  p_accuracy_meters double precision DEFAULT NULL,
  p_browser_name text DEFAULT NULL,
  p_browser_version text DEFAULT NULL,
  p_os_name text DEFAULT NULL,
  p_device_category text DEFAULT NULL,
  p_platform text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_timezone text DEFAULT NULL,
  p_screen_width integer DEFAULT NULL,
  p_screen_height integer DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Strict privacy enforcement: p_latitude, p_longitude, and p_accuracy_meters
  -- are NEVER stored in public_visit_sessions for browse sessions.
  BEGIN
    INSERT INTO public.public_visit_sessions (
      visitor_id,
      session_id,
      permission_status,
      latitude,
      longitude,
      accuracy_meters,
      browser_name,
      browser_version,
      os_name,
      device_category,
      platform,
      language,
      timezone,
      screen_width,
      screen_height,
      user_agent
    )
    VALUES (
      p_visitor_id,
      p_session_id,
      p_permission_status,
      NULL,
      NULL,
      NULL,
      p_browser_name,
      p_browser_version,
      p_os_name,
      p_device_category,
      p_platform,
      p_language,
      p_timezone,
      p_screen_width,
      p_screen_height,
      p_user_agent
    );
  EXCEPTION
    WHEN unique_violation THEN
      UPDATE public.public_visit_sessions
      SET
        visitor_id = p_visitor_id,
        permission_status = p_permission_status,
        latitude = NULL,
        longitude = NULL,
        accuracy_meters = NULL,
        browser_name = coalesce(p_browser_name, browser_name),
        browser_version = coalesce(p_browser_version, browser_version),
        os_name = coalesce(p_os_name, os_name),
        device_category = coalesce(p_device_category, device_category),
        platform = coalesce(p_platform, platform),
        language = coalesce(p_language, language),
        timezone = coalesce(p_timezone, timezone),
        screen_width = coalesce(p_screen_width, screen_width),
        screen_height = coalesce(p_screen_height, screen_height),
        user_agent = coalesce(p_user_agent, user_agent)
      WHERE session_id = p_session_id;
  END;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 5: Historical Browse Coordinate Data Cleansing
-- -----------------------------------------------------------------------------
UPDATE public.public_visit_sessions
SET latitude = NULL,
    longitude = NULL,
    accuracy_meters = NULL
WHERE latitude IS NOT NULL
   OR longitude IS NOT NULL
   OR accuracy_meters IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Step 6: Revoke and Grant Permissions
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_public_home_feed(double precision, double precision, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_home_feed(double precision, double precision, text, text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_published_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_reports() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_published_report(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_report(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.record_public_visit_session(text, text, text, double precision, double precision, double precision, text, text, text, text, text, text, text, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_public_visit_session(text, text, text, double precision, double precision, double precision, text, text, text, text, text, text, text, integer, integer, text) TO anon, authenticated, service_role;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (Run these to verify live behavior after migration)
-- =============================================================================

-- Query 1: Verify get_public_home_feed returns NO coordinate keys
-- Expected: has_latitude = false, has_longitude = false, has_distance = false
SELECT
  jsonb_path_exists(feed_item, '$.latitude') AS has_latitude,
  jsonb_path_exists(feed_item, '$.longitude') AS has_longitude,
  jsonb_path_exists(feed_item, '$.distance') AS has_distance,
  feed_item->>'id' AS report_id,
  feed_item->>'district' AS district,
  feed_item->>'publishedAt' AS published_at
FROM (
  SELECT jsonb_array_elements(public.get_public_home_feed(23.8103, 90.4125, 'all', 'all')) AS feed_item
  LIMIT 5
) q;

-- Query 2: Verify get_public_published_reports returns NO coordinate keys
-- Expected: has_latitude = false, has_longitude = false
SELECT
  jsonb_path_exists(rep_item, '$.latitude') AS has_latitude,
  jsonb_path_exists(rep_item, '$.longitude') AS has_longitude,
  rep_item->>'id' AS report_id
FROM (
  SELECT jsonb_array_elements(public.get_public_published_reports()) AS rep_item
  LIMIT 5
) q;

-- Query 3: Verify get_public_published_report returns NO coordinate keys
-- Expected: has_latitude = false, has_longitude = false
SELECT
  jsonb_path_exists(detail_item, '$.latitude') AS has_latitude,
  jsonb_path_exists(detail_item, '$.longitude') AS has_longitude,
  detail_item->>'id' AS report_id
FROM (
  SELECT public.get_public_published_report((SELECT id FROM public.complaints WHERE status = 'published' LIMIT 1)) AS detail_item
) q;

-- Query 4: Verify public_visit_sessions coordinate fields are completely null
-- Expected: sessions_with_lat = 0, sessions_with_lng = 0, sessions_with_acc = 0
SELECT
  count(*) AS total_sessions,
  count(latitude) AS sessions_with_lat,
  count(longitude) AS sessions_with_lng,
  count(accuracy_meters) AS sessions_with_acc
FROM public.public_visit_sessions;
