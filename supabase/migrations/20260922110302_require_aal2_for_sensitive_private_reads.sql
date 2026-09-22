-- Require MFA-level assurance for the most sensitive private complaint reads.

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
        'complaints.evidence_view',
        'complaints.export',
        'complaints.publish',
        'complaints.reject',
        'complaints.unpublish',
        'location_activity.view',
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

create or replace function public.admin_get_complaint_reporter_location(p_complaint_id text)
returns table(
  complaint_id text,
  reporter_latitude double precision,
  reporter_longitude double precision,
  accuracy_meters double precision,
  captured_at timestamp with time zone
)
language plpgsql
stable
security definer
set search_path = 'pg_catalog', 'public'
as $$
declare
    v_is_super_admin boolean := false;
begin
    if not public.is_active_admin() then
        raise exception
            'Access denied. Active administrative session required.'
            using errcode = '42501';
    end if;

    if coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then
        raise exception
            'Access denied. AAL2 authentication is required for private reporter device telemetry.'
            using errcode = '42501';
    end if;

    select coalesce(au.is_super_admin, false)
    into v_is_super_admin
    from public.admin_users as au
    where au.user_id = auth.uid()
      and au.active = true
    limit 1;

    if v_is_super_admin is not true then
        raise exception
            'Access denied. Private reporter device telemetry is restricted to Super Administrators.'
            using errcode = '42501';
    end if;

    return query
    select
        sc.complaint_id::text,
        sc.reporter_latitude::double precision,
        sc.reporter_longitude::double precision,
        sc.accuracy_meters::double precision,
        sc.captured_at::timestamptz
    from public.complaint_submission_contexts as sc
    where sc.complaint_id::text = p_complaint_id
    limit 1;
end;
$$;
