import fs from 'node:fs';
import crypto from 'node:crypto';

const fail = (message) => {
  console.error('Security hardening audit failed: ' + message);
  process.exit(1);
};
const read = (path) => fs.readFileSync(path, 'utf8');

const html = read('index.html');
const csp = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1] || '';
if (!csp) fail('Content Security Policy meta is missing');

const scriptSrc = csp.match(/(?:^|;\s*)script-src\s+([^;]+)/i)?.[1] || '';
if (!scriptSrc || scriptSrc.includes("'unsafe-inline'")) {
  fail("script-src must exist and must not allow 'unsafe-inline'");
}
if (!/(?:^|;\s*)script-src-attr\s+'none'(?:;|$)/i.test(csp)) {
  fail("script-src-attr must be 'none'");
}
const connectSrc = csp.match(/(?:^|;\s*)connect-src\s+([^;]+)/i)?.[1] || '';
const connectTokens = connectSrc.trim().split(/\s+/);
if (connectTokens.includes('https:') || connectTokens.includes('wss:')) {
  fail('connect-src must not allow every HTTPS/WSS origin');
}

const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
for (const match of inlineScripts) {
  const hash = 'sha256-' + crypto.createHash('sha256').update(match[1], 'utf8').digest('base64');
  if (!scriptSrc.includes("'" + hash + "'")) {
    fail('inline script is missing an exact CSP hash: ' + hash);
  }
}
if (/\son[a-z]+\s*=/i.test(html)) {
  fail('inline event handler found in index.html');
}

const gateway = read('src/services/apiClient.ts');
const edgeGateway = read('supabase/functions/public-write-gateway/index.ts');
const engagement = read('src/services/publicEngagementService.ts');
const visit = read('src/services/visitorSessionService.ts');
for (const [name, source] of [['apiClient', gateway], ['publicEngagementService', engagement], ['visitorSessionService', visit]]) {
  if (!source.includes("public-write-gateway")) {
    fail(name + ' no longer routes public mutation traffic through public-write-gateway');
  }
}
if (gateway.includes("supabase.rpc('register_public_complaint_evidence'")) {
  fail('apiClient must not register evidence through a direct anonymous RPC');
}
for (const needle of [
  'action: "evidence"',
  '"evidence", "response"',
  'service.rpc("register_public_complaint_evidence"',
]) {
  if (!edgeGateway.includes(needle)) {
    fail('public-write-gateway evidence routing is missing: ' + needle);
  }
}

const ipLocation = read('supabase/functions/public-ip-location/index.ts');
for (const needle of [
  'service_assert_public_write_rate',
  'p_action: "ip_location"',
  'cf-connecting-ip',
  'SUPABASE_SERVICE_ROLE_KEY',
]) {
  if (!ipLocation.includes(needle)) fail('IP-location hardening is missing: ' + needle);
}
if (ipLocation.includes('x-forwarded-for')) {
  fail('IP-location function must not trust client-supplied X-Forwarded-For');
}

const migration = read('supabase/migrations/20260919155020_close_legacy_engagement_and_persist_ip_location_limit.sql');
const evidenceRateMigration = read('supabase/migrations/20260921164911_add_evidence_gateway_rate_limit.sql');
const evidenceConstraintMigration = read('supabase/migrations/20260921165245_allow_evidence_write_rate_event.sql');
const evidenceRevokeMigration = read('supabase/migrations/20260921170002_close_direct_public_evidence_registration.sql');
for (const needle of [
  'track_public_report_view_v2',
  'track_public_report_share_v2',
  'from public, anon, authenticated',
  "'ip_location'",
]) {
  if (!migration.includes(needle)) fail('final public security migration is missing: ' + needle);
}

for (const needle of ["'evidence'", "v_action='evidence'"]) {
  if (!evidenceRateMigration.includes(needle)) {
    fail('evidence gateway rate-limit migration is missing: ' + needle);
  }
}
if (!evidenceConstraintMigration.includes("'evidence'::text")) {
  fail('public write-rate action constraint does not include evidence');
}
for (const needle of [
  'register_public_complaint_evidence(text,text,text,bigint,text)',
  'from public, anon, authenticated',
  'to service_role',
]) {
  if (!evidenceRevokeMigration.includes(needle)) {
    fail('direct evidence registration closure is missing: ' + needle);
  }
}

const leastPrivilegeMigration = read('supabase/migrations/20260922100639_public_security_least_privilege_closeout.sql');
for (const needle of [
  'bangladesh_divisions',
  'sanitize_ride_sharing_complaint_party',
  'get_public_home_feed_with_engagement',
  'alter default privileges for role postgres in schema public',
]) {
  if (!leastPrivilegeMigration.includes(needle)) {
    fail('least-privilege closeout migration is missing: ' + needle);
  }
}

for (const needle of [
  'MAX_REQUEST_BYTES = 262_144',
  'await req.arrayBuffer()',
  'rawBody.byteLength > MAX_REQUEST_BYTES',
]) {
  if (!edgeGateway.includes(needle)) {
    fail('public-write-gateway hard body-size guard is missing: ' + needle);
  }
}

const evidenceIsolationMigration = read('supabase/migrations/20260922101337_public_evidence_storage_helper_isolation.sql');
for (const needle of [
  'private.can_upload_public_complaint_evidence',
  'private.is_published_complaint_evidence',
  'drop function public.can_upload_public_complaint_evidence',
  'drop function public.is_published_complaint_evidence',
]) {
  if (!evidenceIsolationMigration.includes(needle)) {
    fail('private evidence-policy helper isolation is missing: ' + needle);
  }
}

const sessionRaceMigration = read('supabase/migrations/20260922110131_close_remaining_auth_session_and_rate_races.sql');
for (const needle of [
  'private.is_current_auth_session_valid',
  'auth.sessions',
  'public-evidence-upload:',
  'response:visitor:',
  'engagement:report:',
  'pg_advisory_xact_lock',
]) {
  if (!sessionRaceMigration.includes(needle)) {
    fail('session/race hardening migration is missing: ' + needle);
  }
}

const sensitiveReadMigration = read('supabase/migrations/20260922110302_require_aal2_for_sensitive_private_reads.sql');
for (const needle of [
  'complaints.evidence_view',
  'complaints.export',
  'location_activity.view',
  'AAL2 authentication is required for private reporter device telemetry',
]) {
  if (!sensitiveReadMigration.includes(needle)) {
    fail('sensitive private-read AAL2 hardening is missing: ' + needle);
  }
}

const evidenceUpload = read('supabase/functions/public-evidence-upload/index.ts');
const evidenceSanitizer = read('supabase/functions/_shared/webp-sanitizer.js');
for (const needle of [
  'sanitizeEvidenceWebP',
  'service_assert_public_write_rate',
  'register_public_complaint_evidence',
  'metadataChunksRemoved',
]) {
  if (!evidenceUpload.includes(needle)) {
    fail('server-trusted evidence upload boundary is missing: ' + needle);
  }
}
for (const needle of ['EXIF', 'XMP ', 'ICCP', 'ANIM', 'ANMF', 'removedChunks']) {
  if (!evidenceSanitizer.includes(needle)) {
    fail('WebP metadata sanitization guard is missing: ' + needle);
  }
}
if (!gateway.includes("public-evidence-upload")) {
  fail('apiClient must route public evidence through public-evidence-upload');
}
if (gateway.includes(".from('complaint-evidence')") && gateway.includes('.upload(')) {
  fail('browser must not upload complaint evidence directly to Storage');
}

const reporterPrivacyMigration = read('supabase/migrations/20260925012634_privacy_minimize_reporter_device_context.sql');
for (const needle of [
  'scrub_reporter_context_after_moderation',
  'prune_reporter_submission_contexts',
  "interval '7 days'",
  "interval '24 hours'",
]) {
  if (!reporterPrivacyMigration.includes(needle)) {
    fail('reporter telemetry minimization migration is missing: ' + needle);
  }
}

if (html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com')) {
  fail('visitor-facing Google Fonts dependency must remain removed');
}
if (!html.includes('/fonts/fonts.css')) {
  fail('same-origin font stylesheet is missing');
}
if (!fs.existsSync('scripts/vendor-fonts.mjs')) {
  fail('same-origin font vendor script is missing');
}
if (!fs.existsSync('public/.well-known/security.txt')) {
  fail('security.txt is missing');
}

const popularityReadMigration = read('supabase/migrations/20260925050040_separate_category_popularity_snapshot_refresh.sql');
for (const needle of [
  'private.refresh_public_category_popularity_snapshot',
  'create or replace function public.get_public_category_popularity()',
  "language sql",
  "stable",
  "refresh-public-category-popularity-snapshot",
]) {
  if (!popularityReadMigration.includes(needle)) {
    fail('read-only category popularity split is missing: ' + needle);
  }
}

const adminHelperMigration = read('supabase/migrations/20260925145914_harden_admin_authorization_helper_surface.sql');
for (const needle of [
  'private.is_current_auth_session_valid',
  'admin_get_my_authorization_context',
  'get_caller_effective_permission_set',
  'can_manage_role_scope',
  'revoke execute on function public.get_caller_effective_permission_set()',
  'revoke execute on function public.can_manage_role_scope(text)',
]) {
  if (!adminHelperMigration.includes(needle)) {
    fail('admin authorization helper hardening is missing: ' + needle);
  }
}

const privacyPage = read('src/pages/MorePage.tsx');
if (!privacyPage.includes('IPWho (ipwho.is)')) {
  fail('approximate-location third-party disclosure is missing');
}

const ciWorkflow = read('.github/workflows/ci.yml');
for (const needle of ['playwright@1.63.0', '@axe-core/playwright@4.13.0']) {
  if (!ciWorkflow.includes(needle)) {
    fail('CI browser security tooling is not pinned to the audited stable version: ' + needle);
  }
}

console.log('Security hardening audit passed: public writes are gateway-bound, direct evidence registration is revoked, legacy engagement RPCs are revoked, IP-location has persistent throttling, and CSP inline scripts are hash-locked.');
