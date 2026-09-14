import React, { useState, useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { toBanglaDigits, formatRankNumber } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
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
  const { navigateTo } = useApp();
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

  // Recent reports for selected district
  const activeDistrictReports = useMemo(() => {
    if (selectedDistrict === 'all') {
      return reports.slice(0, 3);
    }
    return reports
      .filter(
        (r) =>
          (r.districtEn || '').toLowerCase() === selectedDistrict.toLowerCase() ||
          r.districtBn === selectedDistrict
      )
      .slice(0, 3);
  }, [reports, selectedDistrict]);

  const isDistrictSelected = selectedDistrict !== 'all' && currentDistrictInfo !== null;
  const mobileDisplayedDistricts = showAllDistricts ? rankedDistricts : rankedDistricts.slice(0, 5);

  const topDistrict = rankedDistricts.length > 0 ? rankedDistricts[0] : null;
  const isTopTie =
    rankedDistricts.length > 1 &&
    topDistrict !== null &&
    topDistrict.count > 0 &&
    topDistrict.count === rankedDistricts[1].count;

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
        : `All districts in ${divName} Division`;
    }
    return language === 'bn' ? 'সারাদেশ দেখুন' : 'All regions';
  }, [selectedDivision, language]);

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
        className={`w-full flex items-center justify-between p-2 md:p-2.5 rounded-xl text-left transition-all cursor-pointer border group min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
          isSelected
            ? 'bg-ui-accent-soft border-ui-accent/40 text-ui-content-primary ring-1 ring-ui-accent/30 font-medium shadow-2xs'
            : 'bg-ui-surface-subtle border-ui-stroke-subtle hover:border-ui-stroke-default text-ui-content-primary'
        }`}
      >
        <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
          <span
            className={`w-5.5 h-5.5 md:w-6 md:h-6 rounded-md flex items-center justify-center text-[11px] md:text-[12px] font-bold shrink-0 border ${
              isSelected
                ? 'bg-ui-accent text-white border-ui-accent'
                : index === 0
                ? 'bg-ui-accent-soft text-ui-accent border-ui-accent/30 font-extrabold'
                : index === 1
                ? 'bg-ui-surface-elevated text-ui-content-primary border-ui-stroke-default font-bold'
                : index === 2
                ? 'bg-ui-warning-bg text-ui-warning-text border-ui-warning-border font-bold'
                : 'bg-ui-surface text-ui-content-muted border-ui-stroke-subtle'
            }`}
          >
            {rankDisplay}
          </span>

          <div className="min-w-0">
            <span className="text-[13px] md:text-[14px] font-bold text-ui-content-primary group-hover:text-ui-content-primary transition-colors truncate block">
              {language === 'bn' ? item.nameBn : item.nameEn}
            </span>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] md:text-[12px] text-ui-content-muted mt-0.5">
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
          <span className="text-[13px] font-bold text-ui-content-primary font-mono">
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
      className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-3.5 sm:p-4 md:p-5 shadow-xs flex flex-col justify-between space-y-3 md:space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ui-stroke-subtle pb-2.5 md:pb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MapIcon name="map-pin" size="md" className="text-ui-content-primary shrink-0" />
          <h3 className="text-[16px] md:text-[17px] font-bold text-ui-content-primary tracking-tight truncate">
            {language === 'bn' ? 'এলাকার সারসংক্ষেপ' : 'Area summary'}
          </h3>
        </div>

        {selectedDistrict !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectDistrict('all')}
            className="text-[12px] font-semibold text-ui-content-secondary hover:text-ui-content-primary inline-flex items-center gap-1.5 cursor-pointer px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle hover:border-ui-stroke-default hover:bg-ui-surface-hover transition-colors min-h-[44px] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            aria-label={parentGeographyButtonLabel}
          >
            <span className="truncate max-w-[160px] sm:max-w-none">{parentGeographyButtonLabel}</span>
            <MapIcon name="close" size="xs" ariaHidden={true} />
          </button>
        )}
      </div>

      {/* Main Content: District Specific or Nationwide */}
      {isDistrictSelected && currentDistrictInfo ? (
        <div className="space-y-3 md:space-y-4 animate-in fade-in duration-200">
          {/* Selected District Card (Total Reports & Area info) */}
          <div className="bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl p-3 md:p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] md:text-[12px] text-ui-content-secondary">
              <span className="text-[10px] md:text-[11px] font-bold text-ui-content-muted uppercase tracking-wider">
                {language === 'bn' ? 'নির্বাচিত এলাকা' : 'Selected area'}
              </span>
              <span>
                {language === 'bn'
                  ? `${currentDistrictInfo.divisionBn} বিভাগ`
                  : `${currentDistrictInfo.divisionEn} Division`}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <h4 className="text-[16px] md:text-[18px] font-bold text-ui-content-primary leading-tight">
                {language === 'bn'
                  ? `${currentDistrictInfo.nameBn} জেলা`
                  : `${currentDistrictInfo.nameEn} District`}
              </h4>
              <div className="text-right">
                <span className="text-[10px] md:text-[11px] font-medium text-ui-content-muted block">
                  {language === 'bn' ? 'মোট প্রতিবেদন' : 'Total reports'}
                </span>
                <span className="text-[18px] md:text-[20px] font-bold text-ui-content-primary font-mono leading-none mt-0.5 block">
                  {language === 'bn'
                    ? toBanglaDigits(currentDistrictInfo.count)
                    : currentDistrictInfo.count}
                </span>
              </div>
            </div>
          </div>

          {/* Category Breakdown (By topic) */}
          <div className="space-y-1.5 md:space-y-2">
            <span className="text-[12px] md:text-[13px] font-bold text-ui-content-secondary">
              {language === 'bn' ? 'বিষয় অনুযায়ী' : 'By topic'}
            </span>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] md:text-[13.5px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CategoryIcon section={cat.key} size="xs" />
                    <span className="font-medium text-ui-content-primary truncate">
                      {cat.label}
                    </span>
                  </div>
                  <span className="font-bold text-ui-content-primary font-mono text-[13px] md:text-[14px] shrink-0 ml-2">
                    {language === 'bn' ? toBanglaDigits(cat.count) : cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* District Recent Activity Preview */}
          {activeDistrictReports.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-ui-stroke-subtle">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-bold text-ui-content-secondary">
                  {language === 'bn' ? 'সাম্প্রতিক প্রতিবেদন:' : 'Recent reports:'}
                </span>
              </div>

              <div className="space-y-2">
                {activeDistrictReports.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => navigateTo(`/report-detail/${r.id}`)}
                    className="w-full p-2.5 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle cursor-pointer transition-colors text-left group min-h-[44px] hover:bg-ui-surface-hover hover:border-ui-stroke-default focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus block"
                  >
                    <div className="text-[14px] font-bold text-ui-content-primary transition-colors line-clamp-1">
                      {language === 'bn' ? r.titleBn : r.titleEn}
                    </div>
                    <div className="text-[12px] text-ui-content-muted flex items-center justify-between mt-1">
                      <span className="truncate max-w-[180px]">{language === 'bn' ? r.locationBn : r.locationEn}</span>
                      <span className="text-ui-content-primary font-bold text-[12px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                        {language === 'bn' ? 'বিস্তারিত' : 'Details'} →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Explore by district (retained below summary when district is selected) */}
          <div className="text-[12px] md:text-[13px] font-bold text-ui-content-secondary pt-2 border-t border-ui-stroke-subtle">
            {language === 'bn' ? 'এলাকা অনুযায়ী দেখুন:' : 'Explore by district:'}
          </div>

          {/* District list */}
          {rankedDistricts.length > 0 ? (
            <>
              {/* Mobile District List (<768px): Top 5 by default, expandable to full, natural page flow */}
              <div className="space-y-1.5 max-h-none overflow-visible md:hidden">
                {mobileDisplayedDistricts.map(renderDistrictItem)}
              </div>

              {/* Desktop / Tablet District List (>=768px): Always full ranking, internal vertical scroll */}
              <div className="hidden md:block space-y-1.5 md:max-h-[260px] md:overflow-y-auto md:pr-1">
                {rankedDistricts.map(renderDistrictItem)}
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-[13px] text-ui-content-muted space-y-1">
              <MapIcon name="map-pin" size="lg" className="mx-auto text-ui-content-muted" />
              <p>{language === 'bn' ? 'কোনো জেলার তথ্য মেলেনি' : 'No district reports'}</p>
            </div>
          )}
        </div>
      ) : (
        /* Nationwide View: Top Active Districts and Overview */
        <div className="space-y-3 md:space-y-4">
          {/* Nationwide Summary Card (Total + Most Published Area / Top District with Tie Handling) */}
          <div className="bg-ui-surface-subtle border border-ui-stroke-subtle rounded-xl p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[12px] md:text-[13px] font-medium text-ui-content-secondary">
                {language === 'bn' ? 'মোট প্রতিবেদন' : 'Total reports'}
              </div>
              <div className="text-[24px] md:text-[28px] font-bold text-ui-content-primary font-mono leading-tight mt-0.5">
                {language === 'bn' ? toBanglaDigits(totalCount) : totalCount}
              </div>
            </div>

            {topDistrict && topDistrict.count > 0 && (
              <div className="sm:text-right pt-2.5 sm:pt-0 sm:pl-3 border-t sm:border-t-0 sm:border-l border-ui-stroke-subtle">
                <div className="text-[11px] md:text-[12px] font-medium text-ui-content-muted">
                  {isTopTie
                    ? language === 'bn'
                      ? 'শীর্ষ জেলা'
                      : 'Top districts'
                    : language === 'bn'
                    ? 'সর্বাধিক প্রকাশিত প্রতিবেদন'
                    : 'Most published reports'}
                </div>
                <div className="text-[13.5px] md:text-[14px] font-bold text-ui-content-primary mt-0.5">
                  {isTopTie ? (
                    <span>
                      {language === 'bn' ? 'একাধিক জেলা' : 'Multiple districts'} —{' '}
                      <span className="font-mono">
                        {language === 'bn' ? toBanglaDigits(topDistrict.count) : topDistrict.count}
                      </span>
                    </span>
                  ) : (
                    <span>
                      {language === 'bn' ? topDistrict.nameBn : topDistrict.nameEn} —{' '}
                      <span className="font-mono">
                        {language === 'bn' ? toBanglaDigits(topDistrict.count) : topDistrict.count}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category Breakdown (By topic) */}
          <div className="space-y-1.5 md:space-y-2">
            <span className="text-[12px] md:text-[13px] font-bold text-ui-content-secondary">
              {language === 'bn' ? 'বিষয় অনুযায়ী' : 'By topic'}
            </span>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] md:text-[13.5px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CategoryIcon section={cat.key} size="xs" />
                    <span className="font-medium text-ui-content-primary truncate">
                      {cat.label}
                    </span>
                  </div>
                  <span className="font-bold text-ui-content-primary font-mono text-[13px] md:text-[14px] shrink-0 ml-2">
                    {language === 'bn' ? toBanglaDigits(cat.count) : cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[12px] md:text-[13px] font-bold text-ui-content-secondary pt-1 border-t border-ui-stroke-subtle">
            {language === 'bn' ? 'এলাকা অনুযায়ী দেখুন:' : 'Explore by district:'}
          </div>

          {/* District list */}
          {rankedDistricts.length > 0 ? (
            <>
              {/* Mobile District List (<768px): Top 5 by default, expandable to full, natural page flow */}
              <div className="space-y-1.5 max-h-none overflow-visible md:hidden">
                {mobileDisplayedDistricts.map(renderDistrictItem)}
              </div>

              {/* Desktop / Tablet District List (>=768px): Always full ranking, internal vertical scroll */}
              <div className="hidden md:block space-y-1.5 md:max-h-[260px] md:overflow-y-auto md:pr-1">
                {rankedDistricts.map(renderDistrictItem)}
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-[13px] text-ui-content-muted space-y-1">
              <MapIcon name="map-pin" size="lg" className="mx-auto text-ui-content-muted" />
              <p>{language === 'bn' ? 'কোনো জেলার তথ্য মেলেনি' : 'No district reports'}</p>
            </div>
          )}
        </div>
      )}

      {/* Show All / Less Toggle for District List (Mobile only, <768px) */}
      {rankedDistricts.length > 5 && (
        <div className="pt-2 border-t border-ui-stroke-subtle md:hidden">
          <button
            type="button"
            aria-expanded={showAllDistricts}
            onClick={() => setShowAllDistricts(!showAllDistricts)}
            className="w-full py-2.5 px-3 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle text-[13px] font-bold text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-hover transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
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


