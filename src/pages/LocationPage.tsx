import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, AlertCircle, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BANGLADESH_DISTRICTS } from '../data/districts';
import { CATEGORY_ORDER } from '../data/categoryOrder';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SECTIONS, SectionKey } from '../theme/tokens';
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
    void loadData();
  }, [loadData]);

  const segmentCounts = useMemo(() => {
    const counts = Object.fromEntries(CATEGORY_ORDER.map((key) => [key, 0])) as Record<SectionKey, number>;
    reports.forEach((report) => {
      if (report.segment in counts) counts[report.segment as SectionKey] += 1;
    });
    return counts;
  }, [reports]);

  const visibleSegmentKeys = useMemo(
    () => CATEGORY_ORDER.filter((key) => segmentCounts[key] > 0),
    [segmentCounts]
  );

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
          canonicalPath: `/location/${encodeURIComponent(locationId)}`,
          pageType: 'collection',
        });
      } else {
        setDynamicSeo({
          title: language === 'bn' ? `এলাকার প্রতিবেদন লোড হচ্ছে... | ${BRAND_NAME.bn}` : `Loading Location Reports... | ${BRAND_NAME.en}`,
          description: language === 'bn' ? 'এলাকাভিত্তিক নাগরিক প্রতিবেদন লোড হচ্ছে।' : 'Loading location-based community reports.',
          robots: 'noindex, follow',
          ogType: 'website',
          ogSiteName: BRAND_NAME[language],
          canonicalPath: `/location/${encodeURIComponent(locationId)}`,
          pageType: 'collection',
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
        robots: 'index, follow, max-image-preview:large',
        ogType: 'website',
        ogSiteName: BRAND_NAME[language],
        canonicalPath: `/location/${encodeURIComponent(district.id)}`,
        pageType: 'collection',
      });
    } else if (fetchError) {
      setDynamicSeo({
        title: language === 'bn' ? `এলাকার তথ্য পাওয়া যায়নি | ${BRAND_NAME.bn}` : `Location Unavailable | ${BRAND_NAME.en}`,
        description: language === 'bn' ? 'এই এলাকার তথ্য লোড করতে সমস্যা হয়েছে।' : 'Failed to load reports for this location.',
        robots: 'noindex, follow',
        ogType: 'website',
        ogSiteName: BRAND_NAME[language],
        canonicalPath: `/location/${encodeURIComponent(locationId)}`,
        pageType: 'collection',
      });
    } else {
      setDynamicSeo({
        title: language === 'bn' ? `এলাকার প্রতিবেদন লোড হচ্ছে... | ${BRAND_NAME.bn}` : `Loading Location Reports... | ${BRAND_NAME.en}`,
        description: language === 'bn' ? 'এলাকাভিত্তিক নাগরিক প্রতিবেদন লোড হচ্ছে।' : 'Loading location-based community reports.',
        robots: 'noindex, follow',
        ogType: 'website',
        ogSiteName: BRAND_NAME[language],
        canonicalPath: `/location/${encodeURIComponent(locationId)}`,
        pageType: 'collection',
      });
    }
  }, [district, isLoading, fetchError, language, setDynamicSeo]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('/explore');
    }
  };

  return (
    <PublicPageContainer id="location-page-container">
      <div className="flex items-center gap-2 type-meta text-ui-content-muted">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleBack}
          leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
        >
          {language === 'bn' ? 'এক্সপ্লোরে ফিরুন' : 'Back to explore'}
        </Button>
        <span aria-hidden="true">/</span>
        <span className="text-ui-content-primary font-[var(--font-weight-semibold)] truncate">
          {districtDisplayName}
        </span>
      </div>

      <section className="ui-card p-5 md:p-7 space-y-4" aria-labelledby="location-page-title">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 id="location-page-title" className="type-h1 text-ui-content-primary">
              {districtDisplayName}
            </h1>
            {divisionDisplayName && (
              <span className="type-meta px-2.5 py-0.5 ui-radius-badge-md bg-ui-surface-subtle text-ui-content-secondary font-[var(--font-weight-medium)] border border-ui-stroke-subtle">
                {language === 'bn' ? `${divisionDisplayName} বিভাগ` : `${divisionDisplayName} division`}
              </span>
            )}
          </div>
          <p className="type-body text-ui-content-secondary">
            {language === 'bn' ? 'এই এলাকার প্রতিবেদন' : 'Reports from this area'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 border-t border-ui-stroke-subtle type-meta text-ui-content-secondary font-[var(--font-weight-medium)]">
          <span>
            {language === 'bn' ? `${toBanglaDigits(reports.length)}টি প্রতিবেদন` : `${reports.length} reports`}
          </span>
          {visibleSegmentKeys.map((key) => (
            <React.Fragment key={key}>
              <span aria-hidden="true">·</span>
              <span>
                {language === 'bn'
                  ? `${SECTIONS[key].shortNameBn} ${toBanglaDigits(segmentCounts[key])}`
                  : `${SECTIONS[key].shortNameEn} ${segmentCounts[key]}`}
              </span>
            </React.Fragment>
          ))}
        </div>
      </section>

      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="location-feed-skeleton"
          ariaLabel={language === 'bn' ? 'এলাকার প্রতিবেদন লোড হচ্ছে...' : 'Loading location reports...'}
        />
      )}

      {!isLoading && fetchError && (
        <div role="alert" className="ui-card border-ui-error-border p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="type-body font-[var(--font-weight-semibold)] text-ui-error-text">
            {language === 'bn'
              ? 'এই এলাকার প্রতিবেদন লোড করা যায়নি।'
              : "Couldn't load reports for this area."}
          </p>
          <Button type="button" variant="primary" size="md" onClick={loadData}>
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </Button>
        </div>
      )}

      {!isLoading && !fetchError && (
        <section className="space-y-4" aria-labelledby="location-published-reports-title">
          <h2 id="location-published-reports-title" className="type-h2 text-ui-content-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-ui-content-secondary" aria-hidden="true" />
            <span>{language === 'bn' ? 'প্রকাশিত প্রতিবেদন' : 'Published reports'}</span>
          </h2>

          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={language === 'bn' ? 'এই এলাকায় কোনো প্রতিবেদন নেই।' : 'No reports in this area.'}
              description={
                language === 'bn'
                  ? 'এই এলাকার জন্য বর্তমানে কোনো প্রকাশিত প্রতিবেদন নেই।'
                  : 'There are currently no published reports for this area.'
              }
            />
          )}
        </section>
      )}
    </PublicPageContainer>
  );
};
