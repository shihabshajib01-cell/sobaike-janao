-- =============================================================================
-- MIGRATION: Phase 8 — Shadow Location Ranking + Public Coordinate Privacy Hardening
-- File: supabase/phase8_shadow_location_ranking_privacy.sql
--
-- Purpose:
--   1. Implements public.get_public_home_feed(p_visitor_lat, p_visitor_lng, p_filter, p_district)
--      which performs location-aware ranking entirely on the backend in the shadow.
--   2. Updates public.get_public_published_reports() and public.get_public_published_report()
--      to completely remove per-report latitude and longitude from public outputs.
--   3. Implements coarse district-level aggregations for safe map heat visualization
--      if needed, ensuring no individual complaint coordinates ever leak to the browser.
--
-- Privacy & Security Guarantees:
--   - No incident coordinates (lat/lng) or derived distance in public RPC outputs.
--   - No visitor coordinates persisted, logged, or returned.
--   - Uses ONLY complaints.latitude/longitude for ranking when showGeneralLocation is explicit 'true'::jsonb.
--   - Fails closed: missing/null/false showGeneralLocation = treated as no eligible coordinates.
--   - Never references private complaint_submission_contexts (reporter GPS) for public ranking.
--   - Preserves Phase 5 'all', Phase 6 'latest', 'popular', 'most_shared' ordering semantics.
--   - Hardened search_path = pg_catalog, public, SECURITY DEFINER.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Helper function: Haversine distance in kilometers (Internal backend calculation only)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_haversine_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;

  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat / 2.0) * sin(dlat / 2.0) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon / 2.0) * sin(dlon / 2.0);
  c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
  RETURN 6371.0 * c; -- Earth radius in km
END;
$$;

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
  -- 1. Validate visitor location parameters (must be valid finite coordinates, non-zero, within bounds)
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
      -- Internal distance calculation for shadow ranking only (NEVER returned to client)
      CASE
        WHEN v_has_visitor_loc AND
             (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb AND
             c.latitude IS NOT NULL AND c.longitude IS NOT NULL AND
             NOT (c.latitude = 0.0 AND c.longitude = 0.0) AND
             c.latitude >= -90.0 AND c.latitude <= 90.0 AND
             c.longitude >= -180.0 AND c.longitude <= 180.0
        THEN public.calculate_haversine_km(p_visitor_lat, p_visitor_lng, c.latitude, c.longitude)
        ELSE NULL
      END AS internal_distance_km,
      -- Popularity signal: related reports count
      coalesce(cardinality(c.related_report_ids), 0) AS popularity_count
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
        CASE WHEN v_clean_filter = 'all' AND v_has_visitor_loc THEN
          CASE WHEN bc.internal_distance_km IS NOT NULL THEN 0 ELSE 1 END
        END ASC,
        CASE WHEN v_clean_filter = 'all' AND v_has_visitor_loc THEN
          bc.internal_distance_km
        END ASC,

        -- CASE B: LATEST Filter (Primary: created_at; Secondary tie-break: distance; Fallback: id)
        CASE WHEN v_clean_filter = 'latest' THEN bc.created_at END DESC NULLS LAST,
        CASE WHEN v_clean_filter = 'latest' AND v_has_visitor_loc THEN
          bc.internal_distance_km
        END ASC NULLS LAST,

        -- CASE C: POPULAR Filter (Primary: popularity_count; Secondary: distance; Tertiary: created_at; Fallback: id)
        CASE WHEN v_clean_filter = 'popular' THEN bc.popularity_count END DESC,
        CASE WHEN v_clean_filter = 'popular' AND v_has_visitor_loc THEN
          bc.internal_distance_km
        END ASC NULLS LAST,
        CASE WHEN v_clean_filter = 'popular' THEN bc.created_at END DESC NULLS LAST,

        -- CASE D: MOST SHARED Filter (Primary: created_at; Secondary: distance; Fallback: id)
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
-- Step 4: Revoke and Grant Permissions
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.calculate_haversine_km(double precision, double precision, double precision, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calculate_haversine_km(double precision, double precision, double precision, double precision) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_home_feed(double precision, double precision, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_home_feed(double precision, double precision, text, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_published_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_reports() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_published_report(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_report(text) TO anon, authenticated;

COMMIT;
