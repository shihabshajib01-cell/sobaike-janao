import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Checkbox } from '../ui/Checkbox';

interface FirstVisitNoticeModalProps {
  isOpen: boolean;
  language: 'bn' | 'en';
  onAcknowledge: () => void;
}

export const FirstVisitNoticeModal: React.FC<FirstVisitNoticeModalProps> = ({
  isOpen,
  language,
  onAcknowledge,
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const acknowledgeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isBn = language === 'bn';

  const handleContinue = () => {
    if (!isChecked) return;
    onAcknowledge();
  };

  return (
    <Modal
      id="first-visit-notice-modal"
      isOpen={isOpen}
      onClose={() => {}}
      closeOnBackdrop={false}
      showHeader={false}
      maxWidth="md"
      language={language}
      ariaLabelledBy="first-visit-notice-title"
      ariaDescribedBy="first-visit-notice-desc"
    >
      <div className="p-5 sm:p-6 flex flex-col gap-5 text-ui-content-primary">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-ui-brand-bg text-ui-brand-text border border-ui-brand-border flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="first-visit-notice-title" className="text-lg font-bold tracking-tight">
              {isBn
                ? 'দায়িত্বশীল ব্যবহার ও স্বাধীনতা বিজ্ঞপ্তি'
                : 'Independence & Responsible Use Notice'}
            </h2>
            <p className="text-xs text-ui-content-muted mt-0.5">
              {isBn ? 'সবাইকে জানাও প্ল্যাটফর্ম' : 'Sobaike Janao Platform'}
            </p>
          </div>
        </div>

        <div id="first-visit-notice-desc" className="text-sm text-ui-content-secondary space-y-3 leading-relaxed">
          <p>
            {isBn
              ? 'এটি একটি স্বাধীন নাগরিক তথ্য ও জনস্বার্থ প্ল্যাটফর্ম। নির্ভুল ও তথ্যভিত্তিক নাগরিক পর্যবেক্ষণ বজায় রাখতে নিচের বিষয়গুলো মনে রাখুন:'
              : 'This is an independent citizen reporting and public interest platform. To ensure truthful and constructive records, please note:'}
          </p>

          <ol className="p-3.5 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle text-xs space-y-2 list-none">
            <li className="flex items-start gap-2.5">
              <p className="font-bold text-ui-brand-text shrink-0" aria-hidden="true">১.</p>
              <p>
                {isBn
                  ? 'সঠিক, সত্য ও প্রাসঙ্গিক তথ্য দিয়ে প্রতিবেদন প্রকাশ করুন।'
                  : 'Submit accurate, factual, and relevant information.'}
              </p>
            </li>
            <li className="flex items-start gap-2.5">
              <p className="font-bold text-ui-brand-text shrink-0" aria-hidden="true">২.</p>
              <p>
                {isBn
                  ? 'কারও সুনাম নষ্ট করার অসৎ উদ্দেশ্যে ভিত্তিহীন অভিযোগ দেওয়া থেকে বিরত থাকুন।'
                  : 'Avoid submitting false, malicious, or defamatory complaints.'}
              </p>
            </li>
            <li className="flex items-start gap-2.5">
              <p className="font-bold text-ui-brand-text shrink-0" aria-hidden="true">৩.</p>
              <p>
                {isBn
                  ? 'জরুরি সহায়তার জন্য ৯৯৯ অথবা সংশ্লিষ্ট হটলাইনে সরাসরি যোগাযোগ করুন।'
                  : 'For life-threatening emergencies, call national hotlines (999) directly.'}
              </p>
            </li>
          </ol>
        </div>

        <div className="pt-1 border-t border-ui-stroke-subtle">
          <Checkbox
            id="first-visit-ack-checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            label={
              isBn
                ? 'আমি নিয়মগুলো পড়েছি এবং দায়িত্বশীলভাবে ব্যবহার করতে সম্মত।'
                : 'I have read and agree to use this platform responsibly.'
            }
          />
        </div>

        <div className="pt-2">
          <button
            ref={acknowledgeBtnRef}
            id="first-visit-acknowledge-btn"
            type="button"
            onClick={handleContinue}
            disabled={!isChecked}
            className="w-full h-11 px-5 rounded-xl font-medium text-sm bg-ui-action-bg hover:bg-ui-action-hover text-ui-action-text transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shadow-xs"
          >
            <span>{isBn ? 'সম্মতি দিয়ে এগিয়ে যান' : 'Acknowledge & Continue'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
