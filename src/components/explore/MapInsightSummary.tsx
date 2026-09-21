import React, { useMemo } from 'react';
import { ReportItem } from '../../types/report';
import { BANGLADESH_DISTRICTS } from '../../data/districts';
import { SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';
import { toBanglaDigits } from '../../utils/formatters';
import { CategoryIcon } from '../branding/CategoryIcon';
import { MapIcon } from './MapIcon';

interface MapInsightSummaryProps {
  reports: ReportItem[];
  language: 'bn' | 'en';
}


const hasValidCoordinates = (report: ReportItem) => {
  const lat = Number(report.coordinates?.lat);
  const lng = Number(report.coordinates?.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 20 &&
    lat <= 27.5 &&
    lng >= 88 &&
    lng <= 93
  );
};

export const MapInsightSummary: React.FC<MapInsightSummaryProps> = ({
  reports,
  language,
}) => {
  const { segments } = useTaxonomy();
  const categoryKeys = useMemo(
    () => Object.keys(segments) as SectionKey[],
    [segments]
  );

  const summary = useMemo(() => {
    const preciseCount = reports.filter(hasValidCoordinates).length;
    const districtCounts = new Map<
      string,
      { nameBn: string; nameEn: string; count: number }
    >();
    let districtResolvedCount = 0;

    const categoryCounts = new Map<SectionKey, number>(
      categoryKeys.map((key) => [key, 0])
    );

    reports.forEach((report) => {
      categoryCounts.set(
        report.segment,
        (categoryCounts.get(report.segment) || 0) + 1
      );

      const districtEn = (report.districtEn || '').trim().toLowerCase();
      const districtBn = (report.districtBn || '').trim();
      const district = BANGLADESH_DISTRICTS.find(
        (item) =>
          item.nameEn.toLowerCase() === districtEn ||
          item.nameBn === districtBn ||
          item.id === districtEn
      );

      if (!district) return;
      districtResolvedCount += 1;

      const current = districtCounts.get(district.id) || {
        nameBn: district.nameBn,
        nameEn: district.nameEn,
        count: 0,
      };
      current.count += 1;
      districtCounts.set(district.id, current);
    });

    const topDistrict =
      Array.from(districtCounts.values()).sort((a, b) => b.count - a.count)[0] ||
      null;

    const topCategoryEntry =
      categoryKeys.map((key) => ({
        key,
        count: categoryCounts.get(key) || 0,
      })).sort((a, b) => b.count - a.count)[0] || null;

    const mappedCount = preciseCount > 0 ? preciseCount : districtResolvedCount;
    const mappedPercentage =
      reports.length > 0 ? Math.round((mappedCount / reports.length) * 100) : 0;

    return {
      total: reports.length,
      preciseCount,
      districtResolvedCount,
      mappedCount,
      mappedPercentage,
      topDistrict,
      topCategoryEntry,
    };
  }, [reports, categoryKeys]);

  const formatNumber = (value: number) =>
    language === 'bn' ? toBanglaDigits(value) : String(value);

  const topCategory =
    summary.topCategoryEntry && summary.topCategoryEntry.count > 0
      ? segments[summary.topCategoryEntry.key]
      : null;

  const topCategoryLabel = topCategory
    ? language === 'bn'
      ? topCategory.shortNameBn
      : topCategory.shortNameEn
    : language === 'bn'
      ? 'তথ্য নেই'
      : 'No data';

  const topDistrictLabel = summary.topDistrict
    ? language === 'bn'
      ? summary.topDistrict.nameBn
      : summary.topDistrict.nameEn
    : language === 'bn'
      ? 'তথ্য নেই'
      : 'No data';

  return (
    <section
      id="explore-map-insight-summary"
      aria-label={language === 'bn' ? 'মানচিত্রের সারসংক্ষেপ' : 'Map summary'}
      className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
    >
      <div className="bg-ui-surface border border-ui-stroke-subtle ui-radius-control p-3 sm:p-3.5 shadow-[var(--elevation-2xs)] min-w-0">
        <div className="flex items-center gap-1.5 type-compact text-ui-content-muted">
          <MapIcon name="file-text" size="sm" ariaHidden={true} />
          <span>{language === 'bn' ? 'মোট প্রতিবেদন' : 'Total reports'}</span>
        </div>
        <div className="type-h2 font-[var(--font-weight-bold)] text-ui-content-primary tabular-nums mt-1">
          {formatNumber(summary.total)}
        </div>
        <p className="type-compact text-ui-content-secondary mt-0.5">
          {language === 'bn' ? 'বর্তমান ফিল্টারে' : 'In current filters'}
        </p>
      </div>

      <div className="bg-ui-surface border border-ui-stroke-subtle ui-radius-control p-3 sm:p-3.5 shadow-[var(--elevation-2xs)] min-w-0">
        <div className="flex items-center gap-1.5 type-compact text-ui-content-muted">
          <MapIcon name="map-pin" size="sm" ariaHidden={true} />
          <span>{language === 'bn' ? 'মানচিত্র কভারেজ' : 'Map coverage'}</span>
        </div>
        <div className="flex items-end gap-1.5 mt-1">
          <span className="type-h2 font-[var(--font-weight-bold)] text-ui-content-primary tabular-nums">
            {formatNumber(summary.mappedCount)}
          </span>
          <span className="type-compact text-ui-content-muted pb-0.5">
            / {formatNumber(summary.total)} · {formatNumber(summary.mappedPercentage)}%
          </span>
        </div>
        <p className="type-compact text-ui-content-secondary mt-0.5 truncate">
          {summary.preciseCount > 0
            ? language === 'bn'
              ? `${formatNumber(summary.preciseCount)}টি সুনির্দিষ্ট অবস্থান`
              : `${summary.preciseCount} precise locations`
            : language === 'bn'
              ? `${formatNumber(summary.districtResolvedCount)}টি জেলা শনাক্ত`
              : `${summary.districtResolvedCount} district-resolved`}
        </p>
      </div>

      <div className="bg-ui-surface border border-ui-stroke-subtle ui-radius-control p-3 sm:p-3.5 shadow-[var(--elevation-2xs)] min-w-0">
        <div className="flex items-center gap-1.5 type-compact text-ui-content-muted">
          <MapIcon name="navigation" size="sm" ariaHidden={true} />
          <span>{language === 'bn' ? 'শীর্ষ এলাকা' : 'Top area'}</span>
        </div>
        <div className="type-h4 font-[var(--font-weight-bold)] text-ui-content-primary mt-1 truncate">
          {topDistrictLabel}
        </div>
        <p className="type-compact text-ui-content-secondary mt-0.5">
          {summary.topDistrict
            ? language === 'bn'
              ? `${formatNumber(summary.topDistrict.count)}টি প্রতিবেদন`
              : `${summary.topDistrict.count} reports`
            : language === 'bn'
              ? 'জেলা তথ্য পাওয়া যায়নি'
              : 'No district data'}
        </p>
      </div>

      <div className="bg-ui-surface border border-ui-stroke-subtle ui-radius-control p-3 sm:p-3.5 shadow-[var(--elevation-2xs)] min-w-0">
        <div className="flex items-center gap-1.5 type-compact text-ui-content-muted">
          <MapIcon name="layers" size="sm" ariaHidden={true} />
          <span>{language === 'bn' ? 'শীর্ষ বিষয়' : 'Top topic'}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 min-w-0">
          {summary.topCategoryEntry && summary.topCategoryEntry.count > 0 && (
            <CategoryIcon section={summary.topCategoryEntry.key} size="xs" />
          )}
          <span className="type-h4 font-[var(--font-weight-bold)] text-ui-content-primary truncate">
            {topCategoryLabel}
          </span>
        </div>
        <p className="type-compact text-ui-content-secondary mt-0.5">
          {summary.topCategoryEntry && summary.topCategoryEntry.count > 0
            ? language === 'bn'
              ? `${formatNumber(summary.topCategoryEntry.count)}টি প্রতিবেদন`
              : `${summary.topCategoryEntry.count} reports`
            : language === 'bn'
              ? 'বিষয় তথ্য পাওয়া যায়নি'
              : 'No topic data'}
        </p>
      </div>
    </section>
  );
};

export default MapInsightSummary;
