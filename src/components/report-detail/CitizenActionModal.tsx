import React, { useState } from 'react';
import { X, CheckCircle2, ShieldAlert, Send, FileText, Lock } from 'lucide-react';

interface CitizenActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
  type: 'witness_information' | 'experienced_similar';
  language: 'bn' | 'en';
}

export const CitizenActionModal: React.FC<CitizenActionModalProps> = ({
  isOpen,
  onClose,
  reportId,
  reportTitle,
  type,
  language,
}) => {
  const [description, setDescription] = useState('');
  const [witnessDate, setWitnessDate] = useState('');
  const [contactConsent, setContactConsent] = useState(false);
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isWitness = type === 'witness_information';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      setError(
        language === 'bn'
          ? 'অনুগ্রহ করে অন্তত ১০ অক্ষরের সুস্পষ্ট বিবরণ লিখুন।'
          : 'Please provide at least 10 characters of descriptive details.'
      );
      return;
    }

    setError(
      language === 'bn'
        ? 'তথ্য জমা দেওয়ার সেবা বর্তমানে সংযুক্ত নয়। অনুগ্রহ করে পরে আবার চেষ্টা করুন।'
        : 'Information submission is temporarily unavailable. Please try again later.'
    );
  };

  const handleResetAndClose = () => {
    setDescription('');
    setWitnessDate('');
    setContactConsent(false);
    setContactInfo('');
    setIsSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="citizen-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div className="bg-surface rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-subtle text-left space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-subtle pb-3.5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[14px] font-semibold bg-surface-subtle text-secondary border border-subtle">
              <FileText className="w-3.5 h-3.5 text-secondary" />
              <span>{isWitness ? (language === 'bn' ? 'অতিরিক্ত তথ্য ও প্রমাণ' : 'Witness Supplementary Info') : (language === 'bn' ? 'অনুরূপ ঘটনার প্রমাণ' : 'Corroborating Experience')}</span>
            </div>
            <h3 id="citizen-modal-title" className="text-[20px] leading-[28px] font-bold text-primary">
              {isWitness
                ? language === 'bn'
                  ? 'এই প্রতিবেদন সম্পর্কে আপনার জানা তথ্য যোগ করুন'
                  : 'Submit Supplementary Information'
                : language === 'bn'
                ? 'আপনিও কি একই ধরনের ঘটনার শিকার?'
                : 'Report a Similar Experience'}
            </h3>
            <p className="text-[14px] text-muted font-mono">
              {language === 'bn' ? 'প্রতিবেদন আইডি:' : 'Referenced Report:'} {reportId}
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            aria-label="Close"
            className="p-2 text-secondary hover:text-primary rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[18px] leading-[26px] font-bold text-primary">
                {language === 'bn' ? 'তথ্য সফলভাবে জমা হয়েছে' : 'Information Submitted Successfully'}
              </h4>
              <p className="text-[16px] leading-[24px] text-secondary max-w-sm mx-auto">
                {language === 'bn'
                  ? 'আপনার প্রদত্ত বিবরণটি জমা হয়েছে এবং মডারেশন টিম পর্যালোচনা সম্পন্ন করে মূল প্রতিবেদনে সহায়ক আপডেট হিসেবে সংযুক্ত করবে।'
                  : 'Your information has been submitted for moderation review.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-5 py-2.5 bg-[var(--ui-primary-action-bg)] hover:bg-[var(--ui-primary-action-hover)] text-inverse text-[16px] font-semibold rounded-xl cursor-pointer min-h-[44px]"
            >
              {language === 'bn' ? 'সম্পন্ন করুন' : 'Done'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-[14px] font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[16px] font-medium text-primary">
                {isWitness
                  ? language === 'bn'
                    ? 'আপনার কাছে থাকা তথ্য বা প্রত্যক্ষদর্শীর বিবরণ *'
                    : 'Your Account / Eyewitness Details *'
                  : language === 'bn'
                  ? 'আপনার অভিজ্ঞতা সংক্ষেপে লিখুন *'
                  : 'Describe What You Experienced *'}
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'সুনির্দিষ্ট তারিখ, সময়, স্থান বা ঘটনা সম্পর্কিত প্রাসঙ্গিক তথ্য উল্লেখ করুন...'
                    : 'Provide specific dates, timings, locations or contextual observations...'
                }
                className="w-full px-3.5 py-2.5 bg-surface border border-subtle focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-[16px] text-primary placeholder:text-muted"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[16px] font-medium text-secondary">
                {language === 'bn' ? 'ঘটনার সম্ভাব্য তারিখ (যদি জানা থাকে)' : 'Incident Date (Optional)'}
              </label>
              <input
                type="date"
                value={witnessDate}
                onChange={(e) => setWitnessDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-subtle focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-[16px] text-primary min-h-[44px]"
              />
            </div>

            <div className="p-3.5 bg-surface-subtle rounded-xl border border-subtle space-y-2.5">
              <label className="flex items-start gap-2 cursor-pointer text-[14px] text-secondary">
                <input
                  type="checkbox"
                  checked={contactConsent}
                  onChange={(e) => setContactConsent(e.target.checked)}
                  className="mt-1 rounded border-subtle text-accent focus:ring-accent accent-[var(--ui-accent)]"
                />
                <span>
                  {language === 'bn'
                    ? 'প্রয়োজনে মডারেশন টিমের সাথে যোগাযোগের জন্য আমার ইমেইল বা ফোন নম্বর দিতে ইচ্ছুক'
                    : 'I agree to provide contact details for editorial follow-up only.'}
                </span>
              </label>

              {contactConsent && (
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={language === 'bn' ? 'ফোন নম্বর বা ইমেইল ঠিকানা' : 'Phone number or email address'}
                  className="w-full px-3.5 py-2.5 bg-surface border border-subtle focus:border-accent focus:ring-1 focus:ring-accent rounded-xl text-[16px] text-primary min-h-[44px]"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 border border-subtle hover:bg-surface-subtle text-secondary text-[16px] font-semibold rounded-xl cursor-pointer min-h-[44px] bg-surface"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[var(--ui-primary-action-bg)] hover:bg-[var(--ui-primary-action-hover)] text-inverse text-[16px] font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                <span>{language === 'bn' ? 'তথ্য জমা দিন' : 'Submit Information'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
