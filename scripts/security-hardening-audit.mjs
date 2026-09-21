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
for (const needle of [
  'track_public_report_view_v2',
  'track_public_report_share_v2',
  'from public, anon, authenticated',
  "'ip_location'",
]) {
  if (!migration.includes(needle)) fail('final public security migration is missing: ' + needle);
}

console.log('Security hardening audit passed: public writes are gateway-bound, legacy engagement RPCs are revoked, IP-location has persistent throttling, and CSP inline scripts are hash-locked.');
