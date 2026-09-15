import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const target = 'scripts/apply-harassment-classification-feature.mjs';
let source = fs.readFileSync(target, 'utf8');

// The codemod emits TSX template literals. Keep those ${...} expressions literal until they are written to TSX.
source = source.replaceAll('\\\\${className}', '\\${className}');
source = source.replaceAll('\\\\${district.', '\\${district.');

// One service anchor intentionally exists in both getAll() and getHomeFeed().
// Make replaceOnce target the second occurrence only for that named operation.
const oldHelper = `  if (content.indexOf(from, first + from.length) !== -1) {\n    throw new Error(\`Anchor is not unique: \${label}\`);\n  }\n  return content.slice(0, first) + to + content.slice(first + from.length);`;
const newHelper = `  const second = content.indexOf(from, first + from.length);\n  if (second !== -1) {\n    if (label === 'Public home feed enrichment') {\n      const third = content.indexOf(from, second + from.length);\n      if (third !== -1) throw new Error(\`Anchor has more than two matches: \${label}\`);\n      return content.slice(0, second) + to + content.slice(second + from.length);\n    }\n    throw new Error(\`Anchor is not unique: \${label}\`);\n  }\n  return content.slice(0, first) + to + content.slice(first + from.length);`;
if (!source.includes(oldHelper)) {
  throw new Error('Could not patch codemod replaceOnce helper.');
}
source = source.replace(oldHelper, newHelper);
fs.writeFileSync(target, source);

await import(`${pathToFileURL(process.cwd() + '/' + target).href}?run=${Date.now()}`);
