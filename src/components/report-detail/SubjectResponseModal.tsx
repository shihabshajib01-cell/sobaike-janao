import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Scale, Send } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { Modal } from '../ui/Modal';

/**
 * Temporary rollout gate: Controls whether the simplified Subject Response form is enabled.
 * CRITICAL: Must remain strictly `false` during this phase until the backend SQL change
 * (supabase/allow_subject_response_without_responder_type.sql) is manually applied and verified.
 */
const SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED = true;

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
              ? 'Please enter your full name, email or phone, and response.'
              : 'Please provide your full name, contact information, and formal statement.')
      );
      return;
    }

    if (officialStatement.trim().length < 10) {
      setError(
        language === 'bn'
          ? (SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
              ? 'জবাব কমপক্ষে ১০ অক্ষরের হতে হবে।'
              : 'বক্তব্য কমপক্ষে ১০ অক্ষরের হতে হবে।')
          : (SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
              ? 'Response must be at least 10 characters.'
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

  const handleResetAndClose = () => {
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
    onClose();
  };

  return (
    <Modal
      id="subject-response-modal"
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={false}
      showHeader={false}
      maxWidth="lg"
      contentClassName="flex flex-col min-h-0 overflow-hidden md:block md:overflow-y-auto md:overscroll-contain"
      language={language}
      ariaLabelledBy="subject-modal-title"
    >
      <div className="flex flex-col h-full min-h-0 text-left md:block md:h-auto md:p-6 sm:md:p-7 md:space-y-5">
        {/* Header */}
        <header className="shrink-0 flex items-start justify-between gap-3 p-5 sm:p-6 md:p-0 pb-3.5 sm:pb-4 md:pb-3.5 border-b border-ui-stroke-subtle">
          <div className="space-y-1">
            {!SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[14px] font-semibold border"
                style={{
                  backgroundColor: 'var(--ui-info-bg)',
                  borderColor: 'var(--ui-info-border)',
                  color: 'var(--ui-info-text)',
                }}
              >
                <Scale className="w-3.5 h-3.5" style={{ color: 'var(--ui-info-text)' }} />
                <span>{language === 'bn' ? 'প্রতিউত্তরের অধিকার (Right of Response)' : 'Formal Right of Response'}</span>
              </div>
            )}
            <h3 id="subject-modal-title" className="text-[20px] leading-[28px] font-bold text-ui-content-primary">
              {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                ? (language === 'bn' ? 'এই প্রতিবেদনের জবাব দিন' : 'Respond to this report')
                : (language === 'bn'
                    ? 'উল্লেখিত ব্যক্তি বা প্রতিষ্ঠানের আনুষ্ঠানিক বক্তব্য জমা দিন'
                    : 'Submit Official Response or Clarification')}
            </h3>
            <p className="text-[14px] text-ui-content-secondary">
              {language === 'bn' ? 'উল্লেখিত পক্ষ:' : 'Mentioned Subject:'}{' '}
              <span className="font-semibold text-ui-content-primary">{subjectName}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            className="p-2 text-ui-content-secondary rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {isSubmitted ? (
          <div className="flex flex-col flex-1 min-h-0 md:block md:space-y-4">
            <div role="status" aria-live="polite" className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 md:p-0 md:overflow-visible py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-ui-success-bg text-ui-success-text border border-ui-success-border rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-[18px] leading-[26px] font-bold text-ui-content-primary">
                  {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                    ? (language === 'bn' ? 'জবাব জমা হয়েছে' : 'Response submitted')
                    : (language === 'bn' ? 'প্রতিউত্তর জমা সম্পন্ন হয়েছে' : 'Response Received')}
                </h4>
                <p className="text-[16px] leading-[24px] text-ui-content-secondary max-w-md mx-auto">
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
                <div className="p-3 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle text-center inline-block max-w-xs mx-auto">
                  <span className="text-[13px] text-ui-content-muted block">
                    {language === 'bn' ? 'রেসপন্স আইডি' : 'Response ID'}
                  </span>
                  <span className="font-mono text-[15px] font-bold text-ui-content-primary">
                    {responseId}
                  </span>
                </div>
              )}
            </div>
            <footer className="shrink-0 p-4 sm:p-5 md:p-0 border-t md:border-0 border-ui-stroke-subtle bg-ui-surface flex items-center justify-center pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-0">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2.5 bg-ui-action-bg hover:bg-ui-action-hover text-ui-action-text text-[16px] font-semibold rounded-xl cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </footer>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 md:block md:space-y-4">
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 md:p-0 md:overflow-visible space-y-4">
            {error && (
              <div role="alert" className="p-3.5 bg-ui-error-bg border border-ui-error-border text-ui-error-text rounded-xl text-[14px] font-medium">
                {error}
              </div>
            )}

            {/* Responder Identity Category - only rendered in legacy form */}
            {!SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED && (
              <div className="space-y-1.5">
                <label className="block text-[16px] font-medium text-ui-content-primary">
                  {language === 'bn' ? 'আপনার পরিচয় বা ভূমিকা *' : 'Your Relationship to This Report *'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResponderType('mentioned_person')}
                    className={`px-3 py-2.5 text-[14px] font-medium rounded-xl border text-center transition-colors min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                      responderType === 'mentioned_person'
                        ? 'bg-[var(--ui-accent)] text-inverse border-[var(--ui-accent)] font-bold'
                        : 'bg-ui-surface-subtle text-ui-content-secondary border-ui-stroke-subtle'
                    }`}
                  >
                    {language === 'bn' ? 'আমি সরাসরি উল্লেখিত ব্যক্তি' : 'Mentioned Individual'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponderType('organization_rep')}
                    className={`px-3 py-2.5 text-[14px] font-medium rounded-xl border text-center transition-colors min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                      responderType === 'organization_rep'
                        ? 'bg-[var(--ui-accent)] text-inverse border-[var(--ui-accent)] font-bold'
                        : 'bg-ui-surface-subtle text-ui-content-secondary border-ui-stroke-subtle'
                    }`}
                  >
                    {language === 'bn' ? 'প্রতিষ্ঠানের মুখপাত্র/প্রতিনিধি' : 'Authorized Representative'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResponderType('legal_rep')}
                    className={`px-3 py-2.5 text-[14px] font-medium rounded-xl border text-center transition-colors min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                      responderType === 'legal_rep'
                        ? 'bg-[var(--ui-accent)] text-inverse border-[var(--ui-accent)] font-bold'
                        : 'bg-ui-surface-subtle text-ui-content-secondary border-ui-stroke-subtle'
                    }`}
                  >
                    {language === 'bn' ? 'আইনি প্রতিনিধি / আইনজীবী' : 'Legal Counsel'}
                  </button>
                </div>
              </div>
            )}

            {/* Name and Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="subject-responder-name-input" className="block text-[16px] font-medium text-ui-content-secondary">
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
                  className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent rounded-xl text-[16px] text-ui-content-primary min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="subject-contact-email-phone-input" className="block text-[16px] font-medium text-ui-content-secondary">
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
                  placeholder={language === 'bn' ? 'editor@sobaikejanao.org' : 'name@company.com / 017...'}
                  className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent rounded-xl text-[16px] text-ui-content-primary min-h-[44px]"
                />
              </div>
            </div>

            {/* Role & Org */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="subject-designation-input" className="block text-[16px] font-medium text-ui-content-secondary">
                  {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                    ? (language === 'bn' ? 'পদবী / ভূমিকা' : 'Role / designation')
                    : (language === 'bn' ? 'পদবী / দায়িত্ব' : 'Designation (Optional)')}
                </label>
                <input
                  id="subject-designation-input"
                  name="designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder={language === 'bn' ? 'উদাঃ ম্যানেজার, পরিচালক' : 'e.g. Branch Manager'}
                  className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent rounded-xl text-[16px] text-ui-content-primary min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="subject-org-name-input" className="block text-[16px] font-medium text-ui-content-secondary">
                  {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                    ? (language === 'bn' ? 'প্রতিষ্ঠান' : 'Organization')
                    : (language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Organization Name (Optional)')}
                </label>
                <input
                  id="subject-org-name-input"
                  name="organizationName"
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder={language === 'bn' ? 'উদাঃ মেসার্স রহিম ট্রেডার্স' : 'e.g. Rahim Traders'}
                  className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent rounded-xl text-[16px] text-ui-content-primary min-h-[44px]"
                />
              </div>
            </div>

            {/* Statement / Clarification */}
            <div className="space-y-1">
              <label htmlFor="subject-official-statement-input" className="block text-[16px] font-medium text-ui-content-primary">
                {SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED
                  ? (language === 'bn' ? 'আপনার জবাব বা ব্যাখ্যা *' : 'Your response or clarification *')
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
                    ? 'প্রতিবেদনে উল্লেখিত বিষয়ে আপনার অবস্থান বা স্পষ্টীকরণ বিস্তারিত লিখুন...'
                    : 'Detail your stance, clarification, or context regarding this report...'
                }
                className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle rounded-xl text-[16px] text-ui-content-primary placeholder:text-ui-content-muted focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent min-h-[44px]"
              />
            </div>

            {/* Request Correction / Removal checkbox */}
            {!SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED && (
              <div className="p-3.5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                <label htmlFor="subject-correction-checkbox" className="flex items-start gap-2 cursor-pointer text-[14px] text-ui-content-primary">
                  <input
                    id="subject-correction-checkbox"
                    type="checkbox"
                    checked={requestCorrectionOrRemoval}
                    onChange={(e) => setRequestCorrectionOrRemoval(e.target.checked)}
                    className="mt-1 rounded border-ui-stroke-subtle text-[var(--ui-accent)] focus:ring-ui-focus accent-[var(--ui-accent)] min-h-[16px] min-w-[16px]"
                  />
                  <span className="font-semibold">
                    {language === 'bn'
                      ? 'আমি প্রতিবেদনে অনিচ্ছাকৃত ভুল তথ্যের সংশোধন বা পুনঃনিরীক্ষণের আবেদন করছি'
                      : 'I request formal factual correction or editorial review of this report.'}
                  </span>
                </label>

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
                      className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:outline-none focus:ring-2 focus:ring-ui-focus focus:border-ui-accent rounded-xl text-[16px] text-ui-content-primary min-h-[44px]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Moderation Workflow Notice */}
            {!SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED && (
              <div className="p-3.5 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle text-[14px] text-ui-content-secondary leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-ui-content-secondary" />
                <span>
                  {language === 'bn'
                    ? 'আপনার প্রতিক্রিয়া মডারেশনের জন্য জমা হবে। প্রকাশযোগ্য সংস্করণ আলাদা প্রকাশনা প্রক্রিয়ার মাধ্যমে পরিচালিত হবে।'
                    : 'Your response will be submitted for moderation. Any public display is handled through the publication workflow.'}
                </span>
              </div>
            )}

            </div>

            {/* Footer Buttons */}
            <footer className="shrink-0 px-5 py-3.5 sm:px-6 md:px-0 md:py-0 md:pt-2 border-t border-ui-stroke-subtle bg-ui-surface md:bg-transparent flex items-center justify-end gap-2.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] md:pb-0">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-ui-stroke-subtle disabled:opacity-50 text-ui-content-secondary text-[16px] font-semibold rounded-xl cursor-pointer min-h-[44px] bg-ui-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-ui-action-bg hover:bg-ui-action-hover disabled:opacity-50 disabled:cursor-not-allowed text-ui-action-text text-[16px] font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'bn' ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {language === 'bn'
                        ? (SUBJECT_RESPONSE_SIMPLE_FORM_CONNECTED ? 'জবাব জমা দিন' : 'আনুষ্ঠানিক প্রতিউত্তর জমা দিন')
                        : 'Submit Response'}
                    </span>
                  </>
                )}
              </button>
            </footer>
          </form>
        )}
      </div>
    </Modal>
  );
};

