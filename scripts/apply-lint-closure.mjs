import fs from 'node:fs';

const changes = new Map();

function edit(file, transforms) {
  let source = fs.readFileSync(file, 'utf8');
  for (const [from, to, label] of transforms) {
    const count = source.split(from).length - 1;
    if (count !== 1) {
      throw new Error(`${file}: expected exactly one ${label}, found ${count}`);
    }
    source = source.replace(from, to);
  }
  changes.set(file, source);
}

edit('src/components/media/AttachmentLightboxModal.tsx', [
  ["import { AttachedImagePreview } from './ImageAttachmentPicker';\n", '', 'unused AttachedImagePreview import'],
]);

edit('src/components/report-composer/ReportComposerFooter.tsx', [
  ['  segment,\n  selectedSubcategoryId,\n', '', 'unused footer destructured props'],
]);

edit('src/components/report-composer/ReportComposerModal.tsx', [
  ["import { CategoryBadge } from '../ui/CategoryBadge';\n", '', 'unused CategoryBadge import'],
  [
    '[formData.segment, formData.serverSubmissionState, formData.clientSubmissionId, language, pendingImages]',
    '[formData.segment, formData.serverSubmissionState, language, pendingImages]',
    'unnecessary service-switch callback dependency',
  ],
  [
    '[formData.subcategoryId, formData.serverSubmissionState, formData.clientSubmissionId, language, pendingImages]',
    '[formData.subcategoryId, formData.serverSubmissionState, language, pendingImages]',
    'unnecessary subcategory-switch callback dependency',
  ],
]);

edit('src/components/report-composer/Step2ComplaintTypeAccordion.tsx', [
  ["import { Info } from 'lucide-react';\n", '', 'unused Info import'],
]);

const rickshawOptions = `const RICKSHAW_OPERATOR_OPTIONS: { value: SubjectTypeValue; labelBn: string; labelEn: string }[] = [\n  {\n    value: 'business',\n    labelBn: 'চার্জিং স্টেশন / গ্যারেজ',\n    labelEn: 'Charging station / garage',\n  },\n  {\n    value: 'individual',\n    labelBn: 'পরিচালনাকারী ব্যক্তি',\n    labelEn: 'Individual operator',\n  },\n  {\n    value: 'organization',\n    labelBn: 'প্রতিষ্ঠান / ভবন কর্তৃপক্ষ',\n    labelEn: 'Organization / building authority',\n  },\n  {\n    value: 'unknown',\n    labelBn: 'অজ্ঞাত / নিশ্চিত নই',\n    labelEn: 'Unknown / not sure',\n  },\n];\n\n`;

const requestLocationHandler = `    const handleRequestDeviceLocation = async () => {\n      setReporterGateState('requesting');\n      try {\n        const res = await VisitorSessionService.captureReporterDeviceLocation();\n        if (res.success && res.coords) {\n          setReporterGateState('verified');\n          setErrors((prev) => {\n            if (!prev.reporterLocation) return prev;\n            const updated = { ...prev };\n            delete updated.reporterLocation;\n            return updated;\n          });\n        } else if (res.errorType === 'denied') {\n          setReporterGateState('denied');\n        } else {\n          setReporterGateState('unavailable');\n        }\n      } catch {\n        setReporterGateState('unavailable');\n      }\n    };\n\n`;

const primaryPartyData = `    // Check if extortion has primary party data\n    const hasPrimaryPartyData = Boolean(\n      formData.reportedSubject?.trim() ||\n      formData.organization?.trim() ||\n      formData.identifyingDescription?.trim() ||\n      (formData.mentionedParties && formData.mentionedParties.length > 0)\n    );\n\n`;

edit('src/components/report-composer/Step3ComplaintDetails.tsx', [
  ['  ChevronDown,\n', '', 'unused ChevronDown import'],
  [rickshawOptions, '', 'unused rickshaw operator option block'],
  ["    const isGasShortage = isUtilityReport && formData.subcategoryId === 'gas-shortage';\n", '', 'unused gas shortage flag'],
  [requestLocationHandler, '', 'unused request-location handler'],
  ['    const [showIdentifyingDetails, setShowIdentifyingDetails] = useState<boolean>(false);\n\n', '', 'unused identifying-details state'],
  [
    '    }, [isUtilityReport]);\n\n    // Clear stale address-specific location data for utility complaints',
    '    }, [isUtilityReport, formData.location, onUpdateFormData]);\n\n    // Clear stale address-specific location data for utility complaints',
    'historical-location effect dependencies',
  ],
  [primaryPartyData, '', 'unused primary-party data block'],
]);

edit('src/components/report-composer/Step4Review.tsx', [
  ['  Coins,\n', '', 'unused Coins import'],
  ["  const isGasShortage = isUtilityReport && formData.subcategoryId === 'gas-shortage';\n", '', 'unused review gas shortage flag'],
]);

edit('src/components/ui/AppIcon.tsx', [
  ['  Zap,\n', '', 'unused Zap import'],
]);

edit('src/pages/ReportPage.tsx', [
  ["import React, { useEffect } from 'react';", "import React from 'react';", 'unused useEffect import'],
]);

edit('src/services/types.ts', [
  [
    "import { ReportItem, ReportUpdate, ReportResponse, ReportTrustIndicators, PublicReportImage } from '../types/report';",
    "import { PublicReportImage } from '../types/report';",
    'unused report type imports',
  ],
]);

edit('src/pages/ReportDetailPage.tsx', [
  ["import React, { useEffect, useState } from 'react';", "import React, { useCallback, useEffect, useState } from 'react';", 'useCallback import'],
  ['  const fetchReport = () => {\n', '  const fetchReport = useCallback(() => {\n', 'fetchReport callback opening'],
  [
    '      .finally(() => {\n        setIsLoading(false);\n      });\n  };\n\n  useEffect(() => {\n    fetchReport();\n  }, [reportId]);',
    '      .finally(() => {\n        setIsLoading(false);\n      });\n  }, [reportId]);\n\n  useEffect(() => {\n    fetchReport();\n  }, [fetchReport]);',
    'fetchReport callback closure and effect dependency',
  ],
]);

for (const [file, source] of changes) fs.writeFileSync(file, source);
console.log(`Applied verified lint cleanup to ${changes.size} source files.`);
