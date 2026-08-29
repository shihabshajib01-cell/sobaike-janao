import React, { useState, useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { BANGLADESH_DISTRICTS } from '../../data/districts';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { toBanglaDigits, formatRankNumber } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { CategoryIcon } from '../branding/CategoryIcon';
import { MapIcon } from './MapIcon';

interface DistrictRankingPanelProps {
  reports: ReportItem[];
  selectedDistrict: string;
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
}

export const DistrictRankingPanel: React.FC<DistrictRankingPanelProps> = ({
  reports,
  selectedDistrict,
  onSelectDistrict,
  language,
  selectedSection = 'all',
}) => {
  const { navigateTo } = useApp();
  const [showAllDistricts, setShowAllDistricts] = useState(false);

  // Compute district level aggregations
  const { rankedDistricts, currentDistrictInfo, totalCount, totalHarass, totalRickshaw, totalExtortion } = useMemo(() => {
    const map = new Map<string, RankedDistrict>();
    let harass = 0;
    let rickshaw = 0;
    let extortion = 0;

    reports.forEach((rep) => {
      if (selectedSection !== 'all' && rep.segment !== selectedSection) return;

      if (rep.segment === 'harassment') harass += 1;
      if (rep.segment === 'rickshaw') rickshaw += 1;
      if (rep.segment === 'extortion') extortion += 1;

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
        });
      }

      const entry = map.get(id)!;
      entry.count += 1;
      if (rep.segment === 'harassment') entry.harassmentCount += 1;
      if (rep.segment === 'rickshaw') entry.rickshawCount += 1;
      if (rep.segment === 'extortion') entry.extortionCount += 1;
    });

    const list = Array.from(map.values());
    list.sort((a, b) => b.count - a.count);

    // If a district is selected, find its summary
    let curDist: RankedDistrict | null = null;
    if (selectedDistrict !== 'all') {
      curDist =
        list.find(
          (d) =>
            d.nameEn.toLowerCase() === selectedDistrict.toLowerCase() ||
            d.nameBn === selectedDistrict ||
            d.id === selectedDistrict.toLowerCase()
        ) || null;
    }

    return {
      rankedDistricts: list,
      currentDistrictInfo: curDist,
      totalCount: reports.length,
      totalHarass: harass,
      totalRickshaw: rickshaw,
      totalExtortion: extortion,
    };
  }, [reports, selectedSection, selectedDistrict]);

  // Recent reports for selected district or nationwide
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
  const displayedDistricts = showAllDistricts ? rankedDistricts : rankedDistricts.slice(0, 5);

  return (
    <div
      id="area-summary-panel"
      className="bg-surface border border-subtle rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-subtle pb-3">
        <div className="flex items-center gap-2">
          <MapIcon name="map-pin" size="md" className="text-primary" />
          <h3 className="text-[17px] font-bold text-primary tracking-tight">
            {language === 'bn' ? 'এলাকার সারসংক্ষেপ' : 'Area Summary'}
          </h3>
        </div>

        {selectedDistrict !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectDistrict('all')}
            className="text-[12px] font-semibold text-secondary hover:text-primary flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg bg-surface-subtle border border-subtle hover:bg-surface transition-colors"
          >
            <span>{language === 'bn' ? 'সারাদেশ দেখুন' : 'All Regions'}</span>
            <MapIcon name="close" size="xs" />
          </button>
        )}
      </div>

      {/* Main Content: District Specific or Nationwide */}
      {isDistrictSelected ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Selected District Card */}
          <div className="bg-surface-subtle/70 border border-subtle rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                {language === 'bn' ? 'নির্বাচিত এলাকা' : 'Selected Area'}
              </span>
              <span className="text-[12px] font-medium text-secondary">
                {language === 'bn'
                  ? currentDistrictInfo.divisionBn
                  : currentDistrictInfo.divisionEn}{' '}
                {language === 'bn' ? 'বিভাগ' : 'Division'}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <h4 className="text-[18px] font-bold text-primary leading-tight">
                {language === 'bn'
                  ? `${currentDistrictInfo.nameBn} জেলা`
                  : `${currentDistrictInfo.nameEn} District`}
              </h4>
              <span className="text-[14px] font-bold text-primary font-mono">
                {language === 'bn'
                  ? `${toBanglaDigits(currentDistrictInfo.count)}টি রিপোর্ট`
                  : `${currentDistrictInfo.count} reports`}
              </span>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-2">
            <span className="text-[13px] font-bold text-secondary">
              {language === 'bn' ? 'সমস্যার ধরন অনুযায়ী:' : 'By Category:'}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Harassment */}
              <div className="bg-[var(--sec-harassment-bg)] border border-[var(--sec-harassment-border)]/50 p-2.5 rounded-xl flex flex-col items-center">
                <CategoryIcon section="harassment" size="sm" className="mb-1 text-[var(--sec-harassment-text)]" />
                <div className="text-[12px] font-semibold text-[var(--sec-harassment-text)]">
                  {language === 'bn' ? 'হয়রানি' : 'Harassment'}
                </div>
                <div className="text-[16px] font-bold text-[var(--sec-harassment-text)] font-mono mt-0.5">
                  {language === 'bn'
                    ? toBanglaDigits(currentDistrictInfo.harassmentCount)
                    : currentDistrictInfo.harassmentCount}
                </div>
              </div>

              {/* Charging */}
              <div className="bg-[var(--sec-rickshaw-bg)] border border-[var(--sec-rickshaw-border)]/50 p-2.5 rounded-xl flex flex-col items-center">
                <CategoryIcon section="rickshaw" size="sm" className="mb-1 text-[var(--sec-rickshaw-text)]" />
                <div className="text-[12px] font-semibold text-[var(--sec-rickshaw-text)]">
                  {language === 'bn' ? 'চার্জিং' : 'Charging'}
                </div>
                <div className="text-[16px] font-bold text-[var(--sec-rickshaw-text)] font-mono mt-0.5">
                  {language === 'bn'
                    ? toBanglaDigits(currentDistrictInfo.rickshawCount)
                    : currentDistrictInfo.rickshawCount}
                </div>
              </div>

              {/* Extortion */}
              <div className="bg-[var(--sec-extortion-bg)] border border-[var(--sec-extortion-border)]/50 p-2.5 rounded-xl flex flex-col items-center">
                <CategoryIcon section="extortion" size="sm" className="mb-1 text-[var(--sec-extortion-text)]" />
                <div className="text-[12px] font-semibold text-[var(--sec-extortion-text)]">
                  {language === 'bn' ? 'চাঁদাবাজি' : 'Extortion'}
                </div>
                <div className="text-[16px] font-bold text-[var(--sec-extortion-text)] font-mono mt-0.5">
                  {language === 'bn'
                    ? toBanglaDigits(currentDistrictInfo.extortionCount)
                    : currentDistrictInfo.extortionCount}
                </div>
              </div>
            </div>
          </div>

          {/* District Recent Activity Preview */}
          {activeDistrictReports.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-subtle">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-bold text-secondary">
                  {language === 'bn' ? 'এলাকার সাম্প্রতিক রিপোর্ট:' : 'Recent in this area:'}
                </span>
              </div>

              <div className="space-y-2">
                {activeDistrictReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => navigateTo(`/report-detail/${r.id}`)}
                    className="p-2.5 rounded-xl bg-surface-subtle/60 hover:bg-surface-subtle border border-subtle/80 hover:border-theme cursor-pointer transition-colors text-left group"
                  >
                    <div className="text-[14px] font-bold text-primary group-hover:text-primary transition-colors line-clamp-1">
                      {language === 'bn' ? r.titleBn : r.titleEn}
                    </div>
                    <div className="text-[12px] text-muted flex items-center justify-between mt-1">
                      <span className="truncate max-w-[180px]">{language === 'bn' ? r.locationBn : r.locationEn}</span>
                      <span className="text-primary font-bold text-[12px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                        {language === 'bn' ? 'বিস্তারিত' : 'Details'} →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Nationwide View: Top Active Districts and Overview */
        <div className="space-y-3">
          {/* Nationwide Category Totals */}
          <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-subtle">
            <div className="bg-surface-subtle p-2.5 rounded-xl border border-subtle flex flex-col items-center">
              <CategoryIcon section="harassment" size="xs" className="mb-0.5 text-secondary" />
              <div className="text-[12px] font-medium text-secondary">{language === 'bn' ? 'হয়রানি' : 'Harassment'}</div>
              <div className="text-[15px] font-bold text-primary font-mono mt-0.5">
                {language === 'bn' ? toBanglaDigits(totalHarass) : totalHarass}
              </div>
            </div>

            <div className="bg-surface-subtle p-2.5 rounded-xl border border-subtle flex flex-col items-center">
              <CategoryIcon section="rickshaw" size="xs" className="mb-0.5 text-secondary" />
              <div className="text-[12px] font-medium text-secondary">{language === 'bn' ? 'চার্জিং' : 'Charging'}</div>
              <div className="text-[15px] font-bold text-primary font-mono mt-0.5">
                {language === 'bn' ? toBanglaDigits(totalRickshaw) : totalRickshaw}
              </div>
            </div>

            <div className="bg-surface-subtle p-2.5 rounded-xl border border-subtle flex flex-col items-center">
              <CategoryIcon section="extortion" size="xs" className="mb-0.5 text-secondary" />
              <div className="text-[12px] font-medium text-secondary">{language === 'bn' ? 'চাঁদাবাজি' : 'Extortion'}</div>
              <div className="text-[15px] font-bold text-primary font-mono mt-0.5">
                {language === 'bn' ? toBanglaDigits(totalExtortion) : totalExtortion}
              </div>
            </div>
          </div>

          <div className="text-[13px] font-bold text-secondary">
            {language === 'bn' ? 'এলাকা অনুযায়ী দেখুন (ক্লিক করে জুম করুন):' : 'Explore by District (Click to Focus):'}
          </div>

          {/* District list */}
          {rankedDistricts.length > 0 ? (
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {displayedDistricts.map((item, index) => {
                const rankDisplay = formatRankNumber(index + 1, language);
                const countDisplay =
                  language === 'bn' ? toBanglaDigits(item.count) : item.count;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectDistrict(item.nameEn)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer border bg-surface-subtle/50 hover:bg-surface-subtle border-subtle/60 hover:border-theme group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-[12px] font-bold shrink-0 ${
                          index === 0
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold'
                            : index === 1
                            ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 font-bold'
                            : index === 2
                            ? 'bg-amber-700/15 text-amber-700 dark:text-amber-500'
                            : 'bg-surface text-muted'
                        }`}
                      >
                        {rankDisplay}
                      </span>

                      <div className="min-w-0">
                        <span className="text-[14px] font-bold text-primary group-hover:text-primary transition-colors truncate block">
                          {language === 'bn' ? item.nameBn : item.nameEn}
                        </span>
                        <div className="flex items-center gap-2 text-[12px] text-muted mt-0.5">
                          {item.harassmentCount > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <CategoryIcon section="harassment" size="xs" /> {item.harassmentCount}
                            </span>
                          )}
                          {item.rickshawCount > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <CategoryIcon section="rickshaw" size="xs" /> {item.rickshawCount}
                            </span>
                          )}
                          {item.extortionCount > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <CategoryIcon section="extortion" size="xs" /> {item.extortionCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[13px] font-bold text-primary font-mono">
                        {countDisplay}
                      </span>
                      <MapIcon name="arrow-right" size="sm" className="text-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-[13px] text-muted space-y-1">
              <MapIcon name="map-pin" size="lg" className="mx-auto text-muted" />
              <p>{language === 'bn' ? 'কোনো জেলার তথ্য মেলেনি' : 'No district reports'}</p>
            </div>
          )}
        </div>
      )}

      {/* Show All / Less Toggle for District List */}
      {!isDistrictSelected && rankedDistricts.length > 5 && (
        <div className="pt-2 border-t border-subtle">
          <button
            type="button"
            onClick={() => setShowAllDistricts(!showAllDistricts)}
            className="w-full py-2 px-3 rounded-xl bg-surface-subtle hover:bg-surface border border-subtle text-[13px] font-bold text-secondary hover:text-primary transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
          >
            <span>
              {showAllDistricts
                ? language === 'bn'
                  ? 'কম দেখুন'
                  : 'Show Less'
                : language === 'bn'
                ? `সকল জেলা (${toBanglaDigits(rankedDistricts.length)}টি)`
                : `All Districts (${rankedDistricts.length})`}
            </span>
            {showAllDistricts ? <MapIcon name="chevron-up" size="xs" /> : <MapIcon name="chevron-down" size="xs" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default DistrictRankingPanel;


