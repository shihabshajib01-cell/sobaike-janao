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
import { Step4Review } from './Step4Review';
import { StepCompletion } from './StepCompletion';
import { MobJusticeDetailsFields } from './MobJusticeDetailsFields';
import { MobJusticeReviewSummary } from './MobJusticeReviewSummary';
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
import { CategoryBadge } from '../ui/CategoryBadge';

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

  // Step 3 imperative ref for validation
  const step3Ref = useRef<Step3Handle>(null);

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
          el.focus();
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
      clearLegacyReportDraftStorage();
      setSelectedComingSoon(null);
      setRapePublishingConsentAccepted(false);
      setRapeConsentCheckbox(false);
      setIsRapeConsentModalOpen(false);
      setMobJusticeDetails({ ...EMPTY_MOB_JUSTICE_DETAILS });
      setMobJusticeErrors({});
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
        intimateWhatHappened: '',
        intimatePlatform: '',
        incidentTime: '',
        utilityEndTime: '',
        recentBillMonth: '',
        recentBillAmount: undefined,
        previousBillMonth: '',
        previousBillAmount: undefined,
        briberyDepartment: '',
        briberyService: '',
        briberyAmount: undefined,
      }));
    },
    [formData.segment, formData.serverSubmissionState, formData.clientSubmissionId, language, pendingImages]
  );

  const handleSelectSubcategory = useCallback(
    async (subcategoryId: string, option: SubcategoryOption) => {
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

      // State A: pre-submit subcategory switch
      // Cleanly discard old local evidence attachments and reset idempotency key
      revokePreviewUrls(pendingImages);
      setPendingImages([]);
      retryCredentialsRef.current = null;

      setFormData((prev) => {
        const isUtilitySwitch =
          prev.segment === 'load_shedding' &&
          Boolean(prev.subcategoryId) &&
          prev.subcategoryId !== subcategoryId;

        const updatedTitle =
          isUtilitySwitch || !prev.title?.trim()
            ? language === 'bn'
              ? option.nameBn
              : option.nameEn
            : prev.title;

        return {
          ...prev,
          subcategoryId,
          clientSubmissionId: undefined,
          serverSubmissionState: 'not_attempted',
          hasSupportingInfo: false,
          evidenceTypes: [],
          evidenceDescription: '',
          title: updatedTitle,
          subjectType: 'unknown',
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
    },
    [formData.subcategoryId, formData.serverSubmissionState, formData.clientSubmissionId, language, pendingImages]
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
    if (!step3Ref.current) return;
    const isValid = step3Ref.current.validateAndProceed();
    if (!isValid) return;
    handleGoToStep(4);
  }, [handleGoToStep, validateMobJusticeSection]);

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
      const isPartySegment =
        formData.segment === 'rickshaw' ||
        formData.segment === 'extortion' ||
        formData.segment === 'public_safety';
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
        title: formData.title || '',
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
        intimateWhatHappened: isHarassment ? (formData.intimateWhatHappened || undefined) : undefined,
        intimatePlatform: isHarassment ? (formData.intimatePlatform || undefined) : undefined,
        location: loc,
        privacyChoice: isHarassment ? (formData.privacyChoice || 'anonymous') : 'anonymous',
        publicationPreferences: formData.publicationPreferences || {
          showSubjectName: false,
          showOrganization: false,
          showGeneralLocation: true,
          showDescription: true,
        },
        adminContact:
          isHarassment && (formData.adminName || formData.adminContact)
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
    initialSegment,
  ]);

  const handleStartAnother = useCallback(() => {
    revokePreviewUrls(pendingImages);
    retryCredentialsRef.current = null;
    setRapePublishingConsentAccepted(false);
    setRapeConsentCheckbox(false);
    setMobJusticeDetails({ ...EMPTY_MOB_JUSTICE_DETAILS });
    setMobJusticeErrors({});
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
        maxWidth="composer"
        showHeader={false}
        keepMounted
        containerClassName="p-0 border-0 md:border"
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
              className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6"
            >
              {submitError && (
                <div
                  id="composer-submit-error-banner"
                  role="alert"
                  aria-live="assertive"
                  className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start justify-between gap-4 text-[14px]"
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
                      <p className="font-bold">
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
                        <p className="mt-2 text-[12.5px] opacity-90">
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
                      className="shrink-0 min-h-[44px] text-[14px] px-4 self-stretch sm:self-auto justify-center"
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
        showHeader={false}
        language={language}
        ariaLabel={language === 'bn' ? 'রিপোর্ট প্রকাশনা নীতি সম্মতি' : 'Report publishing policy consent'}
      >
        <div className="p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5 text-left">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-ui-accent-soft text-ui-accent flex items-center justify-center shrink-0 border border-ui-accent/20 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[18px] sm:text-[20px] font-bold text-ui-content-primary leading-tight">
                {language === 'bn' ? 'প্রতিবেদন শুরুর আগে' : 'Before you begin'}
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-[13.5px] sm:text-[14px] leading-relaxed text-ui-content-secondary bg-ui-surface-subtle p-3.5 sm:p-4 rounded-2xl border border-ui-stroke-subtle max-h-[40vh] sm:max-h-[45vh] overflow-y-auto">
            <p>
              {language === 'bn'
                ? 'এই প্ল্যাটফর্ম কোনো আইনি বা বিচারিক সেবা নয়। এখানে প্রতিবেদন প্রকাশের উদ্দেশ্য জনস্বার্থে তথ্য তুলে ধরা—কারও অপরাধ প্রমাণ করা নয়।'
                : 'This platform is not a legal or judicial service. Reports are published to document matters of public interest, not to establish legal guilt.'}
            </p>
            <p>
              {language === 'bn'
                ? 'নিরাপত্তা ও অপব্যবহার রোধে প্রকাশিত প্রতিবেদনে উল্লেখিত ব্যক্তি বা প্রতিষ্ঠানের আসল নাম দেখানো হবে না। সুরক্ষার স্বার্থে মডারেশন টিম তথ্য সম্পাদনা বা গোপন করতে পারে। নিরাপদভাবে প্রকাশ করা সম্ভব না হলে প্রতিবেদনটি প্রকাশ নাও হতে পারে।'
                : 'To prevent harm and misuse, published reports will not display the real name of a mentioned person or organization. Details may be redacted or edited for safety, and reports may not be published if they cannot be shared safely.'}
            </p>
          </div>

          <div className="pt-1">
            <label
              htmlFor="rape-consent-checkbox"
              className="flex items-start gap-3 cursor-pointer select-none group min-h-[44px] py-1"
            >
              <input
                id="rape-consent-checkbox"
                type="checkbox"
                checked={rapeConsentCheckbox}
                onChange={(e) => setRapeConsentCheckbox(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-ui-stroke-subtle text-ui-accent focus:ring-2 focus:ring-ui-focus shrink-0 cursor-pointer"
              />
              <span className="text-[13.5px] sm:text-[14px] font-semibold text-ui-content-primary leading-snug">
                {language === 'bn'
                  ? 'আমি এই প্রকাশনা নীতি পড়েছি এবং সম্মত।'
                  : 'I have read and agree to this publishing policy.'}
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-ui-stroke-subtle">
            <Button
              id="rape-consent-back-btn"
              type="button"
              variant="outline"
              onClick={handleCancelRapeConsent}
              className="min-h-[44px] text-[15px]"
            >
              {language === 'bn' ? 'ফিরে যান' : 'Go back'}
            </Button>

            <Button
              id="rape-consent-agree-btn"
              type="button"
              variant="primary"
              disabled={!rapeConsentCheckbox}
              onClick={handleAgreeRapeConsent}
              className="min-h-[44px] text-[15px] px-5"
            >
              {language === 'bn' ? 'সম্মত হয়ে এগিয়ে যান' : 'Agree and continue'}
            </Button>
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
        showHeader={false}
        language={language}
        ariaLabel={language === 'bn' ? 'প্রতিবেদন বাতিল করার নিশ্চিতকরণ' : 'Cancel report confirmation'}
      >
        <div className="p-6 md:p-8 space-y-5 text-left">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-ui-surface-subtle border border-ui-stroke-subtle flex items-center justify-center shrink-0 text-ui-content-primary mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[19px] sm:text-[20px] font-bold text-ui-content-primary leading-tight">
                {language === 'bn' ? 'প্রতিবেদন বাতিল করবেন?' : 'Cancel this report?'}
              </h3>
              <p className="text-[14px] sm:text-[14.5px] leading-relaxed text-ui-content-secondary">
                {language === 'bn'
                  ? 'এখন বাতিল করলে এই প্রতিবেদনে দেওয়া তথ্য সংরক্ষিত থাকবে না।'
                  : 'If you cancel now, the information entered in this report will not be saved.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-ui-stroke-subtle">
            <Button
              id="report-continue-editing-btn"
              type="button"
              variant="outline"
              size="md"
              onClick={handleContinueEditing}
              className="whitespace-nowrap"
            >
              {language === 'bn' ? 'সম্পাদনা চালিয়ে যান' : 'Continue editing'}
            </Button>

            <Button
              id="report-cancel-btn"
              type="button"
              variant="ghost"
              size="md"
              onClick={handleCancelReport}
              className="text-ui-error-text hover:bg-ui-error-bg whitespace-nowrap"
            >
              {language === 'bn' ? 'প্রতিবেদন বাতিল করুন' : 'Cancel reporting'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
