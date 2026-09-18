-- Add a compatibility-first paginated Home feed without changing the existing
-- get_public_home_feed contract. The public app can fall back to the old RPC if
-- deployment order or API cache propagation temporarily makes this unavailable.

create or replace function public.get_public_home_feed_page(
  p_visitor_lat double precision default null,
  p_visitor_lng double precision default null,
  p_filter text default 'all',
  p_district text default 'all',
  p_offset integer default 0,
  p_limit integer default 10
)
returns jsonb
language plpgsql
stable
security invoker
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 50);
  v_filter text := lower(trim(coalesce(p_filter, 'all')));
  v_items jsonb := '[]'::jsonb;
  v_has_more boolean := false;
  v_source jsonb;
  v_total_count integer := 0;
begin
  if v_filter not in ('all', 'latest', 'popular', 'most_shared') then
    v_filter := 'all';
  end if;

  v_source := public.get_public_home_feed(
    p_visitor_lat,
    p_visitor_lng,
    case when v_filter = 'popular' then 'all' else v_filter end,
    p_district
  );
  v_total_count := jsonb_array_length(coalesce(v_source, '[]'::jsonb));

  -- Preserve the current Home Popular behavior exactly: the UI previously
  -- loaded the default feed and then sorted it by views, shares and publish date.
  if v_filter = 'popular' then
    with ordered_rows as (
      select elem, ordinality
      from jsonb_array_elements(coalesce(v_source, '[]'::jsonb))
        with ordinality as t(elem, ordinality)
      order by
        coalesce((elem->>'viewCount')::bigint, 0) desc,
        coalesce((elem->>'shareCount')::bigint, 0) desc,
        coalesce(elem->>'publishedAt', '') desc,
        ordinality asc
    ),
    page_rows as (
      select elem, row_number() over () as page_ordinality
      from ordered_rows
      offset v_offset
      limit v_limit + 1
    ),
    visible_rows as (
      select elem, page_ordinality
      from page_rows
      where page_ordinality <= v_limit
      order by page_ordinality
    )
    select
      coalesce(
        (select jsonb_agg(elem order by page_ordinality) from visible_rows),
        '[]'::jsonb
      ),
      exists(
        select 1 from page_rows where page_ordinality = v_limit + 1
      )
    into v_items, v_has_more;
  else
    with page_rows as (
      select elem, ordinality
      from jsonb_array_elements(coalesce(v_source, '[]'::jsonb))
        with ordinality as t(elem, ordinality)
      where ordinality > v_offset
        and ordinality <= v_offset + v_limit + 1
      order by ordinality
    ),
    visible_rows as (
      select elem, ordinality
      from page_rows
      where ordinality <= v_offset + v_limit
      order by ordinality
    )
    select
      coalesce(
        (select jsonb_agg(elem order by ordinality) from visible_rows),
        '[]'::jsonb
      ),
      exists(
        select 1
        from page_rows
        where ordinality = v_offset + v_limit + 1
      )
    into v_items, v_has_more;
  end if;

  return jsonb_build_object(
    'items', v_items,
    'hasMore', v_has_more,
    'nextOffset', case when v_has_more then v_offset + v_limit else null end,
    'offset', v_offset,
    'limit', v_limit,
    'totalCount', v_total_count
  );
end;
$function$;

revoke all on function public.get_public_home_feed_page(
  double precision,
  double precision,
  text,
  text,
  integer,
  integer
) from public;

grant execute on function public.get_public_home_feed_page(
  double precision,
  double precision,
  text,
  text,
  integer,
  integer
) to anon, authenticated, service_role;


-- Reduce category-page network transfer while preserving the existing list
-- ordering/privacy behavior. The client retains its previous path as fallback.
create or replace function public.get_public_segment_feed(
  p_segment text,
  p_visitor_lat double precision default null,
  p_visitor_lng double precision default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_segment text := trim(coalesce(p_segment, ''));
  v_has_visitor_loc boolean := false;
  v_source jsonb;
  v_result jsonb;
begin
  if v_segment = '' then
    return '[]'::jsonb;
  end if;

  if p_visitor_lat is not null and p_visitor_lng is not null
     and p_visitor_lat >= -90.0 and p_visitor_lat <= 90.0
     and p_visitor_lng >= -180.0 and p_visitor_lng <= 180.0
     and not (p_visitor_lat = 0.0 and p_visitor_lng = 0.0) then
    v_has_visitor_loc := true;
  end if;

  if v_has_visitor_loc then
    v_source := public.get_public_home_feed(
      p_visitor_lat,
      p_visitor_lng,
      'all',
      'all'
    );
  else
    v_source := public.get_public_published_reports();
  end if;

  select coalesce(jsonb_agg(elem order by ordinality), '[]'::jsonb)
  into v_result
  from jsonb_array_elements(coalesce(v_source, '[]'::jsonb))
    with ordinality as t(elem, ordinality)
  where elem->>'segment' = v_segment;

  return v_result;
end;
$function$;

revoke all on function public.get_public_segment_feed(
  text,
  double precision,
  double precision
) from public;

grant execute on function public.get_public_segment_feed(
  text,
  double precision,
  double precision
) to anon, authenticated, service_role;
