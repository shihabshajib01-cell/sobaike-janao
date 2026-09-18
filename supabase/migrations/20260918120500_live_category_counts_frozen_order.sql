-- Keep public category ordering stable for 72 hours while returning live counters.
-- The snapshot owns only the visible sequence/score. Counts shown to citizens must
-- always match the current published-report feed.

create or replace function public.get_public_category_popularity()
returns table (
  segment_id text,
  published_post_count bigint,
  view_count bigint,
  share_count bigint,
  popularity_score numeric,
  popularity_rank bigint
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  last_snapshot_at timestamptz;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('sobaike_janao'),
    pg_catalog.hashtext('public_category_popularity_snapshot')
  );

  select max(snapshot.snapshot_at)
    into last_snapshot_at
  from public.public_category_popularity_snapshot snapshot;

  if last_snapshot_at is null
     or last_snapshot_at <= pg_catalog.now() - interval '72 hours' then

    delete from public.public_category_popularity_snapshot;

    insert into public.public_category_popularity_snapshot (
      segment_id,
      published_post_count,
      view_count,
      share_count,
      popularity_score,
      popularity_rank,
      snapshot_at
    )
    with published as (
      select item
      from pg_catalog.jsonb_array_elements(public.get_public_published_reports()) item
    ),
    metrics as (
      select
        segment.id as segment_id,
        segment.sort_order,
        coalesce(count(published.item), 0)::bigint as published_post_count,
        coalesce(sum(coalesce((published.item->>'viewCount')::bigint, 0)), 0)::bigint as view_count,
        coalesce(sum(coalesce((published.item->>'shareCount')::bigint, 0)), 0)::bigint as share_count
      from public.segments segment
      left join published on published.item->>'segment' = segment.id
      where segment.active = true
      group by segment.id, segment.sort_order
    ),
    normalized as (
      select
        metrics.*,
        coalesce(metrics.published_post_count::numeric / nullif(max(metrics.published_post_count) over (), 0), 0) as post_norm,
        coalesce(metrics.view_count::numeric / nullif(max(metrics.view_count) over (), 0), 0) as view_norm,
        coalesce(metrics.share_count::numeric / nullif(max(metrics.share_count) over (), 0), 0) as share_norm
      from metrics
    ),
    scored as (
      select
        normalized.*,
        round((post_norm * 0.30) + (view_norm * 0.45) + (share_norm * 0.25), 6) as score
      from normalized
    ),
    ranked as (
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
    )
    select
      ranked.segment_id,
      ranked.published_post_count,
      ranked.view_count,
      ranked.share_count,
      ranked.popularity_score,
      ranked.popularity_rank,
      pg_catalog.now()
    from ranked;
  end if;

  return query
  with published as (
    select item
    from pg_catalog.jsonb_array_elements(public.get_public_published_reports()) item
  ),
  live_metrics as (
    select
      segment.id as segment_id,
      segment.sort_order,
      coalesce(count(published.item), 0)::bigint as published_post_count,
      coalesce(sum(coalesce((published.item->>'viewCount')::bigint, 0)), 0)::bigint as view_count,
      coalesce(sum(coalesce((published.item->>'shareCount')::bigint, 0)), 0)::bigint as share_count
    from public.segments segment
    left join published on published.item->>'segment' = segment.id
    where segment.active = true
    group by segment.id, segment.sort_order
  ),
  combined as (
    select
      live.segment_id,
      live.sort_order,
      live.published_post_count,
      live.view_count,
      live.share_count,
      snapshot.popularity_score,
      snapshot.popularity_rank as snapshot_rank
    from live_metrics live
    left join public.public_category_popularity_snapshot snapshot
      on snapshot.segment_id = live.segment_id
  ),
  ordered as (
    select
      combined.*,
      row_number() over (
        order by
          case when combined.snapshot_rank is null then 1 else 0 end,
          combined.snapshot_rank asc nulls last,
          combined.sort_order asc,
          combined.segment_id asc
      )::bigint as effective_rank
    from combined
  )
  select
    ordered.segment_id,
    ordered.published_post_count,
    ordered.view_count,
    ordered.share_count,
    coalesce(ordered.popularity_score, 0)::numeric as popularity_score,
    ordered.effective_rank as popularity_rank
  from ordered
  order by ordered.effective_rank;
end;
$$;

comment on function public.get_public_category_popularity() is
  'Returns live published/view/share counters for every active category while keeping the visible category sequence frozen to the shared cumulative popularity snapshot for up to 72 hours.';

revoke execute on function public.get_public_category_popularity() from public;
grant execute on function public.get_public_category_popularity() to anon, authenticated, service_role;
