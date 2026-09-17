create or replace function public.get_public_report_engagement_counts()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'viewCount', c.public_view_count,
        'shareCount', c.public_share_count
      ) order by c.created_at desc, c.id desc
    ),
    '[]'::jsonb
  )
  from public.complaints as c
  where c.status = 'published';
$$;

revoke execute on function public.get_public_report_engagement_counts() from public;
revoke execute on function public.get_public_report_engagement_counts() from anon, authenticated;
grant execute on function public.get_public_report_engagement_counts() to anon, authenticated;

revoke execute on function public.track_public_report_view(text) from public;
revoke execute on function public.track_public_report_view(text) from anon, authenticated;
grant execute on function public.track_public_report_view(text) to anon, authenticated;

revoke execute on function public.track_public_report_share(text) from public;
revoke execute on function public.track_public_report_share(text) from anon, authenticated;
grant execute on function public.track_public_report_share(text) to anon, authenticated;
