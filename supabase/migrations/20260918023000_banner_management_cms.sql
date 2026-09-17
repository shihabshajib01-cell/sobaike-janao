-- Source alignment for the live Admin-controlled banner CMS.
-- Public reads only published_content via RPC; Admin draft/publish operations are permission-gated.

create table if not exists public.site_banners (
  category_key text primary key references public.segments(id) on update cascade on delete restrict,
  draft_content jsonb not null,
  published_content jsonb not null,
  draft_updated_at timestamptz not null default now(),
  draft_updated_by uuid null,
  published_at timestamptz not null default now(),
  published_by uuid null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now()
);

alter table public.site_banners enable row level security;
revoke all on table public.site_banners from anon, authenticated;

insert into public.permissions (id, module, action, name_en, name_bn, description)
values (
  'banners.manage', 'banners', 'manage', 'Manage Banners', 'ব্যানার পরিচালনা করুন',
  'Edit, preview, and publish public hero banner content.'
)
on conflict (id) do update set
  module = excluded.module,
  action = excluded.action,
  name_en = excluded.name_en,
  name_bn = excluded.name_bn,
  description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select 'supper-admin', 'banners.manage'
where exists (select 1 from public.roles where id = 'supper-admin')
on conflict do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'banner-media', 'banner-media', true, 5242880,
  array['image/jpeg','image/png','image/webp','image/avif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

with seed(category_key, content) as (
  values
  ('harassment', $json${
    "titleBn":"হয়রানি ও নির্যাতন","titleEn":"Harassment & Abuse",
    "mobileDescriptionBn":"আপনি বা পরিচিত কেউ কি কোনো ধরনের হয়রানি বা নির্যাতনের শিকার?","mobileDescriptionEn":"Are you or someone you know facing any harassment or abuse?",
    "tabletDescriptionBn":"শারীরিক, মৌখিক বা অনলাইন নির্যাতন ও হয়রানির তথ্য জানান।","tabletDescriptionEn":"Report physical, verbal, or online abuse and harassment.",
    "desktopDescriptionBn":"শারীরিক, মৌখিক বা অনলাইন হয়রানি, নির্যাতন, হুমকি বা অনিরাপদ আচরণের তথ্য জানান।","desktopDescriptionEn":"Report physical, verbal, or online harassment, abuse, threats, or unsafe behaviour.",
    "illustrationSrc":"https://shihabshajib01-cell.github.io/sobaike-janao/illustrations/services/harassment-hero-public-harassment-v02.jpg",
    "primaryCtaBn":"রিপোর্ট করুন","primaryCtaEn":"Report now","showOnHome":true,"isActive":true,"sortOrder":1
  }$json$::jsonb),
  ('load_shedding', $json${
    "titleBn":"ইউটিলিটি সমস্যা","titleEn":"Utility Issues",
    "mobileDescriptionBn":"আপনি কি এলাকায় বিদ্যুৎ বিভ্রাট, গ্যাস সংকট বা বিলিং সমস্যায় ভুগছেন?","mobileDescriptionEn":"Are you facing power cuts, gas shortages, or billing problems?",
    "tabletDescriptionBn":"লোডশেডিং, গ্যাস সংকট বা ভুল ইউটিলিটি বিলের তথ্য জমা দিন।","tabletDescriptionEn":"Report load shedding, gas shortages, or incorrect utility bills.",
    "desktopDescriptionBn":"ঘন ঘন লোডশেডিং, তীব্র গ্যাস সংকট, বিদ্যুৎ বিপর্যয় বা ভুল বিলিং সমস্যার তথ্য জানান।","desktopDescriptionEn":"Report chronic load shedding, gas shortages, power failures, or incorrect bills.",
    "illustrationSrc":"https://shihabshajib01-cell.github.io/sobaike-janao/illustrations/services/load-shedding-hero-family-blackout-v01.jpg",
    "primaryCtaBn":"রিপোর্ট করুন","primaryCtaEn":"Report now","showOnHome":true,"isActive":true,"sortOrder":2
  }$json$::jsonb),
  ('extortion', $json${
    "titleBn":"ঘুষ ও চাঁদাবাজি","titleEn":"Bribery & Extortion",
    "mobileDescriptionBn":"আপনার কাছে কি ঘুষ বা অবৈধ চাঁদা দাবি করা হয়েছে?","mobileDescriptionEn":"Have you faced a bribe demand, extortion, or coercive payment?",
    "tabletDescriptionBn":"ঘুষ, অবৈধ চাঁদা, হুমকি বা জোরপূর্বক অর্থ আদায়ের তথ্য জানান।","tabletDescriptionEn":"Report bribery, illegal demands, threats, or forced payment collection.",
    "desktopDescriptionBn":"সেবা, ব্যবসা, পরিবহন বা এলাকায় ঘুষ, অবৈধ অর্থ দাবি, হুমকি বা জোরপূর্বক আদায়ের তথ্য জানান।","desktopDescriptionEn":"Report bribery, illegal payment demands, threats, or forced collections in services and local areas.",
    "illustrationSrc":"https://shihabshajib01-cell.github.io/sobaike-janao/illustrations/services/extortion-hero-shopkeeper-coercion-v02.jpg",
    "primaryCtaBn":"রিপোর্ট করুন","primaryCtaEn":"Report now","showOnHome":true,"isActive":true,"sortOrder":3
  }$json$::jsonb),
  ('public_safety', $json${
    "titleBn":"জননিরাপত্তা","titleEn":"Public Safety",
    "mobileDescriptionBn":"চুরি, ডাকাতি বা ছিনতাইয়ের কোনো ঘটনা দেখেছেন বা ভুক্তভোগী হয়েছেন?","mobileDescriptionEn":"Have you witnessed or experienced theft, robbery, or snatching?",
    "tabletDescriptionBn":"চুরি, ডাকাতি, ছিনতাই ও সংশ্লিষ্ট জননিরাপত্তার ঘটনার তথ্য জানান।","tabletDescriptionEn":"Report theft, robbery, snatching, and related public-safety incidents.",
    "desktopDescriptionBn":"চুরি, ডাকাতি বা ছিনতাইয়ের ঘটনা, স্থান, সময় এবং প্রাসঙ্গিক তথ্য নিরাপদভাবে জানান।","desktopDescriptionEn":"Report the place, time, and relevant details of theft, robbery, or snatching incidents.",
    "illustrationSrc":"https://shihabshajib01-cell.github.io/sobaike-janao/illustrations/services/public-safety-hero-rickshaw-snatching-v01.avif",
    "primaryCtaBn":"রিপোর্ট করুন","primaryCtaEn":"Report now","showOnHome":true,"isActive":true,"sortOrder":4
  }$json$::jsonb),
  ('road_transport', $json${
    "titleBn":"সড়ক ও যাতায়াত সমস্যা","titleEn":"Road & Transport Issues",
    "mobileDescriptionBn":"রাস্তা মেরামতে বিলম্ব, দুর্ঘটনা বা সড়ক অবরোধের সমস্যা আছে?","mobileDescriptionEn":"Is there a delayed road repair, accident, or road obstruction?",
    "tabletDescriptionBn":"রাস্তা মেরামতে বিলম্ব, সড়ক দুর্ঘটনা বা চলাচলে বাধার তথ্য জানান।","tabletDescriptionEn":"Report delayed road repairs, road accidents, or travel obstructions.",
    "desktopDescriptionBn":"রাস্তা মেরামতে বিলম্ব, সড়ক দুর্ঘটনা, অবরোধ বা চলাচলে বাধার স্থান ও বিস্তারিত তথ্য জানান।","desktopDescriptionEn":"Report locations and details of delayed road repairs, road accidents, blocks, or travel obstructions.",
    "illustrationSrc":"https://shihabshajib01-cell.github.io/sobaike-janao/illustrations/services/road-transport-hero-broken-road-rickshaw-v01.avif",
    "primaryCtaBn":"রিপোর্ট করুন","primaryCtaEn":"Report now","showOnHome":true,"isActive":true,"sortOrder":5
  }$json$::jsonb),
  ('illegal_occupation', $json${
    "titleBn":"অবৈধ দখল","titleEn":"Illegal Occupation",
    "mobileDescriptionBn":"রাস্তা, ফুটপাত বা কোনো জমি ও সম্পত্তি অবৈধভাবে দখল করা হয়েছে?","mobileDescriptionEn":"Is a public space, land, or property being occupied illegally?",
    "tabletDescriptionBn":"রাস্তা, ফুটপাত, ব্যক্তিগত বা সরকারি জমি ও সম্পত্তির অবৈধ দখল জানান।","tabletDescriptionEn":"Report illegal occupation of public space, private land, or government property.",
    "desktopDescriptionBn":"রাস্তা, ফুটপাত, ফুটওভার ব্রিজ, ব্যক্তিগত জমি বা সরকারি সম্পত্তির অবৈধ দখলের তথ্য জানান।","desktopDescriptionEn":"Report illegal occupation of roads, footpaths, foot-over-bridges, private land, or government property.",
    "illustrationSrc":"https://shihabshajib01-cell.github.io/sobaike-janao/illustrations/services/illegal-occupation-hero-footpath-encroachment-v01.avif",
    "primaryCtaBn":"রিপোর্ট করুন","primaryCtaEn":"Report now","showOnHome":true,"isActive":true,"sortOrder":6
  }$json$::jsonb),
  ('rickshaw', $json${
    "titleBn":"অবৈধ অটো-রিকশা চার্জিং স্টেশন","titleEn":"Illegal Auto-rickshaw Charging Station",
    "mobileDescriptionBn":"আপনার এলাকায় কি কোনো অবৈধ বা ঝুঁকিপূর্ণ অটো-রিকশা চার্জিং স্টেশন রয়েছে?","mobileDescriptionEn":"Is there an illegal or unsafe auto-rickshaw charging station nearby?",
    "tabletDescriptionBn":"অনিরাপদ অটো-রিকশা ব্যাটারি চার্জিং ও ঝুঁকিপূর্ণ বিদ্যুৎ সংযোগের তথ্য দিন।","tabletDescriptionEn":"Report unsafe auto-rickshaw battery charging and risky electrical connections.",
    "desktopDescriptionBn":"অবৈধ বা অনিরাপদ অটো-রিকশা চার্জিং স্টেশন, খোলা তার বা ঝুঁকিপূর্ণ বিদ্যুৎ সংযোগের তথ্য জানান।","desktopDescriptionEn":"Report illegal or unsafe auto-rickshaw charging stations, exposed wiring, or risky power connections.",
    "illustrationSrc":"https://shihabshajib01-cell.github.io/sobaike-janao/illustrations/services/rickshaw-hero-illegal-charging-station-v02.jpg",
    "primaryCtaBn":"রিপোর্ট করুন","primaryCtaEn":"Report now","showOnHome":true,"isActive":true,"sortOrder":7
  }$json$::jsonb)
)
insert into public.site_banners (category_key, draft_content, published_content)
select category_key, content, content from seed
on conflict (category_key) do nothing;

create or replace function public.get_public_site_banners()
returns table(category_key text, content jsonb, version integer, published_at timestamptz)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select b.category_key, b.published_content, b.version, b.published_at
  from public.site_banners b
  order by coalesce((b.published_content->>'sortOrder')::integer, 999), b.category_key;
$$;

revoke all on function public.get_public_site_banners() from public;
grant execute on function public.get_public_site_banners() to anon, authenticated;

create or replace function public.admin_get_site_banners()
returns table(
  category_key text,
  draft_content jsonb,
  published_content jsonb,
  draft_updated_at timestamptz,
  draft_updated_by uuid,
  published_at timestamptz,
  published_by uuid,
  version integer
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or not public.has_permission('banners.manage') then
    raise exception 'Permission denied' using errcode = '42501';
  end if;
  return query
  select b.category_key, b.draft_content, b.published_content,
         b.draft_updated_at, b.draft_updated_by,
         b.published_at, b.published_by, b.version
  from public.site_banners b
  order by coalesce((b.draft_content->>'sortOrder')::integer, 999), b.category_key;
end;
$$;

create or replace function public.admin_save_banner_draft(p_category_key text, p_content jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_required text[] := array[
    'titleBn','titleEn','mobileDescriptionBn','mobileDescriptionEn',
    'tabletDescriptionBn','tabletDescriptionEn','desktopDescriptionBn','desktopDescriptionEn',
    'illustrationSrc','primaryCtaBn','primaryCtaEn'
  ];
  v_key text;
  v_order integer;
begin
  if auth.uid() is null or not public.has_permission('banners.manage') then
    raise exception 'Permission denied' using errcode = '42501';
  end if;
  if not exists (select 1 from public.site_banners where category_key = p_category_key) then
    raise exception 'Unknown banner category';
  end if;
  if p_content is null or jsonb_typeof(p_content) <> 'object' then
    raise exception 'Banner content must be a JSON object';
  end if;
  foreach v_key in array v_required loop
    if nullif(btrim(p_content->>v_key), '') is null then
      raise exception 'Banner field % is required', v_key;
    end if;
  end loop;
  if jsonb_typeof(p_content->'showOnHome') <> 'boolean'
     or jsonb_typeof(p_content->'isActive') <> 'boolean' then
    raise exception 'Banner visibility fields must be boolean';
  end if;
  if coalesce(p_content->>'sortOrder','') !~ '^[0-9]+$' then
    raise exception 'Banner sortOrder must be a positive integer';
  end if;
  v_order := (p_content->>'sortOrder')::integer;
  if v_order < 1 or v_order > 99 then
    raise exception 'Banner sortOrder must be between 1 and 99';
  end if;
  update public.site_banners
  set draft_content = p_content,
      draft_updated_at = now(),
      draft_updated_by = auth.uid()
  where category_key = p_category_key;
  return jsonb_build_object('ok', true, 'categoryKey', p_category_key);
end;
$$;

create or replace function public.admin_publish_banner(p_category_key text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_version integer;
begin
  if auth.uid() is null or not public.has_permission('banners.manage') then
    raise exception 'Permission denied' using errcode = '42501';
  end if;
  update public.site_banners
  set published_content = draft_content,
      published_at = now(),
      published_by = auth.uid(),
      version = version + 1
  where category_key = p_category_key
  returning version into v_version;
  if v_version is null then raise exception 'Unknown banner category'; end if;
  return jsonb_build_object('ok', true, 'categoryKey', p_category_key, 'version', v_version);
end;
$$;

revoke all on function public.admin_get_site_banners() from public, anon;
revoke all on function public.admin_save_banner_draft(text, jsonb) from public, anon;
revoke all on function public.admin_publish_banner(text) from public, anon;
grant execute on function public.admin_get_site_banners() to authenticated;
grant execute on function public.admin_save_banner_draft(text, jsonb) to authenticated;
grant execute on function public.admin_publish_banner(text) to authenticated;

drop policy if exists "banner media admin insert" on storage.objects;
create policy "banner media admin insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'banner-media' and public.has_permission('banners.manage'));

drop policy if exists "banner media admin select" on storage.objects;
create policy "banner media admin select"
on storage.objects for select to authenticated
using (bucket_id = 'banner-media' and public.has_permission('banners.manage'));

drop policy if exists "banner media admin update" on storage.objects;
create policy "banner media admin update"
on storage.objects for update to authenticated
using (bucket_id = 'banner-media' and public.has_permission('banners.manage'))
with check (bucket_id = 'banner-media' and public.has_permission('banners.manage'));

drop policy if exists "banner media admin delete" on storage.objects;
create policy "banner media admin delete"
on storage.objects for delete to authenticated
using (bucket_id = 'banner-media' and public.has_permission('banners.manage'));
