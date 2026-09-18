-- HARASSMENT_SCHEMA_OPTION_CONTRACT age=under_18,18_29,30_59,60_plus,prefer_not_to_say,unknown_not_stated
-- HARASSMENT_SCHEMA_OPTION_CONTRACT relationship=intimate_partner,household_family,other_relative,friend_acquaintance,coworker_classmate,authority_caregiver_service_provider,stranger,other_or_unknown,neighbor,teacher_tutor,supervisor_employer,service_health_worker,transport_worker,law_enforcement_authority,multiple_people,other,unknown_not_stated
-- HARASSMENT_SCHEMA_OPTION_CONTRACT reporting_for=self,someone_else

begin;

create temporary table harassment_expected_options(
  field_key text primary key,
  options jsonb not null
) on commit drop;

insert into harassment_expected_options(field_key,options)
values
  (
    'affected_person_age_group',
    '[
      {"value":"under_18","labelEn":"Under 18","labelBn":"১৮ বছরের কম"},
      {"value":"18_29","labelEn":"18–29","labelBn":"১৮–২৯"},
      {"value":"30_59","labelEn":"30–59","labelBn":"৩০–৫৯"},
      {"value":"60_plus","labelEn":"60+","labelBn":"৬০+"},
      {"value":"prefer_not_to_say","labelEn":"Prefer not to say","labelBn":"বলতে অনিচ্ছুক"},
      {"value":"unknown_not_stated","labelEn":"Unknown / not stated","labelBn":"জানা নেই / উল্লেখ নেই"}
    ]'::jsonb
  ),
  (
    'alleged_abuser_relationship',
    '[
      {"value":"intimate_partner","labelEn":"Current / former intimate partner or spouse","labelBn":"বর্তমান / সাবেক ঘনিষ্ঠ সঙ্গী বা স্বামী/স্ত্রী"},
      {"value":"household_family","labelEn":"Immediate family / household member","labelBn":"নিকট পরিবারের / একই পরিবারের সদস্য"},
      {"value":"other_relative","labelEn":"Other relative","labelBn":"অন্যান্য আত্মীয়"},
      {"value":"friend_acquaintance","labelEn":"Friend / acquaintance","labelBn":"বন্ধু / পরিচিত ব্যক্তি"},
      {"value":"coworker_classmate","labelEn":"Co-worker / classmate","labelBn":"সহকর্মী / সহপাঠী"},
      {"value":"authority_caregiver_service_provider","labelEn":"Authority / caregiver / service provider","labelBn":"কর্তৃপক্ষ / পরিচর্যাকারী / সেবাদানকারী"},
      {"value":"stranger","labelEn":"Stranger","labelBn":"অপরিচিত ব্যক্তি"},
      {"value":"other_or_unknown","labelEn":"Other known person / Unknown (legacy)","labelBn":"অন্যান্য পরিচিত ব্যক্তি / জানা নেই (পুরোনো)"},
      {"value":"neighbor","labelEn":"Neighbor","labelBn":"প্রতিবেশী"},
      {"value":"teacher_tutor","labelEn":"Teacher / tutor","labelBn":"শিক্ষক / টিউটর"},
      {"value":"supervisor_employer","labelEn":"Supervisor / employer","labelBn":"সুপারভাইজার / নিয়োগকর্তা"},
      {"value":"service_health_worker","labelEn":"Service provider / healthcare worker","labelBn":"সেবাদানকারী / স্বাস্থ্যকর্মী"},
      {"value":"transport_worker","labelEn":"Transport worker","labelBn":"পরিবহন কর্মী"},
      {"value":"law_enforcement_authority","labelEn":"Law enforcement / authority","labelBn":"আইনশৃঙ্খলা / কর্তৃপক্ষ"},
      {"value":"multiple_people","labelEn":"Multiple people","labelBn":"একাধিক ব্যক্তি"},
      {"value":"other","labelEn":"Other","labelBn":"অন্যান্য"},
      {"value":"unknown_not_stated","labelEn":"Unknown / not stated","labelBn":"জানা নেই / উল্লেখ নেই"}
    ]'::jsonb
  ),
  (
    'reporting_for',
    '[
      {"value":"self","labelEn":"Myself","labelBn":"নিজের জন্য"},
      {"value":"someone_else","labelEn":"Someone else","labelBn":"অন্য কারও জন্য"}
    ]'::jsonb
  );

with target_schemas as (
  select s.id
  from public.reporting_form_schemas s
  join public.subcategories sc on sc.id=s.scope_id
  where s.scope_type='subcategory'
    and sc.segment_id='harassment'
    and s.status='draft'
    and s.engine_mode='schema'
)
update public.reporting_form_schema_fields f
set options=e.options
from target_schemas t
join harassment_expected_options e on true
where f.schema_id=t.id
  and f.field_key=e.field_key;

do $$
declare
  v_target_schema_count integer;
  v_bad integer;
begin
  select count(*)
  into v_target_schema_count
  from public.reporting_form_schemas s
  join public.subcategories sc on sc.id=s.scope_id
  where s.scope_type='subcategory'
    and sc.segment_id='harassment'
    and s.status='draft'
    and s.engine_mode='schema';

  if v_target_schema_count <> 5 then
    raise exception 'Expected 5 harassment schema drafts, found %',v_target_schema_count;
  end if;

  with target_schemas as (
    select s.id
    from public.reporting_form_schemas s
    join public.subcategories sc on sc.id=s.scope_id
    where s.scope_type='subcategory'
      and sc.segment_id='harassment'
      and s.status='draft'
      and s.engine_mode='schema'
  )
  select count(*)
  into v_bad
  from target_schemas t
  cross join harassment_expected_options e
  left join public.reporting_form_schema_fields f
    on f.schema_id=t.id
   and f.field_key=e.field_key
  where f.id is null
     or f.options is distinct from e.options;

  if v_bad <> 0 then
    raise exception 'Harassment schema option parity verification failed for % fields',v_bad;
  end if;
end
$$;

commit;
