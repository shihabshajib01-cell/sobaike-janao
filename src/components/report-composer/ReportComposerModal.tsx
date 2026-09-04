import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SectionKey, ComingSoonServiceKey } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { DraftReport, isValidIncidentCoordinates } from '../../services/types';
import { DraftRepository, INITIAL_DRAFT, generateSecureIdempotencyKey } from '../../services/draftRepository';
import { apiClient } from '../../services/apiClient';
import { VisitorSessionService } from '../../services/visitorSessionService';
import { EvidenceDraftStorage } from '../../services/evidenceDraftStorage';
import { AttachedImagePreview } from '../media/ImageAttachmentPicker';
import { ReportComposerHeader } from './ReportComposerHeader';
import { ReportComposerFooter } from './ReportComposerFooter';
import { Step1ServiceSelect } from './Step1ServiceSelect';
import { Step2ComplaintTypeAccordion } from './Step2ComplaintTypeAccordion';
import { Step3ComplaintDetails, Step3Handle } from './Step3ComplaintDetails';
import { Step4Review } from './Step4Review';
import { StepCompletion } from './StepCompletion';
import { SubcategoryOption } from '../../data/reportOptions';
import {
  AlertCircle,
  FileText,
  Trash2,
  Plus,
  ArrowRight,
  Clock,
  MapPin,
  X,
  Save,
  Shield,
  RotateCcw,
  Paperclip,
} from 'lucide-react';

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

  // Saved draft available for explicit recovery prompt
  const [savedDraftAvailable, setSavedDraftAvailable] = useState<DraftReport | null>(null);

  // Main form state - always start on Step 1 with no pre-selected segment unless specified
  const [formData, setFormData] = useState<DraftReport>(() => ({
    ...INITIAL_DRAFT,
    segment: initialSegment,
    currentStep: initialSegment ? 2 : 1,
  }));

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
  const [submittingStage, setSubmittingStage] = useState<'verifying_location' | 'submitting' | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    reportId: string;
  } | null>(null);
  const [isRestoringEvidence, setIsRestoringEvidence] = useState(false);

  // Rape Pre-Report Publishing & Privacy Consent (session-level only - not stored in draft, storage or db)
  const [rapePublishingConsentAccepted, setRapePublishingConsentAccepted] = useState(false);
  const [isRapeConsentModalOpen, setIsRapeConsentModalOpen] = useState(false);
  const [rapeConsentCheckbox, setRapeConsentCheckbox] = useState(false);
  const pendingTargetStepRef = useRef<{ step: number; jumpSection?: string } | null>(null);

  // Close Confirmation state
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);

  // Coming Soon local selection tracking for Step 1
  const [selectedComingSoon, setSelectedComingSoon] = useState<ComingSoonServiceKey | null>(null);

  // Scroll container reference to reset scroll on step change
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Active retry submission credentials (reused across retries until success, reset, or change)
  const retryCredentialsRef = useRef<{ clientSubmissionId: string } | null>(null);

  // Derived state for rape publishing consent requirements
  const requiresRapeConsent = formData.subcategoryId === 'rape-sexual-violence';
  const rapeConsentMissing = requiresRapeConsent && !rapePublishingConsentAccepted;

  // Defensive guard: if formData ever targets Step 3/4 with rape subcategory without consent, open disclaimer and hold step
  useEffect(() => {
    if (isOpen && formData.currentStep >= 3 && rapeConsentMissing && !isRapeConsentModalOpen) {
      pendingTargetStepRef.current = { step: formData.currentStep };
      setRapeConsentCheckbox(false);
      setIsRapeConsentModalOpen(true);
    }
  }, [isOpen, formData.currentStep, rapeConsentMissing, isRapeConsentModalOpen]);

  // Check for saved draft whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedComingSoon(null);
      setRapePublishingConsentAccepted(false);
      setRapeConsentCheckbox(false);
      setIsRapeConsentModalOpen(false);
      pendingTargetStepRef.current = null;

      const saved = DraftRepository.getDraft();
      if (saved && DraftRepository.hasMeaningfulDraft(saved)) {
        setSavedDraftAvailable(saved);
        if (saved.clientSubmissionId) {
          retryCredentialsRef.current = {
            clientSubmissionId: saved.clientSubmissionId,
          };
        }
      } else {
        setSavedDraftAvailable(null);
        retryCredentialsRef.current = null;
        setFormData({
          ...INITIAL_DRAFT,
          segment: initialSegment,
          currentStep: initialSegment ? 2 : 1,
        });
      }
    } else {
      setSelectedComingSoon(null);
      setSubmitError(null);
      setRapePublishingConsentAccepted(false);
      setRapeConsentCheckbox(false);
      setIsRapeConsentModalOpen(false);
      pendingTargetStepRef.current = null;
    }
  }, [isOpen, initialSegment]);

  // Persist draft to local storage on state change once actively editing
  useEffect(() => {
    if (isOpen && !submissionResult && !savedDraftAvailable && DraftRepository.hasMeaningfulDraft(formData)) {
      const idToSave = retryCredentialsRef.current?.clientSubmissionId || formData.clientSubmissionId;
      const pendingRecovery =
        formData.pendingEvidenceRecovery ||
        (pendingImages.length > 0
          ? {
              expectedCount: pendingImages.length,
              fileNames: pendingImages.map((i) => i.originalName || i.file.name),
              status: 'pending' as const,
              lastUpdated: new Date().toISOString(),
            }
          : undefined);

      DraftRepository.saveDraft({
        ...formData,
        ...(idToSave && { clientSubmissionId: idToSave }),
        ...(pendingRecovery && { pendingEvidenceRecovery: pendingRecovery }),
      });
    }
  }, [formData, isOpen, submissionResult, savedDraftAvailable, pendingImages]);

  // Draft Recovery Handlers
  const handleContinueSavedDraft = useCallback(async () => {
    if (savedDraftAvailable) {
      const subId = savedDraftAvailable.clientSubmissionId;
      if (subId) {
        retryCredentialsRef.current = {
          clientSubmissionId: subId,
        };
      }
      setRapePublishingConsentAccepted(false);
      setRapeConsentCheckbox(false);
      setSubmitError(null);
      setIsLocationError(false);
      setSubmittingStage(null);

      setIsRestoringEvidence(true);
      let restoredImages: AttachedImagePreview[] = [];
      if (subId) {
        try {
          restoredImages = await EvidenceDraftStorage.getPendingEvidence(subId);
        } catch (e) {
          console.warn('Failed to restore evidence from storage:', e);
        }
      }
      setIsRestoringEvidence(false);

      const expectedCount = savedDraftAvailable.pendingEvidenceRecovery?.expectedCount || 0;
      let updatedDraft: DraftReport = { ...savedDraftAvailable };

      if (
        savedDraftAvailable.serverSubmissionState === 'attempted' ||
        savedDraftAvailable.pendingEvidenceRecovery?.status === 'failed'
      ) {
        updatedDraft.serverSubmissionState = 'attempted';
      }

      if (restoredImages.length > 0) {
        setPendingImages(restoredImages);
        if (savedDraftAvailable.pendingEvidenceRecovery) {
          updatedDraft = {
            ...updatedDraft,
            hasSupportingInfo: true,
            pendingEvidenceRecovery: {
              ...savedDraftAvailable.pendingEvidenceRecovery,
              status: 'pending',
              lastUpdated: new Date().toISOString(),
            },
          };
        }
      } else if (expectedCount > 0) {
        setPendingImages([]);
        updatedDraft = {
          ...updatedDraft,
          pendingEvidenceRecovery: {
            expectedCount,
            fileNames: savedDraftAvailable.pendingEvidenceRecovery?.fileNames || [],
            status: 'failed',
            lastUpdated: new Date().toISOString(),
          },
        };
      } else {
        setPendingImages([]);
      }

      // If draft was saved on rape subcategory at step 3 or 4, require consent before displaying step 3/4
      if (
        savedDraftAvailable.subcategoryId === 'rape-sexual-violence' &&
        savedDraftAvailable.currentStep >= 3
      ) {
        setFormData(updatedDraft);
        setSavedDraftAvailable(null);
        pendingTargetStepRef.current = { step: savedDraftAvailable.currentStep };
        setIsRapeConsentModalOpen(true);
      } else {
        setFormData(updatedDraft);
        setSavedDraftAvailable(null);
      }
    }
  }, [savedDraftAvailable]);

  const handleStartNewComplaint = useCallback(async () => {
    const subId = savedDraftAvailable?.clientSubmissionId || retryCredentialsRef.current?.clientSubmissionId;
    if (subId) {
      try {
        await EvidenceDraftStorage.deletePendingEvidence(subId);
      } catch {
        // ignore
      }
    }
    EvidenceDraftStorage.revokePreviewUrls(pendingImages);
    retryCredentialsRef.current = null;
    setRapePublishingConsentAccepted(false);
    setRapeConsentCheckbox(false);
    setIsRapeConsentModalOpen(false);
    pendingTargetStepRef.current = null;
    setSubmitError(null);
    setIsLocationError(false);
    setSubmittingStage(null);
    DraftRepository.clearDraft();
    setFormData({
      ...INITIAL_DRAFT,
      segment: null,
      currentStep: 1,
    });
    setPendingImages([]);
    setSavedDraftAvailable(null);
  }, [pendingImages, savedDraftAvailable]);

  const handleDeleteSavedDraft = useCallback(async () => {
    const subId = savedDraftAvailable?.clientSubmissionId || retryCredentialsRef.current?.clientSubmissionId;
    if (subId) {
      try {
        await EvidenceDraftStorage.deletePendingEvidence(subId);
      } catch {
        // ignore
      }
    }
    EvidenceDraftStorage.revokePreviewUrls(pendingImages);
    retryCredentialsRef.current = null;
    setRapePublishingConsentAccepted(false);
    setRapeConsentCheckbox(false);
    setIsRapeConsentModalOpen(false);
    pendingTargetStepRef.current = null;
    setSubmitError(null);
    setIsLocationError(false);
    setSubmittingStage(null);
    DraftRepository.clearDraft();
    setFormData({
      ...INITIAL_DRAFT,
      segment: null,
      currentStep: 1,
    });
    setPendingImages([]);
    setSavedDraftAvailable(null);
  }, [pendingImages, savedDraftAvailable]);

  // Helper to update form data
  const handleUpdateFormData = useCallback((updates: Partial<DraftReport>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Attached images update handler: persists to IndexedDB and synchronizes pendingEvidenceRecovery
  const handlePendingImagesChange = useCallback(
    async (images: AttachedImagePreview[]) => {
      // Revoke any removed object URLs to prevent browser memory leaks
      const nextUrls = new Set(images.map((i) => i.previewUrl));
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

      let subId =
        retryCredentialsRef.current?.clientSubmissionId ||
        formData.clientSubmissionId ||
        DraftRepository.getSubmissionId();

      if (!subId) {
        subId = generateSecureIdempotencyKey();
        retryCredentialsRef.current = { clientSubmissionId: subId };
        setFormData((prev) => ({ ...prev, clientSubmissionId: subId }));
      }

      if (images.length > 0) {
        await EvidenceDraftStorage.savePendingEvidence(subId, images);

        const recovery = {
          expectedCount: images.length,
          fileNames: images.map((i) => i.originalName || i.file.name),
          status: 'pending' as const,
          lastUpdated: new Date().toISOString(),
        };

        setFormData((prev) => ({
          ...prev,
          clientSubmissionId: subId,
          hasSupportingInfo: true,
          pendingEvidenceRecovery: recovery,
        }));

        DraftRepository.saveDraft({
          ...formData,
          clientSubmissionId: subId,
          hasSupportingInfo: true,
          pendingEvidenceRecovery: recovery,
        });
      } else {
        await EvidenceDraftStorage.savePendingEvidence(subId, []);

        const wasFailed = formData.pendingEvidenceRecovery?.status === 'failed';

        setFormData((prev) => ({
          ...prev,
          clientSubmissionId: subId,
          hasSupportingInfo: wasFailed ? prev.hasSupportingInfo : false,
          pendingEvidenceRecovery: wasFailed ? prev.pendingEvidenceRecovery : undefined,
        }));

        DraftRepository.saveDraft({
          ...formData,
          clientSubmissionId: subId,
          hasSupportingInfo: wasFailed ? formData.hasSupportingInfo : false,
          pendingEvidenceRecovery: wasFailed ? formData.pendingEvidenceRecovery : undefined,
        });
      }
    },
    [formData, pendingImages]
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
            ? 'পূর্ববর্তী জমা প্রচেষ্টার কারণে বিভাগ পরিবর্তন করা সম্ভব নয়। অন্য অভিযোগ করতে খসড়াটি মুছুন অথবা নতুন অভিযোগ শুরু করুন।'
            : 'Cannot change category after submission attempt. Please discard this draft or start a new complaint.'
        );
        return;
      }

      setRapePublishingConsentAccepted(false);

      // State A: pre-submit category switch
      // Cleanly discard old local evidence attachments and old clientSubmissionId
      const oldSubId = retryCredentialsRef.current?.clientSubmissionId || formData.clientSubmissionId;
      if (oldSubId) {
        try {
          await EvidenceDraftStorage.deletePendingEvidence(oldSubId);
        } catch {
          // ignore
        }
      }
      EvidenceDraftStorage.revokePreviewUrls(pendingImages);
      setPendingImages([]);
      retryCredentialsRef.current = null;

      setFormData((prev) => ({
        ...prev,
        segment,
        clientSubmissionId: undefined,
        serverSubmissionState: 'not_attempted',
        pendingEvidenceRecovery: undefined,
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
        intimateWhatHappened: '',
        intimatePlatform: '',
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
            ? 'পূর্ববর্তী জমা প্রচেষ্টার কারণে উপবিভাগ পরিবর্তন করা সম্ভব নয়। অন্য অভিযোগ করতে খসড়াটি মুছুন অথবা নতুন অভিযোগ শুরু করুন।'
            : 'Cannot change subcategory after submission attempt. Please discard this draft or start a new complaint.'
        );
        return;
      }

      setRapePublishingConsentAccepted(false);

      // State A: pre-submit subcategory switch
      // Cleanly discard old local evidence attachments and reset idempotency key
      const oldSubId = retryCredentialsRef.current?.clientSubmissionId || formData.clientSubmissionId;
      if (oldSubId) {
        try {
          await EvidenceDraftStorage.deletePendingEvidence(oldSubId);
        } catch {
          // ignore
        }
      }
      EvidenceDraftStorage.revokePreviewUrls(pendingImages);
      setPendingImages([]);
      retryCredentialsRef.current = null;

      setFormData((prev) => {
        const updatedTitle = prev.title?.trim()
          ? prev.title
          : language === 'bn'
          ? option.nameBn
          : option.nameEn;

        return {
          ...prev,
          subcategoryId,
          clientSubmissionId: undefined,
          serverSubmissionState: 'not_attempted',
          pendingEvidenceRecovery: undefined,
          hasSupportingInfo: false,
          evidenceTypes: [],
          evidenceDescription: '',
          title: updatedTitle,
          subjectType: 'unknown',
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
    if (!step3Ref.current) return;
    const isValid = step3Ref.current.validateAndProceed();
    if (!isValid) return;
    handleGoToStep(4);
  }, [handleGoToStep]);

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

  // Close attempt handler - confirms if meaningful draft exists
  const handleRequestClose = useCallback(() => {
    if (isSubmitting) return;

    // If on draft recovery screen, close directly
    if (savedDraftAvailable) {
      onClose();
      return;
    }

    // If completed or no meaningful input, close immediately
    if (submissionResult || !DraftRepository.hasMeaningfulDraft(formData)) {
      onClose();
      return;
    }

    // Meaningful input exists, prompt user with confirmation
    setIsConfirmCloseOpen(true);
  }, [isSubmitting, savedDraftAvailable, submissionResult, formData, onClose]);

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

  // Secure Idempotency key helper
  const generateSecureIdempotencyKey = (): string => {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
    } catch {
      // fallback
    }
    return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  // Submission handler
  const handleSubmitReport = useCallback(async () => {
    if (!formData.segment || !formData.subcategoryId) return;

    // Guard against attempting to complete a complaint with missing required evidence
    const isMissingExpectedEvidence =
      pendingImages.length === 0 &&
      Boolean(formData.pendingEvidenceRecovery && formData.pendingEvidenceRecovery.expectedCount > 0);

    if (isMissingExpectedEvidence) {
      setFormData((prev) => ({ ...prev, currentStep: 3 }));
      setSubmitError(
        language === 'bn'
          ? 'পূর্বে সংযুক্ত প্রমাণাদি আপলোড করা আবশ্যক। জমা সম্পন্ন করতে ৩ নং ধাপে ছবিগুলো পুনরায় সংযুক্ত করুন।'
          : 'Previously attached evidence is required to complete submission. Please reattach the images in Step 3.'
      );
      setTimeout(() => {
        const elem = document.getElementById('composer-section-attachments');
        if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

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

    // Incident coordinate validity defense guard
    if (!isValidIncidentCoordinates(formData.location?.lat, formData.location?.lng)) {
      setFormData((prev) => ({ ...prev, currentStep: 3 }));
      setSubmitError(
        language === 'bn'
          ? 'রিপোর্ট জমা দেওয়ার আগে ম্যাপে ঘটনাস্থল নির্বাচন করুন।'
          : 'Select the incident location on the map before submitting.'
      );
      setTimeout(() => {
        const elem = document.getElementById('composer-section-location');
        if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
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
    setSubmittingStage('verifying_location');

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
        setSubmittingStage(null);
        return;
      }

      setSubmittingStage('submitting');

      const loc = formData.location || {
        division: '',
        district: '',
        upazilaOrThana: '',
        area: '',
        road: '',
        landmark: '',
        formattedAddress: '',
      };

      const isHarassment = formData.segment === 'harassment';
      const isPartySegment = formData.segment === 'rickshaw' || formData.segment === 'extortion';

      const payload = {
        segment: formData.segment,
        subcategoryId: formData.subcategoryId,
        title: formData.title || '',
        description: formData.description || '',
        incidentDate: formData.incidentDate || undefined,
        incidentTime: formData.incidentTime || undefined,
        frequency: formData.frequency || 'one-time',
        subjectType: isPartySegment ? (formData.subjectType || 'unknown') : undefined,
        reportedSubject: isPartySegment ? (formData.reportedSubject?.trim() || undefined) : undefined,
        roleOrDesignation: isPartySegment ? (formData.roleOrDesignation?.trim() || undefined) : undefined,
        organization: isPartySegment ? (formData.organization?.trim() || undefined) : undefined,
        publicProfileHandle: isPartySegment ? (formData.publicProfileHandle?.trim() || undefined) : undefined,
        identifyingDescription: isPartySegment ? (formData.identifyingDescription?.trim() || undefined) : undefined,
        mentionedParties:
          isPartySegment && formData.mentionedParties && formData.mentionedParties.length > 0
            ? formData.mentionedParties.filter((p) => p.name?.trim() || p.organization?.trim())
            : undefined,
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

      // Ensure stable idempotency key across submission retries and persist before server submission
      let clientSubmissionId =
        retryCredentialsRef.current?.clientSubmissionId ||
        formData.clientSubmissionId ||
        DraftRepository.getSubmissionId();

      if (!clientSubmissionId) {
        clientSubmissionId = generateSecureIdempotencyKey();
      }

      // Update ref and in-memory formData
      retryCredentialsRef.current = { clientSubmissionId };
      setFormData((prev) => ({
        ...prev,
        clientSubmissionId,
        serverSubmissionState: 'attempted',
      }));

      // Persist evidence to IndexedDB before server call if any images exist
      if (pendingImages.length > 0) {
        await EvidenceDraftStorage.savePendingEvidence(clientSubmissionId, pendingImages);
      }

      const pendingRecovery =
        pendingImages.length > 0
          ? {
              expectedCount: pendingImages.length,
              fileNames: pendingImages.map((img) => img.originalName || img.file.name),
              status: 'pending' as const,
              lastUpdated: new Date().toISOString(),
            }
          : formData.pendingEvidenceRecovery;

      // Immediately persist draft with clientSubmissionId and serverSubmissionState BEFORE making server submission
      DraftRepository.saveDraft({
        ...formData,
        clientSubmissionId,
        serverSubmissionState: 'attempted',
        hasSupportingInfo: Boolean(formData.hasSupportingInfo || pendingImages.length > 0),
        ...(pendingRecovery && { pendingEvidenceRecovery: pendingRecovery }),
      });

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
        try {
          await EvidenceDraftStorage.deletePendingEvidence(clientSubmissionId);
        } catch {
          // ignore
        }
        EvidenceDraftStorage.revokePreviewUrls(pendingImages);

        // Reset retry credentials on success
        retryCredentialsRef.current = null;
        setPendingImages([]);
        setRapePublishingConsentAccepted(false);
        // Clear saved draft on success
        DraftRepository.clearDraft();
        setFormData({
          ...INITIAL_DRAFT,
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

      // If evidence upload/registration failed OR if complaint was created but evidence threw:
      // We must mark recovery status as 'failed' and preserve draft + submission ID!
      const isEvidenceError =
        err?.code === 'EVIDENCE_UPLOAD_FAILED' ||
        err?.code === 'EVIDENCE_REGISTRATION_FAILED';

      const expectedCount =
        pendingImages.length > 0
          ? pendingImages.length
          : formData.pendingEvidenceRecovery?.expectedCount || 0;

      if (isEvidenceError || expectedCount > 0) {
        const subId = retryCredentialsRef.current?.clientSubmissionId || formData.clientSubmissionId;
        const failedRecovery = {
          expectedCount,
          fileNames:
            pendingImages.length > 0
              ? pendingImages.map((img) => img.originalName || img.file.name)
              : formData.pendingEvidenceRecovery?.fileNames || [],
          status: 'failed' as const,
          lastUpdated: new Date().toISOString(),
        };

        if (subId && pendingImages.length > 0) {
          try {
            await EvidenceDraftStorage.savePendingEvidence(subId, pendingImages);
          } catch {
            // ignore
          }
        }

        setFormData((prev) => ({
          ...prev,
          ...(subId && { clientSubmissionId: subId }),
          serverSubmissionState: 'attempted',
          hasSupportingInfo: true,
          pendingEvidenceRecovery: failedRecovery,
        }));

        DraftRepository.saveDraft({
          ...formData,
          ...(subId && { clientSubmissionId: subId }),
          serverSubmissionState: 'attempted',
          hasSupportingInfo: true,
          pendingEvidenceRecovery: failedRecovery,
        });
      }

      const displayMsg =
        language === 'bn'
          ? err?.messageBn || err?.message || 'প্রতিবেদন জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।'
          : err?.message || 'Failed to submit complaint. Please check your connection and try again.';
      setSubmitError(displayMsg);
    } finally {
      setIsSubmitting(false);
      setSubmittingStage(null);
    }

  }, [formData, pendingImages, language, rapePublishingConsentAccepted]);

  const handleStartAnother = useCallback(async () => {
    const subId = retryCredentialsRef.current?.clientSubmissionId || formData.clientSubmissionId;
    if (subId) {
      try {
        await EvidenceDraftStorage.deletePendingEvidence(subId);
      } catch {
        // ignore
      }
    }
    EvidenceDraftStorage.revokePreviewUrls(pendingImages);
    retryCredentialsRef.current = null;
    setRapePublishingConsentAccepted(false);
    setRapeConsentCheckbox(false);
    DraftRepository.clearDraft();
    setFormData({
      ...INITIAL_DRAFT,
      segment: initialSegment,
      currentStep: initialSegment ? 2 : 1,
    });
    setPendingImages([]);
    setSubmissionResult(null);
    setSubmitError(null);
  }, [formData.clientSubmissionId, initialSegment, pendingImages]);

  // Discard draft action
  const handleDiscardDraft = useCallback(async () => {
    const subId = retryCredentialsRef.current?.clientSubmissionId || formData.clientSubmissionId;
    if (subId) {
      try {
        await EvidenceDraftStorage.deletePendingEvidence(subId);
      } catch {
        // ignore
      }
    }
    EvidenceDraftStorage.revokePreviewUrls(pendingImages);
    retryCredentialsRef.current = null;
    setRapePublishingConsentAccepted(false);
    setRapeConsentCheckbox(false);
    DraftRepository.clearDraft();
    setFormData({
      ...INITIAL_DRAFT,
      segment: initialSegment,
      currentStep: 1,
    });
    setPendingImages([]);
    setIsConfirmCloseOpen(false);
    onClose();
  }, [formData.clientSubmissionId, initialSegment, onClose, pendingImages]);

  // Continue editing action
  const handleContinueEditing = useCallback(() => {
    setIsConfirmCloseOpen(false);
  }, []);

  // Save & exit modal action
  const handleSaveAndExit = useCallback(async () => {
    let idToSave = retryCredentialsRef.current?.clientSubmissionId || formData.clientSubmissionId;
    if (!idToSave) {
      idToSave = generateSecureIdempotencyKey();
      retryCredentialsRef.current = { clientSubmissionId: idToSave };
    }

    if (pendingImages.length > 0) {
      try {
        await EvidenceDraftStorage.savePendingEvidence(idToSave, pendingImages);
      } catch {
        // ignore
      }
    }

    const pendingRecovery =
      formData.pendingEvidenceRecovery ||
      (pendingImages.length > 0
        ? {
            expectedCount: pendingImages.length,
            fileNames: pendingImages.map((i) => i.originalName || i.file.name),
            status: 'pending' as const,
            lastUpdated: new Date().toISOString(),
          }
        : undefined);

    DraftRepository.saveDraft({
      ...formData,
      clientSubmissionId: idToSave,
      ...(pendingRecovery && { pendingEvidenceRecovery: pendingRecovery }),
    });
    setIsConfirmCloseOpen(false);
    onClose();
  }, [formData, onClose, pendingImages]);

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
      >
        {/* Case 1: Draft Recovery Prompt Screen */}
        {savedDraftAvailable ? (
          <div className="p-6 md:p-8 space-y-6 flex flex-col justify-between">
            {/* Header with Close */}
            <div className="flex items-center justify-between border-b border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-subtle flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[20px] md:text-[22px] font-bold text-primary">
                    {language === 'bn' ? 'সংরক্ষিত খসড়া পাওয়া গেছে' : 'Unfinished Draft Available'}
                  </h2>
                  <p className="text-[14px] text-muted">
                    {language === 'bn'
                      ? 'আপনার পূর্বে তৈরি করা একটি খসড়া এই ডিভাইসে সংরক্ষিত রয়েছে।'
                      : 'You have an unsaved complaint draft stored on this device.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-lg border border-subtle hover:bg-surface-subtle flex items-center justify-center text-secondary hover:text-primary cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Draft Summary Card */}
            <div className="p-5 bg-surface-subtle border border-subtle rounded-2xl space-y-3.5 text-left">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle pb-3">
                <div className="flex items-center gap-2">
                  {savedDraftAvailable.segment && (
                    <CategoryBadge section={savedDraftAvailable.segment} language={language} size="sm" />
                  )}
                  <span className="text-[14px] font-semibold text-primary">
                    {language === 'bn'
                      ? `ধাপ ${savedDraftAvailable.currentStep} পর্যন্ত পূরণকৃত`
                      : `Filled up to Step ${savedDraftAvailable.currentStep}`}
                  </span>
                </div>
                {savedDraftAvailable.lastSavedAt && (
                  <div className="flex items-center gap-1.5 text-[12px] text-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(savedDraftAvailable.lastSavedAt).toLocaleString(
                        language === 'bn' ? 'bn-BD' : 'en-US'
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                {savedDraftAvailable.title && (
                  <div className="text-[16px] font-bold text-primary">
                    {savedDraftAvailable.title}
                  </div>
                )}
                {savedDraftAvailable.reportedSubject && (
                  <div className="text-[14px] text-secondary">
                    <span className="text-muted">
                      {language === 'bn' ? 'অভিযুক্ত পক্ষ: ' : 'Subject: '}
                    </span>
                    <span className="font-semibold">{savedDraftAvailable.reportedSubject}</span>
                  </div>
                )}
                {savedDraftAvailable.location?.district && (
                  <div className="flex items-center gap-1 text-[14px] text-muted">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {savedDraftAvailable.location.district}{' '}
                      {savedDraftAvailable.location.area ? `(${savedDraftAvailable.location.area})` : ''}
                    </span>
                  </div>
                )}
                {savedDraftAvailable.pendingEvidenceRecovery && savedDraftAvailable.pendingEvidenceRecovery.expectedCount > 0 && (
                  <div className="flex items-center gap-1.5 text-[13px] text-muted">
                    <Paperclip className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {language === 'bn'
                        ? `${savedDraftAvailable.pendingEvidenceRecovery.expectedCount}টি প্রমাণ সংযুক্ত রয়েছে`
                        : `${savedDraftAvailable.pendingEvidenceRecovery.expectedCount} evidence item(s) attached`}
                    </span>
                  </div>
                )}
                {savedDraftAvailable.description && (
                  <p className="text-[14px] text-secondary line-clamp-2 italic pt-1">
                    "{savedDraftAvailable.description}"
                  </p>
                )}
              </div>
            </div>

            {/* Actions: Continue Draft | Start New Complaint | Delete Draft */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              {/* Delete Draft */}
              <button
                id="draft-recovery-delete-btn"
                type="button"
                onClick={handleDeleteSavedDraft}
                className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-surface hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-[15px] transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{language === 'bn' ? 'খসড়া মুছে ফেলুন' : 'Delete Draft'}</span>
              </button>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Start New Complaint */}
                <button
                  id="draft-recovery-new-btn"
                  type="button"
                  onClick={handleStartNewComplaint}
                  className="px-4 py-2.5 rounded-xl border border-subtle bg-surface hover:bg-surface-subtle text-secondary hover:text-primary font-semibold text-[15px] transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'bn' ? 'নতুন অভিযোগ শুরু করুন' : 'Start New Complaint'}</span>
                </button>

                {/* Continue Draft */}
                <button
                  id="draft-recovery-continue-btn"
                  type="button"
                  onClick={handleContinueSavedDraft}
                  disabled={isRestoringEvidence}
                  className={`btn-primary-action px-5 py-2.5 rounded-xl font-bold text-[16px] min-h-[44px] cursor-pointer shadow-xs flex items-center justify-center gap-2 ${
                    isRestoringEvidence ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  <span>
                    {isRestoringEvidence
                      ? language === 'bn'
                        ? 'লোড হচ্ছে...'
                        : 'Loading...'
                      : language === 'bn'
                      ? 'খসড়া থেকে শুরু করুন'
                      : 'Continue Draft'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Case 2: Standard Step-by-Step Composer Flow */
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
                  className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start justify-between gap-4 text-[14px]"
                  style={{
                    backgroundColor: 'var(--ui-error-bg)',
                    borderColor: 'var(--ui-error-border)',
                    color: 'var(--ui-error-text)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    {isLocationError ? (
                      <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
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
                            ? 'ব্রাউজারে লোকেশন অনুমতি বন্ধ থাকলে অ্যাড্রেস বারের তালার আইকন বা সেটিংসে গিয়ে অনুমতি চালু করুন, তারপর পুনরায় চেষ্টা করুন। আপনার সম্পূর্ণ খসড়াটি সংরক্ষিত রয়েছে।'
                            : 'If permission is blocked, please click the lock/settings icon in your browser address bar to allow location access, then retry. Your completed draft is safely preserved.'}
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
                        if (DraftRepository.hasMeaningfulDraft(formData)) {
                          const idToSave =
                            retryCredentialsRef.current?.clientSubmissionId || formData.clientSubmissionId;
                          const pendingRecovery =
                            formData.pendingEvidenceRecovery ||
                            (pendingImages.length > 0
                              ? {
                                  expectedCount: pendingImages.length,
                                  fileNames: pendingImages.map((i) => i.originalName || i.file.name),
                                  status: 'pending' as const,
                                  lastUpdated: new Date().toISOString(),
                                }
                              : undefined);

                          DraftRepository.saveDraft({
                            ...formData,
                            ...(idToSave && { clientSubmissionId: idToSave }),
                            ...(pendingRecovery && { pendingEvidenceRecovery: pendingRecovery }),
                          });
                        }
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

                  {effectiveCurrentStep === 4 && formData.segment && (
                    <Step4Review
                      segment={formData.segment}
                      formData={formData}
                      pendingImages={pendingImages}
                      onEditStep={(step, secKey) => handleGoToStep(step, secKey)}
                      onSubmit={handleSubmitReport}
                      isSubmitting={isSubmitting}
                      language={language}
                    />
                  )}
                </>
              )}
            </div>

            {/* Centralized Sticky Footer */}
            {!submissionResult && (
              <ReportComposerFooter
                currentStep={effectiveCurrentStep}
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
                canSubmit={
                  !isSubmitting &&
                  !(
                    pendingImages.length === 0 &&
                    Boolean(formData.pendingEvidenceRecovery && formData.pendingEvidenceRecovery.expectedCount > 0)
                  )
                }
                isSubmitting={isSubmitting}
                submittingText={
                  submittingStage === 'verifying_location'
                    ? language === 'bn'
                      ? 'ডিভাইসের অবস্থান যাচাই হচ্ছে...'
                      : 'Verifying device location...'
                    : undefined
                }
              />

            )}
          </>
        )}
      </Modal>

      {/* Mandatory Rape Pre-Report Consent Modal */}
      <Modal
        id="rape-pre-report-consent-modal"
        isOpen={isRapeConsentModalOpen}
        onClose={handleCancelRapeConsent}
        maxWidth="md"
        zIndexClass="z-[60]"
        showHeader={false}
      >
        <div className="p-5 sm:p-6 md:p-8 space-y-4 sm:space-y-5 text-left">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0 border border-accent/20 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[18px] sm:text-[20px] font-bold text-primary leading-tight">
                {language === 'bn' ? 'রিপোর্ট শুরুর আগে' : 'Before you start'}
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-[13.5px] sm:text-[14px] leading-relaxed text-secondary bg-surface-subtle p-3.5 sm:p-4 rounded-2xl border border-subtle max-h-[40vh] sm:max-h-[45vh] overflow-y-auto">
            <p>
              {language === 'bn'
                ? 'এই প্ল্যাটফর্ম কোনো আইনগত বা বিচারিক সেবা নয়। এখানে প্রতিবেদন প্রকাশের উদ্দেশ্য জনস্বার্থে ঘটনা তুলে ধরা—কারও অপরাধ প্রমাণ করা নয়।'
                : 'This platform is not a legal or judicial service. Reports are published to bring matters of public interest to attention—not to determine guilt.'}
            </p>
            <p>
              {language === 'bn'
                ? 'নিরাপত্তা ও অপব্যবহার রোধে প্রকাশিত প্রতিবেদনে অভিযুক্ত ব্যক্তি বা প্রতিষ্ঠানের আসল নাম দেখানো হবে না। এমন তথ্য থাকলে মডারেশন টিম তা গোপন বা সম্পাদনা করতে পারে। নিরাপদভাবে প্রকাশ করা সম্ভব না হলে প্রতিবেদনটি প্রকাশ নাও হতে পারে।'
                : 'To reduce harm and misuse, published reports will not reveal the real name of an accused person or organization. Moderators may hide or edit identifying information before publication. A report may not be published if it cannot be shared safely.'}
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
                className="mt-1 w-4 h-4 rounded border-subtle text-accent focus:ring-2 focus:ring-[var(--ui-focus)] shrink-0 cursor-pointer"
              />
              <span className="text-[13.5px] sm:text-[14px] font-semibold text-primary leading-snug group-hover:text-primary">
                {language === 'bn'
                  ? 'আমি বিষয়টি বুঝেছি এবং এই প্রকাশনা নীতিতে সম্মত।'
                  : 'I understand and agree to this publishing policy.'}
              </span>
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-subtle">
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
              {language === 'bn' ? 'সম্মত হয়ে চালিয়ে যান' : 'Agree & Continue'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Exit Draft Confirmation Dialog - Clean, Clear Hierarchy */}
      <Modal
        id="draft-confirm-close-modal"
        isOpen={isConfirmCloseOpen}
        onClose={handleContinueEditing}
        maxWidth="md"
        zIndexClass="z-[60]"
        showHeader={false}
      >
        <div className="p-6 md:p-8 space-y-5 text-left">
          {/* Icon + Title Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-surface-subtle border border-subtle flex items-center justify-center shrink-0 text-primary mt-0.5">
              <Save className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[19px] sm:text-[20px] font-bold text-primary leading-tight">
                {language === 'bn' ? 'এখন বন্ধ করবেন?' : 'Close for now?'}
              </h3>
              <p className="text-[14px] sm:text-[14.5px] leading-relaxed text-secondary">
                {language === 'bn'
                  ? 'আপনার খসড়া সংরক্ষিত আছে। পরে আবার এখান থেকে চালিয়ে যেতে পারবেন।'
                  : 'Your draft is saved. You can continue from here later.'}
              </p>
            </div>
          </div>

          {/* Action Buttons: Left: Delete draft | Right: Keep editing + Close */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-subtle">
            <button
              id="draft-discard-btn"
              type="button"
              onClick={handleDiscardDraft}
              className="px-3 py-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10 font-semibold text-[13.5px] sm:text-[14px] transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-500/40"
            >
              <Trash2 className="w-4 h-4" />
              <span>{language === 'bn' ? 'খসড়া মুছুন' : 'Delete draft'}</span>
            </button>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5">
              <Button
                id="draft-continue-btn"
                type="button"
                variant="outline"
                onClick={handleContinueEditing}
                className="min-h-[44px] text-[15px]"
              >
                {language === 'bn' ? 'সম্পাদনা চালিয়ে যান' : 'Keep editing'}
              </Button>

              <Button
                id="draft-save-exit-btn"
                type="button"
                variant="primary"
                onClick={handleSaveAndExit}
                className="min-h-[44px] text-[15px] px-6"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
