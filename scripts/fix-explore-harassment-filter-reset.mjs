import fs from 'node:fs';

const path = 'src/pages/ExplorePage.tsx';
let source = fs.readFileSync(path, 'utf8');

const anchor = `  useEffect(() => {
    loadData();
  }, [loadData]);

  // Responsive resize safety`;

const replacement = `  useEffect(() => {
    loadData();
  }, [loadData]);

  // Prevent hidden Harassment classification filters from leaking across category changes.
  useEffect(() => {
    if (selectedSection !== 'harassment') {
      setHarassmentFilters(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);
    }
  }, [selectedSection]);

  // Responsive resize safety`;

if (!source.includes(anchor)) {
  throw new Error('ExplorePage load effect anchor not found');
}

source = source.replace(anchor, replacement);
fs.writeFileSync(path, source);
