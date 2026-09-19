import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SectionKey, COMING_SOON_SERVICES, ComingSoonServiceKey } from '../../theme/tokens';
import { CategoryIcon } from '../branding/CategoryIcon';
import { AppIcon } from '../ui/AppIcon';
import { useTaxonomy } from '../../services/taxonomyService';
import { CategoryPopularityService } from '../../services/categoryPopularityService';
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
  const [categoryOrder, setCategoryOrder] = useState<SectionKey[]>(() =>
    CategoryPopularityService.getFallbackOrder()
  );

  useEffect(() => {
    let active = true;

    CategoryPopularityService.getOrderedCategoryKeys().then((keys) => {
      if (active) setCategoryOrder(keys);
    });

    return () => {
      active = false;
    };
  }, [segments]);

  const selectedComingSoon =
    controlledComingSoon !== undefined ? controlledComingSoon : internalComingSoon;

  const categoryOrderIndex = new Map(
    categoryOrder.map((key, index) => [key, index] as const)
  );

  const activeServices = Object.values(segments)
    .sort((a, b) => {
      const aIndex = categoryOrderIndex.get(a.id as SectionKey);
      const bIndex = categoryOrderIndex.get(b.id as SectionKey);

      if (aIndex !== undefined && bIndex !== undefined) return aIndex - bIndex;
      if (aIndex !== undefined) return -1;
      if (bIndex !== undefined) return 1;
      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
    })
    .map((service) => ({
      key: service.id as SectionKey,
      titleBn: service.nameBn,
      titleEn: service.nameEn,
      descBn: service.descriptionBn || service.shortNameBn,
      descEn: service.descriptionEn || service.shortNameEn,
    }));

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

  const getSectionStyles = (section: SectionKey) => ({
    background: `var(--sec-${section}-bg)`,
    text: `var(--sec-${section}-text)`,
    border: `var(--sec-${section}-border)`,
    primary: `var(--sec-${section}-primary)`,
  });

  return (
    <div className="space-y-5">
      <div className="text-left">
        <h3 className="type-h3 font-[var(--font-weight-semibold)] text-ui-content-primary">
          {language === 'bn' ? 'কী বিষয়ে প্রতিবেদন করতে চান?' : 'What would you like to report?'}
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
              className={`report-composer-card relative ui-radius-card px-4 py-3.5 md:px-5 md:py-4 transition-colors duration-150 cursor-pointer flex items-center gap-3 text-left ui-border-default focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                isSelected
                  ? 'ui-elevation-selected'
                  : 'bg-ui-surface border-ui-stroke-default ui-elevation-control'
              }`}
              style={{
                backgroundColor: isSelected ? getSectionStyles(srv.key).background : undefined,
                borderColor: isSelected ? getSectionStyles(srv.key).primary : undefined,
              }}
            >
              <div
                className="w-11 h-11 md:w-12 md:h-12 shrink-0 ui-radius-control flex items-center justify-center transition-colors ui-border-default ui-elevation-control"
                style={{
                  backgroundColor: getSectionStyles(srv.key).background,
                  color: getSectionStyles(srv.key).primary,
                  borderColor: isSelected
                    ? getSectionStyles(srv.key).primary
                    : getSectionStyles(srv.key).border,
                }}
              >
                <CategoryIcon section={srv.key} size="md" />
              </div>

              <div className="min-w-0 flex-1">
                <h4
                  className="type-h4 text-ui-content-primary"
                  style={{ color: isSelected ? getSectionStyles(srv.key).text : undefined }}
                >
                  {language === 'bn' ? srv.titleBn : srv.titleEn}
                </h4>
                <p
                  className="type-helper text-ui-content-secondary mt-0.5 truncate"
                  style={{ color: isSelected ? getSectionStyles(srv.key).text : undefined }}
                >
                  {language === 'bn' ? srv.descBn : srv.descEn}
                </p>
              </div>

              <div
                aria-hidden="true"
                className={`w-5 h-5 shrink-0 rounded-[var(--radius-pill)] flex items-center justify-center ui-border-default transition-colors ${
                  isSelected
                    ? 'bg-ui-surface'
                    : 'border-ui-stroke-default bg-ui-surface'
                }`}
                style={{
                  borderColor: isSelected ? getSectionStyles(srv.key).primary : undefined,
                }}
              >
                <span
                  className={`w-2 h-2 rounded-[var(--radius-pill)] transition-transform ${
                    isSelected ? 'scale-100' : 'scale-0'
                  }`}
                  style={{ backgroundColor: getSectionStyles(srv.key).primary }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {comingSoonList.length > 0 && (
        <div className="pt-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="type-compact font-[var(--font-weight-bold)] text-ui-content-muted uppercase tracking-wider">
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
                  className={`report-composer-card relative rounded-[var(--radius-card)] p-4 sm:p-5 transition-all duration-150 cursor-pointer flex flex-col justify-between text-left border focus:outline-none focus:ring-2 focus:ring-ui-focus ${
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-pill)] type-compact font-[var(--font-weight-semibold)] bg-ui-surface-subtle border border-ui-stroke-subtle text-ui-content-secondary"
                      >
                        <span className="w-1.5 h-1.5 rounded-[var(--radius-pill)] bg-ui-warning-text animate-pulse" />
                        <span>{language === 'bn' ? cs.badgeBn : cs.badgeEn}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="type-h4 text-ui-content-primary">
                        {language === 'bn' ? cs.nameBn : cs.nameEn}
                      </h4>
                      <p className="type-compact text-ui-content-secondary mt-1">
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
                  <span className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">
                    {language === 'bn' ? activeComingSoonData.nameBn : activeComingSoonData.nameEn}
                  </span>
                  <span className="type-compact font-[var(--font-weight-semibold)] px-2 py-0.5 rounded-[var(--radius-badge-sm)] bg-ui-surface border border-ui-stroke-subtle text-ui-content-muted">
                    {language === 'bn' ? activeComingSoonData.badgeBn : activeComingSoonData.badgeEn}
                  </span>
                </div>
                <p className="type-compact text-ui-content-secondary">
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
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius-control)] type-compact font-[var(--font-weight-bold)] bg-ui-surface border border-ui-stroke-subtle text-ui-content-primary transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
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
