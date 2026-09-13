-- =============================================================================
-- MIGRATION: Expose Safe Incident Coordinates to Public Reports
-- File: supabase/expose_safe_incident_coordinates_to_public_reports.sql
--
-- Phase 1 - Public Heatmap Data Foundation
--
-- Purpose:
--   Exposes truthful, safe INCIDENT latitude and longitude coordinates
--   (stored directly on public.complaints) to the public report RPCs:
--     1. public.get_public_published_reports()
--     2. public.get_public_published_report(text)
--
-- Privacy & Security Guarantees:
--   1. Coordinates are derived ONLY from incident location fields (c.latitude, c.longitude)
--      on public.complaints.
--   2. Under NO circumstances are reporter device coordinates
--      (public.complaint_submission_contexts.reporter_latitude / reporter_longitude)
--      exposed, joined, or used as fallback.
--   3. Coordinates are strictly NULL if:
--      - Either latitude or longitude is NULL
--      - Coordinates are exactly 0,0
--      - Coordinates are outside standard bounds (lat: -90..90, lng: -180..180)
--      - The report's location is withheld or empty
--   4. RLS and permissions remain strictly preserved (SECURITY DEFINER,
--      hardened search_path = pg_catalog, public).
--   5. Function signature and existing return fields remain identical with the
--      additive inclusion of nullable 'latitude' and 'longitude'.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Step 1: Public Published Reports List RPC (With Safe Incident Coordinates)
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
        'latitude', CASE
          WHEN coalesce(c.formatted_address, c.area, c.district) IS NULL THEN NULL
          WHEN c.latitude IS NULL OR c.longitude IS NULL THEN NULL
          WHEN c.latitude = 0.0 AND c.longitude = 0.0 THEN NULL
          WHEN c.latitude < -90.0 OR c.latitude > 90.0 THEN NULL
          WHEN c.longitude < -180.0 OR c.longitude > 180.0 THEN NULL
          ELSE c.latitude
        END,
        'longitude', CASE
          WHEN coalesce(c.formatted_address, c.area, c.district) IS NULL THEN NULL
          WHEN c.latitude IS NULL OR c.longitude IS NULL THEN NULL
          WHEN c.latitude = 0.0 AND c.longitude = 0.0 THEN NULL
          WHEN c.latitude < -90.0 OR c.latitude > 90.0 THEN NULL
          WHEN c.longitude < -180.0 OR c.longitude > 180.0 THEN NULL
          ELSE c.longitude
        END,
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
  LEFT JOIN LATERAL (
    SELECT
      CASE
        WHEN count(*) = 1
        THEN max(nullif(trim(cp.name), ''))
        ELSE NULL
      END AS name,

      CASE
        WHEN count(*) = 1
        THEN max(nullif(trim(cp.organization), ''))
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
        OR trim(coalesce(cp.party_type, '')) IN (
          'individual',
          'business',
          'group',
          'organization'
        )
      )
  ) party ON true
  WHERE c.status = 'published';

  RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 2: Public Published Report Detail RPC (With Safe Incident Coordinates)
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
    'latitude', CASE
      WHEN coalesce(c.formatted_address, c.area, c.district) IS NULL THEN NULL
      WHEN c.latitude IS NULL OR c.longitude IS NULL THEN NULL
      WHEN c.latitude = 0.0 AND c.longitude = 0.0 THEN NULL
      WHEN c.latitude < -90.0 OR c.latitude > 90.0 THEN NULL
      WHEN c.longitude < -180.0 OR c.longitude > 180.0 THEN NULL
      ELSE c.latitude
    END,
    'longitude', CASE
      WHEN coalesce(c.formatted_address, c.area, c.district) IS NULL THEN NULL
      WHEN c.latitude IS NULL OR c.longitude IS NULL THEN NULL
      WHEN c.latitude = 0.0 AND c.longitude = 0.0 THEN NULL
      WHEN c.latitude < -90.0 OR c.latitude > 90.0 THEN NULL
      WHEN c.longitude < -180.0 OR c.longitude > 180.0 THEN NULL
      ELSE c.longitude
    END,
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
        WHEN count(*) = 1
        THEN max(nullif(trim(cp.name), ''))
        ELSE NULL
      END AS name,

      CASE
        WHEN count(*) = 1
        THEN max(nullif(trim(cp.organization), ''))
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
        OR trim(coalesce(cp.party_type, '')) IN (
          'individual',
          'business',
          'group',
          'organization'
        )
      )
  ) party ON true
  WHERE upper(c.id) = v_clean_id
    AND c.status = 'published';

  RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 3: Revoke and Grant Privileges
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_public_published_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_reports() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_published_report(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_report(text) TO anon, authenticated;

COMMIT;
