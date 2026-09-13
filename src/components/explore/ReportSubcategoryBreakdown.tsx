import React, { useState, useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { SUBCATEGORIES } from '../../data/categories';
import { SECTIONS, SectionKey } from '../../theme/tokens';
import { CategoryIcon } from '../branding/CategoryIcon';
import { toBanglaDigits } from '../../utils/formatters';

export interface ReportSubcategoryBreakdownProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
}

export interface SubcategoryStat {
  compositeKey: string;
  segment: SectionKey;
  subId: string;
  nameBn: string;
  nameEn: string;
  parentShortNameBn: string;
  parentShortNameEn: string;
  primaryColor: string;
  count: number;
  percentage: number;
}

export const ReportSubcategoryBreakdown: React.FC<ReportSubcategoryBreakdownProps> = ({
  reports,
  language,
}) => {
  const totalReports = reports.length;
  const [isExpanded, setIsExpanded] = useState(false);

  const { subcategoryStats, recognizedSubcategoryReportCount } = useMemo(() => {
    if (totalReports === 0) {
      return {
        subcategoryStats: [],
        recognizedSubcategoryReportCount: 0,
      };
    }

    const map = new Map<string, SubcategoryStat>();
    let recognizedCount = 0;

    reports.forEach((rep) => {
      const seg = rep.segment as SectionKey;
      const subId = rep.subcategoryId;

      if (!seg || !subId) return;
      if (subId === 'all') return;

      const sectionSubcategories = SUBCATEGORIES[seg];
      if (!sectionSubcategories) return;

      const foundSub = sectionSubcategories.find((s) => s.id === subId);
      if (!foundSub) return;

      recognizedCount += 1;
      const compositeKey = `${seg}::${subId}`;
      const sectionInfo = SECTIONS[seg];

      if (!map.has(compositeKey)) {
        map.set(compositeKey, {
          compositeKey,
          segment: seg,
          subId,
          nameBn: foundSub.nameBn,
          nameEn: foundSub.nameEn,
          parentShortNameBn: sectionInfo?.shortNameBn || seg,
          parentShortNameEn: sectionInfo?.shortNameEn || seg,
          primaryColor: SECTIONS[seg].primaryColor,
          count: 0,
          percentage: 0,
        });
      }

      const entry = map.get(compositeKey)!;
      entry.count += 1;
    });

    const list = Array.from(map.values()).map((stat) => ({
      ...stat,
      percentage: totalReports > 0 ? Math.round((stat.count / totalReports) * 100) : 0,
    }));

    list.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const nameA = language === 'bn' ? a.nameBn : a.nameEn;
      const nameB = language === 'bn' ? b.nameBn : b.nameEn;
      return nameA.localeCompare(nameB, language === 'bn' ? 'bn' : 'en');
    });

    return {
      subcategoryStats: list,
      recognizedSubcategoryReportCount: recognizedCount,
    };
  }, [reports, totalReports, language]);

  if (totalReports === 0) {
    return null;
  }

  const hasUnmapped =
    recognizedSubcategoryReportCount > 0 &&
    recognizedSubcategoryReportCount < totalReports;
  const noData = recognizedSubcategoryReportCount === 0;

  const visibleSubcategories = isExpanded
    ? subcategoryStats
    : subcategoryStats.slice(0, 6);

  return (
    <section
      id="explore-subcategory-breakdown"
      aria-label={
        language === 'bn' ? 'সাবক্যাটাগরি অনুযায়ী বিশ্লেষণ' : 'Subcategory breakdown'
      }
      className="space-y-4 mb-2"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
        <h2 className="text-[16px] sm:text-[18px] font-bold text-ui-content-primary">
          {language === 'bn' ? 'সাবক্যাটাগরি অনুযায়ী বিশ্লেষণ' : 'Subcategory breakdown'}
        </h2>
        <span className="text-[12px] sm:text-[13px] text-ui-content-muted font-normal">
          {language === 'bn' ? 'বর্তমান ফিল্টারের ভিত্তিতে' : 'Based on the current filters'}
        </span>
      </div>

      {noData ? (
        <div
          id="subcategory-no-data"
          className="ui-radius-card ui-border-default ui-elevation-card bg-ui-surface border-ui-stroke-subtle p-6 text-center text-[13px] sm:text-[14px] text-ui-content-muted"
        >
          {language === 'bn'
            ? 'বর্তমান প্রতিবেদনগুলোর জন্য নির্ভরযোগ্য সাবক্যাটাগরি তথ্য পাওয়া যায়নি।'
            : 'No recognized subcategory data is available for these reports.'}
        </div>
      ) : (
        <div
          id="subcategory-breakdown-card"
          className="ui-radius-card ui-border-default ui-elevation-card bg-ui-surface border-ui-stroke-subtle p-4 sm:p-5 space-y-4"
        >
          <div className="space-y-3.5">
            {visibleSubcategories.map((item) => {
              const displayName = language === 'bn' ? item.nameBn : item.nameEn;
              const parentName =
                language === 'bn' ? item.parentShortNameBn : item.parentShortNameEn;
              const displayCount =
                language === 'bn' ? toBanglaDigits(item.count) : item.count;
              const displayPercent =
                language === 'bn' ? toBanglaDigits(item.percentage) : item.percentage;

              return (
                <div
                  key={item.compositeKey}
                  id={`subcategory-row-${item.compositeKey}`}
                  className="space-y-1.5"
                >
                  <div className="flex items-baseline justify-between text-[13px] sm:text-[14px]">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="shrink-0">
                        <CategoryIcon section={item.segment} size="sm" />
                      </div>
                      <div className="flex items-baseline gap-1.5 min-w-0 truncate">
                        <span className="font-semibold text-ui-content-primary truncate">
                          {displayName}
                        </span>
                        <span className="text-[11.5px] sm:text-[12px] text-ui-content-muted truncate">
                          ({parentName})
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-[12.5px] sm:text-[13px] font-medium text-ui-content-secondary">
                      <span className="font-semibold text-ui-content-primary">
                        {displayCount}
                      </span>
                      <span className="text-ui-content-muted ml-1.5">
                        ({displayPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Proportional Bar using parent category semantic color */}
                  <div
                    role="presentation"
                    aria-hidden="true"
                    className="w-full h-2 rounded-full bg-ui-surface-subtle overflow-hidden"
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.primaryColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expand / Collapse Control when > 6 subcategories */}
          {subcategoryStats.length > 6 && (
            <div className="pt-2 border-t border-ui-stroke-subtle">
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded((prev) => !prev)}
                className="w-full text-center text-[13px] font-semibold text-ui-content-secondary hover:text-ui-content-primary transition-colors py-2 min-h-[44px] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-xl"
              >
                {isExpanded
                  ? language === 'bn'
                    ? 'কম দেখুন'
                    : 'Show less'
                  : language === 'bn'
                    ? 'সব সাবক্যাটাগরি দেখুন'
                    : 'Show all subcategories'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Coverage note if any reports lack recognized subcategory */}
      {hasUnmapped && (
        <p className="text-[11.5px] sm:text-[12px] text-ui-content-muted/90 pt-0.5">
          {language === 'bn'
            ? 'সাবক্যাটাগরি শনাক্ত করা গেছে এমন প্রতিবেদনগুলোর ভিত্তিতে এই বিশ্লেষণ দেখানো হয়েছে।'
            : 'Subcategory analysis includes reports with recognized subcategory data.'}
        </p>
      )}
    </section>
  );
};
