import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { Modal } from '../ui/Modal';

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
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAcknowledged(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isBn = language === 'bn';

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
        {/* Icon & Heading */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-ui-info-bg text-ui-info-text border border-ui-info-border flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 id="first-visit-notice-title" className="text-lg font-bold tracking-tight">
              {isBn ? 'এগিয়ে যাওয়ার আগে' : 'Before you continue'}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div
          id="first-visit-notice-desc"
          className="text-sm text-ui-content-secondary leading-relaxed space-y-3 max-h-[50vh] overflow-y-auto pr-1"
        >
          <p>
            {isBn
              ? 'সবাইকে জানাও একটি স্বাধীন নাগরিক প্রতিবেদন প্ল্যাটফর্ম। এটি কোনো সরকারি সংস্থা, আইনশৃঙ্খলা রক্ষাকারী সংস্থা, আদালত বা আইনগত কর্তৃপক্ষ নয় এবং কারও দোষ নির্ধারণ, শাস্তি প্রদান বা আইনগত সিদ্ধান্ত দেওয়ার ক্ষমতা রাখে না।'
              : 'Sobaike Janao is an independent citizen reporting platform. It is not a government agency, law-enforcement body, court, or legal authority, and it cannot determine guilt, impose penalties, or provide legal judgments.'}
          </p>
          <p>
            {isBn
              ? 'দায়িত্বশীলভাবে প্ল্যাটফর্মটি ব্যবহার করুন। জেনেশুনে মিথ্যা বা বিভ্রান্তিকর তথ্য, সাজানো অভিযোগ, কিংবা কোনো ব্যক্তি বা প্রতিষ্ঠানকে মিথ্যাভাবে জড়ানো বা হয়রানি করার উদ্দেশ্যে তথ্য জমা দেবেন না।'
              : 'Please use the platform responsibly. Do not knowingly submit false or misleading information, fabricated accusations, or content intended to falsely implicate or harass a person or organization.'}
          </p>
          <p>
            {isBn
              ? 'ব্যবহারকারীর জমা দেওয়া প্রতিবেদন তার নিজস্ব বক্তব্য। এখানে প্রকাশিত হলেই তা যাচাইকৃত সত্য হিসেবে গণ্য হবে না। প্ল্যাটফর্মের নীতি ও প্রযোজ্য আইন অনুযায়ী কনটেন্ট পর্যালোচনা বা মডারেট করা হতে পারে।'
              : 'User-submitted reports reflect the claims of the person submitting them and should not be treated as verified facts simply because they appear on this platform. Content may be reviewed or moderated according to platform policy and applicable law.'}
          </p>
        </div>

        {/* Checkbox Acknowledgment Row */}
        <div className="pt-1">
          <label
            htmlFor="first-visit-notice-checkbox"
            className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle hover:bg-ui-surface-hover/50 transition-colors select-none text-sm text-ui-content-primary"
          >
            <input
              id="first-visit-notice-checkbox"
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => setIsAcknowledged(e.target.checked)}
              className="w-4 h-4 mt-0.5 shrink-0 rounded border-ui-stroke-subtle text-ui-action-bg focus:ring-2 focus:ring-ui-focus focus:outline-none cursor-pointer accent-ui-action-bg"
            />
            <span className="leading-snug">
              {isBn
                ? 'আমি বিষয়গুলো বুঝেছি এবং দায়িত্বশীলভাবে এই প্ল্যাটফর্ম ব্যবহার করতে সম্মত।'
                : 'I understand and agree to use this platform responsibly.'}
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            id="first-visit-notice-continue-btn"
            type="button"
            onClick={onAcknowledge}
            disabled={!isAcknowledged}
            className="w-full h-11 px-5 rounded-xl font-medium text-sm bg-ui-action-bg hover:bg-ui-action-hover text-ui-action-text transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            <span>{isBn ? 'এগিয়ে যান' : 'Continue'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
