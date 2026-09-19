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
const textSizeSelector = read('src/components/ui/TextSizeSelector.tsx');
const textSizeContext = read('src/context/TextSizeContext.tsx');
const app = read('src/App.tsx');
const main = read('src/main.tsx');
const media = read('src/components/media/ReportMediaGrid.tsx');
const card = read('src/components/report/ReportCard.tsx');
const upload = read('src/components/media/ImageAttachmentPicker.tsx');
const address = read('src/components/location/AddressSearchInput.tsx');
const composerHeader = read('src/components/report-composer/ReportComposerHeader.tsx');
const step3 = read('src/components/report-composer/Step3ComplaintDetails.tsx');
const textField = read('src/components/ui/TextField.tsx');
const textAreaField = read('src/components/ui/TextAreaField.tsx');
const configured = read('src/components/report-composer/ConfiguredFieldsSection.tsx');
const bottomNav = read('src/components/layout/BottomNav.tsx');
const mobileHeader = read('src/components/layout/MobileHeader.tsx');
const desktopRail = read('src/components/layout/DesktopLeftRail.tsx');
const header = read('src/components/layout/Header.tsx');
const issues = read('src/pages/IssuesPage.tsx');
const css = read('src/index.css');

requireContains('SPA route changes move focus to main content', appShell, "document.getElementById('main-content')?.focus");
requireContains('SPA route changes expose a polite live announcement', appShell, 'id="route-change-announcement"');
requireContains('SPA route announcement uses polite status semantics', appShell, 'aria-live="polite"');
requireContains('Language-only route changes participate in navigation reset', appShell, 'previousNavigationKeyRef');
requireContains('Dialogs inert the application root', dialogs, "document.getElementById('root')");
requireContains('Switches use aria-labelledby', toggle, 'aria-labelledby={labelId}');
requireContains('Switches use aria-describedby', toggle, 'aria-describedby={descriptionId}');
requireNotContains('Theme compact selector avoids incomplete listbox semantics', theme, 'role="listbox"');
requireNotContains('Theme choices avoid incomplete radio composite semantics', theme, 'role="radio"');
requireContains('Text size provider wraps the public app', app, '<TextSizeProvider>');
requireContains('Stored text size is applied before first render', main, 'applyStoredTextSizePreference();');
requireContains('Text size preference persists locally', textSizeContext, "sobaike-janao-text-size");
requireContains('Text size preference is applied on the document root', textSizeContext, "setAttribute('data-text-size', preference)");
requireContains('Text size selector exposes pressed state', textSizeSelector, 'aria-pressed={isSelected}');
requireContains('Text size selector exposes Smaller mode', textSizeSelector, "id: 'smaller'");
requireContains('Text size selector exposes Default mode', textSizeSelector, "id: 'default'");
requireContains('Text size selector exposes Larger mode', textSizeSelector, "id: 'larger'");
requireContains('Desktop rail exposes the text size selector', desktopRail, 'idPrefix="rail-text-size"');
requireContains('Shared drawer exposes the text size selector', header, 'idPrefix="drawer-text-size"');
requireContains('Smaller text mode is token-driven', css, 'html[data-text-size="smaller"]');
requireContains('Larger text mode is token-driven', css, 'html[data-text-size="larger"]');
requireContains('Smaller primary text keeps a 14px floor', css, '--type-body-size: 14px;');
requireContains('Larger primary text follows the 15% accessibility step', css, '--type-body-size: 18.5px;');

requireContains('Report media cells use native buttons', media, '<button\n        key={img.id}');
requireNotContains(
  'Report cards avoid fake link role',
  card,
  'role="link"\n      tabIndex={0}'
);
requireContains('Report cards expose a real Link', card, '<Link');
requireContains('Upload errors are live alerts', upload, 'role="alert" aria-live="assertive"');
requireContains('Upload progress is a polite status', upload, 'role="status" aria-live="polite"');
requireContains('Address search exposes a live status', address, 'role="status" aria-live="polite"');
requireContains('Composer step changes move focus', composerHeader, 'stepStatusRef.current?.focus');
requireContains('Composer step state is announced', composerHeader, 'aria-live="polite"');
requireContains('Configured fields expose aria-invalid', configured, 'aria-invalid={Boolean(error)}');
requireContains('Configured fields expose aria-describedby', configured, 'aria-describedby={error ? fieldErrorId');
requireContains('Configured validation focuses the first invalid control', configured, '(directControl || fallbackControl)?.focus');
requireContains('Unified text fields expose aria-invalid', textField, 'aria-invalid={Boolean(error)}');
requireContains('Unified text fields connect helper and error descriptions', textField, "aria-describedby={describedBy}");
requireContains('Unified textareas expose aria-invalid', textAreaField, 'aria-invalid={Boolean(error)}');
requireContains('Unified textareas connect helper and error descriptions', textAreaField, "aria-describedby={describedBy}");
requireContains('Legacy report description is migrated to shared textarea field', step3, '<TextAreaField');
requireContains('Legacy report description routes its error through the shared field', step3, 'error={errors.description}');
requireContains('Legacy validation focuses first invalid control', step3, "document.getElementById(first)?.focus");
requireContains('Mobile primary navigation uses links', bottomNav, '<Link');
requireContains('Full mobile bottom navigation becomes inert while compact', bottomNav, 'inert={isCompact ? true : undefined}');
requireContains('Compact mobile bottom navigation becomes inert while expanded', bottomNav, 'inert={!isCompact ? true : undefined}');
requireContains('Full mobile header becomes inert while compact', mobileHeader, 'inert={isCompact ? true : undefined}');
requireContains('Compact mobile header becomes inert while expanded', mobileHeader, 'inert={!isCompact ? true : undefined}');
requireContains('Adaptive navigation honors reduced-motion in behavior', mobileHeader, "window.matchMedia('(prefers-reduced-motion: reduce)')");
requireContains('Adaptive navigation removes transition delay for reduced-motion users', mobileHeader, 'motion-reduce:delay-0');
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
