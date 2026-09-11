import React, { useState } from 'react';
import { X, CheckCircle2, Send, FileText } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { Modal } from '../ui/Modal';

interface CitizenActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
  language: 'bn' | 'en';
}

export const CitizenActionModal: React.FC<CitizenActionModalProps> = ({
  isOpen,
  onClose,
  reportId,
  reportTitle,
  language,
}) => {
  const [description, setDescription] = useState('');
  const [witnessDate, setWitnessDate] = useState('');
  const [contactConsent, setContactConsent] = useState(false);
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!description.trim() || description.trim().length < 10) {
      setError(
        language === 'bn'
          ? 'অনুগ্রহ করে অন্তত ১০ অক্ষরের সুস্পষ্ট বিবরণ লিখুন।'
          : 'Please provide at least 10 characters of descriptive details.'
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.submitCitizenResponse(reportId, {
        description: description.trim(),
        incidentDate: witnessDate.trim() || undefined,
        contactConsent,
        contactInfo: contactConsent && contactInfo.trim() ? contactInfo.trim() : undefined,
      });

      setResponseId(res.responseId || null);
      setIsSubmitted(true);
    } catch (err: any) {
      const msg =
        language === 'bn'
          ? err?.messageBn || err?.message || 'তথ্য জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
          : err?.message || 'Failed to submit information. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setDescription('');
    setWitnessDate('');
    setContactConsent(false);
    setContactInfo('');
    setIsSubmitted(false);
    setIsSubmitting(false);
    setResponseId(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      id="citizen-action-modal"
      isOpen={isOpen}
      onClose={onClose}
      closeOnBackdrop={false}
      showHeader={false}
      maxWidth="md"
      contentClassName="flex flex-col min-h-0 overflow-hidden md:block md:overflow-y-auto md:overscroll-contain"
      language={language}
      ariaLabelledBy="citizen-modal-title"
    >
      <div className="flex flex-col h-full min-h-0 text-left md:block md:h-auto md:p-6 sm:md:p-7 md:space-y-5">
        {/* Header */}
        <header className="shrink-0 flex items-start justify-between gap-3 p-5 sm:p-6 md:p-0 pb-3.5 sm:pb-4 md:pb-3.5 border-b border-ui-stroke-subtle">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-ui-surface-subtle text-ui-content-secondary border border-ui-stroke-subtle">
              <FileText className="w-3.5 h-3.5 text-ui-content-secondary" />
              <span>{language === 'bn' ? 'তথ্য ও অভিজ্ঞতা' : 'Information & experience'}</span>
            </div>
            <h3 id="citizen-modal-title" className="text-[18px] sm:text-[20px] leading-[26px] sm:leading-[28px] font-bold text-ui-content-primary">
              {language === 'bn'
                ? 'তথ্য বা অভিজ্ঞতা যোগ করুন'
                : 'Add information or experience'}
            </h3>
            <p className="text-[13px] sm:text-[14px] text-ui-content-muted">
              {language === 'bn' ? `প্রতিবেদন: ${reportTitle}` : `About: ${reportTitle}`}
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
              <div className="space-y-1">
                <h4 className="text-[18px] leading-[26px] font-bold text-ui-content-primary">
                  {language === 'bn' ? 'তথ্য সফলভাবে জমা হয়েছে' : 'Information submitted successfully'}
                </h4>
                <p className="text-[15px] sm:text-[16px] leading-[22px] sm:leading-[24px] text-ui-content-secondary max-w-sm mx-auto">
                  {language === 'bn'
                    ? 'আপনার প্রদত্ত বিবরণটি জমা হয়েছে এবং মডারেশন টিম পর্যালোচনা সম্পন্ন করে মূল প্রতিবেদনে সহায়ক আপডেট হিসেবে সংযুক্ত করবে।'
                    : 'Your information has been submitted for moderation review.'}
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
                className="px-5 py-2.5 bg-ui-action-bg hover:bg-ui-action-hover text-ui-action-text text-[15px] sm:text-[16px] font-semibold rounded-xl cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                {language === 'bn' ? 'সম্পন্ন করুন' : 'Done'}
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

              <div className="space-y-1.5">
                <label htmlFor="citizen-description-input" className="block text-[15px] sm:text-[16px] font-medium text-ui-content-primary">
                  {language === 'bn'
                    ? 'আপনার তথ্য বা অভিজ্ঞতা লিখুন *'
                    : 'Describe your information or experience *'}
                </label>
                <textarea
                  id="citizen-description-input"
                  name="description"
                  rows={4}
                  required
                  aria-required="true"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'সুনির্দিষ্ট তারিখ, সময়, স্থান বা ঘটনা সম্পর্কিত প্রাসঙ্গিক তথ্য উল্লেখ করুন...'
                      : 'Provide specific dates, timings, locations or contextual observations...'
                  }
                  className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent focus:ring-1 focus:ring-ui-accent rounded-xl text-[15px] sm:text-[16px] text-ui-content-primary placeholder:text-ui-content-muted"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="citizen-witness-date-input" className="block text-[15px] sm:text-[16px] font-medium text-ui-content-secondary">
                  {language === 'bn' ? 'ঘটনার সম্ভাব্য তারিখ (যদি জানা থাকে)' : 'Incident date (optional)'}
                </label>
                <input
                  id="citizen-witness-date-input"
                  name="witnessDate"
                  type="date"
                  value={witnessDate}
                  onChange={(e) => setWitnessDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent focus:ring-1 focus:ring-ui-accent rounded-xl text-[15px] sm:text-[16px] text-ui-content-primary min-h-[44px]"
                />
              </div>

              <div className="p-3.5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2.5">
                <label htmlFor="citizen-contact-consent-checkbox" className="flex items-start gap-2 cursor-pointer text-[14px] text-ui-content-secondary">
                  <input
                    id="citizen-contact-consent-checkbox"
                    type="checkbox"
                    checked={contactConsent}
                    onChange={(e) => setContactConsent(e.target.checked)}
                    className="mt-1 rounded border-ui-stroke-subtle text-accent focus:ring-accent accent-[var(--ui-accent)] min-h-[16px] min-w-[16px]"
                  />
                  <span>
                    {language === 'bn'
                      ? 'প্রয়োজনে মডারেশন টিমের সাথে যোগাযোগের জন্য আমার ইমেইল বা ফোন নম্বর দিতে ইচ্ছুক'
                      : 'I agree to provide contact details for editorial follow-up only.'}
                  </span>
                </label>

                {contactConsent && (
                  <div>
                    <label htmlFor="citizen-contact-info-input" className="sr-only">
                      {language === 'bn' ? 'যোগাযোগের তথ্য' : 'Contact information'}
                    </label>
                    <input
                      id="citizen-contact-info-input"
                      name="contactInfo"
                      type="text"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder={language === 'bn' ? 'ফোন নম্বর বা ইমেইল ঠিকানা' : 'Phone number or email address'}
                      className="w-full px-3.5 py-2.5 bg-ui-surface border border-ui-stroke-subtle focus:border-ui-accent focus:ring-1 focus:ring-ui-accent rounded-xl text-[15px] sm:text-[16px] text-ui-content-primary min-h-[44px]"
                    />
                  </div>
                )}
              </div>
            </div>

            <footer className="shrink-0 px-5 py-3.5 sm:px-6 md:px-0 md:py-0 md:pt-2 border-t border-ui-stroke-subtle bg-ui-surface md:bg-transparent flex items-center justify-end gap-2.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] md:pb-0">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-ui-stroke-subtle disabled:opacity-50 text-ui-content-secondary text-[15px] sm:text-[16px] font-semibold rounded-xl cursor-pointer min-h-[44px] bg-ui-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-ui-action-bg hover:bg-ui-action-hover disabled:opacity-50 disabled:cursor-not-allowed text-ui-action-text text-[15px] sm:text-[16px] font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'bn' ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{language === 'bn' ? 'তথ্য জমা দিন' : 'Submit information'}</span>
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
