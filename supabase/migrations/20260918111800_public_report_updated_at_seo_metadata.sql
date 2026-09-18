-- SEO freshness metadata: expose complaint updated_at through the sanitized public RPCs.
-- Keeps publication time and modification time separate for sitemap and Article metadata.

do $$
declare
  r record;
  v_def text;
begin
  for r in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        (p.proname = 'get_public_published_reports' and pg_get_function_identity_arguments(p.oid) = '')
        or
        (p.proname = 'get_public_published_report' and pg_get_function_identity_arguments(p.oid) = 'p_report_id text')
      )
  loop
    v_def := pg_get_functiondef(r.oid);

    if position('''updatedAt''' in v_def) = 0 then
      v_def := replace(
        v_def,
        E'    ''priority'', ''medium'',',
        E'    ''updatedAt'', to_char(c.updated_at AT TIME ZONE ''UTC'', ''YYYY-MM-DD"T"HH24:MI:SS"Z"''),\n    ''priority'', ''medium'','
      );

      if position('''updatedAt''' in v_def) = 0 then
        raise exception 'Could not add updatedAt to %.%(%)', 'public', r.proname, r.args;
      end if;

      execute v_def;
    end if;
  end loop;
end
$$;
