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
security definer
set search_path = ''
as $$
  with metrics as (
    select
      s.id as segment_id,
      s.sort_order,
      count(c.id)::bigint as published_post_count,
      coalesce(sum(c.public_view_count), 0)::bigint as view_count,
      coalesce(sum(c.public_share_count), 0)::bigint as share_count
    from public.segments s
    left join public.complaints c
      on c.segment_id = s.id
     and c.status = 'published'
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

comment on function public.get_public_category_popularity() is
  'Public aggregate category ranking. Published reports only. Score weights: posts 30%, views 45%, shares 25%, normalized against the highest active category per signal.';

revoke execute on function public.get_public_category_popularity() from public;
grant execute on function public.get_public_category_popularity() to anon, authenticated, service_role;
