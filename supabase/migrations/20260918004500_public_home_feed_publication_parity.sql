-- Keep the ranked home feed presentation in lockstep with the canonical published-report reads.
-- Admin-curated public headlines/summaries remain separate from the citizen's raw submission.

create or replace function public.get_public_home_feed(
  p_visitor_lat double precision default null,
  p_visitor_lng double precision default null,
  p_filter text default 'all'::text,
  p_district text default 'all'::text
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_result jsonb;
  v_has_visitor_loc boolean := false;
  v_clean_filter text;
  v_clean_district text;
begin
  if p_visitor_lat is not null and p_visitor_lng is not null
     and p_visitor_lat >= -90.0 and p_visitor_lat <= 90.0
     and p_visitor_lng >= -180.0 and p_visitor_lng <= 180.0
     and not (p_visitor_lat = 0.0 and p_visitor_lng = 0.0) then
    v_has_visitor_loc := true;
  end if;

  v_clean_filter := lower(trim(coalesce(p_filter, 'all')));
  if v_clean_filter not in ('all', 'latest', 'popular', 'most_shared') then
    v_clean_filter := 'all';
  end if;

  v_clean_district := lower(trim(coalesce(p_district, 'all')));

  with base_complaints as (
    select
      c.id,
      c.segment_id,
      c.subcategory_id,
      coalesce(nullif(trim(c.publication_preferences->>'publicTitleBn'), ''), c.title) as title_bn,
      coalesce(
        nullif(trim(c.publication_preferences->>'publicTitleEn'), ''),
        nullif(trim(c.title_en), ''),
        nullif(trim(c.publication_preferences->>'publicTitleBn'), ''),
        c.title
      ) as title_en,
      case when (c.publication_preferences->'showDescription') = 'true'::jsonb
        then coalesce(nullif(trim(c.publication_preferences->>'publicSummaryBn'), ''), c.description)
        else null
      end as summary_bn,
      case when (c.publication_preferences->'showDescription') = 'true'::jsonb
        then coalesce(
          nullif(trim(c.publication_preferences->>'publicSummaryEn'), ''),
          nullif(trim(c.description_en), ''),
          nullif(trim(c.publication_preferences->>'publicSummaryBn'), ''),
          c.description
        )
        else null
      end as summary_en,
      case when (c.publication_preferences->'showDescription') = 'true'::jsonb then c.description else null end as description_bn,
      case when (c.publication_preferences->'showDescription') = 'true'::jsonb
        then coalesce(nullif(trim(c.description_en), ''), c.description)
        else null
      end as description_en,
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then c.district else null end as district,
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then c.area else null end as area,
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then coalesce(c.formatted_address, c.area, c.district) else null end as location_display,
      c.incident_date,
      c.affected_person_age_group,
      c.alleged_abuser_relationship,
      c.reporting_for,
      c.incident_time,
      c.created_at,
      c.has_supporting_info,
      c.status,
      c.public_view_count,
      c.public_share_count,
      c.recent_bill_month,
      c.recent_bill_amount,
      c.previous_bill_month,
      c.previous_bill_amount,
      c.utility_end_time,
      case when (c.publication_preferences->'showSubjectName') = 'true'::jsonb then party.name else null end as party_name,
      case when (c.publication_preferences->'showOrganization') = 'true'::jsonb then party.organization else null end as party_org,
      case
        when v_has_visitor_loc
             and (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb
             and c.latitude is not null and c.longitude is not null
             and not (c.latitude = 0.0 and c.longitude = 0.0)
             and c.latitude >= -90.0 and c.latitude <= 90.0
             and c.longitude >= -180.0 and c.longitude <= 180.0
        then 6371.0 * 2.0 * atan2(
          sqrt(
            sin(radians(c.latitude - p_visitor_lat) / 2.0) * sin(radians(c.latitude - p_visitor_lat) / 2.0)
            + cos(radians(p_visitor_lat)) * cos(radians(c.latitude))
            * sin(radians(c.longitude - p_visitor_lng) / 2.0) * sin(radians(c.longitude - p_visitor_lng) / 2.0)
          ),
          sqrt(greatest(0.0, 1.0 - (
            sin(radians(c.latitude - p_visitor_lat) / 2.0) * sin(radians(c.latitude - p_visitor_lat) / 2.0)
            + cos(radians(p_visitor_lat)) * cos(radians(c.latitude))
            * sin(radians(c.longitude - p_visitor_lng) / 2.0) * sin(radians(c.longitude - p_visitor_lng) / 2.0)
          )))
        )
        else null
      end as internal_distance_km
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
    where c.status = 'published'
      and (
        v_clean_district = 'all'
        or (
          (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb
          and lower(coalesce(c.district, '')) like '%' || v_clean_district || '%'
        )
      )
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', bc.id,
        'segment', bc.segment_id,
        'subcategoryId', bc.subcategory_id,
        'subcategoryBn', coalesce((select sc.name_bn from public.subcategories sc where sc.id = bc.subcategory_id), bc.subcategory_id),
        'subcategoryEn', coalesce((select sc.name_en from public.subcategories sc where sc.id = bc.subcategory_id), bc.subcategory_id),
        'titleBn', bc.title_bn,
        'titleEn', bc.title_en,
        'summaryBn', bc.summary_bn,
        'summaryEn', bc.summary_en,
        'descriptionBn', bc.description_bn,
        'descriptionEn', bc.description_en,
        'reportedSubject', bc.party_name,
        'organization', bc.party_org,
        'district', bc.district,
        'area', bc.area,
        'location', bc.location_display,
        'incidentDate', to_char(bc.incident_date, 'YYYY-MM-DD'),
        'affectedPersonAgeGroup', bc.affected_person_age_group,
        'allegedAbuserRelationship', bc.alleged_abuser_relationship,
        'reportingFor', bc.reporting_for,
        'incidentTime', case when bc.segment_id = 'load_shedding' and bc.subcategory_id in ('load-shedding-outage', 'gas-shortage') then bc.incident_time else null end,
        'incident_time', case when bc.segment_id = 'load_shedding' and bc.subcategory_id in ('load-shedding-outage', 'gas-shortage') then bc.incident_time else null end,
        'publishedAt', to_char(bc.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'priority', 'medium',
        'hasSupportingInfo', bc.has_supporting_info,
        'status', bc.status,
        'viewCount', bc.public_view_count,
        'shareCount', bc.public_share_count,
        'recentBillMonth', bc.recent_bill_month,
        'recentBillAmount', bc.recent_bill_amount,
        'previousBillMonth', bc.previous_bill_month,
        'previousBillAmount', bc.previous_bill_amount,
        'recent_bill_month', bc.recent_bill_month,
        'recent_bill_amount', bc.recent_bill_amount,
        'previous_bill_month', bc.previous_bill_month,
        'previous_bill_amount', bc.previous_bill_amount,
        'utilityEndTime', case when bc.segment_id = 'load_shedding' and bc.subcategory_id in ('load-shedding-outage', 'gas-shortage') then bc.utility_end_time else null end,
        'utility_end_time', case when bc.segment_id = 'load_shedding' and bc.subcategory_id in ('load-shedding-outage', 'gas-shortage') then bc.utility_end_time else null end
      )
      order by
        case when v_clean_filter = 'all' and v_has_visitor_loc then bc.internal_distance_km end asc nulls last,
        case when v_clean_filter = 'latest' then bc.created_at end desc nulls last,
        case when v_clean_filter = 'latest' and v_has_visitor_loc then bc.internal_distance_km end asc nulls last,
        case when v_clean_filter = 'popular' then bc.public_view_count end desc nulls last,
        case when v_clean_filter = 'popular' then bc.public_share_count end desc nulls last,
        case when v_clean_filter = 'popular' and v_has_visitor_loc then bc.internal_distance_km end asc nulls last,
        case when v_clean_filter = 'most_shared' then bc.public_share_count end desc nulls last,
        case when v_clean_filter = 'most_shared' then bc.public_view_count end desc nulls last,
        case when v_clean_filter = 'most_shared' and v_has_visitor_loc then bc.internal_distance_km end asc nulls last,
        bc.created_at desc,
        bc.id desc
    ),
    '[]'::jsonb
  ) into v_result
  from base_complaints bc;

  return v_result;
end;
$function$;
