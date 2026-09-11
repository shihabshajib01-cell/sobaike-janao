import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserX, ArrowLeft, AlertCircle, FileText, Scale } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
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

  // Decode subject query / identifier
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
    loadData();
  }, [loadData]);

  // Primary subject metadata from first report
  const primaryReport = reports[0];
  const displayName = primaryReport
    ? language === 'bn'
      ? primaryReport.reportedSubjectBn || primaryReport.reportedSubject || decodedSubject
      : primaryReport.reportedSubjectEn || primaryReport.reportedSubject || decodedSubject
    : decodedSubject;

  // Retrieve any responses from reports
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
          robots: 'index, follow',
          ogType: 'website',
          ogSiteName: BRAND_NAME[language],
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
        });
      }
    } else if (fetchError) {
      setDynamicSeo({
        title: language === 'bn' ? `সংশ্লিষ্ট পক্ষের তথ্য পাওয়া যায়নি | ${BRAND_NAME.bn}` : `Subject Unavailable | ${BRAND_NAME.en}`,
        description: language === 'bn' ? 'সংশ্লিষ্ট পক্ষের তথ্য লোড করতে সমস্যা হয়েছে।' : 'Failed to load reports for this subject.',
        robots: 'noindex, follow',
        ogType: 'website',
        ogSiteName: BRAND_NAME[language],
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

  return (
    <PublicPageContainer id="subject-page-container">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-[14px] text-ui-content-muted">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigateTo('/explore');
            }
          }}
          className="flex items-center gap-2 font-medium transition-colors cursor-pointer min-h-[44px] px-3 py-1.5 rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{language === 'bn' ? 'এক্সপ্লোরে ফিরুন' : 'Back to explore'}</span>
        </button>
      </div>

      {/* Subject Header */}
      <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle flex items-center justify-center text-ui-content-secondary shrink-0">
              <UserX className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-[32px] leading-[42px] font-bold text-ui-content-primary tracking-tight">
                {displayName}
              </h1>
              {primaryReport?.organization && (
                <p className="text-[16px] text-ui-content-secondary font-medium">{primaryReport.organization}</p>
              )}
              <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                {language === 'bn'
                  ? `${toBanglaDigits(reports.length)}টি প্রকাশিত প্রতিবেদনে উল্লেখ রয়েছে।`
                  : `Mentioned in ${reports.length} published reports.`}
              </p>
            </div>
          </div>

          {/* Right of Response Trigger */}
          <button
            type="button"
            onClick={() => setIsResponseModalOpen(true)}
            className="px-4 py-2.5 bg-ui-surface-subtle border border-ui-stroke-subtle text-ui-content-primary text-[16px] font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shrink-0 self-start min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            <Scale className="w-4 h-4 text-ui-content-secondary" aria-hidden="true" />
            <span>{language === 'bn' ? 'জবাব দিন' : 'Submit response'}</span>
          </button>
        </div>
      </div>

      {/* Loading State Skeleton Screen */}
      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="subject-feed-skeleton"
          ariaLabel={language === 'bn' ? 'প্রতিবেদন লোড হচ্ছে...' : 'Loading reports...'}
        />
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div role="alert" className="bg-ui-surface border border-ui-error-border rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-ui-error-text mx-auto" aria-hidden="true" />
          <p className="text-[16px] font-semibold text-ui-error-text">
            {language === 'bn'
              ? 'প্রতিবেদন লোড করা যায়নি।'
              : "Couldn't load reports."}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="btn-primary-action px-4 py-2.5 rounded-xl text-[16px] font-semibold min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer"
          >
            {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Formal Responses Section if any */}
      {!isLoading && !fetchError && storedResponses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[18px] leading-[28px] font-bold text-ui-content-primary flex items-center gap-2">
            <Scale className="w-5 h-5 text-ui-accent" aria-hidden="true" />
            <span>{language === 'bn' ? 'জবাব' : 'Responses'}</span>
          </h2>
          <div className="space-y-3">
            {storedResponses.map((res, rIdx) => (
              <div
                key={rIdx}
                className="p-4 sm:p-5 border rounded-xl space-y-2"
                style={{
                  backgroundColor: 'var(--ui-info-bg)',
                  borderColor: 'var(--ui-info-border)',
                }}
              >
                <div
                  className="flex items-center justify-between text-[14px] font-semibold"
                  style={{ color: 'var(--ui-info-text)' }}
                >
                  <span>{language === 'bn' ? res.respondentBn : res.respondentEn}</span>
                  <span className="text-ui-content-muted font-mono text-[14px]">{language === 'bn' ? res.dateBn : res.dateEn}</span>
                </div>
                <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                  {language === 'bn' ? res.statementBn : res.statementEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Feed */}
      {!isLoading && !fetchError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] leading-[28px] font-bold text-ui-content-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-ui-content-secondary" aria-hidden="true" />
              <span>
                {language === 'bn' ? 'প্রকাশিত প্রতিবেদন' : 'Published reports'}
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
            <div className="bg-ui-surface border border-ui-stroke-subtle rounded-xl p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-ui-content-muted mx-auto" aria-hidden="true" />
              <h3 className="text-[16px] font-bold text-ui-content-primary">
                {language === 'bn' ? 'কোনো প্রতিবেদন পাওয়া যায়নি' : 'No reports found'}
              </h3>
              <p className="text-[14px] text-ui-content-muted max-w-sm mx-auto leading-relaxed">
                {language === 'bn'
                  ? 'এই নামে কোনো প্রকাশিত প্রতিবেদন নেই বা নাম গোপনীয়তার জন্য লুকানো থাকতে পারে।'
                  : 'No published reports are available for this name, or the name may be hidden for privacy.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Response Modal */}
      {isResponseModalOpen && (
        <SubjectResponseModal
          reportId={primaryReport?.id || ''}
          subjectName={displayName}
          language={language}
          isOpen={isResponseModalOpen}
          onClose={() => {
            setIsResponseModalOpen(false);
            loadData();
          }}
        />
      )}
    </PublicPageContainer>
  );
};
