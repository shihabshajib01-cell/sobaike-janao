import { ReportFormData, isMeaningfulMentionedParty } from './types';

const LEGACY_DRAFT_KEYS = ['sobaike_janao_draft_report', 'sobaike_report_draft_v1'];
const LEGACY_EVIDENCE_DB = 'sobaike_evidence_store_v1';

export const INITIAL_REPORT_FORM: ReportFormData = {
  serverSubmissionState: 'not_attempted',
  segment: null,
  currentStep: 1,
  subcategoryId: '',
  title: '',
  subjectType: 'unknown',
  reportedSubject: '',
  mentionedParties: [],
  roleOrDesignation: '',
  organization: '',
  publicProfileHandle: '',
  identifyingDescription: '',
  incidentDate: '',
  incidentTime: '',
  utilityEndTime: '',
  recentBillMonth: '',
  recentBillAmount: undefined,
  previousBillMonth: '',
  previousBillAmount: undefined,
  briberyDepartment: '',
  briberyService: '',
  briberyAmount: undefined,
  frequency: 'one-time',
  affectedPersonAgeGroup: '',
  allegedAbuserRelationship: '',
  reportingFor: '',
  sexualHarassmentType: '',
  sexualHarassmentContext: '',
  sexualHarassmentInstitution: '',
  relationshipContext: '',
  intimateWhatHappened: '',
  intimatePlatform: '',
  description: '',
  location: {
    formattedAddress: '',
    division: '',
    district: '',
    upazilaOrThana: '',
    area: '',
    road: '',
    landmark: '',
  },
  isDetailedLocation: false,
  hasSupportingInfo: false,
  evidenceTypes: [],
  evidenceDescription: '',
  privacyChoice: 'anonymous',
  adminName: '',
  adminContact: '',
  confirmPublicIdentity: false,
  publicationPreferences: {
    showSubjectName: true,
    showOrganization: true,
    showGeneralLocation: true,
    showDescription: true,
  },
  formSchemaVersion: undefined,
  formEngineMode: undefined,
  customFieldAnswers: {},
};

export function generateSecureIdempotencyKey(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Browser fallback below.
  }
  return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function hasMeaningfulReportInput(
  form: ReportFormData | null,
  pendingImageCount = 0
): boolean {
  if (!form) return false;
  if (pendingImageCount > 0) return true;
  if (Boolean(form.clientSubmissionId?.trim())) return true;
  if (form.currentStep > 1) return true;
  if (form.segment) return true;
  if (Boolean(form.subcategoryId?.trim())) return true;
  if (Boolean(form.title?.trim())) return true;
  if (Boolean(form.reportedSubject?.trim())) return true;
  if ((form.mentionedParties || []).some((party) => isMeaningfulMentionedParty(party))) return true;
  if (Boolean(form.organization?.trim())) return true;
  if (Boolean(form.publicProfileHandle?.trim())) return true;
  if (Boolean(form.roleOrDesignation?.trim())) return true;
  if (Boolean(form.identifyingDescription?.trim())) return true;
  if (Boolean(form.description?.trim())) return true;
  if (Boolean(form.incidentDate?.trim())) return true;
  if (Boolean(form.incidentTime?.trim())) return true;
  if (Boolean(form.utilityEndTime?.trim())) return true;
  if (Boolean(form.recentBillMonth?.trim())) return true;
  if (form.recentBillAmount !== undefined && String(form.recentBillAmount).trim() !== '') return true;
  if (Boolean(form.previousBillMonth?.trim())) return true;
  if (form.previousBillAmount !== undefined && String(form.previousBillAmount).trim() !== '') return true;
  if (Boolean(form.briberyDepartment?.trim())) return true;
  if (Boolean(form.briberyService?.trim())) return true;
  if (form.briberyAmount !== undefined && String(form.briberyAmount).trim() !== '') return true;
  if (Boolean(form.affectedPersonAgeGroup)) return true;
  if (Boolean(form.allegedAbuserRelationship)) return true;
  if (Boolean(form.reportingFor)) return true;
  if (Boolean(form.sexualHarassmentType)) return true;
  if (Boolean(form.sexualHarassmentContext)) return true;
  if (Boolean(form.sexualHarassmentInstitution?.trim())) return true;
  if (Boolean(form.intimateWhatHappened?.trim())) return true;
  if (Boolean(form.intimatePlatform?.trim())) return true;
  if (Boolean(form.relationshipContext?.trim())) return true;
  if (
    form.customFieldAnswers &&
    Object.values(form.customFieldAnswers).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value;
      return value !== null && value !== undefined && String(value).trim() !== '';
    })
  ) return true;
  if (Boolean(form.location?.district?.trim())) return true;
  if (Boolean(form.location?.area?.trim())) return true;
  if (Boolean(form.location?.formattedAddress?.trim())) return true;
  if (Boolean(form.location?.division?.trim())) return true;
  if ((form.evidenceTypes || []).length > 0) return true;
  if (Boolean(form.evidenceDescription?.trim())) return true;
  if (form.privacyChoice !== 'anonymous') return true;
  if (Boolean(form.adminName?.trim()) || Boolean(form.adminContact?.trim())) return true;
  return false;
}

export function revokePreviewUrls(images: Array<{ previewUrl?: string }>): void {
  images.forEach((image) => {
    if (!image.previewUrl?.startsWith('blob:')) return;
    try {
      URL.revokeObjectURL(image.previewUrl);
    } catch {
      // Ignore browsers that already released the URL.
    }
  });
}

export function clearLegacyReportDraftStorage(): void {
  try {
    LEGACY_DRAFT_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable in private/restricted contexts.
  }

  try {
    if (typeof indexedDB !== 'undefined') indexedDB.deleteDatabase(LEGACY_EVIDENCE_DB);
  } catch {
    // Ignore unavailable IndexedDB.
  }
}
