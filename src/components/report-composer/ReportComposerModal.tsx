import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SectionKey, ComingSoonServiceKey } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { ReportFormData, isMeaningfulMentionedParty, isValidIncidentCoordinates } from '../../services/types';
import {
  INITIAL_REPORT_FORM,
  clearLegacyReportDraftStorage,
  generateSecureIdempotencyKey,
  hasMeaningfulReportInput,
  revokePreviewUrls,
} from '../../services/reportFormState';
import { apiClient } from '../../services/apiClient';
import { VisitorSessionService } from '../../services/visitorSessionService';
import { AttachedImagePreview } from '../media/ImageAttachmentPicker';
import { ReportComposerHeader } from './ReportComposerHeader';
import { ReportComposerFooter } from './ReportComposerFooter';
import { Step1ServiceSelect } from './Step1ServiceSelect';
import { Step2ComplaintTypeAccordion } from './Step2ComplaintTypeAccordion';
import { Step3ComplaintDetails, Step3Handle } from './Step3ComplaintDetails';
import { ConfiguredFieldsSection, ConfiguredFieldsHandle } from './ConfiguredFieldsSection';
import { ConfiguredFieldsReview } from './ConfiguredFieldsReview';
import { Step4Review } from './Step4Review';
import { StepCompletion } from './StepCompletion';
import { MobJusticeDetailsFields } from './MobJusticeDetailsFields';
import { MobJusticeReviewSummary } from './MobJusticeReviewSummary';
import { REPORT_TITLE_MAX_LENGTH } from './ReportTitleField';
import { SubcategoryOption } from '../../data/reportOptions';
import {
  EMPTY_MOB_JUSTICE_DETAILS,
  MobJusticeDetails,
  MobJusticeValidationErrors,
  hasMobJusticeValidationErrors,
  validateMobJusticeDetails,
} from '../../data/mobJusticeOptions';
import { AlertCircle, MapPin, Shield, RotateCcw } from 'lucide-react';

import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { ModalActions } from '../ui/ModalActions';
import { CategoryBadge } from '../ui/CategoryBadge';
import { PublicReportingConfigService, PublicReportingForm } from '../../services/reportingFormConfig';

export interface ReportComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSegment?: SectionKey | null;
  language: 'bn' | 'en';
}

export const ReportComposerModal: React.FC<ReportComposerModalProps> = ({
  isOpen,
  onClose,
  initialSegment = null,
  language,
}) => {
  const { navigateTo } = useApp();

  // Main form state - always start on Step 1 with no pre-selected segment unless specified
  const [formData, setFormData] = useState<ReportFormData>(() => ({
    ...INITIAL_REPORT_FORM,
    segment: initialSegment,
    currentStep: initialSegment ? 2 : 1,
  }));

  // Mob Justice has five category-specific fields. Keep them isolated from the shared form model
  // so existing report categories remain untouched while still using the same composer journey.
  const [mobJusticeDetails, setMobJusticeDetails] = useState<MobJusticeDetails>(() => ({
    ...EMPTY_MOB_JUSTICE_DETAILS,
  }));
  const [mobJusticeErrors, setMobJusticeErrors] = useState<MobJusticeValidationErrors>({});

  // Attached media state (in-memory files)
  const [pendingImages, setPendingImages] = useState<AttachedImagePreview[]>([]);

  // Step 3 imperative refs for legacy core sections + Admin-configured fields.
  const step3Ref = useRef<Step3Handle>(null);
  const configuredFieldsRef = useRef<ConfiguredFieldsHandle>(null);
  const subcategoryConfigRequestRef = useRef(0);
  const [reportingForm, setReportingForm] = useState<PublicReportingForm | null>(null);

  // Jump section tracking for Step 3
  const [step3JumpSection, setStep3JumpSection] = useState<
    'narrative' | 'location' | 'identity' | 'parties' | 'attachments' | undefined
  >(undefined);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLocationError, setIsLocationError] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    reportId: string;
  } | null>(null);

  // Rape Pre-Report Publishing & Privacy Consent (session-level only - not stored in draft, storage or db)
  const [rapePublishingConsentAccepted, setRapePublishingConsentAccepted] = useState(false);
  const [isRapeConsentModalOpen, setIsRapeConsentModalOpen] = useState(false);
  const [rapeConsentCheckbox, setRapeConsentCheckbox] = useState(false);
  const pendingTargetStepRef = useRef<{ step: number; jumpSection?: string } | null>(null);

  // Close Confirmation state
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  useEffect(() => {
    if (isConfirmCloseOpen) {
      const timer = setTimeout(() => {
        const el = document.getElementById('report-continue-editing-btn');
        if (el) {
          el.focus({ preventScroll: true });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isConfirmCloseOpen]);

  // Coming Soon local selection tracking for Step 1
  const [selectedComingSoon, setSelectedComingSoon] = useState<ComingSoonServiceKey | null>(null);

  // Scroll container reference to reset scroll on step change
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Active retry submission credentials (reused across retries until success, reset, or change)
  const retryCredentialsRef = useRef<{ clientSubmissionId: string } | null>(null);

  // Derived state for rape publishing consent requirements
  const requiresRapeConsent = formData.subcategoryId === 'rape-sexual-violence';
  const rapeConsentMissing = requiresRapeConsent && !rapePublishingConsentAccepted;
  const isMobJusticeReport =
    formData.segment === 'public_safety' && formData.subcategoryId === 'mob-justice';

  // Defensive guard: if formData ever targets Step 3/4 with rape subcategory without consent, open disclaimer and hold step
  useEffect(() => {
    if (isOpen && formData.currentStep >= 3 && rapeConsentMissing && !isRapeConsentModalOpen) {
      pendingTargetStepRef.current = { step: formData.currentStep };
      setRapeConsentCheckbox(false);
      setIsRapeConsentModalOpen(true);
    }
  }, [isOpen, formData.currentStep, rapeConsentMissing, isRapeConsentModalOpen]);

  // Each composer session starts fresh. Legacy persisted drafts are removed and never restored.
  useEffect(() => {
    if (isOpen) {
      // A reporting session should always resolve the latest Admin-published
      // schema, but the schema itself is not needed during ordinary browsing.
      PublicReportingConfigService.invalidate();
      clearLegacyReportDraftStorage();
      setSelectedComingSoon(null);
      setRapePublishingConsentAccepted(false);
      setRapeConsentCheckbox(false);
      setIsRapeConsentModalOpen(false);
      setMobJusticeDetails({ ...EMPTY_MOB_JUSTICE_DETAILS });
      setMobJusticeErrors({});
      setReportingForm(null);
      pendingTargetStepRef.current = null;
      retryCredentialsRef.current = null;
      setSubmitError(null);
      setIsLocationError(false);
      setPendingImages((previous) => {
        revokePreviewUrls(previous);
        return [];
      });
      setFormData({
        ...INITIAL_REPORT_FORM,
        segment: initialSegment,
        currentStep: initialSegment ? 2 : 1,
      });
    } else {
      setSelectedComingSoon(null);
      setSubmitError(null);
      setRapePublishingConsentAccepted(false);
      setRapeConsentCheckbox(false);
      setIsRapeConsentModalOpen(false);
      setMobJusticeErrors({});
      pendingTargetStepRef.current = null;
    }
  }, [isOpen, initialSegment]);

  // Helper to update form data
  const handleUpdateFormData = useCallback((updates: Partial<ReportFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleMobJusticeDetailsChange = useCallback((details: MobJusticeDetails) => {
    setMobJusticeDetails(details);
    setMobJusticeErrors({});
  }, []);

  const validateMobJusticeSection = useCallback((): boolean => {
    if (!isMobJusticeReport) return true;

    const errors = validateMobJusticeDetails(mobJusticeDetails, language);
    setMobJusticeErrors(errors);

    if (hasMobJusticeValidationErrors(errors)) {
      setTimeout(() => {
        document
          .getElementById('composer-section-mob-justice')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return false;
    }

    return true;
  }, [isMobJusticeReport, mobJusticeDetails, language]);

  // Attached images remain in memory for the current composer session only.
  const handlePendingImagesChange = useCallback(
    (images: AttachedImagePreview[]) => {
      const nextUrls = new Set(images.map((image) => image.previewUrl));
      pendingImages.forEach((old) => {
        if (old.previewUrl && !nextUrls.has(old.previewUrl) && old.previewUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(old.previewUrl);
          } catch {
            // ignore
          }
        }
      });

      setPendingImages(images);
      setFormData((prev) => ({
        ...prev,
        hasSupportingInfo:
          images.length > 0 ||
          (prev.evidenceTypes || []).length > 0 ||
          Boolean(prev.evidenceDescription?.trim()),
      }));
    },
    [pendingImages]
  );

  // Step Navigation Handlers
  const handleGoToStep = useCallback((step: number, jumpSection?: string) => {
    setSelectedComingSoon(null);

    // If attempting to go to step 3 or 4 with rape subcategory without consent
    if (
      step >= 3 &&
      formData.subcategoryId === 'rape-sexual-violence' &&
      !rapePublishingConsentAccepted
    ) {
      pendingTargetStepRef.current = { step, jumpSection };
      setRapeConsentCheckbox(false);
      setIsRapeConsentModalOpen(true);
      return;
    }

    if (jumpSection) {
      setStep3JumpSection(jumpSection as any);
    } else {
      setStep3JumpSection(undefined);
    }

    setFormData((prev) => ({
      ...prev,
      currentStep: step,
    }));

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [formData.subcategoryId, rapePublishingConsentAccepted]);

  const handleNextFromStep1 = useCallback(() => {
    setFormData((prev) => {
      if (!prev.segment) return prev;
      return { ...prev, currentStep: 2 };
    });
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleSelectService = useCallback(
    async (segment: SectionKey) => {
      if (!segment) return;

      if (formData.segment === segment) return;

      if (formData.serverSubmissionState === 'attempted') {
        setSubmitError(
          language === 'bn'
            ? 'পূর্ববর্তী জমা প্রচেষ্টার কারণে বিভাগ পরিবর্তন করা সম্ভব নয়। অন্য প্রতিবেদন করতে বর্তমান প্রতিবেদন বাতিল করে নতুনভাবে শুরু করুন।'
            : 'Cannot change category after submission attempt. Cancel this report and start a new one to change category.'
        );
        return;
      }

      setRapePublishingConsentAccepted(false);
      setMobJusticeDetails({ ...EMPTY_MOB_JUSTICE_DETAILS });
      setMobJusticeErrors({});

      // State A: pre-submit category switch
      // Cleanly discard old local evidence attachments and old clientSubmissionId
      revokePreviewUrls(pendingImages);
      setPendingImages([]);
      retryCredentialsRef.current = null;

      const isSwitchingToUtility = (segment as string) === 'utility' || segment === 'load_shedding';

      setFormData((prev) => ({
        ...prev,
        segment,
        location:
          isSwitchingToUtility && prev.location
            ? {
                ...prev.location,
                formattedAddress: '',
                area: '',
                road: '',
                landmark: '',
                placeId: undefined,
              }
            : prev.location,
        clientSubmissionId: undefined,
        serverSubmissionState: 'not_attempted',
        hasSupportingInfo: false,
        evidenceTypes: [],
        evidenceDescription: '',
        subcategoryId: '',
        title: '',
        subjectType: 'unknown',
        reportedSubject: '',
        roleOrDesignation: '',
        organization: '',
        publicProfileHandle: '',
        identifyingDescription: '',
        mentionedParties: [],
        affectedPersonAgeGroup: '',
        allegedAbuserRelationship: '',
        reportingFor: '',
        sexualHarassmentType: '',
        sexualHarassmentContext: '',
        sexualHarassmentInstitution: '',
        intimateWhatHappened: '',
        intimatePlatform: '',
        frequency: 'one-time',
        incidentTime: '',
        utilityEndTime: '',
        recentBillMonth: '',
        recentBillAmount: undefined,
        previousBillMonth: '',
        previousBillAmount: undefined,
        briberyDepartment: '',
        briberyService: '',
        briberyAmount: undefined,
        formSchemaVersion: undefined,
        formEngineMode: undefined,
        customFieldAnswers: {},
      }));
      subcategoryConfigRequestRef.current += 1;
      setReportingForm(null);
    },
    [formData.segment, formData.serverSubmissionState, formData.clientSubmissionId, language, pendingImages]
  );

  const handleSelectSubcategory = useCallback(
    (subcategoryId: string, _option: SubcategoryOption) => {
      if (formData.subcategoryId === subcategoryId) return;

      if (formData.serverSubmissionState === 'attempted') {
        setSubmitError(
          language === 'bn'
            ? 'পূর্ববর্তী জমা প্রচেষ্টার কারণে উপবিভাগ পরিবর্তন করা সম্ভব নয়। অন্য প্রতিবেদন করতে বর্তমান প্রতিবেদন বাতিল করে নতুনভাবে শুরু করুন।'
            : 'Cannot change subcategory after submission attempt. Cancel this report and start a new one to change category.'
        );
        return;
      }

      setRapePublishingConsentAccepted(false);
      setMobJusticeDetails({ ...EMPTY_MOB_JUSTICE_DETAILS });
      setMobJusticeErrors({});

      // Selection must update synchronously so the radiogroup follows native
      // keyboard semantics. Schema metadata is hydrated immediately afterward.
      revokePreviewUrls(pendingImages);
      setPendingImages([]);
      retryCredentialsRef.current = null;

      const requestId = ++subcategoryConfigRequestRef.current;
      const cachedForm = PublicReportingConfigService.getForm(subcategoryId);
      setReportingForm(cachedForm);

      setFormData((prev) => {
        const isUtilitySwitch =
          prev.segment === 'load_shedding' &&
          Boolean(prev.subcategoryId) &&
          prev.subcategoryId !== subcategoryId;

        return {
          ...prev,
          subcategoryId,
          clientSubmissionId: undefined,
          serverSubmissionState: 'not_attempted',
          hasSupportingInfo: false,
          evidenceTypes: [],
          evidenceDescription: '',
          title: '',
          formSchemaVersion: cachedForm?.version,
          formEngineMode: cachedForm?.engineMode,
          customFieldAnswers: {},
          subjectType: 'unknown',
          sexualHarassmentType: '',
          sexualHarassmentContext: '',
          sexualHarassmentInstitution: '',
          intimateWhatHappened: '',
          intimatePlatform: '',
          frequency:
            prev.subcategoryId === 'sexual-harassment' || subcategoryId === 'sexual-harassment'
              ? 'one-time'
              : prev.frequency,
          ...(isUtilitySwitch
            ? {
                description: '',
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
              }
            : {}),
        };
      });

      // A newly published taxonomy item can appear before a long-lived browser
      // session refreshes its cached form bundle. Force one config refresh only when
      // the selected published subcategory is missing from the cache.
      void PublicReportingConfigService.fetch(!cachedForm)
        .then(() => {
          if (requestId !== subcategoryConfigRequestRef.current) return;
          const selectedForm = PublicReportingConfigService.getForm(subcategoryId);
          setReportingForm(selectedForm);
          setFormData((prev) =>
            prev.subcategoryId === subcategoryId
              ? {
                  ...prev,
                  formSchemaVersion: selectedForm?.version,
                  formEngineMode: selectedForm?.engineMode,
                }
              : prev
          );
        })
        .catch(() => {
          if (requestId !== subcategoryConfigRequestRef.current) return;
          setReportingForm(null);
        });
    },
    [formData.subcategoryId, formData.serverSubmissionState, language, pendingImages]
  );

  const handleNextFromStep2 = useCallback(() => {
    if (!formData.subcategoryId) return;

    // Check Rape pre-report consent requirement
    if (
      formData.subcategoryId === 'rape-sexual-violence' &&
      !rapePublishingConsentAccepted
    ) {
      pendingTargetStepRef.current = { step: 3 };
      setRapeConsentCheckbox(false);
      setIsRapeConsentModalOpen(true);
      return;
    }

    setFormData((prev) => ({ ...prev, currentStep: 3 }));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [formData.subcategoryId, rapePublishingConsentAccepted]);

  const handleNextFromStep3 = useCallback(() => {
    if (!validateMobJusticeSection()) return;

    if (reportingForm?.engineMode === 'schema') {
      if (!configuredFieldsRef.current?.validateAndProceed()) return;
    } else {
      if (!step3Ref.current?.validateAndProceed()) return;
    }

    handleGoToStep(4);
  }, [handleGoToStep, reportingForm?.engineMode, validateMobJusticeSection]);

  // Rape Consent Modal Handlers
  const handleAgreeRapeConsent = useCallback(() => {
    setRapePublishingConsentAccepted(true);
    setIsRapeConsentModalOpen(false);

    const targetStep = pendingTargetStepRef.current?.step || 3;
    const targetJump = pendingTargetStepRef.current?.jumpSection;
    pendingTargetStepRef.current = null;

    setStep3JumpSection(targetJump as any);
    setFormData((prev) => ({
      ...prev,
      currentStep: targetStep,
    }));

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleCancelRapeConsent = useCallback(() => {
    setIsRapeConsentModalOpen(false);
    pendingTargetStepRef.current = null;
    // If currently at step 3 or 4, reset back to step 2 safely
    setFormData((prev) => {
      if (prev.currentStep >= 3) {
        return { ...prev, currentStep: 2 };
      }
      return prev;
    });
  }, []);

  // Confirm before discarding meaningful in-memory report input.
  const handleRequestClose = useCallback(() => {
    if (isSubmitting) return;

    if (submissionResult || !hasMeaningfulReportInput(formData, pendingImages.length)) {
      onClose();
      return;
    }

    setIsConfirmCloseOpen(true);
  }, [isSubmitting, submissionResult, formData, pendingImages.length, onClose]);

  const handleFooterNext = useCallback(() => {
    if (formData.currentStep === 1) handleNextFromStep1();
    else if (formData.currentStep === 2) handleNextFromStep2();
    else if (formData.currentStep === 3) handleNextFromStep3();
  }, [formData.currentStep, handleNextFromStep1, handleNextFromStep2, handleNextFromStep3]);

  const handleFooterBack = useCallback(() => {
    if (formData.currentStep > 1) {
      handleGoToStep(formData.currentStep - 1);
    } else {
      handleRequestClose();
    }
  }, [formData.currentStep, handleGoToStep, handleRequestClose]);

  // Submission handler
  const handleSubmitReport = useCallback(async () => {
    if (!formData.segment || !formData.subcategoryId) return;

    // Rape pre-report consent defense guard
    if (
      formData.subcategoryId === 'rape-sexual-violence' &&
      !rapePublishingConsentAccepted
    ) {
      pendingTargetStepRef.current = { step: 4 };
      setRapeConsentCheckbox(false);
      setIsRapeConsentModalOpen(true);
      setSubmitError(
        language === 'bn'
          ? 'রিপোর্ট শুরুর আগের নীতিমালায় সম্মতি নিশ্চিত করুন।'
          : 'Please confirm the pre-report policy acknowledgement.'
      );
      return;
    }

    // Defense-in-depth: every report must carry a citizen-entered title.
    const normalizedTitle = formData.title?.trim() || '';
    if (!normalizedTitle) {
      setFormData((prev) => ({ ...prev, currentStep: 3 }));
      setSubmitError(
        language === 'bn' ? 'প্রতিবেদনের শিরোনাম লিখুন।' : 'Enter a report title.'
      );
      return;
    }
    if (normalizedTitle.length > REPORT_TITLE_MAX_LENGTH) {
      setFormData((prev) => ({ ...prev, currentStep: 3 }));
      setSubmitError(
        language === 'bn'
          ? 'শিরোনাম ১০০ অক্ষরের মধ্যে রাখুন।'
          : 'Keep the report title within 100 characters.'
      );
      return;
    }

    // Length limit guard
    if ((formData.description?.length || 0) > 2000) {
      setSubmitError(
        language === 'bn'
          ? 'বিবরণটি ২০০০ অক্ষরের মধ্যে সংক্ষিপ্ত করুন।'
          : 'Please shorten the description to 2,000 characters.'
      );
      return;
    }

    // Defense-in-depth: harassment classifications are mandatory before any server call.
    if (
      formData.segment === 'harassment' &&
      (!formData.affectedPersonAgeGroup || !formData.allegedAbuserRelationship || !formData.reportingFor)
    ) {
      setFormData((prev) => ({ ...prev, currentStep: 3 }));
      setSubmitError(
        language === 'bn'
          ? 'হয়রানি ও নির্যাতনের প্রতিবেদন জমা দিতে বয়সের গ্রুপ, অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক এবং কার জন্য প্রতিবেদন করছেন—তিনটি তথ্যই নির্বাচন করুন।'
          : 'Select the age group, relationship with the alleged abuser, and who you are reporting for before submitting a harassment report.'
      );
      setTimeout(() => {
        document.getElementById('composer-section-narrative')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    if (
      formData.segment === 'harassment' &&
      formData.subcategoryId === 'sexual-harassment' &&
      (!formData.sexualHarassmentType || !formData.sexualHarassmentContext)
    ) {
      setFormData((prev) => ({ ...prev, currentStep: 3 }));
      setSubmitError(
        language === 'bn'
          ? 'যৌন হয়রানির ধরন এবং ঘটনার প্রেক্ষাপট—দুটি তথ্যই নির্বাচন করুন।'
          : 'Select both the harassment type and incident context before submitting.'
      );
      setTimeout(() => {
        document.getElementById('composer-section-narrative')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    if (
      formData.segment === 'harassment' &&
      formData.subcategoryId === 'sexual-harassment' &&
      (formData.sexualHarassmentInstitution?.trim().length || 0) > 200
    ) {
      setFormData((prev) => ({ ...prev, currentStep: 3 }));
      setSubmitError(
        language === 'bn'
          ? 'প্রতিষ্ঠান বা সংস্থার নাম ২০০ অক্ষরের মধ্যে রাখুন।'
          : 'Keep the institution or organization within 200 characters.'
      );
      return;
    }

    // Defense-in-depth: Mob Justice classifications must be complete before any server call.
    if (!validateMobJusticeSection()) {
      setFormData((prev) => ({ ...prev, currentStep: 3 }));
      setSubmitError(
        language === 'bn'
          ? 'মব সহিংসতার প্রয়োজনীয় তথ্য পূরণ করুন।'
          : 'Complete the required Mob Justice details before submitting.'
      );
      return;
    }

    // Check if any image is actively preparing
    const isAnyCompressing = pendingImages.some((img) => img.isCompressing);
    if (isAnyCompressing) {
      setSubmitError(
        language === 'bn'
          ? 'ছবি প্রস্তুত সম্পন্ন হওয়া পর্যন্ত অপেক্ষা করুন।'
          : 'Please wait until image preparation completes.'
      );
      return;
    }

    // Check if any image failed preparation
    const hasCompressionError = pendingImages.some((img) => img.compressionError);
    if (hasCompressionError) {
      setSubmitError(
        language === 'bn'
          ? 'যে ছবিগুলো প্রস্তুত করা যায়নি সেগুলো মুছে ফেলুন অথবা অন্য ছবি নির্বাচন করুন।'
          : 'Please remove or replace images that could not be prepared.'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setIsLocationError(false);

    try {
      // Step 0: Capture required reporter device GPS location immediately before submission (FAIL CLOSED)
      const locationResult = await VisitorSessionService.captureReporterDeviceLocation();

      if (!locationResult.success || !locationResult.coords) {
        const errorMsg =
          language === 'bn'
            ? locationResult.messageBn ||
              'প্ল্যাটফর্মের নিরাপত্তা ও স্প্যাম প্রতিরোধের স্বার্থে অভিযোগ জমা দিতে আপনার ডিভাইসের অবস্থান আবশ্যক।'
            : locationResult.messageEn ||
              'Location access is required for complaint submission for platform safety and spam prevention.';

        setIsLocationError(true);
        setSubmitError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const isUtility = (formData.segment as string) === 'utility' || formData.segment === 'load_shedding';

      const rawLoc = formData.location || {
        division: '',
        district: '',
        upazilaOrThana: '',
        area: '',
        road: '',
        landmark: '',
        formattedAddress: '',
      };

      const hasValidIncidentCoords = isValidIncidentCoordinates(rawLoc.lat, rawLoc.lng);
      const safeLat = hasValidIncidentCoords ? rawLoc.lat : undefined;
      const safeLng = hasValidIncidentCoords ? rawLoc.lng : undefined;

      const loc = isUtility
        ? {
            division: rawLoc.division || '',
            district: rawLoc.district || '',
            upazilaOrThana: rawLoc.upazilaOrThana || '',
            area: undefined,
            road: undefined,
            landmark: undefined,
            placeId: undefined,
            formattedAddress: '',
            lat: safeLat,
            lng: safeLng,
          }
        : {
            division: rawLoc.division || '',
            district: rawLoc.district || '',
            upazilaOrThana: rawLoc.upazilaOrThana || '',
            area: rawLoc.area || undefined,
            road: rawLoc.road || undefined,
            landmark: rawLoc.landmark || undefined,
            placeId: rawLoc.placeId || undefined,
            formattedAddress: rawLoc.formattedAddress?.trim() || '',
            lat: safeLat,
            lng: safeLng,
          };

      const isHarassment = formData.segment === 'harassment';
      const isBribery = formData.segment === 'extortion' && formData.subcategoryId === 'bribe-demanded-service';
      const isIllegalOccupation = formData.segment === 'illegal_occupation';
      const hasSchemaPartyBlock = Boolean(
        reportingForm?.engineMode === 'schema' &&
          reportingForm.fields.some(
            (field) => field.active && field.fieldType === 'subject_party'
          )
      );
      const isPartySegment =
        formData.segment === 'rickshaw' ||
        formData.segment === 'extortion' ||
        formData.segment === 'public_safety' ||
        hasSchemaPartyBlock;
      const isChargingStation = isPartySegment && formData.segment === 'rickshaw' && (formData.subcategoryId === 'charging-station-location' || !formData.subcategoryId);

      const resolvedReportedSubject = isChargingStation
        ? ((formData.reportedSubject || formData.organization)?.trim() || undefined)
        : (formData.reportedSubject?.trim() || undefined);

      const resolvedOrganization = isChargingStation
        ? (formData.subjectType === 'organization' ? ((formData.organization || formData.reportedSubject)?.trim() || undefined) : undefined)
        : (formData.organization?.trim() || undefined);

      const payload = {
        segment: formData.segment,
        subcategoryId: formData.subcategoryId,
        title: normalizedTitle,
        description: formData.description || '',
        incidentDate:
          formData.subcategoryId === 'excess-electricity-bill'
            ? formData.incidentDate || (formData.recentBillMonth ? `${formData.recentBillMonth}-01` : new Date().toISOString().split('T')[0])
            : formData.incidentDate || undefined,
        incidentTime:
          formData.subcategoryId === 'excess-electricity-bill' || isIllegalOccupation
            ? undefined
            : formData.incidentTime || undefined,
        utilityEndTime:
          formData.subcategoryId === 'excess-electricity-bill'
            ? undefined
            : formData.utilityEndTime || undefined,
        recentBillMonth: formData.subcategoryId === 'excess-electricity-bill' ? formData.recentBillMonth || undefined : undefined,
        recentBillAmount:
          formData.subcategoryId === 'excess-electricity-bill' && formData.recentBillAmount !== undefined && formData.recentBillAmount !== null && String(formData.recentBillAmount).trim() !== ''
            ? Number(formData.recentBillAmount)
            : undefined,
        previousBillMonth: formData.subcategoryId === 'excess-electricity-bill' ? formData.previousBillMonth || undefined : undefined,
        previousBillAmount:
          formData.subcategoryId === 'excess-electricity-bill' && formData.previousBillAmount !== undefined && formData.previousBillAmount !== null && String(formData.previousBillAmount).trim() !== ''
            ? Number(formData.previousBillAmount)
            : undefined,
        briberyDepartment: isBribery ? formData.briberyDepartment?.trim() || undefined : undefined,
        briberyService: isBribery ? formData.briberyService?.trim() || undefined : undefined,
        briberyAmount:
          isBribery && formData.briberyAmount !== undefined && formData.briberyAmount !== null && String(formData.briberyAmount).trim() !== ''
            ? Number(formData.briberyAmount)
            : undefined,
        mobJusticeDetails: isMobJusticeReport
          ? {
              trigger: mobJusticeDetails.trigger,
              spread: mobJusticeDetails.spread || undefined,
              outcome: mobJusticeDetails.outcome,
              targetedCount:
                mobJusticeDetails.targetedCount === '' ? undefined : Number(mobJusticeDetails.targetedCount),
              ongoingStatus: mobJusticeDetails.ongoingStatus,
            }
          : undefined,
        frequency: isIllegalOccupation ? 'one-time' : formData.frequency || 'one-time',
        affectedPersonAgeGroup: isHarassment ? formData.affectedPersonAgeGroup || undefined : undefined,
        allegedAbuserRelationship: isHarassment ? formData.allegedAbuserRelationship || undefined : undefined,
        reportingFor: isHarassment ? formData.reportingFor || undefined : undefined,
        sexualHarassmentType:
          isHarassment && formData.subcategoryId === 'sexual-harassment'
            ? formData.sexualHarassmentType || undefined
            : undefined,
        sexualHarassmentContext:
          isHarassment && formData.subcategoryId === 'sexual-harassment'
            ? formData.sexualHarassmentContext || undefined
            : undefined,
        sexualHarassmentInstitution:
          isHarassment && formData.subcategoryId === 'sexual-harassment'
            ? formData.sexualHarassmentInstitution?.trim() || undefined
            : undefined,
        subjectType: isPartySegment ? (formData.subjectType || 'unknown') : undefined,
        reportedSubject: isPartySegment ? resolvedReportedSubject : undefined,
        roleOrDesignation: isPartySegment ? (formData.roleOrDesignation?.trim() || undefined) : undefined,
        organization: isPartySegment ? resolvedOrganization : undefined,
        publicProfileHandle: isPartySegment ? (formData.publicProfileHandle?.trim() || undefined) : undefined,
        phoneOrContact: isPartySegment ? (formData.publicProfileHandle?.trim() || undefined) : undefined,
        identifyingDescription: isPartySegment ? (formData.identifyingDescription?.trim() || undefined) : undefined,
        mentionedParties: (() => {
          if (!isPartySegment || !formData.mentionedParties || formData.mentionedParties.length === 0) {
            return undefined;
          }
          const meaningful = formData.mentionedParties.filter(isMeaningfulMentionedParty);
          return meaningful.length > 0 ? meaningful : undefined;
        })(),
        relationshipContext: isPartySegment ? (formData.relationshipContext?.trim() || undefined) : undefined,
        intimateWhatHappened:
          isHarassment && formData.subcategoryId === 'blackmail-coercion'
            ? formData.intimateWhatHappened || undefined
            : undefined,
        intimatePlatform:
          isHarassment && formData.subcategoryId === 'blackmail-coercion'
            ? formData.intimatePlatform || undefined
            : undefined,
        location: loc,
        privacyChoice: formData.privacyChoice || 'anonymous',
        formSchemaVersion: reportingForm?.version || formData.formSchemaVersion,
        formEngineMode: reportingForm?.engineMode || formData.formEngineMode,
        customFieldAnswers: formData.customFieldAnswers || {},
        publicationPreferences: formData.publicationPreferences || {
          showSubjectName: false,
          showOrganization: false,
          showGeneralLocation: true,
          showDescription: true,
        },
        adminContact:
          (isHarassment || reportingForm?.engineMode === 'schema') &&
          (formData.adminName || formData.adminContact)
            ? {
                name: formData.adminName || '',
                contact: formData.adminContact || '',
                consentPublic: Boolean(formData.confirmPublicIdentity),
              }
            : undefined,
        hasSupportingInfo: Boolean(formData.hasSupportingInfo || pendingImages.length > 0),
        evidenceTypes: formData.evidenceTypes || [],
        evidenceDescription: formData.evidenceDescription || undefined,
        website: (formData as any).website || '', // Honeypot anti-bot
      };

      // Keep a stable idempotency key for retries while this composer session remains open.
      let clientSubmissionId =
        retryCredentialsRef.current?.clientSubmissionId ||
        formData.clientSubmissionId;

      if (!clientSubmissionId) {
        clientSubmissionId = generateSecureIdempotencyKey();
      }

      retryCredentialsRef.current = { clientSubmissionId };
      setFormData((prev) => ({
        ...prev,
        clientSubmissionId,
        serverSubmissionState: 'attempted',
      }));

      const filesToUpload = pendingImages.map((img) => img.file);

      // Safely build private reporter context to link to complaint
      const reporterContext = VisitorSessionService.buildReporterSubmissionContext(
        clientSubmissionId,
        locationResult.coords
      );

      const response = await apiClient.submitReport(
        payload,
        filesToUpload,
        clientSubmissionId,
        reporterContext
      );

      if (response && response.reportId) {
        // FULL SUCCESS: Both complaint row AND required evidence uploads/registration succeeded
        revokePreviewUrls(pendingImages);

        // Reset retry credentials on success
        retryCredentialsRef.current = null;
        setPendingImages([]);
        setRapePublishingConsentAccepted(false);
        setMobJusticeDetails({ ...EMPTY_MOB_JUSTICE_DETAILS });
        setMobJusticeErrors({});
        setReportingForm(null);
        setFormData({
          ...INITIAL_REPORT_FORM,
          segment: initialSegment,
          currentStep: 1,
        });
        setSubmissionResult({
          reportId: response.reportId,
        });
      } else {
        throw new Error(
          language === 'bn'
            ? 'প্রতিবেদন জমা দেওয়ার পর সার্ভার থেকে প্রত্যাশিত প্রতিক্রিয়া পাওয়া যায়নি।'
            : 'Invalid response received from server.'
        );
      }
    } catch (err: any) {
      console.warn('Submission failed:', err);
      if (err?.code === 'REPORTER_LOCATION_REQUIRED') {
        setIsLocationError(true);
      }

      const subId = retryCredentialsRef.current?.clientSubmissionId || formData.clientSubmissionId;
      if (subId) {
        setFormData((prev) => ({
          ...prev,
          clientSubmissionId: subId,
          serverSubmissionState: 'attempted',
        }));
      }

      const displayMsg =
        language === 'bn'
          ? err?.messageBn || err?.message || 'প্রতিবেদন জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।'
          : err?.message || 'Failed to submit complaint. Please check your connection and try again.';
      setSubmitError(displayMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    formData,
    pendingImages,
    language,
    rapePublishingConsentAccepted,
    isMobJusticeReport,
    mobJusticeDetails,
    validateMobJusticeSection,
    reportingForm,
    initialSegment,
  ]);

  const handleStartAnother = useCallback(() => {
    revokePreviewUrls(pendingImages);
    retryCredentialsRef.current = null;
    setRapePublishingConsentAccepted(false);
    setRapeConsentCheckbox(false);
    setMobJusticeDetails({ ...EMPTY_MOB_JUSTICE_DETAILS });
    setMobJusticeErrors({});
    setReportingForm(null);
    setFormData({
      ...INITIAL_REPORT_FORM,
      segment: initialSegment,
      currentStep: initialSegment ? 2 : 1,
    });
    setPendingImages([]);
    setSubmissionResult(null);
    setSubmitError(null);
    setIsLocationError(false);
  }, [initialSegment, pendingImages]);

  const handleCancelReport = useCallback(() => {
    revokePreviewUrls(pendingImages);
    clearLegacyReportDraftStorage();
    retryCredentialsRef.current = null;
    setRapePublishingConsentAccepted(false);
    setRapeConsentCheckbox(false);
    setIsRapeConsentModalOpen(false);
    setMobJusticeDetails({ ...EMPTY_MOB_JUSTICE_DETAILS });
    setMobJusticeErrors({});
    pendingTargetStepRef.current = null;
    setSubmitError(null);
    setIsLocationError(false);
    setFormData({
      ...INITIAL_REPORT_FORM,
      segment: initialSegment,
      currentStep: initialSegment ? 2 : 1,
    });
    setPendingImages([]);
    setIsConfirmCloseOpen(false);
    onClose();
  }, [initialSegment, onClose, pendingImages]);

  const handleContinueEditing = useCallback(() => {
    setIsConfirmCloseOpen(false);
  }, []);

  if (!isOpen) return null;

  const canContinueStep1 = Boolean(formData.segment) && !selectedComingSoon;
  const canContinueStep2 = Boolean(formData.subcategoryId);

  // Render-level defense guard: ensure Step 3/4 is NEVER rendered if rape consent is missing
  const effectiveCurrentStep =
    rapeConsentMissing && formData.currentStep >= 3 ? 2 : formData.currentStep;

  return (
    <>
      <Modal
        id="report-composer-modal"
        isOpen={isOpen}
        onClose={handleRequestClose}
        maxWidth={submissionResult ? 'md' : 'composer'}
        mobilePresentation={submissionResult ? 'sheet' : 'fullscreen'}
        showHeader={false}
        keepMounted
        containerClassName="report-composer-shell p-0 border-0 md:border"
        language={language}
        ariaLabel={language === 'bn' ? 'অভিযোগ জমা দেওয়ার ফর্ম' : 'Report submission form'}
      >
        <>
            {/* Step Header */}
            {!submissionResult && (
              <ReportComposerHeader
                currentStep={effectiveCurrentStep}
                totalSteps={4}
                segment={formData.segment}
                language={language}
                onClose={handleRequestClose}
                onSelectStep={(step) => handleGoToStep(step)}
              />
            )}

            {/* Scrollable Form Content */}
            <div
              ref={scrollContainerRef}
              className={
                submissionResult
                  ? 'report-composer-body flex-none overflow-visible px-5 sm:px-6 py-5 sm:py-6'
                  : 'report-composer-body flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6'
              }
            >
              {submitError && (
                <div
                  id="composer-submit-error-banner"
                  role="alert"
                  aria-live="assertive"
                  className="p-4 sm:p-5 rounded-[var(--radius-card)] border flex flex-col sm:flex-row items-start justify-between gap-4 type-compact"
                  style={{
                    backgroundColor: 'var(--ui-error-bg)',
                    borderColor: 'var(--ui-error-border)',
                    color: 'var(--ui-error-text)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    {isLocationError ? (
                      <MapPin className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <div>
                      <p className="font-[var(--font-weight-bold)]">
                        {isLocationError
                          ? language === 'bn'
                            ? 'ডিভাইসের অবস্থান আবশ্যক'
                            : 'Device Location Required'
                          : language === 'bn'
                          ? 'জমা ব্যর্থ হয়েছে'
                          : 'Submission Error'}
                      </p>
                      <p className="mt-1 leading-relaxed">{submitError}</p>
                      {isLocationError && (
                        <p className="mt-2 type-compact opacity-90">
                          {language === 'bn'
                            ? 'ব্রাউজারে লোকেশন অনুমতি বন্ধ থাকলে অ্যাড্রেস বারের তালার আইকন বা সেটিংসে গিয়ে অনুমতি চালু করুন, তারপর পুনরায় চেষ্টা করুন। এই স্ক্রিনে দেওয়া তথ্য সম্পাদনা চালিয়ে যাওয়া পর্যন্ত থাকবে।'
                            : 'If permission is blocked, please click the lock/settings icon in your browser address bar to allow location access, then retry. The information on this screen remains available while you continue editing.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {isLocationError && (
                    <Button
                      id="composer-retry-location-btn"
                      type="button"
                      variant="primary"
                      size="md"
                      disabled={isSubmitting}
                      onClick={handleSubmitReport}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                      className="shrink-0 min-h-[44px] type-compact px-4 self-stretch sm:self-auto justify-center"
                    >
                      {language === 'bn' ? 'অবস্থান যাচাই ও পুনরায় জমা' : 'Retry Location & Submit'}
                    </Button>
                  )}
                </div>
              )}

              {submissionResult ? (
                <StepCompletion
                  reportId={submissionResult.reportId}
                  onSubmitAnother={handleStartAnother}
                  onClose={onClose}
                  language={language}
                />
              ) : (
                <>
                  {effectiveCurrentStep === 1 && (
                    <Step1ServiceSelect
                      selectedSegment={formData.segment}
                      onSelectSegment={handleSelectService}
                      selectedComingSoon={selectedComingSoon}
                      onSelectComingSoon={setSelectedComingSoon}
                      onNavigateToComingSoon={(path) => {
                        revokePreviewUrls(pendingImages);
                        retryCredentialsRef.current = null;
                        setPendingImages([]);
                        onClose();
                        navigateTo(path);
                      }}
                      language={language}
                    />
                  )}

                  {effectiveCurrentStep === 2 && formData.segment && (
                    <Step2ComplaintTypeAccordion
                      segment={formData.segment}
                      selectedSubcategoryId={formData.subcategoryId}
                      onSelectSubcategory={handleSelectSubcategory}
                      language={language}
                    />
                  )}

                  {effectiveCurrentStep === 3 && formData.segment && (
                    <>
                      {isMobJusticeReport && (
                        <MobJusticeDetailsFields
                          value={mobJusticeDetails}
                          errors={mobJusticeErrors}
                          onChange={handleMobJusticeDetailsChange}
                          language={language}
                        />
                      )}
                      {reportingForm?.engineMode === 'schema' ? (
                        <ConfiguredFieldsSection
                          ref={configuredFieldsRef}
                          form={reportingForm}
                          language={language}
                          formData={formData}
                          pendingImages={pendingImages}
                          onPendingImagesChange={handlePendingImagesChange}
                          onUpdateFormData={handleUpdateFormData}
                        />
                      ) : (
                        <Step3ComplaintDetails
                          ref={step3Ref}
                          segment={formData.segment}
                          formData={formData}
                          pendingImages={pendingImages}
                          onPendingImagesChange={handlePendingImagesChange}
                          onUpdateFormData={handleUpdateFormData}
                          onNext={handleNextFromStep3}
                          initialOpenSection={step3JumpSection}
                          language={language}
                        />
                      )}
                    </>
                  )}

                  {effectiveCurrentStep === 4 && formData.segment && (
                    <>
                      {isMobJusticeReport && (
                        <MobJusticeReviewSummary
                          details={mobJusticeDetails}
                          language={language}
                          onEdit={() => handleGoToStep(3)}
                        />
                      )}
                      <ConfiguredFieldsReview
                        form={reportingForm}
                        language={language}
                        answers={formData.customFieldAnswers || {}}
                        onEdit={() => handleGoToStep(3)}
                      />
                      <Step4Review
                        segment={formData.segment}
                        formData={formData}
                        pendingImages={pendingImages}
                        onEditStep={(step, secKey) => handleGoToStep(step, secKey)}
                        onSubmit={handleSubmitReport}
                        isSubmitting={isSubmitting}
                        language={language}
                      />
                    </>
                  )}
                </>
              )}
            </div>

            {/* Centralized Sticky Footer */}
            {!submissionResult && (
              <ReportComposerFooter
                currentStep={effectiveCurrentStep}
                totalSteps={4}
                segment={formData.segment}
                selectedSubcategoryId={formData.subcategoryId}
                language={language}
                onClose={handleRequestClose}
                onBack={handleFooterBack}
                onNext={handleFooterNext}
                onSubmit={handleSubmitReport}
                canContinue={
                  effectiveCurrentStep === 1
                    ? canContinueStep1
                    : effectiveCurrentStep === 2
                    ? canContinueStep2
                    : true
                }
                canSubmit={!isSubmitting}
                isSubmitting={isSubmitting}
              />
            )}
        </>
      </Modal>

      {/* Mandatory Rape Pre-Report Consent Modal */}
      <Modal
        id="rape-pre-report-consent-modal"
        isOpen={isRapeConsentModalOpen}
        onClose={handleCancelRapeConsent}
        maxWidth="md"
        zIndexClass="z-[60]"
        language={language}
        title={language === 'bn' ? 'নিরাপদভাবে প্রতিবেদন করুন' : 'Report safely'}
        headerIcon={<Shield className="w-5 h-5" aria-hidden="true" />}
        showCloseButton={false}
        closeOnEscape={true}
        ariaDescribedBy="rape-consent-description"
        footer={
          <ModalActions
            primary={{
              id: 'rape-consent-agree-btn',
              type: 'button',
              size: 'lg',
              disabled: !rapeConsentCheckbox,
              onClick: handleAgreeRapeConsent,
              label: language === 'bn' ? 'সম্মতি দিয়ে এগিয়ে যান' : 'Acknowledge & Continue',
            }}
            secondary={{
              id: 'rape-consent-back-btn',
              type: 'button',
              size: 'lg',
              onClick: handleCancelRapeConsent,
              label: language === 'bn' ? 'ফিরে যান' : 'Go back',
            }}
          />
        }
      >
        <div className="flex flex-col gap-4 text-ui-content-primary">
          <div className="flex flex-col gap-2.5">
            <h3 className="type-h3 text-ui-content-primary">
              {language === 'bn' ? 'গল্পটি বলুন, পরিচয় নয়' : 'Share the story, not the identity'}
            </h3>

            <div id="rape-consent-description" className="flex flex-col gap-2.5">
              <p className="type-body text-ui-content-primary">
                {language === 'bn'
                  ? 'সবাইকে জানাও কোনো সরকারি, আইনশৃঙ্খলা রক্ষাকারী বা বিচারিক সেবা নয়। এখানে প্রকাশিত প্রতিবেদন কারও অপরাধ প্রমাণ করে না।'
                  : 'Sobaike Janao is not a government, law-enforcement, or judicial service. A published report does not establish anyone’s legal guilt.'}
              </p>
              <p className="type-body text-ui-content-primary">
                {language === 'bn'
                  ? 'হয়রানি ও নির্যাতনের মতো সংবেদনশীল বিষয়ে আমাদের কাছে গুরুত্বপূর্ণ হলো কী ঘটেছে, তার প্রেক্ষাপট ও প্রভাব। কারও আসল পরিচয় নয়।'
                  : 'For sensitive harassment and abuse reports, what matters is what happened, the context, and the impact — not anyone’s real identity.'}
              </p>
            </div>
          </div>

          <div className="ui-radius-control ui-border-default border-ui-stroke-default p-4 bg-ui-surface-subtle">
            <ol className="space-y-3 list-none">
              <li className="flex items-start gap-3">
                <p className="type-body text-ui-content-primary shrink-0" aria-hidden="true">
                  {language === 'bn' ? '১.' : '1.'}
                </p>
                <p className="type-body text-ui-content-primary">
                  {language === 'bn'
                    ? 'কী ঘটেছে, কোথায় বা কখন ঘটেছে এবং কীভাবে প্রভাব ফেলেছে—যতটা সম্ভব নির্দিষ্টভাবে লিখুন।'
                    : 'Describe what happened, where or when it happened, and how it affected people as specifically as you can.'}
                </p>
              </li>
              <li className="flex items-start gap-3">
                <p className="type-body text-ui-content-primary shrink-0" aria-hidden="true">
                  {language === 'bn' ? '২.' : '2.'}
                </p>
                <p className="type-body text-ui-content-primary">
                  {language === 'bn'
                    ? 'আসল নাম, ফোন নম্বর, ঠিকানা, ছবি বা অন্য শনাক্তযোগ্য তথ্য দেবেন না। প্রয়োজন হলে ছদ্মনাম ব্যবহার করুন।'
                    : 'Do not include real names, phone numbers, addresses, photos, or other identifying details. Use a pseudonym when needed.'}
                </p>
              </li>
              <li className="flex items-start gap-3">
                <p className="type-body text-ui-content-primary shrink-0" aria-hidden="true">
                  {language === 'bn' ? '৩.' : '3.'}
                </p>
                <p className="type-body text-ui-content-primary">
                  {language === 'bn'
                    ? 'মিথ্যা, ভিত্তিহীন বা কাউকে ইচ্ছাকৃতভাবে হেয় করার উদ্দেশ্যে অভিযোগ দেবেন না। জরুরি সহায়তার প্রয়োজন হলে ৯৯৯-এ যোগাযোগ করুন।'
                    : 'Do not submit false, baseless, or deliberately harmful allegations. If emergency help is needed, contact 999.'}
                </p>
              </li>
            </ol>
          </div>

          <p className="type-helper text-ui-content-secondary">
            {language === 'bn'
              ? 'নিরাপত্তার স্বার্থে মডারেশন টিম শনাক্তযোগ্য তথ্য সম্পাদনা বা আড়াল করতে পারে। নিরাপদভাবে প্রকাশ করা সম্ভব না হলে প্রতিবেদনটি প্রকাশ নাও হতে পারে।'
              : 'For safety, the moderation team may edit or hide identifying details. A report may not be published if it cannot be shared safely.'}
          </p>

          <div className="pt-1 border-t border-ui-stroke-subtle">
            <Checkbox
              id="rape-consent-checkbox"
              checked={rapeConsentCheckbox}
              onChange={(e) => setRapeConsentCheckbox(e.target.checked)}
              label={
                language === 'bn'
                  ? 'আমি বুঝেছি—এখানে ব্যক্তির পরিচয় নয়, ঘটনার বিবরণ শেয়ার করতে হবে; মিথ্যা বা শনাক্তযোগ্য অভিযোগ দেওয়া যাবে না।'
                  : 'I understand that this service is for sharing the incident, not identifying people, and that false or identifying allegations must not be submitted.'
              }
              labelClassName="type-body text-ui-content-primary"
            />
          </div>
        </div>
      </Modal>

      {/* Cancel report confirmation: no draft saving or recovery. */}
      <Modal
        id="report-cancel-confirm-modal"
        isOpen={isConfirmCloseOpen}
        onClose={handleContinueEditing}
        maxWidth="md"
        zIndexClass="z-[60]"
        language={language}
        title={language === 'bn' ? 'প্রতিবেদন বাতিল করবেন?' : 'Cancel this report?'}
        description={
          language === 'bn'
            ? 'এখন বাতিল করলে এই প্রতিবেদনে দেওয়া তথ্য সংরক্ষিত থাকবে না।'
            : 'If you cancel now, the information entered in this report will not be saved.'
        }
        headerIcon={<AlertCircle className="w-5 h-5" aria-hidden="true" />}
        showCloseButton={false}
        closeOnEscape={true}
        footer={
          <ModalActions
            primary={{
              id: 'report-continue-editing-btn',
              type: 'button',
              size: 'md',
              onClick: handleContinueEditing,
              label: language === 'bn' ? 'সম্পাদনা চালিয়ে যান' : 'Continue editing',
            }}
            secondary={{
              id: 'report-cancel-btn',
              type: 'button',
              variant: 'outline',
              size: 'md',
              onClick: handleCancelReport,
              label: language === 'bn' ? 'প্রতিবেদন বাতিল করুন' : 'Cancel reporting',
            }}
          />
        }
      >
        <p className="type-body text-ui-content-secondary">
          {language === 'bn'
            ? 'আপনি ফিরে গিয়ে সম্পাদনা চালিয়ে যেতে পারেন, অথবা প্রতিবেদনটি সম্পূর্ণভাবে বাতিল করতে পারেন।'
            : 'You can go back and keep editing, or discard this report completely.'}
        </p>
      </Modal>
    </>
  );
};
