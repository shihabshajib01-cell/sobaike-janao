-- Harassment classification dimensions
-- Additive, privacy-safe extension. Existing public feed/detail RPCs are intentionally left untouched.
-- Public clients use submit_public_complaint_v2 and merge the safe classification RPC by report id.

alter table public.complaints
  add column if not exists affected_person_age_group text,
  add column if not exists alleged_abuser_relationship text,
  add column if not exists reporting_for text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'complaints_affected_person_age_group_check'
      and conrelid = 'public.complaints'::regclass
  ) then
    alter table public.complaints
      add constraint complaints_affected_person_age_group_check
      check (
        affected_person_age_group is null
        or affected_person_age_group in (
          'under_18', '18_29', '30_59', '60_plus', 'prefer_not_to_say'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'complaints_alleged_abuser_relationship_check'
      and conrelid = 'public.complaints'::regclass
  ) then
    alter table public.complaints
      add constraint complaints_alleged_abuser_relationship_check
      check (
        alleged_abuser_relationship is null
        or alleged_abuser_relationship in (
          'intimate_partner',
          'household_family',
          'other_relative',
          'friend_acquaintance',
          'coworker_classmate',
          'authority_caregiver_service_provider',
          'stranger',
          'other_or_unknown'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'complaints_reporting_for_check'
      and conrelid = 'public.complaints'::regclass
  ) then
    alter table public.complaints
      add constraint complaints_reporting_for_check
      check (
        reporting_for is null
        or reporting_for in ('self', 'someone_else')
      );
  end if;
end
$$;

create index if not exists idx_complaints_harassment_age_status
  on public.complaints (affected_person_age_group, status, created_at desc)
  where segment_id = 'harassment';

create index if not exists idx_complaints_harassment_relationship_status
  on public.complaints (alleged_abuser_relationship, status, created_at desc)
  where segment_id = 'harassment';

create index if not exists idx_complaints_harassment_reporting_for_status
  on public.complaints (reporting_for, status, created_at desc)
  where segment_id = 'harassment';

comment on column public.complaints.affected_person_age_group is
  'Broad age group of the affected person for harassment reports. Never stores exact age.';
comment on column public.complaints.alleged_abuser_relationship is
  'Reporter-selected relationship category to the alleged abuser for harassment reports.';
comment on column public.complaints.reporting_for is
  'Whether the harassment report is submitted for the reporter or for someone else.';

create or replace function public.submit_public_complaint_v2(
  p_payload jsonb,
  p_client_submission_id text,
  p_reporter_context jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_segment text;
  v_age_group text;
  v_relationship text;
  v_reporting_for text;
  v_result jsonb;
  v_report_id text;
begin
  v_segment := trim(coalesce(p_payload->>'segment', ''));

  if v_segment = 'harassment' then
    v_age_group := nullif(trim(coalesce(
      p_payload->>'affectedPersonAgeGroup',
      p_payload->>'affected_person_age_group',
      ''
    )), '');

    v_relationship := nullif(trim(coalesce(
      p_payload->>'allegedAbuserRelationship',
      p_payload->>'alleged_abuser_relationship',
      ''
    )), '');

    v_reporting_for := nullif(trim(coalesce(
      p_payload->>'reportingFor',
      p_payload->>'reporting_for',
      ''
    )), '');

    if v_age_group is null or v_age_group not in (
      'under_18', '18_29', '30_59', '60_plus', 'prefer_not_to_say'
    ) then
      raise exception 'VALIDATION_FAILED: A valid affected person age group is required for harassment reports.';
    end if;

    if v_relationship is null or v_relationship not in (
      'intimate_partner',
      'household_family',
      'other_relative',
      'friend_acquaintance',
      'coworker_classmate',
      'authority_caregiver_service_provider',
      'stranger',
      'other_or_unknown'
    ) then
      raise exception 'VALIDATION_FAILED: A valid relationship with the alleged abuser is required for harassment reports.';
    end if;

    if v_reporting_for is null or v_reporting_for not in ('self', 'someone_else') then
      raise exception 'VALIDATION_FAILED: Reporting-for selection is required for harassment reports.';
    end if;
  else
    -- Harassment-only metadata must not leak into another report category.
    v_age_group := null;
    v_relationship := null;
    v_reporting_for := null;
  end if;

  v_result := public.submit_public_complaint(
    p_payload,
    p_client_submission_id,
    p_reporter_context
  );

  v_report_id := nullif(trim(coalesce(v_result->>'reportId', '')), '');
  if v_report_id is null then
    raise exception 'SUBMISSION_FAILED: Missing report identifier from the underlying submission.';
  end if;

  update public.complaints
  set
    affected_person_age_group = v_age_group,
    alleged_abuser_relationship = v_relationship,
    reporting_for = v_reporting_for,
    updated_at = now()
  where id = v_report_id;

  return v_result;
end;
$$;

revoke all on function public.submit_public_complaint_v2(jsonb, text, jsonb) from public;
grant execute on function public.submit_public_complaint_v2(jsonb, text, jsonb) to anon, authenticated, service_role;

create or replace function public.get_public_harassment_classifications()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'affectedPersonAgeGroup', c.affected_person_age_group,
        'allegedAbuserRelationship', c.alleged_abuser_relationship,
        'reportingFor', c.reporting_for
      )
      order by c.created_at desc, c.id desc
    ),
    '[]'::jsonb
  )
  from public.complaints c
  where c.segment_id = 'harassment'
    and c.status = 'published'
    and c.affected_person_age_group is not null
    and c.alleged_abuser_relationship is not null
    and c.reporting_for is not null;
$$;

revoke all on function public.get_public_harassment_classifications() from public;
grant execute on function public.get_public_harassment_classifications() to anon, authenticated, service_role;
