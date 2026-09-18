import React, { useState, useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { BANGLADESH_DISTRICTS } from '../../data/districts';
import { toBanglaDigits } from '../../utils/formatters';

export interface ReportGeographicBreakdownProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
  activeDivision?: string;
  activeDistrict?: string;
  onSelectDivision?: (division: string) => void;
  onSelectDistrict?: (district: string) => void;
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
  activeDivision = 'all',
  activeDistrict = 'all',
  onSelectDivision,
  onSelectDistrict,
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
  const maxDivisionCount = Math.max(1, ...divisionStats.map((item) => item.count));

  return (
    <section
      id="explore-geographic-breakdown"
      aria-label={language === 'bn' ? 'এলাকা অনুযায়ী বিশ্লেষণ' : 'Geographic breakdown'}
      className="space-y-4 mb-2"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
        <h2 className="type-h3 font-[var(--font-weight-bold)] text-ui-content-primary">
          {language === 'bn' ? 'এলাকা অনুযায়ী বিশ্লেষণ' : 'Geographic breakdown'}
        </h2>
        <span className="type-compact text-ui-content-muted font-[var(--font-weight-regular)]">
          {language === 'bn' ? 'বর্তমান ফিল্টারের ভিত্তিতে' : 'Based on the current filters'}
        </span>
      </div>

      {noGeoData ? (
        /* Neutral empty state for when no reports in current filter have valid district data */
        <div
          id="geographic-no-data"
          className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-control)] p-6 text-center type-compact text-ui-content-secondary shadow-[var(--elevation-2xs)]"
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
              <h3 className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">
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
                    <button
                      key={item.id}
                      id={`district-row-${item.id}`}
                      type="button"
                      onClick={onSelectDistrict ? () => onSelectDistrict(item.nameEn) : undefined}
                      aria-pressed={activeDistrict.toLowerCase() === item.nameEn.toLowerCase()}
                      className={`w-full min-h-[44px] text-left space-y-1 rounded-[var(--radius-badge-md)] px-2 py-1.5 -mx-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                        onSelectDistrict ? 'cursor-pointer hover:bg-ui-surface-subtle/70' : ''
                      } ${
                        activeDistrict.toLowerCase() === item.nameEn.toLowerCase()
                          ? 'bg-ui-surface-subtle'
                          : ''
                      }`}
                    >
                      <div className="flex items-baseline justify-between type-compact">
                        <div className="flex items-baseline gap-1.5 min-w-0 pr-2">
                          <span className="font-[var(--font-weight-semibold)] text-ui-content-primary truncate">
                            {displayDistrictName}
                          </span>
                          <span className="type-compact text-ui-content-secondary truncate">
                            ({displayDivisionName})
                          </span>
                        </div>
                        <div className="shrink-0 type-compact font-[var(--font-weight-medium)] text-ui-content-secondary">
                          <span className="font-[var(--font-weight-semibold)] text-ui-content-primary">
                            {displayCount}
                          </span>
                          <span className="text-ui-content-secondary ml-1">
                            ({displayPercent}%)
                          </span>
                        </div>
                      </div>

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
                    </button>
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
                  className="w-full text-center type-compact font-[var(--font-weight-semibold)] text-ui-content-secondary hover:text-ui-content-primary transition-colors py-2 min-h-[44px] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-[var(--radius-badge-md)]"
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
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary">
                {language === 'bn' ? 'বিভাগ অনুযায়ী প্রতিবেদন' : 'Reports by division'}
              </h3>
              {onSelectDivision && (
                <span className="type-compact text-ui-content-muted">
                  {language === 'bn' ? 'বার চাপলে ফিল্টার হবে' : 'Select a bar to filter'}
                </span>
              )}
            </div>

            <div
              role="region"
              aria-label={language === 'bn' ? 'বিভাগ অনুযায়ী কলাম চার্ট' : 'Division column chart'}
              className="overflow-x-auto pb-1"
            >
              <div className="min-w-max flex items-end gap-2">
                {divisionStats.map((item) => {
                  const displayDivisionName =
                    language === 'bn' ? item.nameBn : item.nameEn;
                  const displayCount =
                    language === 'bn' ? toBanglaDigits(item.count) : item.count;
                  const height = Math.max(8, Math.round((item.count / maxDivisionCount) * 100));
                  const isActive =
                    activeDivision.toLowerCase() === item.nameEn.toLowerCase();

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={onSelectDivision ? () => onSelectDivision(item.nameEn) : undefined}
                      aria-pressed={isActive}
                      aria-label={
                        language === 'bn'
                          ? `${displayDivisionName} বিভাগ: ${displayCount}টি প্রতিবেদন`
                          : `${displayDivisionName} Division: ${displayCount} reports`
                      }
                      className={`w-14 sm:w-16 shrink-0 min-h-[44px] rounded-[var(--radius-badge-md)] px-1.5 py-2 flex flex-col items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                        onSelectDivision ? 'cursor-pointer hover:bg-ui-surface-subtle/70' : ''
                      } ${isActive ? 'bg-ui-surface-subtle' : ''}`}
                    >
                      <span className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary tabular-nums">
                        {displayCount}
                      </span>
                      <span
                        aria-hidden="true"
                        className="w-7 h-24 rounded-[var(--radius-badge-sm)] bg-ui-surface-subtle border border-ui-stroke-subtle flex items-end overflow-hidden"
                      >
                        <span
                          className="w-full bg-ui-accent rounded-t-[var(--radius-compact)] transition-all duration-300"
                          style={{ height: `${height}%` }}
                        />
                      </span>
                      <span className="type-compact text-ui-content-secondary leading-tight text-center line-clamp-2">
                        {displayDivisionName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coverage note if any reports lack recognized district */}
      {hasUnmappedGeos && (
        <p className="type-compact text-ui-content-secondary pt-0.5">
          {language === 'bn'
            ? 'জেলা শনাক্ত করা গেছে এমন প্রতিবেদনগুলোর ভিত্তিতে ভৌগোলিক বিশ্লেষণ দেখানো হয়েছে।'
            : 'Geographic analysis includes reports with recognized district data.'}
        </p>
      )}
    </section>
  );
};
