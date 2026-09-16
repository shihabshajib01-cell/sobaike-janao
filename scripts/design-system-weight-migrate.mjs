import fs from 'node:fs';
import path from 'node:path';

const roots = [path.resolve('src/components'), path.resolve('src/pages')];
const extraFiles = [path.resolve('src/App.tsx')];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.tsx')) files.push(full);
  }
  return files;
}

const replacements = new Map([
  ['font-normal', 'font-[var(--font-weight-regular)]'],
  ['font-medium', 'font-[var(--font-weight-medium)]'],
  ['font-semibold', 'font-[var(--font-weight-semibold)]'],
  ['font-bold', 'font-[var(--font-weight-bold)]'],
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let changedFiles = 0;
const counts = new Map();
for (const file of [...roots.flatMap(walk), ...extraFiles.filter(fs.existsSync)]) {
  let source = fs.readFileSync(file, 'utf8');
  const original = source;
  for (const [from, to] of replacements) {
    const pattern = new RegExp(`(?<![A-Za-z0-9_-])${escapeRegExp(from)}(?![A-Za-z0-9_-])`, 'g');
    source = source.replace(pattern, () => {
      counts.set(from, (counts.get(from) || 0) + 1);
      return to;
    });
  }
  if (source !== original) {
    fs.writeFileSync(file, source);
    changedFiles += 1;
  }
}

console.log(`Migrated font weights in ${changedFiles} public UI source file(s).`);
for (const [token, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${token}: ${count}`);
}
