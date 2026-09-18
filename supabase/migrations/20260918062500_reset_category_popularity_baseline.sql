-- One-time baseline reset for category ordering.
-- Keep the existing cumulative popularity formula and 72-hour refresh rule unchanged.
-- Start the visible sequence from the current admin/taxonomy sort_order, then let
-- the shared popularity snapshot refresh normally after 72 hours.

with baseline as (
  select pg_catalog.now() as snapshot_at
)
insert into public.public_category_popularity_snapshot (
  segment_id,
  published_post_count,
  view_count,
  share_count,
  popularity_score,
  popularity_rank,
  snapshot_at
)
select
  s.id,
  coalesce(snap.published_post_count, 0),
  coalesce(snap.view_count, 0),
  coalesce(snap.share_count, 0),
  coalesce(snap.popularity_score, 0),
  s.sort_order::bigint,
  baseline.snapshot_at
from public.segments s
cross join baseline
left join public.public_category_popularity_snapshot snap
  on snap.segment_id = s.id
where s.active = true
on conflict (segment_id) do update
set
  popularity_rank = excluded.popularity_rank,
  snapshot_at = excluded.snapshot_at;

delete from public.public_category_popularity_snapshot snap
where not exists (
  select 1
  from public.segments s
  where s.id = snap.segment_id
    and s.active = true
);

comment on table public.public_category_popularity_snapshot is
  'Shared public category-order snapshot. Baseline was reset to admin/taxonomy sort_order on 2026-09-18; subsequent refreshes continue to use cumulative popularity every 72 hours.';
