-- Close remaining controllable auth-session and concurrency gaps without changing product behavior.

create or replace function private.is_current_auth_session_valid()
returns boolean
language plpgsql
stable
security definer
set search_path = 'pg_catalog', 'auth'
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_text text := nullif(auth.jwt()->>'session_id', '');
  v_session_id uuid;
begin
  if v_user_id is null or v_session_text is null then
    return false;
  end if;

  begin
    v_session_id := v_session_text::uuid;
  exception when others then
    return false;
  end;

  return exists (
    select 1
    from auth.sessions s
    where s.id = v_session_id
      and s.user_id = v_user_id
      and (s.not_after is null or s.not_after > now())
  );
end;
$$;

revoke execute on function private.is_current_auth_session_valid()
  from public, anon, authenticated;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = 'pg_catalog', 'public', 'private'
as $$
  select private.is_current_auth_session_valid()
     and exists (
       select 1
       from public.admin_users
       where user_id = auth.uid()
         and active = true
     );
$$;

create or replace function public.has_permission(p_permission_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = 'pg_catalog', 'public', 'private'
as $$
declare
    v_is_super_admin boolean;
    v_perm_exists boolean;
    v_requires_aal2 boolean;
begin
    if not private.is_current_auth_session_valid() then
        return false;
    end if;

    v_requires_aal2 := p_permission_id = any(array[
        'admin_users.manage',
        'banners.manage',
        'categories.manage',
        'complaints.publish',
        'complaints.reject',
        'complaints.unpublish',
        'responses.publish',
        'responses.reject',
        'responses.resubmit',
        'responses.unpublish',
        'roles.manage'
    ]::text[]);

    if v_requires_aal2
       and coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then
        return false;
    end if;

    select coalesce(is_super_admin, false)
    into v_is_super_admin
    from public.admin_users
    where user_id = auth.uid()
      and active = true;

    if v_is_super_admin is true then
        select exists (
            select 1
            from public.permissions
            where id = p_permission_id
        )
        into v_perm_exists;

        return v_perm_exists;
    end if;

    return exists (
        select 1
        from public.admin_users au
        join public.user_roles ur on ur.user_id = au.user_id
        join public.roles r on r.id = ur.role_id
        join public.role_permissions rp on rp.role_id = r.id
        where au.user_id = auth.uid()
          and au.active = true
          and r.active = true
          and rp.permission_id = p_permission_id
    );
end;
$$;

create or replace function public.can_manage_roles()
returns boolean
language plpgsql
stable
security definer
set search_path = 'pg_catalog', 'public'
as $$
declare
    v_has_any_assignments boolean;
begin
    if not public.is_active_admin() then
        return false;
    end if;

    if coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then
        return false;
    end if;

    select exists (select 1 from public.user_roles)
    into v_has_any_assignments;

    if not v_has_any_assignments then
        return true;
    end if;

    return public.has_permission('roles.manage');
end;
$$;

create or replace function public.admin_notification_can_currently_view(
  p_recipient_user_id uuid,
  p_audience_mode text,
  p_required_all_permissions text[],
  p_required_any_permissions text[],
  p_target_type text,
  p_target_id text
)
returns boolean
language plpgsql
stable
security definer
set search_path = 'pg_catalog', 'public'
as $$
declare
    v_caller_id uuid;
    v_is_super_admin boolean;
    v_eff_perms text[];
    v_target_uuid uuid;
    v_scope_ok boolean;
begin
    v_caller_id := auth.uid();

    if v_caller_id is null
       or p_recipient_user_id is null
       or v_caller_id <> p_recipient_user_id
       or not public.is_active_admin()
    then
        return false;
    end if;

    select coalesce(au.is_super_admin, false)
    into v_is_super_admin
    from public.admin_users au
    where au.user_id = v_caller_id
      and au.active = true;

    if v_is_super_admin is true then
        return true;
    end if;

    if p_audience_mode = 'personal' then
        return true;
    elsif p_audience_mode = 'super_admin_only' then
        return false;
    elsif p_audience_mode = 'permission' then
        v_eff_perms := array(
            select p_id
            from public.admin_notification_get_effective_permissions(v_caller_id) as p_id
        );

        if p_required_all_permissions is not null
           and cardinality(p_required_all_permissions) > 0
           and not (p_required_all_permissions <@ v_eff_perms)
        then
            return false;
        end if;

        if p_required_any_permissions is not null
           and cardinality(p_required_any_permissions) > 0
           and not (p_required_any_permissions && v_eff_perms)
        then
            return false;
        end if;

        if p_target_type = 'admin_user' then
            if p_target_id is null or length(btrim(p_target_id)) = 0 then
                return false;
            end if;

            begin
                v_target_uuid := btrim(p_target_id)::uuid;
            exception when others then
                return false;
            end;

            v_scope_ok := public.admin_notification_can_view_user_scope(
                v_caller_id, v_target_uuid
            );

            if v_scope_ok is not true then
                return false;
            end if;
        elsif p_target_type = 'role' then
            if p_target_id is null or length(btrim(p_target_id)) = 0 then
                return false;
            end if;

            v_scope_ok := public.admin_notification_can_view_role_scope(
                v_caller_id, btrim(p_target_id)
            );

            if v_scope_ok is not true then
                return false;
            end if;
        elsif p_target_type = 'complaint' then
            null;
        elsif p_target_type is null then
            null;
        else
            return false;
        end if;

        return true;
    end if;

    return false;
end;
$$;

create or replace function private.can_upload_public_complaint_evidence(p_storage_path text)
returns boolean
language plpgsql
volatile
security definer
set search_path = 'pg_catalog', 'pg_temp'
as $$
declare
  v_client_submission_id text;
  v_file_name text;
  v_prefix text;
  v_existing_count integer;
begin
  p_storage_path := trim(coalesce(p_storage_path, ''));

  if p_storage_path = '' or length(p_storage_path) > 512 then
    return false;
  end if;

  if split_part(p_storage_path, '/', 1) <> 'public-submissions' then
    return false;
  end if;

  v_client_submission_id := split_part(p_storage_path, '/', 2);
  v_file_name := split_part(p_storage_path, '/', 3);

  if v_client_submission_id = ''
     or length(v_client_submission_id) < 8
     or length(v_client_submission_id) > 128
     or v_file_name = ''
     or length(v_file_name) > 180
     or split_part(p_storage_path, '/', 4) <> '' then
    return false;
  end if;

  if v_file_name !~ '^[a-z0-9_-]+\.webp$' then
    return false;
  end if;

  if not exists (
    select 1
    from public.complaints c
    where c.client_submission_id = v_client_submission_id
      and c.status = 'submitted'
  ) then
    return false;
  end if;

  perform pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'public-evidence-upload:' || v_client_submission_id,
      0
    )
  );

  v_prefix := 'public-submissions/' || v_client_submission_id || '/';

  select count(*)
  into v_existing_count
  from storage.objects o
  where o.bucket_id = 'complaint-evidence'
    and o.name like v_prefix || '%';

  return v_existing_count < 6;
end;
$$;

create or replace function public.submit_public_response_v2(
  p_report_id text,
  p_response_type text,
  p_payload jsonb,
  p_visitor_id text,
  p_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $$
declare
  v_visitor_id text := lower(nullif(btrim(p_visitor_id),''));
  v_session_id text := lower(nullif(btrim(p_session_id),''));
  v_type text := lower(nullif(btrim(p_response_type),''));
  v_hour_visitor integer;
  v_hour_session integer;
  v_day_visitor integer;
  v_result jsonb;
  v_lock_visitor bigint;
  v_lock_session bigint;
begin
  if v_visitor_id is null
     or v_visitor_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or v_session_id is null
     or v_session_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then raise exception 'INVALID_RESPONSE_CONTEXT'; end if;

  if v_type not in ('citizen_information','subject_response') then
    raise exception 'INVALID_RESPONSE_TYPE';
  end if;

  v_lock_visitor := pg_catalog.hashtextextended('response:visitor:' || v_visitor_id, 0);
  v_lock_session := pg_catalog.hashtextextended('response:session:' || v_session_id, 0);

  if v_lock_visitor <= v_lock_session then
    perform pg_advisory_xact_lock(v_lock_visitor);
    perform pg_advisory_xact_lock(v_lock_session);
  else
    perform pg_advisory_xact_lock(v_lock_session);
    perform pg_advisory_xact_lock(v_lock_visitor);
  end if;

  select count(*) into v_hour_visitor
  from public.public_response_rate_events
  where visitor_id=v_visitor_id and created_at > now() - interval '1 hour';

  select count(*) into v_hour_session
  from public.public_response_rate_events
  where session_id=v_session_id and created_at > now() - interval '1 hour';

  select count(*) into v_day_visitor
  from public.public_response_rate_events
  where visitor_id=v_visitor_id and created_at > now() - interval '24 hours';

  if v_hour_visitor >= 10 or v_hour_session >= 6 or v_day_visitor >= 30 then
    raise exception 'RATE_LIMITED';
  end if;

  v_result := public.submit_public_response(p_report_id,v_type,p_payload);

  insert into public.public_response_rate_events(
    report_id,visitor_id,session_id,response_type
  )
  values(upper(btrim(p_report_id)),v_visitor_id,v_session_id,v_type);

  return v_result;
end;
$$;

create or replace function public.track_public_report_engagement(
  p_report_id text,
  p_event_type text,
  p_visitor_id text,
  p_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'pg_temp'
as $$
declare
  v_report_id text := upper(nullif(btrim(p_report_id),''));
  v_event_type text := lower(nullif(btrim(p_event_type),''));
  v_visitor_id text := lower(nullif(btrim(p_visitor_id),''));
  v_session_id text := lower(nullif(btrim(p_session_id),''));
  v_inserted integer := 0;
  v_view_count bigint;
  v_share_count bigint;
  v_recent_visitor integer;
  v_recent_report integer;
begin
  if v_report_id is null or not exists (
    select 1 from public.complaints c
    where upper(c.id)=v_report_id and c.status='published'
  ) then return null; end if;

  if v_event_type not in ('view','share') then
    raise exception 'INVALID_ENGAGEMENT_EVENT';
  end if;

  if v_visitor_id is null
     or v_visitor_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or v_session_id is null
     or v_session_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then raise exception 'INVALID_ENGAGEMENT_CONTEXT'; end if;

  perform pg_advisory_xact_lock(
    pg_catalog.hashtextextended('engagement:visitor:' || v_visitor_id, 0)
  );

  select count(*) into v_recent_visitor
  from public.public_engagement_events e
  where e.visitor_id=v_visitor_id
    and e.created_at > now() - interval '1 minute';

  if v_recent_visitor >= 20 then
    raise exception 'RATE_LIMITED';
  end if;

  perform pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'engagement:report:' || v_report_id || ':' || v_event_type,
      0
    )
  );

  select count(*) into v_recent_report
  from public.public_engagement_events e
  where e.report_id=v_report_id
    and e.event_type=v_event_type
    and e.created_at > now() - interval '1 minute';

  if v_recent_report >= 300 then
    raise exception 'RATE_LIMITED';
  end if;

  insert into public.public_engagement_events(
    report_id,visitor_id,session_id,event_type
  )
  values(v_report_id,v_visitor_id,v_session_id,v_event_type)
  on conflict do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted = 1 then
    if v_event_type='view' then
      update public.complaints c
      set public_view_count=coalesce(c.public_view_count,0)+1
      where upper(c.id)=v_report_id and c.status='published'
      returning c.public_view_count,c.public_share_count
      into v_view_count,v_share_count;
    else
      update public.complaints c
      set public_share_count=coalesce(c.public_share_count,0)+1
      where upper(c.id)=v_report_id and c.status='published'
      returning c.public_view_count,c.public_share_count
      into v_view_count,v_share_count;
    end if;
  else
    select c.public_view_count,c.public_share_count
    into v_view_count,v_share_count
    from public.complaints c
    where upper(c.id)=v_report_id and c.status='published';
  end if;

  return jsonb_build_object(
    'viewCount',coalesce(v_view_count,0),
    'shareCount',coalesce(v_share_count,0),
    'counted',v_inserted=1
  );
end;
$$;
