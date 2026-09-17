alter table public.complaints
  drop constraint if exists complaints_title_en_length_check;

alter table public.complaints
  add constraint complaints_title_en_length_check
  check (title_en is null or char_length(btrim(title_en)) between 1 and 100);

comment on constraint complaints_title_en_length_check on public.complaints is
  'Admin-edited English raw complaint title must be null or contain 1 to 100 characters after trimming, matching the canonical raw-title contract.';
