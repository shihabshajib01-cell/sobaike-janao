-- Keep legacy harassment submission validation synchronized with
-- the current public harassment classification option set.
-- No public form fields are added or changed.

do $$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid
    into v_oid
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='submit_public_complaint_v2'
    and pg_get_function_identity_arguments(p.oid)='p_payload jsonb, p_client_submission_id text, p_reporter_context jsonb'
  limit 1;

  if v_oid is null then
    raise exception 'submit_public_complaint_v2 not found';
  end if;

  v_def := pg_get_functiondef(v_oid);

  v_def := replace(
    v_def,
    '(''under_18'', ''18_29'', ''30_59'', ''60_plus'', ''prefer_not_to_say'')',
    '(''under_18'', ''18_29'', ''30_59'', ''60_plus'', ''prefer_not_to_say'', ''unknown_not_stated'')'
  );

  v_def := replace(
    v_def,
    '(''intimate_partner'', ''household_family'', ''other_relative'', ''friend_acquaintance'', ''coworker_classmate'', ''authority_caregiver_service_provider'', ''stranger'', ''other_or_unknown'')',
    '(''intimate_partner'', ''household_family'', ''other_relative'', ''friend_acquaintance'', ''coworker_classmate'', ''authority_caregiver_service_provider'', ''stranger'', ''other_or_unknown'', ''neighbor'', ''teacher_tutor'', ''supervisor_employer'', ''service_health_worker'', ''transport_worker'', ''law_enforcement_authority'', ''multiple_people'', ''other'', ''unknown_not_stated'')'
  );

  execute v_def;
end
$$;
