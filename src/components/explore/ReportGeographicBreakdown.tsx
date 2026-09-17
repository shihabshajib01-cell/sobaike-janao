import React, { useState, useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { BANGLADESH_DISTRICTS } from '../../data/districts';
import { toBanglaDigits } from '../../utils/formatters';

export interface ReportGeographicBreakdownProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
}

export interface DistrictStat {
  id: string;
  nameBn: string;
  nameEn: string;
  divisionBn: string;
  divisionEn: string;
  count: number;
  percentage: number;
}

export interface DivisionStat {
  id: string;
  nameBn: string;
  nameEn: string;
  count: number;
  percentage: number;
}

export const ReportGeographicBreakdown: React.FC<ReportGeographicBreakdownProps> = ({
  reports,
  language,
}) => {
  const totalReports = reports.length;
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    districtStats,
    divisionStats,
    recognizedGeoReportCount,
  } = useMemo(() => {
    if (totalReports === 0) {
      return {
        districtStats: [],
        divisionStats: [],
        recognizedGeoReportCount: 0,
      };
    }

    const matchedDistrictsMap = new Map<
      string,
      {
        id: string;
        nameBn: string;
        nameEn: string;
        divisionBn: string;
        divisionEn: string;
        count: number;
      }
    >();

    const matchedDivisionsMap = new Map<
      string,
      {
        id: string;
        nameBn: string;
        nameEn: string;
        count: number;
      }
    >();

    let geoCount = 0;

    reports.forEach((rep) => {
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
        geoCount += 1;

        // District aggregation
        const existingDist = matchedDistrictsMap.get(foundDistrict.id);
        if (existingDist) {
          existingDist.count += 1;
        } else {
          matchedDistrictsMap.set(foundDistrict.id, {
            id: foundDistrict.id,
            nameBn: foundDistrict.nameBn,
            nameEn: foundDistrict.nameEn,
            divisionBn: foundDistrict.divisionBn,
            divisionEn: foundDistrict.divisionEn,
            count: 1,
          });
        }

        // Division aggregation
        const existingDiv = matchedDivisionsMap.get(foundDistrict.divisionId);
        if (existingDiv) {
          existingDiv.count += 1;
        } else {
          matchedDivisionsMap.set(foundDistrict.divisionId, {
            id: foundDistrict.divisionId,
            nameBn: foundDistrict.divisionBn,
            nameEn: foundDistrict.divisionEn,
            count: 1,
          });
        }
      }
    });

    const districts: DistrictStat[] = Array.from(matchedDistrictsMap.values())
      .map((d) => ({
        ...d,
        percentage: totalReports > 0 ? Math.round((d.count / totalReports) * 100) : 0,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        const nameA = language === 'bn' ? a.nameBn : a.nameEn;
        const nameB = language === 'bn' ? b.nameBn : b.nameEn;
        return nameA.localeCompare(nameB);
      });

    const divisions: DivisionStat[] = Array.from(matchedDivisionsMap.values())
      .map((d) => ({
        ...d,
        percentage: totalReports > 0 ? Math.round((d.count / totalReports) * 100) : 0,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        const nameA = language === 'bn' ? a.nameBn : a.nameEn;
        const nameB = language === 'bn' ? b.nameBn : b.nameEn;
        return nameA.localeCompare(nameB);
      });

    return {
      districtStats: districts,
      divisionStats: divisions,
      recognizedGeoReportCount: geoCount,
    };
  }, [reports, totalReports, language]);

  if (totalReports === 0) {
    return null;
  }

  const hasUnmappedGeos =
    recognizedGeoReportCount > 0 && recognizedGeoReportCount < totalReports;
  const noGeoData = recognizedGeoReportCount === 0;

  const visibleDistricts = isExpanded
    ? districtStats
    : districtStats.slice(0, 5);

  return (
    <section
      id="explore-geographic-breakdown"
      aria-label={language === 'bn' ? 'এলাকা অনুযায়ী বিশ্লেষণ' : 'Geographic breakdown'}
      className="space-y-4 mb-2"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
        <h2 className="text-[var(--type-fixed-16)] sm:text-[var(--type-fixed-18)] font-[var(--font-weight-bold)] text-ui-content-primary">
          {language === 'bn' ? 'এলাকা অনুযায়ী বিশ্লেষণ' : 'Geographic breakdown'}
        </h2>
        <span className="text-[var(--type-fixed-12)] sm:text-[var(--type-fixed-13)] text-ui-content-muted font-[var(--font-weight-regular)]">
          {language === 'bn' ? 'বর্তমান ফিল্টারের ভিত্তিতে' : 'Based on the current filters'}
        </span>
      </div>

      {noGeoData ? (
        /* Neutral empty state for when no reports in current filter have valid district data */
        <div
          id="geographic-no-data"
          className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-control)] p-6 text-center text-[var(--type-fixed-13)] sm:text-[var(--type-fixed-14)] text-ui-content-secondary shadow-[var(--elevation-2xs)]"
        >
          {language === 'bn'
            ? 'বর্তমান প্রতিবেদনে নির্ভরযোগ্য জেলা তথ্য নেই।'
            : 'No recognized district data is available for these reports.'}
        </div>
      ) : (
        /* Two-column layout on desktop (>=1024px), vertical stack on mobile/tablet */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Section A: Reports by District */}
          <div
            id="geographic-breakdown-districts"
            className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-control)] p-3.5 sm:p-4 space-y-3 flex flex-col justify-between shadow-[var(--elevation-2xs)]"
          >
            <div className="space-y-3">
              <h3 className="text-[var(--type-fixed-135)] sm:text-[var(--type-fixed-14)] font-[var(--font-weight-bold)] text-ui-content-primary">
                {language === 'bn' ? 'জেলা অনুযায়ী প্রতিবেদন' : 'Reports by district'}
              </h3>

              <div className="space-y-2.5">
                {visibleDistricts.map((item) => {
                  const displayDistrictName =
                    language === 'bn' ? item.nameBn : item.nameEn;
                  const displayDivisionName =
                    language === 'bn'
                      ? `${item.divisionBn} বিভাগ`
                      : `${item.divisionEn} Division`;
                  const displayCount =
                    language === 'bn' ? toBanglaDigits(item.count) : item.count;
                  const displayPercent =
                    language === 'bn'
                      ? toBanglaDigits(item.percentage)
                      : item.percentage;

                  return (
                    <div
                      key={item.id}
                      id={`district-row-${item.id}`}
                      className="space-y-1"
                    >
                      <div className="flex items-baseline justify-between text-[var(--type-fixed-125)] sm:text-[var(--type-fixed-13)]">
                        <div className="flex items-baseline gap-1.5 min-w-0 pr-2">
                          <span className="font-[var(--font-weight-semibold)] text-ui-content-primary truncate">
                            {displayDistrictName}
                          </span>
                          <span className="text-[var(--type-fixed-11)] sm:text-[var(--type-fixed-115)] text-ui-content-secondary truncate">
                            ({displayDivisionName})
                          </span>
                        </div>
                        <div className="shrink-0 text-[var(--type-fixed-12)] sm:text-[var(--type-fixed-125)] font-[var(--font-weight-medium)] text-ui-content-secondary">
                          <span className="font-[var(--font-weight-semibold)] text-ui-content-primary">
                            {displayCount}
                          </span>
                          <span className="text-ui-content-secondary ml-1">
                            ({displayPercent}%)
                          </span>
                        </div>
                      </div>

                      {/* Proportional Bar */}
                      <div
                        role="presentation"
                        aria-hidden="true"
                        className="w-full h-1.5 rounded-[var(--radius-pill)] bg-ui-surface-subtle overflow-hidden"
                      >
                        <div
                          className="h-full rounded-[var(--radius-pill)] bg-ui-accent transition-all duration-300"
                          style={{
                            width: `${item.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expand / Collapse Control when > 5 districts */}
            {districtStats.length > 5 && (
              <div className="pt-2 border-t border-ui-stroke-subtle">
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="w-full text-center text-[var(--type-fixed-125)] sm:text-[var(--type-fixed-13)] font-[var(--font-weight-semibold)] text-ui-content-secondary hover:text-ui-content-primary transition-colors py-2 min-h-[44px] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-[var(--radius-badge-md)]"
                >
                  {isExpanded
                    ? language === 'bn'
                      ? 'কম দেখুন'
                      : 'Show less'
                    : language === 'bn'
                      ? 'সব জেলা দেখুন'
                      : 'Show all districts'}
                </button>
              </div>
            )}
          </div>

          {/* Section B: Reports by Division */}
          <div
            id="geographic-breakdown-divisions"
            className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-control)] p-3.5 sm:p-4 space-y-3 shadow-[var(--elevation-2xs)]"
          >
            <h3 className="text-[var(--type-fixed-135)] sm:text-[var(--type-fixed-14)] font-[var(--font-weight-bold)] text-ui-content-primary">
              {language === 'bn' ? 'বিভাগ অনুযায়ী প্রতিবেদন' : 'Reports by division'}
            </h3>

            <div className="space-y-2.5">
              {divisionStats.map((item) => {
                const displayDivisionName =
                  language === 'bn'
                    ? `${item.nameBn} বিভাগ`
                    : `${item.nameEn} Division`;
                const displayCount =
                  language === 'bn' ? toBanglaDigits(item.count) : item.count;
                const displayPercent =
                  language === 'bn'
                    ? toBanglaDigits(item.percentage)
                    : item.percentage;

                return (
                  <div
                    key={item.id}
                    id={`division-row-${item.id}`}
                    className="space-y-1"
                  >
                    <div className="flex items-baseline justify-between text-[var(--type-fixed-125)] sm:text-[var(--type-fixed-13)]">
                      <div className="font-[var(--font-weight-semibold)] text-ui-content-primary min-w-0 pr-2 truncate">
                        {displayDivisionName}
                      </div>
                      <div className="shrink-0 text-[var(--type-fixed-12)] sm:text-[var(--type-fixed-125)] font-[var(--font-weight-medium)] text-ui-content-secondary">
                        <span className="font-[var(--font-weight-semibold)] text-ui-content-primary">
                          {displayCount}
                        </span>
                        <span className="text-ui-content-secondary ml-1">
                          ({displayPercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Proportional Bar */}
                    <div
                      role="presentation"
                      aria-hidden="true"
                      className="w-full h-1.5 rounded-[var(--radius-pill)] bg-ui-surface-subtle overflow-hidden"
                    >
                      <div
                        className="h-full rounded-[var(--radius-pill)] bg-ui-accent transition-all duration-300"
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Coverage note if any reports lack recognized district */}
      {hasUnmappedGeos && (
        <p className="text-[var(--type-fixed-11)] sm:text-[var(--type-fixed-115)] text-ui-content-secondary pt-0.5">
          {language === 'bn'
            ? 'জেলা শনাক্ত করা গেছে এমন প্রতিবেদনগুলোর ভিত্তিতে ভৌগোলিক বিশ্লেষণ দেখানো হয়েছে।'
            : 'Geographic analysis includes reports with recognized district data.'}
        </p>
      )}
    </section>
  );
};
