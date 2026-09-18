-- Blackmail / Coercion field sync
-- Keeps the existing public form unchanged while enforcing exact storage scope
-- and exposing the same submitted values on the existing public detail contract.

alter table public.complaints
  drop constraint if exists complaints_intimate_what_happened_check;

alter table public.complaints
  add constraint complaints_intimate_what_happened_check
  check (
    intimate_what_happened is null
    or (
      segment_id = 'harassment'
      and subcategory_id = 'blackmail-coercion'
      and jsonb_typeof(intimate_what_happened) = 'string'
      and (intimate_what_happened #>> '{}') in (
        'threatened',
        'already_shared',
        'recorded_secretly',
        'manipulated_deepfake',
        'other'
      )
    )
  );

alter table public.complaints
  drop constraint if exists complaints_intimate_platform_check;

alter table public.complaints
  add constraint complaints_intimate_platform_check
  check (
    intimate_platform is null
    or (
      segment_id = 'harassment'
      and subcategory_id = 'blackmail-coercion'
      and jsonb_typeof(intimate_platform) = 'string'
      and (intimate_platform #>> '{}') in (
        'facebook',
        'messenger',
        'whatsapp',
        'telegram',
        'dating_app',
        'website',
        'in_person',
        'other'
      )
    )
  );

do $$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid
    into v_oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'get_public_published_report'
    and pg_get_function_identity_arguments(p.oid) = 'p_report_id text'
  limit 1;

  if v_oid is null then
    raise exception 'get_public_published_report not found';
  end if;

  v_def := pg_get_functiondef(v_oid);

  if position('''intimateWhatHappened''' in v_def) = 0 then
    v_def := replace(
      v_def,
      '''reportingFor'', c.reporting_for,' || E'\n    ' || '''incidentTime''',
      '''reportingFor'', c.reporting_for,' || E'\n    ' ||
      '''intimateWhatHappened'', CASE WHEN c.segment_id = ''harassment'' AND c.subcategory_id = ''blackmail-coercion'' THEN c.intimate_what_happened #>> ''{}'' ELSE NULL END,' || E'\n    ' ||
      '''intimatePlatform'', CASE WHEN c.segment_id = ''harassment'' AND c.subcategory_id = ''blackmail-coercion'' THEN c.intimate_platform #>> ''{}'' ELSE NULL END,' || E'\n    ' ||
      '''incidentTime'''
    );
  end if;

  execute v_def;
end
$$;
