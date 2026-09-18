import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';

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

  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isBn = language === 'bn';
  const brandBase = import.meta.env.BASE_URL || '/';
  const normalizedBrandBase = brandBase.endsWith('/') ? brandBase : `${brandBase}/`;
  const brandMarkSrc = `${normalizedBrandBase}brand/sobaike-janao-mark-128.png`;

  const handleContinue = () => {
    if (!isChecked) return;
    onAcknowledge();
  };

  const instructions = isBn
    ? [
        'সঠিক, সত্য ও প্রাসঙ্গিক তথ্য দিয়ে প্রতিবেদন প্রকাশ করুন।',
        'কারও সুনাম নষ্ট করার অসৎ উদ্দেশ্যে ভিত্তিহীন অভিযোগ দেওয়া থেকে বিরত থাকুন।',
        'জরুরি সহায়তার জন্য ৯৯৯ অথবা সংশ্লিষ্ট হটলাইনে সরাসরি যোগাযোগ করুন।',
      ]
    : [
        'Submit accurate, factual, and relevant information.',
        'Avoid submitting false, malicious, or defamatory complaints.',
        'For emergencies, contact 999 or the relevant hotline directly.',
      ];

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
      <div className="p-5 sm:p-6 flex flex-col gap-4 text-ui-content-primary">
        <div className="flex items-center gap-3.5">
          <img
            src={brandMarkSrc}
            alt=""
            aria-hidden="true"
            width={44}
            height={44}
            className="w-11 h-11 object-contain shrink-0 select-none"
          />
          <h1
            id="first-visit-notice-title"
            className="type-h1 tracking-tight text-ui-content-primary"
          >
            {isBn ? 'সবাইকে জানাও-তে স্বাগতম' : 'Welcome to Sobaike Janao'}
          </h1>
        </div>

        <div className="border-t border-ui-stroke-subtle" aria-hidden="true" />

        <div className="flex flex-col gap-2.5">
          <h2 className="type-h2 text-ui-content-primary">
            {isBn
              ? 'দায়িত্বশীল ব্যবহার ও স্বাধীনতা বিজ্ঞপ্তি'
              : 'Independence & Responsible Use Notice'}
          </h2>

          <p
            id="first-visit-notice-desc"
            className="type-body text-ui-content-secondary"
          >
            {isBn
              ? 'এই প্ল্যাটফর্মটি নাগরিকদের জনস্বার্থে তথ্য, অভিজ্ঞতা ও পর্যবেক্ষণ শেয়ার করার একটি স্বাধীন মাধ্যম। সবার জন্য নির্ভরযোগ্য ও নিরাপদ পরিবেশ বজায় রাখতে নিচের নির্দেশনাগুলো অনুসরণ করুন।'
              : 'This is an independent platform for citizens to share public-interest information, experiences, and observations. Please follow the guidance below to help keep the platform reliable and safe for everyone.'}
          </p>
        </div>

        <div className="rounded-[var(--radius-control)] border border-ui-stroke-default p-4 bg-ui-surface">
          <ol className="space-y-3 list-none">
            {instructions.map((instruction, index) => (
              <li key={instruction} className="flex items-start gap-3">
                <p
                  className="type-action text-ui-content-primary shrink-0"
                  aria-hidden="true"
                >
                  {isBn ? `${['১', '২', '৩'][index]}.` : `${index + 1}.`}
                </p>
                <p className="type-action text-ui-content-primary">
                  {instruction}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="pt-1 border-t border-ui-stroke-subtle">
          <Checkbox
            id="first-visit-ack-checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            label={
              <span className="type-label text-ui-content-primary">
                {isBn
                  ? 'আমি নিয়মগুলো পড়েছি এবং দায়িত্বশীলভাবে ব্যবহার করতে সম্মত।'
                  : 'I have read and agree to use this platform responsibly.'}
              </span>
            }
          />
        </div>

        <Button
          id="first-visit-acknowledge-btn"
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleContinue}
          disabled={!isChecked}
          className="disabled:opacity-100 disabled:bg-ui-disabled-bg disabled:text-ui-disabled-text disabled:hover:bg-ui-disabled-bg"
        >
          {isBn ? 'সম্মতি দিয়ে এগিয়ে যান' : 'Acknowledge & Continue'}
        </Button>
      </div>
    </Modal>
  );
};
