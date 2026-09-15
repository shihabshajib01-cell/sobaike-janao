-- ==============================================================================
-- SOBAIKE JANAO ADMIN — RESPONSE DETAIL PRIVATE CONTACT CONTRACT
-- ==============================================================================
-- Migration: 20260907000002_admin_response_detail_private_contact.sql
-- Description:
--   1. Authoritative fix for private follow-up contact visibility in Admin.
--   2. Preserves strict privacy boundary: public endpoints remain completely blind
--      to private contact info.
--   3. Updates public.admin_get_response_detail(p_response_id text) to return:
--      - contact_consent (boolean)
--      - contact_info (text) -> private citizen contact when consented
--      - contact_email_or_phone (text) -> private subject responder verification contact
--   4. Enforces RBAC permissions: is_active_admin() AND has_permission('responses.view').
--   5. Function remains SECURITY DEFINER with fixed search_path = pg_catalog, public.
--   6. Revokes privileges from PUBLIC and anon; grants EXECUTE to authenticated.
--   7. Pre-commit catalog assertions verify signature, security definer, and grants.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. PREREQUISITE VALIDATION
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.complaint_responses') IS NULL THEN
        RAISE EXCEPTION 'Prerequisite failed: public.complaint_responses table does not exist.'
            USING ERRCODE = '42P01';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'complaint_responses'
          AND column_name = 'contact_info'
    ) THEN
        RAISE EXCEPTION 'Prerequisite failed: public.complaint_responses.contact_info column does not exist.'
            USING ERRCODE = '42703';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'complaint_responses'
          AND column_name = 'contact_email_or_phone'
    ) THEN
        RAISE EXCEPTION 'Prerequisite failed: public.complaint_responses.contact_email_or_phone column does not exist.'
            USING ERRCODE = '42703';
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. HARDENED DETAIL RPC: public.admin_get_response_detail
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_get_response_detail(
    p_response_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_id text;
    v_response_json jsonb;
BEGIN
    -- 1. Authorization
    IF NOT public.is_active_admin() THEN
        RAISE EXCEPTION 'Access denied. Active administrative session required.'
            USING ERRCODE = '42501';
    END IF;

    IF NOT public.has_permission('responses.view') THEN
        RAISE EXCEPTION 'Access denied. You do not have permission to view responses.'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Input validation
    v_id := NULLIF(trim(p_response_id), '');
    IF v_id IS NULL THEN
        RAISE EXCEPTION 'Response ID is required.'
            USING ERRCODE = '22000';
    END IF;

    -- 3. Query response with authoritative fields including private contact information
    SELECT jsonb_build_object(
        'id', r.id,
        'complaint_id', r.complaint_id,
        'response_type', r.response_type,
        'status', r.status,
        'content', r.content,
        'incident_date', r.incident_date,
        'created_at', r.created_at,
        'updated_at', r.updated_at,
        'published_at', r.published_at,
        'contact_consent', COALESCE(r.contact_consent, false),
        'contact_info', r.contact_info,
        'responder_type', r.responder_type,
        'responder_name', r.responder_name,
        'designation', r.designation,
        'organization_name', r.organization_name,
        'contact_email_or_phone', r.contact_email_or_phone,
        'official_statement', r.official_statement,
        'supporting_documents_note', r.supporting_documents_note,
        'request_correction_or_removal', COALESCE(r.request_correction_or_removal, false),
        'correction_details', r.correction_details,
        'complaint', jsonb_build_object(
            'id', c.id,
            'title', c.title,
            'segment_id', c.segment_id,
            'segment_name_en', s.name_en,
            'segment_name_bn', s.name_bn,
            'district', c.district,
            'status', c.status
        )
    )
    INTO v_response_json
    FROM public.complaint_responses r
    JOIN public.complaints c ON c.id = r.complaint_id
    LEFT JOIN public.segments s ON s.id = c.segment_id
    WHERE r.id::text = v_id;

    IF v_response_json IS NULL THEN
        RAISE EXCEPTION 'Response not found.'
            USING ERRCODE = 'P0002';
    END IF;

    RETURN v_response_json;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. PERMISSION HARDENING & PRIVILEGES
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.admin_get_response_detail(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_response_detail(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_get_response_detail(text) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. PRE-COMMIT ASSERTIONS
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_proc_oid oid;
    v_secdef boolean;
    v_config text[];
    v_has_auth_execute boolean;
    v_anon_execute boolean;
BEGIN
    SELECT p.oid, p.prosecdef, p.proconfig
    INTO v_proc_oid, v_secdef, v_config
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'admin_get_response_detail';

    IF v_proc_oid IS NULL THEN
        RAISE EXCEPTION 'Assertion failed: public.admin_get_response_detail not found in pg_proc.'
            USING ERRCODE = 'P0001';
    END IF;

    IF NOT v_secdef THEN
        RAISE EXCEPTION 'Assertion failed: public.admin_get_response_detail must be SECURITY DEFINER.'
            USING ERRCODE = 'P0001';
    END IF;

    IF v_config IS NULL OR NOT ('search_path=pg_catalog, public' = ANY(v_config)) THEN
        RAISE EXCEPTION 'Assertion failed: public.admin_get_response_detail has invalid search_path.'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT has_function_privilege('authenticated', v_proc_oid, 'EXECUTE')
    INTO v_has_auth_execute;

    IF NOT v_has_auth_execute THEN
        RAISE EXCEPTION 'Assertion failed: authenticated must have EXECUTE on admin_get_response_detail.'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT has_function_privilege('anon', v_proc_oid, 'EXECUTE')
    INTO v_anon_execute;

    IF v_anon_execute THEN
        RAISE EXCEPTION 'Assertion failed: anon must NOT have EXECUTE on admin_get_response_detail.'
            USING ERRCODE = 'P0001';
    END IF;
END $$;

COMMIT;
