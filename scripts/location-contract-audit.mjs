import fs from 'node:fs';

const errors = [];
const read = (path) => fs.readFileSync(path, 'utf8');
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) errors.push(`${label}: missing ${needle}`);
};

const visitor = read('src/services/visitorSessionService.ts');
const appContext = read('src/context/AppContext.tsx');
const ipService = read('src/services/ipLocationService.ts');
const ipEdge = read('supabase/functions/public-ip-location/index.ts');
const reminder = read('src/components/location/LocationReminderBar.tsx');
const mapper = read('src/services/supabasePublicReportMapper.ts');
const bootstrap = read('supabase/migrations/20260919072614_canonical_bangladesh_location_taxonomy.sql');
const finalHardening = read('supabase/migrations/20260919082400_location_contract_final_hardening.sql');
const invokerHardening = read('supabase/migrations/20260919082649_location_admin_rpc_invoker_hardening.sql');

for (const needle of [
  'REPORTER_LOCATION_FALLBACK_MAX_AGE_MS = 5 * 60 * 1000',
  'Date.now() - lastRecordedLocation.timestamp <= REPORTER_LOCATION_FALLBACK_MAX_AGE_MS',
  'maximumAge: 0',
]) {
  requireText(visitor, needle, 'reporter location freshness');
}
const fallbackAgeChecks =
  visitor.match(/Date\.now\(\) - lastRecordedLocation\.timestamp <= REPORTER_LOCATION_FALLBACK_MAX_AGE_MS/g)?.length || 0;
if (fallbackAgeChecks !== 3) {
  errors.push(`reporter location freshness: expected 3 guarded fallback paths, found ${fallbackAgeChecks}`);
}

requireText(ipService, '/functions/v1/public-ip-location', 'first-party IP fallback');
if (ipService.includes('https://ipwho.is/')) {
  errors.push('first-party IP fallback: browser must not call ipwho.is directly');
}
for (const needle of [
  'x-forwarded-for',
  'cf-connecting-ip',
  'https://ipwho.is/',
  'accuracy: 25000',
]) {
  requireText(ipEdge, needle, 'IP fallback edge function');
}
for (const needle of [
  "choice === 'granted' && perm !== 'denied'",
  "browseFallback: 'ip'",
  "result.status !== 'denied'",
]) {
  requireText(appContext, needle, 'browse fallback consent boundary');
}

requireText(
  reminder,
  'আপনার কাছাকাছি কী ঘটছে আর আপনার এলাকার খবর দেখাতে লোকেশন চালু করুন।',
  'location reminder copy'
);
if (reminder.includes('খবরগুলো আগে দেখতে পারবেন') || reminder.includes('get local reports first')) {
  errors.push('location reminder copy: must not claim unverified feed priority');
}

for (const needle of ['safeBanglaFallback', 'safeEnglishFallback']) {
  requireText(mapper, needle, 'bilingual location mapper');
}

for (const needle of [
  'create table if not exists public.bangladesh_divisions',
  'create table if not exists public.bangladesh_districts',
  'create table if not exists public.bangladesh_upazilas',
  'create or replace function public.localize_district_name',
  'create or replace function public.build_public_location',
]) {
  requireText(bootstrap, needle, 'canonical location bootstrap migration');
}
for (const needle of [
  'admin_get_location_taxonomy',
  'admin_resolve_news_intake_location',
  'normalize_sourced_report_location_before_write',
  'trg_guard_sourced_report_schema_requirements',
  'revoke all privileges on function public.admin_get_location_taxonomy() from public, anon',
  'bangladesh_districts_division_id_idx',
]) {
  requireText(finalHardening, needle, 'final location hardening migration');
}
for (const needle of [
  'alter function public.admin_get_location_taxonomy() security invoker',
  'alter function public.admin_resolve_news_intake_location(text,text) security invoker',
  'from public, anon',
  'to authenticated, service_role',
]) {
  requireText(invokerHardening, needle, 'Admin location RPC invoker hardening');
}

if (errors.length) {
  console.error('Location contract audit failed:\n');
  for (const error of errors) console.error('- ' + error);
  process.exit(1);
}

console.log(
  'Location contract audit passed: device-only reporting, fresh submission fallback, consent-aware first-party IP fallback, bilingual rendering, canonical taxonomy, and SQL hardening are protected.'
);
