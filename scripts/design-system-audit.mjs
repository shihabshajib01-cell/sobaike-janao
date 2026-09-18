import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_UI_ROOTS = [path.resolve('src/components'), path.resolve('src/pages')];
const PUBLIC_UI_FILES = new Set([path.resolve('src/App.tsx')]);
const EXTENSIONS = new Set(['.tsx']);

const RULES = [
  {
    id: 'raw-color-literal',
    pattern: /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(/g,
    message: 'Raw color literal outside the central design-system token source',
  },
  {
    id: 'tailwind-palette-color',
    pattern: /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d+)?\b/g,
    message: 'Tailwind palette color bypasses semantic UI/category tokens',
  },
  {
    id: 'arbitrary-color-class',
    pattern: /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to)-\[(?:#|rgb|rgba|hsl|hsla|oklch)[^\]]*\]/g,
    message: 'Arbitrary color class bypasses design-system tokens',
  },
  {
    id: 'font-family-inline',
    pattern: /\bfontFamily\s*:/g,
    message: 'Local font-family override bypasses the global language-aware font token',
  },
  {
    id: 'tailwind-font-family',
    pattern: /\bfont-(?:sans|serif|mono)\b/g,
    message: 'Tailwind font-family utility bypasses the global font token',
  },
  {
    id: 'tailwind-font-weight',
    pattern: /\bfont-(?:normal|medium|semibold|bold)\b/g,
    message: 'Framework font-weight utility bypasses central typography weight tokens',
  },
  {
    id: 'arbitrary-type-size',
    pattern: /\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/g,
    message: 'Hardcoded font size bypasses semantic typography tokens',
  },
  {
    id: 'legacy-fixed-type-alias',
    pattern: /text-\[var\(--type-fixed-[^)]+\)\]/g,
    message: 'Legacy fixed typography aliases are compatibility-only; use semantic typography roles',
  },
  {
    id: 'tailwind-type-scale',
    pattern: /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g,
    message: 'Tailwind font-size utility bypasses semantic typography tokens',
  },
  {
    id: 'arbitrary-line-height',
    pattern: /\bleading-\[(?!var\()[^\]]+\]/g,
    message: 'Hardcoded line-height bypasses semantic typography tokens',
  },
  {
    id: 'arbitrary-font-weight',
    pattern: /\bfont-\[\d+\]/g,
    message: 'Arbitrary font weight bypasses typography tokens',
  },
  {
    id: 'tailwind-radius',
    pattern: /\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/g,
    message: 'Tailwind radius utility bypasses central radius utilities',
  },
  {
    id: 'arbitrary-radius',
    pattern: /\brounded-\[(?!var\()[^\]]+\]/g,
    message: 'Hardcoded radius bypasses central radius tokens',
  },
  {
    id: 'tailwind-shadow',
    pattern: /\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl)\b|\bshadow(?!-)\b/g,
    message: 'Tailwind shadow utility bypasses central elevation tokens',
  },
  {
    id: 'arbitrary-shadow',
    pattern: /\bshadow-\[(?!var\()[^\]]+\]/g,
    message: 'Hardcoded shadow bypasses central elevation tokens',
  },
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const files = [
  ...PUBLIC_UI_ROOTS.flatMap(walk),
  ...[...PUBLIC_UI_FILES].filter((file) => fs.existsSync(file)),
];

const findings = [];

const APPROVED_MATERIAL_CORE = {
  light: {
    '--md-primary': '#1B4D6B',
    '--md-primary-variant': '#163B52',
    '--md-primary-active': '#245F82',
    '--md-on-primary': '#FFFFFF',
    '--md-secondary': '#3A7CA5',
    '--md-secondary-variant': '#163B52',
    '--md-on-secondary': '#FFFFFF',
    '--md-on-secondary-container': '#163B52',
    '--md-background': '#F0F2F5',
    '--md-on-background': '#050505',
    '--md-surface': '#FFFFFF',
    '--md-surface-subtle': '#F0F2F5',
    '--md-surface-elevated': '#FFFFFF',
    '--md-surface-hover': '#E4E6EB',
    '--md-on-surface': '#050505',
    '--md-on-surface-secondary': '#65676B',
    '--md-on-surface-muted': '#65676B',
    '--md-outline-subtle': '#E4E6EB',
    '--md-outline': '#E4E6EB',
    '--md-outline-strong': '#E4E6EB',
    '--md-disabled-container': '#E4E6EB',
    '--md-on-disabled': '#65676B',
  },
  dark: {
    '--md-primary': '#1B4D6B',
    '--md-primary-variant': '#163B52',
    '--md-primary-active': '#245F82',
    '--md-on-primary': '#FFFFFF',
    '--md-secondary': '#3A7CA5',
    '--md-secondary-variant': '#245F82',
    '--md-on-secondary': '#FFFFFF',
    '--md-on-secondary-container': '#BFDBFE',
    '--md-background': '#18191A',
    '--md-on-background': '#E4E6EB',
    '--md-surface': '#242526',
    '--md-surface-subtle': '#242526',
    '--md-surface-elevated': '#242526',
    '--md-surface-hover': '#3A3B3C',
    '--md-on-surface': '#E4E6EB',
    '--md-on-surface-secondary': '#B0B3B8',
    '--md-on-surface-muted': '#B0B3B8',
    '--md-outline-subtle': '#3A3B3C',
    '--md-outline': '#3A3B3C',
    '--md-outline-strong': '#3A3B3C',
    '--md-disabled-container': '#3A3B3C',
    '--md-on-disabled': '#B0B3B8',
  },
};

const parseVariables = (source) =>
  Object.fromEntries(
    [...source.matchAll(/(--[a-z0-9-_]+)\s*:\s*([^;]+);/gi)].map((match) => [
      match[1],
      match[2].trim(),
    ])
  );

const extractThemeBlock = (source, theme) => {
  const startMarker =
    theme === 'light'
      ? ':root,\nhtml[data-theme="light"] {'
      : 'html[data-theme="dark"],\n.dark {';
  const endMarker =
    theme === 'light'
      ? '\n}\n\nhtml[data-theme="dark"],'
      : '\n}\n\n/* Compatibility aliases';

  const blockStart = source.indexOf(startMarker);
  const blockEnd = source.indexOf(endMarker, blockStart + startMarker.length);
  if (blockStart < 0 || blockEnd < 0) return '';
  return source.slice(blockStart + startMarker.length, blockEnd);
};

const relativeLuminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (a, b) => {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
};

const addContrastFinding = (file, theme, token, foreground, background, minimum = 4.5) => {
  if (!/^#[0-9a-fA-F]{6}$/.test(foreground) || !/^#[0-9a-fA-F]{6}$/.test(background)) return;
  const ratio = contrastRatio(foreground, background);
  if (ratio < minimum) {
    findings.push({
      file,
      line: 1,
      rule: 'color-role-contrast',
      token,
      message: `${theme} ${token} contrast is ${ratio.toFixed(2)}:1; minimum is ${minimum}:1`,
      source: `${foreground} on ${background}`,
    });
  }
};

const colorSystemFile = 'src/theme/color-system.css';
if (!fs.existsSync(colorSystemFile)) {
  findings.push({
    file: colorSystemFile,
    line: 1,
    rule: 'missing-color-authority',
    token: colorSystemFile,
    message: 'Public color system must have one dedicated authority file',
    source: 'File not found',
  });
} else {
  const source = fs.readFileSync(colorSystemFile, 'utf8');

  for (const theme of ['light', 'dark']) {
    const values = parseVariables(extractThemeBlock(source, theme));

    for (const [token, expected] of Object.entries(APPROVED_MATERIAL_CORE[theme])) {
      const actual = values[token];
      if (actual !== expected) {
        findings.push({
          file: colorSystemFile,
          line: 1,
          rule: 'semantic-color-drift',
          token,
          message: `Approved ${theme} Material role changed from ${expected} to ${actual || 'missing'}`,
          source: `${token}: ${actual || 'missing'}`,
        });
      }
    }

    addContrastFinding(colorSystemFile, theme, 'on-primary', values['--md-on-primary'], values['--md-primary']);
    addContrastFinding(colorSystemFile, theme, 'on-secondary', values['--md-on-secondary'], values['--md-secondary']);
    if (values['--md-secondary-container']?.startsWith('color-mix')) {
      const secondaryContainer = theme === 'light' ? '#E7EFF4' : '#28353D';
      addContrastFinding(
        colorSystemFile,
        theme,
        'on-secondary-container',
        values['--md-on-secondary-container'],
        secondaryContainer
      );
    }
    addContrastFinding(colorSystemFile, theme, 'on-background', values['--md-on-background'], values['--md-background']);
    addContrastFinding(colorSystemFile, theme, 'on-surface', values['--md-on-surface'], values['--md-surface']);
    addContrastFinding(colorSystemFile, theme, 'on-surface-secondary', values['--md-on-surface-secondary'], values['--md-surface']);
    addContrastFinding(colorSystemFile, theme, 'on-surface-muted', values['--md-on-surface-muted'], values['--md-surface']);

    for (const semantic of ['success', 'warning', 'error', 'info']) {
      addContrastFinding(
        colorSystemFile,
        theme,
        `on-${semantic}`,
        values[`--md-on-${semantic}`],
        values[`--md-${semantic}`]
      );
      addContrastFinding(
        colorSystemFile,
        theme,
        `on-${semantic}-container`,
        values[`--md-on-${semantic}-container`],
        values[`--md-${semantic}-container`]
      );
    }

    for (const category of [
      'harassment',
      'extortion',
      'public_safety',
      'road_transport',
      'load_shedding',
      'illegal_occupation',
      'rickshaw',
    ]) {
      addContrastFinding(
        colorSystemFile,
        theme,
        `${category}-on-primary`,
        values[`--category-${category}-on-primary`],
        values[`--category-${category}-primary`]
      );
      addContrastFinding(
        colorSystemFile,
        theme,
        `${category}-on-container`,
        values[`--category-${category}-on-container`],
        values[`--category-${category}-container`]
      );
    }
  }

  const compatibilityBlock = source.slice(source.indexOf('/* Compatibility aliases'));
  if (/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(/.test(compatibilityBlock)) {
    findings.push({
      file: colorSystemFile,
      line: 1,
      rule: 'compatibility-alias-literal',
      token: 'compatibility-alias',
      message: 'Compatibility aliases must reference Material/category roles and contain no color literals',
      source: 'Literal color found after compatibility alias marker',
    });
  }
}

for (const legacyAuthorityFile of ['src/index.css', 'src/theme/design-system.css']) {
  if (!fs.existsSync(legacyAuthorityFile)) continue;
  const source = fs.readFileSync(legacyAuthorityFile, 'utf8');
  if (/--ui-(?:page|surface|text-primary|border|primary-action-bg)\s*:/.test(source)) {
    findings.push({
      file: legacyAuthorityFile,
      line: 1,
      rule: 'duplicate-color-authority',
      token: '--ui-*',
      message: 'Core public color values must be owned only by theme/color-system.css',
      source: 'Legacy core color assignment found',
    });
  }
}

const mainFile = 'src/main.tsx';
if (fs.existsSync(mainFile)) {
  const source = fs.readFileSync(mainFile, 'utf8');
  if (!source.includes("import './theme/color-system.css';")) {
    findings.push({
      file: mainFile,
      line: 1,
      rule: 'missing-color-system-import',
      token: 'color-system.css',
      message: 'Public app must load the centralized color-system authority',
      source: 'Expected color-system.css import is missing',
    });
  }
}

const tokensFile = 'src/theme/tokens.ts';
if (fs.existsSync(tokensFile)) {
  const source = fs.readFileSync(tokensFile, 'utf8');
  if (/#[0-9a-fA-F]{3,8}\b/.test(source)) {
    findings.push({
      file: tokensFile,
      line: 1,
      rule: 'token-color-literal',
      token: '#...',
      message: 'Static category/hero color values must resolve through theme/color-system.css',
      source: 'Raw hex color found in theme/tokens.ts',
    });
  }
}

const roleMigratedPrimitives = [
  'src/components/ui/Button.tsx',
  'src/components/ui/IconButton.tsx',
  'src/components/ui/FilterChip.tsx',
  'src/components/ui/Modal.tsx',
  'src/components/ui/Drawer.tsx',
  'src/components/ui/SearchInput.tsx',
  'src/components/ui/SearchableSelect.tsx',
  'src/components/ui/Checkbox.tsx',
  'src/components/ui/Accordion.tsx',
  'src/components/ui/EmptyState.tsx',
  'src/components/ui/Select.tsx',
];

for (const file of roleMigratedPrimitives) {
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const legacyColorUtility = source.match(/\b(?:bg|text|border|ring|outline|fill|stroke)-ui-[a-z0-9-]+\b/);
  if (legacyColorUtility) {
    findings.push({
      file,
      line: 1,
      rule: 'legacy-color-utility-in-primitive',
      token: legacyColorUtility[0],
      message: 'Migrated shared primitives must consume Material role utilities directly',
      source: legacyColorUtility[0],
    });
  }
}

const taxonomyFile = 'src/services/taxonomyService.ts';
if (fs.existsSync(taxonomyFile)) {
  const source = fs.readFileSync(taxonomyFile, 'utf8');

  for (const requiredToken of ['var(--md-surface)', 'var(--md-on-surface)']) {
    if (!source.includes(requiredToken)) {
      findings.push({
        file: taxonomyFile,
        line: 1,
        rule: 'dynamic-theme-role-bypass',
        token: requiredToken,
        message: 'Dynamic category themes must derive from Material surface roles',
        source: 'Required Material role reference is missing',
      });
    }
  }

  if (!source.includes('if (legacy && !hasManagedTheme)')) {
    findings.push({
      file: taxonomyFile,
      line: 1,
      rule: 'legacy-theme-inline-override',
      token: 'legacy-category-runtime-theme',
      message: 'Built-in categories must not receive inline runtime colors that override dark-mode category roles',
      source: 'Expected legacy theme guard is missing',
    });
  }

  if (!source.includes('clearRuntimeSectionCssVariables(segment.id)')) {
    findings.push({
      file: taxonomyFile,
      line: 1,
      rule: 'stale-runtime-theme',
      token: 'clearRuntimeSectionCssVariables',
      message: 'Switching back to a built-in theme must clear stale inline category role variables',
      source: 'Expected runtime color cleanup is missing',
    });
  }

  for (const role of ['primary', 'container', 'on-container', 'outline', 'on-primary']) {
    if (!source.includes(`--category-${'${safeId}'}-${role}`)) {
      findings.push({
        file: taxonomyFile,
        line: 1,
        rule: 'dynamic-category-role-missing',
        token: role,
        message: 'Runtime categories must publish the complete category role contract',
        source: `Missing category role: ${role}`,
      });
    }
  }

  const presetPattern =
    /(\w+):\s*\{\s*primary:\s*'(#[0-9a-fA-F]{6})',\s*onPrimary:\s*'(#[0-9a-fA-F]{6})'\s*\}/g;

  for (const match of source.matchAll(presetPattern)) {
    const [, preset, primary, onPrimary] = match;
    const ratio = contrastRatio(primary, onPrimary);
    if (ratio < 4.5) {
      findings.push({
        file: taxonomyFile,
        line: 1,
        rule: 'managed-theme-contrast',
        token: preset,
        message: `Managed theme CTA contrast is ${ratio.toFixed(2)}:1; minimum is 4.5:1`,
        source: `${primary} on ${onPrimary}`,
      });
    }
  }
}

for (const file of files) {
  const relative = path.relative(process.cwd(), file).replaceAll('\\', '/');
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes('design-system-audit-ignore')) continue;
    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      const matches = [...line.matchAll(rule.pattern)];
      for (const match of matches) {
        findings.push({
          file: relative,
          line: index + 1,
          rule: rule.id,
          token: match[0],
          message: rule.message,
          source: line.trim(),
        });
      }
    }
  }
}

if (findings.length) {
  const byRule = new Map();
  const byFile = new Map();
  const byRuleToken = new Map();
  for (const finding of findings) {
    byRule.set(finding.rule, (byRule.get(finding.rule) || 0) + 1);
    byFile.set(finding.file, (byFile.get(finding.file) || 0) + 1);
    const key = `${finding.rule}::${finding.token}`;
    byRuleToken.set(key, (byRuleToken.get(key) || 0) + 1);
  }

  console.error(`Public design-system audit found ${findings.length} violation(s) across ${byFile.size} UI file(s).`);
  console.error('\nBy rule:');
  for (const [rule, count] of [...byRule.entries()].sort((a, b) => b[1] - a[1])) {
    console.error(`  ${rule}: ${count}`);
    const tokens = [...byRuleToken.entries()]
      .filter(([key]) => key.startsWith(`${rule}::`))
      .map(([key, tokenCount]) => [key.slice(rule.length + 2), tokenCount])
      .sort((a, b) => b[1] - a[1]);
    console.error(`    ${tokens.map(([token, tokenCount]) => `${token}=${tokenCount}`).join(', ')}`);
  }
  console.error('\nBy file:');
  for (const [file, count] of [...byFile.entries()].sort((a, b) => b[1] - a[1])) {
    console.error(`  ${file}: ${count}`);
  }

  const verbose = process.env.AUDIT_VERBOSE === '1';
  const visibleFindings = verbose ? findings : findings.slice(0, 240);
  console.error(`\nDetails${verbose ? '' : ' (first 240; set AUDIT_VERBOSE=1 for all)'}:`);
  for (const item of visibleFindings) {
    console.error(`${item.file}:${item.line} [${item.rule}] ${item.token} — ${item.message}`);
    console.error(`  ${item.source}`);
  }
  process.exit(1);
}

console.log(`Public design-system audit passed across ${files.length} UI source file(s).`);
