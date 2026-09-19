-- Keep published hero copy footprints stable across every complaint category.
-- Drafts may be saved while editing; publishing enforces the approved fixed lengths.

create or replace function public.admin_publish_banner(p_category_key text)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_version integer;
  v_content jsonb;
begin
  if auth.uid() is null or not public.has_permission('banners.manage') then
    raise exception 'Permission denied' using errcode='42501';
  end if;

  select draft_content
    into v_content
  from public.site_banners
  where category_key = p_category_key
  for update;

  if v_content is null then
    raise exception 'Unknown banner category';
  end if;

  if char_length(coalesce(v_content->>'mobileDescriptionBn', '')) <> 60
     or char_length(coalesce(v_content->>'tabletDescriptionBn', '')) <> 60
     or char_length(coalesce(v_content->>'desktopDescriptionBn', '')) <> 60 then
    raise exception 'Every Bengali banner description must be exactly 60 characters';
  end if;

  if char_length(coalesce(v_content->>'mobileDescriptionEn', '')) <> 62
     or char_length(coalesce(v_content->>'tabletDescriptionEn', '')) <> 62
     or char_length(coalesce(v_content->>'desktopDescriptionEn', '')) <> 62 then
    raise exception 'Every English banner description must be exactly 62 characters';
  end if;

  update public.site_banners
  set
    published_content = draft_content,
    published_at = now(),
    published_by = auth.uid(),
    version = version + 1
  where category_key = p_category_key
  returning version into v_version;

  return jsonb_build_object('ok', true, 'categoryKey', p_category_key, 'version', v_version);
end;
$function$;
