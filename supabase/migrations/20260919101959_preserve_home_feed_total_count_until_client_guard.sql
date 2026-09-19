-- Deployment-order compatibility guard.
-- Keep totalCount populated on every page until the nullable-total client is live.

CREATE OR REPLACE FUNCTION public.get_public_home_feed_page(p_visitor_lat double precision DEFAULT NULL::double precision, p_visitor_lng double precision DEFAULT NULL::double precision, p_filter text DEFAULT 'all'::text, p_district text DEFAULT 'all'::text, p_offset integer DEFAULT 0, p_limit integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_offset integer := greatest(coalesce(p_offset,0),0);
  v_limit integer := least(greatest(coalesce(p_limit,10),1),50);
  v_filter text := lower(trim(coalesce(p_filter,'all')));
  v_clean_district text;
  v_has_visitor_loc boolean := false;
  v_query_geog extensions.geography;
  v_candidate_ids text[] := '{}'::text[];
  v_page_ids text[] := '{}'::text[];
  v_geo_ids text[] := '{}'::text[];
  v_fallback_ids text[] := '{}'::text[];
  v_geo_count integer := 0;
  v_needed integer := 0;
  v_total_count integer := 0;
  v_items jsonb := '[]'::jsonb;
  v_has_more boolean := false;
begin
  if v_filter not in ('all','latest','popular','most_shared') then
    v_filter := 'all';
  end if;

  if p_visitor_lat is not null and p_visitor_lng is not null
     and p_visitor_lat between -90.0 and 90.0
     and p_visitor_lng between -180.0 and 180.0
     and not (p_visitor_lat=0.0 and p_visitor_lng=0.0) then
    v_has_visitor_loc := true;
    v_query_geog := extensions.st_setsrid(
      extensions.st_makepoint(p_visitor_lng,p_visitor_lat),
      4326
    )::extensions.geography;
  end if;

  v_clean_district := lower(
    coalesce(
      public.canonical_district_name(p_district),
      trim(coalesce(p_district,'all'))
    )
  );

  select count(*)
  into v_total_count
  from public.complaints c
  where c.status='published'
    and (
      v_clean_district='all'
      or (
        (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        and lower(c.district)=v_clean_district
      )
    );

  if v_filter='all' and v_has_visitor_loc then
    select coalesce(
      array_agg(q.id order by q.geo_distance asc,q.created_at desc,q.id desc),
      '{}'::text[]
    )
    into v_geo_ids
    from (
      select
        c.id,c.created_at,
        (extensions.st_setsrid(extensions.st_makepoint(c.longitude,c.latitude),4326)::extensions.geography)
          operator(extensions.<->) v_query_geog as geo_distance
      from public.complaints c
      where c.status='published'
        and (v_clean_district='all' or lower(c.district)=v_clean_district)
        and (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        and c.latitude is not null and c.longitude is not null
        and not (c.latitude=0.0 and c.longitude=0.0)
        and c.latitude between -90.0 and 90.0
        and c.longitude between -180.0 and 180.0
      order by
        (extensions.st_setsrid(extensions.st_makepoint(c.longitude,c.latitude),4326)::extensions.geography)
          operator(extensions.<->) v_query_geog asc,
        c.created_at desc,c.id desc
      offset v_offset
      limit v_limit + 1
    ) q;

    v_candidate_ids := coalesce(v_geo_ids,'{}'::text[]);

    if cardinality(v_candidate_ids) < v_limit + 1 then
      if cardinality(v_candidate_ids) > 0 then
        v_geo_count := v_offset + cardinality(v_candidate_ids);
      else
        select count(*) into v_geo_count
        from public.complaints c
        where c.status='published'
          and (v_clean_district='all' or lower(c.district)=v_clean_district)
          and (c.publication_preferences->'showGeneralLocation')='true'::jsonb
          and c.latitude is not null and c.longitude is not null
          and not (c.latitude=0.0 and c.longitude=0.0)
          and c.latitude between -90.0 and 90.0
          and c.longitude between -180.0 and 180.0;
      end if;

      v_needed := (v_limit + 1) - cardinality(v_candidate_ids);

      select coalesce(array_agg(q.id order by q.created_at desc,q.id desc),'{}'::text[])
      into v_fallback_ids
      from (
        select c.id,c.created_at
        from public.complaints c
        where c.status='published'
          and (
            v_clean_district='all'
            or (
              (c.publication_preferences->'showGeneralLocation')='true'::jsonb
              and lower(c.district)=v_clean_district
            )
          )
          and not (
            (c.publication_preferences->'showGeneralLocation')='true'::jsonb
            and c.latitude is not null and c.longitude is not null
            and not (c.latitude=0.0 and c.longitude=0.0)
            and c.latitude between -90.0 and 90.0
            and c.longitude between -180.0 and 180.0
          )
        order by c.created_at desc,c.id desc
        offset greatest(v_offset-v_geo_count,0)
        limit v_needed
      ) q;

      v_candidate_ids := v_candidate_ids || coalesce(v_fallback_ids,'{}'::text[]);
    end if;

  elsif v_filter in ('all','latest') and not v_has_visitor_loc then
    select coalesce(
      array_agg(q.id order by q.created_at desc,q.id desc),
      '{}'::text[]
    )
    into v_candidate_ids
    from (
      select c.id,c.created_at
      from public.complaints c
      where c.status='published'
        and (
          v_clean_district='all'
          or (
            (c.publication_preferences->'showGeneralLocation')='true'::jsonb
            and lower(c.district)=v_clean_district
          )
        )
      order by c.created_at desc,c.id desc
      offset v_offset
      limit v_limit + 1
    ) q;

  elsif v_filter='latest' and v_has_visitor_loc then
    select coalesce(
      array_agg(
        q.id
        order by q.created_at desc,q.geo_distance asc nulls last,q.id desc
      ),
      '{}'::text[]
    )
    into v_candidate_ids
    from (
      select
        c.id,
        c.created_at,
        case
          when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
           and c.latitude is not null
           and c.longitude is not null
           and not (c.latitude=0.0 and c.longitude=0.0)
           and c.latitude between -90.0 and 90.0
           and c.longitude between -180.0 and 180.0
          then extensions.st_distance(
            extensions.st_setsrid(
              extensions.st_makepoint(c.longitude,c.latitude),
              4326
            )::extensions.geography,
            v_query_geog,
            false
          )
          else null
        end as geo_distance
      from public.complaints c
      where c.status='published'
        and (
          v_clean_district='all'
          or (
            (c.publication_preferences->'showGeneralLocation')='true'::jsonb
            and lower(c.district)=v_clean_district
          )
        )
      order by
        c.created_at desc,
        case
          when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
           and c.latitude is not null
           and c.longitude is not null
           and not (c.latitude=0.0 and c.longitude=0.0)
           and c.latitude between -90.0 and 90.0
           and c.longitude between -180.0 and 180.0
          then extensions.st_distance(
            extensions.st_setsrid(
              extensions.st_makepoint(c.longitude,c.latitude),
              4326
            )::extensions.geography,
            v_query_geog,
            false
          )
          else null
        end asc nulls last,
        c.id desc
      offset v_offset
      limit v_limit + 1
    ) q;

  elsif v_filter='popular' and not v_has_visitor_loc then
    select coalesce(
      array_agg(
        q.id
        order by
          q.views desc,
          q.shares desc,
          q.published_second desc,
          q.created_at desc,
          q.id desc
      ),
      '{}'::text[]
    )
    into v_candidate_ids
    from (
      select
        c.id,
        c.created_at,
        c.public_view_count as views,
        c.public_share_count as shares,
        date_trunc('second',c.created_at at time zone 'UTC') as published_second
      from public.complaints c
      where c.status='published'
        and (
          v_clean_district='all'
          or (
            (c.publication_preferences->'showGeneralLocation')='true'::jsonb
            and lower(c.district)=v_clean_district
          )
        )
      order by
        c.public_view_count desc,
        c.public_share_count desc,
        date_trunc('second',c.created_at at time zone 'UTC') desc,
        c.created_at desc,
        c.id desc
      offset v_offset
      limit v_limit + 1
    ) q;

  elsif v_filter='popular' and v_has_visitor_loc then
    select coalesce(
      array_agg(
        q.id
        order by
          q.views desc,
          q.shares desc,
          q.published_second desc,
          q.geo_distance asc nulls last,
          q.created_at desc,
          q.id desc
      ),
      '{}'::text[]
    )
    into v_candidate_ids
    from (
      select
        c.id,
        c.created_at,
        c.public_view_count as views,
        c.public_share_count as shares,
        date_trunc('second',c.created_at at time zone 'UTC') as published_second,
        case
          when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
           and c.latitude is not null
           and c.longitude is not null
           and not (c.latitude=0.0 and c.longitude=0.0)
           and c.latitude between -90.0 and 90.0
           and c.longitude between -180.0 and 180.0
          then extensions.st_distance(
            extensions.st_setsrid(
              extensions.st_makepoint(c.longitude,c.latitude),
              4326
            )::extensions.geography,
            v_query_geog,
            false
          )
          else null
        end as geo_distance
      from public.complaints c
      where c.status='published'
        and (
          v_clean_district='all'
          or (
            (c.publication_preferences->'showGeneralLocation')='true'::jsonb
            and lower(c.district)=v_clean_district
          )
        )
      order by
        c.public_view_count desc,
        c.public_share_count desc,
        date_trunc('second',c.created_at at time zone 'UTC') desc,
        case
          when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
           and c.latitude is not null
           and c.longitude is not null
           and not (c.latitude=0.0 and c.longitude=0.0)
           and c.latitude between -90.0 and 90.0
           and c.longitude between -180.0 and 180.0
          then extensions.st_distance(
            extensions.st_setsrid(
              extensions.st_makepoint(c.longitude,c.latitude),
              4326
            )::extensions.geography,
            v_query_geog,
            false
          )
          else null
        end asc nulls last,
        c.created_at desc,
        c.id desc
      offset v_offset
      limit v_limit + 1
    ) q;

  elsif v_filter='most_shared' and not v_has_visitor_loc then
    select coalesce(
      array_agg(
        q.id
        order by
          q.shares desc,
          q.views desc,
          q.created_at desc,
          q.id desc
      ),
      '{}'::text[]
    )
    into v_candidate_ids
    from (
      select
        c.id,
        c.created_at,
        c.public_share_count as shares,
        c.public_view_count as views
      from public.complaints c
      where c.status='published'
        and (
          v_clean_district='all'
          or (
            (c.publication_preferences->'showGeneralLocation')='true'::jsonb
            and lower(c.district)=v_clean_district
          )
        )
      order by
        c.public_share_count desc,
        c.public_view_count desc,
        c.created_at desc,
        c.id desc
      offset v_offset
      limit v_limit + 1
    ) q;

  else
    select coalesce(
      array_agg(
        q.id
        order by
          q.shares desc,
          q.views desc,
          q.geo_distance asc nulls last,
          q.created_at desc,
          q.id desc
      ),
      '{}'::text[]
    )
    into v_candidate_ids
    from (
      select
        c.id,
        c.created_at,
        c.public_share_count as shares,
        c.public_view_count as views,
        case
          when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
           and c.latitude is not null
           and c.longitude is not null
           and not (c.latitude=0.0 and c.longitude=0.0)
           and c.latitude between -90.0 and 90.0
           and c.longitude between -180.0 and 180.0
          then extensions.st_distance(
            extensions.st_setsrid(
              extensions.st_makepoint(c.longitude,c.latitude),
              4326
            )::extensions.geography,
            v_query_geog,
            false
          )
          else null
        end as geo_distance
      from public.complaints c
      where c.status='published'
        and (
          v_clean_district='all'
          or (
            (c.publication_preferences->'showGeneralLocation')='true'::jsonb
            and lower(c.district)=v_clean_district
          )
        )
      order by
        c.public_share_count desc,
        c.public_view_count desc,
        case
          when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
           and c.latitude is not null
           and c.longitude is not null
           and not (c.latitude=0.0 and c.longitude=0.0)
           and c.latitude between -90.0 and 90.0
           and c.longitude between -180.0 and 180.0
          then extensions.st_distance(
            extensions.st_setsrid(
              extensions.st_makepoint(c.longitude,c.latitude),
              4326
            )::extensions.geography,
            v_query_geog,
            false
          )
          else null
        end asc nulls last,
        c.created_at desc,
        c.id desc
      offset v_offset
      limit v_limit + 1
    ) q;
  end if;

  v_has_more := coalesce(cardinality(v_candidate_ids),0) > v_limit;

  if v_has_more then
    v_page_ids := v_candidate_ids[1:v_limit];
  else
    v_page_ids := coalesce(v_candidate_ids,'{}'::text[]);
  end if;

  with selected_ids as (
    select s.id,s.ordinality
    from unnest(v_page_ids) with ordinality as s(id,ordinality)
  ),
  base_complaints as (
    select
      s.ordinality,
      c.id,
      c.segment_id,
      c.subcategory_id,
      coalesce(
        nullif(trim(c.publication_preferences->>'publicTitleBn'),''),
        c.title
      ) as title_bn,
      coalesce(
        nullif(trim(c.publication_preferences->>'publicTitleEn'),''),
        nullif(trim(c.title_en),''),
        nullif(trim(c.publication_preferences->>'publicTitleBn'),''),
        c.title
      ) as title_en,
      case
        when (c.publication_preferences->'showDescription')='true'::jsonb
        then coalesce(
          nullif(trim(c.publication_preferences->>'publicSummaryBn'),''),
          c.description
        )
        else null
      end as summary_bn,
      case
        when (c.publication_preferences->'showDescription')='true'::jsonb
        then coalesce(
          nullif(trim(c.publication_preferences->>'publicSummaryEn'),''),
          nullif(trim(c.description_en),''),
          nullif(trim(c.publication_preferences->>'publicSummaryBn'),''),
          c.description
        )
        else null
      end as summary_en,
      case
        when (c.publication_preferences->'showDescription')='true'::jsonb
        then c.description
        else null
      end as description_bn,
      case
        when (c.publication_preferences->'showDescription')='true'::jsonb
        then coalesce(nullif(trim(c.description_en),''),c.description)
        else null
      end as description_en,
      case
        when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        then c.district
        else null
      end as district,
      case
        when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        then coalesce(
          loc_d.name_bn,
          case when public.location_text_language(c.district)='bn' then c.district end
        )
        else null
      end as district_bn,
      case
        when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        then coalesce(
          loc_d.name_en,
          case when public.location_text_language(c.district)='en' then c.district end
        )
        else null
      end as district_en,
      case
        when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        then c.area
        else null
      end as area,
      case
        when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        then public.compose_public_area(c.area,loc_u.name_bn,loc_d.name_bn,'bn')
        else null
      end as area_bn,
      case
        when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        then public.compose_public_area(c.area,loc_u.name_en,loc_d.name_en,'en')
        else null
      end as area_en,
      case
        when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        then coalesce(
          c.formatted_address,
          c.road,
          c.area,
          c.landmark,
          c.upazila_or_thana,
          c.district
        )
        else null
      end as location_display,
      case
        when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        then public.compose_public_location(
          c.formatted_address,
          c.road,
          c.area,
          c.landmark,
          loc_u.name_bn,
          loc_d.name_bn,
          'bn'
        )
        else null
      end as location_bn,
      case
        when (c.publication_preferences->'showGeneralLocation')='true'::jsonb
        then public.compose_public_location(
          c.formatted_address,
          c.road,
          c.area,
          c.landmark,
          loc_u.name_en,
          loc_d.name_en,
          'en'
        )
        else null
      end as location_en,
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
      case
        when (c.publication_preferences->'showSubjectName')='true'::jsonb
        then party.name
        else null
      end as party_name,
      case
        when (c.publication_preferences->'showOrganization')='true'::jsonb
        then party.organization
        else null
      end as party_org,
      sc.name_bn as subcategory_bn,
      sc.name_en as subcategory_en
    from selected_ids s
    join public.complaints c on c.id=s.id
    left join public.subcategories sc on sc.id=c.subcategory_id
    left join public.bangladesh_districts loc_d
      on loc_d.name_en=c.district
    left join public.bangladesh_upazilas loc_u
      on loc_u.district_id=loc_d.id
     and loc_u.name_en=c.upazila_or_thana
    left join lateral (
      select
        case when count(*)=1
          then max(nullif(trim(cp.name),''))
          else null
        end as name,
        case when count(*)=1
          then max(nullif(trim(cp.organization),''))
          else null
        end as organization
      from public.complaint_parties cp
      where cp.complaint_id=c.id
        and (
          nullif(trim(cp.name),'') is not null
          or nullif(trim(cp.organization),'') is not null
          or nullif(trim(cp.role_or_designation),'') is not null
          or nullif(trim(cp.phone_or_contact),'') is not null
          or nullif(trim(cp.public_profile_handle),'') is not null
          or nullif(trim(cp.identifying_description),'') is not null
          or nullif(trim(cp.address),'') is not null
          or trim(coalesce(cp.party_type,'')) in (
            'individual','business','group','organization'
          )
        )
    ) party on true
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id',bc.id,
        'segment',bc.segment_id,
        'subcategoryId',bc.subcategory_id,
        'subcategoryBn',coalesce(bc.subcategory_bn,bc.subcategory_id),
        'subcategoryEn',coalesce(bc.subcategory_en,bc.subcategory_id),
        'titleBn',bc.title_bn,
        'titleEn',bc.title_en,
        'summaryBn',bc.summary_bn,
        'summaryEn',bc.summary_en,
        'descriptionBn',bc.description_bn,
        'descriptionEn',bc.description_en,
        'reportedSubject',bc.party_name,
        'organization',bc.party_org,
        'district',bc.district,
        'districtBn',bc.district_bn,
        'districtEn',bc.district_en,
        'area',bc.area,
        'areaBn',bc.area_bn,
        'areaEn',bc.area_en,
        'location',coalesce(bc.location_en,bc.location_bn,bc.location_display),
        'locationBn',bc.location_bn,
        'locationEn',bc.location_en,
        'incidentDate',to_char(bc.incident_date,'YYYY-MM-DD'),
        'affectedPersonAgeGroup',bc.affected_person_age_group,
        'allegedAbuserRelationship',bc.alleged_abuser_relationship,
        'reportingFor',bc.reporting_for,
        'incidentTime',
          case
            when bc.segment_id='load_shedding'
             and bc.subcategory_id in ('load-shedding-outage','gas-shortage')
            then bc.incident_time
            else null
          end,
        'incident_time',
          case
            when bc.segment_id='load_shedding'
             and bc.subcategory_id in ('load-shedding-outage','gas-shortage')
            then bc.incident_time
            else null
          end,
        'publishedAt',
          to_char(
            bc.created_at at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS"Z"'
          ),
        'priority','medium',
        'hasSupportingInfo',bc.has_supporting_info,
        'status',bc.status,
        'viewCount',bc.public_view_count,
        'shareCount',bc.public_share_count,
        'recentBillMonth',bc.recent_bill_month,
        'recentBillAmount',bc.recent_bill_amount,
        'previousBillMonth',bc.previous_bill_month,
        'previousBillAmount',bc.previous_bill_amount,
        'recent_bill_month',bc.recent_bill_month,
        'recent_bill_amount',bc.recent_bill_amount,
        'previous_bill_month',bc.previous_bill_month,
        'previous_bill_amount',bc.previous_bill_amount,
        'utilityEndTime',
          case
            when bc.segment_id='load_shedding'
             and bc.subcategory_id in ('load-shedding-outage','gas-shortage')
            then bc.utility_end_time
            else null
          end,
        'utility_end_time',
          case
            when bc.segment_id='load_shedding'
             and bc.subcategory_id in ('load-shedding-outage','gas-shortage')
            then bc.utility_end_time
            else null
          end
      )
      order by bc.ordinality
    ),
    '[]'::jsonb
  )
  into v_items
  from base_complaints bc;

  return jsonb_build_object(
    'items',v_items,
    'hasMore',v_has_more,
    'nextOffset',
      case when v_has_more then v_offset+v_limit else null end,
    'offset',v_offset,
    'limit',v_limit,
    'totalCount',v_total_count
  );
end;
$function$
;
