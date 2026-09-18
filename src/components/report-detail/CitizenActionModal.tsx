import React, { useState, useEffect } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { Modal } from '../ui/Modal';
import { ModalActions } from '../ui/ModalActions';
import { Checkbox } from '../ui/Checkbox';
import { UnsavedChangesDialog } from '../ui/UnsavedChangesDialog';
import { TextAreaField } from '../ui/TextAreaField';
import { TextField } from '../ui/TextField';
import { DateField } from '../ui/DateField';
import { isValidEmailOrPhone } from '../ui/formValidation';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const maxIncidentDate = getLocalDateInputValue();

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setIsSubmitting(false);
      setResponseId(null);
      setError(null);
      setFieldErrors({});
      setIsDiscardConfirmOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nextFieldErrors: Record<string, string> = {};
    if (!description.trim()) {
      nextFieldErrors.description =
        language === 'bn' ? 'আপনি যা জানেন তা লিখুন।' : 'Enter what you know.';
    } else if (description.trim().length < 10) {
      nextFieldErrors.description =
        language === 'bn'
          ? 'আরও একটু বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)।'
          : 'Please add a little more detail (at least 10 characters).';
    }

    if (witnessDate.trim() && witnessDate > maxIncidentDate) {
      nextFieldErrors.witnessDate =
        language === 'bn'
          ? 'ঘটনার তারিখ ভবিষ্যতের হতে পারে না।'
          : 'Incident date cannot be in the future.';
    }

    if (contactConsent && !contactInfo.trim()) {
      nextFieldErrors.contactInfo =
        language === 'bn'
          ? 'যোগাযোগের জন্য ফোন নম্বর বা ইমেইল লিখুন।'
          : 'Enter a phone number or email for follow-up.';
    } else if (contactConsent && !isValidEmailOrPhone(contactInfo)) {
      nextFieldErrors.contactInfo =
        language === 'bn'
          ? 'সঠিক ফোন নম্বর বা ইমেইল লিখুন।'
          : 'Enter a valid phone number or email.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      const firstId = nextFieldErrors.description
        ? 'citizen-description-input'
        : nextFieldErrors.witnessDate
          ? 'citizen-witness-date-input'
          : 'citizen-contact-info-input';
      window.requestAnimationFrame(() => document.getElementById(firstId)?.focus());
      return;
    }

    setFieldErrors({});
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

  const isDirty = Boolean(
    description.trim() ||
    witnessDate.trim() ||
    contactConsent ||
    contactInfo.trim()
  );

  const handleResetAndClose = () => {
    setDescription('');
    setWitnessDate('');
    setContactConsent(false);
    setContactInfo('');
    setIsSubmitted(false);
    setIsSubmitting(false);
    setResponseId(null);
    setError(null);
    setFieldErrors({});
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
      id="citizen-action-modal"
      isOpen={isOpen}
      onClose={handleRequestClose}
      closeOnBackdrop={false}
      closeOnEscape={true}
      maxWidth="md"
      language={language}
      title={language === 'bn' ? 'প্রতিবেদনে তথ্য দিন' : 'Share information about this report'}
      description={language === 'bn' ? `প্রতিবেদন: ${reportTitle}` : `Report: ${reportTitle}`}
      footer={
        isSubmitted ? (
          <ModalActions
            align="center"
            primary={{
              type: 'button',
              size: 'md',
              onClick: handleResetAndClose,
              label: language === 'bn' ? 'সম্পন্ন' : 'Done',
            }}
          />
        ) : (
          <ModalActions
            primary={{
              form: 'citizen-action-form',
              type: 'submit',
              size: 'md',
              isLoading: isSubmitting,
              leftIcon: <Send className="w-4 h-4" aria-hidden="true" />,
              label: isSubmitting
                ? (language === 'bn' ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...')
                : (language === 'bn' ? 'তথ্য জমা দিন' : 'Submit information'),
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
        <form id="citizen-action-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-ui-error-bg ui-border-default border-ui-error-border text-ui-error-text ui-radius-control type-helper font-[var(--font-weight-medium)]"
            >
              {error}
            </div>
          )}

          <TextAreaField
            id="citizen-description-input"
            name="description"
            rows={4}
            required
            label={language === 'bn' ? 'আপনি যা জানেন' : 'What you know'}
            helperText={
              language === 'bn'
                ? 'তারিখ, সময়, স্থান ও প্রাসঙ্গিক তথ্য যতটা সম্ভব নির্দিষ্টভাবে লিখুন।'
                : 'Include the date, time, place, and any relevant details as specifically as you can.'
            }
            error={fieldErrors.description}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (fieldErrors.description) setFieldErrors((current) => ({ ...current, description: '' }));
            }}
            placeholder={language === 'bn' ? 'যা দেখেছেন বা জানেন লিখুন...' : 'Write what you saw or know...'}
          />

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
              value={witn          <DateField
            id="citizen-witness-date-input"
            name="witnessDate"
            language={language}
            label={language === 'bn' ? 'ঘটনার তারিখ (ঐচ্ছিক)' : 'Incident date (optional)'}
            max={maxIncidentDate}
            value={witnessDate}
            error={fieldErrors.witnessDate}
            onChange={(e) => {
              setWitnessDate(e.target.value);
              if (fieldErrors.witnessDate) setFieldErrors((current) => ({ ...current, witnessDate: '' }));
            }}
          />

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
              <TextField
                id="citizen-contact-info-input"
                name="contactInfo"
                type="text"
                required
                fieldClassName="pl-8"
                label={language === 'bn' ? 'ফোন নম্বর বা ইমেইল' : 'Phone number or email'}
                value={contactInfo}
                error={fieldErrors.contactInfo}
                onChange={(e) => {
                  setContactInfo(e.target.value);
                  if (fieldErrors.contactInfo) setFieldErrors((current) => ({ ...current, contactInfo: '' }));
                }}
                placeholder={language === 'bn' ? 'ফোন নম্বর বা ইমেইল লিখুন' : 'Enter a phone number or email'}
              />
            )}
          </div>
        </form>
      )}
      </Modal>

      <UnsavedChangesDialog
        id="citizen-action-discard-confirm-modal"
        isOpen={isDiscardConfirmOpen}
        language={language}
        onKeepEditing={() => setIsDiscardConfirmOpen(false)}
        onDiscard={handleResetAndClose}
      />
    </>
  );
};
