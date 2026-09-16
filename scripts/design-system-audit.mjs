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
    id: 'arbitrary-type-size',
    pattern: /\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/g,
    message: 'Arbitrary font size bypasses semantic typography tokens',
  },
  {
    id: 'tailwind-type-scale',
    pattern: /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g,
    message: 'Tailwind font-size utility bypasses semantic typography tokens',
  },
  {
    id: 'arbitrary-line-height',
    pattern: /\bleading-\[[^\]]+\]/g,
    message: 'Arbitrary line-height bypasses semantic typography tokens',
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
    pattern: /\brounded-\[[^\]]+\]/g,
    message: 'Arbitrary radius bypasses central radius utilities',
  },
  {
    id: 'tailwind-shadow',
    pattern: /\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl)\b|\bshadow(?!-)\b/g,
    message: 'Tailwind shadow utility bypasses central elevation utilities',
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
