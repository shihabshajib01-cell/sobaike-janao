from pathlib import Path


def replace_exact(text: str, old: str, new: str, label: str, expected: int = 1) -> str:
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"{label}: expected {expected} occurrence(s), found {count}")
    return text.replace(old, new)


path = Path('src/components/report-composer/Step4Review.tsx')
text = path.read_text(encoding='utf-8')

text = replace_exact(
    text,
    "                          {language === 'bn' ? 'নাম / পরিচিতি: ' : 'Name / Known Identity: '}",
    "                          {language === 'bn'\n                            ? `${subjectConfig?.nameLabelBn || 'নাম / পরিচিতি'}: `\n                            : `${subjectConfig?.nameLabelEn || 'Name / known identity'}: `}",
    'contextual primary name label',
    1,
)

text = replace_exact(
    text,
    "                          {language === 'bn' ? 'ভূমিকা / পদবি: ' : 'Role / Designation: '}",
    "                          {language === 'bn'\n                            ? `${subjectConfig?.roleLabelBn || 'ভূমিকা / পদবি'}: `\n                            : `${subjectConfig?.roleLabelEn || 'Role / designation'}: `}",
    'contextual primary role label',
    1,
)

text = replace_exact(
    text,
    "                          {language === 'bn' ? 'দল / সংগঠন / সমিতি: ' : 'Group / Organization / Association: '}",
    "                          {language === 'bn'\n                            ? `${subjectConfig?.organizationLabelBn || 'দল / প্রতিষ্ঠান / সংগঠন'}: `\n                            : `${subjectConfig?.organizationLabelEn || 'Group / organization'}: `}",
    'contextual primary organization label',
    1,
)

text = replace_exact(
    text,
    "                              <span className=\"font-medium text-ui-content-secondary\">{language === 'bn' ? 'ভূমিকা / পদবি: ' : 'Role: '}</span>",
    "                              <span className=\"font-medium text-ui-content-secondary\">\n                                {language === 'bn'\n                                  ? `${subjectConfig?.roleLabelBn || 'ভূমিকা / পদবি'}: `\n                                  : `${subjectConfig?.roleLabelEn || 'Role'}: `}\n                              </span>",
    'contextual additional role label',
    1,
)

text = replace_exact(
    text,
    "                              <span className=\"font-medium text-ui-content-secondary\">{language === 'bn' ? 'দল / সমিতি: ' : 'Group / Org: '}</span>",
    "                              <span className=\"font-medium text-ui-content-secondary\">\n                                {language === 'bn'\n                                  ? `${subjectConfig?.organizationLabelBn || 'দল / প্রতিষ্ঠান / সংগঠন'}: `\n                                  : `${subjectConfig?.organizationLabelEn || 'Group / organization'}: `}\n                              </span>",
    'contextual additional organization label',
    1,
)

path.write_text(text, encoding='utf-8')
print('Review labels aligned successfully.')
