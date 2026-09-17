import React, { useState, useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { toBanglaDigits, formatRankNumber } from '../../utils/formatters';
import { CategoryIcon } from '../branding/CategoryIcon';
import { MapIcon } from './MapIcon';

interface DistrictRankingPanelProps {
  reports: ReportItem[];
  rankingReports?: ReportItem[];
  selectedDistrict: string;
  selectedDivision?: string;
  onSelectDistrict: (district: string) => void;
  language: 'bn' | 'en';
  selectedSection?: SectionKey | 'all';
}

interface RankedDistrict {
  id: string;
  nameBn: string;
  nameEn: string;
  divisionBn: string;
  divisionEn: string;
  count: number;
  harassmentCount: number;
  rickshawCount: number;
  extortionCount: number;
  loadSheddingCount: number;
}

export const DistrictRankingPanel: React.FC<DistrictRankingPanelProps> = ({
  reports,
  rankingReports,
  selectedDistrict,
  selectedDivision = 'all',
  onSelectDistrict,
  language,
  selectedSection = 'all',
}) => {
  const [showAllDistricts, setShowAllDistricts] = useState(false);

  // Compute district level aggregations from rankingReports (or fallback to reports)
  const rankingSource = rankingReports || reports;

  const {
    rankedDistricts,
    currentDistrictInfo,
    totalCount,
    totalHarass,
    totalRickshaw,
    totalExtortion,
    totalLoadShedding,
  } = useMemo(() => {
    const map = new Map<string, RankedDistrict>();
    let harass = 0;
    let rickshaw = 0;
    let extortion = 0;
    let loadShedding = 0;

    rankingSource.forEach((rep) => {
      if (selectedSection !== 'all' && rep.segment !== selectedSection) return;

      if (rep.segment === 'harassment') harass += 1;
      if (rep.segment === 'rickshaw') rickshaw += 1;
      if (rep.segment === 'extortion') extortion += 1;
      if (rep.segment === 'load_shedding') loadShedding += 1;

      const dEn = rep.districtEn || '';
      const dBn = rep.districtBn || '';
      if (!dBn && !dEn) return;

      const distKey = dEn.toLowerCase().trim() || dBn;
      const foundDistrict = BANGLADESH_DISTRICTS.find(
        (d) =>
          d.nameEn.toLowerCase() === distKey ||
          d.nameBn === dBn ||
          d.id === distKey
      );

      const id = foundDistrict?.id || distKey;
      const nameBn = foundDistrict?.nameBn || dBn;
      const nameEn = foundDistrict?.nameEn || dEn;
      const divisionBn = foundDistrict?.divisionBn || '';
      const divisionEn = foundDistrict?.divisionEn || '';

      if (!map.has(id)) {
        map.set(id, {
          id,
          nameBn,
          nameEn,
          divisionBn,
          divisionEn,
          count: 0,
          harassmentCount: 0,
          rickshawCount: 0,
          extortionCount: 0,
          loadSheddingCount: 0,
        });
      }

      const entry = map.get(id)!;
      entry.count += 1;
      if (rep.segment === 'harassment') entry.harassmentCount += 1;
      if (rep.segment === 'rickshaw') entry.rickshawCount += 1;
      if (rep.segment === 'extortion') entry.extortionCount += 1;
      if (rep.segment === 'load_shedding') entry.loadSheddingCount += 1;
    });

    const list = Array.from(map.values());
    list.sort((a, b) => b.count - a.count);

    // If a district is selected, find or compute its summary
    let curDist: RankedDistrict | null = null;
    if (selectedDistrict !== 'all') {
      const canonical = BANGLADESH_DISTRICTS.find(
        (d) =>
          d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
          d.nameBn === selectedDistrict ||
          d.id === selectedDistrict.toLowerCase()
      );
      const foundInRanking = list.find(
        (d) =>
          d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
          d.nameBn === selectedDistrict ||
          d.id === selectedDistrict.toLowerCase()
      );

      if (foundInRanking) {
        curDist = foundInRanking;
      } else if (canonical) {
        curDist = {
          id: canonical.id,
          nameBn: canonical.nameBn,
          nameEn: canonical.nameEn,
          divisionBn: canonical.divisionBn,
          divisionEn: canonical.divisionEn,
          count: 0,
          harassmentCount: 0,
          rickshawCount: 0,
          extortionCount: 0,
          loadSheddingCount: 0,
        };
      }
    }

    return {
      rankedDistricts: list,
      currentDistrictInfo: curDist,
      totalCount: rankingSource.length,
      totalHarass: harass,
      totalRickshaw: rickshaw,
      totalExtortion: extortion,
      totalLoadShedding: loadShedding,
    };
  }, [rankingSource, selectedSection, selectedDistrict]);

  const isDistrictSelected = selectedDistrict !== 'all' && currentDistrictInfo !== null;
  const mobileDisplayedDistricts = showAllDistricts ? rankedDistricts : rankedDistricts.slice(0, 5);

  // Active geography context computation
  const geographyContext = useMemo(() => {
    if (isDistrictSelected && currentDistrictInfo) {
      const distName = language === 'bn' ? `${currentDistrictInfo.nameBn} জেলা` : `${currentDistrictInfo.nameEn} District`;
      const divName = language === 'bn' ? `${currentDistrictInfo.divisionBn} বিভাগ` : `${currentDistrictInfo.divisionEn} Division`;
      return {
        primary: distName,
        secondary: divName,
        isSpecific: true,
      };
    }

    if (selectedDivision && selectedDivision !== 'all') {
      const divObj = DIVISIONS.find(
        (d) =>
          d.nameEn.toLowerCase() === selectedDivision.toLowerCase() ||
          d.nameBn === selectedDivision ||
          d.id === selectedDivision.toLowerCase()
      );
      const divName = divObj
        ? language === 'bn'
          ? `${divObj.nameBn} বিভাগ`
          : `${divObj.nameEn} Division`
        : `${selectedDivision} Division`;
      return {
        primary: divName,
        secondary: language === 'bn' ? 'বাংলাদেশ' : 'Bangladesh',
        isSpecific: true,
      };
    }

    return {
      primary: language === 'bn' ? 'সারাদেশ' : 'Bangladesh',
      secondary: language === 'bn' ? 'সকল এলাকা' : 'All regions',
      isSpecific: false,
    };
  }, [isDistrictSelected, currentDistrictInfo, selectedDivision, language]);

  // Truthful parent geography reset button label
  const parentGeographyButtonLabel = useMemo(() => {
    if (selectedDivision && selectedDivision !== 'all') {
      const divObj = DIVISIONS.find(
        (d) =>
          d.nameEn.toLowerCase() === selectedDivision.toLowerCase() ||
          d.nameBn === selectedDivision ||
          d.id === selectedDivision.toLowerCase()
      );
      const divName = divObj
        ? language === 'bn'
          ? divObj.nameBn
          : divObj.nameEn
        : selectedDivision;
      return language === 'bn'
        ? `${divName} বিভাগের সব জেলা`
        : `All in ${divName}`;
    }
    return language === 'bn' ? 'সারাদেশ দেখুন' : 'All regions';
  }, [selectedDivision, language]);

  // Topic counts for active area
  const categories = useMemo(
    () => [
      {
        key: 'harassment' as const,
        label:
          language === 'bn'
            ? SECTIONS.harassment.shortNameBn
            : SECTIONS.harassment.shortNameEn,
        count: isDistrictSelected
          ? currentDistrictInfo?.harassmentCount ?? 0
          : totalHarass,
      },
      {
        key: 'rickshaw' as const,
        label:
          language === 'bn'
            ? SECTIONS.rickshaw.shortNameBn
            : SECTIONS.rickshaw.shortNameEn,
        count: isDistrictSelected
          ? currentDistrictInfo?.rickshawCount ?? 0
          : totalRickshaw,
      },
      {
        key: 'extortion' as const,
        label:
          language === 'bn'
            ? SECTIONS.extortion.shortNameBn
            : SECTIONS.extortion.shortNameEn,
        count: isDistrictSelected
          ? currentDistrictInfo?.extortionCount ?? 0
          : totalExtortion,
      },
      {
        key: 'load_shedding' as const,
        label:
          language === 'bn'
            ? SECTIONS.load_shedding.shortNameBn
            : SECTIONS.load_shedding.shortNameEn,
        count: isDistrictSelected
          ? currentDistrictInfo?.loadSheddingCount ?? 0
          : totalLoadShedding,
      },
    ],
    [
      language,
      isDistrictSelected,
      currentDistrictInfo,
      totalHarass,
      totalRickshaw,
      totalExtortion,
      totalLoadShedding,
    ]
  );

  // Active area total report count
  const activeReportCount = isDistrictSelected
    ? (currentDistrictInfo?.count ?? 0)
    : (selectedDivision !== 'all' ? reports.length : totalCount);

  // Most reported topic analysis with neutral tie handling
  const mostReportedTopicAnalysis = useMemo(() => {
    if (activeReportCount === 0) {
      return {
        status: 'empty' as const,
        topCategories: [],
        maxCount: 0,
        heading: language === 'bn' ? 'কোনো প্রতিবেদন নেই' : 'No published reports',
        label: '',
        countText: '',
      };
    }

    const maxCount = Math.max(...categories.map((c) => c.count));
    if (maxCount === 0) {
      return {
        status: 'empty' as const,
        topCategories: [],
        maxCount: 0,
        heading: language === 'bn' ? 'কোনো প্রতিবেদন নেই' : 'No published reports',
        label: '',
        countText: '',
      };
    }

    const topCats = categories.filter((c) => c.count === maxCount);

    if (topCats.length === 1) {
      const isSingleReport = activeReportCount === 1;
      return {
        status: 'single' as const,
        topCategories: topCats,
        maxCount,
        heading: isSingleReport
          ? (language === 'bn' ? 'প্রতিবেদন পাওয়া বিষয়' : 'Reported topic')
          : (language === 'bn' ? 'সর্বাধিক প্রতিবেদন পাওয়া বিষয়' : 'Most reported topic'),
        label: topCats[0].label,
        countText: language === 'bn' ? toBanglaDigits(maxCount) : String(maxCount),
      };
    }

    // Multiple categories tied for highest count
    const countDisplay = language === 'bn' ? toBanglaDigits(maxCount) : String(maxCount);
    const countText = language === 'bn' ? `প্রতিটিতে ${countDisplay}` : `${countDisplay} each`;

    return {
      status: 'tie' as const,
      topCategories: topCats,
      maxCount,
      heading: language === 'bn' ? 'সর্বাধিক প্রতিবেদন পাওয়া বিষয়সমূহ' : 'Top reported topics',
      label: topCats.map((c) => c.label).join(', '),
      countText,
    };
  }, [categories, activeReportCount, language]);

  const renderDistrictItem = (item: RankedDistrict, index: number) => {
    const rankDisplay = formatRankNumber(index + 1, language);
    const countDisplay =
      language === 'bn' ? toBanglaDigits(item.count) : item.count;
    const isSelected =
      selectedDistrict.toLowerCase() === item.nameEn.toLowerCase() ||
      selectedDistrict.toLowerCase() === item.id.toLowerCase() ||
      selectedDistrict === item.nameBn;

    const accessibleLabel =
      language === 'bn'
        ? `${item.nameBn} জেলার প্রতিবেদন দেখুন${isSelected ? ' (নির্বাচিত)' : ''}`
        : `View reports for ${item.nameEn}${isSelected ? ' (Selected)' : ''}`;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectDistrict(item.nameEn)}
        aria-label={accessibleLabel}
        aria-current={isSelected ? 'true' : undefined}
        className={`w-full flex items-center justify-between p-2 md:p-2.5 rounded-[var(--radius-control)] text-left transition-all cursor-pointer border group min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
          isSelected
            ? 'bg-ui-accent-soft border-ui-accent/40 text-ui-content-primary ring-1 ring-ui-accent/30 font-[var(--font-weight-medium)] shadow-[var(--elevation-2xs)]'
            : 'bg-ui-surface-subtle border-ui-stroke-subtle hover:border-ui-stroke-default text-ui-content-primary'
        }`}
      >
        <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
          <span
            className={`w-5.5 h-5.5 md:w-6 md:h-6 rounded-[var(--radius-badge-sm)] flex items-center justify-center text-[var(--type-fixed-11)] md:text-[var(--type-fixed-12)] font-[var(--font-weight-bold)] shrink-0 border ${
              isSelected
                ? 'bg-ui-accent text-ui-content-inverse border-ui-accent'
                : index === 0
                ? 'bg-ui-accent-soft text-ui-accent border-ui-accent/30 font-extrabold'
                : index === 1
                ? 'bg-ui-surface-elevated text-ui-content-primary border-ui-stroke-default font-[var(--font-weight-bold)]'
                : index === 2
                ? 'bg-ui-warning-bg text-ui-warning-text border-ui-warning-border font-[var(--font-weight-bold)]'
                : 'bg-ui-surface text-ui-content-muted border-ui-stroke-subtle'
            }`}
          >
            {rankDisplay}
          </span>

          <div className="min-w-0">
            <span className="text-[var(--type-fixed-13)] md:text-[var(--type-fixed-14)] font-[var(--font-weight-bold)] text-ui-content-primary group-hover:text-ui-content-primary transition-colors truncate block">
              {language === 'bn' ? item.nameBn : item.nameEn}
            </span>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[var(--type-fixed-11)] md:text-[var(--type-fixed-12)] text-ui-content-muted mt-0.5">
              {item.harassmentCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <CategoryIcon section="harassment" size="xs" />{' '}
                  {language === 'bn' ? toBanglaDigits(item.harassmentCount) : item.harassmentCount}
                </span>
              )}
              {item.rickshawCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <CategoryIcon section="rickshaw" size="xs" />{' '}
                  {language === 'bn' ? toBanglaDigits(item.rickshawCount) : item.rickshawCount}
                </span>
              )}
              {item.extortionCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <CategoryIcon section="extortion" size="xs" />{' '}
                  {language === 'bn' ? toBanglaDigits(item.extortionCount) : item.extortionCount}
                </span>
              )}
              {item.loadSheddingCount > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <CategoryIcon section="load_shedding" size="xs" />{' '}
                  {language === 'bn' ? toBanglaDigits(item.loadSheddingCount) : item.loadSheddingCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[var(--type-fixed-13)] font-[var(--font-weight-bold)] text-ui-content-primary tabular-nums">
            {countDisplay}
          </span>
          <MapIcon name="arrow-right" size="sm" className="text-ui-content-muted transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>
    );
  };

  return (
    <div
      id="area-summary-panel"
      className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-3.5 sm:p-4 md:p-5 shadow-[var(--elevation-xs)] flex flex-col justify-between space-y-3.5 md:space-y-4"
    >
      {/* 1. Header & Geography Context */}
      <div className="flex items-start justify-between border-b border-ui-stroke-subtle pb-2.5 md:pb-3 gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <MapIcon name="map-pin" size="sm" className="text-ui-content-primary shrink-0" />
            <h3 className="text-[var(--type-fixed-15)] md:text-[var(--type-fixed-16)] font-[var(--font-weight-bold)] text-ui-content-primary tracking-tight truncate">
              {language === 'bn' ? 'এলাকার সারসংক্ষেপ' : 'Area summary'}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[var(--type-fixed-12)] text-ui-content-secondary truncate pl-5">
            <span className="font-[var(--font-weight-semibold)] text-ui-content-primary">{geographyContext.primary}</span>
            {geographyContext.isSpecific && (
              <span className="text-ui-content-muted">• {geographyContext.secondary}</span>
            )}
          </div>
        </div>

        {selectedDistrict !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectDistrict('all')}
            className="text-[var(--type-fixed-12)] font-[var(--font-weight-semibold)] text-ui-content-secondary hover:text-ui-content-primary inline-flex items-center gap-1.5 cursor-pointer px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-[var(--radius-control)] bg-ui-surface-subtle border border-ui-stroke-subtle hover:border-ui-stroke-default hover:bg-ui-surface-hover transition-colors min-h-[44px] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            aria-label={parentGeographyButtonLabel}
          >
            <span className="truncate max-w-[140px] sm:max-w-none">{parentGeographyButtonLabel}</span>
            <MapIcon name="close" size="xs" ariaHidden={true} />
          </button>
        )}
      </div>

      {/* 2. Total Published Reports & 3. Most Reported Topic */}
      <div className="bg-ui-surface-subtle border border-ui-stroke-subtle rounded-[var(--radius-control)] p-3 md:p-3.5 space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-3">
        <div className="shrink-0">
          <span className="text-[var(--type-fixed-11)] md:text-[var(--type-fixed-12)] font-[var(--font-weight-medium)] text-ui-content-muted block">
            {language === 'bn' ? 'মোট প্রকাশিত প্রতিবেদন' : 'Total published reports'}
          </span>
          <span className="text-[var(--type-fixed-22)] md:text-[var(--type-fixed-26)] font-[var(--font-weight-bold)] text-ui-content-primary tabular-nums leading-tight mt-0.5 block">
            {language === 'bn' ? toBanglaDigits(activeReportCount) : activeReportCount}
          </span>
        </div>

        {mostReportedTopicAnalysis.status !== 'empty' && (
          <div className="sm:text-right min-w-0 sm:max-w-[65%]">
            <span className="text-[var(--type-fixed-11)] md:text-[var(--type-fixed-12)] font-[var(--font-weight-medium)] text-ui-content-muted block">
              {mostReportedTopicAnalysis.heading}
            </span>
            <div className="flex items-start sm:justify-end gap-1.5 mt-1 flex-wrap">
              {mostReportedTopicAnalysis.status === 'single' && mostReportedTopicAnalysis.topCategories[0] && (
                <span className="shrink-0 mt-0.5">
                  <CategoryIcon section={mostReportedTopicAnalysis.topCategories[0].key} size="xs" />
                </span>
              )}
              {mostReportedTopicAnalysis.status === 'tie' && (
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  {mostReportedTopicAnalysis.topCategories.map((tc) => (
                    <CategoryIcon key={tc.key} section={tc.key} size="xs" />
                  ))}
                </div>
              )}
              <div className="text-[var(--type-fixed-13)] md:text-[var(--type-fixed-14)] font-[var(--font-weight-bold)] text-ui-content-primary break-words whitespace-normal leading-snug">
                <span>{mostReportedTopicAnalysis.label}</span>
                {mostReportedTopicAnalysis.status === 'tie' && (
                  <span className="tabular-nums ml-1.5 font-[var(--font-weight-regular)] text-ui-content-muted text-[var(--type-fixed-12)] whitespace-nowrap">
                    ({mostReportedTopicAnalysis.countText})
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Topic Distribution */}
      <div className="space-y-1.5 md:space-y-2">
        <div className="flex items-center justify-between text-[var(--type-fixed-12)] md:text-[var(--type-fixed-13)] font-[var(--font-weight-bold)] text-ui-content-secondary">
          <span>{language === 'bn' ? 'বিষয় অনুযায়ী প্রতিবেদন' : 'Reports by topic'}</span>
          <span className="text-[var(--type-fixed-11)] font-[var(--font-weight-regular)] text-ui-content-muted">
            {language === 'bn' ? '৪টি বিষয়' : '4 categories'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-2">
          {categories.map((cat) => (
            <div
              key={cat.key}
              className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-control)] bg-ui-surface-subtle border border-ui-stroke-subtle text-[var(--type-fixed-13)] md:text-[var(--type-fixed-135)]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CategoryIcon section={cat.key} size="xs" />
                <span className="font-[var(--font-weight-medium)] text-ui-content-primary truncate">
                  {cat.label}
                </span>
              </div>
              <span className="font-[var(--font-weight-bold)] text-ui-content-primary tabular-nums text-[var(--type-fixed-13)] md:text-[var(--type-fixed-14)] shrink-0 ml-2">
                {language === 'bn' ? toBanglaDigits(cat.count) : cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Explore by District / District Ranking */}
      <div className="space-y-2 pt-1 border-t border-ui-stroke-subtle">
        <div className="flex items-center justify-between text-[var(--type-fixed-12)] md:text-[var(--type-fixed-13)]">
          <span className="font-[var(--font-weight-bold)] text-ui-content-secondary">
            {language === 'bn' ? 'জেলা অনুযায়ী প্রতিবেদন' : 'Reports by district'}
          </span>
          {rankedDistricts.length > 0 && (
            <span className="text-[var(--type-fixed-11)] text-ui-content-muted font-[var(--font-weight-medium)]">
              {language === 'bn'
                ? `${toBanglaDigits(rankedDistricts.length)}টি জেলা`
                : `${rankedDistricts.length} districts`}
            </span>
          )}
        </div>

        {rankedDistricts.length > 0 ? (
          <>
            {/* Mobile District List (<768px): Top 5 by default, expandable to full */}
            <div className="space-y-1.5 max-h-none overflow-visible md:hidden">
              {mobileDisplayedDistricts.map(renderDistrictItem)}
            </div>

            {/* Desktop / Tablet District List (>=768px): Always full ranking, internal vertical scroll */}
            <div className="hidden md:grid md:grid-cols-2 gap-1.5 md:max-h-[260px] md:overflow-y-auto md:pr-1">
              {rankedDistricts.map(renderDistrictItem)}
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-[var(--type-fixed-13)] text-ui-content-muted space-y-1">
            <MapIcon name="map-pin" size="lg" className="mx-auto text-ui-content-muted" />
            <p>{language === 'bn' ? 'কোনো জেলার তথ্য মেলেনি' : 'No district reports'}</p>
          </div>
        )}
      </div>

      {/* Show All / Less Toggle for District List (Mobile only, <768px) */}
      {rankedDistricts.length > 5 && (
        <div className="pt-2 border-t border-ui-stroke-subtle md:hidden">
          <button
            type="button"
            aria-expanded={showAllDistricts}
            onClick={() => setShowAllDistricts(!showAllDistricts)}
            className="w-full py-2.5 px-3 rounded-[var(--radius-control)] bg-ui-surface-subtle border border-ui-stroke-subtle text-[var(--type-fixed-13)] font-[var(--font-weight-bold)] text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-hover transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            <span>
              {showAllDistricts
                ? (language === 'bn' ? 'কম দেখুন' : 'Show less')
                : (language === 'bn' ? 'সব জেলা দেখুন' : 'Show all districts')}
            </span>
            {showAllDistricts ? (
              <MapIcon name="chevron-up" size="xs" ariaHidden={true} />
            ) : (
              <MapIcon name="chevron-down" size="xs" ariaHidden={true} />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DistrictRankingPanel;



