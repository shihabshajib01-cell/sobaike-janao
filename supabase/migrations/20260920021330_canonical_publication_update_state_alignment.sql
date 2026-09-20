CREATE OR REPLACE FUNCTION public.get_public_feed_update_state(
  p_since timestamptz DEFAULT NULL,
  p_district text DEFAULT 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
      coalesce(c.published_at,c.created_at) AS published_at
    FROM public.complaints c
    WHERE c.status='published'
      AND (
        v_clean_district='all'
        OR (
          (c.publication_preferences->'showGeneralLocation')='true'::jsonb
          AND lower(c.district) LIKE '%' || v_clean_district || '%'
        )
      )
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
