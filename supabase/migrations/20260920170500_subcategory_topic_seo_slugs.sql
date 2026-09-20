-- Stable SEO slugs for public subcategory/topic landing pages.
-- Slugs are generated from the immutable taxonomy id when absent and are
-- intentionally independent from display-name changes or parent moves.

alter table public.subcategories
  add column if not exists slug text;

update public.subcategories
set slug = btrim(
  regexp_replace(
    regexp_replace(lower(replace(id, '_', '-')), '[^a-z0-9-]+', '-', 'g'),
    '-+',
    '-',
    'g'
  ),
  '-'
)
where slug is null or btrim(slug) = '';

create unique index if not exists subcategories_slug_lower_uidx
  on public.subcategories (lower(slug));

alter table public.subcategories
  drop constraint if exists subcategories_slug_nonempty;

alter table public.subcategories
  add constraint subcategories_slug_nonempty
  check (slug is not null and btrim(slug) <> '');

create or replace function private.ensure_subcategory_slug()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_slug text;
begin
  if new.slug is null or pg_catalog.btrim(new.slug) = '' then
    v_slug := pg_catalog.lower(pg_catalog.replace(new.id, '_', '-'));
  else
    v_slug := pg_catalog.lower(pg_catalog.btrim(new.slug));
  end if;

  v_slug := pg_catalog.regexp_replace(v_slug, '[^a-z0-9-]+', '-', 'g');
  v_slug := pg_catalog.regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := pg_catalog.btrim(v_slug, '-');

  if v_slug = '' then
    raise exception 'SUBCATEGORY_SLUG_REQUIRED'
      using errcode = '23514';
  end if;

  new.slug := v_slug;
  return new;
end;
$function$;

revoke execute on function private.ensure_subcategory_slug()
from public, anon, authenticated;

drop trigger if exists trg_ensure_subcategory_slug on public.subcategories;
create trigger trg_ensure_subcategory_slug
before insert or update of slug, id
on public.subcategories
for each row
execute function private.ensure_subcategory_slug();

comment on column public.subcategories.slug is
  'Stable public SEO slug. Generated from taxonomy id when absent; does not change when display names or parent category change.';
