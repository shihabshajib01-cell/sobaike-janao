import fs from 'node:fs';

const failures = [];
const checks = [];

const read = (path) => fs.readFileSync(path, 'utf8');
const pass = (name) => checks.push({ name, ok: true });
const fail = (name, detail) => {
  checks.push({ name, ok: false, detail });
  failures.push(`${name}: ${detail}`);
};
const requireContains = (name, source, value) =>
  source.includes(value) ? pass(name) : fail(name, `Missing ${value}`);
const requireNotContains = (name, source, value) =>
  !source.includes(value) ? pass(name) : fail(name, `Unexpected ${value}`);

const appShell = read('src/components/layout/AppShell.tsx');
const dialogs = read('src/components/ui/useDialogLifecycle.ts');
const toggle = read('src/components/ui/Toggle.tsx');
const theme = read('src/components/ui/ThemeSelector.tsx');
const media = read('src/components/media/ReportMediaGrid.tsx');
const card = read('src/components/report/ReportCard.tsx');
const upload = read('src/components/media/ImageAttachmentPicker.tsx');
const address = read('src/components/location/AddressSearchInput.tsx');
const composerHeader = read('src/components/report-composer/ReportComposerHeader.tsx');
const step3 = read('src/components/report-composer/Step3ComplaintDetails.tsx');
const configured = read('src/components/report-composer/ConfiguredFieldsSection.tsx');
const bottomNav = read('src/components/layout/BottomNav.tsx');
const desktopRail = read('src/components/layout/DesktopLeftRail.tsx');
const header = read('src/components/layout/Header.tsx');
const issues = read('src/pages/IssuesPage.tsx');
const css = read('src/index.css');

requireContains('SPA route changes move focus to main content', appShell, "document.getElementById('main-content')?.focus");
requireContains('Dialogs inert the application root', dialogs, "document.getElementById('root')");
requireContains('Switches use aria-labelledby', toggle, 'aria-labelledby={labelId}');
requireContains('Switches use aria-describedby', toggle, 'aria-describedby={descriptionId}');
requireNotContains('Theme compact selector avoids incomplete listbox semantics', theme, 'role="listbox"');
requireNotContains('Theme choices avoid incomplete radio composite semantics', theme, 'role="radio"');
requireContains('Report media cells use native buttons', media, '<button\n        key={img.id}');
requireNotContains('Report cards avoid fake link role', card, 'role="link"');
requireContains('Report cards expose a real Link', card, '<Link');
requireContains('Upload errors are live alerts', upload, 'role="alert" aria-live="assertive"');
requireContains('Upload progress is a polite status', upload, 'role="status" aria-live="polite"');
requireContains('Address search exposes a live status', address, 'role="status" aria-live="polite"');
requireContains('Composer step changes move focus', composerHeader, 'stepStatusRef.current?.focus');
requireContains('Composer step state is announced', composerHeader, 'aria-live="polite"');
requireContains('Configured fields expose aria-invalid', configured, 'aria-invalid={Boolean(error)}');
requireContains('Configured fields expose aria-describedby', configured, 'aria-describedby={error ? fieldErrorId');
requireContains('Configured validation focuses the first invalid control', configured, '(directControl || fallbackControl)?.focus');
requireContains('Legacy report controls expose aria-invalid', step3, 'aria-invalid={Boolean(errors.description)}');
requireContains('Legacy report controls connect error descriptions', step3, "aria-describedby={errors.description ? 'complaint-desc-input-error' : undefined}");
requireContains('Legacy validation focuses first invalid control', step3, "document.getElementById(first)?.focus");
requireContains('Mobile primary navigation uses links', bottomNav, '<Link');
requireContains('Desktop primary navigation uses links', desktopRail, '<Link');
requireContains('Tablet navigation uses links', header, '<Link');
requireContains('Issue category destinations use links', issues, '<Link');
requireContains('Reduced motion preference is respected', css, '@media (prefers-reduced-motion: reduce)');

const failed = checks.filter((check) => !check.ok);
console.log(`Accessibility source audit: ${checks.length - failed.length}/${checks.length} checks passed`);
for (const check of failed) {
  console.error(`FAIL: ${check.name} — ${check.detail}`);
}
if (failures.length > 0) process.exit(1);
