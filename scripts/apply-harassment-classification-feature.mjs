import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function write(path, content) {
  fs.writeFileSync(path, content);
}

function replaceOnce(content, from, to, label) {
  const first = content.indexOf(from);
  if (first === -1) throw new Error(`Missing anchor: ${label}`);
  if (content.indexOf(from, first + from.length) !== -1) {
    throw new Error(`Anchor is not unique: ${label}`);
  }
  return content.slice(0, first) + to + content.slice(first + from.length);
}

function replaceRegexOnce(content, regex, replacement, label) {
  const matches = [...content.matchAll(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`))];
  if (matches.length !== 1) throw new Error(`Expected one regex match for ${label}; got ${matches.length}`);
  return content.replace(regex, replacement);
}

function patchStep3() {
  const path = 'src/components/report-composer/Step3ComplaintDetails.tsx';
  let s = read(path);

  s = replaceOnce(
    s,
    "import { Toggle } from '../ui/Toggle';\n",
    "import { Toggle } from '../ui/Toggle';\nimport { SearchableSelect } from '../ui/SearchableSelect';\nimport { Select } from '../ui/Select';\nimport {\n  HARASSMENT_AGE_GROUP_OPTIONS,\n  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,\n  HARASSMENT_REPORTING_FOR_OPTIONS,\n} from '../../data/harassmentClassification';\n",
    'Step3 UI imports'
  );

  s = s.replace("import { GoogleMapPicker } from '../location/GoogleMapPicker';\n", '');
  s = s.replace('  DivisionInfo,\n  DistrictInfo,\n', '');
  s = s.replace('  UpazilaInfo,\n', '');

  s = replaceRegexOnce(
    s,
    /\n    \/\/ Map centering target state \(for flyTo when places are resolved\)[\s\S]*?\n    \/\/ Reporter device location gate state/,
    '\n    // Reporter device location gate state',
    'Step3 obsolete map center state'
  );

  s = replaceOnce(
    s,
    `      setMapCenterTarget({\n        lat: place.lat,\n        lng: place.lng,\n        zoom: 16,\n        timestamp: Date.now(),\n      });\n\n`,
    '',
    'Step3 address map center update'
  );

  s = replaceRegexOnce(
    s,
    /\n    const handleMapPointChange = \(lat: number, lng: number\) => \{[\s\S]*?\n    \};\n\n    const handleClearMapPoint = \(\) => \{[\s\S]*?\n    \};\n/,
    '\n',
    'Step3 obsolete map handlers'
  );

  s = replaceOnce(
    s,
    `        if (reporterGateState !== 'verified' || !VisitorSessionService.hasValidCurrentReporterLocation()) {\n          newErrors.reporterLocation =\n            language === 'bn'\n              ? 'প্রতিবেদন চালিয়ে যেতে ডিভাইসের লোকেশন চালু করুন।'\n              : 'Turn on device location to continue.';\n        }\n\n        const reportDivObj = getDivisionByStoredName(formData.location?.division);`,
    `        if (segment === 'harassment') {\n          if (!formData.affectedPersonAgeGroup) {\n            newErrors.affectedPersonAgeGroup =\n              language === 'bn' ? 'প্রভাবিত ব্যক্তির বয়সের গ্রুপ নির্বাচন করুন।' : \"Select the affected person's age group.\";\n          }\n          if (!formData.allegedAbuserRelationship) {\n            newErrors.allegedAbuserRelationship =\n              language === 'bn' ? 'অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক নির্বাচন করুন।' : 'Select the relationship with the alleged abuser.';\n          }\n          if (!formData.reportingFor) {\n            newErrors.reportingFor =\n              language === 'bn' ? 'কার জন্য প্রতিবেদন করছেন তা নির্বাচন করুন।' : 'Select who you are reporting for.';\n          }\n        }\n\n        if (reporterGateState !== 'verified' || !VisitorSessionService.hasValidCurrentReporterLocation()) {\n          newErrors.reporterLocation =\n            language === 'bn'\n              ? 'প্রতিবেদন চালিয়ে যেতে ডিভাইসের লোকেশন চালু করুন।'\n              : 'Turn on device location to continue.';\n        }\n\n        const reportDivObj = getDivisionByStoredName(formData.location?.division);`,
    'Step3 harassment validation'
  );

  s = replaceOnce(
    s,
    `          newErrors.previousBillMonth ||\n          newErrors.previousBillAmount\n        ) {`,
    `          newErrors.previousBillMonth ||\n          newErrors.previousBillAmount ||\n          newErrors.affectedPersonAgeGroup ||\n          newErrors.allegedAbuserRelationship ||\n          newErrors.reportingFor\n        ) {`,
    'Step3 narrative error routing'
  );

  const classificationFields = `\n\n            {segment === 'harassment' && (\n              <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle\">\n                <Select\n                  id=\"harassment-age-group-select\"\n                  label={language === 'bn' ? 'প্রভাবিত ব্যক্তির বয়সের গ্রুপ' : \"Affected person's age group\"}\n                  required\n                  value={formData.affectedPersonAgeGroup || ''}\n                  onChange={(event) => {\n                    onUpdateFormData({ affectedPersonAgeGroup: event.target.value as DraftReport['affectedPersonAgeGroup'] });\n                    if (errors.affectedPersonAgeGroup) setErrors((prev) => ({ ...prev, affectedPersonAgeGroup: '' }));\n                  }}\n                  placeholder={language === 'bn' ? '-- বয়সের গ্রুপ নির্বাচন করুন --' : '-- Select age group --'}\n                  error={errors.affectedPersonAgeGroup}\n                  options={HARASSMENT_AGE_GROUP_OPTIONS.map((option) => ({\n                    value: option.value,\n                    label: language === 'bn' ? option.labelBn : option.labelEn,\n                  }))}\n                />\n\n                <SearchableSelect\n                  id=\"harassment-abuser-relationship-select\"\n                  label={language === 'bn' ? 'অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক' : 'Relationship with alleged abuser'}\n                  required\n                  value={formData.allegedAbuserRelationship || ''}\n                  onChange={(value) => {\n                    onUpdateFormData({ allegedAbuserRelationship: value as DraftReport['allegedAbuserRelationship'] });\n                    if (errors.allegedAbuserRelationship) setErrors((prev) => ({ ...prev, allegedAbuserRelationship: '' }));\n                  }}\n                  placeholder={language === 'bn' ? 'সম্পর্ক নির্বাচন করুন' : 'Select relationship'}\n                  searchPlaceholder={language === 'bn' ? 'সম্পর্ক খুঁজুন...' : 'Search relationship...'}\n                  noResultsText={language === 'bn' ? 'কোনো মিল পাওয়া যায়নি' : 'No matching relationship'}\n                  error={errors.allegedAbuserRelationship}\n                  options={HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS.map((option) => ({\n                    value: option.value,\n                    label: language === 'bn' ? option.labelBn : option.labelEn,\n                    keywords: [option.labelBn, option.labelEn],\n                  }))}\n                />\n\n                <Select\n                  id=\"harassment-reporting-for-select\"\n                  label={language === 'bn' ? 'কার জন্য প্রতিবেদন করছেন?' : 'Reporting for'}\n                  required\n                  value={formData.reportingFor || ''}\n                  onChange={(event) => {\n                    onUpdateFormData({ reportingFor: event.target.value as DraftReport['reportingFor'] });\n                    if (errors.reportingFor) setErrors((prev) => ({ ...prev, reportingFor: '' }));\n                  }}\n                  placeholder={language === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}\n                  error={errors.reportingFor}\n                  options={HARASSMENT_REPORTING_FOR_OPTIONS.map((option) => ({\n                    value: option.value,\n                    label: language === 'bn' ? option.labelBn : option.labelEn,\n                  }))}\n                />\n              </div>\n            )}`;

  s = replaceOnce(
    s,
    `            </div>\n\n            {/* Conditional Digital Threat Questions ONLY for Digital Harassment */}`,
    `            </div>${classificationFields}\n\n            {/* Conditional Digital Threat Questions ONLY for Digital Harassment */}`,
    'Step3 harassment fields insertion'
  );

  s = replaceRegexOnce(
    s,
    /\s*\{\/\* Administrative Dropdowns \(Desktop: 3 columns in 1 row; Tablet: 2 columns with Thana wrapping; Mobile: stacked\) \*\/\}[\s\S]*?\n\s*\{\/\* Row 3: Detailed Address \(Optional for non-utility, completely omitted for utility\) \*\/\}/,
    `\n              {/* Administrative searchable selects (dependent Division → District → Thana/Upazila) */}\n              <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3\">\n                <SearchableSelect\n                  id=\"complaint-division-select\"\n                  label={language === 'bn' ? 'বিভাগ' : 'Division'}\n                  required\n                  disabled={isLocationLocked}\n                  value={resolvedDivision ? resolvedDivision.nameEn : ''}\n                  onChange={handleDivisionChange}\n                  placeholder={language === 'bn' ? 'বিভাগ বেছে নিন' : 'Select division'}\n                  searchPlaceholder={language === 'bn' ? 'বিভাগ খুঁজুন...' : 'Search divisions...'}\n                  noResultsText={language === 'bn' ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No matching division'}\n                  error={errors.division}\n                  options={DIVISIONS.map((div) => ({\n                    value: div.nameEn,\n                    label: language === 'bn' ? div.nameBn : div.nameEn,\n                    keywords: [div.nameEn, div.nameBn],\n                  }))}\n                />\n\n                <SearchableSelect\n                  id=\"complaint-district-select\"\n                  label={language === 'bn' ? 'জেলা' : 'District'}\n                  required\n                  disabled={isLocationLocked || !resolvedDivision}\n                  value={resolvedDistrict ? resolvedDistrict.nameEn : ''}\n                  onChange={handleDistrictChange}\n                  placeholder={language === 'bn' ? 'জেলা বেছে নিন' : 'Select district'}\n                  searchPlaceholder={language === 'bn' ? 'জেলা খুঁজুন...' : 'Search districts...'}\n                  noResultsText={language === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}\n                  error={errors.district}\n                  options={availableDistricts.map((district) => ({\n                    value: district.nameEn,\n                    label: language === 'bn' ? district.nameBn : district.nameEn,\n                    keywords: [district.nameEn, district.nameBn],\n                  }))}\n                />\n\n                <SearchableSelect\n                  id=\"complaint-thana-select\"\n                  label={language === 'bn' ? 'থানা / উপজেলা' : 'Thana / upazila'}\n                  required\n                  disabled={isLocationLocked || !resolvedDistrict}\n                  value={resolvedUpazila ? resolvedUpazila.nameEn : ''}\n                  onChange={handleUpazilaChange}\n                  placeholder={language === 'bn' ? 'থানা / উপজেলা বেছে নিন' : 'Select thana / upazila'}\n                  searchPlaceholder={language === 'bn' ? 'থানা / উপজেলা খুঁজুন...' : 'Search thana / upazila...'}\n                  noResultsText={language === 'bn' ? 'কোনো থানা / উপজেলা পাওয়া যায়নি' : 'No matching thana / upazila'}\n                  error={errors.upazilaOrThana}\n                  className=\"sm:col-span-2 lg:col-span-1\"\n                  options={availableUpazilas.map((upazila) => ({\n                    value: upazila.nameEn,\n                    label: language === 'bn' ? upazila.nameBn : upazila.nameEn,\n                    keywords: [upazila.nameEn, upazila.nameBn],\n                  }))}\n                />\n              </div>\n\n              {/* Row 3: Detailed Address (Optional for non-utility, completely omitted for utility) */}`,
    'Step3 searchable administrative location controls'
  );

  s = replaceRegexOnce(
    s,
    /\n\s*<GoogleMapPicker[\s\S]*?\n\s*\/>/,
    '',
    'Step3 report input map removal'
  );

  s = s.replace(
    '{/* Optional Incident Location Pinning & Address Search */}',
    '{/* Optional address/place search; no report-input map */}'
  );

  write(path, s);
}

function patchComposer() {
  const path = 'src/components/report-composer/ReportComposerModal.tsx';
  let s = read(path);

  s = replaceOnce(
    s,
    `        mentionedParties: [],\n        intimateWhatHappened: '',`,
    `        mentionedParties: [],\n        affectedPersonAgeGroup: '',\n        allegedAbuserRelationship: '',\n        reportingFor: '',\n        intimateWhatHappened: '',`,
    'Composer category-switch cleanup'
  );

  s = replaceOnce(
    s,
    `    // Check if any image is actively preparing\n    const isAnyCompressing = pendingImages.some((img) => img.isCompressing);`,
    `    // Defense-in-depth: harassment classifications are mandatory before any server call.\n    if (\n      formData.segment === 'harassment' &&\n      (!formData.affectedPersonAgeGroup || !formData.allegedAbuserRelationship || !formData.reportingFor)\n    ) {\n      setFormData((prev) => ({ ...prev, currentStep: 3 }));\n      setSubmitError(\n        language === 'bn'\n          ? 'হয়রানি ও নির্যাতনের প্রতিবেদন জমা দিতে বয়সের গ্রুপ, অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক এবং কার জন্য প্রতিবেদন করছেন—তিনটি তথ্যই নির্বাচন করুন।'\n          : 'Select the age group, relationship with the alleged abuser, and who you are reporting for before submitting a harassment report.'\n      );\n      setTimeout(() => {\n        document.getElementById('composer-section-narrative')?.scrollIntoView({ behavior: 'smooth', block: 'start' });\n      }, 100);\n      return;\n    }\n\n    // Check if any image is actively preparing\n    const isAnyCompressing = pendingImages.some((img) => img.isCompressing);`,
    'Composer submit harassment guard'
  );

  s = replaceOnce(
    s,
    `        frequency: formData.frequency || 'one-time',\n        subjectType: isPartySegment ? (formData.subjectType || 'unknown') : undefined,`,
    `        frequency: formData.frequency || 'one-time',\n        affectedPersonAgeGroup: isHarassment ? formData.affectedPersonAgeGroup || undefined : undefined,\n        allegedAbuserRelationship: isHarassment ? formData.allegedAbuserRelationship || undefined : undefined,\n        reportingFor: isHarassment ? formData.reportingFor || undefined : undefined,\n        subjectType: isPartySegment ? (formData.subjectType || 'unknown') : undefined,`,
    'Composer payload classifications'
  );

  write(path, s);
}

function patchReview() {
  const path = 'src/components/report-composer/Step4Review.tsx';
  let s = read(path);

  s = replaceOnce(
    s,
    "import { formatBillingMonth } from '../../utils/formatters';\n",
    "import { formatBillingMonth } from '../../utils/formatters';\nimport {\n  HARASSMENT_AGE_GROUP_OPTIONS,\n  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,\n  HARASSMENT_REPORTING_FOR_OPTIONS,\n  getBilingualOptionLabel,\n} from '../../data/harassmentClassification';\n",
    'Review classification imports'
  );

  const block = `\n\n            {segment === 'harassment' && (\n              <div className=\"grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1\">\n                <div className=\"p-2.5 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle\">\n                  <span className=\"text-[12px] text-ui-content-muted block mb-0.5\">\n                    {language === 'bn' ? 'প্রভাবিত ব্যক্তির বয়স' : \"Affected person's age group\"}\n                  </span>\n                  <p className=\"text-[13.5px] font-bold text-ui-content-primary\">\n                    {getBilingualOptionLabel(HARASSMENT_AGE_GROUP_OPTIONS, formData.affectedPersonAgeGroup, language) || '-'}\n                  </p>\n                </div>\n                <div className=\"p-2.5 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle\">\n                  <span className=\"text-[12px] text-ui-content-muted block mb-0.5\">\n                    {language === 'bn' ? 'অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক' : 'Relationship with alleged abuser'}\n                  </span>\n                  <p className=\"text-[13.5px] font-bold text-ui-content-primary\">\n                    {getBilingualOptionLabel(HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS, formData.allegedAbuserRelationship, language) || '-'}\n                  </p>\n                </div>\n                <div className=\"p-2.5 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle\">\n                  <span className=\"text-[12px] text-ui-content-muted block mb-0.5\">\n                    {language === 'bn' ? 'কার জন্য প্রতিবেদন' : 'Reporting for'}\n                  </span>\n                  <p className=\"text-[13.5px] font-bold text-ui-content-primary\">\n                    {getBilingualOptionLabel(HARASSMENT_REPORTING_FOR_OPTIONS, formData.reportingFor, language) || '-'}\n                  </p>\n                </div>\n              </div>\n            )}`;

  s = replaceOnce(
    s,
    `            )}\n          </div>\n        </ReviewSection>\n\n        {/* Section 3: 2. Location */}`,
    `            )}${block}\n          </div>\n        </ReviewSection>\n\n        {/* Section 3: 2. Location */}`,
    'Review incident classifications'
  );

  // The report-input map is gone; don't claim a map pin exists in review for newly submitted reports.
  s = replaceRegexOnce(
    s,
    /\n\s*\{formData\.location\?\.lat !== undefined && formData\.location\?\.lng !== undefined && \([\s\S]*?\n\s*\)\}/,
    '',
    'Review obsolete map-pin status'
  );

  write(path, s);
}

function patchPublicReportService() {
  const path = 'src/services/publicReportService.ts';
  let s = read(path);

  s = replaceOnce(
    s,
    "import { SEED_SUBMITTED_REPORTS } from '../data/seedSubmissions';\n",
    "import { SEED_SUBMITTED_REPORTS } from '../data/seedSubmissions';\nimport {\n  HarassmentAgeGroup,\n  HarassmentAbuserRelationship,\n  HarassmentReportingFor,\n} from '../data/harassmentClassification';\n",
    'Public service classification imports'
  );

  s = replaceOnce(
    s,
    `  visitorLat?: number | null;\n  visitorLng?: number | null;\n}`,
    `  visitorLat?: number | null;\n  visitorLng?: number | null;\n  affectedPersonAgeGroup?: HarassmentAgeGroup | 'all';\n  allegedAbuserRelationship?: HarassmentAbuserRelationship | 'all';\n  reportingFor?: HarassmentReportingFor | 'all';\n}`,
    'Public service filter contract'
  );

  s = replaceOnce(
    s,
    `    incidentDateBn: pv?.incidentDateBn || seed.incidentDate || '',\n    incidentDateEn: pv?.incidentDateEn || seed.incidentDate || '',`,
    `    incidentDateBn: pv?.incidentDateBn || seed.incidentDate || '',\n    incidentDateEn: pv?.incidentDateEn || seed.incidentDate || '',\n    affectedPersonAgeGroup: seed.affectedPersonAgeGroup,\n    allegedAbuserRelationship: seed.allegedAbuserRelationship,\n    reportingFor: seed.reportingFor,`,
    'Public mock mapper classifications'
  );

  const helper = `\ninterface PublicHarassmentClassificationRow {\n  id: string;\n  affectedPersonAgeGroup?: HarassmentAgeGroup | null;\n  allegedAbuserRelationship?: HarassmentAbuserRelationship | null;\n  reportingFor?: HarassmentReportingFor | null;\n}\n\nasync function enrichHarassmentClassifications(list: ReportItem[]): Promise<ReportItem[]> {\n  if (!isSupabaseConfigured() || !supabase || !list.some((report) => report.segment === 'harassment')) {\n    return list;\n  }\n\n  try {\n    const { data, error } = await fetchWithDeduplication('rpc:get_public_harassment_classifications', () =>\n      supabase!.rpc('get_public_harassment_classifications')\n    );\n    if (error) {\n      console.warn('[PublicReportService] Classification enrichment error:', error);\n      return list;\n    }\n    if (!Array.isArray(data)) return list;\n\n    const byId = new Map(\n      (data as PublicHarassmentClassificationRow[]).map((row) => [row.id.toUpperCase(), row])\n    );\n\n    return list.map((report) => {\n      const row = byId.get(report.id.toUpperCase());\n      if (!row) return report;\n      return {\n        ...report,\n        affectedPersonAgeGroup: row.affectedPersonAgeGroup || undefined,\n        allegedAbuserRelationship: row.allegedAbuserRelationship || undefined,\n        reportingFor: row.reportingFor || undefined,\n      };\n    });\n  } catch (error) {\n    console.warn('[PublicReportService] Classification enrichment failed:', error);\n    return list;\n  }\n}\n`;

  s = replaceOnce(
    s,
    `function fetchWithDeduplication<T>(key: string, fetcher: () => PromiseLike<T>): Promise<T> {\n  if (inFlightRequests.has(key)) {\n    return inFlightRequests.get(key) as Promise<T>;\n  }\n  const promise = Promise.resolve(fetcher()).finally(() => {\n    inFlightRequests.delete(key);\n  });\n  inFlightRequests.set(key, promise);\n  return promise;\n}\n`,
    `function fetchWithDeduplication<T>(key: string, fetcher: () => PromiseLike<T>): Promise<T> {\n  if (inFlightRequests.has(key)) {\n    return inFlightRequests.get(key) as Promise<T>;\n  }\n  const promise = Promise.resolve(fetcher()).finally(() => {\n    inFlightRequests.delete(key);\n  });\n  inFlightRequests.set(key, promise);\n  return promise;\n}\n${helper}`,
    'Public service enrichment helper'
  );

  s = replaceOnce(
    s,
    `    if (filters?.segment && filters.segment !== 'all') {`,
    `    list = await enrichHarassmentClassifications(list);\n\n    if (filters?.segment && filters.segment !== 'all') {`,
    'Public getAll enrichment'
  );

  s = replaceOnce(
    s,
    `    if (filters?.search) {`,
    `    if (filters?.affectedPersonAgeGroup && filters.affectedPersonAgeGroup !== 'all') {\n      list = list.filter((report) => report.affectedPersonAgeGroup === filters.affectedPersonAgeGroup);\n    }\n    if (filters?.allegedAbuserRelationship && filters.allegedAbuserRelationship !== 'all') {\n      list = list.filter((report) => report.allegedAbuserRelationship === filters.allegedAbuserRelationship);\n    }\n    if (filters?.reportingFor && filters.reportingFor !== 'all') {\n      list = list.filter((report) => report.reportingFor === filters.reportingFor);\n    }\n    if (filters?.search) {`,
    'Public getAll classification filters'
  );

  s = replaceOnce(
    s,
    `    // Batch enrich published reports with evidence images (single RPC call for all visible items)\n    if (isSupabaseConfigured() && supabase) {`,
    `    list = await enrichHarassmentClassifications(list);\n\n    // Batch enrich published reports with evidence images (single RPC call for all visible items)\n    if (isSupabaseConfigured() && supabase) {`,
    'Public home feed enrichment'
  );

  s = replaceOnce(
    s,
    `      const report = mapSupabasePublicReportToItem(data as SupabasePublicReportRPC);\n\n      try {`,
    `      let report = mapSupabasePublicReportToItem(data as SupabasePublicReportRPC);\n      report = (await enrichHarassmentClassifications([report]))[0] || report;\n\n      try {`,
    'Public detail enrichment'
  );

  s = replaceOnce(
    s,
    `      if (filters.subcategory && filters.subcategory !== 'all') {\n        result = result.filter((r) => r.subcategoryId === filters.subcategory);\n      }\n      if (filters.limit && filters.limit > 0) {`,
    `      if (filters.subcategory && filters.subcategory !== 'all') {\n        result = result.filter((r) => r.subcategoryId === filters.subcategory);\n      }\n      if (filters.affectedPersonAgeGroup && filters.affectedPersonAgeGroup !== 'all') {\n        result = result.filter((r) => r.affectedPersonAgeGroup === filters.affectedPersonAgeGroup);\n      }\n      if (filters.allegedAbuserRelationship && filters.allegedAbuserRelationship !== 'all') {\n        result = result.filter((r) => r.allegedAbuserRelationship === filters.allegedAbuserRelationship);\n      }\n      if (filters.reportingFor && filters.reportingFor !== 'all') {\n        result = result.filter((r) => r.reportingFor === filters.reportingFor);\n      }\n      if (filters.limit && filters.limit > 0) {`,
    'Public ranked segment classification filters'
  );

  write(path, s);
}

function patchHarassmentPage() {
  const path = 'src/pages/HarassmentPage.tsx';
  let s = read(path);

  s = replaceOnce(
    s,
    "import { CANONICAL_BANNER_CONTENT } from '../data/bannerContent';\n",
    "import { CANONICAL_BANNER_CONTENT } from '../data/bannerContent';\nimport { HarassmentClassificationFilters } from '../components/report/HarassmentClassificationFilters';\nimport {\n  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,\n  matchesHarassmentClassification,\n} from '../data/harassmentClassification';\n",
    'Harassment page imports'
  );

  s = replaceOnce(
    s,
    `  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');\n\n  const [reports, setReports]`,
    `  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');\n  const [classificationFilters, setClassificationFilters] = useState(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);\n\n  const [reports, setReports]`,
    'Harassment page filter state'
  );

  s = replaceOnce(
    s,
    `      return matchesSubcat && matchesDistrict;`,
    `      const matchesClassification = matchesHarassmentClassification(r, classificationFilters);\n      return matchesSubcat && matchesDistrict && matchesClassification;`,
    'Harassment page apply classifications'
  );

  s = replaceOnce(
    s,
    `  }, [reports, selectedSubcat, selectedDistrict]);`,
    `  }, [reports, selectedSubcat, selectedDistrict, classificationFilters]);`,
    'Harassment page memo dependencies'
  );

  s = replaceOnce(
    s,
    `              return matchesSub && matchesDist;`,
    `              return matchesSub && matchesDist && matchesHarassmentClassification(r, classificationFilters);`,
    'Harassment page chip counts'
  );

  s = replaceOnce(
    s,
    `        </div>\n      </section>\n\n      {/* 3. Loading State Skeleton Screen */}`,
    `        </div>\n\n        <HarassmentClassificationFilters\n          language={language}\n          value={classificationFilters}\n          onChange={setClassificationFilters}\n        />\n      </section>\n\n      {/* 3. Loading State Skeleton Screen */}`,
    'Harassment page filters UI'
  );

  s = replaceOnce(
    s,
    `                setSelectedSubcat('all');\n                setSelectedDistrict('all');`,
    `                setSelectedSubcat('all');\n                setSelectedDistrict('all');\n                setClassificationFilters(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);`,
    'Harassment page reset'
  );

  write(path, s);
}

function patchLocationSelector() {
  const path = 'src/components/feed/LocationSelector.tsx';
  const next = `import React from 'react';\nimport { POPULAR_DISTRICTS } from '../../data/categories';\nimport { useApp } from '../../context/AppContext';\nimport { SearchableSelect } from '../ui/SearchableSelect';\n\nexport interface LocationSelectorProps {\n  selectedDistrict: string;\n  onSelectDistrict: (district: string) => void;\n  className?: string;\n}\n\nexport const LocationSelector: React.FC<LocationSelectorProps> = ({\n  selectedDistrict,\n  onSelectDistrict,\n  className = '',\n}) => {\n  const { language } = useApp();\n\n  return (\n    <div className={\`min-w-[180px] sm:min-w-[210px] \\${className}\`}>\n      <SearchableSelect\n        id=\"location-filter-select\"\n        value={selectedDistrict}\n        onChange={onSelectDistrict}\n        placeholder={language === 'bn' ? 'জেলা নির্বাচন' : 'Filter by district'}\n        searchPlaceholder={language === 'bn' ? 'জেলা খুঁজুন...' : 'Search districts...'}\n        noResultsText={language === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}\n        options={POPULAR_DISTRICTS.map((district) => ({\n          value: district.id,\n          label: language === 'bn' ? district.nameBn : district.nameEn,\n          keywords: [district.nameBn, district.nameEn],\n        }))}\n      />\n    </div>\n  );\n};\n`;
  write(path, next);
}

function patchExplore() {
  const path = 'src/pages/ExplorePage.tsx';
  let s = read(path);

  s = replaceOnce(
    s,
    "import { Modal } from '../components/ui/Modal';\n",
    "import { Modal } from '../components/ui/Modal';\nimport { SearchableSelect } from '../components/ui/SearchableSelect';\nimport { HarassmentClassificationFilters } from '../components/report/HarassmentClassificationFilters';\nimport { HarassmentClassificationBreakdown } from '../components/explore/HarassmentClassificationBreakdown';\nimport {\n  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,\n  HARASSMENT_AGE_GROUP_OPTIONS,\n  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,\n  HARASSMENT_REPORTING_FOR_OPTIONS,\n  getBilingualOptionLabel,\n  hasActiveHarassmentClassificationFilters,\n  matchesHarassmentClassification,\n} from '../data/harassmentClassification';\n",
    'Explore imports'
  );

  s = replaceOnce(
    s,
    `  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');\n\n  // Mobile UX Phase 6 Sheet States`,
    `  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');\n  const [harassmentFilters, setHarassmentFilters] = useState(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);\n\n  // Mobile UX Phase 6 Sheet States`,
    'Explore classification state'
  );

  s = replaceOnce(
    s,
    `  const [draftDistrict, setDraftDistrict] = useState<string>('all');\n\n  const [allReports, setAllReports]`,
    `  const [draftDistrict, setDraftDistrict] = useState<string>('all');\n  const [draftHarassmentFilters, setDraftHarassmentFilters] = useState(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);\n\n  const [allReports, setAllReports]`,
    'Explore draft classification state'
  );

  s = replaceOnce(
    s,
    `      // Search query\n      if (searchQuery.trim()) {`,
    `      if (selectedSection === 'harassment' && !matchesHarassmentClassification(r, harassmentFilters)) {\n        return false;\n      }\n      // Search query\n      if (searchQuery.trim()) {`,
    'Explore shared classification filtering'
  );

  s = replaceOnce(
    s,
    `  }, [allReports, searchQuery, selectedSection, selectedDivision]);`,
    `  }, [allReports, searchQuery, selectedSection, selectedDivision, harassmentFilters]);`,
    'Explore filter memo dependency'
  );

  s = replaceOnce(
    s,
    `    setSelectedDistrict('all');\n  };`,
    `    setSelectedDistrict('all');\n    setHarassmentFilters(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);\n  };`,
    'Explore reset classifications'
  );

  s = replaceOnce(
    s,
    `    setDraftDistrict(selectedDistrict);\n    setIsAreaSheetOpen(false);`,
    `    setDraftDistrict(selectedDistrict);\n    setDraftHarassmentFilters(harassmentFilters);\n    setIsAreaSheetOpen(false);`,
    'Explore open mobile filters'
  );

  s = replaceOnce(
    s,
    `    setSelectedDistrict(draftDistrict);\n    setIsFilterSheetOpen(false);`,
    `    setSelectedDistrict(draftDistrict);\n    setHarassmentFilters(\n      draftSection === 'harassment' ? draftHarassmentFilters : EMPTY_HARASSMENT_CLASSIFICATION_FILTERS\n    );\n    setIsFilterSheetOpen(false);`,
    'Explore apply mobile filters'
  );

  s = replaceOnce(
    s,
    `    setDraftDistrict('all');\n  };`,
    `    setDraftDistrict('all');\n    setDraftHarassmentFilters(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);\n  };`,
    'Explore clear mobile filters'
  );

  s = replaceOnce(
    s,
    `    if (selectedDistrict !== 'all') count++;\n    return count;\n  }, [selectedSection, selectedDivision, selectedDistrict]);`,
    `    if (selectedDistrict !== 'all') count++;\n    if (selectedSection === 'harassment') {\n      if (harassmentFilters.ageGroup !== 'all') count++;\n      if (harassmentFilters.abuserRelationship !== 'all') count++;\n      if (harassmentFilters.reportingFor !== 'all') count++;\n    }\n    return count;\n  }, [selectedSection, selectedDivision, selectedDistrict, harassmentFilters]);`,
    'Explore mobile active count'
  );

  s = replaceOnce(
    s,
    `    selectedSection !== 'all' ||\n    selectedDivision !== 'all' ||\n    selectedDistrict !== 'all';`,
    `    selectedSection !== 'all' ||\n    selectedDivision !== 'all' ||\n    selectedDistrict !== 'all' ||\n    (selectedSection === 'harassment' && hasActiveHarassmentClassificationFilters(harassmentFilters));`,
    'Explore has active filters'
  );

  s = replaceRegexOnce(
    s,
    /\s*\{\/\* Desktop \/ Tablet Controls \(Search, Division, District\) \*\/\}[\s\S]*?\n\s*\{\/\* Desktop Category Filter Chips \*\/\}/,
    `\n        {/* Desktop / Tablet Controls (Search, Division, District) */}\n        <div className=\"hidden md:flex items-start justify-between gap-4\">\n          <div className=\"grid grid-cols-2 gap-2 min-w-[350px] lg:min-w-[390px]\">\n            <SearchableSelect\n              id=\"desktop-select-division\"\n              value={selectedDivision}\n              onChange={(value) => {\n                setSelectedDivision(value);\n                setSelectedDistrict('all');\n              }}\n              placeholder={language === 'bn' ? 'সকল বিভাগ' : 'All divisions'}\n              searchPlaceholder={language === 'bn' ? 'বিভাগ খুঁজুন...' : 'Search divisions...'}\n              noResultsText={language === 'bn' ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No matching division'}\n              options={[\n                { value: 'all', label: language === 'bn' ? 'সকল বিভাগ' : 'All divisions' },\n                ...DIVISIONS.map((division) => ({\n                  value: division.nameEn,\n                  label: language === 'bn' ? division.nameBn : division.nameEn,\n                  keywords: [division.nameBn, division.nameEn],\n                })),\n              ]}\n            />\n            <SearchableSelect\n              id=\"desktop-select-district\"\n              value={selectedDistrict}\n              onChange={setSelectedDistrict}\n              placeholder={language === 'bn' ? 'সকল জেলা' : 'All districts'}\n              searchPlaceholder={language === 'bn' ? 'জেলা খুঁজুন...' : 'Search districts...'}\n              noResultsText={language === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}\n              options={[\n                { value: 'all', label: language === 'bn' ? 'সকল জেলা' : 'All districts' },\n                ...availableDistricts.map((district) => ({\n                  value: district.nameEn,\n                  label: language === 'bn'\n                    ? \`\\${district.nameBn} (\\${district.divisionBn})\`\n                    : \`\\${district.nameEn} (\\${district.divisionEn})\`,\n                  keywords: [district.nameBn, district.nameEn, district.divisionBn, district.divisionEn],\n                })),\n              ]}\n            />\n          </div>\n\n          <div className=\"relative flex items-center w-[240px] lg:w-[280px] shrink-0\">\n            <MapIcon name=\"search\" size=\"sm\" className=\"text-ui-content-muted absolute left-3.5 pointer-events-none\" ariaHidden={true} />\n            <input\n              type=\"text\"\n              value={searchQuery}\n              onChange={(e) => setSearchQuery(e.target.value)}\n              aria-label={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন' : 'Search by area or report'}\n              placeholder={language === 'bn' ? 'এলাকা বা প্রতিবেদন খুঁজুন...' : 'Search by area or report...'}\n              className=\"w-full pl-10 pr-11 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent rounded-xl text-[14px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus min-h-[44px]\"\n            />\n            {searchQuery && (\n              <button type=\"button\" onClick={() => setSearchQuery('')} aria-label={language === 'bn' ? 'অনুসন্ধান মুছুন' : 'Clear search'} className=\"absolute right-0.5 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-ui-content-muted hover:text-ui-content-primary rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus\">\n                <MapIcon name=\"close\" size=\"xs\" ariaHidden={true} />\n              </button>\n            )}\n          </div>\n        </div>\n\n        {/* Desktop Category Filter Chips */}`,
    'Explore desktop searchable locations'
  );

  s = replaceOnce(
    s,
    `        </div>\n\n        {/* Mobile Control Bar (Search Input + Filters Drawer Button) */}`,
    `        </div>\n\n        {selectedSection === 'harassment' && (\n          <div className=\"hidden md:block pt-1 border-t border-ui-stroke-subtle\">\n            <HarassmentClassificationFilters\n              language={language}\n              value={harassmentFilters}\n              onChange={setHarassmentFilters}\n            />\n          </div>\n        )}\n\n        {/* Mobile Control Bar (Search Input + Filters Drawer Button) */}`,
    'Explore desktop harassment filters'
  );

  const activeChips = `\n\n          {selectedSection === 'harassment' && harassmentFilters.ageGroup !== 'all' && (\n            <span className=\"inline-flex items-center gap-1 pl-3 pr-0.5 rounded-lg bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] font-medium text-ui-content-primary\">\n              <span>{getBilingualOptionLabel(HARASSMENT_AGE_GROUP_OPTIONS, harassmentFilters.ageGroup, language)}</span>\n              <button type=\"button\" onClick={() => setHarassmentFilters((prev) => ({ ...prev, ageGroup: 'all' }))} aria-label={language === 'bn' ? 'বয়সের ফিল্টার সরান' : 'Remove age filter'} className=\"w-11 h-11 flex items-center justify-center rounded-r-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus\"><MapIcon name=\"close\" size=\"xs\" ariaHidden={true} /></button>\n            </span>\n          )}\n          {selectedSection === 'harassment' && harassmentFilters.abuserRelationship !== 'all' && (\n            <span className=\"inline-flex items-center gap-1 pl-3 pr-0.5 rounded-lg bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] font-medium text-ui-content-primary\">\n              <span>{getBilingualOptionLabel(HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS, harassmentFilters.abuserRelationship, language)}</span>\n              <button type=\"button\" onClick={() => setHarassmentFilters((prev) => ({ ...prev, abuserRelationship: 'all' }))} aria-label={language === 'bn' ? 'সম্পর্কের ফিল্টার সরান' : 'Remove relationship filter'} className=\"w-11 h-11 flex items-center justify-center rounded-r-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus\"><MapIcon name=\"close\" size=\"xs\" ariaHidden={true} /></button>\n            </span>\n          )}\n          {selectedSection === 'harassment' && harassmentFilters.reportingFor !== 'all' && (\n            <span className=\"inline-flex items-center gap-1 pl-3 pr-0.5 rounded-lg bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] font-medium text-ui-content-primary\">\n              <span>{getBilingualOptionLabel(HARASSMENT_REPORTING_FOR_OPTIONS, harassmentFilters.reportingFor, language)}</span>\n              <button type=\"button\" onClick={() => setHarassmentFilters((prev) => ({ ...prev, reportingFor: 'all' }))} aria-label={language === 'bn' ? 'প্রতিবেদনকারীর ফিল্টার সরান' : 'Remove reporting-for filter'} className=\"w-11 h-11 flex items-center justify-center rounded-r-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus\"><MapIcon name=\"close\" size=\"xs\" ariaHidden={true} /></button>\n            </span>\n          )}`;

  s = replaceOnce(
    s,
    `          {/* Clear All Button */}`,
    `${activeChips}\n\n          {/* Clear All Button */}`,
    'Explore active classification chips'
  );

  s = replaceRegexOnce(
    s,
    /\s*\{\/\* Division \*\/\}[\s\S]*?\n\s*\{\/\* Topic \/ Category \*\/\}/,
    `\n          <SearchableSelect\n            id=\"mobile-filter-division\"\n            label={language === 'bn' ? 'বিভাগ' : 'Division'}\n            value={draftDivision}\n            onChange={handleDraftDivisionChange}\n            searchPlaceholder={language === 'bn' ? 'বিভাগ খুঁজুন...' : 'Search divisions...'}\n            noResultsText={language === 'bn' ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No matching division'}\n            options={[\n              { value: 'all', label: language === 'bn' ? 'সকল বিভাগ' : 'All divisions' },\n              ...DIVISIONS.map((division) => ({ value: division.nameEn, label: language === 'bn' ? division.nameBn : division.nameEn, keywords: [division.nameBn, division.nameEn] })),\n            ]}\n          />\n\n          <SearchableSelect\n            id=\"mobile-filter-district\"\n            label={language === 'bn' ? 'জেলা' : 'District'}\n            value={draftDistrict}\n            onChange={setDraftDistrict}\n            searchPlaceholder={language === 'bn' ? 'জেলা খুঁজুন...' : 'Search districts...'}\n            noResultsText={language === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}\n            options={[\n              { value: 'all', label: language === 'bn' ? 'সকল জেলা' : 'All districts' },\n              ...draftAvailableDistricts.map((district) => ({ value: district.nameEn, label: language === 'bn' ? district.nameBn : district.nameEn, keywords: [district.nameBn, district.nameEn, district.divisionBn, district.divisionEn] })),\n            ]}\n          />\n\n          {/* Topic / Category */}`,
    'Explore mobile searchable locations'
  );

  s = replaceOnce(
    s,
    `          </fieldset>\n        </div>\n      </Modal>`,
    `          </fieldset>\n\n          {draftSection === 'harassment' && (\n            <div className=\"pt-1 border-t border-ui-stroke-subtle\">\n              <HarassmentClassificationFilters\n                language={language}\n                value={draftHarassmentFilters}\n                onChange={setDraftHarassmentFilters}\n              />\n            </div>\n          )}\n        </div>\n      </Modal>`,
    'Explore mobile harassment filters'
  );

  // Put the privacy-safe classification analytics next to the existing report analytics when harassment is selected.
  s = replaceOnce(
    s,
    `                    <ReportAnalyticsOverview\n                      reports={filteredReports}\n                      language={language}\n                    />`,
    `                    <ReportAnalyticsOverview\n                      reports={filteredReports}\n                      language={language}\n                    />\n                    {selectedSection === 'harassment' && (\n                      <HarassmentClassificationBreakdown reports={filteredReports} language={language} />\n                    )}`,
    'Explore classification analysis'
  );

  write(path, s);
}

function patchSearch() {
  const path = 'src/pages/SearchPage.tsx';
  let s = read(path);

  s = replaceOnce(
    s,
    "import { toBanglaDigits } from '../utils/formatters';\n",
    "import { toBanglaDigits } from '../utils/formatters';\nimport { SectionKey, SECTIONS } from '../theme/tokens';\nimport { Select } from '../components/ui/Select';\nimport { HarassmentClassificationFilters } from '../components/report/HarassmentClassificationFilters';\nimport {\n  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,\n  hasActiveHarassmentClassificationFilters,\n  matchesHarassmentClassification,\n} from '../data/harassmentClassification';\n",
    'Search imports'
  );

  s = replaceOnce(
    s,
    `  const [activeTab, setActiveTab] = useState<'all' | 'reports' | 'locations' | 'subjects'>('all');\n\n  const [allReports, setAllReports]`,
    `  const [activeTab, setActiveTab] = useState<'all' | 'reports' | 'locations' | 'subjects'>('all');\n  const [selectedReportSegment, setSelectedReportSegment] = useState<SectionKey | 'all'>('all');\n  const [harassmentFilters, setHarassmentFilters] = useState(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);\n\n  const [allReports, setAllReports]`,
    'Search report filter state'
  );

  s = replaceOnce(
    s,
    `  // Search through Reports\n  const matchingReports = useMemo(() => {\n    if (!query.trim()) return [];\n    const q = query.toLowerCase().trim();\n    return allReports.filter((r) => {`,
    `  const hasReportFilters =\n    selectedReportSegment !== 'all' ||\n    (selectedReportSegment === 'harassment' && hasActiveHarassmentClassificationFilters(harassmentFilters));\n  const hasSearchIntent = Boolean(query.trim()) || hasReportFilters;\n\n  useEffect(() => {\n    if (selectedReportSegment !== 'harassment' && hasActiveHarassmentClassificationFilters(harassmentFilters)) {\n      setHarassmentFilters(EMPTY_HARASSMENT_CLASSIFICATION_FILTERS);\n    }\n  }, [selectedReportSegment, harassmentFilters]);\n\n  // Search through Reports\n  const matchingReports = useMemo(() => {\n    if (!query.trim() && !hasReportFilters) return [];\n    const q = query.toLowerCase().trim();\n    return allReports.filter((r) => {\n      if (selectedReportSegment !== 'all' && r.segment !== selectedReportSegment) return false;\n      if (selectedReportSegment === 'harassment' && !matchesHarassmentClassification(r, harassmentFilters)) return false;\n      if (!q) return true;`,
    'Search structured report filter logic'
  );

  s = replaceOnce(
    s,
    `  }, [allReports, query]);\n\n  // Search through Locations`,
    `  }, [allReports, query, selectedReportSegment, harassmentFilters, hasReportFilters]);\n\n  // Search through Locations`,
    'Search report memo deps'
  );

  const filterPanel = `\n\n      <section className=\"bg-ui-surface border border-ui-stroke-subtle rounded-xl p-3.5 sm:p-4 space-y-3\" aria-label={language === 'bn' ? 'প্রতিবেদন ফিল্টার' : 'Report filters'}>\n        <div className=\"max-w-sm\">\n          <Select\n            id=\"search-report-category\"\n            label={language === 'bn' ? 'প্রতিবেদনের ধরন' : 'Report category'}\n            value={selectedReportSegment}\n            onChange={(event) => setSelectedReportSegment(event.target.value as SectionKey | 'all')}\n            options={[\n              { value: 'all', label: language === 'bn' ? 'সকল প্রতিবেদন' : 'All reports' },\n              { value: 'harassment', label: language === 'bn' ? SECTIONS.harassment.nameBn : SECTIONS.harassment.nameEn },\n              { value: 'rickshaw', label: language === 'bn' ? SECTIONS.rickshaw.nameBn : SECTIONS.rickshaw.nameEn },\n              { value: 'extortion', label: language === 'bn' ? SECTIONS.extortion.nameBn : SECTIONS.extortion.nameEn },\n              { value: 'load_shedding', label: language === 'bn' ? SECTIONS.load_shedding.nameBn : SECTIONS.load_shedding.nameEn },\n            ]}\n          />\n        </div>\n        {selectedReportSegment === 'harassment' && (\n          <HarassmentClassificationFilters language={language} value={harassmentFilters} onChange={setHarassmentFilters} />\n        )}\n      </section>`;

  s = replaceOnce(
    s,
    `      </div>\n\n      {/* Result Category Tabs */}`,
    `      </div>${filterPanel}\n\n      {/* Result Category Tabs */}`,
    'Search filter UI'
  );

  s = s.replace('{query.trim() && (\n        <div className="flex items-center gap-2 pb-2', '{hasSearchIntent && (\n        <div className="flex items-center gap-2 pb-2');
  s = s.replace('!isLoading && !fetchError && !query.trim() && (', '!isLoading && !fetchError && !hasSearchIntent && (');
  s = s.replace('!isLoading && !fetchError && query.trim() && (', '!isLoading && !fetchError && hasSearchIntent && (');

  write(path, s);
}

function patchReportDetail() {
  const path = 'src/pages/ReportDetailPage.tsx';
  let s = read(path);

  s = replaceOnce(
    s,
    "import { BRAND_NAME } from '../lib/seo';\n",
    "import { BRAND_NAME } from '../lib/seo';\nimport { HarassmentContextSummary } from '../components/report/HarassmentContextSummary';\n",
    'Report detail context import'
  );

  s = replaceOnce(
    s,
    `        {/* Excess Electricity Bill Context Block */}`,
    `        <HarassmentContextSummary report={report} language={language} />\n\n        {/* Excess Electricity Bill Context Block */}`,
    'Report detail harassment context'
  );

  write(path, s);
}

patchStep3();
patchComposer();
patchReview();
patchPublicReportService();
patchHarassmentPage();
patchLocationSelector();
patchExplore();
patchSearch();
patchReportDetail();

console.log('Applied harassment classification and searchable-select feature patches.');
