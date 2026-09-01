import React from 'react';
import { Keyboard, Navigation, Shield, Zap } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keyDisplay: string[];
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
}

interface ShortcutGroup {
  groupTitleBn: string;
  groupTitleEn: string;
  icon: React.ReactNode;
  items: ShortcutItem[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language } = useApp();

  const shortcutGroups: ShortcutGroup[] = [
    {
      groupTitleBn: 'মূল নেভিগেশন',
      groupTitleEn: 'Main Navigation',
      icon: <Navigation className="w-4 h-4 text-primary" />,
      items: [
        {
          keyDisplay: ['H'],
          titleBn: 'মূলপাতা',
          titleEn: 'Home Page',
          descBn: 'ওয়েবসাইটের মূল ড্যাশবোর্ডে ফিরে যান',
          descEn: 'Go directly to the home screen',
        },
        {
          keyDisplay: ['C'],
          titleBn: 'ঘটনা জানান / অভিযোগ',
          titleEn: 'Create Report',
          descBn: 'নতুন অভিযোগ লেখার ফর্ম খুলুন',
          descEn: 'Open the incident report composer',
        },
        {
          keyDisplay: ['E'],
          titleBn: 'এক্সপ্লোর',
          titleEn: 'Explore Feed',
          descBn: 'পাবলিক অভিযোগের ফিড ও ম্যাপ দেখুন',
          descEn: 'Browse the public feed & map view',
        },
        {
          keyDisplay: ['T'],
          titleBn: 'অভিযোগ ট্র্যাক করুন',
          titleEn: 'Track Report',
          descBn: 'আইডি ও পিন দিয়ে অভিযোগের অগ্রগতি দেখুন',
          descEn: 'Check status with Report ID & PIN',
        },
        {
          keyDisplay: ['S', '/', 'Ctrl+K'],
          titleBn: 'অনুসন্ধান',
          titleEn: 'Search',
          descBn: 'যেকোনো শব্দ বা বিভাগ সার্চ করুন',
          descEn: 'Quickly search reports and topics',
        },
        {
          keyDisplay: ['M'],
          titleBn: 'তথ্য ও সহায়তা',
          titleEn: 'Info & Support',
          descBn: 'জরুরি হেল্পলাইন ও নীতিমালা দেখুন',
          descEn: 'View emergency contacts and policy',
        },
      ],
    },
    {
      groupTitleBn: 'বিভাগীয় পেজ',
      groupTitleEn: 'Category Pages',
      icon: <Shield className="w-4 h-4 text-primary" />,
      items: [
        {
          keyDisplay: ['1'],
          titleBn: 'যৌন হয়রানি ও ইভটিজিং',
          titleEn: 'Harassment',
          descBn: 'হয়রানি সংক্রান্ত বিভাগীয় পেজ',
          descEn: 'Harassment reports section',
        },
        {
          keyDisplay: ['2'],
          titleBn: 'রিকশা অতিরিক্ত ভাড়া',
          titleEn: 'Rickshaw Overcharging',
          descBn: 'রিকশা ভাড়া সম্পর্কিত বিভাগীয় পেজ',
          descEn: 'Rickshaw fare reports section',
        },
        {
          keyDisplay: ['3'],
          titleBn: 'চাঁদাবাজি ও দখলদারি',
          titleEn: 'Extortion',
          descBn: 'চাঁদা ও জোরজবরদস্তি সংক্রান্ত পেজ',
          descEn: 'Extortion reports section',
        },
      ],
    },
    {
      groupTitleBn: 'অন্যান্য নিয়ন্ত্রণ',
      groupTitleEn: 'Controls & Utilities',
      icon: <Zap className="w-4 h-4 text-primary" />,
      items: [
        {
          keyDisplay: ['L'],
          titleBn: 'ভাষা পরিবর্তন',
          titleEn: 'Toggle Language',
          descBn: 'বাংলা এবং ইংরেজির মাঝে সুইচ করুন',
          descEn: 'Toggle between Bangla and English',
        },
        {
          keyDisplay: ['?'],
          titleBn: 'কীবোর্ড শর্টকাট সহায়তা',
          titleEn: 'Shortcuts Help',
          descBn: 'এই শর্টকাট গাইড উইন্ডোটি দেখুন',
          descEn: 'Toggle this keyboard shortcuts dialog',
        },
        {
          keyDisplay: ['Esc'],
          titleBn: 'ডায়ালগ বন্ধ করুন',
          titleEn: 'Close Modal',
          descBn: 'যেকোনো খোলা পপআপ বা মেনু বন্ধ করুন',
          descEn: 'Dismiss any open dialog or drawer',
        },
      ],
    },
  ];

  return (
    <Modal
      id="keyboard-shortcuts-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={language === 'bn' ? 'কীবোর্ড শর্টকাট' : 'Keyboard Shortcuts'}
      description={
        language === 'bn'
          ? 'দ্রুত ও সহজে ব্রাউজ করতে এই কি-গুলো ব্যবহার করুন'
          : 'Use these keyboard keys for faster and accessible navigation'
      }
      maxWidth="lg"
    >
      <div className="space-y-6">
        {shortcutGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-3">
            <div className="flex items-center gap-2 text-[14px] font-bold text-secondary uppercase tracking-wider">
              {group.icon}
              <span>{language === 'bn' ? group.groupTitleBn : group.groupTitleEn}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {group.items.map((item, iIdx) => (
                <div
                  key={iIdx}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-subtle gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-primary text-[15px] truncate">
                      {language === 'bn' ? item.titleBn : item.titleEn}
                    </div>
                    <div className="text-[13px] text-muted truncate">
                      {language === 'bn' ? item.descBn : item.descEn}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.keyDisplay.map((k, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="px-2.5 py-1 text-[13px] font-mono font-bold bg-surface text-primary border border-subtle rounded-lg shadow-2xs inline-block"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="p-3.5 bg-surface-subtle rounded-xl border border-subtle text-[13px] text-secondary flex items-start gap-2.5">
          <Keyboard className="w-4 h-4 text-muted shrink-0 mt-0.5" />
          <span>
            {language === 'bn'
              ? 'টিপস: আপনি যখন কোনো ইনপুট বা লেখার বক্সে টাইপ করবেন, তখন কীবোর্ড শর্টকাটগুলো বিঘ্ন ঘটাবে না।'
              : 'Tip: Shortcuts are automatically paused when typing inside text boxes or form fields.'}
          </span>
        </div>
      </div>
    </Modal>
  );
};
