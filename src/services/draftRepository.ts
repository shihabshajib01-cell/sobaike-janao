import { DraftReport, CURRENT_REPORT_FLOW_VERSION } from './types';

const DRAFT_KEY = 'sobaike_janao_draft_report';

export const INITIAL_DRAFT: DraftReport = {
  flowVersion: CURRENT_REPORT_FLOW_VERSION,
  segment: null,
  currentStep: 1,
  subcategoryId: '',
  title: '',
  subjectType: 'individual',
  reportedSubject: '',
  mentionedParties: [],
  roleOrDesignation: '',
  organization: '',
  publicProfileHandle: '',
  identifyingDescription: '',
  incidentDate: '',
  incidentTime: '',
  frequency: 'one-time',
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
  lastSavedAt: '',
};

export const DraftRepository = {
  getDraft(): DraftReport | null {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DraftReport;

      // Handle V3 exact step restoration
      if (parsed.flowVersion === CURRENT_REPORT_FLOW_VERSION) {
        let validStep = parsed.currentStep || 1;

        // Prerequisite validation for saved step
        if (validStep === 4) {
          if (!parsed.segment || !parsed.subcategoryId) {
            validStep = parsed.segment ? 2 : 1;
          }
        } else if (validStep === 3) {
          if (!parsed.segment || !parsed.subcategoryId) {
            validStep = parsed.segment ? 2 : 1;
          }
        } else if (validStep === 2) {
          if (!parsed.segment) {
            validStep = 1;
          }
        } else {
          validStep = 1;
        }

        return {
          ...parsed,
          currentStep: validStep,
        };
      }

      // Migrate legacy draft (flowVersion < 3 or undefined)
      let migratedStep = 1;
      if (parsed.segment && parsed.subcategoryId && parsed.description && parsed.description.trim().length > 10) {
        migratedStep = (parsed.currentStep === 4 || (parsed as any).step === 4) ? 4 : 3;
      } else if (parsed.segment && parsed.subcategoryId) {
        migratedStep = 3;
      } else if (parsed.segment) {
        migratedStep = 2;
      }

      const migratedDraft: DraftReport = {
        ...INITIAL_DRAFT,
        ...parsed,
        flowVersion: CURRENT_REPORT_FLOW_VERSION,
        currentStep: migratedStep,
        lastSavedAt: new Date().toISOString(),
      };

      // Persist migrated version
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(migratedDraft));
      } catch {
        // ignore
      }

      return migratedDraft;
    } catch {
      return null;
    }
  },

  saveDraft(draft: DraftReport): void {
    try {
      const updated: DraftReport = {
        ...draft,
        flowVersion: CURRENT_REPORT_FLOW_VERSION,
        lastSavedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
    } catch {
      // storage unavailable fallback
    }
  },

  clearDraft(): void {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignored
    }
  },

  /**
   * Evaluates whether a draft has meaningful user input
   * Based on segment, step > 1, subcategory, subject, description, location, evidence, privacy
   */
  hasMeaningfulDraft(draft: DraftReport | null): boolean {
    if (!draft) return false;

    // Check step progress
    if (draft.currentStep > 1) return true;

    // Check category selection
    if (draft.segment !== null && draft.segment !== undefined) return true;
    if (Boolean(draft.subcategoryId?.trim())) return true;

    // Check entered fields
    if (Boolean(draft.title?.trim())) return true;
    if (Boolean(draft.reportedSubject?.trim())) return true;
    if (
      draft.mentionedParties &&
      draft.mentionedParties.some(
        (p) =>
          Boolean(p.name?.trim()) ||
          Boolean(p.organization?.trim()) ||
          Boolean(p.phoneOrContact?.trim()) ||
          Boolean(p.address?.trim())
      )
    ) {
      return true;
    }
    if (Boolean(draft.organization?.trim())) return true;
    if (Boolean(draft.publicProfileHandle?.trim())) return true;
    if (Boolean(draft.roleOrDesignation?.trim())) return true;
    if (Boolean(draft.description?.trim())) return true;
    if (Boolean(draft.intimateWhatHappened?.trim())) return true;
    if (Boolean(draft.relationshipContext?.trim())) return true;

    // Check location
    if (
      Boolean(draft.location?.district?.trim()) ||
      Boolean(draft.location?.area?.trim()) ||
      Boolean(draft.location?.formattedAddress?.trim()) ||
      Boolean(draft.location?.division?.trim())
    ) {
      return true;
    }

    // Check evidence
    if (draft.evidenceTypes && draft.evidenceTypes.length > 0) return true;
    if (Boolean(draft.evidenceDescription?.trim())) return true;

    // Check privacy data
    if (draft.privacyChoice !== 'anonymous') return true;
    if (Boolean(draft.adminName?.trim()) || Boolean(draft.adminContact?.trim())) return true;

    return false;
  },
};
