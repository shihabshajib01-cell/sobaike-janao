from pathlib import Path
import re


def replace_exact(text, old, new, label, expected=1):
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f'{label}: expected {expected}, found {count}')
    return text.replace(old, new)


def replace_regex(text, pattern, repl, label, expected=1, flags=0):
    new_text, count = re.subn(pattern, repl, text, flags=flags)
    if count != expected:
        raise RuntimeError(f'{label}: expected {expected}, found {count}')
    return new_text

# 1) Category display naming
p = Path('src/theme/tokens.ts')
t = p.read_text(encoding='utf-8')
t = replace_exact(t, "nameBn: 'ঘুষ ও চাঁদাবাজি',\n    nameEn: 'Bribery & Extortion',\n    shortNameBn: 'ঘুষ ও চাঁদাবাজি',\n    shortNameEn: 'Bribery & Extortion',\n    descriptionBn: 'ঘুষ দাবি, ঘুষ প্রদান, চাঁদাবাজি বা জোরপূর্বক অর্থ আদায়ের ঘটনা জানান।',\n    descriptionEn: 'Report bribery, extortion, illegal tolls, or coercive payment demands.',", "nameBn: 'চাঁদাবাজি ও ঘুষ',\n    nameEn: 'Extortion & Bribery',\n    shortNameBn: 'চাঁদাবাজি ও ঘুষ',\n    shortNameEn: 'Extortion & Bribery',\n    descriptionBn: 'চাঁদাবাজি, ঘুষ বা জোরপূর্বক অর্থ আদায়ের ঘটনা জানান।',\n    descriptionEn: 'Report extortion, bribery, illegal tolls, or coercive payment demands.',", 'segment naming')
p.write_text(t, encoding='utf-8')

# 2) Public feed taxonomy: one bribery subtype
p = Path('src/data/categories.ts')
t = p.read_text(encoding='utf-8')
t = replace_exact(t, "    { id: 'bribe-demanded-service', nameBn: 'সেবা পেতে ঘুষ দাবি', nameEn: 'Bribe Demanded for a Service' },\n    { id: 'bribe-paid', nameBn: 'ঘুষ প্রদান', nameEn: 'Bribe Paid' },", "    { id: 'bribe-demanded-service', nameBn: 'ঘুষ', nameEn: 'Bribery' },", 'categories bribery collapse')
p.write_text(t, encoding='utf-8')

# 3) Composer taxonomy: one bribery subtype
p = Path('src/data/reportOptions.ts')
t = p.read_text(encoding='utf-8')
pattern = r"    \{\n      id: 'bribe-demanded-service',\n.*?    \},\n    \{\n      id: 'bribe-paid',\n.*?    \},\n(?=    \{\n      id: 'shop-business')"
repl = """    {
      id: 'bribe-demanded-service',
      nameBn: 'ঘুষ',
      nameEn: 'Bribery',
      descriptionBn: 'সেবা, অনুমোদন, প্রক্রিয়া বা সুবিধার সঙ্গে সংশ্লিষ্ট ঘুষের ঘটনা জানান',
      descriptionEn: 'Report bribery connected to a service, approval, process, or benefit',
      isSensitive: true,
    },
"""
t = replace_regex(t, pattern, repl, 'report options bribery collapse', flags=re.S)
p.write_text(t, encoding='utf-8')

# 4) Subject copy for canonical bribery subtype
p = Path('src/data/reportSubjectOptions.ts')
t = p.read_text(encoding='utf-8')
pattern = r"  'extortion:bribe-demanded-service': \{\n.*?\n  \},\n  'extortion:bribe-paid':"
repl = """  'extortion:bribe-demanded-service': {
    sectionTitleBn: 'ঘুষের সঙ্গে সংশ্লিষ্ট ব্যক্তি / দপ্তরের তথ্য',
    sectionTitleEn: 'Person / office involved in the bribery',
    questionBn: 'ঘুষের সঙ্গে কোন ব্যক্তি, কর্মকর্তা বা দপ্তর জড়িত ছিল?',
    questionEn: 'Which person, officer, or office was involved in the bribery?',
    nameLabelBn: 'ব্যক্তি / কর্মকর্তা / দপ্তরের নাম',
    nameLabelEn: 'Person / officer / office name',
    namePlaceholderBn: 'নাম বা পরিচিতি জানা থাকলে লিখুন',
    namePlaceholderEn: 'Enter the name or known identity if known',
    roleLabelBn: 'পদবি / দায়িত্ব',
    roleLabelEn: 'Designation / responsibility',
    rolePlaceholderBn: 'যেমন: কর্মকর্তা, কর্মচারী, সেবা প্রদানকারী',
    rolePlaceholderEn: 'e.g. Officer, Employee, Service provider',
    organizationLabelBn: 'দপ্তর / প্রতিষ্ঠান / সংস্থা',
    organizationLabelEn: 'Office / organization / agency',
    organizationPlaceholderBn: 'সংশ্লিষ্ট দপ্তর, প্রতিষ্ঠান বা সংস্থার নাম',
    organizationPlaceholderEn: 'Related office, organization, or agency',
    identifyingPlaceholderBn: 'কাউন্টার, কক্ষ, শাখা, চেহারা বা অন্য শনাক্তকারী তথ্য',
    identifyingPlaceholderEn: 'Counter, room, branch, appearance, or other identifying details',
    options: [
      { value: 'individual', labelBn: 'ব্যক্তি / কর্মকর্তা', labelEn: 'Person / Officer' },
      { value: 'organization', labelBn: 'দপ্তর / প্রতিষ্ঠান', labelEn: 'Office / Organization' },
      { value: 'group', labelBn: 'একাধিক ব্যক্তি / দল', labelEn: 'Multiple people / Group' },
      UNKNOWN_OPTION,
    ],
  },
  'extortion:bribe-paid':"""
t = replace_regex(t, pattern, repl, 'canonical bribery subject copy', flags=re.S)
p.write_text(t, encoding='utf-8')

# 5) Draft/domain fields + flow version bump
p = Path('src/services/types.ts')
t = p.read_text(encoding='utf-8')
t = replace_exact(t, "  previousBillAmount?: number | string;\n  frequency: 'one-time' | 'repeated';", "  previousBillAmount?: number | string;\n  briberyDepartment?: string;\n  briberyService?: string;\n  briberyAmount?: number | string;\n  frequency: 'one-time' | 'repeated';", 'submitted bribery fields')
t = replace_exact(t, "export const CURRENT_REPORT_FLOW_VERSION = 4;", "export const CURRENT_REPORT_FLOW_VERSION = 5;", 'flow version')
t = replace_exact(t, "  previousBillAmount?: number | string;\n  frequency: 'one-time' | 'repeated';", "  previousBillAmount?: number | string;\n  briberyDepartment: string;\n  briberyService: string;\n  briberyAmount?: number | string;\n  frequency: 'one-time' | 'repeated';", 'draft bribery fields')
p.write_text(t, encoding='utf-8')

p = Path('src/services/draftRepository.ts')
t = p.read_text(encoding='utf-8')
t = replace_exact(t, "  previousBillAmount: undefined,\n  frequency: 'one-time',", "  previousBillAmount: undefined,\n  briberyDepartment: '',\n  briberyService: '',\n  briberyAmount: undefined,\n  frequency: 'one-time',", 'initial draft bribery fields')
t = replace_exact(t, "    if (draft.previousBillAmount !== undefined && draft.previousBillAmount !== '') return true;", "    if (draft.previousBillAmount !== undefined && draft.previousBillAmount !== '') return true;\n    if (Boolean(draft.briberyDepartment?.trim())) return true;\n    if (Boolean(draft.briberyService?.trim())) return true;\n    if (draft.briberyAmount !== undefined && draft.briberyAmount !== '') return true;", 'meaningful draft bribery fields')
p.write_text(t, encoding='utf-8')

# 6) Modal resets + payload
p = Path('src/components/report-composer/ReportComposerModal.tsx')
t = p.read_text(encoding='utf-8')
t = replace_exact(t, "        previousBillAmount: undefined,\n      }));", "        previousBillAmount: undefined,\n        briberyDepartment: '',\n        briberyService: '',\n        briberyAmount: undefined,\n      }));", 'segment reset bribery fields')
t = replace_exact(t, "                previousBillAmount: undefined,\n              }", "                previousBillAmount: undefined,\n                briberyDepartment: '',\n                briberyService: '',\n                briberyAmount: undefined,\n              }", 'subcategory reset bribery fields')
t = replace_exact(t, "      const isHarassment = formData.segment === 'harassment';\n      const isPartySegment", "      const isHarassment = formData.segment === 'harassment';\n      const isBribery = formData.segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';\n      const isPartySegment", 'is bribery flag')
t = replace_exact(t, "        previousBillAmount:\n          formData.subcategoryId === 'excess-electricity-bill' && formData.previousBillAmount !== undefined && formData.previousBillAmount !== null && String(formData.previousBillAmount).trim() !== ''\n            ? Number(formData.previousBillAmount)\n            : undefined,\n        frequency:", "        previousBillAmount:\n          formData.subcategoryId === 'excess-electricity-bill' && formData.previousBillAmount !== undefined && formData.previousBillAmount !== null && String(formData.previousBillAmount).trim() !== ''\n            ? Number(formData.previousBillAmount)\n            : undefined,\n        briberyDepartment: isBribery ? formData.briberyDepartment?.trim() || undefined : undefined,\n        briberyService: isBribery ? formData.briberyService?.trim() || undefined : undefined,\n        briberyAmount:\n          isBribery && formData.briberyAmount !== undefined && formData.briberyAmount !== null && String(formData.briberyAmount).trim() !== ''\n            ? Number(formData.briberyAmount)\n            : undefined,\n        frequency:", 'payload bribery fields')
p.write_text(t, encoding='utf-8')

# 7) Step 3 UI + validation
p = Path('src/components/report-composer/Step3ComplaintDetails.tsx')
t = p.read_text(encoding='utf-8')
t = replace_exact(t, "import { ImageAttachmentPicker, AttachedImagePreview } from '../media/ImageAttachmentPicker';", "import { ImageAttachmentPicker, AttachedImagePreview } from '../media/ImageAttachmentPicker';\nimport { BRIBERY_DEPARTMENT_OPTIONS } from '../../data/briberyOptions';", 'step3 bribery import')
t = replace_exact(t, "    const isExcessElectricityBill = isUtilityReport && formData.subcategoryId === 'excess-electricity-bill';", "    const isExcessElectricityBill = isUtilityReport && formData.subcategoryId === 'excess-electricity-bill';\n    const isBriberyReport = segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';", 'step3 bribery flag')
t = replace_exact(t, "        // Auto-populate title if empty before validating\n        let effectiveTitle", "        if (isBriberyReport && formData.briberyAmount !== undefined && formData.briberyAmount !== null && String(formData.briberyAmount).trim() !== '') {\n          const amount = Number(formData.briberyAmount);\n          if (!Number.isFinite(amount) || amount <= 0) {\n            newErrors.briberyAmount = language === 'bn' ? 'শূন্যের বেশি টাকার পরিমাণ লিখুন।' : 'Enter an amount greater than 0.';\n          }\n        }\n\n        // Auto-populate title if empty before validating\n        let effectiveTitle", 'step3 bribery validation')
t = replace_exact(t, "            errors.previousBillAmount\n          )}", "            errors.previousBillAmount ||\n            errors.briberyAmount\n          )}", 'step3 accordion error')
anchor = """            {/* Incident Date, Time & Frequency */}
"""
insert = """            {isBriberyReport && (
              <div className=\"p-3.5 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle space-y-3\">
                <h4 className=\"text-[13px] font-bold text-ui-content-primary\">
                  {language === 'bn' ? 'ঘুষ সংক্রান্ত তথ্য' : 'Bribery details'}
                </h4>
                <div className=\"grid grid-cols-1 sm:grid-cols-3 gap-3\">
                  <SearchableSelect
                    id=\"bribery-department-select\"
                    label={language === 'bn' ? 'দপ্তর (ঐচ্ছিক)' : 'Department (optional)'}
                    value={formData.briberyDepartment || ''}
                    onChange={(value) => onUpdateFormData({ briberyDepartment: value })}
                    placeholder={language === 'bn' ? 'দপ্তর নির্বাচন করুন' : 'Select department'}
                    searchPlaceholder={language === 'bn' ? 'দপ্তর খুঁজুন...' : 'Search department...'}
                    noResultsText={language === 'bn' ? 'কোনো মিল পাওয়া যায়নি' : 'No matching department'}
                    clearable
                    options={BRIBERY_DEPARTMENT_OPTIONS.map((option) => ({
                      value: option.value,
                      label: language === 'bn' ? option.labelBn : option.labelEn,
                      keywords: [option.labelBn, option.labelEn],
                    }))}
                  />
                  <div>
                    <label htmlFor=\"bribery-service-input\" className=\"block text-[13px] font-bold text-ui-content-primary mb-1\">
                      {language === 'bn' ? 'সেবা বা প্রক্রিয়া (ঐচ্ছিক)' : 'Service or process (optional)'}
                    </label>
                    <input
                      id=\"bribery-service-input\"
                      type=\"text\"
                      value={formData.briberyService || ''}
                      onChange={(e) => onUpdateFormData({ briberyService: e.target.value })}
                      placeholder={language === 'bn' ? 'যেমন: মিউটেশন, পাসপোর্ট নবায়ন, লাইসেন্স' : 'e.g. mutation, passport renewal, licence'}
                      className=\"w-full px-3 py-2 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[14px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px]\"
                    />
                  </div>
                  <div>
                    <label htmlFor=\"bribery-amount-input\" className=\"block text-[13px] font-bold text-ui-content-primary mb-1\">
                      {language === 'bn' ? 'টাকার পরিমাণ (ঐচ্ছিক)' : 'Amount (BDT) (optional)'}
                    </label>
                    <input
                      id=\"bribery-amount-input\"
                      type=\"number\"
                      min=\"1\"
                      step=\"any\"
                      value={formData.briberyAmount !== undefined && formData.briberyAmount !== null ? formData.briberyAmount : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        onUpdateFormData({ briberyAmount: value === '' ? undefined : Number(value) });
                        if (errors.briberyAmount) setErrors((prev) => ({ ...prev, briberyAmount: '' }));
                      }}
                      placeholder={language === 'bn' ? 'যেমন: ৫০০০' : 'e.g. 5000'}
                      className={`w-full px-3 py-2 bg-ui-surface border rounded-xl text-[14px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[42px] ${errors.briberyAmount ? 'border-ui-error-border bg-ui-error-bg' : 'border-ui-stroke-subtle'}`}
                    />
                    {errors.briberyAmount && <p className=\"text-[12px] text-ui-error-text mt-1 font-semibold\">{errors.briberyAmount}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Incident Date, Time & Frequency */}
"""
t = replace_exact(t, anchor, insert, 'step3 bribery details UI')
p.write_text(t, encoding='utf-8')

# 8) Review mirrors structured fields
p = Path('src/components/report-composer/Step4Review.tsx')
t = p.read_text(encoding='utf-8')
t = replace_exact(t, "import { formatBillingMonth } from '../../utils/formatters';", "import { formatBillingMonth } from '../../utils/formatters';\nimport { getBriberyDepartmentLabel } from '../../data/briberyOptions';", 'step4 bribery import')
t = replace_exact(t, "  const isExcessElectricityBill = isUtilityReport && formData.subcategoryId === 'excess-electricity-bill';", "  const isExcessElectricityBill = isUtilityReport && formData.subcategoryId === 'excess-electricity-bill';\n  const isBriberyReport = segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';", 'step4 bribery flag')
anchor = """            {isExcessElectricityBill ? (
"""
insert = """            {isBriberyReport && (formData.briberyDepartment || formData.briberyService || formData.briberyAmount) && (
              <div className=\"grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5\">
                {formData.briberyDepartment && (
                  <div className=\"p-2.5 rounded-xl bg-ui-surface border border-ui-stroke-subtle\">
                    <span className=\"text-[12px] text-ui-content-muted block mb-0.5\">{language === 'bn' ? 'দপ্তর' : 'Department'}</span>
                    <p className=\"text-[13.5px] font-bold text-ui-content-primary\">{getBriberyDepartmentLabel(formData.briberyDepartment, language)}</p>
                  </div>
                )}
                {formData.briberyService && (
                  <div className=\"p-2.5 rounded-xl bg-ui-surface border border-ui-stroke-subtle\">
                    <span className=\"text-[12px] text-ui-content-muted block mb-0.5\">{language === 'bn' ? 'সেবা বা প্রক্রিয়া' : 'Service or process'}</span>
                    <p className=\"text-[13.5px] font-bold text-ui-content-primary\">{formData.briberyService}</p>
                  </div>
                )}
                {formData.briberyAmount !== undefined && formData.briberyAmount !== null && String(formData.briberyAmount).trim() !== '' && (
                  <div className=\"p-2.5 rounded-xl bg-ui-surface border border-ui-stroke-subtle\">
                    <span className=\"text-[12px] text-ui-content-muted block mb-0.5\">{language === 'bn' ? 'টাকার পরিমাণ' : 'Amount (BDT)'}</span>
                    <p className=\"text-[13.5px] font-bold text-ui-content-primary\">৳{Number(formData.briberyAmount).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            {isExcessElectricityBill ? (
"""
t = replace_exact(t, anchor, insert, 'step4 bribery details review')
p.write_text(t, encoding='utf-8')

print('Bribery Public contract patch applied.')
