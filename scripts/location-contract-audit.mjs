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
const consentModal = read('src/components/location/LocationConsentModal.tsx');
const homePage = read('src/pages/HomePage.tsx');
const morePage = read('src/pages/MorePage.tsx');
const mapper = read('src/services/supabasePublicReportMapper.ts');
const bootstrap = read('supabase/migrations/20260919072614_canonical_bangladesh_location_taxonomy.sql');
const finalHardening = read('supabase/migrations/20260919082400_location_contract_final_hardening.sql');
const invokerHardening = read('supabase/migrations/20260919082649_location_admin_rpc_invoker_hardening.sql');

const productionLocationMigrationHistory = [
  '20260919072614_canonical_bangladesh_location_taxonomy.sql',
  '20260919072717_unify_location_contract_and_sourced_validation.sql',
  '20260919072751_public_bilingual_location_payload_and_filter.sql',
  '20260919073124_fix_public_published_reports_json_build_limit.sql',
  '20260919073144_block_invalid_sourced_location_publish.sql',
  '20260919073421_include_full_location_in_sourced_schema_guard.sql',
  '20260919073522_canonical_location_aliases_for_historical_data.sql',
  '20260919073554_canonical_location_aliases_for_bangla_sadar_variants.sql',
  '20260919073603_repair_ambiguous_historical_sourced_locations.sql',
  '20260919073650_repair_two_automated_district_only_reports_from_verified_sources.sql',
  '20260919073658_normalize_all_report_admin_locations_to_canonical_names_v2.sql',
  '20260919073753_optimize_public_location_localization_helpers.sql',
  '20260919073809_optimize_public_home_feed_location_resolution.sql',
  '20260919073816_optimize_public_published_reports_location_resolution.sql',
  '20260919074020_optimize_public_published_report_location_resolution.sql',
  '20260919074049_split_public_report_json_payload_under_postgres_argument_limit.sql',
  '20260919074156_backfill_sourced_report_location_scope_and_source_language.sql',
  '20260919074424_harden_news_intake_location_resolution_order_and_boundaries.sql',
  '20260919074513_detect_multi_location_news_before_feed_ready_creation.sql',
  '20260919074623_support_bangla_inflected_locations_and_safe_multi_location_detection.sql',
  '20260919074704_fix_bangla_location_suffix_matching_without_substring_collisions.sql',
  '20260919082400_location_contract_final_hardening.sql',
  '20260919082649_location_admin_rpc_invoker_hardening.sql',
];
for (const filename of productionLocationMigrationHistory) {
  const migrationPath = `supabase/migrations/${filename}`;
  if (!fs.existsSync(migrationPath)) {
    errors.push(`production migration history: missing ${filename}`);
  }
}

for (const needle of [
  'REPORTER_LOCATION_FALLBACK_MAX_AGE_MS = 5 * 60 * 1000',
  'Date.now() - lastRecordedLocation.timestamp <= REPORTER_LOCATION_FALLBACK_MAX_AGE_MS',
  'maximumAge: 0',
  "this.setLocationChoice('not_now')",
  "export type LocationChoice = 'granted' | 'not_now' | 'denied' | 'ip_fallback';",
  "export type BrowseLocationRequestMode =",
  "'restore'",
  "'permission_upgrade'",
  "'user_request'",
  'browseIntentVersion',
  'invalidateBrowseLocationRequests()',
  'requestIntentVersion !== browseIntentVersion',
  "this.getLocationChoice() !== 'granted'",
  "this.setLocationChoice('denied')",
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
  'cf-connecting-ip',
  'x-real-ip',
  'Do not fall back to client-supplied X-Forwarded-For.',
  'service_assert_public_write_rate',
  'p_action: "ip_location"',
  'https://ipwho.is/',
  'accuracy: 25000',
]) {
  requireText(ipEdge, needle, 'IP fallback edge function');
}
if (ipEdge.includes('req.headers.get("x-forwarded-for")') || ipEdge.includes("req.headers.get('x-forwarded-for')")) {
  errors.push('IP fallback edge function: must not trust client-supplied x-forwarded-for directly');
}
for (const needle of [
  "if (choice === 'not_now')",
  "{ mode: requestMode }",
  "choice === 'ip_fallback'",
  "VisitorSessionService.setLocationChoice('ip_fallback')",
  "browseFallback: 'ip'",
  "IP_LOCATION_MAX_AGE_MS",
  "BROWSE_LOCATION_MAX_AGE_MS",
  "useApproximateBrowseLocation",
  "choice === 'granted'",
  "Report submission may capture a device position",
  "void refreshBrowseLocation();",
]) {
  requireText(appContext, needle, 'browse fallback consent boundary');
}
if (
  appContext.indexOf("if (choice === 'not_now')") >
  appContext.indexOf("queryPermissionStatus()")
) {
  errors.push('browse fallback consent boundary: Not now must be resolved before browser permission/device lookup');
}

if (consentModal.includes("VisitorSessionService.setLocationChoice('granted');")) {
  errors.push('browse fallback consent boundary: modal must not persist a grant before browser approval');
}

requireText(
  reminder,
  'আপনার কাছাকাছি কী ঘটছে আর আপনার এলাকার খবর দেখাতে লোকেশন চালু করুন।',
  'location reminder copy'
);
if (reminder.includes('খবরগুলো আগে দেখতে পারবেন') || reminder.includes('get local reports first')) {
  errors.push('location reminder copy: must not claim unverified feed priority');
}

for (const needle of [
  'VisitorSessionService.getLocationChoice()',
  'hasAnsweredLocationPrompt',
  'locationChoice !== null',
]) {
  requireText(reminder, needle, 'location reminder refresh suppression');
}

for (const needle of [
  'chooseApproximateBrowseLocation',
  'VisitorSessionService.handleNotNow()',
  '.then(() => refreshBrowseLocation())',
  'এখন নয় চাপলে কাছাকাছি এলাকা ধরে খবর দেখানো হবে।',
  'If you choose Not now, we’ll still use a rough area for local reports.',
]) {
  requireText(consentModal, needle, 'Not now/Escape parity');
}
if (consentModal.includes('disabled: isLoading')) {
  errors.push('Not now/Escape parity: Not now must remain available while GPS is pending');
}

for (const needle of [
  'location-preference-card',
  'location-preference-use-precise',
  'location-preference-use-approximate',
  "openLocationConsent('browse')",
  'useApproximateBrowseLocation',
]) {
  requireText(morePage, needle, 'reversible location preference');
}

for (const needle of [
  "window.addEventListener('online', handleOnline)",
  'browseLocationStatus !== \'available\'',
  'browseLocationStatus !== \'requesting\'',
  '60_000',
]) {
  requireText(appContext, needle, 'approximate location recovery');
}

for (const needle of [
  'export const IP_LOCATION_MAX_AGE_MS = 60 * 60 * 1000',
  'isLocationFresh(location: ApproximateIpLocation | null)',
]) {
  requireText(ipService, needle, 'IP location freshness');
}

if (homePage.includes('VisitorSessionService.isLocationFresh(browseLocation)')) {
  errors.push('browse location freshness: Home must not apply device TTL to IP location');
}
requireText(
  homePage,
  'AppContext owns source-aware freshness for both device and IP',
  'browse location freshness'
);

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
  'Location contract audit passed: browse intent versioning blocks stale GPS callbacks, explicit restore/permission-upgrade/user-request modes are enforced, Not now/Escape remains authoritative, location preference is reversible, reporter GPS cannot override approximate browsing, source-aware freshness is centralized, and report submission remains device-only.'
);
