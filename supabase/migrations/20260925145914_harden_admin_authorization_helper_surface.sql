-- Harden remaining authenticated SECURITY DEFINER authorization helpers.
-- Valid active Admin sessions keep the same permission results; stale/revoked
-- sessions fail closed. Internal role helpers are no longer directly callable
-- by authenticated clients.

create or replace function public.admin_get_my_authorization_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = 'pg_catalog', 'public', 'private'
as $$
declare
    v_user_id uuid;
    v_is_active_admin boolean;
    v_is_super_admin boolean;
    v_has_any_user_roles boolean;
    v_role_record record;
    v_permissions_json jsonb;
    v_role_json jsonb;
begin
    v_user_id := auth.uid();

    if v_user_id is null
       or not private.is_current_auth_session_valid()
    then
        return jsonb_build_object(
            'is_admin', false,
            'is_super_admin', false,
            'is_bootstrap', false,
            'role', null,
            'permission_ids', '[]'::jsonb
        );
    end if;

    select active, coalesce(is_super_admin, false)
    into v_is_active_admin, v_is_super_admin
    from public.admin_users
    where user_id = v_user_id;

    if v_is_active_admin is not true then
        return jsonb_build_object(
            'is_admin', false,
            'is_super_admin', false,
            'is_bootstrap', false,
            'role', null,
            'permission_ids', '[]'::jsonb
        );
    end if;

    if v_is_super_admin is true then
        select coalesce(jsonb_agg(p.id order by p.id), '[]'::jsonb)
        into v_permissions_json
        from public.permissions p;

        return jsonb_build_object(
            'is_admin', true,
            'is_super_admin', true,
            'is_bootstrap', false,
            'role', null,
            'permission_ids', coalesce(v_permissions_json, '[]'::jsonb)
        );
    end if;

    select r.id, r.name_en, r.name_bn, r.description, r.active, r.is_system
    into v_role_record
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = v_user_id;

    if found then
        v_role_json := jsonb_build_object(
            'id', v_role_record.id,
            'name_en', v_role_record.name_en,
            'name_bn', v_role_record.name_bn,
            'description', v_role_record.description,
            'active', v_role_record.active,
            'is_system', v_role_record.is_system
        );

        if v_role_record.active then
            select coalesce(
                jsonb_agg(rp.permission_id order by rp.permission_id),
                '[]'::jsonb
            )
            into v_permissions_json
            from public.role_permissions rp
            where rp.role_id = v_role_record.id;

            return jsonb_build_object(
                'is_admin', true,
                'is_super_admin', false,
                'is_bootstrap', false,
                'role', v_role_json,
                'permission_ids', coalesce(v_permissions_json, '[]'::jsonb)
            );
        end if;

        return jsonb_build_object(
            'is_admin', true,
            'is_super_admin', false,
            'is_bootstrap', false,
            'role', v_role_json,
            'permission_ids', '[]'::jsonb
        );
    end if;

    select exists (select 1 from public.user_roles)
    into v_has_any_user_roles;

    if not v_has_any_user_roles then
        return jsonb_build_object(
            'is_admin', true,
            'is_super_admin', false,
            'is_bootstrap', true,
            'role', jsonb_build_object(
                'id', 'bootstrap_admin',
                'name_en', 'Bootstrap Administrator',
                'name_bn', 'বুটস্ট্র্যাপ অ্যাডমিনিস্ট্রেটর',
                'description', 'Initial system administrator in bootstrap setup mode',
                'active', true,
                'is_system', true
            ),
            'permission_ids', jsonb_build_array('roles.manage')
        );
    end if;

    return jsonb_build_object(
        'is_admin', true,
        'is_super_admin', false,
        'is_bootstrap', false,
        'role', null,
        'permission_ids', '[]'::jsonb
    );
end;
$$;

create or replace function public.get_caller_effective_permission_set()
returns setof text
language plpgsql
stable
security definer
set search_path = 'pg_catalog', 'public', 'private'
as $$
declare
    v_user_id uuid;
    v_is_active_admin boolean;
    v_is_super_admin boolean;
    v_bootstrap_mode boolean;
begin
    v_user_id := auth.uid();

    if v_user_id is null
       or not private.is_current_auth_session_valid()
    then
        return;
    end if;

    select (active = true)
    into v_is_active_admin
    from public.admin_users
    where user_id = v_user_id;

    if v_is_active_admin is not true then
        return;
    end if;

    select coalesce(au.is_super_admin, false)
    into v_is_super_admin
    from public.admin_users au
    where au.user_id = v_user_id
      and au.active = true;

    if v_is_super_admin is true then
        return query select p.id from public.permissions p;
        return;
    end if;

    select not exists (select 1 from public.user_roles)
    into v_bootstrap_mode;

    if v_bootstrap_mode is true then
        return query select p.id from public.permissions p;
        return;
    end if;

    return query
    select distinct rp.permission_id
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id and r.active = true
    join public.role_permissions rp on rp.role_id = r.id
    where ur.user_id = v_user_id;
end;
$$;

create or replace function public.can_manage_role_scope(p_role_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = 'pg_catalog', 'public', 'private'
as $$
declare
    v_user_id uuid;
    v_is_active_admin boolean;
    v_is_super_admin boolean;
    v_bootstrap_mode boolean;
    v_role_exists boolean;
begin
    v_user_id := auth.uid();

    if v_user_id is null
       or not private.is_current_auth_session_valid()
    then
        return false;
    end if;

    select exists (
        select 1 from public.roles where id = p_role_id
    ) into v_role_exists;

    if not v_role_exists then
        return false;
    end if;

    select (active = true)
    into v_is_active_admin
    from public.admin_users
    where user_id = v_user_id;

    if v_is_active_admin is not true then
        return false;
    end if;

    select coalesce(au.is_super_admin, false)
    into v_is_super_admin
    from public.admin_users au
    where au.user_id = v_user_id
      and au.active = true;

    if v_is_super_admin is true then
        return true;
    end if;

    select not exists (select 1 from public.user_roles)
    into v_bootstrap_mode;

    if v_bootstrap_mode is true then
        return true;
    end if;

    return not exists (
        select 1
        from public.role_permissions rp
        where rp.role_id = p_role_id
          and rp.permission_id not in (
              select public.get_caller_effective_permission_set()
          )
    );
end;
$$;

revoke execute on function public.get_caller_effective_permission_set()
from public, anon, authenticated;

revoke execute on function public.can_manage_role_scope(text)
from public, anon, authenticated;
