alter table public.complaints
  drop constraint if exists complaints_title_length_check;

alter table public.complaints
  add constraint complaints_title_length_check
  check (char_length(btrim(title)) between 1 and 100);

comment on constraint complaints_title_length_check on public.complaints is
  'Citizen-submitted report title must contain 1 to 100 characters after trimming. Historical rows are preserved; public and admin publication presentation remain separate.';
