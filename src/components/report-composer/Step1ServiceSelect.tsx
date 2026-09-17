import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
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
      descBn: 'হয়রানি, নির্যাতন বা অনলাইন হয়রানি জানান।',
      descEn: 'Report harassment, abuse, or online harassment.',
      bgVar: 'var(--sec-harassment-bg)',
      textVar: 'var(--sec-harassment-text)',
      borderVar: 'var(--sec-harassment-border)',
      primaryVar: 'var(--sec-harassment-primary)',
    },
    {
      key: 'load_shedding',
      titleBn: segments.load_shedding?.nameBn || SECTIONS.load_shedding.nameBn,
      titleEn: segments.load_shedding?.nameEn || SECTIONS.load_shedding.nameEn,
      descBn: 'বিদ্যুৎ, গ্যাস বা ইউটিলিটি সমস্যা জানান।',
      descEn: 'Report electricity, gas, or utility issues.',
      bgVar: 'var(--sec-load_shedding-bg)',
      textVar: 'var(--sec-load_shedding-text)',
      borderVar: 'var(--sec-load_shedding-border)',
      primaryVar: 'var(--sec-load_shedding-primary)',
    },
    {
      key: 'extortion',
      titleBn: segments.extortion?.nameBn || SECTIONS.extortion.nameBn,
      titleEn: segments.extortion?.nameEn || SECTIONS.extortion.nameEn,
      descBn: 'ঘুষ, চাঁদাবাজি বা জোরপূর্বক অর্থ আদায় জানান।',
      descEn: 'Report bribery, extortion, or forced payments.',
      bgVar: 'var(--sec-extortion-bg)',
      textVar: 'var(--sec-extortion-text)',
      borderVar: 'var(--sec-extortion-border)',
      primaryVar: 'var(--sec-extortion-primary)',
    },
    {
      key: 'public_safety',
      titleBn: segments.public_safety?.nameBn || SECTIONS.public_safety.nameBn,
      titleEn: segments.public_safety?.nameEn || SECTIONS.public_safety.nameEn,
      descBn: 'চুরি, ডাকাতি, ছিনতাই বা মব সহিংসতা জানান।',
      descEn: 'Report theft, robbery, snatching, or mob violence.',
      bgVar: 'var(--sec-public_safety-bg)',
      textVar: 'var(--sec-public_safety-text)',
      borderVar: 'var(--sec-public_safety-border)',
      primaryVar: 'var(--sec-public_safety-primary)',
    },
    {
      key: 'road_transport',
      titleBn: segments.road_transport?.nameBn || SECTIONS.road_transport.nameBn,
      titleEn: segments.road_transport?.nameEn || SECTIONS.road_transport.nameEn,
      descBn: 'সড়ক মেরামত, দুর্ঘটনা বা অবরোধ জানান।',
      descEn: 'Report road repairs, accidents, or road blocks.',
      bgVar: 'var(--sec-road_transport-bg)',
      textVar: 'var(--sec-road_transport-text)',
      borderVar: 'var(--sec-road_transport-border)',
      primaryVar: 'var(--sec-road_transport-primary)',
    },
    {
      key: 'illegal_occupation',
      titleBn: segments.illegal_occupation?.nameBn || SECTIONS.illegal_occupation.nameBn,
      titleEn: segments.illegal_occupation?.nameEn || SECTIONS.illegal_occupation.nameEn,
      descBn: 'রাস্তা, ফুটপাত বা জমির অবৈধ দখল জানান।',
      descEn: 'Report illegal occupation of roads, paths, or land.',
      bgVar: 'var(--sec-illegal_occupation-bg)',
      textVar: 'var(--sec-illegal_occupation-text)',
      borderVar: 'var(--sec-illegal_occupation-border)',
      primaryVar: 'var(--sec-illegal_occupation-primary)',
    },
    {
      key: 'rickshaw',
      titleBn: segments.rickshaw?.nameBn || SECTIONS.rickshaw.nameBn,
      titleEn: segments.rickshaw?.nameEn || SECTIONS.rickshaw.nameEn,
      descBn: 'অবৈধ বা ঝুঁকিপূর্ণ অটো-রিকশা চার্জিং স্টেশন জানান।',
      descEn: 'Report illegal or unsafe auto-rickshaw charging stations.',
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {activeServices.map((srv) => {
          const isSelected = selectedSegment === srv.key && !selectedComingSoon;

          return (
            <button
              type="button"
              key={srv.key}
              id={`service-select-card-${srv.key}`}
              onClick={() => handleActiveSelect(srv.key)}
              aria-pressed={isSelected}
              className={`relative rounded-[var(--radius-card)] px-4 py-3.5 md:px-5 md:py-4 transition-all duration-150 cursor-pointer flex items-center gap-3 text-left border focus:outline-none focus:ring-2 focus:ring-ui-focus ${
                isSelected
                  ? 'border-2 shadow-[var(--elevation-sm)]'
                  : 'bg-ui-surface border-ui-stroke-subtle shadow-[var(--elevation-2xs)]'
              }`}
              style={{
                backgroundColor: isSelected ? srv.bgVar : undefined,
                borderColor: isSelected ? srv.primaryVar : undefined,
              }}
            >
              <div
                className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-[var(--radius-control)] flex items-center justify-center transition-colors border shadow-[var(--elevation-2xs)]"
                style={{
                  backgroundColor: `var(--sec-${srv.key}-bg)`,
                  color: `var(--sec-${srv.key}-text)`,
                  borderColor: `var(--sec-${srv.key}-border)`,
                }}
              >
                <CategoryIcon section={srv.key} size="md" />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="type-h3 text-ui-content-primary">
                  {language === 'bn' ? srv.titleBn : srv.titleEn}
                </h4>
                <p className="type-meta text-ui-content-secondary mt-0.5 truncate">
                  {language === 'bn' ? srv.descBn : srv.descEn}
                </p>
              </div>

              <div
                aria-hidden="true"
                className={`w-6 h-6 shrink-0 rounded-[var(--radius-pill)] flex items-center justify-center border-2 transition-all ${
                  isSelected
                    ? 'border-ui-accent bg-ui-surface'
                    : 'border-ui-stroke-subtle bg-ui-surface'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-[var(--radius-pill)] bg-ui-accent transition-transform ${
                    isSelected ? 'scale-100' : 'scale-0'
                  }`}
                />
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
