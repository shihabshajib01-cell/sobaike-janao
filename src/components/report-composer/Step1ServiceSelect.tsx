import React from 'react';
import { Check } from 'lucide-react';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { CategoryIcon } from '../branding/CategoryIcon';
import { useTaxonomy } from '../../services/taxonomyService';

export interface Step1ServiceSelectProps {
  selectedSegment: SectionKey | null;
  onSelectSegment: (segment: SectionKey) => void;
  onNext?: () => void;
  language: 'bn' | 'en';
}

export const Step1ServiceSelect: React.FC<Step1ServiceSelectProps> = ({
  selectedSegment,
  onSelectSegment,
  language,
}) => {
  const { segments } = useTaxonomy();

  const services: Array<{
    key: SectionKey;
    titleBn: string;
    titleEn: string;
    descBn: string;
    descEn: string;
    bgVar: string;
    textVar: string;
    borderVar: string;
    primaryVar: string;
  }> = [
    {
      key: 'harassment',
      titleBn: segments.harassment?.nameBn || SECTIONS.harassment.nameBn,
      titleEn: segments.harassment?.nameEn || SECTIONS.harassment.nameEn,
      descBn: 'যৌন হয়রানি, নির্যাতন, প্রতারণা বা অনলাইন হয়রানি সম্পর্কিত অভিযোগ।',
      descEn: 'Report sexual harassment, abuse, relationship deception, or online harassment.',
      bgVar: 'var(--sec-harassment-bg)',
      textVar: 'var(--sec-harassment-text)',
      borderVar: 'var(--sec-harassment-border)',
      primaryVar: 'var(--sec-harassment-primary)',
    },
    {
      key: 'rickshaw',
      titleBn: segments.rickshaw?.nameBn || SECTIONS.rickshaw.nameBn,
      titleEn: segments.rickshaw?.nameEn || SECTIONS.rickshaw.nameEn,
      descBn: 'আপনার জানা অটোরিকশা চার্জিং স্টেশন বা গ্যারেজের অবস্থান ও প্রাসঙ্গিক তথ্য জানান।',
      descEn: 'Report an auto-rickshaw charging station or garage and its relevant details.',
      bgVar: 'var(--sec-rickshaw-bg)',
      textVar: 'var(--sec-rickshaw-text)',
      borderVar: 'var(--sec-rickshaw-border)',
      primaryVar: 'var(--sec-rickshaw-primary)',
    },
    {
      key: 'extortion',
      titleBn: segments.extortion?.nameBn || SECTIONS.extortion.nameBn,
      titleEn: segments.extortion?.nameEn || SECTIONS.extortion.nameEn,
      descBn: 'চাঁদা দাবি, জোরপূর্বক অর্থ আদায় বা চাপ প্রয়োগের ঘটনা জানান।',
      descEn: 'Report extortion, coercive collections, or pressure.',
      bgVar: 'var(--sec-extortion-bg)',
      textVar: 'var(--sec-extortion-text)',
      borderVar: 'var(--sec-extortion-border)',
      primaryVar: 'var(--sec-extortion-primary)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Single Question Header */}
      <div className="text-left">
        <h3 className="text-[20px] md:text-[22px] font-bold text-primary">
          {language === 'bn' ? 'কোন বিষয়ে অভিযোগ জানাতে চান?' : 'What would you like to report?'}
        </h3>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((srv) => {
          const isSelected = selectedSegment === srv.key;

          return (
            <button
              type="button"
              key={srv.key}
              id={`service-select-card-${srv.key}`}
              onClick={() => onSelectSegment(srv.key)}
              aria-pressed={isSelected}
              className={`relative rounded-2xl p-5 md:p-6 transition-all duration-150 cursor-pointer flex flex-col justify-between text-left border focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] ${
                isSelected
                  ? 'border-2 shadow-sm'
                  : 'bg-surface border-subtle hover:border-strong hover:bg-surface-elevated shadow-2xs'
              }`}
              style={{
                backgroundColor: isSelected ? srv.bgVar : undefined,
                borderColor: isSelected ? srv.primaryVar : undefined,
              }}
            >
              <div className="space-y-3 w-full">
                {/* Header Icon + Selection Indicator */}
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors border shadow-2xs"
                    style={{
                      backgroundColor: `var(--sec-${srv.key}-bg)`,
                      color: `var(--sec-${srv.key}-text)`,
                      borderColor: `var(--sec-${srv.key}-border)`,
                    }}
                  >
                    <CategoryIcon section={srv.key} size="md" />
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'border-transparent bg-accent text-inverse'
                        : 'border-subtle bg-surface text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-[18px] font-bold text-primary leading-snug">
                    {language === 'bn' ? srv.titleBn : srv.titleEn}
                  </h4>
                  <p className="text-[14px] leading-relaxed text-secondary mt-1.5">
                    {language === 'bn' ? srv.descBn : srv.descEn}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
