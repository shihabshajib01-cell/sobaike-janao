-- Keep existing Extortion timeline inputs available on Public readback.
do $$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into v_oid
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='get_public_published_report'
    and pg_get_function_identity_arguments(p.oid)='p_report_id text'
  limit 1;

  if v_oid is null then raise exception 'get_public_published_report not found'; end if;
  v_def := pg_get_functiondef(v_oid);

  v_def := replace(
    v_def,
    '''frequency'', CASE WHEN c.segment_id = ''extortion'' AND c.subcategory_id = ''bribe-demanded-service'' THEN c.frequency ELSE NULL END,',
    '''frequency'', CASE WHEN c.segment_id = ''extortion'' THEN c.frequency ELSE NULL END,'
  );
  v_def := replace(
    v_def,
    '''incidentTime'', CASE WHEN (c.segment_id = ''load_shedding'' AND c.subcategory_id IN (''load-shedding-outage'', ''gas-shortage'')) OR (c.segment_id = ''extortion'' AND c.subcategory_id = ''bribe-demanded-service'') THEN c.incident_time ELSE NULL END,',
    '''incidentTime'', CASE WHEN (c.segment_id = ''load_shedding'' AND c.subcategory_id IN (''load-shedding-outage'', ''gas-shortage'')) OR c.segment_id = ''extortion'' THEN c.incident_time ELSE NULL END,'
  );
  v_def := replace(
    v_def,
    '''incident_time'', CASE WHEN (c.segment_id = ''load_shedding'' AND c.subcategory_id IN (''load-shedding-outage'', ''gas-shortage'')) OR (c.segment_id = ''extortion'' AND c.subcategory_id = ''bribe-demanded-service'') THEN c.incident_time ELSE NULL END,',
    '''incident_time'', CASE WHEN (c.segment_id = ''load_shedding'' AND c.subcategory_id IN (''load-shedding-outage'', ''gas-shortage'')) OR c.segment_id = ''extortion'' THEN c.incident_time ELSE NULL END,'
  );

  execute v_def;
end $$;

do $$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into v_oid
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='get_public_published_reports'
  limit 1;

  if v_oid is null then raise exception 'get_public_published_reports not found'; end if;
  v_def := pg_get_functiondef(v_oid);

  v_def := replace(
    v_def,
    '''frequency'', CASE WHEN c.segment_id = ''extortion'' AND c.subcategory_id = ''bribe-demanded-service'' THEN c.frequency ELSE NULL END,',
    '''frequency'', CASE WHEN c.segment_id = ''extortion'' THEN c.frequency ELSE NULL END,'
  );
  v_def := replace(
    v_def,
    '''incidentTime'', CASE WHEN (c.segment_id = ''load_shedding'' AND c.subcategory_id IN (''load-shedding-outage'', ''gas-shortage'')) OR (c.segment_id = ''extortion'' AND c.subcategory_id = ''bribe-demanded-service'') THEN c.incident_time ELSE NULL END,',
    '''incidentTime'', CASE WHEN (c.segment_id = ''load_shedding'' AND c.subcategory_id IN (''load-shedding-outage'', ''gas-shortage'')) OR c.segment_id = ''extortion'' THEN c.incident_time ELSE NULL END,'
  );
  v_def := replace(
    v_def,
    '''incident_time'', CASE WHEN (c.segment_id = ''load_shedding'' AND c.subcategory_id IN (''load-shedding-outage'', ''gas-shortage'')) OR (c.segment_id = ''extortion'' AND c.subcategory_id = ''bribe-demanded-service'') THEN c.incident_time ELSE NULL END,',
    '''incident_time'', CASE WHEN (c.segment_id = ''load_shedding'' AND c.subcategory_id IN (''load-shedding-outage'', ''gas-shortage'')) OR c.segment_id = ''extortion'' THEN c.incident_time ELSE NULL END,'
  );

  execute v_def;
end $$;
