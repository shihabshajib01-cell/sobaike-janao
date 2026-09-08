-- =============================================================================
-- MIGRATION: Persist Excess Electricity Bill Data in Backend
-- File: supabase/persist_excess_electricity_bill.sql
--
-- Adds nullable billing columns to public.complaints and provides public-read
-- mapping for published reports.
--
-- NOTE: Complaint submission RPC is authoritatively defined in:
--   supabase/phase3_safe_reporter_context.sql
-- The previous definition of submit_public_complaint in this file has been
-- removed to ensure it cannot overwrite or downgrade the authoritative RPC.
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
-- Step 2: Complaint Submission RPC (Superseded)
-- -----------------------------------------------------------------------------
-- The complaint submission function public.submit_public_complaint(jsonb, text, jsonb)
-- is authoritatively defined and maintained in:
--   supabase/phase3_safe_reporter_context.sql
-- It includes full validation for excess electricity bill complaints, utility end time
-- rules, safe reporter device context, and idempotency guarantees.
-- Do NOT define submit_public_complaint here.

-- -----------------------------------------------------------------------------
-- Step 3: Public Published Reports List RPC (Privacy-Safe)
-- -----------------------------------------------------------------------------
-- Derives reportedSubject and organization strictly from public.complaint_parties.
-- Never exposes reporter_name, reporter_contact, or private reporter context.
-- Uses strict single-party matching; returns NULL if 0 or multiple parties exist.
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
-- Step 4: Public Published Report Detail RPC (Privacy-Safe)
-- -----------------------------------------------------------------------------
-- Returns a single published report by ID with identical privacy-safe party semantics.
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
-- Step 5: Revoke and Grant Privileges
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_public_published_reports() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_reports() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_published_report(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_published_report(text) TO anon, authenticated;

COMMIT;
