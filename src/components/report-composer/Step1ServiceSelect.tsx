import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { SectionKey, SECTIONS, COMING_SOON_SERVICES, ComingSoonServiceKey } from '../../theme/tokens';
import { CategoryIcon } from '../branding/CategoryIcon';
import { AppIcon } from '../ui/AppIcon';
import { useTaxonomy } from '../../services/taxonomyService';
import { RoutePath } from '../../context/AppContext';

export interface Step1ServiceSelectProps {
  selectedSegment: SectionKey | null;
  onSelectSegment: (segment: SectionKey) => void;
  selectedComingSoon?: ComingSoonServiceKey | null;
  onSelectComingSoon?: (key: ComingSoonServiceKey | null) => void;
  onNavigateToComingSoon?: (path: RoutePath) => void;
  onNext?: () => void;
  language: 'bn' | 'en';
}

export const Step1ServiceSelect: React.FC<Step1ServiceSelectProps> = ({
  selectedSegment,
  onSelectSegment,
  selectedComingSoon: controlledComingSoon,
  onSelectComingSoon,
  onNavigateToComingSoon,
  language,
}) => {
  const { segments } = useTaxonomy();
  const [internalComingSoon, setInternalComingSoon] = useState<ComingSoonServiceKey | null>(null);

  const selectedComingSoon =
    controlledComingSoon !== undefined ? controlledComingSoon : internalComingSoon;

  const activeServices: Array<{
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
      titleBn: 'অবৈধ চার্জিং স্টেশন রিপোর্ট করুন',
      titleEn: 'Report an Illegal Charging Station',
      descBn: 'আপনার এলাকায় অবৈধ ব্যাটারি চার্জিং স্টেশনের অবস্থান ও প্রাসঙ্গিক তথ্য জানান।',
      descEn: 'Report the location and relevant details of an illegal battery charging station in your area.',
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

  const comingSoonList = Object.values(COMING_SOON_SERVICES);

  const handleActiveSelect = (key: SectionKey) => {
    setInternalComingSoon(null);
    onSelectComingSoon?.(null);
    onSelectSegment(key);
  };

  const handleComingSoonSelect = (key: ComingSoonServiceKey) => {
    setInternalComingSoon(key);
    onSelectComingSoon?.(key);
  };

  const activeComingSoonData = selectedComingSoon ? COMING_SOON_SERVICES[selectedComingSoon] : null;

  return (
    <div className="space-y-6">
      {/* Single Question Header */}
      <div className="text-left">
        <h3 className="text-[20px] md:text-[22px] font-bold text-primary">
          {language === 'bn' ? 'কোন বিষয়ে অভিযোগ জানাতে চান?' : 'What would you like to report?'}
        </h3>
      </div>

      {/* Active Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeServices.map((srv) => {
          const isSelected = selectedSegment === srv.key && !selectedComingSoon;

          return (
            <button
              type="button"
              key={srv.key}
              id={`service-select-card-${srv.key}`}
              onClick={() => handleActiveSelect(srv.key)}
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

      {/* Upcoming / Coming Soon Services Section */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-muted uppercase tracking-wider">
            {language === 'bn' ? 'আসন্ন সেবাসমূহ' : 'Upcoming Services'}
          </span>
          <span className="h-px bg-subtle flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comingSoonList.map((cs) => {
            const isSelected = selectedComingSoon === cs.key;

            return (
              <button
                type="button"
                key={cs.key}
                id={`service-select-coming-soon-${cs.key}`}
                onClick={() => handleComingSoonSelect(cs.key)}
                aria-pressed={isSelected}
                className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-150 cursor-pointer flex flex-col justify-between text-left border focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] ${
                  isSelected
                    ? 'border-2 border-theme bg-surface-subtle shadow-sm'
                    : 'bg-surface border-subtle hover:border-strong hover:bg-surface-subtle shadow-2xs'
                }`}
              >
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-subtle bg-surface-subtle text-secondary shadow-2xs">
                      <AppIcon name={cs.iconName} size="lg" />
                    </div>

                    <span
                      id={`service-select-badge-${cs.key}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-surface-subtle border border-subtle text-secondary"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>{language === 'bn' ? cs.badgeBn : cs.badgeEn}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-[16px] font-bold text-primary leading-snug">
                      {language === 'bn' ? cs.nameBn : cs.nameEn}
                    </h4>
                    <p className="text-[13.5px] leading-relaxed text-secondary mt-1">
                      {language === 'bn' ? cs.descriptionBn : cs.descriptionEn}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Informative state when a Coming Soon option is selected */}
        {activeComingSoonData && (
          <div
            id="coming-soon-selection-notice"
            role="status"
            aria-live="polite"
            className="p-4 rounded-2xl bg-surface-subtle border border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-primary">
                  {language === 'bn' ? activeComingSoonData.nameBn : activeComingSoonData.nameEn}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface border border-subtle text-muted">
                  {language === 'bn' ? activeComingSoonData.badgeBn : activeComingSoonData.badgeEn}
                </span>
              </div>
              <p className="text-[13.5px] text-secondary leading-relaxed">
                {language === 'bn'
                  ? 'এই রিপোর্টিং সেবাটি প্রস্তুত করা হচ্ছে এবং এখনো চালু হয়নি। অনুগ্রহ করে চালুকৃত সেবা নির্বাচন করুন অথবা বিস্তারিত দেখুন।'
                  : 'This reporting service is being prepared and is not available yet. Please select an active service or read more details.'}
              </p>
            </div>

            {onNavigateToComingSoon && (
              <button
                type="button"
                id={`coming-soon-learn-more-${activeComingSoonData.key}`}
                onClick={() => onNavigateToComingSoon(activeComingSoonData.slug)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-bold bg-surface border border-subtle hover:bg-surface-hover text-primary transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
              >
                <span>{language === 'bn' ? 'বিস্তারিত জানুন' : 'Learn More'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

