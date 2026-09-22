-- Public security least-privilege closeout.
-- Preserve client read behavior while removing accidental table/function capabilities.

revoke insert, update, delete, truncate, references, trigger, maintain
  on table public.bangladesh_divisions,
           public.bangladesh_districts,
           public.bangladesh_upazilas
  from anon, authenticated;

revoke truncate, references, trigger, maintain
  on table public.bangladesh_divisions,
           public.bangladesh_districts,
           public.bangladesh_upazilas
  from service_role;

grant select
  on table public.bangladesh_divisions,
           public.bangladesh_districts,
           public.bangladesh_upazilas
  to anon, authenticated;

revoke execute on function public.sanitize_ride_sharing_complaint_party()
  from public, anon, authenticated;

revoke execute on function public.get_public_home_feed_with_engagement(
  double precision, double precision, text, text
) from public, anon, authenticated;

revoke execute on function public.get_public_published_report_with_engagement(text)
  from public, anon, authenticated;

revoke execute on function public.get_public_published_reports_with_engagement()
  from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger, maintain
  on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated, service_role;
