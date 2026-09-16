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

  const allServices: Array<{
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
      key: 'extortion',
      titleBn: segments.extortion?.nameBn || SECTIONS.extortion.nameBn,
      titleEn: segments.extortion?.nameEn || SECTIONS.extortion.nameEn,
      descBn: 'ঘুষ দাবি, ঘুষ প্রদান, চাঁদা দাবি বা জোরপূর্বক অর্থ আদায়ের ঘটনা জানান।',
      descEn: 'Report bribery, extortion, coercive collections, or illegal payment demands.',
      bgVar: 'var(--sec-extortion-bg)',
      textVar: 'var(--sec-extortion-text)',
      borderVar: 'var(--sec-extortion-border)',
      primaryVar: 'var(--sec-extortion-primary)',
    },
    {
      key: 'public_safety',
      titleBn: segments.public_safety?.nameBn || SECTIONS.public_safety.nameBn,
      titleEn: segments.public_safety?.nameEn || SECTIONS.public_safety.nameEn,
      descBn: 'চুরি, ডাকাতি বা ছিনতাইয়ের ঘটনা ও অবস্থান জানান।',
      descEn: 'Report theft, robbery, snatching, and related public-safety incidents.',
      bgVar: 'var(--sec-public_safety-bg)',
      textVar: 'var(--sec-public_safety-text)',
      borderVar: 'var(--sec-public_safety-border)',
      primaryVar: 'var(--sec-public_safety-primary)',
    },
    {
      key: 'road_transport',
      titleBn: segments.road_transport?.nameBn || SECTIONS.road_transport.nameBn,
      titleEn: segments.road_transport?.nameEn || SECTIONS.road_transport.nameEn,
      descBn: 'রাস্তা মেরামতে বিলম্ব, দুর্ঘটনা বা সড়ক অবরোধের তথ্য জানান।',
      descEn: 'Report road repair delays, accidents, road blocks, or other transport issues.',
      bgVar: 'var(--sec-road_transport-bg)',
      textVar: 'var(--sec-road_transport-text)',
      borderVar: 'var(--sec-road_transport-border)',
      primaryVar: 'var(--sec-road_transport-primary)',
    },
    {
      key: 'load_shedding',
      titleBn: segments.load_shedding?.nameBn || SECTIONS.load_shedding.nameBn,
      titleEn: segments.load_shedding?.nameEn || SECTIONS.load_shedding.nameEn,
      descBn: 'লোডশেডিং, গ্যাস সংকট বা অতিরিক্ত বিদ্যুৎ বিল সংক্রান্ত অভিযোগ।',
      descEn: 'Report load shedding, gas shortages, or excess electricity bill issues.',
      bgVar: 'var(--sec-load_shedding-bg)',
      textVar: 'var(--sec-load_shedding-text)',
      borderVar: 'var(--sec-load_shedding-border)',
      primaryVar: 'var(--sec-load_shedding-primary)',
    },
    {
      key: 'illegal_occupation',
      titleBn: segments.illegal_occupation?.nameBn || SECTIONS.illegal_occupation.nameBn,
      titleEn: segments.illegal_occupation?.nameEn || SECTIONS.illegal_occupation.nameEn,
      descBn: 'রাস্তা, ফুটপাত, ব্যক্তিগত বা সরকারি জমি ও সম্পত্তির অবৈধ দখল জানান।',
      descEn: 'Report illegal occupation of public space, private land, or government property.',
      bgVar: 'var(--sec-illegal_occupation-bg)',
      textVar: 'var(--sec-illegal_occupation-text)',
      borderVar: 'var(--sec-illegal_occupation-border)',
      primaryVar: 'var(--sec-illegal_occupation-primary)',
    },
    {
      key: 'rickshaw',
      titleBn: segments.rickshaw?.nameBn || SECTIONS.rickshaw.nameBn,
      titleEn: segments.rickshaw?.nameEn || SECTIONS.rickshaw.nameEn,
      descBn: 'অবৈধ বা ঝুঁকিপূর্ণ চার্জিং স্টেশনের অবস্থান ও তথ্য দিন।',
      descEn: 'Share the location and details of illegal or unsafe charging stations.',
      bgVar: 'var(--sec-rickshaw-bg)',
      textVar: 'var(--sec-rickshaw-text)',
      borderVar: 'var(--sec-rickshaw-border)',
      primaryVar: 'var(--sec-rickshaw-primary)',
    },
  ];
  const activeServices = allServices.filter((service) => Boolean(segments[service.key]));

  const comingSoonList = Object.values(COMING_SOON_SERVICES).filter(
    (cs) => cs.key !== 'illegal_occupation'
  );

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
      <div className="text-left">
        <h3 className="text-[var(--type-fixed-20)] md:text-[var(--type-fixed-22)] font-[var(--font-weight-bold)] text-ui-content-primary">
          {language === 'bn' ? 'কোন বিষয়ে জানাতে চান?' : 'What would you like to report?'}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activeServices.map((srv) => {
          const isSelected = selectedSegment === srv.key && !selectedComingSoon;

          return (
            <button
              type="button"
              key={srv.key}
              id={`service-select-card-${srv.key}`}
              onClick={() => handleActiveSelect(srv.key)}
              aria-pressed={isSelected}
              className={`relative rounded-[var(--radius-card)] p-5 md:p-6 transition-all duration-150 cursor-pointer flex flex-col justify-between text-left border focus:outline-none focus:ring-2 focus:ring-ui-focus ${
                isSelected
                  ? 'border-2 shadow-[var(--elevation-sm)]'
                  : 'bg-ui-surface border-ui-stroke-subtle shadow-[var(--elevation-2xs)]'
              }`}
              style={{
                backgroundColor: isSelected ? srv.bgVar : undefined,
                borderColor: isSelected ? srv.primaryVar : undefined,
              }}
            >
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-[var(--radius-control)] flex items-center justify-center transition-colors border shadow-[var(--elevation-2xs)]"
                    style={{
                      backgroundColor: `var(--sec-${srv.key}-bg)`,
                      color: `var(--sec-${srv.key}-text)`,
                      borderColor: `var(--sec-${srv.key}-border)`,
                    }}
                  >
                    <CategoryIcon section={srv.key} size="md" />
                  </div>

                  <div
                    className={`w-6 h-6 rounded-[var(--radius-pill)] flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'border-transparent bg-ui-accent text-ui-content-inverse'
                        : 'border-ui-stroke-subtle bg-ui-surface text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <h4 className="text-[var(--type-fixed-18)] font-[var(--font-weight-bold)] text-ui-content-primary leading-snug">
                    {language === 'bn' ? srv.titleBn : srv.titleEn}
                  </h4>
                  <p className="text-[var(--type-fixed-14)] leading-relaxed text-ui-content-secondary mt-1.5">
                    {language === 'bn' ? srv.descBn : srv.descEn}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {comingSoonList.length > 0 && (
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--type-fixed-12)] font-[var(--font-weight-bold)] text-ui-content-muted uppercase tracking-wider">
              {language === 'bn' ? 'আসন্ন সেবাসমূহ' : 'Upcoming services'}
            </span>
            <span className="h-px flex-1" />
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
                  className={`relative rounded-[var(--radius-card)] p-4 sm:p-5 transition-all duration-150 cursor-pointer flex flex-col justify-between text-left border focus:outline-none focus:ring-2 focus:ring-ui-focus ${
                    isSelected
                      ? 'border-2 border-ui-stroke-strong bg-ui-surface-subtle shadow-[var(--elevation-sm)]'
                      : 'bg-ui-surface border-ui-stroke-subtle shadow-[var(--elevation-2xs)]'
                  }`}
                >
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-[var(--radius-control)] flex items-center justify-center border border-ui-stroke-subtle bg-ui-surface-subtle text-ui-content-secondary shadow-[var(--elevation-2xs)]">
                        <AppIcon name={cs.iconName} size="lg" />
                      </div>

                      <span
                        id={`service-select-badge-${cs.key}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-pill)] text-[var(--type-fixed-12)] font-[var(--font-weight-semibold)] bg-ui-surface-subtle border border-ui-stroke-subtle text-ui-content-secondary"
                      >
                        <span className="w-1.5 h-1.5 rounded-[var(--radius-pill)] bg-ui-warning-text animate-pulse" />
                        <span>{language === 'bn' ? cs.badgeBn : cs.badgeEn}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-[var(--type-fixed-16)] font-[var(--font-weight-bold)] text-ui-content-primary leading-snug">
                        {language === 'bn' ? cs.nameBn : cs.nameEn}
                      </h4>
                      <p className="text-[var(--type-fixed-135)] leading-relaxed text-ui-content-secondary mt-1">
                        {language === 'bn' ? cs.descriptionBn : cs.descriptionEn}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {activeComingSoonData && (
            <div
              id="coming-soon-selection-notice"
              role="status"
              aria-live="polite"
              className="p-4 rounded-[var(--radius-card)] bg-ui-surface-subtle border border-ui-stroke-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--type-fixed-14)] font-[var(--font-weight-bold)] text-ui-content-primary">
                    {language === 'bn' ? activeComingSoonData.nameBn : activeComingSoonData.nameEn}
                  </span>
                  <span className="text-[var(--type-fixed-11)] font-[var(--font-weight-semibold)] px-2 py-0.5 rounded-[var(--radius-badge-sm)] bg-ui-surface border border-ui-stroke-subtle text-ui-content-muted">
                    {language === 'bn' ? activeComingSoonData.badgeBn : activeComingSoonData.badgeEn}
                  </span>
                </div>
                <p className="text-[var(--type-fixed-135)] text-ui-content-secondary leading-relaxed">
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
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-control)] text-[var(--type-fixed-13)] font-[var(--font-weight-bold)] bg-ui-surface border border-ui-stroke-subtle text-ui-content-primary transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                >
                  <span>{language === 'bn' ? 'বিস্তারিত দেখুন' : 'Learn more'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-ui-content-muted" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
