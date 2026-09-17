create or replace function public.get_public_category_popularity()
returns table (
  segment_id text,
  published_post_count bigint,
  view_count bigint,
  share_count bigint,
  popularity_score numeric,
  popularity_rank bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with published as (
    select item
    from jsonb_array_elements(public.get_public_published_reports()) item
  ),
  metrics as (
    select
      s.id as segment_id,
      s.sort_order,
      coalesce(count(p.item), 0)::bigint as published_post_count,
      coalesce(sum(coalesce((p.item->>'viewCount')::bigint, 0)), 0)::bigint as view_count,
      coalesce(sum(coalesce((p.item->>'shareCount')::bigint, 0)), 0)::bigint as share_count
    from public.segments s
    left join published p on p.item->>'segment' = s.id
    where s.active = true
    group by s.id, s.sort_order
  ),
  normalized as (
    select
      metrics.*,
      coalesce(published_post_count::numeric / nullif(max(published_post_count) over (), 0), 0) as post_norm,
      coalesce(view_count::numeric / nullif(max(view_count) over (), 0), 0) as view_norm,
      coalesce(share_count::numeric / nullif(max(share_count) over (), 0), 0) as share_norm
    from metrics
  ),
  scored as (
    select
      normalized.*,
      round((post_norm * 0.30) + (view_norm * 0.45) + (share_norm * 0.25), 6) as score
    from normalized
  )
  select
    scored.segment_id,
    scored.published_post_count,
    scored.view_count,
    scored.share_count,
    scored.score as popularity_score,
    row_number() over (
      order by
        scored.score desc,
        scored.published_post_count desc,
        scored.view_count desc,
        scored.share_count desc,
        scored.sort_order asc
    )::bigint as popularity_rank
  from scored
  order by popularity_rank;
$$;

revoke execute on function public.get_public_category_popularity() from public;
grant execute on function public.get_public_category_popularity() to anon, authenticated, service_role;
