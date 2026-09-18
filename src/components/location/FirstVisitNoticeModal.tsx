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
        'কারও সুনাম নষ্ট করার উদ্দেশ্যে ভিত্তিহীন বা মিথ্যা অভিযোগ দেওয়া থেকে বিরত থাকুন।',
        'জরুরি সহায়তার প্রয়োজন হলে ৯৯৯ অথবা সংশ্লিষ্ট হটলাইনে সরাসরি যোগাযোগ করুন।',
      ]
    : [
        'Submit accurate, truthful, and relevant information.',
        'Do not submit false or baseless allegations intended to harm someone’s reputation.',
        'If you need emergency assistance, contact 999 or the relevant hotline directly.',
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
            className="type-h2 tracking-tight text-ui-content-primary"
          >
            {isBn ? 'সবাইকে জানাও-তে স্বাগতম' : 'Welcome to Sobaike Janao'}
          </h1>
        </div>

        <div className="border-t border-ui-stroke-subtle" aria-hidden="true" />

        <div className="flex flex-col gap-2.5">
          <h2 className="type-h3 text-ui-content-primary">
            {isBn
              ? 'ব্যবহারের আগে কিছু গুরুত্বপূর্ণ কথা'
              : 'A few important things before you continue'}
          </h2>

          <div
            id="first-visit-notice-desc"
            className="flex flex-col gap-2.5"
          >
            <p className="type-body text-ui-content-primary">
              {isBn
                ? 'সবাইকে জানাও কোনো সরকারি সংস্থা বা আইনশৃঙ্খলা রক্ষাকারী বাহিনীর ওয়েবসাইট নয়। এটি বাংলাদেশের নাগরিকদের জন্য একটি স্বাধীন প্ল্যাটফর্ম, যেখানে আপনি নিজের পরিচয় বা ব্যক্তিগত নিরাপত্তা নিয়ে উদ্বেগ ছাড়াই জনস্বার্থে সমস্যা, অভিজ্ঞতা ও পর্যবেক্ষণ শেয়ার করতে পারেন।'
                : 'Sobaike Janao is not a government or law-enforcement website. It is an independent platform for people in Bangladesh to share public-interest issues, experiences, and observations without having to publicly reveal their identity.'}
            </p>
            <p className="type-body text-ui-content-primary">
              {isBn
                ? 'প্রতিবেদন জমা দিতে আমরা আপনার ফোন নম্বর বা ইমেইল চাই না, এবং আপনার ব্যক্তিগত পরিচয় প্রকাশ না করেই আপনি এখানে আপনার কথা জানাতে পারেন। তবে এই স্বাধীনতা যেন সঠিক ও দায়িত্বশীলভাবে ব্যবহৃত হয়, সেজন্য প্রতিবেদন প্রকাশের সময় নিচের বিষয়গুলো মেনে চলুন:'
                : 'We do not ask for your phone number or email to submit a report, and you can speak here without publicly revealing your personal identity. To make sure this freedom is used responsibly, please follow the guidance below when publishing a report:'}
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-control)] border border-ui-stroke-default p-4 bg-ui-surface">
          <ol className="space-y-3 list-none">
            {instructions.map((instruction, index) => (
              <li key={instruction} className="flex items-start gap-3">
                <p
                  className="type-body text-ui-content-primary shrink-0"
                  aria-hidden="true"
                >
                  {isBn ? `${['১', '২', '৩'][index]}.` : `${index + 1}.`}
                </p>
                <p className="type-body text-ui-content-primary">
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
              <span className="type-body text-ui-content-primary">
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
