import fs from 'node:fs';
import path from 'node:path';

const roots = [path.resolve('src/components'), path.resolve('src/pages')];
const singleFiles = [path.resolve('src/App.tsx')];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && path.extname(entry.name) === '.tsx') files.push(full);
  }
  return files;
}

const files = [...roots.flatMap(walk), ...singleFiles.filter(fs.existsSync)];

const replacements = [
  // Typography sizes: retain intent through centralized compatibility tokens.
  [/text-\[10\.5px\]/g, 'text-[var(--type-fixed-105)]'],
  [/text-\[11\.5px\]/g, 'text-[var(--type-fixed-115)]'],
  [/text-\[12\.5px\]/g, 'text-[var(--type-fixed-125)]'],
  [/text-\[13\.5px\]/g, 'text-[var(--type-fixed-135)]'],
  [/text-\[14\.5px\]/g, 'text-[var(--type-fixed-145)]'],
  [/text-\[15\.5px\]/g, 'text-[var(--type-fixed-155)]'],
  [/text-\[9\.5px\]/g, 'text-[var(--type-fixed-095)]'],
  [/text-\[10px\]/g, 'text-[var(--type-fixed-10)]'],
  [/text-\[11px\]/g, 'text-[var(--type-fixed-11)]'],
  [/text-\[12px\]/g, 'text-[var(--type-fixed-12)]'],
  [/text-\[13px\]/g, 'text-[var(--type-fixed-13)]'],
  [/text-\[14px\]/g, 'text-[var(--type-fixed-14)]'],
  [/text-\[15px\]/g, 'text-[var(--type-fixed-15)]'],
  [/text-\[16px\]/g, 'text-[var(--type-fixed-16)]'],
  [/text-\[17px\]/g, 'text-[var(--type-fixed-17)]'],
  [/text-\[18px\]/g, 'text-[var(--type-fixed-18)]'],
  [/text-\[19px\]/g, 'text-[var(--type-fixed-19)]'],
  [/text-\[20px\]/g, 'text-[var(--type-fixed-20)]'],
  [/text-\[22px\]/g, 'text-[var(--type-fixed-22)]'],
  [/text-\[24px\]/g, 'text-[var(--type-fixed-24)]'],
  [/text-\[26px\]/g, 'text-[var(--type-fixed-26)]'],
  [/text-\[28px\]/g, 'text-[var(--type-fixed-28)]'],
  [/text-\[30px\]/g, 'text-[var(--type-fixed-30)]'],
  [/text-\[32px\]/g, 'text-[var(--type-fixed-32)]'],

  // Tailwind type scale -> central aliases.
  [/\btext-xs\b/g, 'text-[var(--type-fixed-12)]'],
  [/\btext-sm\b/g, 'text-[var(--type-fixed-14)]'],
  [/\btext-base\b/g, 'text-[var(--type-fixed-16)]'],
  [/\btext-lg\b/g, 'text-[var(--type-fixed-18)]'],
  [/\btext-xl\b/g, 'text-[var(--type-fixed-20)]'],
  [/\btext-2xl\b/g, 'text-[var(--type-fixed-24)]'],
  [/\btext-3xl\b/g, 'text-[var(--type-fixed-30)]'],

  // Central typography weights.
  [/\bfont-normal\b/g, 'font-[var(--font-weight-regular)]'],
  [/\bfont-medium\b/g, 'font-[var(--font-weight-medium)]'],
  [/\bfont-semibold\b/g, 'font-[var(--font-weight-semibold)]'],
  [/\bfont-bold\b/g, 'font-[var(--font-weight-bold)]'],

  // Preserve numeric alignment without a local font-family override.
  [/\bfont-mono\b/g, 'tabular-nums'],

  // Fixed line-height declarations -> central aliases.
  [/leading-\[20px\]/g, 'leading-[var(--type-line-20)]'],
  [/leading-\[22px\]/g, 'leading-[var(--type-line-22)]'],
  [/leading-\[24px\]/g, 'leading-[var(--type-line-24)]'],
  [/leading-\[26px\]/g, 'leading-[var(--type-line-26)]'],
  [/leading-\[28px\]/g, 'leading-[var(--type-line-28)]'],
  [/leading-\[30px\]/g, 'leading-[var(--type-line-30)]'],
  [/leading-\[32px\]/g, 'leading-[var(--type-line-32)]'],
  [/leading-\[34px\]/g, 'leading-[var(--type-line-34)]'],
  [/leading-\[38px\]/g, 'leading-[var(--type-line-38)]'],
  [/leading-\[42px\]/g, 'leading-[var(--type-line-42)]'],
  [/leading-\[1\.25\]/g, 'leading-[var(--type-line-ratio-125)]'],
  [/leading-\[1\.3\]/g, 'leading-[var(--type-line-ratio-130)]'],
  [/leading-\[1\.38\]/g, 'leading-[var(--type-line-ratio-138)]'],
  [/leading-\[1\.4\]/g, 'leading-[var(--type-line-ratio-140)]'],
  [/leading-\[1\.5\]/g, 'leading-[var(--type-line-ratio-150)]'],
  [/leading-\[1\.55\]/g, 'leading-[var(--type-line-ratio-155)]'],
  [/leading-\[1\.6\]/g, 'leading-[var(--type-line-ratio-160)]'],

  // Radius utilities -> central radius tokens.
  [/\brounded-sm\b/g, 'rounded-[var(--radius-badge-sm)]'],
  [/\brounded-md\b/g, 'rounded-[var(--radius-badge-sm)]'],
  [/\brounded-lg\b/g, 'rounded-[var(--radius-badge-md)]'],
  [/\brounded-xl\b/g, 'rounded-[var(--radius-control)]'],
  [/\brounded-2xl\b/g, 'rounded-[var(--radius-card)]'],
  [/\brounded-3xl\b/g, 'rounded-[var(--radius-modal)]'],
  [/\brounded-full\b/g, 'rounded-[var(--radius-pill)]'],

  // Elevation utilities -> central elevation tokens.
  [/\bshadow-2xs\b/g, 'shadow-[var(--elevation-2xs)]'],
  [/\bshadow-xs\b/g, 'shadow-[var(--elevation-xs)]'],
  [/\bshadow-sm\b/g, 'shadow-[var(--elevation-sm)]'],
  [/\bshadow-md\b/g, 'shadow-[var(--elevation-md)]'],
  [/\bshadow-lg\b/g, 'shadow-[var(--elevation-lg)]'],
  [/\bshadow-xl\b/g, 'shadow-[var(--elevation-xl)]'],
  [/\bshadow-2xl\b/g, 'shadow-[var(--elevation-2xl)]'],
];

let changedFiles = 0;
let replacementsMade = 0;

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  for (const [pattern, replacement] of replacements) {
    after = after.replace(pattern, (...args) => {
      replacementsMade += 1;
      return typeof replacement === 'function' ? replacement(...args) : replacement;
    });
  }
  if (after !== before) {
    fs.writeFileSync(file, after);
    changedFiles += 1;
  }
}

console.log(`Design-system codemod updated ${changedFiles} file(s) with ${replacementsMade} token replacement(s).`);
