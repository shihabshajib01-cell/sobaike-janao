-- Home hero banners navigate to their category pages and do not show the report CTA.
-- Category-page banners keep their existing CTA labels and reporting behavior.
--
-- Keep this Home-only interaction flag inside the existing JSON banner contract so
-- no table shape or public RPC signature changes are required.

update public.site_banners
set
  draft_content = jsonb_set(
    coalesce(draft_content, '{}'::jsonb),
    '{showHomeCta}',
    'false'::jsonb,
    true
  ),
  published_content = case
    when published_content is null then null
    else jsonb_set(
      published_content,
      '{showHomeCta}',
      'false'::jsonb,
      true
    )
  end,
  draft_updated_at = now()
where
  coalesce(draft_content->>'showHomeCta', '') is distinct from 'false'
  or (
    published_content is not null
    and coalesce(published_content->>'showHomeCta', '') is distinct from 'false'
  );
