import fs from 'node:fs';

const fail = (message) => {
  console.error('Integration contract audit failed: ' + message);
  process.exit(1);
};

const read = (path) => fs.readFileSync(path, 'utf8');
const classification = read('src/data/harassmentClassification.ts');

const extractOptionValues = (exportName) => {
  const start = classification.indexOf('export const ' + exportName);
  if (start < 0) fail('missing ' + exportName);

  const end = classification.indexOf('];', start);
  if (end < 0) fail('unterminated ' + exportName);

  return [...classification.slice(start, end).matchAll(/value:\s*'([^']+)'/g)].map(
    (match) => match[1]
  );
};

const sourceContracts = {
  age: extractOptionValues('HARASSMENT_AGE_GROUP_OPTIONS'),
  relationship: extractOptionValues('HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS'),
  reporting_for: extractOptionValues('HARASSMENT_REPORTING_FOR_OPTIONS'),
};

const migrationFiles = fs
  .readdirSync('supabase/migrations')
  .filter((file) => file.endsWith('.sql'))
  .sort();

const contractMigrations = migrationFiles.filter((file) =>
  read('supabase/migrations/' + file).includes('HARASSMENT_SCHEMA_OPTION_CONTRACT age=')
);

if (contractMigrations.length === 0) {
  fail('missing harassment schema option contract migration');
}

const latestContractFile = contractMigrations.at(-1);
const latestContract = read('supabase/migrations/' + latestContractFile);

const extractContractLine = (key) => {
  const match = latestContract.match(
    new RegExp('HARASSMENT_SCHEMA_OPTION_CONTRACT ' + key + '=([^\\n\\r]+)')
  );
  if (!match) fail('missing ' + key + ' contract in ' + latestContractFile);
  return match[1].split(',').map((value) => value.trim()).filter(Boolean);
};

for (const [key, sourceValues] of Object.entries(sourceContracts)) {
  const migrationValues = extractContractLine(key);

  if (JSON.stringify(sourceValues) !== JSON.stringify(migrationValues)) {
    fail(
      key + ' option mismatch between Public classification and ' + latestContractFile +
      ': source=' + JSON.stringify(sourceValues) +
      ' migration=' + JSON.stringify(migrationValues)
    );
  }
}

const deployWorkflow = read('.github/workflows/deploy.yml');
if (deployWorkflow.includes("group: 'pages'") || deployWorkflow.includes('group: "pages"')) {
  fail('Deploy workflow still uses one global pages concurrency group');
}

if (!deployWorkflow.includes('group: pages-${{ github.ref }}')) {
  fail('Deploy workflow does not serialize production-capable events by ref');
}
if (deployWorkflow.includes('group: pages-${{ github.event_name }}-${{ github.ref }}')) {
  fail('Deploy workflow splits production-capable events into separate concurrency lanes');
}

if (!deployWorkflow.includes('cancel-in-progress: true')) {
  fail('Deploy workflow no longer cancels stale runs within the same release lane');
}

for (const needle of [
  "github.ref == 'refs/heads/main'",
  "github.event_name == 'push'",
  "github.event_name == 'workflow_dispatch'",
  "github.event_name == 'schedule'",
]) {
  if (!deployWorkflow.includes(needle)) {
    fail('Production deploy event/ref guard is missing: ' + needle);
  }
}
if (!deployWorkflow.includes("if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'")) {
  fail('Exact-revision CI gate no longer covers all main-branch production-capable events');
}

const seoFreshnessWorkflow = read('.github/workflows/seo-freshness-watch.yml');
for (const needle of [
  "cron: '2-57/5 * * * *'",
  'actions: write',
  'group: seo-freshness-watch-production',
  'cancel-in-progress: true',
  'get_public_home_feed_page',
  'public-report-routes.json',
  'manifest?.reports',
  'changed_count',
  'removed_count',
  'actions/workflows/deploy.yml/runs?branch=main',
  'actions/workflows/deploy.yml/dispatches',
  '"ref":"main"',
]) {
  if (!seoFreshnessWorkflow.includes(needle)) {
    fail('SEO freshness watcher is missing required production guard: ' + needle);
  }
}

for (const needle of [
  'actions: read',
  'Require successful CI for exact revision',
  'TARGET_SHA: ${{ github.sha }}',
  'actions/runs?head_sha=${TARGET_SHA}&event=push',
  "run.get('name') == 'CI'",
  "conclusion == 'success'",
  'ref: ${{ github.sha }}',
  'needs: build',
]) {
  if (!deployWorkflow.includes(needle)) {
    fail('Production deploy is missing exact-revision CI gate: ' + needle);
  }
}

const ciWorkflow = read('.github/workflows/ci.yml');
for (const [workflowName, workflowSource] of [
  ['CI', ciWorkflow],
  ['Deploy', deployWorkflow],
]) {
  for (const needle of [
    'Category theme propagation audit',
    'npm run audit:category-theme',
  ]) {
    if (!workflowSource.includes(needle)) {
      fail(workflowName + ' workflow is missing category-theme regression gate: ' + needle);
    }
  }
}


const syncMigrationFile = 'supabase/migrations/20260919142507_end_to_end_sync_contract_and_rls_hardening.sql';
if (!fs.existsSync(syncMigrationFile)) {
  fail('missing canonical Public-SQL-Admin sync migration');
}
const syncMigration = read(syncMigrationFile);
for (const needle of [
  'get_platform_sync_contract_version',
  '2026-09-19.1',
  'RPC-only table: deny direct reads',
]) {
  if (!syncMigration.includes(needle)) {
    fail('sync migration is missing contract hardening marker: ' + needle);
  }
}

const productionSmoke = read('.github/workflows/production-smoke.yml');
for (const needle of [
  'Verify Public-SQL-Admin sync contract',
  'get_platform_sync_contract_version',
  '2026-09-19.3',
]) {
  if (!productionSmoke.includes(needle)) {
    fail('production smoke is missing live sync-contract guard: ' + needle);
  }
}

const functionalSmoke = read('.github/workflows/public-functional-smoke.yml');
for (const needle of [
  'Checkout exact deployed commit',
  "ref: ${{ github.event.workflow_run.head_sha || github.sha }}",
  'branches: [main]',
  'group: public-functional-smoke-production',
  'cancel-in-progress: true',
]) {
  if (!functionalSmoke.includes(needle)) {
    fail('Public functional smoke production-safety guard is missing: ' + needle);
  }
}

const functionalSmokeScript = read('scripts/public-functional-smoke.mjs');
for (const needle of [
  "**/functions/v1/public-write-gateway",
  "JSON.stringify({ success: true, result: null })",
]) {
  if (!functionalSmokeScript.includes(needle)) {
    fail('Public functional smoke must not write repeatedly to the live gateway: ' + needle);
  }
}

for (const needle of [
  'branches: [main]',
  'group: production-smoke-live',
  'cancel-in-progress: true',
  'get_public_home_feed_page',
]) {
  if (!productionSmoke.includes(needle)) {
    fail('Production smoke load-safety guard is missing: ' + needle);
  }
}


const seoBuilder = read('scripts/build-seo-assets.mjs');
for (const needle of [
  "rpc/get_public_home_feed_page",
  "p_offset",
  "p_limit",
  "Paginated public feed returned an invalid nextOffset.",
]) {
  if (!seoBuilder.includes(needle)) {
    fail('SEO sitemap builder is missing paginated report-source guard: ' + needle);
  }
}
if (seoBuilder.includes("rpc/get_public_published_reports")) {
  fail('SEO sitemap builder must not use the unbounded published-reports RPC');
}
if (!seoBuilder.includes("throw error;")) {
  fail('SEO sitemap builder must fail closed when a credentialed report fetch fails');
}
for (const needle of [
  'public-report-routes.json',
  'reportRouteManifest',
  'reportIds',
  'reports: reportRouteRecords',
  'modifiedAt: page.modifiedAt || page.publishedAt || null',
  'indexable: page.sitemap === true',
]) {
  if (!seoBuilder.includes(needle)) {
    fail('SEO builder is missing report route manifest contract: ' + needle);
  }
}
if (!deployWorkflow.includes('test -f dist/public-report-routes.json')) {
  fail('Deploy workflow does not require the generated report route manifest');
}

const paginatedFreshnessMigration =
  'supabase/migrations/20260922020910_add_updated_at_to_public_home_feed_page.sql';
if (!fs.existsSync(paginatedFreshnessMigration)) {
  fail('missing paginated Public feed freshness migration');
}
const paginatedFreshnessSql = read(paginatedFreshnessMigration);
for (const needle of [
  'c.updated_at as updated_at',
  "'updatedAt'",
  'get_public_home_feed_page',
]) {
  if (!paginatedFreshnessSql.includes(needle)) {
    fail('paginated Public feed freshness migration is missing: ' + needle);
  }
}


const formPrepublicationAuditCorrectionFile =
  'supabase/migrations/20260919162702_restore_prepublication_after_lifecycle_audit.sql';
if (!fs.existsSync(formPrepublicationAuditCorrectionFile)) {
  fail('missing audit correction that preserves reporting-form prepublication');
}
const formPrepublicationAuditCorrection = read(formPrepublicationAuditCorrectionFile);
for (const needle of [
  'trg_guard_reporting_form_active_taxonomy',
  'trg_archive_reporting_forms_on_subcategory_deactivate',
  "scope_id='bribe-paid'",
  '2026-09-19.3',
]) {
  if (!formPrepublicationAuditCorrection.includes(needle)) {
    fail('reporting-form audit correction is missing: ' + needle);
  }
}

const formPrepublicationRestoreFile = 'supabase/migrations/20260919154219_restore_reporting_form_prepublication_contract.sql';
if (!fs.existsSync(formPrepublicationRestoreFile)) {
  fail('missing reporting-form prepublication contract correction');
}
const formPrepublicationRestore = read(formPrepublicationRestoreFile);
for (const needle of [
  'trg_enforce_reporting_form_active_taxonomy',
  'archive_reporting_forms_for_inactive_taxonomy',
  "scope_id='bribe-paid'",
  "status='published'",
]) {
  if (!formPrepublicationRestore.includes(needle)) {
    fail('reporting-form prepublication correction is missing: ' + needle);
  }
}

for (const needle of [
  'Verify public reporting configuration exposure contract',
  'get_public_reporting_configuration',
]) {
  if (!productionSmoke.includes(needle)) {
    fail('production smoke is missing reporting-config exposure guard: ' + needle);
  }
}

console.log(
  'Integration contract audit passed using ' + latestContractFile +
  '; harassment schema options and production deployment safety are aligned.'
);
