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

if (!deployWorkflow.includes('group: pages-${{ github.event_name }}-${{ github.ref }}')) {
  fail('Deploy workflow does not isolate concurrency by event and ref');
}

if (!deployWorkflow.includes('cancel-in-progress: true')) {
  fail('Deploy workflow no longer cancels stale runs within the same release lane');
}

if (!deployWorkflow.includes("if: github.event_name == 'push' && github.ref == 'refs/heads/main'")) {
  fail('Production deploy is no longer restricted to pushes on main');
}

console.log(
  'Integration contract audit passed using ' + latestContractFile +
  '; harassment schema options and deploy concurrency are aligned.'
);
