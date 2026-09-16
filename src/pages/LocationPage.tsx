import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, AlertCircle, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BANGLADESH_DISTRICTS } from '../data/districts';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { SECTIONS } from '../theme/tokens';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { useSeo } from '../components/seo/SeoManager';
import { BRAND_NAME } from '../lib/seo';
import { toBanglaDigits } from '../utils/formatters';

export interface LocationPageProps {
  locationId: string;
}

export const LocationPage: React.FC<LocationPageProps> = ({ locationId }) => {
  const { language, navigateTo } = useApp();
  const { setDynamicSeo } = useSeo();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Find district metadata from districts dataset
  const district = useMemo(() => {
    const cleanId = locationId.toLowerCase().trim();
    return BANGLADESH_DISTRICTS.find(
      (d) =>
        d.id.toLowerCase() === cleanId ||
        d.nameEn.toLowerCase() === cleanId ||
        d.nameBn === locationId
    );
  }, [locationId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await PublicReportService.getByLocation(locationId);
      setReports(data);
    } catch (err) {
      console.warn('[LocationPage load error]', err);
      setFetchError('LOAD_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Breakdowns by segment
  const harassmentCount = reports.filter((r) => r.segment === 'harassment').length;
  const rickshawCount = reports.filter((r) => r.segment === 'rickshaw').length;
  const extortionCount = reports.filter((r) => r.segment === 'extortion').length;

  const districtDisplayName = district
    ? language === 'bn'
      ? district.nameBn
      : district.nameEn
    : locationId;

  const divisionDisplayName = district
    ? language === 'bn'
      ? district.divisionBn
      : district.divisionEn
    : '';

  useEffect(() => {
    if (!district) {
      if (!isLoading) {
        setDynamicSeo({
          title: language === 'bn' ? `এলাকা পাওয়া যায়নি | ${BRAND_NAME.bn}` : `Location Not Found | ${BRAND_NAME.en}`,
          description:
            language === 'bn'
              ? 'এই এলাকার জন্য কোনো বৈধ প্রকাশিত প্রতিবেদন পৃষ্ঠা পাওয়া যায়নি।'
              : 'No valid published report page was found for this location.',
          robots: 'noindex, follow',
          ogType: 'website',
          ogSiteName: BRAND_NAME[language],
        });
      } else {
        setDynamicSeo({
          title: language === 'bn' ? `এলাকার প্রতিবেদন লোড হচ্ছে... | ${BRAND_NAME.bn}` : `Loading Location Reports... | ${BRAND_NAME.en}`,
          description: language === 'bn' ? 'এলাকাভিত্তিক নাগরিক প্রতিবেদন লোড হচ্ছে।' : 'Loading location-based community reports.',
          robots: 'noindex, follow',
          ogType: 'website',
          ogSiteName: BRAND_NAME[language],
        });
      }
    } else if (!isLoading && !fetchError) {
      const locName = language === 'bn' ? district.nameBn : district.nameEn;
      const title =
        language === 'bn'
          ? `${locName} এলাকার প্রতিবেদন | ${BRAND_NAME.bn}`
          : `Reports from ${locName} | ${BRAND_NAME.en}`;
      const description =
        language === 'bn'
          ? `${locName} এলাকার প্রকাশিত নাগরিক প্রতিবেদন ও জনস্বার্থ রেকর্ড।`
          : `Published community reports and public records from ${locName}, Bangladesh.`;

      setDynamicSeo({
        title,
        description,
        robots: 'index, follow',
        ogType: 'website',
        ogSiteName: BRAND_NAME[language],
      });
    } else if (fetchError) {
      setDynamicSeo({
        title: language === 'bn' ? `এলাকার তথ্য পাওয়া যায়নি | ${BRAND_NAME.bn}` : `Location Unavailable | ${BRAND_NAME.en}`,
        description: language === 'bn' ? 'এই এলাকার তথ্য লোড করতে সমস্যা হয়েছে।' : 'Failed to load reports for this location.',
        robots: 'noindex, follow',
        ogType: 'website',
        ogSiteName: BRAND_NAME[language],
      });
    } else {
      setDynamicSeo({
        title: language === 'bn' ? `এলাকার প্রতিবেদন লোড হচ্ছে... | ${BRAND_NAME.bn}` : `Loading Location Reports... | ${BRAND_NAME.en}`,
        description: language === 'bn' ? 'এলাকাভিত্তিক নাগরিক প্রতিবেদন লোড হচ্ছে।' : 'Loading location-based community reports.',
        robots: 'noindex, follow',
        ogType: 'website',
        ogSiteName: BRAND_NAME[language],
      });
    }
  }, [district, isLoading, fetchError, language, setDynamicSeo]);

  return (
    <PublicPageContainer id="location-page-container">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-[var(--type-fixed-14)] text-ui-content-muted">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigateTo('/explore');
            }
          }}
          className="flex items-center gap-2 font-[var(--font-weight-medium)] transition-colors cursor-pointer min-h-[44px] px-3 py-1.5 rounded-[var(--radius-control)] border border-ui-stroke-subtle bg-ui-surface text-ui-content-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{language === 'bn' ? 'এক্সপ্লোরে ফিরুন' : 'Back to explore'}</span>
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-ui-content-primary font-[var(--font-weight-semibold)]">{districtDisplayName}</span>
      </div>

      {/* District Header Card */}
      <div className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-card)] p-5 md:p-7 space-y-4 shadow-[var(--elevation-2xs)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[var(--type-fixed-32)] leading-[var(--type-line-42)] font-[var(--font-weight-bold)] text-ui-content-primary tracking-tight">
              {districtDisplayName}
            </h1>
            {divisionDisplayName && (
              <span className="text-[var(--type-fixed-14)] px-2.5 py-0.5 rounded-[var(--radius-badge-md)] bg-ui-surface-subtle text-ui-content-secondary font-[var(--font-weight-medium)] border border-ui-stroke-subtle">
                {language === 'bn' ? `${divisionDisplayName} বিভাগ` : `${divisionDisplayName} division`}
              </span>
            )}
          </div>
          <p className="text-[var(--type-fixed-16)] leading-[var(--type-line-26)] text-ui-content-secondary">
            {language === 'bn'
              ? 'এই এলাকার প্রতিবেদন'
              : 'Reports from this area'}
          </p>
        </div>

        {/* Quiet Inline Summary */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 border-t border-ui-stroke-subtle text-[var(--type-fixed-14)] text-ui-content-secondary font-[var(--font-weight-medium)]">
          <span>
            {language === 'bn' ? `${toBanglaDigits(reports.length)}টি প্রতিবেদন` : `${reports.length} reports`}
          </span>
          {reports.length > 0 && (
            <>
              <span>·</span>
              <span>
                {language === 'bn' ? `${SECTIONS.harassment.shortNameBn} ${toBanglaDigits(harassmentCount)}` : `${SECTIONS.harassment.shortNameEn} ${harassmentCount}`}
              </span>
              <span>·</span>
              <span>
                {language === 'bn' ? `${SECTIONS.rickshaw.shortNameBn} ${toBanglaDigits(rickshawCount)}` : `${SECTIONS.rickshaw.shortNameEn} ${rickshawCount}`}
              </span>
              <span>·</span>
              <span>
                {language === 'bn' ? `${SECTIONS.extortion.shortNameBn} ${toBanglaDigits(extortionCount)}` : `${SECTIONS.extortion.shortNameEn} ${extortionCount}`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Loading State Skeleton Screen */}
      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="location-feed-skeleton"
          ariaLabel={language === 'bn' ? 'এলাকার প্রতিবেদন লোড হচ্ছে...' : 'Loading location reports...'}
        />
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-[var(--radius-control)] p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="text-[var(--type-fixed-16)] font-[var(--font-weight-semibold)] text-ui-error-text">
            {language === 'bn'
              ? 'এই এলাকার প্রতিবেদন লোড করা যায়নি।'
              : "Couldn't load reports for this area."}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2.5 rounded-[var(--radius-control)] text-[var(--type-fixed-16)] font-[var(--font-weight-semibold)] min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
          >
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Reports Feed */}
      {!isLoading && !fetchError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[var(--type-fixed-18)] leading-[var(--type-line-28)] font-[var(--font-weight-bold)] text-ui-content-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-ui-content-secondary" aria-hidden="true" />
              <span>
                {language === 'bn'
                  ? 'প্রকাশিত প্রতিবেদন'
                  : 'Published reports'}
              </span>
            </h2>
          </div>

          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <div className="bg-ui-surface border border-ui-stroke-subtle rounded-[var(--radius-control)] p-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-ui-content-muted mx-auto" aria-hidden="true" />
              <h3 className="text-[var(--type-fixed-16)] font-[var(--font-weight-bold)] text-ui-content-primary">
                {language === 'bn' ? 'এই এলাকায় কোনো প্রতিবেদন নেই।' : 'No reports in this area.'}
              </h3>
            </div>
          )}
        </div>
      )}
    </PublicPageContainer>
  );
};
