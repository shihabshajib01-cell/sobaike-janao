-- Keep storage policy helpers out of the exposed public API schema.

create or replace function private.can_upload_public_complaint_evidence(p_storage_path text)
returns boolean
language plpgsql
stable
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

  v_prefix := 'public-submissions/' || v_client_submission_id || '/';

  select count(*)
  into v_existing_count
  from storage.objects o
  where o.bucket_id = 'complaint-evidence'
    and o.name like v_prefix || '%';

  return v_existing_count < 6;
end;
$$;

create or replace function private.is_published_complaint_evidence(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = 'pg_catalog', 'pg_temp'
as $$
  select exists (
    select 1
    from public.complaint_evidence e
    join public.complaints c
      on c.id = e.complaint_id
    where e.storage_path = p_storage_path
      and c.status = 'published'
  );
$$;

grant usage on schema private to anon, authenticated;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.can_upload_public_complaint_evidence(text) to anon, authenticated;
grant execute on function private.is_published_complaint_evidence(text) to anon, authenticated;

alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

alter policy "public complaint evidence upload"
  on storage.objects
  with check (
    bucket_id = 'complaint-evidence'::text
    and lower(storage.extension(name)) = 'webp'::text
    and private.can_upload_public_complaint_evidence(name)
  );

alter policy "published complaint evidence read"
  on storage.objects
  using (
    bucket_id = 'complaint-evidence'::text
    and private.is_published_complaint_evidence(name)
  );

drop function public.can_upload_public_complaint_evidence(text);
drop function public.is_published_complaint_evidence(text);
