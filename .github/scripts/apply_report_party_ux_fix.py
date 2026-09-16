from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    return text.replace(old, new, 1)


step3_path = Path('src/components/report-composer/Step3ComplaintDetails.tsx')
step3 = step3_path.read_text()

step3 = replace_once(step3, """    // Segment structure conditions
    const showsPartySection = segment === 'rickshaw' || segment === 'extortion';
    const showsIdentitySection = segment === 'harassment';
    const isUtilityReport = (segment as string) === 'utility' || segment === 'load_shedding';
""", """    // Segment structure conditions
    const showsIdentitySection = segment === 'harassment';
    const isUtilityReport = (segment as string) === 'utility' || segment === 'load_shedding';
""", 'step3 segment structure')

step3 = replace_once(step3, """    // Contextual subject configuration for Rickshaw & Extortion
    const subjectConfig = getReportSubjectConfig(segment, formData.subcategoryId);
""", """    // Contextual subject configuration is the single source of truth for optional
    // person / party collection across all supported report categories.
    const subjectConfig = getReportSubjectConfig(segment, formData.subcategoryId);
    const showsPartySection = Boolean(subjectConfig);
""", 'step3 subject config')

step3 = replace_once(step3, """    const hasExtortionPrimaryPartyData = Boolean(
      formData.reportedSubject?.trim() ||
      formData.roleOrDesignation?.trim() ||
      formData.organization?.trim() ||
      formData.publicProfileHandle?.trim() ||
      formData.identifyingDescription?.trim()
    );

    const hasExtortionPartyData = Boolean(
      hasExtortionPrimaryPartyData ||
      (formData.mentionedParties && formData.mentionedParties.some(isMeaningfulMentionedParty))
    );
""", """    const hasPartyData = Boolean(
      formData.reportedSubject?.trim() ||
      formData.roleOrDesignation?.trim() ||
      formData.organization?.trim() ||
      formData.publicProfileHandle?.trim() ||
      formData.identifyingDescription?.trim() ||
      (formData.mentionedParties && formData.mentionedParties.some(isMeaningfulMentionedParty))
    );
""", 'step3 party data')

step3 = replace_once(step3, """      parties: isChargingStationOperator
        ? (hasChargingStationOperatorData || initialOpenSection === 'parties')
        : segment === 'extortion'
        ? (hasExtortionPartyData || initialOpenSection === 'parties')
        : showsPartySection,
""", """      parties: isChargingStationOperator
        ? (hasChargingStationOperatorData || initialOpenSection === 'parties')
        : (hasPartyData || initialOpenSection === 'parties'),
""", 'step3 initial party disclosure')

step3 = replace_once(step3, """    // Auto-expand extortion parties if data is restored/loaded asynchronously
    const prevHasExtortionDataRef = React.useRef(hasExtortionPartyData);
    useEffect(() => {
      if (segment === 'extortion' && !prevHasExtortionDataRef.current && hasExtortionPartyData) {
        setOpenSections((prev) => ({ ...prev, parties: true }));
      }
      prevHasExtortionDataRef.current = hasExtortionPartyData;
    }, [segment, hasExtortionPartyData]);
""", """    // Auto-expand contextual party details if data is restored/loaded asynchronously.
    const prevHasPartyDataRef = React.useRef(hasPartyData);
    useEffect(() => {
      if (showsPartySection && !isChargingStationOperator && !prevHasPartyDataRef.current && hasPartyData) {
        setOpenSections((prev) => ({ ...prev, parties: true }));
      }
      prevHasPartyDataRef.current = hasPartyData;
    }, [showsPartySection, isChargingStationOperator, hasPartyData]);
""", 'step3 party auto expand')

step3 = replace_once(step3, """      if (secKey === 'narrative' || secKey === 'location') return;
      if (showsPartySection && secKey === 'parties' && !isChargingStationOperator && segment !== 'extortion') return;
      if (showsIdentitySection && secKey === 'identity') return;
""", """      if (secKey === 'narrative' || secKey === 'location') return;
      if (showsIdentitySection && secKey === 'identity') return;
""", 'step3 accordion toggle')

step3 = step3.replace('// Mentioned Parties Handlers (Extortion only)', '// Mentioned Parties Handlers (optional people / organizations)')

step3 = replace_once(step3, """    // Check if extortion has primary party data
    const hasPrimaryPartyData = Boolean(
      formData.reportedSubject?.trim() ||
      formData.organization?.trim() ||
      formData.identifyingDescription?.trim() ||
      (formData.mentionedParties && formData.mentionedParties.length > 0)
    );
""", """    // Primary party details gate the optional \"add another party\" action.
    const hasPrimaryPartyData = Boolean(
      formData.reportedSubject?.trim() ||
      formData.roleOrDesignation?.trim() ||
      formData.organization?.trim() ||
      formData.publicProfileHandle?.trim() ||
      formData.identifyingDescription?.trim()
    );
""", 'step3 primary party data')

step3 = step3.replace('/* SECTION 3 (RICKSHAW & EXTORTION): Contextual Target / Party Info - NON-COLLAPSIBLE */', '/* SECTION 3: Contextual Target / Party Info */')
step3 = step3.replace('/* SECTION 3 (EXTORTION): Party Info - COLLAPSIBLE (DEFAULT: COLLAPSED UNLESS DATA EXISTS) */', '/* SECTION 3: Contextual Party Info - COLLAPSIBLE (DEFAULT: COLLAPSED UNLESS DATA EXISTS) */')

step3 = replace_once(step3, """        {showsPartySection && segment === 'extortion' && (
""", """        {showsPartySection && !isChargingStationOperator && subjectConfig && (
""", 'step3 generic party condition')

step3 = replace_once(step3, """            title={
              language === 'bn'
                ? '৩. চাঁদা দাবিকারীর তথ্য (ঐচ্ছিক)'
                : '3. Extortion party information (optional)'
            }
            summary={
              hasExtortionPartyData ? (
""", """            title={
              language === 'bn'
                ? `${subjectConfig.sectionTitleBn} (ঐচ্ছিক)`
                : `${subjectConfig.sectionTitleEn} (optional)`
            }
            summary={
              hasPartyData ? (
""", 'step3 contextual party title')

step3 = replace_once(step3, """            <div className="space-y-4 pt-1 text-left">
              <div className="space-y-3 sm:space-y-3.5">
""", """            <div className="space-y-4 pt-1 text-left">
              <p className="text-[13px] text-ui-content-secondary leading-relaxed">
                {language === 'bn' ? subjectConfig.questionBn : subjectConfig.questionEn}
              </p>

              <Select
                id="contextual-party-type-select"
                label={language === 'bn' ? 'সংশ্লিষ্ট পক্ষের ধরন' : 'Involved party type'}
                value={formData.subjectType || ''}
                onChange={(event) =>
                  onUpdateFormData({ subjectType: event.target.value as SubjectTypeValue })
                }
                placeholder={language === 'bn' ? '-- ধরন নির্বাচন করুন --' : '-- Select type --'}
                options={subjectConfig.options.map((option) => ({
                  value: option.value,
                  label: language === 'bn' ? option.labelBn : option.labelEn,
                }))}
              />

              <div className="space-y-3 sm:space-y-3.5">
""", 'step3 contextual question/type')

replacements = {
    "'চাঁদা দাবিকারীর নাম বা পরিচিত নাম জানা থাকলে লিখুন'": "'নাম বা পরিচিত পরিচয় জানা থাকলে লিখুন'",
    "'যেমন: লাইনম্যান, ম্যানেজার, স্থানীয় প্রতিনিধি'": "'যেমন: কর্মকর্তা, কর্মচারী, চালক, ঠিকাদার, প্রতিনিধি'",
    "'e.g. Lineman, Manager, Local Representative'": "'e.g. Officer, Employee, Driver, Contractor, Representative'",
    "'দল / সংগঠন / সমিতি'": "'প্রতিষ্ঠান / দল / সংগঠন'",
    "'Group / organization / association'": "'Organization / group'",
    "'সংশ্লিষ্ট দল, সিন্ডিকেট, সমিতি বা প্রতিষ্ঠানের নাম'": "'সংশ্লিষ্ট অফিস, প্রতিষ্ঠান, কোম্পানি, দল বা সংগঠনের নাম'",
    "'Related group, syndicate, association, or organization'": "'Related office, organization, company, group, or agency'",
    "'চেহারা, গাড়ির নম্বর, অবস্থান সূত্র বা অন্য কোনো পরিচিত তথ্য'": "'চেহারা, যানবাহনের নম্বর, অবস্থান সূত্র বা অন্য কোনো শনাক্তকারী তথ্য'",
}
for old, new in replacements.items():
    step3 = step3.replace(old, new)

step3 = step3.replace('{hasExtortionPrimaryPartyData && (', '{hasPrimaryPartyData && (')
step3_path.write_text(step3)

step4_path = Path('src/components/report-composer/Step4Review.tsx')
step4 = step4_path.read_text()

step4 = replace_once(step4, """  const hasExtortionPrimaryPartyData = Boolean(
    formData.reportedSubject?.trim() ||
    formData.roleOrDesignation?.trim() ||
    formData.organization?.trim() ||
    formData.publicProfileHandle?.trim() ||
    formData.identifyingDescription?.trim()
  );

  const meaningfulMentionedParties = (formData.mentionedParties || []).filter(isMeaningfulMentionedParty);

  const hasExtortionPartyData =
    hasExtortionPrimaryPartyData || meaningfulMentionedParties.length > 0;

  const showsPartySection =
    (segment === 'extortion' && hasExtortionPartyData) ||
    (segment === 'rickshaw' && hasRickshawOperatorData);
  const showsIdentitySection = segment === 'harassment';

  const currentSubcategoryOption = (SEGMENT_SUBCATEGORIES[segment] || []).find(
    (s) => s.id === formData.subcategoryId
  );

  const subjectConfig = getReportSubjectConfig(segment, formData.subcategoryId);
""", """  const hasPrimaryPartyData = Boolean(
    formData.reportedSubject?.trim() ||
    formData.roleOrDesignation?.trim() ||
    formData.organization?.trim() ||
    formData.publicProfileHandle?.trim() ||
    formData.identifyingDescription?.trim()
  );

  const meaningfulMentionedParties = (formData.mentionedParties || []).filter(isMeaningfulMentionedParty);
  const hasPartyData = hasPrimaryPartyData || meaningfulMentionedParties.length > 0;

  const currentSubcategoryOption = (SEGMENT_SUBCATEGORIES[segment] || []).find(
    (s) => s.id === formData.subcategoryId
  );

  const subjectConfig = getReportSubjectConfig(segment, formData.subcategoryId);
  const showsPartySection =
    (isRickshawChargingStation && hasRickshawOperatorData) ||
    (!isRickshawChargingStation && Boolean(subjectConfig) && hasPartyData);
  const showsIdentitySection = segment === 'harassment';
""", 'step4 party visibility')

step4 = replace_once(step4, """    : segment === 'extortion'
    ? (
""", """    : subjectConfig
    ? (
""", 'step4 contextual target summary')

step4 = replace_once(step4, """            title={
              language === 'bn'
                ? isRickshawChargingStation
                  ? '৩. চার্জিং স্টেশন / পরিচালনাকারীর তথ্য (ঐচ্ছিক)'
                  : segment === 'extortion'
                  ? '৩. চাঁদা দাবিকারীর তথ্য (ঐচ্ছিক)'
                  : subjectConfig?.sectionTitleBn || '৩. সংশ্লিষ্ট পক্ষ'
                : isRickshawChargingStation
                  ? '3. Charging Station / Operator Information (Optional)'
                  : segment === 'extortion'
                  ? '3. Extortion Party Information (Optional)'
                  : subjectConfig?.sectionTitleEn || '3. Target Details'
            }
""", """            title={
              language === 'bn'
                ? isRickshawChargingStation
                  ? '৩. চার্জিং স্টেশন / পরিচালনাকারীর তথ্য (ঐচ্ছিক)'
                  : `${subjectConfig?.sectionTitleBn || '৩. সংশ্লিষ্ট পক্ষের তথ্য'} (ঐচ্ছিক)`
                : isRickshawChargingStation
                  ? '3. Charging Station / Operator Information (Optional)'
                  : `${subjectConfig?.sectionTitleEn || '3. Involved Party Information'} (Optional)`
            }
""", 'step4 contextual title')

step4 = replace_once(step4, """            ) : segment === 'extortion' ? (
""", """            ) : subjectConfig ? (
""", 'step4 generic detailed party review')

step4 = step4.replace('Primary Extortion Party', 'Primary Involved Party')
step4 = step4.replace('{hasExtortionPrimaryPartyData && (', '{hasPrimaryPartyData && (')
step4 = step4.replace("${hasExtortionPrimaryPartyData ? 'pt-2 border-t border-ui-stroke-subtle/50' : ''}", "${hasPrimaryPartyData ? 'pt-2 border-t border-ui-stroke-subtle/50' : ''}")
step4 = step4.replace("'দল / সংগঠন / সমিতি: '", "'প্রতিষ্ঠান / দল / সংগঠন: '")
step4 = step4.replace("'Group / Organization / Association: '", "'Organization / Group: '")
step4_path.write_text(step4)

print('Scoped report party UX transformations applied successfully.')
