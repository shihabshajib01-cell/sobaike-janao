import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Checkbox } from '../ui/Checkbox';
import { ModalActions } from '../ui/ModalActions';
import { BrandLogo } from '../branding/BrandLogo';

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
      closeOnEscape={false}
      maxWidth="md"
      language={language}
      title={
        <span className="inline-flex items-center gap-2.5 min-w-0">
          <span className="sr-only">
            {isBn ? 'সবাইকে জানাও-তে স্বাগতম' : 'Welcome to Sobaike Janao'}
          </span>
          <span aria-hidden="true" className="inline-flex items-center gap-2.5 min-w-0">
            <BrandLogo
              variant="full"
              size="sm"
              aria-label={isBn ? 'সবাইকে জানাও' : 'Sobaike Janao'}
              className="shrink-0"
            />
            <span className="whitespace-nowrap">
              {isBn ? '-তে স্বাগতম' : '— Welcome'}
            </span>
          </span>
        </span>
      }
      showCloseButton={false}
      ariaDescribedBy="first-visit-notice-desc"
      footer={
        <ModalActions
          align="center"
          primary={{
            id: 'first-visit-acknowledge-btn',
            type: 'button',
            size: 'lg',
            onClick: handleContinue,
            disabled: !isChecked,
            label: isBn ? 'সম্মতি দিয়ে এগিয়ে যান' : 'Acknowledge & Continue',
          }}
        />
      }
    >
      <div className="flex flex-col gap-4 text-ui-content-primary">
        <div className="flex flex-col gap-2.5">
          <h3 className="type-h3 text-ui-content-primary">
            {isBn
              ? 'দায়িত্বশীল ব্যবহার ও স্বাধীনতা বিজ্ঞপ্তি'
              : 'Responsible Use & Independence Notice'}
          </h3>

          <div id="first-visit-notice-desc" className="flex flex-col gap-2.5">
            <p className="type-body text-ui-content-primary">
              {isBn
                ? 'সবাইকে জানাও কোনো সরকারি বা আইনশৃঙ্খলা রক্ষাকারী সংস্থার ওয়েবসাইট নয়। এটি বাংলাদেশের নাগরিকদের জন্য একটি স্বাধীন প্ল্যাটফর্ম, যেখানে পরিচয় প্রকাশ না করেই জনস্বার্থে সমস্যা, অভিজ্ঞতা ও পর্যবেক্ষণ শেয়ার করা যায়।'
                : 'Sobaike Janao is not a government or law-enforcement website. It is an independent platform for people in Bangladesh to share public-interest issues, experiences, and observations without publicly revealing their identity.'}
            </p>
            <p className="type-body text-ui-content-primary">
              {isBn
                ? 'প্রতিবেদন দিতে আমরা আপনার ফোন নম্বর বা ইমেইল চাই না। তবে এই স্বাধীনতা দায়িত্বশীলভাবে ব্যবহার করতে নিচের নির্দেশনাগুলো মেনে চলুন:'
                : 'We do not ask for your phone number or email to submit a report. Please follow the guidance below to use this freedom responsibly:'}
            </p>
          </div>
        </div>

        <div className="ui-radius-control ui-border-default border-ui-stroke-default p-4 bg-ui-surface-subtle">
          <ol className="space-y-3 list-none">
            {instructions.map((instruction, index) => (
              <li key={instruction} className="flex items-start gap-3">
                <p className="type-body text-ui-content-primary shrink-0" aria-hidden="true">
                  {isBn ? `${['১', '২', '৩'][index]}.` : `${index + 1}.`}
                </p>
                <p className="type-body text-ui-content-primary">{instruction}</p>
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
              isBn
                ? 'আমি নিয়মগুলো পড়েছি এবং দায়িত্বশীলভাবে ব্যবহার করতে সম্মত।'
                : 'I have read and agree to use this platform responsibly.'
            }
            labelClassName="type-body text-ui-content-primary"
          />
        </div>
      </div>
    </Modal>
  );
};
