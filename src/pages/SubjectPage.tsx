import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserX, ArrowLeft, AlertCircle, FileText, Scale } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SubjectResponseModal } from '../components/report-detail/SubjectResponseModal';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { useSeo } from '../components/seo/SeoManager';
import { BRAND_NAME } from '../lib/seo';
import { toBanglaDigits } from '../utils/formatters';

export interface SubjectPageProps {
  subjectId: string;
}

export const SubjectPage: React.FC<SubjectPageProps> = ({ subjectId }) => {
  const { language, navigateTo } = useApp();
  const { setDynamicSeo } = useSeo();
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const decodedSubject = decodeURIComponent(subjectId).trim();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await PublicReportService.getBySubject(decodedSubject);
      setReports(data);
    } catch (err) {
      console.warn('[SubjectPage load error]', err);
      setFetchError('LOAD_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [decodedSubject]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const primaryReport = reports[0];
  const displayName = primaryReport
    ? language === 'bn'
      ? primaryReport.reportedSubjectBn || primaryReport.reportedSubject || decodedSubject
      : primaryReport.reportedSubjectEn || primaryReport.reportedSubject || decodedSubject
    : decodedSubject;

  const storedResponses = useMemo(() => {
    return reports.filter((r) => r.response).map((r) => r.response!);
  }, [reports]);

  useEffect(() => {
    const subjectPublicLabel = primaryReport
      ? language === 'bn'
        ? primaryReport.reportedSubjectBn || primaryReport.reportedSubject
        : primaryReport.reportedSubjectEn || primaryReport.reportedSubject
      : null;

    if (!isLoading && !fetchError) {
      if (reports.length > 0 && primaryReport && subjectPublicLabel) {
        const title =
          language === 'bn'
            ? `${subjectPublicLabel} সংক্রান্ত প্রতিবেদন | ${BRAND_NAME.bn}`
            : `Reports regarding ${subjectPublicLabel} | ${BRAND_NAME.en}`;
        const description =
          language === 'bn'
            ? `${subjectPublicLabel} সংক্রান্ত প্রকাশিত নাগরিক প্রতিবেদন ও সংশ্লিষ্ট পক্ষের বক্তব্য।`
            : `Published public reports and statements regarding ${subjectPublicLabel}.`;

        setDynamicSeo({
          title,
          description,
          robots: 'noindex, follow',
          ogType: 'website',
          ogSiteName: BRAND_NAME[language],
          canonicalPath: `/subject/${encodeURIComponent(decodedSubject)}`,
          pageType: 'collection',
          canonicalPath: `/subject/${encodeURIComponent(decodedSubject)}`,
          pageType: 'collection',
        });
      } else {
        setDynamicSeo({
          title:
            language === 'bn'
              ? `সংশ্লিষ্ট পক্ষের তথ্য পাওয়া যায়নি | ${BRAND_NAME.bn}`
              : `Subject Not Found | ${BRAND_NAME.en}`,
          description:
            language === 'bn'
              ? 'এই সংশ্লিষ্ট পক্ষের জন্য কোনো প্রকাশিত প্রতিবেদন পাওয়া যায়নি।'
              : 'No published reports were found for this subject.',
          robots: 'noindex, follow',
          ogType: 'website',
          ogSiteName: BRAND_NAME[language],
          canonicalPath: `/subject/${encodeURIComponent(decodedSubject)}`,
          pageType: 'collection',
        });
      }
    } else if (fetchError) {
      setDynamicSeo({
        title: language === 'bn' ? `সংশ্লিষ্ট পক্ষের তথ্য পাওয়া যায়নি | ${BRAND_NAME.bn}` : `Subject Unavailable | ${BRAND_NAME.en}`,
        description: language === 'bn' ? 'সংশ্লিষ্ট পক্ষের তথ্য লোড করতে সমস্যা হয়েছে।' : 'Failed to load reports for this subject.',
        robots: 'noindex, follow',
        ogType: 'website',
        ogSiteName: BRAND_NAME[language],
        canonicalPath: `/subject/${encodeURIComponent(decodedSubject)}`,
        pageType: 'collection',
      });
    } else {
      setDynamicSeo({
        title: language === 'bn' ? `সংশ্লিষ্ট পক্ষের প্রতিবেদন লোড হচ্ছে... | ${BRAND_NAME.bn}` : `Loading Subject Reports... | ${BRAND_NAME.en}`,
        description: language === 'bn' ? 'সংশ্লিষ্ট পক্ষের প্রতিবেদন লোড হচ্ছে।' : 'Loading subject-based community reports.',
        robots: 'noindex, follow',
        ogType: 'website',
        ogSiteName: BRAND_NAME[language],
      });
    }
  }, [primaryReport, reports.length, isLoading, fetchError, language, setDynamicSeo]);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('/explore');
    }
  };

  return (
    <PublicPageContainer id="subject-page-container">
      <div className="type-meta text-ui-content-muted">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleBack}
          leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
        >
          {language === 'bn' ? 'এক্সপ্লোরে ফিরুন' : 'Back to explore'}
        </Button>
      </div>

      <section className="ui-card p-5 md:p-7 space-y-4" aria-labelledby="subject-page-title">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 ui-radius-control bg-ui-surface-subtle border border-ui-stroke-subtle flex items-center justify-center text-ui-content-secondary shrink-0">
              <UserX className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h1 id="subject-page-title" className="type-h1 text-ui-content-primary break-words">
                {displayName}
              </h1>
              {primaryReport?.organization && (
                <p className="type-body text-ui-content-secondary font-[var(--font-weight-medium)]">
                  {primaryReport.organization}
                </p>
              )}
              <p className="type-body text-ui-content-secondary">
                {language === 'bn'
                  ? `${toBanglaDigits(reports.length)}টি প্রকাশিত প্রতিবেদনে উল্লেখ রয়েছে।`
                  : `Mentioned in ${reports.length} published reports.`}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setIsResponseModalOpen(true)}
            leftIcon={<Scale className="w-4 h-4 text-ui-content-secondary" aria-hidden="true" />}
            className="shrink-0 self-start"
          >
            {language === 'bn' ? 'জবাব দিন' : 'Submit response'}
          </Button>
        </div>
      </section>

      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="subject-feed-skeleton"
          ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
        />
      )}

      {!isLoading && fetchError && (
        <div role="alert" className="ui-card border-ui-error-border p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="type-body font-[var(--font-weight-semibold)] text-ui-error-text">
            {language === 'bn' ? 'প্রতিবেদন লোড করা যায়নি।' : "Couldn't load reports."}
          </p>
          <Button type="button" variant="primary" size="md" onClick={loadData}>
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </Button>
        </div>
      )}

      {!isLoading && !fetchError && storedResponses.length > 0 && (
        <section className="space-y-3" aria-labelledby="subject-responses-title">
          <h2 id="subject-responses-title" className="type-h2 text-ui-content-primary flex items-center gap-2">
            <Scale className="w-5 h-5 text-ui-accent" aria-hidden="true" />
            <span>{language === 'bn' ? 'জবাব' : 'Responses'}</span>
          </h2>
          <div className="space-y-3">
            {storedResponses.map((res, rIdx) => (
              <article
                key={`${res.respondentEn || res.respondentBn}-${rIdx}`}
                className="p-4 sm:p-5 border border-ui-info-border ui-radius-control bg-ui-info-bg space-y-2"
              >
                <div className="flex items-center justify-between gap-3 type-meta font-[var(--font-weight-semibold)] text-ui-info-text">
                  <p>{language === 'bn' ? res.respondentBn : res.respondentEn}</p>
                  <p className="text-ui-content-muted tabular-nums shrink-0">
                    {language === 'bn' ? res.dateBn : res.dateEn}
                  </p>
                </div>
                <p className="type-body text-ui-content-secondary">
                  {language === 'bn' ? res.statementBn : res.statementEn}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {!isLoading && !fetchError && (
        <section className="space-y-4" aria-labelledby="subject-published-reports-title">
          <h2 id="subject-published-reports-title" className="type-h2 text-ui-content-primary flex items-center gap-2">
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
              title={language === 'bn' ? 'কোনো প্রতিবেদন পাওয়া যায়নি' : 'No reports found'}
              description={
                language === 'bn'
                  ? 'এই নামে কোনো প্রকাশিত প্রতিবেদন নেই বা নাম গোপনীয়তার জন্য লুকানো থাকতে পারে।'
                  : 'No published reports are available for this name, or the name may be hidden for privacy.'
              }
            />
          )}
        </section>
      )}

      {isResponseModalOpen && (
        <SubjectResponseModal
          reportId={primaryReport?.id || ''}
          subjectName={displayName}
          language={language}
          isOpen={isResponseModalOpen}
          onClose={() => {
            setIsResponseModalOpen(false);
            void loadData();
          }}
        />
      )}
    </PublicPageContainer>
  );
};
