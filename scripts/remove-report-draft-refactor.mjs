import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const write = (path, content) => fs.writeFileSync(path, content);

function replaceOnce(text, search, replacement, label) {
  const index = text.indexOf(search);
  if (index === -1) throw new Error(`Missing replacement target: ${label}`);
  if (text.indexOf(search, index + search.length) !== -1) {
    throw new Error(`Replacement target is not unique: ${label}`);
  }
  return text.slice(0, index) + replacement + text.slice(index + search.length);
}

function replaceRegexOnce(text, regex, replacement, label) {
  const matches = [...text.matchAll(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`))];
  if (matches.length !== 1) throw new Error(`Expected exactly one ${label}; found ${matches.length}`);
  return text.replace(regex, replacement);
}

function removeBetween(text, startMarker, endMarker, label) {
  const start = text.indexOf(startMarker);
  if (start === -1) throw new Error(`Missing start marker: ${label}`);
  const end = text.indexOf(endMarker, start);
  if (end === -1) throw new Error(`Missing end marker: ${label}`);
  return text.slice(0, start) + text.slice(end);
}

// 1) Rename the in-memory composer shape and remove persisted-draft-only fields.
{
  const path = 'src/services/types.ts';
  let text = read(path);
  const replacement = `export interface ReportFormData {\n  clientSubmissionId?: string;\n  serverSubmissionState?: 'not_attempted' | 'attempted';\n  segment: SectionKey | null;\n  currentStep: number;\n  subcategoryId: string;\n  title: string;\n  subjectType: 'individual' | 'business' | 'group' | 'organization' | 'unknown';\n  reportedSubject: string;\n  mentionedParties?: MentionedParty[];\n  roleOrDesignation: string;\n  organization: string;\n  publicProfileHandle: string;\n  identifyingDescription: string;\n  incidentDate: string;\n  incidentTime: string;\n  utilityEndTime?: string;\n  recentBillMonth?: string;\n  recentBillAmount?: number | string;\n  previousBillMonth?: string;\n  previousBillAmount?: number | string;\n  briberyDepartment: string;\n  briberyService: string;\n  briberyAmount?: number | string;\n  frequency: 'one-time' | 'repeated';\n  affectedPersonAgeGroup: HarassmentAgeGroup | '';\n  allegedAbuserRelationship: HarassmentAbuserRelationship | '';\n  reportingFor: HarassmentReportingFor | '';\n  relationshipContext: string;\n  intimateWhatHappened: string;\n  intimatePlatform: string;\n  description: string;\n  location: ReportLocationData;\n  isDetailedLocation?: boolean;\n  hasSupportingInfo: boolean;\n  evidenceTypes: string[];\n  evidenceDescription: string;\n  privacyChoice: 'anonymous' | 'admin_only' | 'public_identity';\n  adminName: string;\n  adminContact: string;\n  confirmPublicIdentity: boolean;\n  publicationPreferences: {\n    showSubjectName: boolean;\n    showOrganization: boolean;\n    showGeneralLocation: boolean;\n    showDescription: boolean;\n  };\n}\n\nexport interface SubjectResponseRequest`;
  text = replaceRegexOnce(
    text,
    /export const CURRENT_REPORT_FLOW_VERSION = 5;\n\nexport interface DraftReport \{[\s\S]*?\n\}\n\nexport interface SubjectResponseRequest/,
    replacement,
    'ReportFormData interface'
  );
  write(path, text);
}

// 2) Composer-only non-persistent state helpers. Legacy draft storage is actively purged.
write('src/services/reportFormState.ts', `import { ReportFormData, isMeaningfulMentionedParty } from './types';\n\nconst LEGACY_DRAFT_KEYS = ['sobaike_janao_draft_report', 'sobaike_report_draft_v1'];\nconst LEGACY_EVIDENCE_DB = 'sobaike_evidence_store_v1';\n\nexport const INITIAL_REPORT_FORM: ReportFormData = {\n  serverSubmissionState: 'not_attempted',\n  segment: null,\n  currentStep: 1,\n  subcategoryId: '',\n  title: '',\n  subjectType: 'unknown',\n  reportedSubject: '',\n  mentionedParties: [],\n  roleOrDesignation: '',\n  organization: '',\n  publicProfileHandle: '',\n  identifyingDescription: '',\n  incidentDate: '',\n  incidentTime: '',\n  utilityEndTime: '',\n  recentBillMonth: '',\n  recentBillAmount: undefined,\n  previousBillMonth: '',\n  previousBillAmount: undefined,\n  briberyDepartment: '',\n  briberyService: '',\n  briberyAmount: undefined,\n  frequency: 'one-time',\n  affectedPersonAgeGroup: '',\n  allegedAbuserRelationship: '',\n  reportingFor: '',\n  relationshipContext: '',\n  intimateWhatHappened: '',\n  intimatePlatform: '',\n  description: '',\n  location: {\n    formattedAddress: '',\n    division: '',\n    district: '',\n    upazilaOrThana: '',\n    area: '',\n    road: '',\n    landmark: '',\n  },\n  isDetailedLocation: false,\n  hasSupportingInfo: false,\n  evidenceTypes: [],\n  evidenceDescription: '',\n  privacyChoice: 'anonymous',\n  adminName: '',\n  adminContact: '',\n  confirmPublicIdentity: false,\n  publicationPreferences: {\n    showSubjectName: true,\n    showOrganization: true,\n    showGeneralLocation: true,\n    showDescription: true,\n  },\n};\n\nexport function generateSecureIdempotencyKey(): string {\n  try {\n    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {\n      return crypto.randomUUID();\n    }\n  } catch {\n    // Browser fallback below.\n  }\n  return \`idem_\${Date.now()}_\${Math.random().toString(36).substring(2, 11)}\`;\n}\n\nexport function hasMeaningfulReportInput(\n  form: ReportFormData | null,\n  pendingImageCount = 0\n): boolean {\n  if (!form) return false;\n  if (pendingImageCount > 0) return true;\n  if (Boolean(form.clientSubmissionId?.trim())) return true;\n  if (form.currentStep > 1) return true;\n  if (form.segment) return true;\n  if (Boolean(form.subcategoryId?.trim())) return true;\n  if (Boolean(form.title?.trim())) return true;\n  if (Boolean(form.reportedSubject?.trim())) return true;\n  if ((form.mentionedParties || []).some((party) => isMeaningfulMentionedParty(party))) return true;\n  if (Boolean(form.organization?.trim())) return true;\n  if (Boolean(form.publicProfileHandle?.trim())) return true;\n  if (Boolean(form.roleOrDesignation?.trim())) return true;\n  if (Boolean(form.identifyingDescription?.trim())) return true;\n  if (Boolean(form.description?.trim())) return true;\n  if (Boolean(form.incidentDate?.trim())) return true;\n  if (Boolean(form.incidentTime?.trim())) return true;\n  if (Boolean(form.utilityEndTime?.trim())) return true;\n  if (Boolean(form.recentBillMonth?.trim())) return true;\n  if (form.recentBillAmount !== undefined && String(form.recentBillAmount).trim() !== '') return true;\n  if (Boolean(form.previousBillMonth?.trim())) return true;\n  if (form.previousBillAmount !== undefined && String(form.previousBillAmount).trim() !== '') return true;\n  if (Boolean(form.briberyDepartment?.trim())) return true;\n  if (Boolean(form.briberyService?.trim())) return true;\n  if (form.briberyAmount !== undefined && String(form.briberyAmount).trim() !== '') return true;\n  if (Boolean(form.affectedPersonAgeGroup)) return true;\n  if (Boolean(form.allegedAbuserRelationship)) return true;\n  if (Boolean(form.reportingFor)) return true;\n  if (Boolean(form.intimateWhatHappened?.trim())) return true;\n  if (Boolean(form.intimatePlatform?.trim())) return true;\n  if (Boolean(form.relationshipContext?.trim())) return true;\n  if (Boolean(form.location?.district?.trim())) return true;\n  if (Boolean(form.location?.area?.trim())) return true;\n  if (Boolean(form.location?.formattedAddress?.trim())) return true;\n  if (Boolean(form.location?.division?.trim())) return true;\n  if ((form.evidenceTypes || []).length > 0) return true;\n  if (Boolean(form.evidenceDescription?.trim())) return true;\n  if (form.privacyChoice !== 'anonymous') return true;\n  if (Boolean(form.adminName?.trim()) || Boolean(form.adminContact?.trim())) return true;\n  return false;\n}\n\nexport function revokePreviewUrls(images: Array<{ previewUrl?: string }>): void {\n  images.forEach((image) => {\n    if (!image.previewUrl?.startsWith('blob:')) return;\n    try {\n      URL.revokeObjectURL(image.previewUrl);\n    } catch {\n      // Ignore browsers that already released the URL.\n    }\n  });\n}\n\nexport function clearLegacyReportDraftStorage(): void {\n  try {\n    LEGACY_DRAFT_KEYS.forEach((key) => localStorage.removeItem(key));\n  } catch {\n    // Storage can be unavailable in private/restricted contexts.\n  }\n\n  try {\n    if (typeof indexedDB !== 'undefined') indexedDB.deleteDatabase(LEGACY_EVIDENCE_DB);\n  } catch {\n    // Ignore unavailable IndexedDB.\n  }\n}\n`);

// 3) Rename the form type in the two child components.
for (const path of [
  'src/components/report-composer/Step3ComplaintDetails.tsx',
  'src/components/report-composer/Step4Review.tsx',
]) {
  const text = read(path);
  if (!text.includes('DraftReport')) throw new Error(`Expected DraftReport in ${path}`);
  write(path, text.replaceAll('DraftReport', 'ReportFormData'));
}

// 4) Remove persisted draft/recovery behavior from the composer while preserving same-session retry idempotency.
{
  const path = 'src/components/report-composer/ReportComposerModal.tsx';
  let text = read(path);

  text = replaceOnce(
    text,
    "import { DraftReport, isMeaningfulMentionedParty, isValidIncidentCoordinates } from '../../services/types';\nimport { DraftRepository, INITIAL_DRAFT, generateSecureIdempotencyKey } from '../../services/draftRepository';",
    "import { ReportFormData, isMeaningfulMentionedParty, isValidIncidentCoordinates } from '../../services/types';\nimport {\n  INITIAL_REPORT_FORM,\n  clearLegacyReportDraftStorage,\n  generateSecureIdempotencyKey,\n  hasMeaningfulReportInput,\n  revokePreviewUrls,\n} from '../../services/reportFormState';",
    'composer state imports'
  );
  text = text.replace("import { EvidenceDraftStorage } from '../../services/evidenceDraftStorage';\n", '');
  text = replaceOnce(
    text,
    `import {\n  AlertCircle,\n  FileText,\n  Trash2,\n  Plus,\n  ArrowRight,\n  Clock,\n  MapPin,\n  X,\n  Save,\n  Shield,\n  RotateCcw,\n  Paperclip,\n} from 'lucide-react';`,
    `import { AlertCircle, MapPin, Shield, RotateCcw } from 'lucide-react';`,
    'composer icon imports'
  );

  text = text.replaceAll('DraftReport', 'ReportFormData');
  text = text.replaceAll('INITIAL_DRAFT', 'INITIAL_REPORT_FORM');
  text = text.replaceAll('EvidenceDraftStorage.revokePreviewUrls', 'revokePreviewUrls');

  text = replaceRegexOnce(
    text,
    /\n  \/\/ Saved draft available for explicit recovery prompt\n  const \[savedDraftAvailable, setSavedDraftAvailable\] = useState<ReportFormData \| null>\(null\);\n/,
    '\n',
    'saved draft state'
  );
  text = text.replace("  const [isRestoringEvidence, setIsRestoringEvidence] = useState(false);\n", '');
  text = text.replace("        const el = document.getElementById('draft-continue-btn');", "        const el = document.getElementById('report-continue-editing-btn');");

  // Replace open-time recovery + autosave effects with a fresh-session reset and legacy cleanup.
  const openStart = '  // Check for saved draft whenever the modal is opened';
  const recoveryStart = '  // Draft Recovery Handlers';
  const startIndex = text.indexOf(openStart);
  const recoveryIndex = text.indexOf(recoveryStart, startIndex);
  if (startIndex === -1 || recoveryIndex === -1) throw new Error('Could not locate draft open/recovery effects');
  const freshEffect = `  // Each composer session starts fresh. Legacy persisted drafts are removed and never restored.\n  useEffect(() => {\n    if (isOpen) {\n      clearLegacyReportDraftStorage();\n      setSelectedComingSoon(null);\n      setRapePublishingConsentAccepted(false);\n      setRapeConsentCheckbox(false);\n      setIsRapeConsentModalOpen(false);\n      pendingTargetStepRef.current = null;\n      retryCredentialsRef.current = null;\n      setSubmitError(null);\n      setIsLocationError(false);\n      setPendingImages((previous) => {\n        revokePreviewUrls(previous);\n        return [];\n      });\n      setFormData({\n        ...INITIAL_REPORT_FORM,\n        segment: initialSegment,\n        currentStep: initialSegment ? 2 : 1,\n      });\n    } else {\n      setSelectedComingSoon(null);\n      setSubmitError(null);\n      setRapePublishingConsentAccepted(false);\n      setRapeConsentCheckbox(false);\n      setIsRapeConsentModalOpen(false);\n      pendingTargetStepRef.current = null;\n    }\n  }, [isOpen, initialSegment]);\n\n`;
  text = text.slice(0, startIndex) + freshEffect + text.slice(recoveryIndex);

  // Remove all saved-draft recovery handlers.
  text = removeBetween(text, '  // Draft Recovery Handlers', '  // Helper to update form data', 'draft recovery handlers');

  // Replace attachment persistence with in-memory attachment state only.
  const attachmentStart = '  // Attached images update handler: persists to IndexedDB and synchronizes pendingEvidenceRecovery';
  const navStart = '  // Step Navigation Handlers';
  const attachmentIndex = text.indexOf(attachmentStart);
  const navIndex = text.indexOf(navStart, attachmentIndex);
  if (attachmentIndex === -1 || navIndex === -1) throw new Error('Could not locate attachment persistence handler');
  const inMemoryAttachmentHandler = `  // Attached images remain in memory for the current composer session only.\n  const handlePendingImagesChange = useCallback(\n    (images: AttachedImagePreview[]) => {\n      const nextUrls = new Set(images.map((image) => image.previewUrl));\n      pendingImages.forEach((old) => {\n        if (old.previewUrl && !nextUrls.has(old.previewUrl) && old.previewUrl.startsWith('blob:')) {\n          try {\n            URL.revokeObjectURL(old.previewUrl);\n          } catch {\n            // ignore\n          }\n        }\n      });\n\n      setPendingImages(images);\n      setFormData((prev) => ({\n        ...prev,\n        hasSupportingInfo:\n          images.length > 0 ||\n          (prev.evidenceTypes || []).length > 0 ||\n          Boolean(prev.evidenceDescription?.trim()),\n      }));\n    },\n    [pendingImages]\n  );\n\n`;
  text = text.slice(0, attachmentIndex) + inMemoryAttachmentHandler + text.slice(navIndex);

  // Category/subcategory changes discard only the in-memory attachments and retry key.
  text = text.replace(/\n      const oldSubId = retryCredentialsRef\.current\?\.clientSubmissionId \|\| formData\.clientSubmissionId;\n      if \(oldSubId\) \{\n        try \{\n          await EvidenceDraftStorage\.deletePendingEvidence\(oldSubId\);\n        \} catch \{\n          \/\/ ignore\n        \}\n      \}/g, '');
  text = text.replaceAll('        pendingEvidenceRecovery: undefined,\n', '');
  text = text.replaceAll('Please discard this draft or start a new complaint.', 'Cancel this report and start a new one to change category.');
  text = text.replaceAll('Please discard this draft or start a new complaint.', 'Cancel this report and start a new one.');
  text = text.replaceAll('অন্য অভিযোগ করতে খসড়াটি মুছুন অথবা নতুন অভিযোগ শুরু করুন।', 'অন্য প্রতিবেদন করতে বর্তমান প্রতিবেদন বাতিল করে নতুনভাবে শুরু করুন।');

  // Close attempts now ask whether to keep editing or cancel the current report.
  text = replaceRegexOnce(
    text,
    /  \/\/ Close attempt handler - confirms if meaningful draft exists\n  const handleRequestClose = useCallback\(\(\) => \{[\s\S]*?\n  \}, \[[^\]]*\]\);/,
    `  // Confirm before discarding meaningful in-memory report input.\n  const handleRequestClose = useCallback(() => {\n    if (isSubmitting) return;\n\n    if (submissionResult || !hasMeaningfulReportInput(formData, pendingImages.length)) {\n      onClose();\n      return;\n    }\n\n    setIsConfirmCloseOpen(true);\n  }, [isSubmitting, submissionResult, formData, pendingImages.length, onClose]);`,
    'close request handler'
  );

  // Use the shared key generator only.
  text = replaceRegexOnce(
    text,
    /\n  \/\/ Secure Idempotency key helper\n  const generateSecureIdempotencyKey = \(\): string => \{[\s\S]*?\n  \};\n/,
    '\n',
    'duplicate idempotency generator'
  );

  // Recovery-only missing-evidence guard is no longer relevant.
  text = replaceRegexOnce(
    text,
    /\n    \/\/ Guard against attempting to complete a complaint with missing required evidence\n[\s\S]*?\n    \/\/ Rape pre-report consent defense guard/,
    '\n    // Rape pre-report consent defense guard',
    'persistent evidence recovery guard'
  );

  // Keep only same-session idempotency state before submit; never persist form or files locally.
  text = replaceRegexOnce(
    text,
    /      \/\/ Ensure stable idempotency key across submission retries and persist before server submission[\s\S]*?      const filesToUpload = pendingImages\.map\(\(img\) => img\.file\);/,
    `      // Keep a stable idempotency key for retries while this composer session remains open.\n      let clientSubmissionId =\n        retryCredentialsRef.current?.clientSubmissionId ||\n        formData.clientSubmissionId;\n\n      if (!clientSubmissionId) {\n        clientSubmissionId = generateSecureIdempotencyKey();\n      }\n\n      retryCredentialsRef.current = { clientSubmissionId };\n      setFormData((prev) => ({\n        ...prev,\n        clientSubmissionId,\n        serverSubmissionState: 'attempted',\n      }));\n\n      const filesToUpload = pendingImages.map((img) => img.file);`,
    'pre-submit draft persistence'
  );

  // Full success needs only in-memory cleanup.
  text = text.replaceRegex ? text : text;
  text = text.replace(/        try \{\n          await EvidenceDraftStorage\.deletePendingEvidence\(clientSubmissionId\);\n        \} catch \{\n          \/\/ ignore\n        \}\n/g, '');
  text = text.replace('        // Clear saved draft on success\n        DraftRepository.clearDraft();\n', '');

  // Submission failures retain current in-memory form/files and retry key, without browser persistence.
  text = replaceRegexOnce(
    text,
    /\n      \/\/ If evidence upload\/registration failed OR if complaint was created but evidence threw:[\s\S]*?\n      const displayMsg =/,
    `\n      const subId = retryCredentialsRef.current?.clientSubmissionId || formData.clientSubmissionId;\n      if (subId) {\n        setFormData((prev) => ({\n          ...prev,\n          clientSubmissionId: subId,\n          serverSubmissionState: 'attempted',\n        }));\n      }\n\n      const displayMsg =`,
    'failure draft persistence'
  );

  // Replace post-completion/reset + draft actions with in-memory reset/cancel actions.
  const startAnotherStart = '  const handleStartAnother = useCallback(async () => {';
  const canContinueMarker = '  if (!isOpen) return null;';
  const resetStart = text.indexOf(startAnotherStart);
  const canContinueIndex = text.indexOf(canContinueMarker, resetStart);
  if (resetStart === -1 || canContinueIndex === -1) throw new Error('Could not locate composer reset/draft action block');
  const actionBlock = `  const handleStartAnother = useCallback(() => {\n    revokePreviewUrls(pendingImages);\n    retryCredentialsRef.current = null;\n    setRapePublishingConsentAccepted(false);\n    setRapeConsentCheckbox(false);\n    setFormData({\n      ...INITIAL_REPORT_FORM,\n      segment: initialSegment,\n      currentStep: initialSegment ? 2 : 1,\n    });\n    setPendingImages([]);\n    setSubmissionResult(null);\n    setSubmitError(null);\n    setIsLocationError(false);\n  }, [initialSegment, pendingImages]);\n\n  const handleCancelReport = useCallback(() => {\n    revokePreviewUrls(pendingImages);\n    clearLegacyReportDraftStorage();\n    retryCredentialsRef.current = null;\n    setRapePublishingConsentAccepted(false);\n    setRapeConsentCheckbox(false);\n    setIsRapeConsentModalOpen(false);\n    pendingTargetStepRef.current = null;\n    setSubmitError(null);\n    setIsLocationError(false);\n    setFormData({\n      ...INITIAL_REPORT_FORM,\n      segment: initialSegment,\n      currentStep: initialSegment ? 2 : 1,\n    });\n    setPendingImages([]);\n    setIsConfirmCloseOpen(false);\n    onClose();\n  }, [initialSegment, onClose, pendingImages]);\n\n  const handleContinueEditing = useCallback(() => {\n    setIsConfirmCloseOpen(false);\n  }, []);\n\n`;
  text = text.slice(0, resetStart) + actionBlock + text.slice(canContinueIndex);

  // Remove saved-draft recovery screen; always render the normal composer.
  const recoveryUiStart = '        {/* Case 1: Draft Recovery Prompt Screen */}';
  const normalUiMarker = '          /* Case 2: Standard Step-by-Step Composer Flow */\n          <>';
  const recoveryUiIndex = text.indexOf(recoveryUiStart);
  const normalUiIndex = text.indexOf(normalUiMarker, recoveryUiIndex);
  if (recoveryUiIndex === -1 || normalUiIndex === -1) throw new Error('Could not locate draft recovery UI');
  text = text.slice(0, recoveryUiIndex) + '        <>' + text.slice(normalUiIndex + normalUiMarker.length);
  text = replaceOnce(text, '          </>\n        )}\n      </Modal>', '        </>\n      </Modal>', 'recovery conditional closing');

  // Coming-soon navigation no longer stores report state.
  text = replaceRegexOnce(
    text,
    /                      onNavigateToComingSoon=\{\(path\) => \{[\s\S]*?                        navigateTo\(path\);\n                      \}\}/,
    `                      onNavigateToComingSoon={(path) => {\n                        revokePreviewUrls(pendingImages);\n                        retryCredentialsRef.current = null;\n                        setPendingImages([]);\n                        onClose();\n                        navigateTo(path);\n                      }}`,
    'coming-soon draft save'
  );

  // Accurate non-persistent retry copy.
  text = text.replace(
    'ব্রাউজারে লোকেশন অনুমতি বন্ধ থাকলে অ্যাড্রেস বারের তালার আইকন বা সেটিংসে গিয়ে অনুমতি চালু করুন, তারপর পুনরায় চেষ্টা করুন। আপনার সম্পূর্ণ খসড়াটি সংরক্ষিত রয়েছে।',
    'ব্রাউজারে লোকেশন অনুমতি বন্ধ থাকলে অ্যাড্রেস বারের তালার আইকন বা সেটিংসে গিয়ে অনুমতি চালু করুন, তারপর পুনরায় চেষ্টা করুন। এই স্ক্রিনে দেওয়া তথ্য সম্পাদনা চালিয়ে যাওয়া পর্যন্ত থাকবে।'
  );
  text = text.replace(
    'If permission is blocked, please click the lock/settings icon in your browser address bar to allow location access, then retry. Your completed draft is safely preserved.',
    'If permission is blocked, please click the lock/settings icon in your browser address bar to allow location access, then retry. The information on this screen remains available while you continue editing.'
  );

  text = replaceRegexOnce(
    text,
    /                canSubmit=\{\n                  !isSubmitting &&\n                  !\(\n                    pendingImages\.length === 0 &&\n                    Boolean\(formData\.pendingEvidenceRecovery && formData\.pendingEvidenceRecovery\.expectedCount > 0\)\n                  \)\n                \}/,
    '                canSubmit={!isSubmitting}',
    'footer recovery submit guard'
  );

  // Replace the old three-action Save Draft dialog with exactly two actions.
  const closeModalStart = text.indexOf('      {/* Exit Draft Confirmation Dialog - Clean, Clear Hierarchy */}');
  const componentEnd = text.indexOf('    </>\n  );', closeModalStart);
  if (closeModalStart === -1 || componentEnd === -1) throw new Error('Could not locate close confirmation modal');
  const closeModal = `      {/* Cancel report confirmation: no draft saving or recovery. */}\n      <Modal\n        id="report-cancel-confirm-modal"\n        isOpen={isConfirmCloseOpen}\n        onClose={handleContinueEditing}\n        maxWidth="md"\n        zIndexClass="z-[60]"\n        showHeader={false}\n        language={language}\n        ariaLabel={language === 'bn' ? 'প্রতিবেদন বাতিল করার নিশ্চিতকরণ' : 'Cancel report confirmation'}\n      >\n        <div className="p-6 md:p-8 space-y-5 text-left">\n          <div className="flex items-start gap-3.5">\n            <div className="w-10 h-10 rounded-2xl bg-ui-surface-subtle border border-ui-stroke-subtle flex items-center justify-center shrink-0 text-ui-content-primary mt-0.5">\n              <AlertCircle className="w-5 h-5" />\n            </div>\n            <div className="space-y-1">\n              <h3 className="text-[19px] sm:text-[20px] font-bold text-ui-content-primary leading-tight">\n                {language === 'bn' ? 'প্রতিবেদন বাতিল করবেন?' : 'Cancel this report?'}\n              </h3>\n              <p className="text-[14px] sm:text-[14.5px] leading-relaxed text-ui-content-secondary">\n                {language === 'bn'\n                  ? 'এখন বাতিল করলে এই প্রতিবেদনে দেওয়া তথ্য সংরক্ষিত থাকবে না।'\n                  : 'If you cancel now, the information entered in this report will not be saved.'}\n              </p>\n            </div>\n          </div>\n\n          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-ui-stroke-subtle">\n            <Button\n              id="report-continue-editing-btn"\n              type="button"\n              variant="outline"\n              size="md"\n              onClick={handleContinueEditing}\n              className="whitespace-nowrap"\n            >\n              {language === 'bn' ? 'সম্পাদনা চালিয়ে যান' : 'Continue editing'}\n            </Button>\n\n            <Button\n              id="report-cancel-btn"\n              type="button"\n              variant="ghost"\n              size="md"\n              onClick={handleCancelReport}\n              className="text-ui-error-text hover:bg-ui-error-bg whitespace-nowrap"\n            >\n              {language === 'bn' ? 'প্রতিবেদন বাতিল করুন' : 'Cancel reporting'}\n            </Button>\n          </div>\n        </div>\n      </Modal>\n`;
  text = text.slice(0, closeModalStart) + closeModal + text.slice(componentEnd);

  // No draft persistence symbols may remain in the composer.
  for (const forbidden of [
    'DraftRepository',
    'EvidenceDraftStorage',
    'savedDraftAvailable',
    'isRestoringEvidence',
    'pendingEvidenceRecovery',
    'draft-save-exit-btn',
    'draft-recovery-',
    'handleSaveAndExit',
    'handleDiscardDraft',
  ]) {
    if (text.includes(forbidden)) throw new Error(`Composer still contains forbidden draft symbol: ${forbidden}`);
  }

  write(path, text);
}

// 5) API errors must not claim a persisted draft exists.
{
  const path = 'src/services/apiClient.ts';
  let text = read(path);
  text = text.replace(
    'Submission service is currently unavailable. Your draft is preserved. Please try again later.',
    'Submission service is currently unavailable. Please keep this report open and try again later.'
  );
  text = text.replace(
    'অভিযোগ জমা দেওয়ার সেবা এই মুহূর্তে সাময়িকভাবে অনুপলব্ধ। আপনার খসড়াটি সংরক্ষিত রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
    'অভিযোগ জমা দেওয়ার সেবা এই মুহূর্তে সাময়িকভাবে অনুপলব্ধ। এই প্রতিবেদনটি খোলা রেখে কিছুক্ষণ পর আবার চেষ্টা করুন।'
  );
  text = text.replace(
    'Submission service is undergoing updates. Your draft is preserved, please try again in a few moments.',
    'Submission service is undergoing updates. Please keep this report open and try again in a few moments.'
  );
  text = text.replace(
    'সার্ভার হালনাগাদ হচ্ছে। আপনার খসড়াটি সংরক্ষিত রয়েছে, অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
    'সার্ভার হালনাগাদ হচ্ছে। এই প্রতিবেদনটি খোলা রেখে অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
  );
  write(path, text);
}

// 6) Public smoke test: old draft is purged and close confirmation has exactly the two requested actions.
{
  const path = 'scripts/public-functional-smoke.mjs';
  let text = read(path);
  text = text.replace(
    "    localStorage.removeItem('sobaike_report_draft_v1');",
    "    localStorage.removeItem('sobaike_report_draft_v1');\n    localStorage.removeItem('sobaike_janao_draft_report');"
  );

  const oldCheck = `await check('Report composer opens from the mobile bottom dock without submitting data', async () => {\n  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });\n  await seedReturningVisitor(context);\n  const page = await context.newPage();\n  attachRuntimeGuards(page, 'report-composer');\n  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });\n  await page.locator('#mobile-nav-report').click();\n  await expectVisible(page.locator('#report-composer-modal'), 'report composer did not open');\n  const dialog = page.locator('#report-composer-modal');\n  if ((await dialog.getAttribute('role')) !== 'dialog') throw new Error('report composer is missing dialog semantics');\n  await context.close();\n});`;

  const newCheck = `await check('Report composer has no draft persistence and uses the approved two-action cancel flow', async () => {\n  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });\n  await seedReturningVisitor(context);\n  await context.addInitScript(() => {\n    localStorage.setItem('sobaike_janao_draft_report', JSON.stringify({ segment: 'harassment', currentStep: 4, title: 'legacy draft' }));\n  });\n  const page = await context.newPage();\n  attachRuntimeGuards(page, 'report-composer');\n  await page.goto(routeUrl('/'), { waitUntil: 'domcontentloaded', timeout: 30000 });\n  await page.locator('#mobile-nav-report').click();\n  await expectVisible(page.locator('#report-composer-modal'), 'report composer did not open');\n  const dialog = page.locator('#report-composer-modal');\n  if ((await dialog.getAttribute('role')) !== 'dialog') throw new Error('report composer is missing dialog semantics');\n  if ((await page.getByText('সংরক্ষিত খসড়া', { exact: true }).count()) !== 0) throw new Error('legacy saved-draft recovery UI is still present');\n  const legacyDraft = await page.evaluate(() => localStorage.getItem('sobaike_janao_draft_report'));\n  if (legacyDraft !== null) throw new Error('legacy draft localStorage was not cleared');\n\n  await page.locator('#service-select-card-harassment').click();\n  await page.locator('#report-composer-close-btn').click();\n  const confirm = page.locator('#report-cancel-confirm-modal');\n  await expectVisible(confirm, 'cancel-report confirmation did not open');\n  await expectVisible(page.locator('#report-continue-editing-btn'), 'Continue editing action is missing');\n  await expectVisible(page.locator('#report-cancel-btn'), 'Cancel reporting action is missing');\n  if ((await confirm.locator('button').count()) !== 2) throw new Error('cancel-report confirmation must contain exactly two buttons');\n  if ((await page.locator('#draft-save-exit-btn, #draft-discard-btn, [id^="draft-recovery-"]').count()) !== 0) throw new Error('removed draft actions are still present');\n\n  await page.locator('#report-continue-editing-btn').click();\n  await confirm.waitFor({ state: 'hidden', timeout: 10000 });\n  await expectVisible(page.locator('#report-composer-modal'), 'composer should remain open after Continue editing');\n\n  await page.locator('#report-composer-close-btn').click();\n  await expectVisible(confirm, 'cancel-report confirmation did not reopen');\n  await page.locator('#report-cancel-btn').click();\n  await page.locator('#report-composer-modal').waitFor({ state: 'hidden', timeout: 10000 });\n  const storedDrafts = await page.evaluate(() => ({\n    current: localStorage.getItem('sobaike_janao_draft_report'),\n    legacy: localStorage.getItem('sobaike_report_draft_v1'),\n  }));\n  if (storedDrafts.current !== null || storedDrafts.legacy !== null) throw new Error(`draft storage exists after cancellation: ${JSON.stringify(storedDrafts)}`);\n  await context.close();\n});`;

  text = replaceOnce(text, oldCheck, newCheck, 'report composer functional smoke');
  write(path, text);
}

// 7) Remove obsolete persisted-draft modules.
for (const path of ['src/services/draftRepository.ts', 'src/services/evidenceDraftStorage.ts']) {
  if (!fs.existsSync(path)) throw new Error(`Expected obsolete draft module: ${path}`);
  fs.unlinkSync(path);
}

// 8) Final source-level guardrails.
const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) sourceFiles.push(full);
  }
}
walk('src');
const source = sourceFiles.map((file) => `${file}\n${read(file)}`).join('\n');
for (const forbidden of [
  'DraftRepository',
  'EvidenceDraftStorage',
  'pendingEvidenceRecovery',
  'CURRENT_REPORT_FLOW_VERSION',
  'interface DraftReport',
  'sobaike_janao_draft_report',
  'sobaike_evidence_store_v1',
  'Save draft and exit?',
  'সংরক্ষিত খসড়া',
]) {
  if (source.includes(forbidden) && !read('src/services/reportFormState.ts').includes(forbidden)) {
    throw new Error(`Draft persistence residue remains in source: ${forbidden}`);
  }
}

console.log('Report draft persistence removal refactor completed.');
