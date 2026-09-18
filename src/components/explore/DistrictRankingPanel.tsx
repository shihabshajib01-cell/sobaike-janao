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
  categoryCounts: Partial<Record<SectionKey, number>>;
}

const CATEGORY_KEYS = Object.keys(SECTIONS) as SectionKey[];

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

  const rankingSource = rankingReports || reports;

  const { rankedDistricts, currentDistrictInfo } = useMemo(() => {
    const map = new Map<string, RankedDistrict>();

    rankingSource.forEach((report) => {
      if (selectedSection !== 'all' && report.segment !== selectedSection) return;

      const districtEn = (report.districtEn || '').toLowerCase().trim();
      const districtBn = (report.districtBn || '').trim();
      if (!districtBn && !districtEn) return;

      const foundDistrict = BANGLADESH_DISTRICTS.find(
        (district) =>
          district.nameEn.toLowerCase() === districtEn ||
          district.nameBn === districtBn ||
          district.id === districtEn
      );

      const id = foundDistrict?.id || districtEn || districtBn;
      if (!id) return;

      if (!map.has(id)) {
        map.set(id, {
          id,
          nameBn: foundDistrict?.nameBn || districtBn,
          nameEn: foundDistrict?.nameEn || report.districtEn || districtBn,
          divisionBn: foundDistrict?.divisionBn || '',
          divisionEn: foundDistrict?.divisionEn || '',
          count: 0,
          categoryCounts: {},
        });
      }

      const entry = map.get(id)!;
      entry.count += 1;
      entry.categoryCounts[report.segment] =
        (entry.categoryCounts[report.segment] || 0) + 1;
    });

    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);

    let current: RankedDistrict | null = null;
    if (selectedDistrict !== 'all') {
      const canonical = BANGLADESH_DISTRICTS.find(
        (district) =>
          district.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
          district.nameBn === selectedDistrict ||
          district.id === selectedDistrict.toLowerCase()
      );

      current =
        list.find(
          (district) =>
            district.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
            district.nameBn === selectedDistrict ||
            district.id === selectedDistrict.toLowerCase()
        ) || null;

      if (!current && canonical) {
        current = {
          id: canonical.id,
          nameBn: canonical.nameBn,
          nameEn: canonical.nameEn,
          divisionBn: canonical.divisionBn,
          divisionEn: canonical.divisionEn,
          count: 0,
          categoryCounts: {},
        };
      }
    }

    return {
      rankedDistricts: list,
      currentDistrictInfo: current,
    };
  }, [rankingSource, selectedDistrict, selectedSection]);

  const isDistrictSelected =
    selectedDistrict !== 'all' && currentDistrictInfo !== null;

  const mobileDisplayedDistricts = showAllDistricts
    ? rankedDistricts
    : rankedDistricts.slice(0, 5);

  const geographyContext = useMemo(() => {
    if (isDistrictSelected && currentDistrictInfo) {
      return {
        primary:
          language === 'bn'
            ? `${currentDistrictInfo.nameBn} জেলা`
            : `${currentDistrictInfo.nameEn} District`,
        secondary:
          language === 'bn'
            ? `${currentDistrictInfo.divisionBn} বিভাগ`
            : `${currentDistrictInfo.divisionEn} Division`,
        isSpecific: true,
      };
    }

    if (selectedDivision && selectedDivision !== 'all') {
      const division = DIVISIONS.find(
        (item) =>
          item.nameEn.toLowerCase() === selectedDivision.toLowerCase() ||
          item.nameBn === selectedDivision ||
          item.id === selectedDivision.toLowerCase()
      );
      const divisionName = division
        ? language === 'bn'
          ? `${division.nameBn} বিভাগ`
          : `${division.nameEn} Division`
        : language === 'bn'
          ? `${selectedDivision} বিভাগ`
          : `${selectedDivision} Division`;

      return {
        primary: divisionName,
        secondary: language === 'bn' ? 'বাংলাদেশ' : 'Bangladesh',
        isSpecific: true,
      };
    }

    return {
      primary: language === 'bn' ? 'সারাদেশ' : 'Bangladesh',
      secondary: language === 'bn' ? 'সকল এলাকা' : 'All regions',
      isSpecific: false,
    };
  }, [
    currentDistrictInfo,
    isDistrictSelected,
    language,
    selectedDivision,
  ]);

  const parentGeographyButtonLabel = useMemo(() => {
    if (selectedDivision && selectedDivision !== 'all') {
      const division = DIVISIONS.find(
        (item) =>
          item.nameEn.toLowerCase() === selectedDivision.toLowerCase() ||
          item.nameBn === selectedDivision ||
          item.id === selectedDivision.toLowerCase()
      );
      const divisionName = division
        ? language === 'bn'
          ? division.nameBn
          : division.nameEn
        : selectedDivision;

      return language === 'bn'
        ? `${divisionName} বিভাগের সব জেলা`
        : `All in ${divisionName}`;
    }

    return language === 'bn' ? 'সারাদেশ দেখুন' : 'All regions';
  }, [language, selectedDivision]);

  const activeCategoryCounts = useMemo(() => {
    const counts = new Map<SectionKey, number>(
      CATEGORY_KEYS.map((key) => [key, 0])
    );
    reports.forEach((report) => {
      counts.set(report.segment, (counts.get(report.segment) || 0) + 1);
    });
    return counts;
  }, [reports]);

  const activeReportCount = reports.length;

  const categories = useMemo(
    () =>
      CATEGORY_KEYS.map((key) => ({
        key,
        label:
          language === 'bn'
            ? SECTIONS[key].shortNameBn
            : SECTIONS[key].shortNameEn,
        count: activeCategoryCounts.get(key) || 0,
      }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count),
    [activeCategoryCounts, language]
  );

  const mostReportedTopicAnalysis = useMemo(() => {
    if (activeReportCount === 0 || categories.length === 0) {
      return {
        status: 'empty' as const,
        topCategories: [],
        maxCount: 0,
        heading: language === 'bn' ? 'কোনো প্রতিবেদন নেই' : 'No published reports',
        label: '',
        countText: '',
        share: 0,
      };
    }

    const maxCount = categories[0].count;
    const topCategories = categories.filter((item) => item.count === maxCount);
    const share = Math.round((maxCount / activeReportCount) * 100);

    if (topCategories.length === 1) {
      return {
        status: 'single' as const,
        topCategories,
        maxCount,
        heading:
          language === 'bn'
            ? 'সর্বাধিক প্রতিবেদন পাওয়া বিষয়'
            : 'Most reported topic',
        label: topCategories[0].label,
        countText:
          language === 'bn' ? toBanglaDigits(maxCount) : String(maxCount),
        share,
      };
    }

    return {
      status: 'tie' as const,
      topCategories,
      maxCount,
      heading:
        language === 'bn'
          ? 'সর্বাধিক প্রতিবেদন পাওয়া বিষয়সমূহ'
          : 'Top reported topics',
      label: topCategories.map((item) => item.label).join(', '),
      countText:
        language === 'bn'
          ? `প্রতিটিতে ${toBanglaDigits(maxCount)}`
          : `${maxCount} each`,
      share,
    };
  }, [activeReportCount, categories, language]);

  const formatNumber = (value: number) =>
    language === 'bn' ? toBanglaDigits(value) : String(value);

  const formatPercentage = (value: number) =>
    language === 'bn' ? `${toBanglaDigits(value)}%` : `${value}%`;

  const renderDistrictItem = (item: RankedDistrict, index: number) => {
    const rankDisplay = formatRankNumber(index + 1, language);
    const isSelected =
      selectedDistrict.toLowerCase() === item.nameEn.toLowerCase() ||
      selectedDistrict.toLowerCase() === item.id.toLowerCase() ||
      selectedDistrict === item.nameBn;

    const share =
      rankingSource.length > 0
        ? Math.round((item.count / rankingSource.length) * 100)
        : 0;

    const topCategories = CATEGORY_KEYS.map((key) => ({
      key,
      count: item.categoryCounts[key] || 0,
    }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

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
        className={`w-full flex items-center justify-between p-2.5 md:p-3 rounded-[var(--radius-control)] text-left transition-all cursor-pointer border group min-h-[58px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
          isSelected
            ? 'bg-ui-accent-soft border-ui-accent/40 text-ui-content-primary ring-1 ring-ui-accent/30 font-[var(--font-weight-medium)] shadow-[var(--elevation-2xs)]'
            : 'bg-ui-surface dark:bg-ui-surface-elevated border-ui-stroke-subtle hover:border-ui-stroke-default hover:bg-ui-surface-hover text-ui-content-primary'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            className={`w-6 h-6 rounded-[var(--radius-badge-sm)] flex items-center justify-center type-compact font-[var(--font-weight-bold)] shrink-0 border mt-0.5 ${
              isSelected
                ? 'bg-ui-accent text-ui-content-inverse border-ui-accent'
                : index === 0
                  ? 'bg-ui-accent-soft text-ui-accent border-ui-accent/30'
                  : 'bg-ui-surface text-ui-content-muted border-ui-stroke-subtle'
            }`}
          >
            {rankDisplay}
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary truncate">
                {language === 'bn' ? item.nameBn : item.nameEn}
              </span>
              <span className="type-compact text-ui-content-muted shrink-0">
                {formatPercentage(share)}
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 type-compact text-ui-content-muted mt-0.5">
              {topCategories.map((category) => (
                <span
                  key={category.key}
                  className="inline-flex items-center gap-1"
                  title={
                    language === 'bn'
                      ? SECTIONS[category.key].shortNameBn
                      : SECTIONS[category.key].shortNameEn
                  }
                >
                  <CategoryIcon section={category.key} size="xs" />
                  <span className="tabular-nums">{formatNumber(category.count)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          <span className="type-compact font-[var(--font-weight-bold)] text-ui-content-primary tabular-nums">
            {formatNumber(item.count)}
          </span>
          <MapIcon
            name="arrow-right"
            size="sm"
            className="text-ui-content-muted transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </button>
    );
  };

  return (
    <section
      id="area-summary-panel"
      aria-label={language === 'bn' ? 'এলাকার সারসংক্ষেপ' : 'Area summary'}
      className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-3.5 sm:p-4 md:p-5 shadow-[var(--elevation-xs)] space-y-4"
    >
      <div className="flex items-start justify-between border-b border-ui-stroke-subtle pb-3 gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <MapIcon
              name="map-pin"
              size="sm"
              className="text-ui-content-primary shrink-0"
            />
            <h3 className="type-h4 font-[var(--font-weight-bold)] text-ui-content-primary tracking-tight truncate">
              {language === 'bn' ? 'এলাকার সারসংক্ষেপ' : 'Area summary'}
            </h3>
          </div>
          <div className="flex items-center gap-1 type-compact text-ui-content-secondary truncate pl-5">
            <span className="font-[var(--font-weight-semibold)] text-ui-content-primary">
              {geographyContext.primary}
            </span>
            {geographyContext.isSpecific && (
              <span className="text-ui-content-muted">
                • {geographyContext.secondary}
              </span>
            )}
          </div>
        </div>

        {selectedDistrict !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectDistrict('all')}
            className="type-compact font-[var(--font-weight-semibold)] text-ui-content-secondary hover:text-ui-content-primary inline-flex items-center gap-1.5 cursor-pointer px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-[var(--radius-control)] bg-ui-surface dark:bg-ui-surface-elevated border border-ui-stroke-subtle hover:border-ui-stroke-default hover:bg-ui-surface-hover transition-colors min-h-[44px] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            aria-label={parentGeographyButtonLabel}
          >
            <span className="truncate max-w-[140px] sm:max-w-none">
              {parentGeographyButtonLabel}
            </span>
            <MapIcon name="close" size="xs" ariaHidden={true} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="bg-ui-surface dark:bg-ui-surface-elevated border border-ui-stroke-subtle rounded-[var(--radius-control)] p-3.5">
          <span className="type-compact font-[var(--font-weight-medium)] text-ui-content-muted block">
            {language === 'bn'
              ? 'বর্তমান নির্বাচনে প্রতিবেদন'
              : 'Reports in current selection'}
          </span>
          <span className="type-h1 font-[var(--font-weight-bold)] text-ui-content-primary tabular-nums leading-tight mt-1 block">
            {formatNumber(activeReportCount)}
          </span>
          <p className="type-compact text-ui-content-secondary mt-1">
            {language === 'bn'
              ? 'উপরের ফিল্টার ও মানচিত্র নির্বাচনের ভিত্তিতে'
              : 'Based on the active filters and map selection'}
          </p>
        </div>

        <div className="bg-ui-surface dark:bg-ui-surface-elevated border border-ui-stroke-subtle rounded-[var(--radius-control)] p-3.5">
          <span className="type-compact font-[var(--font-weight-medium)] text-ui-content-muted block">
            {mostReportedTopicAnalysis.heading}
          </span>

          {mostReportedTopicAnalysis.status !== 'empty' ? (
            <>
              <div className="flex items-start gap-1.5 mt-1.5 min-w-0">
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  {mostReportedTopicAnalysis.topCategories
                    .slice(0, 3)
                    .map((category) => (
                      <CategoryIcon
                        key={category.key}
                        section={category.key}
                        size="xs"
                      />
                    ))}
                </div>
                <span className="type-h4 font-[var(--font-weight-bold)] text-ui-content-primary break-words leading-snug">
                  {mostReportedTopicAnalysis.label}
                </span>
              </div>
              <p className="type-compact text-ui-content-secondary mt-1">
                {mostReportedTopicAnalysis.countText} ·{' '}
                {formatPercentage(mostReportedTopicAnalysis.share)}
              </p>
            </>
          ) : (
            <p className="type-compact text-ui-content-secondary mt-1.5">
              {language === 'bn'
                ? 'এই নির্বাচনে বিষয়ভিত্তিক তথ্য নেই'
                : 'No topic data in this selection'}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between type-compact">
          <span className="font-[var(--font-weight-bold)] text-ui-content-secondary">
            {language === 'bn' ? 'বিষয় অনুযায়ী বণ্টন' : 'Topic distribution'}
          </span>
          <span className="text-ui-content-muted">
            {language === 'bn'
              ? `${toBanglaDigits(categories.length)}টি বিষয়`
              : `${categories.length} topics`}
          </span>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categories.map((category) => {
              const share =
                activeReportCount > 0
                  ? Math.round((category.count / activeReportCount) * 100)
                  : 0;

              return (
                <div
                  key={category.key}
                  className="px-3 py-2.5 rounded-[var(--radius-control)] bg-ui-surface dark:bg-ui-surface-elevated border border-ui-stroke-subtle type-compact min-w-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIcon section={category.key} size="xs" />
                      <span className="font-[var(--font-weight-semibold)] text-ui-content-primary truncate">
                        {category.label}
                      </span>
                    </div>
                    <span className="font-[var(--font-weight-bold)] text-ui-content-primary tabular-nums shrink-0">
                      {formatNumber(category.count)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <progress
                      value={category.count}
                      max={Math.max(activeReportCount, 1)}
                      className="h-1.5 flex-1 min-w-0 appearance-none overflow-hidden rounded-[var(--radius-pill)] [&::-webkit-progress-bar]:bg-ui-stroke-subtle [&::-webkit-progress-value]:bg-ui-accent [&::-moz-progress-bar]:bg-ui-accent"
                      aria-label={
                        language === 'bn'
                          ? `${category.label}: ${formatPercentage(share)}`
                          : `${category.label}: ${share}%`
                      }
                    />
                    <span className="text-ui-content-muted tabular-nums shrink-0">
                      {formatPercentage(share)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center type-compact text-ui-content-muted">
            {language === 'bn'
              ? 'বিষয়ভিত্তিক তথ্য পাওয়া যায়নি'
              : 'No topic distribution available'}
          </div>
        )}
      </div>

      <div className="space-y-2.5 pt-1 border-t border-ui-stroke-subtle">
        <div className="flex items-end justify-between gap-3 type-compact">
          <div>
            <span className="font-[var(--font-weight-bold)] text-ui-content-secondary block">
              {language === 'bn' ? 'জেলা তুলনা' : 'District comparison'}
            </span>
            <span className="text-ui-content-muted block mt-0.5">
              {language === 'bn'
                ? 'প্রতিবেদন সংখ্যার ভিত্তিতে র‍্যাঙ্ক'
                : 'Ranked by published report volume'}
            </span>
          </div>
          {rankedDistricts.length > 0 && (
            <span className="text-ui-content-muted font-[var(--font-weight-medium)] shrink-0">
              {language === 'bn'
                ? `${toBanglaDigits(rankedDistricts.length)}টি জেলা`
                : `${rankedDistricts.length} districts`}
            </span>
          )}
        </div>

        {rankedDistricts.length > 0 ? (
          <>
            <div className="space-y-1.5 max-h-none overflow-visible md:hidden">
              {mobileDisplayedDistricts.map(renderDistrictItem)}
            </div>

            <div className="hidden md:grid md:grid-cols-2 gap-2 md:max-h-[300px] md:overflow-y-auto md:pr-1">
              {rankedDistricts.map(renderDistrictItem)}
            </div>
          </>
        ) : (
          <div className="py-4 text-center type-compact text-ui-content-muted space-y-1">
            <MapIcon
              name="map-pin"
              size="lg"
              className="mx-auto text-ui-content-muted"
            />
            <p>
              {language === 'bn'
                ? 'কোনো জেলার তথ্য মেলেনি'
                : 'No district reports'}
            </p>
          </div>
        )}
      </div>

      {rankedDistricts.length > 5 && (
        <div className="pt-2 border-t border-ui-stroke-subtle md:hidden">
          <button
            type="button"
            aria-expanded={showAllDistricts}
            onClick={() => setShowAllDistricts(!showAllDistricts)}
            className="w-full py-2.5 px-3 rounded-[var(--radius-control)] bg-ui-surface dark:bg-ui-surface-elevated border border-ui-stroke-subtle type-compact font-[var(--font-weight-bold)] text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-hover transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            <span>
              {showAllDistricts
                ? language === 'bn'
                  ? 'কম দেখুন'
                  : 'Show less'
                : language === 'bn'
                  ? 'সব জেলা দেখুন'
                  : 'Show all districts'}
            </span>
            <MapIcon
              name={showAllDistricts ? 'chevron-up' : 'chevron-down'}
              size="xs"
              ariaHidden={true}
            />
          </button>
        </div>
      )}
    </section>
  );
};

export default DistrictRankingPanel;
