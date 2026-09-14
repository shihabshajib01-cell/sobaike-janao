-- =============================================================================
-- MIGRATION: Phase 8 — Shadow Location Ranking + Public Coordinate Privacy Hardening
-- LIVE-SYNCED: 2026-09-14
--
-- This file matches the migration successfully applied to production project
-- ahiaymyqfmyyrjkwgvhi as migration: phase8_shadow_location_privacy_final
-- =============================================================================

BEGIN;

-- Revoke any public access to previously-created Haversine helpers, regardless of overload.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS fn
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'calculate_haversine_km'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', r.fn);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- Shadow-ranked Home feed. Visitor coordinates are transient inputs only.
-- Incident coordinates are used internally only when showGeneralLocation is
-- exact JSON boolean true. No coordinate/distance fields are returned.
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
  IF p_visitor_lat IS NOT NULL AND p_visitor_lng IS NOT NULL
     AND p_visitor_lat >= -90.0 AND p_visitor_lat <= 90.0
     AND p_visitor_lng >= -180.0 AND p_visitor_lng <= 180.0
     AND NOT (p_visitor_lat = 0.0 AND p_visitor_lng = 0.0) THEN
    v_has_visitor_loc := true;
  END IF;

  v_clean_filter := lower(trim(coalesce(p_filter, 'all')));
  IF v_clean_filter NOT IN ('all', 'latest', 'popular', 'most_shared') THEN
    v_clean_filter := 'all';
  END IF;
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
      CASE
        WHEN v_has_visitor_loc
             AND (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb
             AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL
             AND NOT (c.latitude = 0.0 AND c.longitude = 0.0)
             AND c.latitude >= -90.0 AND c.latitude <= 90.0
             AND c.longitude >= -180.0 AND c.longitude <= 180.0
        THEN 6371.0 * 2.0 * atan2(
          sqrt(
            sin(radians(c.latitude - p_visitor_lat) / 2.0) * sin(radians(c.latitude - p_visitor_lat) / 2.0)
            + cos(radians(p_visitor_lat)) * cos(radians(c.latitude))
            * sin(radians(c.longitude - p_visitor_lng) / 2.0) * sin(radians(c.longitude - p_visitor_lng) / 2.0)
          ),
          sqrt(greatest(0.0, 1.0 - (
            sin(radians(c.latitude - p_visitor_lat) / 2.0) * sin(radians(c.latitude - p_visitor_lat) / 2.0)
            + cos(radians(p_visitor_lat)) * cos(radians(c.latitude))
            * sin(radians(c.longitude - p_visitor_lng) / 2.0) * sin(radians(c.longitude - p_visitor_lng) / 2.0)
          )))
        )
        ELSE NULL
      END AS internal_distance_km
    FROM public.complaints c
    LEFT JOIN LATERAL (
      SELECT
        CASE WHEN count(*) = 1 THEN max(nullif(trim(cp.name), '')) ELSE NULL END AS name,
        CASE WHEN count(*) = 1 THEN max(nullif(trim(cp.organization), '')) ELSE NULL END AS organization
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
        CASE WHEN v_clean_filter = 'all' AND v_has_visitor_loc THEN bc.internal_distance_km END ASC NULLS LAST,
        CASE WHEN v_clean_filter = 'latest' THEN bc.created_at END DESC NULLS LAST,
        CASE WHEN v_clean_filter = 'latest' AND v_has_visitor_loc THEN bc.internal_distance_km END ASC NULLS LAST,
        CASE WHEN v_clean_filter = 'popular' AND v_has_visitor_loc THEN bc.internal_distance_km END ASC NULLS LAST,
        CASE WHEN v_clean_filter = 'popular' THEN bc.created_at END DESC NULLS LAST,
        CASE WHEN v_clean_filter = 'most_shared' THEN bc.created_at END DESC NULLS LAST,
        CASE WHEN v_clean_filter = 'most_shared' AND v_has_visitor_loc THEN bc.internal_distance_km END ASC NULLS LAST,
        bc.created_at DESC,
        bc.id DESC
    ),
    '[]'::jsonb
  ) INTO v_result
  FROM base_complaints bc;

  RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- Coordinate-free public list RPC.
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
      ) ORDER BY c.created_at DESC, c.id DESC
    ),
    '[]'::jsonb
  ) INTO v_result
  FROM public.complaints c
  LEFT JOIN LATERAL (
    SELECT
      CASE WHEN count(*) = 1 THEN max(nullif(trim(cp.name), '')) ELSE NULL END AS name,
      CASE WHEN count(*) = 1 THEN max(nullif(trim(cp.organization), '')) ELSE NULL END AS organization
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
-- Coordinate-free public detail RPC.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_published_report(p_report_id text)
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
  IF v_clean_id = '' THEN RETURN NULL; END IF;

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
  ) INTO v_result
  FROM public.complaints c
  LEFT JOIN LATERAL (
    SELECT
      CASE WHEN count(*) = 1 THEN max(nullif(trim(cp.name), '')) ELSE NULL END AS name,
      CASE WHEN count(*) = 1 THEN max(nullif(trim(cp.organization), '')) ELSE NULL END AS organization
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
-- Browse-session RPC compatibility note:
-- The existing live function uses NUMERIC coordinate parameters and RETURNS JSONB.
-- Keep that identity exactly so CREATE OR REPLACE truly replaces the function
-- instead of creating a second overload that PostgREST could resolve ambiguously.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.record_public_visit_session(
  text, text, text,
  double precision, double precision, double precision,
  text, text, text, text, text, text, text,
  integer, integer, text
);

CREATE OR REPLACE FUNCTION public.record_public_visit_session(
  p_visitor_id text,
  p_session_id text,
  p_permission_status text,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL,
  p_accuracy_meters numeric DEFAULT NULL,
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
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_visitor_id text;
  v_session_id text;
  v_permission text;
  v_existing_visitor_id text;
BEGIN
  v_visitor_id := trim(coalesce(p_visitor_id, ''));
  v_session_id := trim(coalesce(p_session_id, ''));
  v_permission := lower(trim(coalesce(p_permission_status, 'prompt')));

  IF v_visitor_id = '' THEN RAISE EXCEPTION 'VALIDATION_FAILED: visitor_id is required.'; END IF;
  IF length(v_visitor_id) > 128 THEN RAISE EXCEPTION 'VALIDATION_FAILED: visitor_id is too long.'; END IF;
  IF v_session_id = '' THEN RAISE EXCEPTION 'VALIDATION_FAILED: session_id is required.'; END IF;
  IF length(v_session_id) > 128 THEN RAISE EXCEPTION 'VALIDATION_FAILED: session_id is too long.'; END IF;
  IF v_permission NOT IN ('prompt','granted','denied','unavailable') THEN
    RAISE EXCEPTION 'VALIDATION_FAILED: Invalid permission status.';
  END IF;

  SELECT visitor_id INTO v_existing_visitor_id
  FROM public.public_visit_sessions
  WHERE session_id = v_session_id
  FOR UPDATE;

  IF FOUND AND v_existing_visitor_id <> v_visitor_id THEN
    RAISE EXCEPTION 'SESSION_CONFLICT: Session belongs to another visitor.';
  END IF;

  INSERT INTO public.public_visit_sessions (
    visitor_id, session_id, permission_status,
    latitude, longitude, accuracy_meters,
    browser_name, browser_version, os_name, device_category, platform,
    language, timezone, screen_width, screen_height, user_agent,
    consented_at, first_seen_at, last_seen_at, location_updated_at, created_at
  ) VALUES (
    v_visitor_id, v_session_id, v_permission,
    NULL, NULL, NULL,
    NULLIF(trim(p_browser_name), ''), NULLIF(trim(p_browser_version), ''),
    NULLIF(trim(p_os_name), ''), NULLIF(trim(p_device_category), ''), NULLIF(trim(p_platform), ''),
    NULLIF(trim(p_language), ''), NULLIF(trim(p_timezone), ''),
    p_screen_width, p_screen_height, NULLIF(left(trim(p_user_agent), 1000), ''),
    CASE WHEN v_permission = 'granted' THEN now() ELSE NULL END,
    now(), now(), NULL, now()
  )
  ON CONFLICT (session_id) DO UPDATE SET
    permission_status = EXCLUDED.permission_status,
    latitude = NULL,
    longitude = NULL,
    accuracy_meters = NULL,
    browser_name = EXCLUDED.browser_name,
    browser_version = EXCLUDED.browser_version,
    os_name = EXCLUDED.os_name,
    device_category = EXCLUDED.device_category,
    platform = EXCLUDED.platform,
    language = EXCLUDED.language,
    timezone = EXCLUDED.timezone,
    screen_width = EXCLUDED.screen_width,
    screen_height = EXCLUDED.screen_height,
    user_agent = EXCLUDED.user_agent,
    consented_at = CASE
      WHEN EXCLUDED.permission_status = 'granted'
      THEN COALESCE(public.public_visit_sessions.consented_at, now())
      ELSE public.public_visit_sessions.consented_at
    END,
    last_seen_at = now(),
    location_updated_at = NULL;

  RETURN jsonb_build_object(
    'success', true,
    'sessionId', v_session_id,
    'permissionStatus', v_permission
  );
END;
$$;

-- Clear all historical browse-session coordinates. Preserve session rows and safe metadata.
UPDATE public.public_visit_sessions
SET latitude = NULL,
    longitude = NULL,
    accuracy_meters = NULL,
    location_updated_at = NULL
WHERE latitude IS NOT NULL
   OR longitude IS NOT NULL
   OR accuracy_meters IS NOT NULL
   OR location_updated_at IS NOT NULL;

-- Explicit function privileges.
REVOKE ALL ON FUNCTION public.get_public_home_feed(double precision, double precision, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_home_feed(double precision, double precision, text, text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_published_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_reports() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_published_report(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_report(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.record_public_visit_session(
  text, text, text,
  numeric, numeric, numeric,
  text, text, text, text, text, text, text,
  integer, integer, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_public_visit_session(
  text, text, text,
  numeric, numeric, numeric,
  text, text, text, text, text, text, text,
  integer, integer, text
) TO anon, authenticated, service_role;

COMMIT;

-- =============================================================================
-- Minimal verification queries
-- =============================================================================

-- No public coordinate/distance keys should appear in any public response.
SELECT
  lower(public.get_public_published_reports()::text) ~ '"(latitude|longitude|lat|lng|coordinates|distance|distance_km|distance_m|proximity|visitor_lat|visitor_lng|reporter_lat|reporter_lng)"\\s*:'
  AS list_has_sensitive_key;

SELECT count(*) AS sessions_with_location
FROM public.public_visit_sessions
WHERE latitude IS NOT NULL
   OR longitude IS NOT NULL
   OR accuracy_meters IS NOT NULL;
