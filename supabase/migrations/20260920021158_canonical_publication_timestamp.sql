-- Canonical public publication timestamp.
-- Draft creation and public publication are separate lifecycle events.

alter table public.complaints
  add column if not exists published_at timestamptz;

update public.complaints c
set published_at = coalesce(
  (
    select max(u.created_at)
    from public.complaint_updates u
    where u.complaint_id=c.id
      and u.update_type='published'
  ),
  c.created_at
)
where c.status='published'
  and c.published_at is null;

create or replace function public.set_complaint_published_at()
returns trigger
language plpgsql
set search_path to 'pg_catalog','public'
as $function$
begin
  if new.status='published'
     and (tg_op='INSERT' or old.status is distinct from 'published') then
    new.published_at:=clock_timestamp();
  elsif new.status<>'published' and tg_op='UPDATE' and old.status='published' then
    -- Keep the previous publication timestamp for audit/history; a future re-publish
    -- gets a fresh timestamp through the branch above.
    new.published_at:=old.published_at;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_set_complaint_published_at on public.complaints;
create trigger trg_set_complaint_published_at
before insert or update of status
on public.complaints
for each row
execute function public.set_complaint_published_at();

-- Add publication-time indexes without destructively replacing the existing
-- creation-time indexes. Existing indexes remain available to older/internal queries.
create index if not exists idx_complaints_public_feed_published_latest
  on public.complaints (published_at desc,id desc)
  where status='published';

create index if not exists idx_complaints_public_feed_district_published_latest
  on public.complaints (lower(district),published_at desc,id desc)
  where status='published'
    and (publication_preferences->'showGeneralLocation')='true'::jsonb;

create index if not exists idx_complaints_public_feed_published_popular
  on public.complaints (
    public_view_count desc,
    public_share_count desc,
    date_trunc('second',published_at at time zone 'UTC') desc,
    published_at desc,
    id desc
  )
  where status='published';

create index if not exists idx_complaints_public_feed_district_published_popular
  on public.complaints (
    lower(district),
    public_view_count desc,
    public_share_count desc,
    date_trunc('second',published_at at time zone 'UTC') desc,
    published_at desc,
    id desc
  )
  where status='published'
    and (publication_preferences->'showGeneralLocation')='true'::jsonb;

create index if not exists idx_complaints_public_feed_published_shared
  on public.complaints (
    public_share_count desc,
    public_view_count desc,
    published_at desc,
    id desc
  )
  where status='published';

create index if not exists idx_complaints_public_feed_district_published_shared
  on public.complaints (
    lower(district),
    public_share_count desc,
    public_view_count desc,
    published_at desc,
    id desc
  )
  where status='published'
    and (publication_preferences->'showGeneralLocation')='true'::jsonb;

CREATE OR REPLACE FUNCTION public.get_public_home_feed(p_visitor_lat double precision DEFAULT NULL::double precision, p_visitor_lng double precision DEFAULT NULL::double precision, p_filter text DEFAULT 'all'::text, p_district text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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

  v_clean_district := lower(coalesce(public.canonical_district_name(p_district), trim(coalesce(p_district, 'all'))));

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
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then coalesce(loc_d.name_bn,case when public.location_text_language(c.district)='bn' then c.district end) else null end as district_bn,
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then coalesce(loc_d.name_en,case when public.location_text_language(c.district)='en' then c.district end) else null end as district_en,
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then c.area else null end as area,
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then public.compose_public_area(c.area,loc_u.name_bn,loc_d.name_bn,'bn') else null end as area_bn,
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then public.compose_public_area(c.area,loc_u.name_en,loc_d.name_en,'en') else null end as area_en,
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then coalesce(c.formatted_address,c.road,c.area,c.landmark,c.upazila_or_thana,c.district) else null end as location_display,
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then public.compose_public_location(c.formatted_address,c.road,c.area,c.landmark,loc_u.name_bn,loc_d.name_bn,'bn') else null end as location_bn,
      case when (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb then public.compose_public_location(c.formatted_address,c.road,c.area,c.landmark,loc_u.name_en,loc_d.name_en,'en') else null end as location_en,
      c.incident_date,
      c.affected_person_age_group,
      c.alleged_abuser_relationship,
      c.reporting_for,
      c.incident_time,
      c.published_at as created_at,
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
    left join public.bangladesh_districts loc_d
      on loc_d.name_en=c.district
    left join public.bangladesh_upazilas loc_u
      on loc_u.district_id=loc_d.id and loc_u.name_en=c.upazila_or_thana
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
          and lower(c.district) = v_clean_district
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
        'districtBn', bc.district_bn,
        'districtEn', bc.district_en,
        'area', bc.area,
        'areaBn', bc.area_bn,
        'areaEn', bc.area_en,
        'location', coalesce(bc.location_en,bc.location_bn,bc.location_display),
        'locationBn', bc.location_bn,
        'locationEn', bc.location_en,
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
$function$
;

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
        c.id,c.published_at as created_at,
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
        c.published_at desc,c.id desc
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
        select c.id,c.published_at as created_at
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
        order by c.published_at desc,c.id desc
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
      select c.id,c.published_at as created_at
      from public.complaints c
      where c.status='published'
        and (
          v_clean_district='all'
          or (
            (c.publication_preferences->'showGeneralLocation')='true'::jsonb
            and lower(c.district)=v_clean_district
          )
        )
      order by c.published_at desc,c.id desc
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
        c.published_at as created_at,
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
        c.published_at desc,
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
        c.published_at as created_at,
        c.public_view_count as views,
        c.public_share_count as shares,
        date_trunc('second',c.published_at at time zone 'UTC') as published_second
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
        date_trunc('second',c.published_at at time zone 'UTC') desc,
        c.published_at desc,
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
        c.published_at as created_at,
        c.public_view_count as views,
        c.public_share_count as shares,
        date_trunc('second',c.published_at at time zone 'UTC') as published_second,
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
        date_trunc('second',c.published_at at time zone 'UTC') desc,
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
        c.published_at desc,
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
        c.published_at as created_at,
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
        c.published_at desc,
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
        c.published_at as created_at,
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
        c.published_at desc,
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
      c.published_at as created_at,
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

CREATE OR REPLACE FUNCTION public.get_public_published_report(p_report_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_result jsonb; v_clean_id text;
BEGIN
  v_clean_id := upper(trim(coalesce(p_report_id, '')));
  IF v_clean_id = '' THEN RETURN NULL; END IF;
  SELECT (jsonb_build_object(
    'id', c.id,
    'reporterName', CASE WHEN c.privacy_choice = 'public_identity' AND c.confirm_public_identity = true THEN nullif(trim(c.reporter_name), '') ELSE NULL END,
    'segment', c.segment_id,
    'subcategoryId', c.subcategory_id,
    'subcategoryBn', coalesce((SELECT sc.name_bn FROM public.subcategories sc WHERE sc.id = c.subcategory_id), c.subcategory_id),
    'subcategoryEn', coalesce((SELECT sc.name_en FROM public.subcategories sc WHERE sc.id = c.subcategory_id), c.subcategory_id),
    'titleBn', coalesce(nullif(trim(c.publication_preferences->>'publicTitleBn'), ''), c.title),
    'titleEn', coalesce(nullif(trim(c.publication_preferences->>'publicTitleEn'), ''), nullif(trim(c.title_en), ''), nullif(trim(c.publication_preferences->>'publicTitleBn'), ''), c.title),
    'summaryBn', CASE WHEN (c.publication_preferences->'showDescription') = 'true'::jsonb THEN coalesce(nullif(trim(c.publication_preferences->>'publicSummaryBn'), ''), c.description) ELSE NULL END,
    'summaryEn', CASE WHEN (c.publication_preferences->'showDescription') = 'true'::jsonb THEN coalesce(nullif(trim(c.publication_preferences->>'publicSummaryEn'), ''), nullif(trim(c.description_en), ''), nullif(trim(c.publication_preferences->>'publicSummaryBn'), ''), c.description) ELSE NULL END,
    'descriptionBn', CASE WHEN (c.publication_preferences->'showDescription') = 'true'::jsonb THEN c.description ELSE NULL END,
    'descriptionEn', CASE WHEN (c.publication_preferences->'showDescription') = 'true'::jsonb THEN coalesce(nullif(trim(c.description_en), ''), c.description) ELSE NULL END,
    'reportedSubject', CASE WHEN (c.publication_preferences->'showSubjectName') = 'true'::jsonb THEN party.name ELSE NULL END,
    'organization', CASE WHEN (c.publication_preferences->'showOrganization') = 'true'::jsonb THEN party.organization ELSE NULL END,
    'district', CASE WHEN (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb THEN c.district ELSE NULL END,
    'districtBn', CASE WHEN (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb THEN coalesce(loc_d.name_bn,case when public.location_text_language(c.district)='bn' then c.district end) ELSE NULL END,
    'districtEn', CASE WHEN (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb THEN coalesce(loc_d.name_en,case when public.location_text_language(c.district)='en' then c.district end) ELSE NULL END,
    'area', CASE WHEN (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb THEN c.area ELSE NULL END,
    'areaBn', CASE WHEN (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb THEN public.compose_public_area(c.area,loc_u.name_bn,loc_d.name_bn,'bn') ELSE NULL END,
    'areaEn', CASE WHEN (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb THEN public.compose_public_area(c.area,loc_u.name_en,loc_d.name_en,'en') ELSE NULL END,
    'location', CASE WHEN (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb THEN coalesce(public.compose_public_location(c.formatted_address,c.road,c.area,c.landmark,loc_u.name_en,loc_d.name_en,'en'),public.compose_public_location(c.formatted_address,c.road,c.area,c.landmark,loc_u.name_bn,loc_d.name_bn,'bn'),c.formatted_address,c.road,c.area,c.landmark,c.upazila_or_thana,c.district) ELSE NULL END,
    'locationBn', CASE WHEN (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb THEN public.compose_public_location(c.formatted_address,c.road,c.area,c.landmark,loc_u.name_bn,loc_d.name_bn,'bn') ELSE NULL END,
    'locationEn', CASE WHEN (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb THEN public.compose_public_location(c.formatted_address,c.road,c.area,c.landmark,loc_u.name_en,loc_d.name_en,'en') ELSE NULL END,
    'incidentDate', to_char(c.incident_date, 'YYYY-MM-DD'),
    'affectedPersonAgeGroup', c.affected_person_age_group,
    'allegedAbuserRelationship', c.alleged_abuser_relationship,
    'reportingFor', c.reporting_for,
    'intimateWhatHappened', CASE WHEN c.segment_id = 'harassment' AND c.subcategory_id = 'blackmail-coercion' THEN c.intimate_what_happened #>> '{}' ELSE NULL END,
    'intimatePlatform', CASE WHEN c.segment_id = 'harassment' AND c.subcategory_id = 'blackmail-coercion' THEN c.intimate_platform #>> '{}' ELSE NULL END,
    'briberyDepartment', CASE WHEN c.segment_id = 'extortion' AND c.subcategory_id = 'bribe-demanded-service' THEN c.bribery_department ELSE NULL END,
    'briberyService', CASE WHEN c.segment_id = 'extortion' AND c.subcategory_id = 'bribe-demanded-service' THEN c.bribery_service ELSE NULL END
  ) || jsonb_build_object(
    'briberyAmount', CASE WHEN c.segment_id = 'extortion' AND c.subcategory_id = 'bribe-demanded-service' THEN c.bribery_amount ELSE NULL END,
    'bribery_department', CASE WHEN c.segment_id = 'extortion' AND c.subcategory_id = 'bribe-demanded-service' THEN c.bribery_department ELSE NULL END,
    'bribery_service', CASE WHEN c.segment_id = 'extortion' AND c.subcategory_id = 'bribe-demanded-service' THEN c.bribery_service ELSE NULL END,
    'bribery_amount', CASE WHEN c.segment_id = 'extortion' AND c.subcategory_id = 'bribe-demanded-service' THEN c.bribery_amount ELSE NULL END,
    'frequency', CASE WHEN c.segment_id = 'extortion' THEN c.frequency ELSE NULL END,
    'incidentTime', CASE WHEN (c.segment_id = 'load_shedding' AND c.subcategory_id IN ('load-shedding-outage', 'gas-shortage')) OR c.segment_id = 'extortion' THEN c.incident_time ELSE NULL END,
    'incident_time', CASE WHEN (c.segment_id = 'load_shedding' AND c.subcategory_id IN ('load-shedding-outage', 'gas-shortage')) OR c.segment_id = 'extortion' THEN c.incident_time ELSE NULL END,
    'publishedAt', to_char(c.published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'updatedAt', to_char(c.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
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
    'utilityEndTime', CASE WHEN c.segment_id = 'load_shedding' AND c.subcategory_id IN ('load-shedding-outage', 'gas-shortage') THEN c.utility_end_time ELSE NULL END,
    'utility_end_time', CASE WHEN c.segment_id = 'load_shedding' AND c.subcategory_id IN ('load-shedding-outage', 'gas-shortage') THEN c.utility_end_time ELSE NULL END
  )) INTO v_result
  FROM public.complaints c
  LEFT JOIN public.bangladesh_districts loc_d ON loc_d.name_en=c.district
  LEFT JOIN public.bangladesh_upazilas loc_u ON loc_u.district_id=loc_d.id AND loc_u.name_en=c.upazila_or_thana
  LEFT JOIN LATERAL (
    SELECT CASE WHEN count(*) = 1 THEN max(nullif(trim(cp.name), '')) ELSE NULL END AS name,
           CASE WHEN count(*) = 1 THEN max(nullif(trim(cp.organization), '')) ELSE NULL END AS organization
    FROM public.complaint_parties cp
    WHERE cp.complaint_id = c.id AND (
      nullif(trim(cp.name), '') IS NOT NULL OR nullif(trim(cp.organization), '') IS NOT NULL OR nullif(trim(cp.role_or_designation), '') IS NOT NULL OR nullif(trim(cp.phone_or_contact), '') IS NOT NULL OR nullif(trim(cp.public_profile_handle), '') IS NOT NULL OR nullif(trim(cp.identifying_description), '') IS NOT NULL OR nullif(trim(cp.address), '') IS NOT NULL OR trim(coalesce(cp.party_type, '')) IN ('individual', 'business', 'group', 'organization')
    )
  ) party ON true
  WHERE upper(c.id) = v_clean_id AND c.status = 'published';
  RETURN v_result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_public_published_reports()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
          'publishedAt', to_char(c.published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
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
      order by c.published_at desc, c.id desc
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_public_feed_update_state(p_since timestamp with time zone DEFAULT NULL::timestamp with time zone, p_district text DEFAULT 'all'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_clean_district text;
  v_result jsonb;
BEGIN
  v_clean_district := lower(trim(coalesce(p_district, 'all')));

  WITH current_publications AS (
    SELECT
      c.id,
      min(u.created_at) AS published_at
    FROM public.complaints c
    JOIN public.complaint_updates u
      ON u.complaint_id = c.id
     AND u.update_type = 'published'
    WHERE c.status = 'published'
      AND (
        v_clean_district = 'all'
        OR (
          (c.publication_preferences->'showGeneralLocation') = 'true'::jsonb
          AND lower(c.district) LIKE '%' || v_clean_district || '%'
        )
      )
    GROUP BY c.id
  )
  SELECT jsonb_build_object(
    'newCount', count(*) FILTER (
      WHERE p_since IS NOT NULL
        AND cp.published_at > p_since
    ),
    'newestPublishedAt', max(cp.published_at),
    'checkedAt', now()
  )
  INTO v_result
  FROM current_publications cp;

  RETURN v_result;
END;
$function$
;
