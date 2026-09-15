import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const target = 'scripts/apply-harassment-classification-feature.mjs';
let source = fs.readFileSync(target, 'utf8');

// The codemod emits TSX template literals. Keep those ${...} expressions literal until they are written to TSX.
source = source.replaceAll('\\\\${className}', '\\${className}');
source = source.replaceAll('\\\\${district.', '\\${district.');

// The current Explore source has the analytics summary indented at 14 spaces.
// Align the exact codemod anchor/output with the verified current source.
source = source.replaceAll(
  '                    <ReportAnalyticsOverview\\n                      reports={filteredReports}\\n                      language={language}\\n                    />',
  '              <ReportAnalyticsOverview\\n                reports={filteredReports}\\n                language={language}\\n              />'
);
source = source.replaceAll(
  "                    {selectedSection === 'harassment' && (\\n                      <HarassmentClassificationBreakdown reports={filteredReports} language={language} />\\n                    )}",
  "              {selectedSection === 'harassment' && (\\n                <HarassmentClassificationBreakdown reports={filteredReports} language={language} />\\n              )}"
);

// A few intentionally short anchors occur twice. Resolve them by named operation,
// while keeping every other replacement strict and fail-fast.
const oldHelper = `  if (content.indexOf(from, first + from.length) !== -1) {\n    throw new Error(\`Anchor is not unique: \${label}\`);\n  }\n  return content.slice(0, first) + to + content.slice(first + from.length);`;
const newHelper = `  const second = content.indexOf(from, first + from.length);\n  if (second !== -1) {\n    if (label === 'Public home feed enrichment') {\n      const third = content.indexOf(from, second + from.length);\n      if (third !== -1) throw new Error(\`Anchor has more than two matches: \${label}\`);\n      return content.slice(0, second) + to + content.slice(second + from.length);\n    }\n    if (label === 'Explore clear mobile filters' || label === 'Explore has active filters') {\n      return content.slice(0, first) + to + content.slice(first + from.length);\n    }\n    throw new Error(\`Anchor is not unique: \${label}\`);\n  }\n  return content.slice(0, first) + to + content.slice(first + from.length);`;
if (!source.includes(oldHelper)) {
  throw new Error('Could not patch codemod replaceOnce helper.');
}
source = source.replace(oldHelper, newHelper);
fs.writeFileSync(target, source);

await import(`${pathToFileURL(process.cwd() + '/' + target).href}?run=${Date.now()}`);

// Avoid TypeScript's short-circuit literal narrowing: check the harassment-specific branch
// before the generic "not all" condition.
const explorePath = 'src/pages/ExplorePage.tsx';
let explore = fs.readFileSync(explorePath, 'utf8');
const exploreOld = `  const hasActiveFilters =\n    Boolean(searchQuery.trim()) ||\n    selectedSection !== 'all' ||\n    selectedDivision !== 'all' ||\n    selectedDistrict !== 'all' ||\n    (selectedSection === 'harassment' && hasActiveHarassmentClassificationFilters(harassmentFilters));`;
const exploreNew = `  const hasActiveFilters =\n    Boolean(searchQuery.trim()) ||\n    (selectedSection === 'harassment' && hasActiveHarassmentClassificationFilters(harassmentFilters)) ||\n    selectedSection !== 'all' ||\n    selectedDivision !== 'all' ||\n    selectedDistrict !== 'all';`;
if (!explore.includes(exploreOld)) throw new Error('Missing generated Explore hasActiveFilters block.');
explore = explore.replace(exploreOld, exploreNew);
fs.writeFileSync(explorePath, explore);

const searchPath = 'src/pages/SearchPage.tsx';
let search = fs.readFileSync(searchPath, 'utf8');
const searchOld = `  const hasReportFilters =\n    selectedReportSegment !== 'all' ||\n    (selectedReportSegment === 'harassment' && hasActiveHarassmentClassificationFilters(harassmentFilters));`;
const searchNew = `  const hasReportFilters =\n    (selectedReportSegment === 'harassment' && hasActiveHarassmentClassificationFilters(harassmentFilters)) ||\n    selectedReportSegment !== 'all';`;
if (!search.includes(searchOld)) throw new Error('Missing generated Search hasReportFilters block.');
search = search.replace(searchOld, searchNew);
fs.writeFileSync(searchPath, search);
