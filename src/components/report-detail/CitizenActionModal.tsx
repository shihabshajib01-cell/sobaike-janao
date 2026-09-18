import React, { useState, useEffect } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';

interface CitizenActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
  language: 'bn' | 'en';
}

const getLocalDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const maxIncidentDate = getLocalDateInputValue();

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setResponseId(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!description.trim() || description.trim().length < 10) {
      setError(
        language === 'bn'
          ? 'আরও একটু বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)।'
          : 'Please add a little more detail (at least 10 characters).'
      );
      return;
    }

    if (witnessDate.trim() && witnessDate > maxIncidentDate) {
      setError(
        language === 'bn'
          ? 'ঘটনার তারিখ ভবিষ্যতের হতে পারে না।'
          : 'Incident date cannot be in the future.'
      );
      return;
    }

    if (contactConsent && !contactInfo.trim()) {
      setError(
        language === 'bn'
          ? 'যোগাযোগের জন্য ফোন নম্বর বা ইমেইল লিখুন।'
          : 'Enter a phone number or email for follow-up.'
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
          ? err?.messageBn || err?.message || 'তথ্য জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
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
      onClose={handleResetAndClose}
      closeOnBackdrop={false}
      maxWidth="md"
      language={language}
      title={language === 'bn' ? 'প্রতিবেদনে তথ্য দিন' : 'Share information about this report'}
      description={language === 'bn' ? `প্রতিবেদন: ${reportTitle}` : `Report: ${reportTitle}`}
      footer={
        isSubmitted ? (
          <Button type="button" variant="primary" size="md" onClick={handleResetAndClose}>
            {language === 'bn' ? 'সম্পন্ন' : 'Done'}
          </Button>
        ) : (
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleResetAndClose}
              disabled={isSubmitting}
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              form="citizen-action-form"
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" aria-hidden="true" />}
            >
              {isSubmitting
                ? language === 'bn'
                  ? 'জমা দেওয়া হচ্ছে...'
                  : 'Submitting...'
                : language === 'bn'
                  ? 'তথ্য জমা দিন'
                  : 'Submit information'}
            </Button>
          </div>
        )
      }
    >
      {isSubmitted ? (
        <div
          role="status"
          aria-live="polite"
          className="py-3 text-center space-y-4"
        >
          <div className="w-12 h-12 bg-ui-success-bg text-ui-success-text ui-border-default border-ui-success-border ui-radius-pill flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="type-h3 font-[var(--font-weight-semibold)] text-ui-content-primary">
              {language === 'bn' ? 'তথ্য জমা হয়েছে' : 'Information submitted'}
            </h3>
            <p className="type-body text-ui-content-secondary max-w-sm mx-auto">
              {language === 'bn'
                ? 'আপনার তথ্য পর্যালোচনার জন্য পাঠানো হয়েছে।'
                : 'Your information has been sent for review.'}
            </p>
          </div>
          {responseId && (
            <div className="p-3 bg-ui-surface-subtle ui-radius-control ui-border-default border-ui-stroke-subtle text-center inline-block max-w-xs mx-auto">
              <p className="type-helper text-ui-content-secondary">
                {language === 'bn' ? 'রেসপন্স আইডি' : 'Response ID'}
              </p>
              <p className="tabular-nums type-label font-[var(--font-weight-semibold)] text-ui-content-primary">
                {responseId}
              </p>
            </div>
          )}
        </div>
      ) : (
        <form id="citizen-action-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-ui-error-bg ui-border-default border-ui-error-border text-ui-error-text ui-radius-control type-helper font-[var(--font-weight-medium)]"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="citizen-description-input"
              className="block type-label font-[var(--font-weight-medium)] text-ui-content-primary"
            >
              {language === 'bn' ? 'আপনি যা জানেন *' : 'What you know *'}
            </label>
            <textarea
              id="citizen-description-input"
              name="description"
              rows={4}
              required
              aria-required="true"
              aria-describedby="citizen-description-helper"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'bn' ? 'যা দেখেছেন বা জানেন লিখুন...' : 'Write what you saw or know...'}
              className="w-full ui-space-textarea bg-ui-input ui-border-default border-ui-stroke-default focus:border-ui-accent focus:outline-none focus:ring-2 focus:ring-ui-focus ui-radius-control type-body text-ui-content-primary placeholder:text-ui-input-placeholder resize-y"
            />
            <p id="citizen-description-helper" className="type-helper text-ui-content-secondary">
              {language === 'bn'
                ? 'তারিখ, সময়, স্থান ও প্রাসঙ্গিক তথ্য যতটা সম্ভব নির্দিষ্টভাবে লিখুন।'
                : 'Include the date, time, place, and any relevant details as specifically as you can.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="citizen-witness-date-input"
              className="block type-label font-[var(--font-weight-medium)] text-ui-content-primary"
            >
              {language === 'bn' ? 'ঘটনার তারিখ (ঐচ্ছিক)' : 'Incident date (optional)'}
            </label>
            <input
              id="citizen-witness-date-input"
              name="witnessDate"
              type="date"
              lang="en-GB"
              max={maxIncidentDate}
              value={witnessDate}
              onChange={(e) => setWitnessDate(e.target.value)}
              className="w-full px-[var(--field-padding-x)] ui-space-field-y bg-ui-input ui-border-default border-ui-stroke-default focus:border-ui-accent focus:outline-none focus:ring-2 focus:ring-ui-focus ui-radius-control ui-control type-body text-ui-content-primary"
            />
          </div>

          <div className="p-3 bg-ui-surface-subtle ui-radius-control ui-border-default border-ui-stroke-subtle space-y-3">
            <Checkbox
              id="citizen-contact-consent-checkbox"
              checked={contactConsent}
              onChange={(e) => setContactConsent(e.target.checked)}
              label={
                language === 'bn'
                  ? 'প্রয়োজনে এ বিষয়ে আমার সঙ্গে যোগাযোগ করা যাবে।'
                  : 'I can be contacted if follow-up is needed.'
              }
              labelClassName="type-helper text-ui-content-primary"
            />

            {contactConsent && (
              <div className="space-y-1.5 pl-8">
                <label
                  htmlFor="citizen-contact-info-input"
                  className="block type-helper font-[var(--font-weight-medium)] text-ui-content-secondary"
                >
                  {language === 'bn' ? 'ফোন নম্বর বা ইমেইল' : 'Phone number or email'}
                </label>
                <input
                  id="citizen-contact-info-input"
                  name="contactInfo"
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={language === 'bn' ? 'ফোন নম্বর বা ইমেইল লিখুন' : 'Enter a phone number or email'}
                  className="w-full px-[var(--field-padding-x)] ui-space-field-y bg-ui-input ui-border-default border-ui-stroke-default focus:border-ui-accent focus:outline-none focus:ring-2 focus:ring-ui-focus ui-radius-control ui-control type-body text-ui-content-primary placeholder:text-ui-input-placeholder"
                />
              </div>
            )}
          </div>
        </form>
      )}
    </Modal>
  );};
