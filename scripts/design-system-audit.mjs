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

const APPROVED_CORE_COLORS = {
  light: {
    '--ui-page': '#F0F2F5',
    '--ui-surface': '#FFFFFF',
    '--ui-surface-subtle': '#F0F2F5',
    '--ui-surface-elevated': '#FFFFFF',
    '--ui-surface-hover': '#E4E6EB',
    '--ui-text-primary': '#050505',
    '--ui-text-secondary': '#65676B',
    '--ui-text-muted': '#65676B',
    '--ui-text-inverse': '#FFFFFF',
    '--ui-border-subtle': '#E4E6EB',
    '--ui-border': '#E4E6EB',
    '--ui-border-strong': '#E4E6EB',
    '--ui-input': '#FFFFFF',
    '--ui-input-placeholder': '#65676B',
    '--ui-disabled-bg': '#E4E6EB',
    '--ui-disabled-text': '#65676B',
  },
  dark: {
    '--ui-page': '#18191A',
    '--ui-surface': '#242526',
    '--ui-surface-subtle': '#242526',
    '--ui-surface-elevated': '#242526',
    '--ui-surface-hover': '#3A3B3C',
    '--ui-text-primary': '#E4E6EB',
    '--ui-text-secondary': '#B0B3B8',
    '--ui-text-muted': '#B0B3B8',
    '--ui-text-inverse': '#FFFFFF',
    '--ui-border-subtle': '#3A3B3C',
    '--ui-border': '#3A3B3C',
    '--ui-border-strong': '#3A3B3C',
    '--ui-input': '#242526',
    '--ui-input-placeholder': '#B0B3B8',
    '--ui-disabled-bg': '#3A3B3C',
    '--ui-disabled-text': '#B0B3B8',
  },
};

const parseVariables = (source) =>
  Object.fromEntries(
    [...source.matchAll(/(--[a-z0-9-_]+)\s*:\s*([^;]+);/gi)].map((match) => [
      match[1],
      match[2].trim(),
    ])
  );

const getThemeBlock = (source, theme) => {
  const pattern =
    theme === 'light'
      ? /(?:^|\n)\s*:root,\s*\n\s*html\[data-theme="light"\]\s*\{([\s\S]*?)\n\s*\}\s*\n\s*html\[data-theme="dark"\]/
      : /html\[data-theme="dark"\],\s*\n\s*\.dark\s*\{([\s\S]*?)\n\s*\}\s*(?:\n\s*:root\s*\{|\n\s*html,)/;

  return source.match(pattern)?.[1] || '';
};

const colorSystemFile = 'src/theme/design-system.css';
if (fs.existsSync(colorSystemFile)) {
  const source = fs.readFileSync(colorSystemFile, 'utf8');

  for (const theme of ['light', 'dark']) {
    const values = parseVariables(getThemeBlock(source, theme));
    for (const [token, expected] of Object.entries(APPROVED_CORE_COLORS[theme])) {
      const actual = values[token];
      if (actual !== expected) {
        findings.push({
          file: colorSystemFile,
          line: 1,
          rule: 'semantic-color-drift',
          token,
          message: `Approved ${theme} semantic color changed from ${expected} to ${actual || 'missing'}`,
          source: `${token}: ${actual || 'missing'}`,
        });
      }
    }
  }
}

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

const taxonomyFile = 'src/services/taxonomyService.ts';
if (fs.existsSync(taxonomyFile)) {
  const source = fs.readFileSync(taxonomyFile, 'utf8');

  if (source.includes('var(--ui-content-primary)')) {
    findings.push({
      file: taxonomyFile,
      line: 1,
      rule: 'undefined-semantic-color-token',
      token: '--ui-content-primary',
      message: 'Dynamic themes must reference the real --ui-text-primary CSS token',
      source: 'var(--ui-content-primary)',
    });
  }

  if (!source.includes('if (legacy && !hasManagedTheme)')) {
    findings.push({
      file: taxonomyFile,
      line: 1,
      rule: 'legacy-theme-inline-override',
      token: 'legacy-category-runtime-theme',
      message: 'Built-in categories must not receive inline runtime colors that override dark-mode CSS tokens',
      source: 'Expected legacy theme guard is missing',
    });
  }

  if (!source.includes('clearRuntimeSectionCssVariables(segment.id)')) {
    findings.push({
      file: taxonomyFile,
      line: 1,
      rule: 'stale-runtime-theme',
      token: 'clearRuntimeSectionCssVariables',
      message: 'Switching back to a built-in theme must clear stale inline category color variables',
      source: 'Expected runtime color cleanup is missing',
    });
  }

  if (!source.includes('segment.colors.filledText')) {
    findings.push({
      file: taxonomyFile,
      line: 1,
      rule: 'managed-theme-on-primary',
      token: 'filledText',
      message: 'Managed category themes must publish an accessible on-primary text color',
      source: 'Expected on-primary runtime token is missing',
    });
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
