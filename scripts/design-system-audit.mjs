import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
const EXEMPT = new Set([
  path.normalize('src/index.css'),
  path.normalize('src/theme/tokens.ts'),
  path.normalize('src/theme/category-tokens.css'),
]);

const EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

const RULES = [
  {
    id: 'raw-color-literal',
    pattern: /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(/g,
    message: 'Raw color literal outside design-system token files',
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
    pattern: /\bfontFamily\s*:|\bfont-family\s*:/g,
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
    pattern: /\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl)\b|\bshadow\b/g,
    message: 'Tailwind shadow utility bypasses central elevation utilities',
  },
  {
    id: 'inline-ui-style',
    pattern: /\b(?:color|backgroundColor|borderColor|fontSize|fontWeight|fontFamily|borderRadius|boxShadow)\s*:/g,
    message: 'Inline UI styling should use semantic design-system tokens/utilities',
  },
];

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const findings = [];
for (const file of walk(ROOT)) {
  const relative = path.normalize(path.relative(process.cwd(), file));
  if (EXEMPT.has(relative)) continue;
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
          file: relative.replaceAll('\\', '/'),
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
  console.error(`Design-system audit found ${findings.length} violation(s):`);
  for (const item of findings) {
    console.error(`${item.file}:${item.line} [${item.rule}] ${item.token} — ${item.message}`);
    console.error(`  ${item.source}`);
  }
  process.exit(1);
}

console.log('Design-system audit passed: no hardcoded color/font/typography/radius/elevation violations outside token files.');
