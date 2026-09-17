-- Lightweight published-only feed update detector for the Public home feed.
-- Returns only aggregate publication timing/count metadata; no complaint content or private fields.

CREATE INDEX IF NOT EXISTS idx_complaint_updates_published_created_at
  ON public.complaint_updates (created_at DESC, complaint_id)
  WHERE update_type = 'published';

CREATE OR REPLACE FUNCTION public.get_public_feed_update_state(
  p_since timestamptz DEFAULT NULL,
  p_district text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_clean_district text;
  v_result jsonb;
BEGIN
  v_clean_district := lower(trim(coalesce(p_district, 'all')));

  WITH current_publications AS (
    SELECT
      c.id,
      min(u.created_at) AS published_at
    FROM public.complaints c
    JOIN public.complaint_updates u
      ON u.complaint_id = c.id
     AND u.update_type = 'published'
    WHERE c.status = 'published'
      AND (
        v_clean_district = 'all'
        OR (
          (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb
          AND lower(coalesce(c.district, '')) LIKE '%' || v_clean_district || '%'
        )
      )
    GROUP BY c.id
  )
  SELECT jsonb_build_object(
    'newCount', count(*) FILTER (
      WHERE p_since IS NOT NULL
        AND cp.published_at > p_since
    ),
    'newestPublishedAt', max(cp.published_at),
    'checkedAt', now()
  )
  INTO v_result
  FROM current_publications cp;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_public_feed_update_state(timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_feed_update_state(timestamptz, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_feed_update_state(timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_feed_update_state(timestamptz, text) TO service_role;

COMMENT ON FUNCTION public.get_public_feed_update_state(timestamptz, text) IS
  'Returns aggregate published-only home-feed update metadata for lightweight Public polling.';
