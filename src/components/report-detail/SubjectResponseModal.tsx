import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, Scale, Send } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { ModalActions } from '../ui/ModalActions';
import { UnsavedChangesDialog } from '../ui/UnsavedChangesDialog';

/**
 * Rollout gate: Controls whether the simplified Subject Response form is enabled.
 * Production connection verified with backend SQL contract (supabase/allow_subject_response_without_responder_type.sql).
 */
export const SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED = true;

interface SubjectResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  subjectName: string;
  language: 'bn' | 'en';
}

export const SubjectResponseModal: React.FC<SubjectResponseModalProps> = ({
  isOpen,
  onClose,
  reportId,
  subjectName,
  language,
}) => {
  const [responderType, setResponderType] = useState<'mentioned_person' | 'organization_rep' | 'legal_rep'>('mentioned_person');
  const [responderName, setResponderName] = useState('');
  const [designation, setDesignation] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [contactEmailOrPhone, setContactEmailOrPhone] = useState('');
  const [officialStatement, setOfficialStatement] = useState('');
  const [supportingDocumentsNote, setSupportingDocumentsNote] = useState('');
  const [requestCorrectionOrRemoval, setRequestCorrectionOrRemoval] = useState(false);
  const [correctionDetails, setCorrectionDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setResponseId(null);
      setError(null);
      setIsDiscardConfirmOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!responderName.trim() || !contactEmailOrPhone.trim() || !officialStatement.trim()) {
      setError(
        language === 'bn'
          ? (SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
              ? 'আপনার পূর্ণ নাম, ইমেইল বা ফোন এবং জবাব লিখুন।'
              : 'অনুগ্রহ করে আপনার নাম, যোগাযোগের মাধ্যম এবং আনুষ্ঠানিক বক্তব্য পূরণ করুন।')
          : (SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
              ? 'Enter your full name, email or phone, and response.'
              : 'Please provide your full name, contact information, and formal statement.')
      );
      return;
    }

    if (officialStatement.trim().length < 10) {
      setError(
        language === 'bn'
          ? (SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
              ? 'জবাবে অন্তত ১০ অক্ষর লিখুন।'
              : 'বক্তব্য কমপক্ষে ১০ অক্ষরের হতে হবে।')
          : (SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
              ? 'Enter at least 10 characters in your response.'
              : 'Statement must be at least 10 characters.')
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload: Parameters<typeof apiClient.submitSubjectResponse>[1] = SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
        ? {
            responderName: responderName.trim(),
            contactEmailOrPhone: contactEmailOrPhone.trim(),
            designation: designation.trim() || undefined,
            organizationName: organizationName.trim() || undefined,
            officialStatement: officialStatement.trim(),
          }
        : {
            responderType,
            responderName: responderName.trim(),
            designation: designation.trim() || undefined,
            organizationName: organizationName.trim() || undefined,
            contactEmailOrPhone: contactEmailOrPhone.trim(),
            officialStatement: officialStatement.trim(),
            supportingDocumentsNote: supportingDocumentsNote.trim() || undefined,
            requestCorrectionOrRemoval,
            correctionDetails: requestCorrectionOrRemoval ? correctionDetails.trim() : undefined,
          };

      const res = await apiClient.submitSubjectResponse(reportId, payload);
      setResponseId(res.responseId || null);
      setIsSubmitted(true);
    } catch (err: any) {
      const errorMessage =
        language === 'bn'
          ? err?.messageBn || err?.message || 'প্রতিউত্তর জমা দেওয়ার সেবা বর্তমানে উপলভ্য নয়।'
          : err?.message || 'Response submission is temporarily unavailable.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDirty = Boolean(
    responderName.trim() ||
    designation.trim() ||
    organizationName.trim() ||
    contactEmailOrPhone.trim() ||
    officialStatement.trim() ||
    supportingDocumentsNote.trim() ||
    requestCorrectionOrRemoval ||
    correctionDetails.trim() ||
    responderType !== 'mentioned_person'
  );

  const handleResetAndClose = () => {
    setResponderType('mentioned_person');
    setResponderName('');
    setDesignation('');
    setOrganizationName('');
    setContactEmailOrPhone('');
    setOfficialStatement('');
    setSupportingDocumentsNote('');
    setRequestCorrectionOrRemoval(false);
    setCorrectionDetails('');
    setIsSubmitted(false);
    setIsSubmitting(false);
    setResponseId(null);
    setError(null);
    setIsDiscardConfirmOpen(false);
    onClose();
  };

  const handleRequestClose = () => {
    if (isSubmitting) return;

    if (!isSubmitted && isDirty) {
      setIsDiscardConfirmOpen(true);
      return;
    }

    handleResetAndClose();
  };

  return (
    <>
      <Modal
      id="subject-response-modal"
      isOpen={isOpen}
      onClose={handleRequestClose}
      closeOnBackdrop={false}
      closeOnEscape={true}
      maxWidth="lg"
      language={language}
      title={
        SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
          ? (language === 'bn' ? 'প্রতিবেদনের জবাব দিন' : 'Respond to this report')
          : (language === 'bn'
              ? 'উল্লেখিত ব্যক্তি বা প্রতিষ্ঠানের আনুষ্ঠানিক বক্তব্য জমা দিন'
              : 'Submit Official Response or Clarification')
      }
      description={
        language === 'bn'
          ? `উল্লেখিত ব্যক্তি বা প্রতিষ্ঠান: ${subjectName}`
          : `Mentioned person or organization: ${subjectName}`
      }
      footer={
        isSubmitted ? (
          <ModalActions
            align="center"
            primary={{
              type: 'button',
              size: 'md',
              onClick: handleResetAndClose,
              label: language === 'bn' ? 'বন্ধ করুন' : 'Close',
            }}
          />
        ) : (
          <ModalActions
            primary={{
              form: 'subject-response-form',
              type: 'submit',
              size: 'md',
              isLoading: isSubmitting,
              leftIcon: <Send className="w-4 h-4" aria-hidden="true" />,
              label: isSubmitting
                ? (language === 'bn' ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...')
                : language === 'bn'
                  ? (SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                      ? 'জবাব জমা দিন'
                      : 'আনুষ্ঠানিক প্রতিউত্তর জমা দিন')
                  : 'Submit response',
            }}
            secondary={{
              type: 'button',
              size: 'md',
              onClick: handleRequestClose,
              disabled: isSubmitting,
              label: language === 'bn' ? 'বাতিল' : 'Cancel',
            }}
          />
        )
      }
    >
      {!SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED && (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 ui-radius-badge-md type-helper font-[var(--font-weight-semibold)] ui-border-default mb-4"
          style={{
            backgroundColor: 'var(--ui-info-bg)',
            borderColor: 'var(--ui-info-border)',
            color: 'var(--ui-info-text)',
          }}
        >
          <Scale className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{language === 'bn' ? 'প্রতিউত্তরের অধিকার' : 'Formal Right of Response'}</span>
        </div>
      )}

      {isSubmitted ? (
        <div role="status" aria-live="polite" className="py-3 text-center space-y-4">
              <div className="w-12 h-12 bg-ui-success-bg text-ui-success-text border border-ui-success-border rounded-[var(--radius-pill)] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="type-h3 leading-[var(--type-line-26)] font-[var(--font-weight-bold)] text-ui-content-primary">
                  {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                    ? (language === 'bn' ? 'জবাব জমা হয়েছে' : 'Response submitted')
                    : (language === 'bn' ? 'প্রতিউত্তর জমা সম্পন্ন হয়েছে' : 'Response Received')}
                </h4>
                <p className="type-label leading-[var(--type-line-24)] text-ui-content-secondary max-w-md mx-auto">
                  {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                    ? (language === 'bn'
                        ? 'আপনার জবাব পর্যালোচনার জন্য পাঠানো হয়েছে।'
                        : 'Your response has been sent for review.')
                    : (language === 'bn'
                        ? 'আপনার প্রতিক্রিয়া মডারেশনের জন্য জমা হয়েছে। প্রকাশযোগ্য সংস্করণ আলাদা প্রকাশনা প্রক্রিয়ার মাধ্যমে পরিচালিত হবে।'
                        : 'Your response will be submitted for moderation. Any public display is handled through the publication workflow.')}
                </p>
              </div>
              {responseId && (
                <div className="p-3 bg-ui-surface-subtle rounded-[var(--radius-control)] border border-ui-stroke-subtle text-center inline-block max-w-xs mx-auto">
                  <span className="type-compact text-ui-content-muted block">
                    {language === 'bn' ? 'রেসপন্স আইডি' : 'Response ID'}
                  </span>
                  <span className="tabular-nums type-h4 font-[var(--font-weight-bold)] text-ui-content-primary">
                    {responseId}
                  </span>
                </div>
              )}
        </div>
      ) : (
        <form id="subject-response-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3.5 bg-ui-error-bg border border-ui-error-border text-ui-error-text rounded-[var(--radius-control)] type-compact font-[var(--font-weight-medium)]">
                {error}
              </div>
            )}

            {/* Responder Identity Category - only rendered in legacy form */}
            {!SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED && (
              <div className="space-y-1.5">
                <label className="block type-label font-[var(--font-weight-medium)] text-ui-content-primary">
                  {language === 'bn' ? 'আপনার পরিচয় বা ভূমিকা *' : 'Your Relationship to This Report *'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="md"
                    fullWidth
                    variant={responderType === 'mentioned_person' ? 'primary' : 'outline'}
                    onClick={() => setResponderType('mentioned_person')}
                  >
                    {language === 'bn' ? 'আমি সরাসরি উল্লেখিত ব্যক্তি' : 'Mentioned Individual'}
                  </Button>
                  <Button
                    type="button"
                    size="md"
                    fullWidth
                    variant={responderType === 'organization_rep' ? 'primary' : 'outline'}
                    onClick={() => setResponderType('organization_rep')}
                  >
                    {language === 'bn' ? 'প্রতিষ্ঠানের মুখপাত্র/প্রতিনিধি' : 'Authorized Representative'}
                  </Button>
                  <Button
                    type="button"
                    size="md"
                    fullWidth
                    variant={responderType === 'legal_rep' ? 'primary' : 'outline'}
                    onClick={() => setResponderType('legal_rep')}
                  >
                    {language === 'bn' ? 'আইনি প্রতিনিধি / আইনজীবী' : 'Legal Counsel'}
                  </Button>
                </div>
              </div>
            )}

            {/* Name and Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="subject-responder-name-input" className="block type-label font-[var(--font-weight-medium)] text-ui-content-primary">
                  {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                    ? (language === 'bn' ? 'পূর্ণ নাম *' : 'Full name *')
                    : (language === 'bn' ? 'আপনার পূর্ণ নাম *' : 'Full Legal Name *')}
                </label>
                <input
                  id="subject-responder-name-input"
                  name="responderName"
                  type="text"
                  required
                  aria-required="true"
                  value={responderName}
                  onChange={(e) => setResponderName(e.target.value)}
                  placeholder={language === 'bn' ? 'উদাঃ মোস্তাফিজুর রহমান' : 'e.g. Mostafizur Rahman'}
                  className="w-full px-[var(--field-padding-x)] ui-space-field-y bg-ui-input ui-border-default border-ui-stroke-default focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent ui-radius-control ui-control type-body text-ui-content-primary placeholder:text-ui-input-placeholder"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="subject-contact-email-phone-input" className="block type-label font-[var(--font-weight-medium)] text-ui-content-primary">
                  {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                    ? (language === 'bn' ? 'ইমেইল বা ফোন *' : 'Email or phone *')
                    : (language === 'bn' ? 'যাচাইযোগ্য ইমেইল বা ফোন *' : 'Contact Email or Phone *')}
                </label>
                <input
                  id="subject-contact-email-phone-input"
                  name="contactEmailOrPhone"
                  type="text"
                  required
                  aria-required="true"
                  value={contactEmailOrPhone}
                  onChange={(e) => setContactEmailOrPhone(e.target.value)}
                  placeholder={language === 'bn' ? 'name@example.com / 01XXXXXXXXX' : 'name@example.com / 01XXXXXXXXX'}
                  className="w-full px-[var(--field-padding-x)] ui-space-field-y bg-ui-input ui-border-default border-ui-stroke-default focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent ui-radius-control ui-control type-body text-ui-content-primary placeholder:text-ui-input-placeholder"
                />
              </div>
            </div>

            {/* Role & Org */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="subject-designation-input" className="block type-label font-[var(--font-weight-medium)] text-ui-content-primary">
                  {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                    ? (language === 'bn' ? 'পদবী / ভূমিকা (ঐচ্ছিক)' : 'Role / designation (optional)')
                    : (language === 'bn' ? 'পদবী / দায়িত্ব' : 'Designation (Optional)')}
                </label>
                <input
                  id="subject-designation-input"
                  name="designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder={language === 'bn' ? 'উদাহরণ: ম্যানেজার, পরিচালক' : 'e.g. Branch Manager'}
                  className="w-full px-[var(--field-padding-x)] ui-space-field-y bg-ui-input ui-border-default border-ui-stroke-default focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent ui-radius-control ui-control type-body text-ui-content-primary placeholder:text-ui-input-placeholder"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="subject-org-name-input" className="block type-label font-[var(--font-weight-medium)] text-ui-content-primary">
                  {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                    ? (language === 'bn' ? 'প্রতিষ্ঠান (ঐচ্ছিক)' : 'Organization (optional)')
                    : (language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Organization Name (Optional)')}
                </label>
                <input
                  id="subject-org-name-input"
                  name="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder={language === 'bn' ? 'উদাহরণ: রহিম ট্রেডার্স' : 'e.g. Rahim Traders'}
                  className="w-full px-[var(--field-padding-x)] ui-space-field-y bg-ui-input ui-border-default border-ui-stroke-default focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent ui-radius-control ui-control type-body text-ui-content-primary placeholder:text-ui-input-placeholder"
                />
              </div>
            </div>

            {/* Statement / Clarification */}
            <div className="space-y-1">
              <label htmlFor="subject-official-statement-input" className="block type-label font-[var(--font-weight-medium)] text-ui-content-primary">
                {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                  ? (language === 'bn' ? 'আপনার জবাব *' : 'Your response *')
                  : (language === 'bn' ? 'আপনার বক্তব্য বা স্পষ্টীকরণ *' : 'Statement or Clarification *')}
              </label>
              <textarea
                id="subject-official-statement-input"
                name="officialStatement"
                rows={4}
                required
                aria-required="true"
                value={officialStatement}
                onChange={(e) => setOfficialStatement(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'আপনার অবস্থান, ব্যাখ্যা বা প্রাসঙ্গিক তথ্য লিখুন...'
                    : 'Write your response, clarification, or relevant context...'
                }
                className="w-full ui-space-textarea bg-ui-input ui-border-default border-ui-stroke-default ui-radius-control type-body text-ui-content-primary placeholder:text-ui-input-placeholder focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent resize-y"
              />
            </div>

            {/* Request Correction / Removal checkbox */}
            {!SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED && (
              <div className="p-3.5 bg-ui-surface-subtle ui-radius-control ui-border-default border-ui-stroke-subtle space-y-2">
                <Checkbox
                  id="subject-correction-checkbox"
                  checked={requestCorrectionOrRemoval}
                  onChange={(e) => setRequestCorrectionOrRemoval(e.target.checked)}
                  label={
                    language === 'bn'
                      ? 'আমি প্রতিবেদনে অনিচ্ছাকৃত ভুল তথ্যের সংশোধন বা পুনঃনিরীক্ষণের আবেদন করছি'
                      : 'I request formal factual correction or editorial review of this report.'
                  }
                  labelClassName="type-helper font-[var(--font-weight-semibold)] text-ui-content-primary"
                />

                {requestCorrectionOrRemoval && (
                  <div>
                    <label htmlFor="subject-correction-details-input" className="sr-only">
                      {language === 'bn' ? 'সংশোধনের বিবরণ' : 'Correction details'}
                    </label>
                    <input
                      id="subject-correction-details-input"
                      name="correctionDetails"
                      type="text"
                      value={correctionDetails}
                      onChange={(e) => setCorrectionDetails(e.target.value)}
                      placeholder={
                        language === 'bn'
                          ? 'কোন অংশটি ভুল এবং সঠিক তথ্য কী, তা সংক্ষেপে উল্লেখ করুন'
                          : 'Specify what fact is inaccurate and provide correct verifiable info'
                      }
                      className="w-full px-[var(--field-padding-x)] ui-space-field-y bg-ui-input ui-border-default border-ui-stroke-default focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent ui-radius-control ui-control type-body text-ui-content-primary placeholder:text-ui-input-placeholder"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Moderation Workflow Notice */}
            {!SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED && (
              <div className="p-3.5 rounded-[var(--radius-control)] bg-ui-surface-subtle border border-ui-stroke-subtle type-compact text-ui-content-secondary leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-ui-content-secondary" />
                <span>
                  {language === 'bn'
                    ? 'আপনার প্রতিক্রিয়া মডারেশনের জন্য জমা হবে। প্রকাশযোগ্য সংস্করণ আলাদা প্রকাশনা প্রক্রিয়ার মাধ্যমে পরিচালিত হবে।'
                    : 'Your response will be submitted for moderation. Any public display is handled through the publication workflow.'}
                </span>
              </div>
            )}

        </form>
      )}
      </Modal>

      <UnsavedChangesDialog
        id="subject-response-discard-confirm-modal"
        isOpen={isDiscardConfirmOpen}
        language={language}
        onKeepEditing={() => setIsDiscardConfirmOpen(false)}
        onDiscard={handleResetAndClose}
      />
    </>
  );
};

