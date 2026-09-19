-- Keep the public published-report RPC inside the production statement budget.
-- The public payload is unchanged. Location names are resolved once per report
-- through the canonical Bangladesh tables instead of repeatedly nesting the
-- canonical/localization helper functions for every location field.

create or replace function public.get_public_published_reports()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_result jsonb;
begin
  select coalesce(
    jsonb_agg(
      (
        jsonb_build_object(
          'id', c.id,
          'segment', c.segment_id,
          'subcategoryId', c.subcategory_id,
          'subcategoryBn', coalesce((select sc.name_bn from public.subcategories sc where sc.id = c.subcategory_id), c.subcategory_id),
          'subcategoryEn', coalesce((select sc.name_en from public.subcategories sc where sc.id = c.subcategory_id), c.subcategory_id),
          'titleBn', coalesce(nullif(trim(c.publication_preferences->>'publicTitleBn'), ''), c.title),
          'titleEn', coalesce(nullif(trim(c.publication_preferences->>'publicTitleEn'), ''), nullif(trim(c.title_en), ''), nullif(trim(c.publication_preferences->>'publicTitleBn'), ''), c.title),
          'summaryBn', case when (c.publication_preferences->'showDescription') = 'true'::jsonb then coalesce(nullif(trim(c.publication_preferences->>'publicSummaryBn'), ''), c.description) else null end,
          'summaryEn', case when (c.publication_preferences->'showDescription') = 'true'::jsonb then coalesce(nullif(trim(c.publication_preferences->>'publicSummaryEn'), ''), nullif(trim(c.description_en), ''), nullif(trim(c.publication_preferences->>'publicSummaryBn'), ''), c.description) else null end,
          'descriptionBn', case when (c.publication_preferences->'showDescription') = 'true'::jsonb then c.description else null end,
          'descriptionEn', case when (c.publication_preferences->'showDescription') = 'true'::jsonb then coalesce(nullif(trim(c.description_en), ''), c.description) else null end,
          'reportedSubject', case when (c.publication_preferences->'showSubjectName') = 'true'::jsonb then party.name else null end,
          'organization', case when (c.publication_preferences->'showOrganization') = 'true'::jsonb then party.organization else null end,
          'district', case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then c.district else null end,
          'districtBn', case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then district_match.name_bn else null end,
          'districtEn', case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then district_match.name_en else null end,
          'area', case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then c.area else null end,
          'areaBn', case
            when (c.publication_preferences->'showGeneralLocation') <> 'true'::jsonb then null
            when nullif(btrim(coalesce(c.area,'')),'') is not null and public.location_text_language(c.area)='bn' then btrim(c.area)
            when upazila_match.name_bn is not null then upazila_match.name_bn
            else district_match.name_bn
          end,
          'areaEn', case
            when (c.publication_preferences->'showGeneralLocation') <> 'true'::jsonb then null
            when nullif(btrim(coalesce(c.area,'')),'') is not null and public.location_text_language(c.area)='en' then btrim(c.area)
            when upazila_match.name_en is not null then upazila_match.name_en
            else district_match.name_en
          end,
          'location', case
            when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb
            then coalesce(location_parts.location_en, location_parts.location_bn, c.formatted_address, c.road, c.area, c.landmark, c.upazila_or_thana, c.district)
            else null
          end,
          'locationBn', case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then location_parts.location_bn else null end,
          'locationEn', case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then location_parts.location_en else null end,
          'incidentDate', to_char(c.incident_date, 'YYYY-MM-DD'),
          'affectedPersonAgeGroup', c.affected_person_age_group,
          'allegedAbuserRelationship', c.alleged_abuser_relationship,
          'reportingFor', c.reporting_for,
          'briberyDepartment', case when c.segment_id = 'extortion' and c.subcategory_id = 'bribe-demanded-service' then c.bribery_department else null end,
          'briberyService', case when c.segment_id = 'extortion' and c.subcategory_id = 'bribe-demanded-service' then c.bribery_service else null end
        )
        ||
        jsonb_build_object(
          'briberyAmount', case when c.segment_id = 'extortion' and c.subcategory_id = 'bribe-demanded-service' then c.bribery_amount else null end,
          'bribery_department', case when c.segment_id = 'extortion' and c.subcategory_id = 'bribe-demanded-service' then c.bribery_department else null end,
          'bribery_service', case when c.segment_id = 'extortion' and c.subcategory_id = 'bribe-demanded-service' then c.bribery_service else null end,
          'bribery_amount', case when c.segment_id = 'extortion' and c.subcategory_id = 'bribe-demanded-service' then c.bribery_amount else null end,
          'frequency', case when c.segment_id = 'extortion' then c.frequency else null end,
          'incidentTime', case when (c.segment_id = 'load_shedding' and c.subcategory_id in ('load-shedding-outage', 'gas-shortage')) or c.segment_id = 'extortion' then c.incident_time else null end,
          'incident_time', case when (c.segment_id = 'load_shedding' and c.subcategory_id in ('load-shedding-outage', 'gas-shortage')) or c.segment_id = 'extortion' then c.incident_time else null end,
          'publishedAt', to_char(c.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'updatedAt', to_char(c.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'priority', 'medium',
          'hasSupportingInfo', c.has_supporting_info,
          'status', c.status,
          'viewCount', c.public_view_count,
          'shareCount', c.public_share_count,
          'recentBillMonth', c.recent_bill_month,
          'recentBillAmount', c.recent_bill_amount,
          'previousBillMonth', c.previous_bill_month,
          'previousBillAmount', c.previous_bill_amount,
          'recent_bill_month', c.recent_bill_month,
          'recent_bill_amount', c.recent_bill_amount,
          'previous_bill_month', c.previous_bill_month,
          'previous_bill_amount', c.previous_bill_amount,
          'utilityEndTime', case when c.segment_id = 'load_shedding' and c.subcategory_id in ('load-shedding-outage', 'gas-shortage') then c.utility_end_time else null end,
          'utility_end_time', case when c.segment_id = 'load_shedding' and c.subcategory_id in ('load-shedding-outage', 'gas-shortage') then c.utility_end_time else null end
        )
      )
      order by c.created_at desc, c.id desc
    ),
    '[]'::jsonb
  )
  into v_result
  from public.complaints c
  left join lateral (
    select
      case when count(*) = 1 then max(nullif(trim(cp.name), '')) else null end as name,
      case when count(*) = 1 then max(nullif(trim(cp.organization), '')) else null end as organization
    from public.complaint_parties cp
    where cp.complaint_id = c.id
      and (
        nullif(trim(cp.name), '') is not null
        or nullif(trim(cp.organization), '') is not null
        or nullif(trim(cp.role_or_designation), '') is not null
        or nullif(trim(cp.phone_or_contact), '') is not null
        or nullif(trim(cp.public_profile_handle), '') is not null
        or nullif(trim(cp.identifying_description), '') is not null
        or nullif(trim(cp.address), '') is not null
        or trim(coalesce(cp.party_type, '')) in ('individual', 'business', 'group', 'organization')
      )
  ) party on true
  left join lateral (
    select d.id, d.name_bn, d.name_en
    from public.bangladesh_districts d
    where lower(btrim(coalesce(c.district,''))) in (lower(d.id),lower(d.name_en),lower(d.name_bn))
       or exists (
         select 1
         from unnest(d.aliases) alias_value
         where lower(alias_value)=lower(btrim(coalesce(c.district,'')))
       )
    limit 1
  ) district_match on true
  left join lateral (
    select u.name_bn, u.name_en, u.district_id
    from public.bangladesh_upazilas u
    where (
      lower(btrim(coalesce(c.upazila_or_thana,''))) in (lower(u.id),lower(u.name_en),lower(u.name_bn))
      or exists (
        select 1
        from unnest(u.aliases) alias_value
        where lower(alias_value)=lower(btrim(coalesce(c.upazila_or_thana,'')))
      )
    )
    and (
      nullif(btrim(coalesce(c.district,'')),'') is null
      or (district_match.id is not null and u.district_id=district_match.id)
    )
    order by case when district_match.id is not null and u.district_id=district_match.id then 0 else 1 end, u.id
    limit 1
  ) upazila_match on true
  left join lateral (
    select
      case
        when nullif(btrim(coalesce(c.formatted_address,'')),'') is not null
         and public.location_text_language(c.formatted_address)='bn'
        then btrim(c.formatted_address)
        else (
          select string_agg(dedup.value, ', ' order by dedup.first_ord)
          from (
            select part.value, min(part.ord) as first_ord
            from unnest(array[
              case when nullif(btrim(coalesce(c.road,'')),'') is not null and public.location_text_language(c.road)='bn' then btrim(c.road) end,
              case when nullif(btrim(coalesce(c.area,'')),'') is not null and public.location_text_language(c.area)='bn' then btrim(c.area) end,
              case when nullif(btrim(coalesce(c.landmark,'')),'') is not null and public.location_text_language(c.landmark)='bn' then btrim(c.landmark) end,
              coalesce(upazila_match.name_bn, case when public.location_text_language(c.upazila_or_thana)='bn' then btrim(c.upazila_or_thana) end),
              coalesce(district_match.name_bn, case when public.location_text_language(c.district)='bn' then btrim(c.district) end)
            ]) with ordinality as part(value, ord)
            where nullif(part.value,'') is not null
            group by part.value
          ) dedup
        )
      end as location_bn,
      case
        when nullif(btrim(coalesce(c.formatted_address,'')),'') is not null
         and public.location_text_language(c.formatted_address)='en'
        then btrim(c.formatted_address)
        else (
          select string_agg(dedup.value, ', ' order by dedup.first_ord)
          from (
            select part.value, min(part.ord) as first_ord
            from unnest(array[
              case when nullif(btrim(coalesce(c.road,'')),'') is not null and public.location_text_language(c.road)='en' then btrim(c.road) end,
              case when nullif(btrim(coalesce(c.area,'')),'') is not null and public.location_text_language(c.area)='en' then btrim(c.area) end,
              case when nullif(btrim(coalesce(c.landmark,'')),'') is not null and public.location_text_language(c.landmark)='en' then btrim(c.landmark) end,
              coalesce(upazila_match.name_en, case when public.location_text_language(c.upazila_or_thana)='en' then btrim(c.upazila_or_thana) end),
              coalesce(district_match.name_en, case when public.location_text_language(c.district)='en' then btrim(c.district) end)
            ]) with ordinality as part(value, ord)
            where nullif(part.value,'') is not null
            group by part.value
          ) dedup
        )
      end as location_en
  ) location_parts on true
  where c.status = 'published';

  return v_result;
end;
$function$;
