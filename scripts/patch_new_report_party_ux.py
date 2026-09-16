from pathlib import Path


def replace_exact(text: str, old: str, new: str, label: str, expected: int = 1) -> str:
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"{label}: expected {expected} occurrence(s), found {count}")
    return text.replace(old, new)


step3_path = Path('src/components/report-composer/Step3ComplaintDetails.tsx')
step3 = step3_path.read_text(encoding='utf-8')

step3 = replace_exact(
    step3,
    "    const showsPartySection = segment === 'rickshaw' || segment === 'extortion';",
    "    const showsPartySection =\n      segment === 'rickshaw' ||\n      segment === 'extortion' ||\n      segment === 'public_safety' ||\n      segment === 'road_transport' ||\n      segment === 'illegal_occupation';",
    'Step3 supported party segments',
)

step3 = replace_exact(
    step3,
    '    // Contextual subject configuration for Rickshaw & Extortion',
    '    // Contextual subject configuration for categories that benefit from optional party details',
    'Step3 subject config comment',
)

step3 = replace_exact(
    step3,
    "      parties: isChargingStationOperator\n        ? (hasChargingStationOperatorData || initialOpenSection === 'parties')\n        : segment === 'extortion'\n        ? (hasExtortionPartyData || initialOpenSection === 'parties')\n        : showsPartySection,",
    "      parties: isChargingStationOperator\n        ? (hasChargingStationOperatorData || initialOpenSection === 'parties')\n        : showsPartySection\n        ? (hasExtortionPartyData || initialOpenSection === 'parties')\n        : false,",
    'Step3 initial party accordion state',
)

step3 = replace_exact(
    step3,
    "    // Auto-expand extortion parties if data is restored/loaded asynchronously\n    const prevHasExtortionDataRef = React.useRef(hasExtortionPartyData);\n    useEffect(() => {\n      if (segment === 'extortion' && !prevHasExtortionDataRef.current && hasExtortionPartyData) {\n        setOpenSections((prev) => ({ ...prev, parties: true }));\n      }\n      prevHasExtortionDataRef.current = hasExtortionPartyData;\n    }, [segment, hasExtortionPartyData]);",
    "    // Auto-expand contextual party details if data is restored/loaded asynchronously\n    const prevHasExtortionDataRef = React.useRef(hasExtortionPartyData);\n    useEffect(() => {\n      if (showsPartySection && !isChargingStationOperator && !prevHasExtortionDataRef.current && hasExtortionPartyData) {\n        setOpenSections((prev) => ({ ...prev, parties: true }));\n      }\n      prevHasExtortionDataRef.current = hasExtortionPartyData;\n    }, [showsPartySection, isChargingStationOperator, hasExtortionPartyData]);",
    'Step3 party auto expand',
)

step3 = replace_exact(
    step3,
    "      if (showsPartySection && secKey === 'parties' && !isChargingStationOperator && segment !== 'extortion') return;\n",
    '',
    'Step3 party accordion toggle guard',
)

step3 = replace_exact(
    step3,
    '    // Mentioned Parties Handlers (Extortion only)',
    '    // Mentioned Parties Handlers (shared contextual party data)',
    'Step3 mentioned party comment',
)

step3 = replace_exact(
    step3,
    "        {/* SECTION 3 (EXTORTION): Party Info - COLLAPSIBLE (DEFAULT: COLLAPSED UNLESS DATA EXISTS) */}\n        {showsPartySection && segment === 'extortion' && (",
    "        {/* SECTION 3: Contextual Party Info - COLLAPSIBLE (DEFAULT: COLLAPSED UNLESS DATA EXISTS) */}\n        {showsPartySection && !isChargingStationOperator && subjectConfig && (",
    'Step3 contextual party section condition',
)

step3 = replace_exact(
    step3,
    "            title={\n              language === 'bn'\n                ? '৩. চাঁদা দাবিকারীর তথ্য (ঐচ্ছিক)'\n                : '3. Extortion party information (optional)'\n            }",
    "            title={\n              language === 'bn'\n                ? `৩. ${subjectConfig.sectionTitleBn} (ঐচ্ছিক)`\n                : `3. ${subjectConfig.sectionTitleEn} (optional)`\n            }",
    'Step3 contextual party title',
)

step3 = replace_exact(
    step3,
    "          >\n            <div className=\"space-y-4 pt-1 text-left\">\n              <div className=\"space-y-3 sm:space-y-3.5\">",
    "          >\n            <div className=\"space-y-4 pt-1 text-left\">\n              <p className=\"text-[13px] text-ui-content-secondary leading-relaxed\">\n                {language === 'bn' ? subjectConfig.questionBn : subjectConfig.questionEn}\n              </p>\n              <div className=\"space-y-3 sm:space-y-3.5\">",
    'Step3 contextual helper copy',
)

step3 = replace_exact(
    step3,
    "                      {language === 'bn' ? 'নাম / পরিচিতি' : 'Name / known identity'}",
    "                      {language === 'bn'\n                        ? subjectConfig.nameLabelBn || 'নাম / পরিচিতি'\n                        : subjectConfig.nameLabelEn || 'Name / known identity'}",
    'Step3 primary name label',
)

step3 = replace_exact(
    step3,
    "                      placeholder={\n                        language === 'bn'\n                          ? 'চাঁদা দাবিকারীর নাম বা পরিচিত নাম জানা থাকলে লিখুন'\n                          : \"Enter the person's or party's name if known\"\n                      }",
    "                      placeholder={\n                        language === 'bn'\n                          ? subjectConfig.namePlaceholderBn || 'নাম বা পরিচিতি জানা থাকলে লিখুন'\n                          : subjectConfig.namePlaceholderEn || 'Enter the name or known identity if available'\n                      }",
    'Step3 primary name placeholder',
)

step3 = replace_exact(
    step3,
    "                      {language === 'bn' ? 'ভূমিকা / পদবি' : 'Role / designation'}",
    "                      {language === 'bn'\n                        ? subjectConfig.roleLabelBn || 'ভূমিকা / পদবি'\n                        : subjectConfig.roleLabelEn || 'Role / designation'}",
    'Step3 primary role label',
)

step3 = replace_exact(
    step3,
    "                      placeholder={\n                        language === 'bn'\n                          ? 'যেমন: লাইনম্যান, ম্যানেজার, স্থানীয় প্রতিনিধি'\n                          : 'e.g. Lineman, Manager, Local Representative'\n                      }",
    "                      placeholder={\n                        language === 'bn'\n                          ? subjectConfig.rolePlaceholderBn || 'ভূমিকা বা পদবি জানা থাকলে লিখুন'\n                          : subjectConfig.rolePlaceholderEn || 'Enter the role or designation if known'\n                      }",
    'Step3 primary role placeholder',
)

step3 = replace_exact(
    step3,
    "                      {language === 'bn' ? 'দল / সংগঠন / সমিতি' : 'Group / organization / association'}",
    "                      {language === 'bn'\n                        ? subjectConfig.organizationLabelBn || 'দল / প্রতিষ্ঠান / সংগঠন'\n                        : subjectConfig.organizationLabelEn || 'Group / organization'}",
    'Step3 organization label',
)

step3 = replace_exact(
    step3,
    "                      placeholder={\n                        language === 'bn'\n                          ? 'সংশ্লিষ্ট দল, সিন্ডিকেট, সমিতি বা প্রতিষ্ঠানের নাম'\n                          : 'Related group, syndicate, association, or organization'\n                      }",
    "                      placeholder={\n                        language === 'bn'\n                          ? subjectConfig.organizationPlaceholderBn || 'সংশ্লিষ্ট দল, প্রতিষ্ঠান বা সংগঠনের নাম জানা থাকলে লিখুন'\n                          : subjectConfig.organizationPlaceholderEn || 'Enter the related group or organization if known'\n                      }",
    'Step3 organization placeholder',
)

step3 = replace_exact(
    step3,
    "                    placeholder={\n                      language === 'bn'\n                        ? 'চেহারা, গাড়ির নম্বর, অবস্থান সূত্র বা অন্য কোনো পরিচিত তথ্য'\n                        : 'Appearance, vehicle number, location clues, or any other identifying information'\n                    }",
    "                    placeholder={\n                      language === 'bn'\n                        ? subjectConfig.identifyingPlaceholderBn || 'চেহারা, যানবাহন, অবস্থান সূত্র বা অন্য কোনো শনাক্তকারী তথ্য'\n                        : subjectConfig.identifyingPlaceholderEn || 'Appearance, vehicle, location clues, or other identifying details'\n                    }",
    'Step3 identifying placeholder',
)

step3_path.write_text(step3, encoding='utf-8')

step4_path = Path('src/components/report-composer/Step4Review.tsx')
step4 = step4_path.read_text(encoding='utf-8')

step4 = replace_exact(
    step4,
    "  const showsPartySection =\n    (segment === 'extortion' && hasExtortionPartyData) ||\n    (segment === 'rickshaw' && hasRickshawOperatorData);",
    "  const supportsContextualPartySection =\n    segment === 'extortion' ||\n    segment === 'public_safety' ||\n    segment === 'road_transport' ||\n    segment === 'illegal_occupation';\n\n  const showsPartySection =\n    (supportsContextualPartySection && hasExtortionPartyData) ||\n    (segment === 'rickshaw' && hasRickshawOperatorData);",
    'Step4 supported party segments',
)

step4 = replace_exact(
    step4,
    "    : segment === 'extortion'\n    ? (",
    "    : supportsContextualPartySection\n    ? (",
    'Step4 contextual target summary',
)

step4 = replace_exact(
    step4,
    "        {/* Section 4 (RICKSHAW & EXTORTION): 3. Contextual Target Details */}",
    "        {/* Section 4: 3. Contextual Target / Party Details */}",
    'Step4 party section comment',
)

step4 = replace_exact(
    step4,
    "                  : segment === 'extortion'\n                  ? '৩. চাঁদা দাবিকারীর তথ্য (ঐচ্ছিক)'\n                  : subjectConfig?.sectionTitleBn || '৩. সংশ্লিষ্ট পক্ষ'",
    "                  : subjectConfig\n                  ? `৩. ${subjectConfig.sectionTitleBn} (ঐচ্ছিক)`\n                  : '৩. সংশ্লিষ্ট পক্ষের তথ্য (ঐচ্ছিক)'",
    'Step4 Bengali contextual title',
)

step4 = replace_exact(
    step4,
    "                  : segment === 'extortion'\n                  ? '3. Extortion Party Information (Optional)'\n                  : subjectConfig?.sectionTitleEn || '3. Target Details'",
    "                  : subjectConfig\n                  ? `3. ${subjectConfig.sectionTitleEn} (optional)`\n                  : '3. Related party information (optional)'",
    'Step4 English contextual title',
)

step4 = replace_exact(
    step4,
    "            ) : segment === 'extortion' ? (",
    "            ) : supportsContextualPartySection ? (",
    'Step4 contextual party details render',
)

step4_path.write_text(step4, encoding='utf-8')

print('Contextual party UX patch applied successfully.')
