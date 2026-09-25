-- Keep the public popularity RPC read-only. Snapshot maintenance runs privately
-- so concurrent anonymous page loads cannot contend on snapshot refresh work.

create or replace function private.refresh_public_category_popularity_snapshot(
  p_force boolean default false
)
returns boolean
language plpgsql
volatile
security definer
set search_path = 'pg_catalog', 'public', 'private', 'pg_temp'
as $$
declare
  v_last_snapshot_at timestamptz;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('sobaike_janao'),
    pg_catalog.hashtext('public_category_popularity_snapshot')
  );

  select max(snapshot_at)
  into v_last_snapshot_at
  from public.public_category_popularity_snapshot;

  if not coalesce(p_force, false)
     and v_last_snapshot_at is not null
     and v_last_snapshot_at > pg_catalog.now() - interval '72 hours'
  then
    return false;
  end if;

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
  ranked as (
    select
      normalized.segment_id,
      normalized.published_post_count,
      normalized.view_count,
      normalized.share_count,
      round(
        (normalized.post_norm * 0.30) +
        (normalized.view_norm * 0.45) +
        (normalized.share_norm * 0.25),
        6
      ) as popularity_score,
      row_number() over (
        order by
          ((normalized.post_norm * 0.30) +
           (normalized.view_norm * 0.45) +
           (normalized.share_norm * 0.25)) desc,
          normalized.published_post_count desc,
          normalized.view_count desc,
          normalized.share_count desc,
          normalized.sort_order asc,
          normalized.segment_id asc
      )::bigint as popularity_rank
    from normalized
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

  return true;
end;
$$;

revoke execute on function private.refresh_public_category_popularity_snapshot(boolean)
from public, anon, authenticated, service_role;

create or replace function public.get_public_category_popularity()
returns table(
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
    coalesce(ordered.popularity_score, 0)::numeric,
    ordered.effective_rank
  from ordered
  order by ordered.effective_rank;
$$;

grant execute on function public.get_public_category_popularity() to anon, authenticated;

select private.refresh_public_category_popularity_snapshot(false);

do $$
declare
  v_job_id bigint;
begin
  select jobid
  into v_job_id
  from cron.job
  where jobname = 'refresh-public-category-popularity-snapshot'
  limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'refresh-public-category-popularity-snapshot',
    '23 * * * *',
    'select private.refresh_public_category_popularity_snapshot(false);'
  );
end
$$;
