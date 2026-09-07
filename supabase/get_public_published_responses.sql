-- =============================================================================
-- MIGRATION: Public Published Response Display - Backend Read Contract
-- File: supabase/get_public_published_responses.sql
--
-- Requirements:
--   1. Transaction-safe migration (BEGIN / COMMIT with pre-commit fail-closed assertions).
--   2. Prerequisites validation:
--        - public.complaints exists with (id, status)
--        - public.complaint_responses exists with minimum required columns
--   3. Idempotent & non-destructive: creates or replaces public read RPC.
--   4. Function:
--        public.get_public_published_responses(p_report_id text) RETURNS jsonb
--        LANGUAGE plpgsql STABLE SECURITY DEFINER
--        SET search_path = pg_catalog, public
--   5. Server-side visibility rule:
--        c.status = 'published' AND r.status = 'published' AND c.id = normalized report ID
--   6. Strict privacy: Exposes ONLY safe display fields (camelCase keys).
--        NEVER returns private contact info, consent, notes, audit info, timestamps.
--   7. Deterministic ordering: published_at ASC NULLS LAST, id ASC.
--   8. Default to empty array '[]'::jsonb (never null).
--   9. ACL:
--        REVOKE ALL FROM PUBLIC
--        GRANT EXECUTE TO anon, authenticated
--        Raw table SELECT remains blocked for anon and authenticated.
--  10. Pre-commit assertions and catalog-derived health check verification.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Step 1: Verify Prerequisites
-- Ensure public.complaints and public.complaint_responses exist with required columns
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_missing_col text;
  v_required_response_cols text[] := ARRAY[
    'id', 'complaint_id', 'response_type', 'status', 'content',
    'incident_date', 'published_at', 'responder_type', 'responder_name',
    'designation', 'organization_name'
  ];
BEGIN
  -- 1. Verify public.complaints table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'complaints'
  ) THEN
    RAISE EXCEPTION 'PREREQUISITE_FAILED: public.complaints table does not exist.';
  END IF;

  -- 2. Verify complaints.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'id'
  ) THEN
    RAISE EXCEPTION 'PREREQUISITE_FAILED: public.complaints.id column is missing.';
  END IF;

  -- 3. Verify complaints.status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaints' AND column_name = 'status'
  ) THEN
    RAISE EXCEPTION 'PREREQUISITE_FAILED: public.complaints.status column is missing.';
  END IF;

  -- 4. Verify public.complaint_responses table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'complaint_responses'
  ) THEN
    RAISE EXCEPTION 'PREREQUISITE_FAILED: public.complaint_responses table does not exist.';
  END IF;

  -- 5. Verify complaint_responses minimum required columns
  SELECT col INTO v_missing_col
  FROM unnest(v_required_response_cols) AS col
  WHERE col NOT IN (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'complaint_responses'
  )
  LIMIT 1;

  IF v_missing_col IS NOT NULL THEN
    RAISE EXCEPTION 'PREREQUISITE_FAILED: public.complaint_responses missing required column "%".', v_missing_col;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 2: Create Public Read RPC: get_public_published_responses
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_published_responses(
  p_report_id text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_report_id text;
  v_result jsonb;
BEGIN
  -- Normalize input ID safely
  v_report_id := NULLIF(upper(btrim(p_report_id)), '');

  -- Return empty JSON array for blank or null report ID
  IF v_report_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  -- Read only published responses for published complaints with strict privacy projection
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'responseType', r.response_type,
        'content', r.content,
        'incidentDate', r.incident_date,
        'publishedAt', r.published_at,
        'responderType', CASE WHEN r.response_type = 'subject_response' THEN r.responder_type ELSE NULL END,
        'responderName', CASE WHEN r.response_type = 'subject_response' THEN r.responder_name ELSE NULL END,
        'designation', CASE WHEN r.response_type = 'subject_response' THEN r.designation ELSE NULL END,
        'organizationName', CASE WHEN r.response_type = 'subject_response' THEN r.organization_name ELSE NULL END
      )
      ORDER BY r.published_at ASC NULLS LAST, r.id ASC
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.complaint_responses r
  JOIN public.complaints c ON c.id = r.complaint_id
  WHERE c.id = v_report_id
    AND c.status = 'published'
    AND r.status = 'published';

  RETURN v_result;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 3: Function ACL Configuration
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_public_published_responses(text) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT EXECUTE ON FUNCTION public.get_public_published_responses(text) TO anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT EXECUTE ON FUNCTION public.get_public_published_responses(text) TO authenticated;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Step 4: Pre-Commit Assertions
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_func_def text;
BEGIN
  -- 1. Verify exact RPC signature exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_public_published_responses'
      AND oidvectortypes(p.proargtypes) = 'text'
  ) THEN
    RAISE EXCEPTION 'PRE_COMMIT_FAILED: RPC public.get_public_published_responses(text) does not exist.';
  END IF;

  -- 2. Verify SECURITY DEFINER
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_public_published_responses'
      AND oidvectortypes(p.proargtypes) = 'text'
      AND p.prosecdef = true
  ) THEN
    RAISE EXCEPTION 'PRE_COMMIT_FAILED: get_public_published_responses must be SECURITY DEFINER.';
  END IF;

  -- 3. Verify STABLE volatility
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_public_published_responses'
      AND oidvectortypes(p.proargtypes) = 'text'
      AND p.provolatile = 's'
  ) THEN
    RAISE EXCEPTION 'PRE_COMMIT_FAILED: get_public_published_responses must be STABLE.';
  END IF;

  -- 4. Verify safe search_path
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_public_published_responses'
      AND oidvectortypes(p.proargtypes) = 'text'
      AND (
        p.proconfig::text LIKE '%search_path=pg_catalog, public%'
        OR p.proconfig::text LIKE '%search_path=pg_catalog,public%'
      )
  ) THEN
    RAISE EXCEPTION 'PRE_COMMIT_FAILED: get_public_published_responses search_path must be pg_catalog, public.';
  END IF;

  -- 5. Verify PUBLIC EXECUTE is blocked
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    CROSS JOIN LATERAL aclexplode(
      COALESCE(
        p.proacl,
        acldefault('f', p.proowner)
      )
    ) acl
    WHERE n.nspname = 'public'
      AND p.proname = 'get_public_published_responses'
      AND oidvectortypes(p.proargtypes) = 'text'
      AND acl.grantee = 0
      AND acl.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'PRE_COMMIT_FAILED: PUBLIC execute privilege on get_public_published_responses must be revoked.';
  END IF;

  -- 6. Verify anon execute allowed (if role exists)
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    IF NOT has_function_privilege('anon', 'public.get_public_published_responses(text)', 'EXECUTE') THEN
      RAISE EXCEPTION 'PRE_COMMIT_FAILED: anon role must have EXECUTE on get_public_published_responses.';
    END IF;
  END IF;

  -- 7. Verify authenticated execute allowed (if role exists)
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    IF NOT has_function_privilege('authenticated', 'public.get_public_published_responses(text)', 'EXECUTE') THEN
      RAISE EXCEPTION 'PRE_COMMIT_FAILED: authenticated role must have EXECUTE on get_public_published_responses.';
    END IF;
  END IF;

  -- 8. Verify raw SELECT on public.complaint_responses remains blocked for anon
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    IF has_table_privilege('anon', 'public.complaint_responses', 'SELECT') THEN
      RAISE EXCEPTION 'PRE_COMMIT_FAILED: anon role must NOT have raw SELECT privilege on public.complaint_responses.';
    END IF;
  END IF;

  -- 9. Verify raw SELECT on public.complaint_responses remains blocked for authenticated
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    IF has_table_privilege('authenticated', 'public.complaint_responses', 'SELECT') THEN
      RAISE EXCEPTION 'PRE_COMMIT_FAILED: authenticated role must NOT have raw SELECT privilege on public.complaint_responses.';
    END IF;
  END IF;

  -- 10. Verify function definition contains server-side visibility restrictions and no private fields
  SELECT pg_get_functiondef(p.oid) INTO v_func_def
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'get_public_published_responses'
    AND oidvectortypes(p.proargtypes) = 'text';

  IF v_func_def NOT LIKE '%c.status = ''published''%' OR v_func_def NOT LIKE '%r.status = ''published''%' THEN
    RAISE EXCEPTION 'PRE_COMMIT_FAILED: Function definition must explicitly enforce c.status = published AND r.status = published.';
  END IF;

  IF v_func_def LIKE '%contact_info%'
     OR v_func_def LIKE '%contact_email_or_phone%'
     OR v_func_def LIKE '%contact_consent%'
     OR v_func_def LIKE '%supporting_documents_note%'
     OR v_func_def LIKE '%correction_details%'
     OR v_func_def LIKE '%contactInfo%'
     OR v_func_def LIKE '%contactEmailOrPhone%'
     OR v_func_def LIKE '%contactConsent%' THEN
    RAISE EXCEPTION 'PRE_COMMIT_FAILED: Function definition leaks private contact fields.';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================================================
-- Final Verification Output: Catalog-Derived Health Check
-- =============================================================================
SELECT
  check_name,
  result
FROM (
  VALUES
    (
      'response_table',
      CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'complaint_responses'
      ) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'complaint_table',
      CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'complaints'
      ) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'public_response_rpc',
      CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'get_public_published_responses'
          AND oidvectortypes(p.proargtypes) = 'text'
      ) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'security_definer',
      CASE WHEN coalesce((
        SELECT p.prosecdef FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'get_public_published_responses'
          AND oidvectortypes(p.proargtypes) = 'text'
      ), false) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'stable_function',
      CASE WHEN (
        SELECT p.provolatile FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'get_public_published_responses'
          AND oidvectortypes(p.proargtypes) = 'text'
      ) = 's' THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'safe_search_path',
      CASE WHEN coalesce((
        SELECT proconfig::text FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'get_public_published_responses'
          AND oidvectortypes(p.proargtypes) = 'text'
      ), '') LIKE '%search_path=pg_catalog, public%' OR coalesce((
        SELECT proconfig::text FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'get_public_published_responses'
          AND oidvectortypes(p.proargtypes) = 'text'
      ), '') LIKE '%search_path=pg_catalog,public%' THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'public_execute_blocked',
      CASE WHEN NOT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        CROSS JOIN LATERAL aclexplode(
          COALESCE(
            p.proacl,
            acldefault('f', p.proowner)
          )
        ) acl
        WHERE n.nspname = 'public'
          AND p.proname = 'get_public_published_responses'
          AND oidvectortypes(p.proargtypes) = 'text'
          AND acl.grantee = 0
          AND acl.privilege_type = 'EXECUTE'
      ) THEN 'PASS' ELSE 'FAIL' END
    ),
    (
      'anon_execute_allowed',
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN 'PASS (role not in environment)'
        WHEN has_function_privilege('anon', 'public.get_public_published_responses(text)', 'EXECUTE') THEN 'PASS'
        ELSE 'FAIL'
      END
    ),
    (
      'authenticated_execute_allowed',
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN 'PASS (role not in environment)'
        WHEN has_function_privilege('authenticated', 'public.get_public_published_responses(text)', 'EXECUTE') THEN 'PASS'
        ELSE 'FAIL'
      END
    ),
    (
      'anon_raw_select_blocked',
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN 'PASS'
        WHEN NOT has_table_privilege('anon', 'public.complaint_responses', 'SELECT') THEN 'PASS'
        ELSE 'FAIL'
      END
    ),
    (
      'authenticated_raw_select_blocked',
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN 'PASS'
        WHEN NOT has_table_privilege('authenticated', 'public.complaint_responses', 'SELECT') THEN 'PASS'
        ELSE 'FAIL'
      END
    )
) AS t(check_name, result);
