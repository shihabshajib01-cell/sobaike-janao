-- Admin location RPCs only read public taxonomy data and perform explicit
-- admin/service-role checks, so they do not need definer privileges.

alter function public.admin_get_location_taxonomy() security invoker;
alter function public.admin_resolve_news_intake_location(text,text) security invoker;

revoke all privileges on function public.admin_get_location_taxonomy() from public, anon;
revoke all privileges on function public.admin_resolve_news_intake_location(text,text) from public, anon;
grant execute on function public.admin_get_location_taxonomy() to authenticated, service_role;
grant execute on function public.admin_resolve_news_intake_location(text,text) to authenticated, service_role;
