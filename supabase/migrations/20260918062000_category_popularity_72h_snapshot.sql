-- Freeze the public category popularity order for 72 hours at a time.
-- Engagement counters and the existing popularity formula remain unchanged;
-- only the visible category sequence is snapshotted.

create table if not exists public.public_category_popularity_snapshot (
  segment_id text primary key references public.segments(id) on delete cascade,
  published_post_count bigint not null default 0,
  view_count bigint not null default 0,
  share_count bigint not null default 0,
  popularity_score numeric not null default 0,
  popularity_rank bigint not null,
  snapshot_at timestamptz not null
);

alter table public.public_category_popularity_snapshot enable row level security;

revoke all on table public.public_category_popularity_snapshot from public, anon, authenticated;

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

  select max(s.snapshot_at)
    into last_snapshot_at
  from public.public_category_popularity_snapshot s;

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
  select
    snap.segment_id,
    snap.published_post_count,
    snap.view_count,
    snap.share_count,
    snap.popularity_score,
    snap.popularity_rank
  from public.public_category_popularity_snapshot snap
  where exists (
    select 1
    from public.segments s
    where s.id = snap.segment_id
      and s.active = true
  )
  order by snap.popularity_rank;
end;
$$;

comment on function public.get_public_category_popularity() is
  'Returns the existing cumulative category popularity ranking from a shared 72-hour snapshot. Engagement counters continue updating in real time; visible category order refreshes at most once every 72 hours.';

revoke execute on function public.get_public_category_popularity() from public;
grant execute on function public.get_public_category_popularity() to anon, authenticated, service_role;

-- Seed the first shared snapshot immediately so every public surface starts from
-- the same canonical order and remains stable for the next 72 hours.
select * from public.get_public_category_popularity();
