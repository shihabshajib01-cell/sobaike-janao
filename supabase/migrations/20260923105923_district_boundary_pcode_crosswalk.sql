-- 64 verified ADM2 P-codes, keyed to the EXISTING canonical district IDs.
-- Source: uploaded Bangladesh 2020 district boundaries; independent DGHS reference:
-- https://gis.dghs.gov.bd/server/rest/services/Hosted/bgd_admbnda_adm2_bbs_20201113/FeatureServer/0
-- This is an additive geography lookup only: no report permissions, status logic or API behavior changes.
ALTER TABLE public.bangladesh_districts ADD COLUMN IF NOT EXISTS adm2_pcode text;
CREATE TEMP TABLE _district_boundary_crosswalk (district_id text PRIMARY KEY, adm2_pcode text UNIQUE NOT NULL) ON COMMIT DROP;
INSERT INTO _district_boundary_crosswalk(district_id, adm2_pcode) VALUES
  ('bagerhat', 'BD4001'),
  ('bandarban', 'BD2003'),
  ('barguna', 'BD1004'),
  ('barishal', 'BD1006'),
  ('bhola', 'BD1009'),
  ('bogra', 'BD5010'),
  ('brahmanbaria', 'BD2012'),
  ('chandpur', 'BD2013'),
  ('chapainawabganj', 'BD5070'),
  ('chattogram', 'BD2015'),
  ('chuadanga', 'BD4018'),
  ('coxsbazar', 'BD2022'),
  ('cumilla', 'BD2019'),
  ('dhaka', 'BD3026'),
  ('dinajpur', 'BD5527'),
  ('faridpur', 'BD3029'),
  ('feni', 'BD2030'),
  ('gaibandha', 'BD5532'),
  ('gazipur', 'BD3033'),
  ('gopalganj', 'BD3035'),
  ('habiganj', 'BD6036'),
  ('jamalpur', 'BD4539'),
  ('jashore', 'BD4041'),
  ('jhalokati', 'BD1042'),
  ('jhenaidah', 'BD4044'),
  ('joypurhat', 'BD5038'),
  ('khagrachhari', 'BD2046'),
  ('khulna', 'BD4047'),
  ('kishoreganj', 'BD3048'),
  ('kurigram', 'BD5549'),
  ('kushtia', 'BD4050'),
  ('lakshmipur', 'BD2051'),
  ('lalmonirhat', 'BD5552'),
  ('madaripur', 'BD3054'),
  ('magura', 'BD4055'),
  ('manikganj', 'BD3056'),
  ('meherpur', 'BD4057'),
  ('moulvibazar', 'BD6058'),
  ('munshiganj', 'BD3059'),
  ('mymensingh', 'BD4561'),
  ('naogaon', 'BD5064'),
  ('narail', 'BD4065'),
  ('narayanganj', 'BD3067'),
  ('narsingdi', 'BD3068'),
  ('natore', 'BD5069'),
  ('netrokona', 'BD4572'),
  ('nilphamari', 'BD5573'),
  ('noakhali', 'BD2075'),
  ('pabna', 'BD5076'),
  ('panchagarh', 'BD5577'),
  ('patuakhali', 'BD1078'),
  ('pirojpur', 'BD1079'),
  ('rajbari', 'BD3082'),
  ('rajshahi', 'BD5081'),
  ('rangamati', 'BD2084'),
  ('rangpur', 'BD5585'),
  ('satkhira', 'BD4087'),
  ('shariatpur', 'BD3086'),
  ('sherpur', 'BD4589'),
  ('sirajganj', 'BD5088'),
  ('sunamganj', 'BD6090'),
  ('sylhet', 'BD6091'),
  ('tangail', 'BD3093'),
  ('thakurgaon', 'BD5594');
DO $validation$
BEGIN
  IF (SELECT count(*) FROM _district_boundary_crosswalk) <> 64
     OR (SELECT count(*) FROM public.bangladesh_districts) <> 64
     OR EXISTS (SELECT 1 FROM _district_boundary_crosswalk x LEFT JOIN public.bangladesh_districts d ON d.id=x.district_id WHERE d.id IS NULL)
     OR EXISTS (SELECT 1 FROM public.bangladesh_districts d LEFT JOIN _district_boundary_crosswalk x ON x.district_id=d.id WHERE x.district_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.bangladesh_districts d JOIN _district_boundary_crosswalk x ON x.district_id=d.id WHERE d.adm2_pcode IS NOT NULL AND d.adm2_pcode <> x.adm2_pcode)
  THEN RAISE EXCEPTION 'Canonical 64-district ADM2 mapping is inconsistent; migration aborted'; END IF;
END;
$validation$;
UPDATE public.bangladesh_districts d
SET adm2_pcode = x.adm2_pcode
FROM _district_boundary_crosswalk x
WHERE d.id=x.district_id AND d.adm2_pcode IS DISTINCT FROM x.adm2_pcode;
CREATE UNIQUE INDEX IF NOT EXISTS bangladesh_districts_adm2_pcode_unique ON public.bangladesh_districts(adm2_pcode);
DO $validation$ BEGIN
  IF EXISTS (SELECT 1 FROM public.bangladesh_districts WHERE adm2_pcode IS NULL)
     OR (SELECT count(DISTINCT adm2_pcode) FROM public.bangladesh_districts) <> 64
  THEN RAISE EXCEPTION 'District P-code mapping did not cover 64 districts'; END IF;
END $validation$;
COMMENT ON COLUMN public.bangladesh_districts.adm2_pcode IS 'Bangladesh ADM2 P-code crosswalk for 2020 district geography; exact canonical district ID remains primary lookup';
