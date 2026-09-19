import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const failures = [];
const read = (relative) => fs.readFileSync(path.resolve(ROOT, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.resolve(ROOT, relative));
const requireFile = (relative) => {
  if (!exists(relative)) failures.push(`${relative}: required unified-form primitive is missing`);
};
const requireContains = (file, token, message) => {
  const source = read(file);
  if (!source.includes(token)) failures.push(`${file}: ${message}`);
};
const requireNotContains = (file, token, message) => {
  const source = read(file);
  if (source.includes(token)) failures.push(`${file}: ${message}`);
};

const primitives = [
  'src/components/ui/FormField.tsx',
  'src/components/ui/TextField.tsx',
  'src/components/ui/TextAreaField.tsx',
  'src/components/ui/DateField.tsx',
  'src/components/ui/TimeField.tsx',
  'src/components/ui/MonthField.tsx',
  'src/components/ui/NumberField.tsx',
  'src/components/ui/ContactField.tsx',
  'src/components/ui/Select.tsx',
  'src/components/ui/SearchableSelect.tsx',
  'src/components/ui/RadioGroup.tsx',
  'src/components/ui/Checkbox.tsx',
  'src/components/ui/Toggle.tsx',
  'src/components/ui/formSystem.ts',
  'src/components/ui/formValidation.ts',
];
primitives.forEach(requireFile);

const migratedDataEntryFiles = [
  'src/components/report-composer/Step3ComplaintDetails.tsx',
  'src/components/report-composer/ConfiguredFieldsSection.tsx',
  'src/components/report-composer/ReportTitleField.tsx',
  'src/components/report-composer/MobJusticeDetailsFields.tsx',
  'src/components/report-detail/SubjectResponseModal.tsx',
  'src/components/report-detail/CitizenActionModal.tsx',
];

for (const file of migratedDataEntryFiles) {
  for (const tag of ['<input', '<select', '<textarea']) {
    requireNotContains(
      file,
      tag,
      `migrated public data-entry surfaces must use shared form primitives instead of ${tag}`
    );
  }
  requireNotContains(file, 'min-h-[40px]', 'form controls must preserve the 44px minimum target');
  requireNotContains(file, 'min-h-[42px]', 'form controls must preserve the 44px minimum target');
}

requireContains(
  'src/components/ui/FormField.tsx',
  'id={labelId}',
  'shared field labels must expose a stable accessible id'
);
requireContains(
  'src/components/ui/FormField.tsx',
  'text-ui-error-text',
  'shared field errors must use the accessible semantic error text role'
);
requireContains(
  'src/components/ui/TextField.tsx',
  'aria-invalid={Boolean(error)}',
  'TextField must own invalid-state semantics'
);
requireContains(
  'src/components/ui/TextAreaField.tsx',
  'aria-invalid={Boolean(error)}',
  'TextAreaField must own invalid-state semantics'
);
requireContains(
  'src/components/ui/NumberField.tsx',
  '<TextField',
  'NumberField must inherit the shared text-field contract'
);
requireContains(
  'src/components/ui/ContactField.tsx',
  '<TextField',
  'ContactField must inherit the shared text-field contract'
);
requireContains(
  'src/components/ui/Select.tsx',
  '<FormField',
  'Select must use the shared field shell'
);
requireContains(
  'src/components/ui/SearchableSelect.tsx',
  '<FormField',
  'SearchableSelect must use the shared field shell'
);
requireContains(
  'src/components/ui/SearchableSelect.tsx',
  "'pr-16'",
  'clearable searchable selects must reserve space for the clear action'
);
requireContains(
  'src/components/ui/RadioGroup.tsx',
  'type-input',
  'radio choices must use the shared form input typography role'
);

requireContains(
  'src/components/report-detail/SubjectResponseModal.tsx',
  'noValidate',
  'Subject Response must use localized application validation instead of browser-native messages'
);
requireContains(
  'src/components/report-detail/CitizenActionModal.tsx',
  'noValidate',
  'Citizen Action must use localized application validation instead of browser-native messages'
);
for (const file of [
  'src/components/report-detail/SubjectResponseModal.tsx',
  'src/components/report-detail/CitizenActionModal.tsx',
  'src/components/report-composer/Step3ComplaintDetails.tsx',
]) {
  requireContains(
    file,
    'isValidEmailOrPhone',
    'email-or-phone fields must use the shared contact validator'
  );
}

requireContains(
  'src/components/location/AddressSearchInput.tsx',
  'onClear?.();',
  'clearing visible address search must notify the owning form'
);
requireContains(
  'src/components/report-composer/Step3ComplaintDetails.tsx',
  "placeId: undefined",
  'clearing an address search must clear stored place identity'
);
requireContains(
  'src/components/layout/SearchModal.tsx',
  '/search?q=',
  'global search submission must preserve the entered query'
);

const composer = read('src/components/report-composer/Step3ComplaintDetails.tsx');
if (!composer.includes('const currentMonthLocal = todayLocal.slice(0, 7);')) {
  failures.push('Step3ComplaintDetails.tsx: billing month maximum must be based on the current local month');
}
if (!composer.includes('formData.previousBillMonth >= formData.recentBillMonth')) {
  failures.push('Step3ComplaintDetails.tsx: previous billing month must be validated before recent billing month');
}
if (!composer.includes("formData.utilityEndTime.trim() === formData.incidentTime.trim()")) {
  failures.push('Step3ComplaintDetails.tsx: utility end-time validation must allow overnight incidents while rejecting equal times');
}
if (!composer.includes('This end time is treated as the following day.')) {
  failures.push('Step3ComplaintDetails.tsx: overnight time interpretation must be explained in the UI');
}

const configured = read('src/components/report-composer/ConfiguredFieldsSection.tsx');
if (configured.includes('role="alert" className="type-helper text-role-validation"')) {
  failures.push('ConfiguredFieldsSection.tsx: schema group errors must use the accessible semantic error text role');
}
for (const token of [
  "field.fieldType === 'evidence'",
  'pendingImages.length === 0',
  "field.fieldType === 'date'",
  "field.fieldType === 'time'",
  "field.fieldType === 'month'",
  '<RadioGroup',
  '<Checkbox',
  '<DateField',
  '<TimeField',
  '<MonthField',
  '<NumberField',
]) {
  if (!configured.includes(token)) {
    failures.push(`ConfiguredFieldsSection.tsx: missing schema form contract ${token}`);
  }
}

if (failures.length) {
  console.error(`Public form-system audit found ${failures.length} violation(s):`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(
  'Public form-system audit passed: unified primitives, validation, chronology, accessibility, and schema readiness are protected.'
);
