import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  FileCheck,
  Share2,
  Check,
  UserX,
  FileText,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Home,
  Scale,
} from 'lucide-react';
import { SECTIONS } from '../theme/tokens';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { CitizenActionModal } from '../components/report-detail/CitizenActionModal';
import { SubjectResponseModal } from '../components/report-detail/SubjectResponseModal';
import { PublicReportService } from '../services/publicReportService';
import { ReportMediaGrid } from '../components/media/ReportMediaGrid';
import { ReportItem } from '../types/report';
import { ReportDetailSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';

export interface ReportDetailPageProps {
  reportId: string;
}

export const ReportDetailPage: React.FC<ReportDetailPageProps> = ({ reportId }) => {
  const { language, navigateTo } = useApp();
  const [isCopied, setIsCopied] = useState(false);
  const [citizenModalType, setCitizenModalType] = useState<'witness_information' | 'experienced_similar' | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [report, setReport] = useState<ReportItem | null>(null);
  const [storedResponses, setStoredResponses] = useState<any[]>([]);
  const [relatedReports, setRelatedReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<boolean>(false);

  const fetchReport = () => {
    setIsLoading(true);
    setFetchError(false);

    PublicReportService.getById(reportId)
      .then(async (res) => {
        if (res && res.report) {
          setReport(res.report);
          if (res.responses) {
            setStoredResponses(res.responses);
          }

          // Fetch related reports from backend service ONLY if explicit relatedReportIds exist
          if (res.report.relatedReportIds && Array.isArray(res.report.relatedReportIds) && res.report.relatedReportIds.length > 0) {
            try {
              const allPublic = await PublicReportService.getAll();
              const rel = allPublic.filter(
                (r) => r.id !== res.report.id && res.report.relatedReportIds?.includes(r.id)
              ).slice(0, 3);
              setRelatedReports(rel);
            } catch (e) {
              console.warn('[ReportDetailPage related reports error]', e);
            }
          } else {
            setRelatedReports([]);
          }
        } else {
          setReport(null);
        }
      })
      .catch((err) => {
        console.warn('[ReportDetailPage API fetch error]', err);
        setFetchError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  if (isLoading) {
    return (
      <PublicPageContainer id="report-detail-loading-container">
        <ReportDetailSkeleton id="report-detail-loading-skeleton" />
      </PublicPageContainer>
    );
  }

  // Network / API fetch error state
  if (fetchError) {
    return (
      <div className="w-full py-12 px-4 text-center space-y-6">
        <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-[24px] leading-[32px] font-bold text-primary">
            {language === 'bn' ? 'প্রতিবেদনটি লোড করা সম্ভব হয়নি' : 'Unable to Load Report'}
          </h1>
          <p className="text-[16px] leading-[26px] text-secondary max-w-md mx-auto">
            {language === 'bn'
              ? 'সার্ভারের সাথে সংযোগে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
              : 'There was a temporary network issue connecting to the server. Please try again.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={fetchReport}
            className="btn-primary-action w-full sm:w-auto px-5 py-2.5 rounded-xl text-[16px] font-semibold min-h-[44px] flex items-center justify-center gap-2"
          >
            <span>{language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigateTo('/');
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-subtle hover:bg-surface-subtle text-secondary text-[16px] font-semibold transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-2 bg-surface"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'bn' ? 'ফিরে যান' : 'Go Back'}</span>
          </button>
        </div>
      </div>
    );
  }

  // If report does not exist, show dedicated "Report Unavailable / Not Found" state
  if (!report) {
    return (
      <div className="w-full py-12 px-4 text-center space-y-6">
        <div className="w-14 h-14 bg-surface-subtle border border-subtle rounded-full flex items-center justify-center mx-auto text-muted">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-[24px] leading-[32px] font-bold text-primary">
            {language === 'bn' ? 'প্রতিবেদনটি পাওয়া যায়নি বা অনুপলব্ধ' : 'Report Unavailable / Not Found'}
          </h1>
          <p className="text-[16px] leading-[26px] text-secondary max-w-md mx-auto">
            {language === 'bn'
              ? `অনুরোধকৃত প্রতিবেদনটি খুঁজে পাওয়া যায়নি। এটি অনুমোদিত হয়নি, এখনও পর্যালোচনায় রয়েছে অথবা আইডিটি সঠিক নয়।`
              : `The requested report could not be found. It may not be published, is currently under review, or the ID is incorrect.`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigateTo('/');
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-subtle hover:bg-surface-subtle text-secondary text-[16px] font-semibold transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-2 bg-surface"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'bn' ? 'পূর্ববর্তী পাতায় যান' : 'Go Back'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="btn-primary-action w-full sm:w-auto px-5 py-2.5 rounded-xl text-[16px] font-semibold min-h-[44px] flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>{language === 'bn' ? 'মূলপাতায় ফিরে যান' : 'Back to Home'}</span>
          </button>
        </div>
      </div>
    );
  }

  const sectionConfig = SECTIONS[report.segment];

  const title = language === 'bn' ? report.titleBn : report.titleEn;
  const shortDesc = language === 'bn' ? report.shortDescriptionBn : report.shortDescriptionEn;
  const fullDesc = language === 'bn' ? report.fullDescriptionBn : report.fullDescriptionEn;
  const subcategory = language === 'bn' ? report.subcategoryBn : report.subcategoryEn;
  const location = language === 'bn' ? report.locationBn : report.locationEn;
  const incidentDateRaw = language === 'bn' ? report.incidentDateBn : report.incidentDateEn;
  const incidentDate = incidentDateRaw && incidentDateRaw !== 'undefined' && incidentDateRaw !== 'null'
    ? incidentDateRaw
    : (language === 'bn' ? 'ঘটনার তারিখ দেওয়া হয়নি' : 'Incident date not provided');
  const publishedDate = language === 'bn' ? report.publishedDateBn : report.publishedDateEn;
  const evidenceList = language === 'bn' ? report.evidenceSummaryBn : report.evidenceSummaryEn;

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const subjectTargetName = report.reportedSubjectEn || report.reportedSubjectBn || report.reportedSubject || '';

  return (
    <PublicPageContainer id="report-detail-page-container">
      <div className="max-w-[720px] mx-auto w-full space-y-6">
        {/* 1. Single Primary Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigateTo('/');
            }
          }}
          className="inline-flex items-center gap-2 text-[16px] leading-[24px] font-medium text-secondary hover:text-primary bg-surface hover:bg-surface-subtle border border-subtle px-4 py-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'bn' ? 'তালিকায় ফিরে যান' : 'Back to Reports'}</span>
        </button>

        {/* Quiet Share CTA */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-[16px] font-medium text-secondary hover:text-primary bg-surface hover:bg-surface-subtle border border-subtle px-4 py-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px]"
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{language === 'bn' ? 'লিংক কপি হয়েছে' : 'Link Copied'}</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-muted" />
              <span>{language === 'bn' ? 'শেয়ার করুন' : 'Share'}</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Main Article Content */}
      <article className="bg-surface border border-subtle rounded-2xl p-5 md:p-7 space-y-5 shadow-2xs">
        {/* Category & Subcategory Header */}
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <CategoryBadge section={report.segment} language={language} size="md" />
          <span className="text-muted">·</span>
          <span className="font-semibold text-primary">
            {subcategory}
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-[32px] leading-[42px] font-bold text-primary tracking-tight">
          {title}
        </h1>

        {/* Canonical Unified Metadata Bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-subtle text-[14px] text-secondary">
          <button
            type="button"
            onClick={() => navigateTo(`/location/${report.districtEn.toLowerCase()}`)}
            className="flex items-center gap-1.5 font-medium text-primary hover:text-primary transition-colors cursor-pointer min-h-[36px]"
          >
            <MapPin className="w-4 h-4 text-muted shrink-0" />
            <span className="underline decoration-subtle">{location}</span>
          </button>
          <div className="flex items-center gap-1.5 text-muted">
            <Calendar className="w-4 h-4 text-muted shrink-0" />
            <span>
              {language === 'bn' ? `ঘটনার তারিখ: ${incidentDate}` : `Incident Date: ${incidentDate}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <Clock className="w-4 h-4 text-muted shrink-0" />
            <span>
              {language === 'bn' ? `প্রকাশ: ${publishedDate}` : `Published: ${publishedDate}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted font-mono text-[14px]">
            <span>{language === 'bn' ? 'আইডি:' : 'ID:'}</span>
            <span className="font-semibold text-primary bg-surface-subtle border border-subtle px-2 py-0.5 rounded">
              {report.id}
            </span>
          </div>
        </div>

        {/* Reported Subject Context Block */}
        {report.reportedSubject && (
          <div className="p-4 bg-surface-subtle rounded-xl border border-subtle space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-medium text-secondary text-[14px]">
                <UserX className="w-4 h-4 text-muted" />
                <span>{language === 'bn' ? 'প্রতিবেদনে উল্লেখিত পক্ষ:' : 'Mentioned party:'}</span>
              </div>
              {subjectTargetName && (
                <button
                  type="button"
                  onClick={() => navigateTo(`/subject/${encodeURIComponent(subjectTargetName)}`)}
                  className="text-[14px] font-semibold text-primary hover:underline cursor-pointer min-h-[32px] flex items-center"
                >
                  {language === 'bn' ? 'এই নামে প্রকাশিত প্রতিবেদন দেখুন →' : 'View reports mentioning this party →'}
                </button>
              )}
            </div>
            <div className="text-primary font-semibold text-[16px]">
              {report.reportedSubject}
            </div>
            {report.organization && (
              <p className="text-[14px] text-muted">{report.organization}</p>
            )}
          </div>
        )}

        {/* Summary */}
        {shortDesc && (
          <div className="p-4 rounded-xl bg-surface-subtle border border-subtle space-y-1.5">
            <h2 className="text-[14px] font-semibold text-secondary">
              {language === 'bn' ? 'সারসংক্ষেপ' : 'Summary'}
            </h2>
            <p className="text-[16px] leading-[26px] text-primary">
              {shortDesc}
            </p>
          </div>
        )}

        {/* Full Report Body */}
        <div className="pt-2 space-y-3">
          <h2 className="text-[20px] leading-[30px] font-bold text-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted" />
            <span>{language === 'bn' ? 'প্রতিবেদনের বিবরণ' : 'Report Narrative'}</span>
          </h2>
          <div className="text-[16px] leading-[26px] text-primary space-y-3">
            <p>{fullDesc}</p>
          </div>
        </div>

        {/* Public Images Gallery (if approved and published) */}
        {((report.media && report.media.images && report.media.images.length > 0) || (report.images && report.images.length > 0)) && (
          <ReportMediaGrid images={report.media?.images || report.images || []} language={language} />
        )}

        {/* Supporting Information Section */}
        {evidenceList && evidenceList.length > 0 && (
          <div className="pt-4 border-t border-subtle space-y-3">
            <h3 className="text-[18px] leading-[28px] font-bold text-primary flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-secondary" />
              <span>{language === 'bn' ? 'সহায়ক তথ্য' : 'Supporting information'}</span>
            </h3>
            <ul className="space-y-2 text-[14px] text-secondary">
              {evidenceList.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2.5 bg-surface-subtle p-3 rounded-lg border border-subtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ui-border-strong)] shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[14px] text-muted">
              {language === 'bn'
                ? '* ব্যক্তিগত গোপনীয়তা ও সুরক্ষায় সংবেদনশীল ফাইলসমূহ সার্বজনীনভাবে প্রদর্শিত হয় না।'
                : '* Sensitive contact materials are withheld for privacy.'}
            </p>
          </div>
        )}

        {/* Updates Timeline Section */}
        {report.updates && report.updates.length > 0 && (
          <div className="pt-4 border-t border-subtle space-y-3">
            <h3 className="text-[18px] leading-[28px] font-bold text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted" />
              <span>{language === 'bn' ? 'আপডেট' : 'Updates'}</span>
            </h3>
            <div className="space-y-3">
              {report.updates.map((update, idx) => (
                <div key={idx} className="p-3.5 bg-surface-subtle rounded-lg border border-subtle space-y-1">
                  <div className="flex items-center justify-between text-[14px] font-semibold text-primary">
                    <span>{language === 'bn' ? update.titleBn : update.titleEn}</span>
                    <span className="text-muted">{language === 'bn' ? update.dateBn : update.dateEn}</span>
                  </div>
                  <p className="text-[16px] leading-[26px] text-secondary">
                    {language === 'bn' ? update.contentBn : update.contentEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Published Response from Mentioned Party */}
        {(report.response || storedResponses.length > 0) && (
          <div className="pt-4 border-t border-subtle space-y-3">
            <h3 className="text-[18px] leading-[28px] font-bold text-primary flex items-center gap-2">
              <Scale className="w-4 h-4 text-secondary" />
              <span>{language === 'bn' ? 'সংশ্লিষ্ট পক্ষের প্রকাশিত বক্তব্য' : 'Published response from the mentioned party'}</span>
            </h3>
            {report.response && (
              <div className="p-4 bg-surface-subtle rounded-xl border border-subtle space-y-2">
                <div className="flex items-center justify-between text-[14px] text-primary font-semibold">
                  <span>
                    {language === 'bn' ? report.response.respondentBn : report.response.respondentEn}
                  </span>
                  <span className="text-muted">
                    {language === 'bn' ? report.response.dateBn : report.response.dateEn}
                  </span>
                </div>
                <blockquote className="text-[16px] leading-[26px] text-secondary italic border-l-2 border-subtle pl-3">
                  "{language === 'bn' ? report.response.statementBn : report.response.statementEn}"
                </blockquote>
              </div>
            )}
            {storedResponses.map((resp: any) => (
              <div key={resp.id || resp.internalId} className="p-4 bg-surface-subtle rounded-xl border border-subtle space-y-2">
                <div className="flex items-center justify-between text-[14px] text-primary font-semibold">
                  <span>{resp.responderName} {resp.designation ? `(${resp.designation})` : ''}</span>
                  <span className="text-muted">{new Date(resp.createdAt).toLocaleDateString()}</span>
                </div>
                <blockquote className="text-[16px] leading-[26px] text-secondary italic border-l-2 border-subtle pl-3">
                  "{resp.officialStatement}"
                </blockquote>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* 3. Citizen Participation Action Box */}
      <div className="bg-surface border border-subtle rounded-2xl p-5 md:p-6 space-y-3 shadow-2xs">
        <h3 className="text-[18px] leading-[28px] font-bold text-primary">
          {language === 'bn' ? 'আরও প্রাসঙ্গিক তথ্য আছে?' : 'Can you add context?'}
        </h3>
        <p className="text-[16px] leading-[26px] text-secondary">
          {language === 'bn'
            ? 'আপনার কাছে কি এই ঘটনা সম্পর্কিত অতিরিক্ত তথ্য আছে, কিংবা আপনিও কি একই অভিজ্ঞতার সম্মুখীন হয়েছেন?'
            : 'Do you have additional information or have you experienced a similar situation?'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setCitizenModalType('witness_information')}
            className="px-3.5 py-2.5 rounded-xl border border-subtle bg-surface-subtle hover:bg-surface text-secondary hover:text-primary text-[16px] font-semibold text-center transition-colors min-h-[44px] cursor-pointer"
          >
            {language === 'bn' ? 'আমার কাছে তথ্য আছে' : 'I have information'}
          </button>
          <button
            type="button"
            onClick={() => setCitizenModalType('experienced_similar')}
            className="px-3.5 py-2.5 rounded-xl border border-subtle bg-surface-subtle hover:bg-surface text-secondary hover:text-primary text-[16px] font-semibold text-center transition-colors min-h-[44px] cursor-pointer"
          >
            {language === 'bn' ? 'আমিও ভুক্তভোগী' : 'Experienced similar'}
          </button>
          <button
            type="button"
            onClick={() => setIsSubjectModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-subtle bg-surface-subtle hover:bg-surface text-secondary hover:text-primary text-[16px] font-semibold text-center transition-colors min-h-[44px] cursor-pointer"
          >
            {language === 'bn' ? 'আমি উল্লেখিত পক্ষ' : 'I am mentioned party'}
          </button>
        </div>
      </div>

      {/* 4. Related Reports Section (Below article) */}
      {relatedReports.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] leading-[28px] font-bold text-primary flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-muted" />
              <span>{language === 'bn' ? 'সম্পর্কিত প্রতিবেদন' : 'Related Reports'}</span>
            </h3>
          </div>

          <div className="space-y-3">
            {relatedReports.map((relReport) => (
              <div
                key={relReport.id}
                onClick={() => navigateTo(`/report-detail/${relReport.id}`)}
                className="p-4 bg-surface border border-subtle hover:border-strong rounded-xl space-y-2 cursor-pointer transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <CategoryBadge section={relReport.segment} language={language} size="sm" />
                  <span className="text-[14px] text-muted">
                    {language === 'bn' ? relReport.publishedDateBn : relReport.publishedDateEn}
                  </span>
                </div>
                <h4 className="text-[16px] font-bold text-primary line-clamp-2 leading-snug">
                  {language === 'bn' ? relReport.titleBn : relReport.titleEn}
                </h4>
                <p className="text-[14px] text-secondary line-clamp-2">
                  {language === 'bn' ? relReport.shortDescriptionBn : relReport.shortDescriptionEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citizen Action Modal */}
      {citizenModalType && (
        <CitizenActionModal
          isOpen={true}
          onClose={() => setCitizenModalType(null)}
          reportId={report.id}
          reportTitle={title}
          type={citizenModalType}
          language={language}
        />
      )}

      {/* Subject Response Modal */}
      <SubjectResponseModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        reportId={report.id}
        subjectName={report.reportedSubject || title}
        language={language}
      />
      </div>
    </PublicPageContainer>
  );
};
