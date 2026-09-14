import React, { useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { BANGLADESH_DISTRICTS } from '../../data/districts';
import { toBanglaDigits } from '../../utils/formatters';
import { CategoryIcon } from '../branding/CategoryIcon';

export interface ReportAnalyticsOverviewProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
}

const CANONICAL_CATEGORIES: SectionKey[] = [
  'harassment',
  'rickshaw',
  'extortion',
  'load_shedding',
];

export const ReportAnalyticsOverview: React.FC<ReportAnalyticsOverviewProps> = ({
  reports,
  language,
}) => {
  const totalReports = reports.length;

  const {
    districtCount,
    divisionCount,
    geoMappedReportCount,
    mostReportedLabel,
    categoryStats,
  } = useMemo(() => {
    if (totalReports === 0) {
      return {
        districtCount: 0,
        divisionCount: 0,
        geoMappedReportCount: 0,
        mostReportedLabel: '-',
        categoryStats: [],
      };
    }

    const matchedDistricts = new Set<string>();
    const matchedDivisions = new Set<string>();
    let geoMappedCount = 0;

    const counts: Record<SectionKey, number> = {
      harassment: 0,
      rickshaw: 0,
      extortion: 0,
      load_shedding: 0,
    };

    reports.forEach((rep) => {
      // Category count
      if (rep.segment in counts) {
        counts[rep.segment as SectionKey] += 1;
      }

      // District & Division mapping
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

    // Most reported category calculation with tie handling
    const categoryEntries = CANONICAL_CATEGORIES.map((key) => ({
      key,
      count: counts[key],
    }));

    const maxCount = Math.max(...categoryEntries.map((e) => e.count));
    let topLabel = '-';

    if (maxCount > 0) {
      const topItems = categoryEntries.filter((e) => e.count === maxCount);
      if (topItems.length > 1) {
        topLabel = language === 'bn' ? 'একাধিক' : 'Multiple';
      } else {
        const topKey = topItems[0].key;
        topLabel =
          language === 'bn'
            ? SECTIONS[topKey].shortNameBn
            : SECTIONS[topKey].shortNameEn;
      }
    }

    // Category distribution stats
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
      };
    });

    return {
      districtCount: matchedDistricts.size,
      divisionCount: matchedDivisions.size,
      geoMappedReportCount: geoMappedCount,
      mostReportedLabel: topLabel,
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
      className="space-y-4 mb-2"
    >
      {/* 1. Header & 4 KPI Cards */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
          <h2 className="text-[16px] sm:text-[18px] font-bold text-ui-content-primary">
            {language === 'bn' ? 'প্রতিবেদন সারসংক্ষেপ' : 'Report summary'}
          </h2>
          <span className="text-[12px] sm:text-[13px] text-ui-content-muted font-normal">
            {language === 'bn' ? 'বর্তমান ফিল্টারের ভিত্তিতে' : 'Based on the current filters'}
          </span>
        </div>

        {/* 4 Summary Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Total Reports */}
          <div
            id="metric-total-reports"
            className="ui-radius-card ui-border-default ui-elevation-card bg-ui-surface border-ui-stroke-subtle p-3.5 sm:p-4 flex flex-col justify-between min-h-[82px] sm:min-h-[92px]"
          >
            <span className="text-[12px] sm:text-[13px] font-medium text-ui-content-muted">
              {language === 'bn' ? 'মোট প্রতিবেদন' : 'Total reports'}
            </span>
            <span className="text-[22px] sm:text-[24px] font-bold text-ui-content-primary leading-tight">
              {language === 'bn' ? toBanglaDigits(totalReports) : totalReports}
            </span>
          </div>

          {/* Districts with reports */}
          <div
            id="metric-affected-districts"
            className="ui-radius-card ui-border-default ui-elevation-card bg-ui-surface border-ui-stroke-subtle p-3.5 sm:p-4 flex flex-col justify-between min-h-[82px] sm:min-h-[92px]"
          >
            <span className="text-[12px] sm:text-[13px] font-medium text-ui-content-muted">
              {language === 'bn' ? 'প্রতিবেদন থাকা জেলা' : 'Districts with reports'}
            </span>
            <span className="text-[22px] sm:text-[24px] font-bold text-ui-content-primary leading-tight">
              {language === 'bn' ? toBanglaDigits(districtCount) : districtCount}
            </span>
          </div>

          {/* Divisions with reports */}
          <div
            id="metric-affected-divisions"
            className="ui-radius-card ui-border-default ui-elevation-card bg-ui-surface border-ui-stroke-subtle p-3.5 sm:p-4 flex flex-col justify-between min-h-[82px] sm:min-h-[92px]"
          >
            <span className="text-[12px] sm:text-[13px] font-medium text-ui-content-muted">
              {language === 'bn' ? 'প্রতিবেদন থাকা বিভাগ' : 'Divisions with reports'}
            </span>
            <span className="text-[22px] sm:text-[24px] font-bold text-ui-content-primary leading-tight">
              {language === 'bn' ? toBanglaDigits(divisionCount) : divisionCount}
            </span>
          </div>

          {/* Most Reported Category */}
          <div
            id="metric-most-reported"
            className="ui-radius-card ui-border-default ui-elevation-card bg-ui-surface border-ui-stroke-subtle p-3.5 sm:p-4 flex flex-col justify-between min-h-[82px] sm:min-h-[92px]"
          >
            <span className="text-[12px] sm:text-[13px] font-medium text-ui-content-muted">
              {language === 'bn' ? 'সর্বাধিক প্রতিবেদন' : 'Most reported'}
            </span>
            <span className="text-[17px] sm:text-[19px] font-bold text-ui-content-primary leading-tight truncate">
              {mostReportedLabel}
            </span>
          </div>
        </div>

        {/* Geographic note if any reports lack recognized district */}
        {hasUnmappedGeos && (
          <p className="text-[11.5px] sm:text-[12px] text-ui-content-muted/90 pt-0.5">
            {language === 'bn'
              ? 'জেলা তথ্য থাকা প্রতিবেদনগুলোর ভিত্তিতে এলাকা গণনা করা হয়েছে।'
              : 'Area counts are based on reports with recognized district data.'}
          </p>
        )}
      </div>

      {/* 2. Category Distribution Card */}
      <div
        id="explore-category-distribution"
        className="ui-radius-card ui-border-default ui-elevation-card bg-ui-surface border-ui-stroke-subtle p-4 sm:p-5 space-y-3.5"
      >
        <h3 className="text-[14px] sm:text-[15px] font-bold text-ui-content-primary">
          {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী প্রতিবেদন' : 'Reports by category'}
        </h3>

        <div className="space-y-3">
          {categoryStats.map((item) => {
            const displayCount =
              language === 'bn' ? toBanglaDigits(item.count) : item.count;
            const displayPercent =
              language === 'bn' ? toBanglaDigits(item.percentage) : item.percentage;

            return (
              <div
                key={item.key}
                id={`distribution-row-${item.key}`}
                className="space-y-1.5"
              >
                {/* Row Header: Icon + Category Name + Count & Percentage */}
                <div className="flex items-center justify-between text-[13px] sm:text-[14px]">
                  <div className="flex items-center gap-2 font-medium text-ui-content-primary min-w-0">
                    <CategoryIcon section={item.key} size="xs" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="shrink-0 text-[12.5px] sm:text-[13px] font-medium text-ui-content-secondary ml-2">
                    <span className="font-semibold text-ui-content-primary">{displayCount}</span>
                    <span className="text-ui-content-muted ml-1.5">({displayPercent}%)</span>
                  </div>
                </div>

                {/* Proportional Bar */}
                <div
                  role="presentation"
                  aria-hidden="true"
                  className="w-full h-2 rounded-full bg-ui-surface-subtle overflow-hidden"
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: `var(--sec-${item.key}-primary)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
