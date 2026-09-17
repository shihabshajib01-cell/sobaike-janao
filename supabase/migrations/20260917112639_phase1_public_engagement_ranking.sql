-- Phase 1 public engagement ranking/read contract.
-- The counter columns and write RPCs already exist. This migration only exposes
-- aggregate counts through sanitized public reads and makes Popular/Most shared real.

do $migration$
declare
  v_oid oid;
  v_def text;
  v_new text;
begin
  v_oid := 'public.get_public_published_reports()'::regprocedure::oid;
  v_def := pg_get_functiondef(v_oid);
  v_new := replace(v_def, '''status'', c.status,', '''status'', c.status,' || E'\n    ' || '''viewCount'', c.public_view_count,' || E'\n    ' || '''shareCount'', c.public_share_count,');
  if v_new = v_def then raise exception 'get_public_published_reports engagement insertion point not found'; end if;
  execute v_new;

  v_oid := 'public.get_public_published_report(text)'::regprocedure::oid;
  v_def := pg_get_functiondef(v_oid);
  v_new := replace(v_def, '''status'', c.status,', '''status'', c.status,' || E'\n    ' || '''viewCount'', c.public_view_count,' || E'\n    ' || '''shareCount'', c.public_share_count,');
  if v_new = v_def then raise exception 'get_public_published_report engagement insertion point not found'; end if;
  execute v_new;

  v_oid := 'public.get_public_home_feed(double precision,double precision,text,text)'::regprocedure::oid;
  v_def := pg_get_functiondef(v_oid);
  v_new := replace(v_def, E'      c.status,\n      c.recent_bill_month,', E'      c.status,\n      c.public_view_count,\n      c.public_share_count,\n      c.recent_bill_month,');
  if v_new = v_def then raise exception 'get_public_home_feed base engagement insertion point not found'; end if;

  v_def := v_new;
  v_new := replace(v_def, '''status'', bc.status,', '''status'', bc.status,' || E'\n        ' || '''viewCount'', bc.public_view_count,' || E'\n        ' || '''shareCount'', bc.public_share_count,');
  if v_new = v_def then raise exception 'get_public_home_feed payload engagement insertion point not found'; end if;

  v_def := v_new;
  v_new := replace(
    v_def,
    E'        CASE WHEN v_clean_filter = ''popular'' AND v_has_visitor_loc THEN bc.internal_distance_km END ASC NULLS LAST,\n        CASE WHEN v_clean_filter = ''popular'' THEN bc.created_at END DESC NULLS LAST,\n        CASE WHEN v_clean_filter = ''most_shared'' THEN bc.created_at END DESC NULLS LAST,\n        CASE WHEN v_clean_filter = ''most_shared'' AND v_has_visitor_loc THEN bc.internal_distance_km END ASC NULLS LAST,',
    E'        CASE WHEN v_clean_filter = ''popular'' THEN bc.public_view_count END DESC NULLS LAST,\n        CASE WHEN v_clean_filter = ''popular'' THEN bc.public_share_count END DESC NULLS LAST,\n        CASE WHEN v_clean_filter = ''popular'' AND v_has_visitor_loc THEN bc.internal_distance_km END ASC NULLS LAST,\n        CASE WHEN v_clean_filter = ''most_shared'' THEN bc.public_share_count END DESC NULLS LAST,\n        CASE WHEN v_clean_filter = ''most_shared'' THEN bc.public_view_count END DESC NULLS LAST,\n        CASE WHEN v_clean_filter = ''most_shared'' AND v_has_visitor_loc THEN bc.internal_distance_km END ASC NULLS LAST,'
  );
  if v_new = v_def then raise exception 'get_public_home_feed ranking replacement point not found'; end if;
  execute v_new;
end
$migration$;
