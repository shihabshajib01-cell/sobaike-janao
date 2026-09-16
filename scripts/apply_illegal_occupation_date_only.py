from pathlib import Path


def replace_exact(text, old, new, label, expected=1):
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{label}: expected {expected}, found {count}')
    return text.replace(old, new)

# Step 3: Illegal Occupation is date-only (no time/frequency controls)
p = Path('src/components/report-composer/Step3ComplaintDetails.tsx')
t = p.read_text(encoding='utf-8')
t = replace_exact(
    t,
    "    const isBriberyReport = segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';\n",
    "    const isBriberyReport = segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';\n    const isIllegalOccupation = segment === 'illegal_occupation';\n",
    'step3 illegal occupation flag',
)
t = replace_exact(
    t,
    "    // Conditional: hide frequency for Illegal Charging Station reports\n    const hideFrequency =\n      segment === 'rickshaw' && formData.subcategoryId === 'charging-station-location';\n",
    "    // Conditional timeline controls: Illegal Occupation is date-only; charging-station reports hide frequency.\n    const hideIncidentTime = isIllegalOccupation;\n    const hideFrequency =\n      isIllegalOccupation ||\n      (segment === 'rickshaw' && formData.subcategoryId === 'charging-station-location');\n",
    'step3 timeline conditions',
)
t = replace_exact(
    t,
    "            {/* Incident Date, Time & Frequency */}\n            <div className={`grid grid-cols-1 ${hideFrequency ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>\n",
    "            {/* Incident timeline */}\n            <div className={`grid grid-cols-1 ${hideIncidentTime && hideFrequency ? 'sm:grid-cols-1' : hideFrequency ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3`}>\n",
    'step3 timeline grid',
)
old_time = '''              <div>\n                <label\n                  htmlFor="complaint-time-input"\n                  className="block text-[13px] font-bold text-ui-content-primary mb-1"\n                >\n                  <div className="flex items-center gap-1.5">\n                    <Clock className="w-3.5 h-3.5 text-ui-content-secondary" />\n                    <span>{language === 'bn' ? 'সময় (ঐচ্ছিক)' : 'Time (optional)'}</span>\n                  </div>\n                </label>\n                <input\n                  id="complaint-time-input"\n                  type="time"\n                  value={formData.incidentTime || ''}\n                  onChange={(e) => onUpdateFormData({ incidentTime: e.target.value })}\n                  className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px]"\n                />\n              </div>\n'''
new_time = '''              {!hideIncidentTime && (\n                <div>\n                  <label\n                    htmlFor="complaint-time-input"\n                    className="block text-[13px] font-bold text-ui-content-primary mb-1"\n                  >\n                    <div className="flex items-center gap-1.5">\n                      <Clock className="w-3.5 h-3.5 text-ui-content-secondary" />\n                      <span>{language === 'bn' ? 'সময় (ঐচ্ছিক)' : 'Time (optional)'}</span>\n                    </div>\n                  </label>\n                  <input\n                    id="complaint-time-input"\n                    type="time"\n                    value={formData.incidentTime || ''}\n                    onChange={(e) => onUpdateFormData({ incidentTime: e.target.value })}\n                    className="w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px]"\n                  />\n                </div>\n              )}\n'''
t = replace_exact(t, old_time, new_time, 'step3 hide time')
p.write_text(t, encoding='utf-8')

# Step 4: Review must mirror the date-only Illegal Occupation contract.
p = Path('src/components/report-composer/Step4Review.tsx')
t = p.read_text(encoding='utf-8')
t = replace_exact(
    t,
    "  const isBriberyReport = segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';\n",
    "  const isBriberyReport = segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';\n  const isIllegalOccupation = segment === 'illegal_occupation';\n",
    'step4 illegal occupation flag',
)
t = replace_exact(
    t,
    "  // Conditional: hide frequency for Illegal Charging Station reports & Utility complaints\n  const hideFrequency =\n    (segment === 'rickshaw' && formData.subcategoryId === 'charging-station-location') ||\n    isUtilityReport;\n",
    "  // Conditional timeline controls: Illegal Occupation is date-only.\n  const hideIncidentTime = isIllegalOccupation;\n  const hideFrequency =\n    isIllegalOccupation ||\n    (segment === 'rickshaw' && formData.subcategoryId === 'charging-station-location') ||\n    isUtilityReport;\n",
    'step4 timeline conditions',
)
t = replace_exact(
    t,
    "              : language === 'bn'\n              ? '১. ঘটনার বিবরণ ও সময়কাল'\n              : '1. What Happened & Timeline'\n",
    "              : isIllegalOccupation\n              ? language === 'bn'\n                ? '১. ঘটনার বিবরণ'\n                : '1. What Happened'\n              : language === 'bn'\n              ? '১. ঘটনার বিবরণ ও সময়কাল'\n              : '1. What Happened & Timeline'\n",
    'step4 incident title',
)
t = replace_exact(
    t,
    "                {formData.incidentTime && (\n",
    "                {!hideIncidentTime && formData.incidentTime && (\n",
    'step4 hide time',
)
p.write_text(t, encoding='utf-8')

# Submission: suppress user time for Illegal Occupation and keep DB-required frequency on its technical default.
p = Path('src/components/report-composer/ReportComposerModal.tsx')
t = p.read_text(encoding='utf-8')
t = replace_exact(
    t,
    "      const isBribery = formData.segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';\n",
    "      const isBribery = formData.segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';\n      const isIllegalOccupation = formData.segment === 'illegal_occupation';\n",
    'modal illegal occupation flag',
)
t = replace_exact(
    t,
    "        incidentTime:\n          formData.subcategoryId === 'excess-electricity-bill'\n            ? undefined\n            : formData.incidentTime || undefined,\n",
    "        incidentTime:\n          formData.subcategoryId === 'excess-electricity-bill' || isIllegalOccupation\n            ? undefined\n            : formData.incidentTime || undefined,\n",
    'modal suppress illegal occupation time',
)
t = replace_exact(
    t,
    "        frequency: formData.frequency || 'one-time',\n",
    "        frequency: isIllegalOccupation ? 'one-time' : formData.frequency || 'one-time',\n",
    'modal normalize illegal occupation frequency',
)
p.write_text(t, encoding='utf-8')

print('Illegal Occupation date-only patch applied.')
