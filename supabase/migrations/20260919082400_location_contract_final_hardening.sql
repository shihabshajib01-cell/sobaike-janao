-- Final authoritative snapshot for the Public -> SQL -> Admin location contract.
-- This migration is intentionally idempotent and source-aligns the production
-- functions after the earlier incremental hotfixes.

CREATE OR REPLACE FUNCTION public.location_text_language(p_value text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
  select case
    when nullif(btrim(coalesce(p_value,'')),'') is null then 'unknown'
    when p_value ~ '[ঀ-৿]' and p_value ~ '[A-Za-z]' then 'mixed'
    when p_value ~ '[ঀ-৿]' then 'bn'
    when p_value ~ '[A-Za-z]' then 'en'
    else 'unknown'
  end
$function$;

CREATE OR REPLACE FUNCTION public.canonical_division_name(p_value text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select d.name_en
  from public.bangladesh_divisions d
  where lower(btrim(coalesce(p_value,''))) in (lower(d.id),lower(d.name_en),lower(d.name_bn))
     or exists(select 1 from unnest(d.aliases) a where lower(a)=lower(btrim(coalesce(p_value,''))))
  limit 1
$function$;

CREATE OR REPLACE FUNCTION public.canonical_district_name(p_value text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select d.name_en
  from public.bangladesh_districts d
  where lower(btrim(coalesce(p_value,''))) in (lower(d.id),lower(d.name_en),lower(d.name_bn))
     or exists(select 1 from unnest(d.aliases) a where lower(a)=lower(btrim(coalesce(p_value,''))))
  limit 1
$function$;

CREATE OR REPLACE FUNCTION public.canonical_district_id(p_value text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select d.id
  from public.bangladesh_districts d
  where lower(btrim(coalesce(p_value,''))) in (lower(d.id),lower(d.name_en),lower(d.name_bn))
     or exists(select 1 from unnest(d.aliases) a where lower(a)=lower(btrim(coalesce(p_value,''))))
  limit 1
$function$;

CREATE OR REPLACE FUNCTION public.canonical_upazila_name(p_value text, p_district text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select u.name_en
  from public.bangladesh_upazilas u
  join public.bangladesh_districts d on d.id=u.district_id
  where (
    lower(btrim(coalesce(p_value,''))) in (lower(u.id),lower(u.name_en),lower(u.name_bn))
    or exists(select 1 from unnest(u.aliases) a where lower(a)=lower(btrim(coalesce(p_value,''))))
  )
  and (
    nullif(btrim(coalesce(p_district,'')),'') is null
    or d.id=public.canonical_district_id(p_district)
  )
  order by case when d.id=public.canonical_district_id(p_district) then 0 else 1 end,u.id
  limit 1
$function$;

CREATE OR REPLACE FUNCTION public.localize_district_name(p_value text, p_lang text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select case lower(coalesce(p_lang,'en')) when 'bn' then d.name_bn else d.name_en end
  from public.bangladesh_districts d
  where d.name_en=public.canonical_district_name(p_value)
  limit 1
$function$;

CREATE OR REPLACE FUNCTION public.localize_upazila_name(p_value text, p_district text, p_lang text)
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  select case lower(coalesce(p_lang,'en')) when 'bn' then u.name_bn else u.name_en end
  from public.bangladesh_upazilas u
  join public.bangladesh_districts d on d.id=u.district_id
  where u.name_en=public.canonical_upazila_name(p_value,p_district)
    and (public.canonical_district_id(p_district) is null or d.id=public.canonical_district_id(p_district))
  limit 1
$function$;

CREATE OR REPLACE FUNCTION public.build_public_area(p_area text, p_upazila text, p_district text, p_lang text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_lang text:=case when lower(coalesce(p_lang,'en'))='bn' then 'bn' else 'en' end;
  v text;
begin
  if nullif(btrim(coalesce(p_area,'')),'') is not null
     and public.location_text_language(p_area)=v_lang then return btrim(p_area); end if;
  v:=public.localize_upazila_name(p_upazila,p_district,v_lang);
  if v is not null then return v; end if;
  return public.localize_district_name(p_district,v_lang);
end
$function$;

CREATE OR REPLACE FUNCTION public.build_public_location(p_formatted text, p_road text, p_area text, p_landmark text, p_upazila text, p_district text, p_lang text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_lang text:=case when lower(coalesce(p_lang,'en'))='bn' then 'bn' else 'en' end;
  v_parts text[]:='{}';
  v text;
  v_formatted_lang text:=public.location_text_language(p_formatted);
begin
  if nullif(btrim(coalesce(p_formatted,'')),'') is not null
     and v_formatted_lang=v_lang then
    return btrim(p_formatted);
  end if;

  foreach v in array array[p_road,p_area,p_landmark] loop
    if nullif(btrim(coalesce(v,'')),'') is not null
       and public.location_text_language(v)=v_lang then
      v_parts:=array_append(v_parts,btrim(v));
    end if;
  end loop;

  v:=public.localize_upazila_name(p_upazila,p_district,v_lang);
  if v is null and public.location_text_language(p_upazila)=v_lang then v:=btrim(p_upazila); end if;
  if nullif(v,'') is not null and not (v=any(v_parts)) then v_parts:=array_append(v_parts,v); end if;

  v:=public.localize_district_name(p_district,v_lang);
  if v is null and public.location_text_language(p_district)=v_lang then v:=btrim(p_district); end if;
  if nullif(v,'') is not null and not (v=any(v_parts)) then v_parts:=array_append(v_parts,v); end if;

  if array_length(v_parts,1) is null then return null; end if;
  return array_to_string(v_parts,', ');
end
$function$;

CREATE OR REPLACE FUNCTION public.compose_public_area(p_area text, p_upazila_label text, p_district_label text, p_lang text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare v_lang text:=case when lower(coalesce(p_lang,'en'))='bn' then 'bn' else 'en' end;
begin
  if nullif(btrim(coalesce(p_area,'')),'') is not null
     and public.location_text_language(p_area)=v_lang then
    return btrim(p_area);
  end if;
  return coalesce(nullif(btrim(p_upazila_label),''),nullif(btrim(p_district_label),''));
end
$function$;

CREATE OR REPLACE FUNCTION public.compose_public_location(p_formatted text, p_road text, p_area text, p_landmark text, p_upazila_label text, p_district_label text, p_lang text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare
  v_lang text:=case when lower(coalesce(p_lang,'en'))='bn' then 'bn' else 'en' end;
  v_parts text[]:='{}';
  v text;
begin
  if nullif(btrim(coalesce(p_formatted,'')),'') is not null
     and public.location_text_language(p_formatted)=v_lang then
    return btrim(p_formatted);
  end if;

  foreach v in array array[p_road,p_area,p_landmark] loop
    if nullif(btrim(coalesce(v,'')),'') is not null
       and public.location_text_language(v)=v_lang
       and not (btrim(v)=any(v_parts)) then
      v_parts:=array_append(v_parts,btrim(v));
    end if;
  end loop;

  foreach v in array array[p_upazila_label,p_district_label] loop
    if nullif(btrim(coalesce(v,'')),'') is not null
       and not (btrim(v)=any(v_parts)) then
      v_parts:=array_append(v_parts,btrim(v));
    end if;
  end loop;

  if array_length(v_parts,1) is null then return null; end if;
  return array_to_string(v_parts,', ');
end
$function$;

CREATE OR REPLACE FUNCTION public.location_district_matches(p_stored text, p_requested text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_req text:=lower(btrim(coalesce(p_requested,'all')));
  v_stored_id text;
  v_req_id text;
begin
  if v_req='' or v_req='all' then return true; end if;
  v_stored_id:=public.canonical_district_id(p_stored);
  v_req_id:=public.canonical_district_id(p_requested);
  if v_stored_id is not null and v_req_id is not null then
    return v_stored_id=v_req_id;
  end if;
  return lower(btrim(coalesce(p_stored,'')))=v_req
    or lower(btrim(coalesce(p_stored,''))) like '%'||v_req||'%';
end
$function$;

CREATE OR REPLACE FUNCTION public.location_mention_position(p_needle text, p_haystack text)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog'
AS $function$
declare
  v_needle text:=lower(btrim(coalesce(p_needle,'')));
  v_hay text:=lower(coalesce(p_haystack,''));
  v_norm_needle text;
  v_norm_hay text;
  v_pos integer;
begin
  if v_needle='' then return 0; end if;

  if v_needle ~ '[ঀ-৿]' then
    return regexp_instr(
      v_hay,
      '(^|[^ঀ-৿])' || v_needle ||
      '(?:য়|য়|য়ে|য়ে|ে|র|এর|তে|য়ের|য়ের|েই|য়েই|য়েই)?($|[^ঀ-৿])',
      1,1,0,'i'
    );
  end if;

  v_norm_needle:=regexp_replace(v_needle,'[[:punct:][:space:]]+',' ','g');
  v_norm_hay:=' '||regexp_replace(v_hay,'[[:punct:][:space:]]+',' ','g')||' ';
  v_pos:=position(' '||v_norm_needle||' ' in v_norm_hay);
  return v_pos;
end
$function$;

CREATE OR REPLACE FUNCTION public.sourced_report_missing_required_fields_internal(p_subcategory_id text, p_report jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_schema_id uuid;
  v_field record;
  v_value jsonb;
  v_missing jsonb:='[]'::jsonb;
  v_storage_key text;
  v_field_key text;
  v_division text:=nullif(btrim(p_report->>'division'),'');
  v_district text:=nullif(btrim(p_report->>'district'),'');
  v_upazila text:=nullif(btrim(p_report->>'upazilaOrThana'),'');
  v_scope text:=coalesce(nullif(btrim(p_report->'customFieldAnswers'->>'locationScope'),''),'specific');
  v_has_specific boolean:=false;
begin
  select r.id into v_schema_id
  from public.reporting_form_schemas r
  where r.scope_type='subcategory'
    and r.scope_id=p_subcategory_id
    and r.status='published'
    and r.engine_mode='schema'
  order by r.version desc
  limit 1;

  if v_schema_id is not null then
    for v_field in
      select f.field_key,f.storage_key,f.storage_mode,f.label_en,f.label_bn
      from public.reporting_form_schema_fields f
      where f.schema_id=v_schema_id and f.active=true and f.required=true
      order by f.sort_order,f.id
    loop
      v_storage_key:=coalesce(nullif(btrim(v_field.storage_key),''),v_field.field_key);
      v_field_key:=v_field.field_key;
      v_value:=null;
      if v_field_key='title' or v_storage_key='title' then
        v_value:=to_jsonb(coalesce(nullif(btrim(p_report->>'titleBn'),''),nullif(btrim(p_report->>'titleEn'),'')));
      elsif v_field_key='description' or v_storage_key='description' then
        v_value:=to_jsonb(coalesce(nullif(btrim(p_report->>'descriptionBn'),''),nullif(btrim(p_report->>'descriptionEn'),'')));
      elsif v_field_key='location' or v_storage_key='location' or (v_field.storage_mode='system_block' and v_field.field_key='location') then
        if v_division is not null and v_district is not null then v_value:='true'::jsonb; end if;
      elsif v_field_key='mob_justice_details' or v_storage_key='mobJusticeDetails' then
        if jsonb_typeof(p_report->'mobJusticeDetails')='object' and p_report->'mobJusticeDetails'<>'{}'::jsonb then
          v_value:=p_report->'mobJusticeDetails';
        end if;
      else
        v_value:=coalesce(p_report->v_storage_key,p_report->v_field_key,p_report->'customFieldAnswers'->v_storage_key,p_report->'customFieldAnswers'->v_field_key);
      end if;
      if v_value is null
         or v_value='null'::jsonb
         or (jsonb_typeof(v_value)='string' and btrim(v_value#>>'{}')='')
         or (jsonb_typeof(v_value)='array' and jsonb_array_length(v_value)=0)
         or (jsonb_typeof(v_value)='object' and v_value='{}'::jsonb) then
        v_missing:=v_missing || jsonb_build_array(jsonb_build_object(
          'fieldKey',v_field_key,'storageKey',v_storage_key,'labelEn',v_field.label_en,'labelBn',v_field.label_bn
        ));
      end if;
    end loop;
  end if;

  if v_division is null or public.canonical_division_name(v_division) is null
     or v_district is null or public.canonical_district_name(v_district) is null then
    v_missing:=v_missing || jsonb_build_array(jsonb_build_object(
      'fieldKey','canonicalLocation','storageKey','location',
      'labelEn','Valid division and district','labelBn','সঠিক বিভাগ ও জেলা'
    ));
  end if;

  if v_upazila is not null and public.canonical_upazila_name(v_upazila,v_district) is null then
    v_missing:=v_missing || jsonb_build_array(jsonb_build_object(
      'fieldKey','canonicalUpazila','storageKey','upazilaOrThana',
      'labelEn','Valid upazila / thana','labelBn','সঠিক উপজেলা / থানা'
    ));
  end if;

  v_has_specific :=
    v_upazila is not null
    or nullif(btrim(p_report->>'area'),'') is not null
    or nullif(btrim(p_report->>'road'),'') is not null
    or nullif(btrim(p_report->>'landmark'),'') is not null
    or (
      nullif(btrim(p_report->>'formattedAddress'),'') is not null
      and lower(btrim(p_report->>'formattedAddress')) <> lower(btrim(coalesce(v_district,'')))
    );

  if not v_has_specific and v_scope <> 'district_wide' then
    v_missing:=v_missing || jsonb_build_array(jsonb_build_object(
      'fieldKey','locationSpecificity','storageKey','location',
      'labelEn','Specific incident location or explicit district-wide scope',
      'labelBn','নির্দিষ্ট ঘটনার স্থান বা জেলা-ব্যাপী স্কোপ'
    ));
  end if;

  return v_missing;
end
$function$;

CREATE OR REPLACE FUNCTION public.guard_sourced_report_schema_requirements()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_report jsonb;
  v_missing jsonb;
begin
  if new.origin_type<>'sourced_report' then
    return new;
  end if;

  v_report:=jsonb_build_object(
    'titleBn',new.title,
    'titleEn',new.title_en,
    'descriptionBn',new.description,
    'descriptionEn',new.description_en,
    'division',new.division,
    'district',new.district,
    'upazilaOrThana',new.upazila_or_thana,
    'area',new.area,
    'road',new.road,
    'landmark',new.landmark,
    'formattedAddress',new.formatted_address,
    'frequency',new.frequency,
    'incidentTime',case when new.incident_time is null then null else to_jsonb(new.incident_time::text) end,
    'utilityEndTime',case when new.utility_end_time is null then null else to_jsonb(new.utility_end_time::text) end,
    'recentBillMonth',new.recent_bill_month,
    'recentBillAmount',new.recent_bill_amount,
    'previousBillMonth',new.previous_bill_month,
    'previousBillAmount',new.previous_bill_amount,
    'briberyDepartment',new.bribery_department,
    'briberyService',new.bribery_service,
    'briberyAmount',new.bribery_amount,
    'affectedPersonAgeGroup',new.affected_person_age_group,
    'allegedAbuserRelationship',new.alleged_abuser_relationship,
    'reportingFor',new.reporting_for,
    'sexualHarassmentType',new.sexual_harassment_type,
    'sexualHarassmentContext',new.sexual_harassment_context,
    'sexualHarassmentInstitution',new.sexual_harassment_institution,
    'intimateWhatHappened',new.intimate_what_happened,
    'intimatePlatform',new.intimate_platform,
    'mobJusticeDetails',new.mob_justice_details,
    'customFieldAnswers',coalesce(new.custom_field_answers,'{}'::jsonb)
  );

  v_missing:=public.sourced_report_missing_required_fields_internal(
    new.subcategory_id,
    v_report
  );

  if jsonb_array_length(v_missing)>0 then
    raise exception 'SCHEMA_REQUIRED_FIELDS_MISSING: %',v_missing::text
      using errcode='P0001';
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_sourced_report_location_row()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v text;
begin
  if new.origin_type='sourced_report' then
    v:=public.canonical_division_name(new.division); if v is not null then new.division:=v; end if;
    v:=public.canonical_district_name(new.district); if v is not null then new.district:=v; end if;
    v:=public.canonical_upazila_name(new.upazila_or_thana,new.district); if v is not null then new.upazila_or_thana:=v; end if;
  end if;
  return new;
end
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_location_taxonomy()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_result jsonb;
begin
  if not public.is_active_admin() then
    raise exception 'Access denied.' using errcode='42501';
  end if;
  select jsonb_build_object(
    'divisions',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'nameEn',name_en,'nameBn',name_bn) order by id),'[]'::jsonb) from public.bangladesh_divisions),
    'districts',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'divisionId',division_id,'nameEn',name_en,'nameBn',name_bn) order by id),'[]'::jsonb) from public.bangladesh_districts),
    'upazilas',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'districtId',district_id,'nameEn',name_en,'nameBn',name_bn) order by id),'[]'::jsonb) from public.bangladesh_upazilas)
  ) into v_result;
  return v_result;
end
$function$;

CREATE OR REPLACE FUNCTION public.admin_resolve_news_intake_location(p_text text, p_language text DEFAULT 'unknown'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_raw text:=coalesce(p_text,'');
  v_up record;
  v_up_count integer:=0;
  v_dist record;
  v_div record;
  v_lang text:=case when lower(coalesce(p_language,''))='bn' then 'bn' else 'en' end;
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role'
     and (not public.is_active_admin() or not public.has_permission('complaints.publish')) then
    raise exception 'Access denied.' using errcode='42501';
  end if;

  with matched as (
    select
      u.id,u.name_en,u.name_bn,u.district_id,
      least(
        coalesce(nullif(public.location_mention_position(u.name_en,v_raw),0),2147483647),
        coalesce(nullif(public.location_mention_position(u.name_bn,v_raw),0),2147483647),
        coalesce((
          select min(nullif(public.location_mention_position(a,v_raw),0))
          from unnest(u.aliases) a
        ),2147483647)
      ) as first_pos,
      greatest(length(u.name_en),length(u.name_bn)) as specificity
    from public.bangladesh_upazilas u
  ),
  real_matches as (
    select * from matched where first_pos<2147483647
  )
  select count(*) into v_up_count from real_matches;

  with matched as (
    select
      u.id,u.name_en,u.name_bn,u.district_id,
      least(
        coalesce(nullif(public.location_mention_position(u.name_en,v_raw),0),2147483647),
        coalesce(nullif(public.location_mention_position(u.name_bn,v_raw),0),2147483647),
        coalesce((
          select min(nullif(public.location_mention_position(a,v_raw),0))
          from unnest(u.aliases) a
        ),2147483647)
      ) as first_pos,
      greatest(length(u.name_en),length(u.name_bn)) as specificity
    from public.bangladesh_upazilas u
  )
  select q.id,q.name_en,q.name_bn,q.district_id
  into v_up
  from matched q
  where q.first_pos<2147483647
  order by q.first_pos,q.specificity desc,q.id
  limit 1;

  if v_up.id is not null and v_up_count=1 then
    select * into v_dist from public.bangladesh_districts where id=v_up.district_id;
    select * into v_div from public.bangladesh_divisions where id=v_dist.division_id;
    return jsonb_build_object(
      'division',v_div.name_en,
      'district',v_dist.name_en,
      'upazilaOrThana',v_up.name_en,
      'area','',
      'road','',
      'landmark','',
      'formattedAddress',
        case when v_lang='bn'
          then v_up.name_bn||', '||v_dist.name_bn
          else v_up.name_en||', '||v_dist.name_en
        end,
      'locationScope','specific',
      'quality','specific',
      'matchedSpecificLocations',1
    );
  end if;

  if v_up.id is not null and v_up_count>1 then
    select * into v_dist from public.bangladesh_districts where id=v_up.district_id;
  else
    select q.*
    into v_dist
    from (
      select
        d.*,
        least(
          coalesce(nullif(public.location_mention_position(d.name_en,v_raw),0),2147483647),
          coalesce(nullif(public.location_mention_position(d.name_bn,v_raw),0),2147483647),
          coalesce((
            select min(nullif(public.location_mention_position(a,v_raw),0))
            from unnest(d.aliases) a
          ),2147483647)
        ) as first_pos,
        greatest(length(d.name_en),length(d.name_bn)) as specificity
      from public.bangladesh_districts d
    ) q
    where q.first_pos<2147483647
    order by q.first_pos,q.specificity desc,q.id
    limit 1;
  end if;

  if v_dist.id is null and lower(v_raw) ~ 'রাজধানী' then
    select * into v_dist from public.bangladesh_districts where id='dhaka';
  end if;

  if v_dist.id is not null then
    select * into v_div from public.bangladesh_divisions where id=v_dist.division_id;
    return jsonb_build_object(
      'division',v_div.name_en,
      'district',v_dist.name_en,
      'upazilaOrThana','',
      'area','',
      'road','',
      'landmark','',
      'formattedAddress','',
      'locationScope',case when v_up_count>1 then 'multi_location' else 'district_only' end,
      'quality',case when v_up_count>1 then 'multiple_locations' else 'district_only' end,
      'matchedSpecificLocations',v_up_count
    );
  end if;

  return null;
end
$function$;

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
          and lower(coalesce(c.district,'')) = v_clean_district
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
$function$;

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
    'publishedAt', to_char(c.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
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
$function$;

CREATE OR REPLACE FUNCTION public.admin_publish_complaint(p_complaint_id text, p_public_title_bn text DEFAULT NULL::text, p_public_title_en text DEFAULT NULL::text, p_public_summary_bn text DEFAULT NULL::text, p_public_summary_en text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_complaint record;
  v_audit_id uuid;
  v_preferences jsonb;
  v_location text;
  v_public_title_bn text;
  v_public_title_en text;
  v_public_summary_bn text;
  v_public_summary_en text;
  v_show_description boolean;
  v_show_location boolean;
BEGIN
  IF NOT public.is_active_admin() THEN
    RAISE EXCEPTION 'Access denied. Active administrative session required.' USING ERRCODE = '42501';
  END IF;

  IF NOT public.has_permission('complaints.publish') THEN
    RAISE EXCEPTION 'Access denied. You do not have permission to publish complaints.' USING ERRCODE = '42501';
  END IF;

  SELECT c.*, sc.name_bn AS subcategory_name_bn, sc.name_en AS subcategory_name_en
  INTO v_complaint
  FROM public.complaints c
  LEFT JOIN public.subcategories sc ON sc.id = c.subcategory_id
  WHERE c.id = p_complaint_id
  FOR UPDATE OF c;

  IF v_complaint.id IS NULL THEN
    RAISE EXCEPTION 'Complaint with ID % not found', p_complaint_id USING ERRCODE = 'P0002';
  END IF;

  IF v_complaint.origin_type = 'sourced_report' THEN
    IF public.canonical_division_name(v_complaint.division) IS NULL
       OR public.canonical_district_name(v_complaint.district) IS NULL THEN
      RAISE EXCEPTION 'SOURCE_LOCATION_REVIEW_REQUIRED: Select a valid division and district before publishing.'
        USING ERRCODE='22023';
    END IF;

    IF nullif(btrim(v_complaint.upazila_or_thana),'') IS NOT NULL
       AND public.canonical_upazila_name(v_complaint.upazila_or_thana,v_complaint.district) IS NULL THEN
      RAISE EXCEPTION 'SOURCE_LOCATION_REVIEW_REQUIRED: Select a valid upazila or thana before publishing.'
        USING ERRCODE='22023';
    END IF;

    IF coalesce(nullif(btrim(v_complaint.custom_field_answers->>'locationScope'),''),'specific') NOT IN ('specific','district_wide') THEN
      RAISE EXCEPTION 'SOURCE_LOCATION_REVIEW_REQUIRED: Choose a valid location scope before publishing.'
        USING ERRCODE='22023';
    END IF;

    IF coalesce(nullif(btrim(v_complaint.custom_field_answers->>'locationScope'),''),'specific') = 'specific'
       AND nullif(btrim(v_complaint.upazila_or_thana),'') IS NULL
       AND nullif(btrim(v_complaint.area),'') IS NULL
       AND nullif(btrim(v_complaint.road),'') IS NULL
       AND nullif(btrim(v_complaint.landmark),'') IS NULL
       AND (
         nullif(btrim(v_complaint.formatted_address),'') IS NULL
         OR lower(btrim(v_complaint.formatted_address)) = lower(btrim(coalesce(v_complaint.district,'')))
       ) THEN
      RAISE EXCEPTION 'SOURCE_LOCATION_REVIEW_REQUIRED: A specific source-backed incident location is required, or explicitly mark the report as district-wide.'
        USING ERRCODE='22023';
    END IF;
  END IF;

  IF v_complaint.status IS NULL OR v_complaint.status NOT IN ('submitted', 'unpublished') THEN
    RAISE EXCEPTION 'Cannot publish complaint with status "%". Only "submitted" or "unpublished" complaints can be published.', COALESCE(v_complaint.status, 'null') USING ERRCODE = '22023';
  END IF;

  v_preferences := COALESCE(v_complaint.publication_preferences, '{}'::jsonb);
  v_show_description := (v_preferences->'showDescription') = 'true'::jsonb;
  v_show_location := (v_preferences->'showGeneralLocation') = 'true'::jsonb;
  v_location := CASE WHEN v_show_location THEN COALESCE(NULLIF(btrim(v_complaint.area), ''), NULLIF(btrim(v_complaint.district), '')) ELSE NULL END;

  v_public_title_bn := COALESCE(
    NULLIF(btrim(p_public_title_bn), ''),
    NULLIF(btrim(v_preferences->>'publicTitleBn'), ''),
    CASE
      WHEN NULLIF(btrim(v_complaint.title), '') IS NOT NULL
       AND lower(btrim(v_complaint.title)) NOT IN (
         lower(COALESCE(v_complaint.subcategory_name_bn, '')),
         lower(COALESCE(v_complaint.subcategory_name_en, '')),
         'দোকান ও ব্যবসা',
         'shops & businesses'
       ) THEN btrim(v_complaint.title)
      ELSE NULL
    END,
    CASE v_complaint.subcategory_id
      WHEN 'bribe-demanded-service' THEN CASE WHEN v_location IS NOT NULL THEN v_location || '-এ ঘুষের অভিযোগ' ELSE 'ঘুষের অভিযোগ' END
      WHEN 'shop-business' THEN CASE WHEN v_location IS NOT NULL THEN v_location || '-এ দোকান ও ব্যবসা প্রতিষ্ঠানে চাঁদাবাজির অভিযোগ' ELSE 'দোকান ও ব্যবসা প্রতিষ্ঠানে চাঁদাবাজির অভিযোগ' END
      WHEN 'transport-movement' THEN CASE WHEN v_location IS NOT NULL THEN v_location || '-এ পরিবহন খাতে চাঁদাবাজির অভিযোগ' ELSE 'পরিবহন খাতে চাঁদাবাজির অভিযোগ' END
      WHEN 'construction-property' THEN CASE WHEN v_location IS NOT NULL THEN v_location || '-এ নির্মাণ/সম্পত্তি সংক্রান্ত চাঁদাবাজির অভিযোগ' ELSE 'নির্মাণ/সম্পত্তি সংক্রান্ত চাঁদাবাজির অভিযোগ' END
      WHEN 'threat-money-demand' THEN CASE WHEN v_location IS NOT NULL THEN v_location || '-এ হুমকি দিয়ে টাকা দাবির অভিযোগ' ELSE 'হুমকি দিয়ে টাকা দাবির অভিযোগ' END
      ELSE CASE
        WHEN v_location IS NOT NULL AND NULLIF(btrim(v_complaint.subcategory_name_bn), '') IS NOT NULL THEN v_location || '-এ ' || btrim(v_complaint.subcategory_name_bn) || ' সংক্রান্ত অভিযোগ'
        WHEN NULLIF(btrim(v_complaint.subcategory_name_bn), '') IS NOT NULL THEN btrim(v_complaint.subcategory_name_bn) || ' সংক্রান্ত অভিযোগ'
        ELSE COALESCE(NULLIF(btrim(v_complaint.title), ''), v_complaint.id)
      END
    END
  );

  v_public_title_en := COALESCE(
    NULLIF(btrim(p_public_title_en), ''),
    NULLIF(btrim(v_preferences->>'publicTitleEn'), ''),
    CASE
      WHEN NULLIF(btrim(v_complaint.title_en), '') IS NOT NULL
       AND lower(btrim(v_complaint.title_en)) NOT IN (
         lower(COALESCE(v_complaint.subcategory_name_en, '')),
         lower(COALESCE(v_complaint.subcategory_name_bn, '')),
         'shops & businesses'
       ) THEN btrim(v_complaint.title_en)
      ELSE NULL
    END,
    CASE v_complaint.subcategory_id
      WHEN 'bribe-demanded-service' THEN CASE WHEN v_location IS NOT NULL THEN 'Bribery complaint reported in ' || v_location ELSE 'Bribery complaint reported' END
      WHEN 'shop-business' THEN CASE WHEN v_location IS NOT NULL THEN 'Extortion from shops and businesses reported in ' || v_location ELSE 'Extortion from shops and businesses reported' END
      WHEN 'transport-movement' THEN CASE WHEN v_location IS NOT NULL THEN 'Transport extortion complaint reported in ' || v_location ELSE 'Transport extortion complaint reported' END
      WHEN 'construction-property' THEN CASE WHEN v_location IS NOT NULL THEN 'Construction or property extortion reported in ' || v_location ELSE 'Construction or property extortion reported' END
      WHEN 'threat-money-demand' THEN CASE WHEN v_location IS NOT NULL THEN 'Coercive money demand reported in ' || v_location ELSE 'Coercive money demand reported' END
      ELSE CASE
        WHEN v_location IS NOT NULL AND NULLIF(btrim(v_complaint.subcategory_name_en), '') IS NOT NULL THEN btrim(v_complaint.subcategory_name_en) || ' complaint reported in ' || v_location
        WHEN NULLIF(btrim(v_complaint.subcategory_name_en), '') IS NOT NULL THEN btrim(v_complaint.subcategory_name_en) || ' complaint reported'
        ELSE COALESCE(NULLIF(btrim(v_complaint.title_en), ''), NULLIF(btrim(v_complaint.title), ''), v_complaint.id)
      END
    END
  );

  v_public_summary_bn := COALESCE(
    NULLIF(btrim(p_public_summary_bn), ''),
    NULLIF(btrim(v_preferences->>'publicSummaryBn'), ''),
    CASE WHEN v_show_description AND NULLIF(btrim(v_complaint.description), '') IS NOT NULL THEN
      CASE WHEN char_length(btrim(v_complaint.description)) > 220 THEN regexp_replace(left(btrim(v_complaint.description), 220), '\s+\S*$', '') || '…' ELSE btrim(v_complaint.description) END
    ELSE NULL END
  );

  v_public_summary_en := COALESCE(
    NULLIF(btrim(p_public_summary_en), ''),
    NULLIF(btrim(v_preferences->>'publicSummaryEn'), ''),
    CASE WHEN v_show_description AND NULLIF(btrim(v_complaint.description_en), '') IS NOT NULL THEN
      CASE WHEN char_length(btrim(v_complaint.description_en)) > 220 THEN regexp_replace(left(btrim(v_complaint.description_en), 220), '\s+\S*$', '') || '…' ELSE btrim(v_complaint.description_en) END
    ELSE NULL END
  );

  v_preferences := v_preferences || jsonb_strip_nulls(jsonb_build_object(
    'publicTitleBn', v_public_title_bn,
    'publicTitleEn', v_public_title_en,
    'publicSummaryBn', v_public_summary_bn,
    'publicSummaryEn', v_public_summary_en
  ));

  UPDATE public.complaints SET status = 'published', publication_preferences = v_preferences, updated_at = now() WHERE id = v_complaint.id;

  INSERT INTO public.complaint_updates (complaint_id, update_type, note, is_public, created_at)
  VALUES (v_complaint.id, 'published', 'Complaint approved and published to public feed.', true, now());

  INSERT INTO public.admin_audit_logs (actor_id, action, target_type, target_id, details)
  VALUES (
    auth.uid(), 'complaint.publish', 'complaint', p_complaint_id,
    jsonb_build_object(
      'previous_status', v_complaint.status,
      'new_status', 'published',
      'public_title_bn', v_public_title_bn,
      'public_title_en', v_public_title_en,
      'has_public_summary_bn', v_public_summary_bn IS NOT NULL,
      'has_public_summary_en', v_public_summary_en IS NOT NULL,
      'timestamp', now()
    )
  ) RETURNING id INTO v_audit_id;

  PERFORM public.admin_emit_notification(
    p_event_key := 'complaint.published',
    p_title_en := 'Complaint published: ' || p_complaint_id,
    p_title_bn := 'অভিযোগ প্রকাশ করা হয়েছে: ' || p_complaint_id,
    p_body_en := 'Complaint ' || p_complaint_id || ' was approved and published to the public feed.',
    p_body_bn := 'অভিযোগ ' || p_complaint_id || ' অনুমোদন করে পাবলিক ফিডে প্রকাশ করা হয়েছে।',
    p_actor_user_id := auth.uid(),
    p_target_type := 'complaint',
    p_target_id := p_complaint_id,
    p_target_label := p_complaint_id,
    p_metadata := jsonb_build_object('complaint_id', p_complaint_id, 'previous_status', v_complaint.status, 'new_status', 'published', 'actor_user_id', auth.uid(), 'timestamp', now()),
    p_required_all_permissions := ARRAY['complaints.view'],
    p_required_any_permissions := '{}'::text[],
    p_audience_mode := 'permission',
    p_route := '/complaints/' || p_complaint_id,
    p_dedupe_key := 'complaint.published:oversight:' || v_audit_id::text,
    p_exclude_actor := true,
    p_include_super_admin := true
  );

  RETURN jsonb_build_object('success', true, 'complaint_id', p_complaint_id, 'status', 'published', 'previous_status', v_complaint.status, 'public_title_bn', v_public_title_bn, 'public_title_en', v_public_title_en);
END;
$function$;

create index if not exists bangladesh_districts_division_id_idx
  on public.bangladesh_districts(division_id);

drop trigger if exists normalize_sourced_report_location_before_write on public.complaints;
create trigger normalize_sourced_report_location_before_write
before insert or update of division,district,upazila_or_thana,origin_type
on public.complaints
for each row execute function public.normalize_sourced_report_location_row();

drop trigger if exists trg_guard_sourced_report_schema_requirements on public.complaints;
create trigger trg_guard_sourced_report_schema_requirements
before insert or update on public.complaints
for each row execute function public.guard_sourced_report_schema_requirements();

-- Admin-only SECURITY DEFINER RPCs must not be callable anonymously.
revoke all privileges on function public.admin_get_location_taxonomy() from public, anon;
revoke all privileges on function public.admin_resolve_news_intake_location(text,text) from public, anon;
grant execute on function public.admin_get_location_taxonomy() to authenticated, service_role;
grant execute on function public.admin_resolve_news_intake_location(text,text) to authenticated, service_role;

-- Keep stored administrative location values canonical.
update public.complaints
set division=coalesce(public.canonical_division_name(division),division),
    district=coalesce(public.canonical_district_name(district),district),
    upazila_or_thana=coalesce(
      public.canonical_upazila_name(
        upazila_or_thana,
        coalesce(public.canonical_district_name(district),district)
      ),
      upazila_or_thana
    )
where nullif(btrim(coalesce(division,'')),'') is not null
   or nullif(btrim(coalesce(district,'')),'') is not null
   or nullif(btrim(coalesce(upazila_or_thana,'')),'') is not null;

-- Preserve explicit sourced-report provenance and scope for older rows.
with derived as (
  select
    c.id,
    case
      when coalesce(src.source_title,'') ~ '[ঀ-৿]' and coalesce(src.source_title,'') !~ '[A-Za-z]' then 'bn'
      when coalesce(src.source_title,'') ~ '[A-Za-z]' and coalesce(src.source_title,'') !~ '[ঀ-৿]' then 'en'
      when coalesce(c.title,'') ~ '[ঀ-৿]' and coalesce(c.title,'') !~ '[A-Za-z]' then 'bn'
      when coalesce(c.title,'') ~ '[A-Za-z]' and coalesce(c.title,'') !~ '[ঀ-৿]' then 'en'
      else 'unknown'
    end as source_language
  from public.complaints c
  left join lateral (
    select cs.source_title
    from public.complaint_sources cs
    where cs.complaint_id=c.id and cs.verification_status='verified'
    order by cs.created_at
    limit 1
  ) src on true
  where c.origin_type='sourced_report'
)
update public.complaints c
set custom_field_answers=
      coalesce(c.custom_field_answers,'{}'::jsonb)
      || case
           when nullif(btrim(c.custom_field_answers->>'sourceLanguage'),'') is null
           then jsonb_build_object('sourceLanguage',d.source_language)
           else '{}'::jsonb
         end
      || case
           when nullif(btrim(c.custom_field_answers->>'locationScope'),'') is null
           then jsonb_build_object('locationScope','specific')
           else '{}'::jsonb
         end
from derived d
where d.id=c.id
  and (
    nullif(btrim(c.custom_field_answers->>'sourceLanguage'),'') is null
    or nullif(btrim(c.custom_field_answers->>'locationScope'),'') is null
  );
