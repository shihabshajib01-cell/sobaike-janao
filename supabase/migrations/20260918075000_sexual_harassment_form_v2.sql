-- Sexual Harassment form v2
-- Additive, backward-compatible extension of the existing harassment report contract.

alter table public.complaints
  add column if not exists sexual_harassment_type text,
  add column if not exists sexual_harassment_context text,
  add column if not exists sexual_harassment_institution text;

alter table public.complaints
  drop constraint if exists complaints_affected_person_age_group_check;
alter table public.complaints
  add constraint complaints_affected_person_age_group_check
  check (
    affected_person_age_group is null
    or affected_person_age_group in (
      'under_18','18_29','30_59','60_plus',
      'prefer_not_to_say','unknown_not_stated'
    )
  );

alter table public.complaints
  drop constraint if exists complaints_alleged_abuser_relationship_check;
alter table public.complaints
  add constraint complaints_alleged_abuser_relationship_check
  check (
    alleged_abuser_relationship is null
    or alleged_abuser_relationship in (
      'intimate_partner','household_family','other_relative',
      'friend_acquaintance','coworker_classmate',
      'authority_caregiver_service_provider','stranger','other_or_unknown',
      'neighbor','teacher_tutor','supervisor_employer','service_health_worker',
      'transport_worker','law_enforcement_authority','multiple_people',
      'other','unknown_not_stated'
    )
  );

alter table public.complaints
  drop constraint if exists complaints_frequency_check;
alter table public.complaints
  add constraint complaints_frequency_check
  check (frequency in ('one-time','repeated','ongoing','unknown_not_stated'));

alter table public.complaints
  drop constraint if exists complaints_sexual_harassment_type_check;
alter table public.complaints
  add constraint complaints_sexual_harassment_type_check
  check (
    sexual_harassment_type is null
    or sexual_harassment_type in (
      'eve_teasing','unwanted_physical_contact',
      'sexual_comments_gestures_proposition','workplace_harassment',
      'abuse_of_power','stalking','online_digital_harassment',
      'other','unknown_not_stated'
    )
  );

alter table public.complaints
  drop constraint if exists complaints_sexual_harassment_context_check;
alter table public.complaints
  add constraint complaints_sexual_harassment_context_check
  check (
    sexual_harassment_context is null
    or sexual_harassment_context in (
      'workplace','educational_institution','healthcare','public_transport',
      'road_public_space','home_private_space','online_social_media',
      'government_service','other','unknown_not_stated'
    )
  );

alter table public.complaints
  drop constraint if exists complaints_sexual_harassment_institution_length_check;
alter table public.complaints
  add constraint complaints_sexual_harassment_institution_length_check
  check (
    sexual_harassment_institution is null
    or char_length(sexual_harassment_institution) <= 200
  );

create or replace function public.submit_public_complaint_v3(
  p_payload jsonb,
  p_client_submission_id text,
  p_reporter_context jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = 'pg_catalog','public'
as $$
declare
  v_segment text := trim(coalesce(p_payload->>'segment',''));
  v_subcategory text := trim(coalesce(p_payload->>'subcategoryId',p_payload->>'subcategory_id',''));
  v_type text;
  v_context text;
  v_institution text;
  v_age text;
  v_relationship text;
  v_frequency text;
  v_legacy_age text;
  v_legacy_relationship text;
  v_legacy_frequency text;
  v_legacy_payload jsonb := p_payload;
  v_result jsonb;
  v_report_id text;
begin
  if v_segment <> 'harassment' or v_subcategory <> 'sexual-harassment' then
    return public.submit_public_complaint_v2(
      p_payload,p_client_submission_id,p_reporter_context
    );
  end if;

  v_type := nullif(trim(coalesce(
    p_payload->>'sexualHarassmentType',
    p_payload->>'sexual_harassment_type',''
  )),'');

  v_context := nullif(trim(coalesce(
    p_payload->>'sexualHarassmentContext',
    p_payload->>'sexual_harassment_context',''
  )),'');

  v_institution := nullif(trim(coalesce(
    p_payload->>'sexualHarassmentInstitution',
    p_payload->>'sexual_harassment_institution',''
  )),'');

  v_age := nullif(trim(coalesce(
    p_payload->>'affectedPersonAgeGroup',
    p_payload->>'affected_person_age_group',''
  )),'');

  v_relationship := nullif(trim(coalesce(
    p_payload->>'allegedAbuserRelationship',
    p_payload->>'alleged_abuser_relationship',''
  )),'');

  v_frequency := nullif(trim(coalesce(p_payload->>'frequency','one-time')),'');

  if v_type is null or v_type not in (
    'eve_teasing','unwanted_physical_contact',
    'sexual_comments_gestures_proposition','workplace_harassment',
    'abuse_of_power','stalking','online_digital_harassment',
    'other','unknown_not_stated'
  ) then
    raise exception 'VALIDATION_FAILED: A valid sexual harassment type is required.';
  end if;

  if v_context is null or v_context not in (
    'workplace','educational_institution','healthcare','public_transport',
    'road_public_space','home_private_space','online_social_media',
    'government_service','other','unknown_not_stated'
  ) then
    raise exception 'VALIDATION_FAILED: A valid sexual harassment incident context is required.';
  end if;

  if v_institution is not null and char_length(v_institution) > 200 then
    raise exception 'VALIDATION_FAILED: Institution or organization must be 200 characters or fewer.';
  end if;

  if v_age is null or v_age not in (
    'under_18','18_29','30_59','60_plus',
    'prefer_not_to_say','unknown_not_stated'
  ) then
    raise exception 'VALIDATION_FAILED: A valid affected person age group is required.';
  end if;

  if v_relationship is null or v_relationship not in (
    'intimate_partner','household_family','other_relative',
    'friend_acquaintance','coworker_classmate',
    'authority_caregiver_service_provider','stranger','other_or_unknown',
    'neighbor','teacher_tutor','supervisor_employer','service_health_worker',
    'transport_worker','law_enforcement_authority','multiple_people',
    'other','unknown_not_stated'
  ) then
    raise exception 'VALIDATION_FAILED: A valid relationship with the alleged abuser is required.';
  end if;

  if v_frequency not in ('one-time','repeated','ongoing','unknown_not_stated') then
    raise exception 'VALIDATION_FAILED: A valid frequency is required.';
  end if;

  v_legacy_age := case
    when v_age='unknown_not_stated' then 'prefer_not_to_say'
    else v_age
  end;

  v_legacy_relationship := case
    when v_relationship='neighbor' then 'friend_acquaintance'
    when v_relationship in (
      'teacher_tutor','supervisor_employer','service_health_worker',
      'transport_worker','law_enforcement_authority'
    ) then 'authority_caregiver_service_provider'
    when v_relationship in ('multiple_people','other','unknown_not_stated')
      then 'other_or_unknown'
    else v_relationship
  end;

  v_legacy_frequency := case
    when v_frequency='ongoing' then 'repeated'
    when v_frequency='unknown_not_stated' then 'one-time'
    else v_frequency
  end;

  v_legacy_payload :=
    jsonb_set(v_legacy_payload,'{affectedPersonAgeGroup}',to_jsonb(v_legacy_age),true);
  v_legacy_payload :=
    jsonb_set(v_legacy_payload,'{allegedAbuserRelationship}',to_jsonb(v_legacy_relationship),true);
  v_legacy_payload :=
    jsonb_set(v_legacy_payload,'{frequency}',to_jsonb(v_legacy_frequency),true);

  v_result := public.submit_public_complaint_v2(
    v_legacy_payload,p_client_submission_id,p_reporter_context
  );

  v_report_id := nullif(trim(coalesce(v_result->>'reportId','')),'');
  if v_report_id is null then
    raise exception 'SUBMISSION_FAILED: Missing report identifier.';
  end if;

  update public.complaints
  set
    affected_person_age_group = v_age,
    alleged_abuser_relationship = v_relationship,
    frequency = v_frequency,
    sexual_harassment_type = v_type,
    sexual_harassment_context = v_context,
    sexual_harassment_institution = v_institution,
    updated_at = now()
  where id = v_report_id;

  return v_result;
end;
$$;

revoke all on function public.submit_public_complaint_v3(jsonb,text,jsonb) from public;
grant execute on function public.submit_public_complaint_v3(jsonb,text,jsonb) to anon, authenticated;

create or replace function public.get_public_sexual_harassment_context(p_report_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = 'pg_catalog','public'
as $$
declare
  v_result jsonb;
begin
  select jsonb_strip_nulls(jsonb_build_object(
    'sexualHarassmentType', c.sexual_harassment_type,
    'sexualHarassmentContext', c.sexual_harassment_context,
    'sexualHarassmentInstitution', c.sexual_harassment_institution,
    'frequency', c.frequency,
    'affectedPersonAgeGroup', c.affected_person_age_group,
    'allegedAbuserRelationship', c.alleged_abuser_relationship,
    'reportingFor', c.reporting_for
  ))
  into v_result
  from public.complaints c
  where upper(c.id)=upper(trim(coalesce(p_report_id,'')))
    and c.status='published'
    and c.segment_id='harassment'
    and c.subcategory_id='sexual-harassment';

  return coalesce(v_result,'{}'::jsonb);
end;
$$;

revoke all on function public.get_public_sexual_harassment_context(text) from public;
grant execute on function public.get_public_sexual_harassment_context(text) to anon, authenticated;
