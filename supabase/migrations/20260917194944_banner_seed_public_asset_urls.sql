-- Normalize seeded code-backed banner paths to public absolute URLs so Admin preview
-- and Public rendering use the same stable assets before any replacement upload.

update public.site_banners
set draft_content = jsonb_set(
      draft_content,
      '{illustrationSrc}',
      to_jsonb('https://shihabshajib01-cell.github.io/sobaike-janao/' || ltrim(draft_content->>'illustrationSrc','/'))
    ),
    published_content = jsonb_set(
      published_content,
      '{illustrationSrc}',
      to_jsonb('https://shihabshajib01-cell.github.io/sobaike-janao/' || ltrim(published_content->>'illustrationSrc','/'))
    )
where (draft_content->>'illustrationSrc') like '/illustrations/services/%'
  and (published_content->>'illustrationSrc') like '/illustrations/services/%';
