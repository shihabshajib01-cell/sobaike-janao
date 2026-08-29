import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserX, ArrowLeft, AlertCircle, FileText, Scale, ShieldCheck, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { SubjectResponseModal } from '../components/report-detail/SubjectResponseModal';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';

export interface SubjectPageProps {
  subjectId: string;
}

export const SubjectPage: React.FC<SubjectPageProps> = ({ subjectId }) => {
  const { language, navigateTo } = useApp();
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
      console.error('[SubjectPage load error]', err);
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

  return (
    <PublicPageContainer id="subject-page-container">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-[14px] text-muted">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigateTo('/explore');
            }
          }}
          className="hover:text-primary flex items-center gap-2 font-medium transition-colors cursor-pointer min-h-[44px] px-3 py-1.5 rounded-xl border border-subtle bg-surface text-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'bn' ? 'এক্সপ্লোরে ফিরে যান' : 'Back to Explore'}</span>
        </button>
      </div>

      {/* Subject Header */}
      <div className="bg-surface border border-subtle rounded-2xl p-5 md:p-7 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-subtle border border-subtle flex items-center justify-center text-secondary shrink-0">
              <UserX className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-[32px] leading-[42px] font-bold text-primary tracking-tight">
                {displayName}
              </h1>
              {primaryReport?.organization && (
                <p className="text-[16px] text-secondary font-medium">{primaryReport.organization}</p>
              )}
              <p className="text-[16px] leading-[26px] text-secondary">
                {language === 'bn'
                  ? `${reports.length}টি প্রকাশিত প্রতিবেদনে এই নাম/সত্ত্বার উল্লেখ রয়েছে।`
                  : `Mentioned in ${reports.length} published reports.`}
              </p>
            </div>
          </div>

          {/* Right of Response Trigger */}
          <button
            type="button"
            onClick={() => setIsResponseModalOpen(true)}
            className="px-4 py-2.5 bg-surface-subtle hover:bg-surface-elevated border border-subtle text-primary text-[16px] font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shrink-0 self-start min-h-[44px]"
          >
            <Scale className="w-4 h-4 text-secondary" />
            <span>{language === 'bn' ? 'সংশ্লিষ্ট পক্ষের বক্তব্য দিন' : 'Submit Statement'}</span>
          </button>
        </div>
      </div>

      {/* Loading State Skeleton Screen */}
      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="subject-feed-skeleton"
          ariaLabel={language === 'bn' ? 'সত্ত্বার তথ্য লোড হচ্ছে...' : 'Loading subject reports...'}
        />
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div className="bg-surface border border-rose-500/30 rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-[16px] font-semibold text-rose-500">
            {language === 'bn'
              ? 'সত্ত্বার তথ্য লোড করতে সমস্যা হয়েছে।'
              : 'Failed to load reports for this subject. Please try again.'}
          </p>
          <button
            onClick={loadData}
            className="btn-primary-action px-4 py-2.5 rounded-xl text-[16px] font-semibold min-h-[44px]"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Formal Responses Section if any */}
      {!isLoading && !fetchError && storedResponses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[18px] leading-[28px] font-bold text-primary flex items-center gap-2">
            <Scale className="w-5 h-5 text-accent" />
            <span>{language === 'bn' ? 'সংশ্লিষ্ট পক্ষের বক্তব্য ও ব্যাখ্যা' : 'Subject Statements & Responses'}</span>
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
                  <span className="text-muted font-mono text-[14px]">{language === 'bn' ? res.dateBn : res.dateEn}</span>
                </div>
                <p className="text-[16px] leading-[26px] text-secondary">
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
            <h2 className="text-[18px] leading-[28px] font-bold text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" />
              <span>
                {language === 'bn' ? 'প্রকাশিত প্রতিবেদন' : 'Published Reports'}
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
            <div className="bg-surface border border-subtle rounded-xl p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-muted mx-auto" />
              <h3 className="text-[16px] font-bold text-primary">
                {language === 'bn' ? 'কোনো প্রতিবেদন পাওয়া যায়নি' : 'No Public Reports Found'}
              </h3>
              <p className="text-[14px] text-muted max-w-sm mx-auto leading-relaxed">
                {language === 'bn'
                  ? 'এই পক্ষের নামে বর্তমানে কোনো প্রকাশিত প্রতিবেদন নেই বা নাম গোপনীয়তার নীতি অনুযায়ী লুকানো রয়েছে।'
                  : 'There are no active public reports associated with this entity or the name has been withheld for privacy.'}
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
