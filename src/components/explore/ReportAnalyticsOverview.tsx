import React, { useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { BANGLADESH_DISTRICTS } from '../../data/districts';
import { toBanglaDigits } from '../../utils/formatters';
import { CategoryIcon } from '../branding/CategoryIcon';

export interface ReportAnalyticsOverviewProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
  activeCategory?: SectionKey | 'all';
  onSelectCategory?: (category: SectionKey) => void;
}

const CANONICAL_CATEGORIES = Object.keys(SECTIONS) as SectionKey[];

export const ReportAnalyticsOverview: React.FC<ReportAnalyticsOverviewProps> = ({
  reports,
  language,
  activeCategory = 'all',
  onSelectCategory,
}) => {
  const totalReports = reports.length;

  const {
    districtCount,
    divisionCount,
    geoMappedReportCount,
    mostReportedLabel,
    mostReportedKey,
    categoryStats,
  } = useMemo(() => {
    if (totalReports === 0) {
      return {
        districtCount: 0,
        divisionCount: 0,
        geoMappedReportCount: 0,
        mostReportedLabel: '-',
        mostReportedKey: null as SectionKey | null,
        categoryStats: [],
      };
    }

    const matchedDistricts = new Set<string>();
    const matchedDivisions = new Set<string>();
    let geoMappedCount = 0;

    const counts = Object.fromEntries(
      CANONICAL_CATEGORIES.map((key) => [key, 0])
    ) as Record<SectionKey, number>;

    reports.forEach((rep) => {
      if (rep.segment in counts) {
        counts[rep.segment] += 1;
      }

      const dEn = (rep.districtEn || '').toLowerCase().trim();
      const dBn = (rep.districtBn || '').trim();
      if (!dBn && !dEn) return;

      const foundDistrict = BANGLADESH_DISTRICTS.find(
        (d) =>
          d.nameEn.toLowerCase() === dEn ||
          d.nameBn === dBn ||
          d.id === dEn
      );

      if (foundDistrict) {
        matchedDistricts.add(foundDistrict.id);
        matchedDivisions.add(foundDistrict.divisionId);
        geoMappedCount += 1;
      }
    });

    const categoryEntries = CANONICAL_CATEGORIES.map((key) => ({
      key,
      count: counts[key],
    }));

    const maxCount = Math.max(...categoryEntries.map((e) => e.count));
    let topLabel = '-';
    let topCategoryKey: SectionKey | null = null;

    if (maxCount > 0) {
      const topItems = categoryEntries.filter((e) => e.count === maxCount);
      if (topItems.length > 1) {
        topLabel = language === 'bn' ? 'একাধিক' : 'Multiple';
      } else {
        const topKey = topItems[0].key;
        topCategoryKey = topKey;
        topLabel =
          language === 'bn'
            ? SECTIONS[topKey].shortNameBn
            : SECTIONS[topKey].shortNameEn;
      }
    }

    const stats = CANONICAL_CATEGORIES.map((key) => {
      const count = counts[key];
      const percentage =
        totalReports > 0 ? Math.round((count / totalReports) * 100) : 0;
      const label =
        language === 'bn' ? SECTIONS[key].shortNameBn : SECTIONS[key].shortNameEn;

      return {
        key,
        label,
        count,
        percentage,
        chartPercentage: totalReports > 0 ? (count / totalReports) * 100 : 0,
      };
    });

    return {
      districtCount: matchedDistricts.size,
      divisionCount: matchedDivisions.size,
      geoMappedReportCount: geoMappedCount,
      mostReportedLabel: topLabel,
      mostReportedKey: topCategoryKey,
      categoryStats: stats,
    };
  }, [reports, totalReports, language]);

  if (totalReports === 0) {
    return null;
  }

  const hasUnmappedGeos = geoMappedReportCount < totalReports;

  return (
    <section
      id="explore-report-analytics"
      aria-label={language === 'bn' ? 'প্রতিবেদন সারসংক্ষেপ' : 'Report summary'}
      className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-control)] sm:rounded-[var(--radius-card)] p-3 sm:p-4 space-y-3 shadow-[var(--elevation-2xs)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-ui-stroke-subtle pb-2">
        <h2 className="type-label font-[var(--font-weight-bold)] text-ui-content-primary tracking-tight">
          {language === 'bn' ? 'প্রতিবেদন সারসংক্ষেপ' : 'Report summary'}
        </h2>
        <span className="type-compact text-ui-content-secondary font-[var(--font-weight-regular)]">
          {language === 'bn' ? 'বর্তমান ফিল্টারের ভিত্তিতে' : 'Based on current filters'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div
          id="metric-total-reports"
          className="bg-ui-surface-subtle/80 rounded-[var(--radius-badge-md)] p-2 sm:p-2.5 flex flex-col justify-between min-h-[56px] sm:min-h-[60px]"
        >
          <span className="type-compact font-[var(--font-weight-medium)] text-ui-content-secondary truncate">
            {language === 'bn' ? 'মোট প্রতিবেদন' : 'Total reports'}
          </span>
          <span className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary leading-tight">
            {language === 'bn' ? toBanglaDigits(totalReports) : totalReports}
          </span>
        </div>

        <div
          id="metric-affected-districts"
          className="bg-ui-surface-subtle/80 rounded-[var(--radius-badge-md)] p-2 sm:p-2.5 flex flex-col justify-between min-h-[56px] sm:min-h-[60px]"
        >
          <span className="type-compact font-[var(--font-weight-medium)] text-ui-content-secondary leading-tight line-clamp-2">
            {language === 'bn' ? 'প্রতিবেদন থাকা জেলা' : 'Districts with reports'}
          </span>
          <span className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary leading-tight">
            {language === 'bn' ? toBanglaDigits(districtCount) : districtCount}
          </span>
        </div>

        <div
          id="metric-affected-divisions"
          className="bg-ui-surface-subtle/80 rounded-[var(--radius-badge-md)] p-2 sm:p-2.5 flex flex-col justify-between min-h-[56px] sm:min-h-[60px]"
        >
          <span className="type-compact font-[var(--font-weight-medium)] text-ui-content-secondary leading-tight line-clamp-2">
            {language === 'bn' ? 'প্রতিবেদন থাকা বিভাগ' : 'Divisions with reports'}
          </span>
          <span className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary leading-tight">
            {language === 'bn' ? toBanglaDigits(divisionCount) : divisionCount}
          </span>
        </div>

        {mostReportedKey && onSelectCategory ? (
          <button
            id="metric-most-reported"
            type="button"
            onClick={() => onSelectCategory(mostReportedKey)}
            className="text-left bg-ui-surface-subtle/80 hover:bg-ui-surface-hover rounded-[var(--radius-badge-md)] p-2 sm:p-2.5 flex flex-col justify-between min-h-[56px] sm:min-h-[60px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            aria-label={
              language === 'bn'
                ? `${mostReportedLabel} ক্যাটাগরির প্রতিবেদন দেখুন`
                : `Filter to ${mostReportedLabel} reports`
            }
          >
            <span className="type-compact font-[var(--font-weight-medium)] text-ui-content-secondary leading-tight line-clamp-2">
              {language === 'bn' ? 'সর্বাধিক প্রতিবেদন' : 'Most reported'}
            </span>
            <span className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary leading-tight break-words line-clamp-2">
              {mostReportedLabel}
            </span>
          </button>
        ) : (
          <div
            id="metric-most-reported"
            className="bg-ui-surface-subtle/80 rounded-[var(--radius-badge-md)] p-2 sm:p-2.5 flex flex-col justify-between min-h-[56px] sm:min-h-[60px]"
          >
            <span className="type-compact font-[var(--font-weight-medium)] text-ui-content-secondary leading-tight line-clamp-2">
              {language === 'bn' ? 'সর্বাধিক প্রতিবেদন' : 'Most reported'}
            </span>
            <span className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary leading-tight break-words line-clamp-2">
              {mostReportedLabel}
            </span>
          </div>
        )}
      </div>

      {hasUnmappedGeos && (
        <p className="type-compact text-ui-content-secondary">
          {language === 'bn'
            ? 'জেলা তথ্য থাকা প্রতিবেদনগুলোর ভিত্তিতে এলাকা গণনা করা হয়েছে।'
            : 'Area counts are based on reports with recognized district data.'}
        </p>
      )}

      <div
        id="explore-category-distribution"
        className="pt-2 border-t border-ui-stroke-subtle space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <h3 className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">
            {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী প্রতিবেদন' : 'Reports by category'}
          </h3>
          {onSelectCategory && (
            <span className="type-compact text-ui-content-muted">
              {language === 'bn' ? 'ক্যাটাগরি চাপলে ফিল্টার হবে' : 'Select a category to filter'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[176px_minmax(0,1fr)] gap-4 lg:gap-5 items-center">
          <div
            className="relative w-[152px] h-[152px] mx-auto"
            role="img"
            aria-label={
              language === 'bn'
                ? `মোট ${toBanglaDigits(totalReports)}টি প্রতিবেদনের ক্যাটাগরি ভাগ`
                : `Category share of ${totalReports} reports`
            }
          >
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle
                cx="60"
                cy="60"
                r="44"
                pathLength="100"
                fill="none"
                stroke="var(--ui-surface-subtle)"
                strokeWidth="18"
              />
              {(() => {
                let offset = 0;
                return categoryStats.map((item) => {
                  const segment = (
                    <circle
                      key={item.key}
                      cx="60"
                      cy="60"
                      r="44"
                      pathLength="100"
                      fill="none"
                      stroke={`var(--sec-${item.key}-primary)`}
                      strokeWidth="18"
                      strokeDasharray={`${item.chartPercentage} ${100 - item.chartPercentage}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += item.chartPercentage;
                  return segment;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="type-h2 font-[var(--font-weight-bold)] text-ui-content-primary leading-none">
                {language === 'bn' ? toBanglaDigits(totalReports) : totalReports}
              </span>
              <span className="type-compact text-ui-content-secondary mt-1">
                {language === 'bn' ? 'প্রতিবেদন' : 'reports'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            {categoryStats.map((item) => {
              const displayCount =
                language === 'bn' ? toBanglaDigits(item.count) : item.count;
              const displayPercent =
                language === 'bn' ? toBanglaDigits(item.percentage) : item.percentage;
              const isActive = activeCategory === item.key;

              const content = (
                <>
                  <div className="flex items-center justify-between type-compact gap-2">
                    <div className="flex items-center gap-2 font-[var(--font-weight-medium)] text-ui-content-primary min-w-0 flex-1">
                      <CategoryIcon section={item.key} size="xs" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="shrink-0 type-compact font-[var(--font-weight-medium)] text-ui-content-secondary ml-2">
                      <span className="font-[var(--font-weight-semibold)] text-ui-content-primary">{displayCount}</span>
                      <span className="text-ui-content-secondary ml-1">({displayPercent}%)</span>
                    </div>
                  </div>

                  <div
                    role="presentation"
                    aria-hidden="true"
                    className="w-full h-1.5 rounded-[var(--radius-pill)] bg-ui-surface-subtle overflow-hidden"
                  >
                    <div
                      className="h-full rounded-[var(--radius-pill)] transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: `var(--sec-${item.key}-primary)`,
                      }}
                    />
                  </div>
                </>
              );

              return onSelectCategory ? (
                <button
                  key={item.key}
                  id={`distribution-row-${item.key}`}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSelectCategory(item.key)}
                  className={`w-full text-left space-y-1 rounded-[var(--radius-badge-md)] px-2 py-1.5 -mx-2 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                    isActive ? 'bg-ui-surface-subtle' : 'hover:bg-ui-surface-subtle/70'
                  }`}
                >
                  {content}
                </button>
              ) : (
                <div key={item.key} id={`distribution-row-${item.key}`} className="space-y-1">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
