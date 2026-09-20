begin;

create index if not exists public_response_rate_events_report_id_idx
  on public.public_response_rate_events (report_id);

drop policy if exists "deny direct api access"
  on public.public_category_popularity_snapshot;
drop policy if exists "RPC-only table: deny direct reads"
  on public.public_category_popularity_snapshot;

drop policy if exists "RPC-only table: deny direct reads"
  on public.public_engagement_events;

drop policy if exists "RPC-only table: deny direct reads"
  on public.public_response_rate_events;

drop policy if exists "deny direct api access"
  on public.reporting_form_schema_fields;
drop policy if exists "RPC-only table: deny direct reads"
  on public.reporting_form_schema_fields;

drop policy if exists "deny direct api access"
  on public.reporting_form_schemas;
drop policy if exists "RPC-only table: deny direct reads"
  on public.reporting_form_schemas;

drop policy if exists "deny direct api access"
  on public.site_banners;
drop policy if exists "RPC-only table: deny direct reads"
  on public.site_banners;

commit;
