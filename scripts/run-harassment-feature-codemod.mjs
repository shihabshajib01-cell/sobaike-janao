import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const target = 'scripts/apply-harassment-classification-feature.mjs';
let source = fs.readFileSync(target, 'utf8');

// The codemod emits TSX template literals. Keep those ${...} expressions literal until they are written to TSX.
source = source.replaceAll('\\\\${className}', '\\${className}');
source = source.replaceAll('\\\\${district.', '\\${district.');
fs.writeFileSync(target, source);

await import(`${pathToFileURL(process.cwd() + '/' + target).href}?run=${Date.now()}`);
