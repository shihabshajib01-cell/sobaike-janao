import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, content) => fs.writeFileSync(path, content);

// Step 3: remove the warning that only existed to restore persisted attachment drafts.
{
  const path = 'src/components/report-composer/Step3ComplaintDetails.tsx';
  let text = read(path);
  const startMarker = '              {formData.pendingEvidenceRecovery &&';
  const endMarker = '              {/* Image Attachment Picker - max 6 images */}';
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  if (start === -1 || end === -1) throw new Error('Could not locate Step 3 evidence recovery warning');
  text = text.slice(0, start) + text.slice(end);
  write(path, text);
}

// Step 4: attachments are now based only on current-session images.
{
  const path = 'src/components/report-composer/Step4Review.tsx';
  let text = read(path);

  const summaryStartMarker = '  const hasMissingEvidence =';
  const summaryEndMarker = '\n\n  return (';
  const summaryStart = text.indexOf(summaryStartMarker);
  const summaryEnd = text.indexOf(summaryEndMarker, summaryStart);
  if (summaryStart === -1 || summaryEnd === -1) throw new Error('Could not locate Step 4 recovery attachment summary');

  const newSummary = [
    '  const attachmentsSummary = pendingImages.length > 0',
    "    ? language === 'bn'",
    '      ? `${pendingImages.length} টি ছবি সংযুক্ত`',
    '      : `${pendingImages.length} images attached`',
    "    : language === 'bn'",
    "    ? 'কোনো ছবি সংযুক্ত নেই'",
    "    : 'No attachments';",
  ].join('\n');
  text = text.slice(0, summaryStart) + newSummary + text.slice(summaryEnd);

  const warningStartMarker = '              {hasMissingEvidence ? (';
  const warningEndMarker = '              ) : pendingImages.length > 0 ? (';
  const warningStart = text.indexOf(warningStartMarker);
  const warningEnd = text.indexOf(warningEndMarker, warningStart);
  if (warningStart === -1 || warningEnd === -1) throw new Error('Could not locate Step 4 evidence recovery warning');
  text = text.slice(0, warningStart) + '              {pendingImages.length > 0 ? (' + text.slice(warningEnd + warningEndMarker.length);

  write(path, text);
}

console.log('Recovery-only attachment UI removed.');
