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
import { PUBLIC_RESPONSE_DISPLAY_CONNECTED } from '../services/publicResponseService';
import { ReportMediaGrid } from '../components/media/ReportMediaGrid';
import { ReportItem, PublicPublishedResponse } from '../types/report';
import { ReportDetailSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';

export interface ReportDetailPageProps {
  reportId: string;
}

export const ReportDetailPage: React.FC<ReportDetailPageProps> = ({ reportId }) => {
  const { language, navigateTo } = useApp();
  const [isCopied, setIsCopied] = useState(false);
  const [isCitizenModalOpen, setIsCitizenModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [report, setReport] = useState<ReportItem | null>(null);
  const [storedResponses, setStoredResponses] = useState<PublicPublishedResponse[]>([]);
  const [responseLoadError, setResponseLoadError] = useState<boolean>(false);
  const [relatedReports, setRelatedReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<boolean>(false);

  const fetchReport = () => {
    setIsLoading(true);
    setFetchError(false);
    setStoredResponses([]);
    setResponseLoadError(false);

    PublicReportService.getById(reportId)
      .then(async (res) => {
        if (res && res.report) {
          setReport(res.report);
          setStoredResponses(res.responses || []);
          setResponseLoadError(Boolean(res.responseLoadError));

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
          <h1 className="text-[24px] leading-[32px] font-bold text-ui-content-primary">
            {language === 'bn' ? 'প্রতিবেদনটি লোড করা সম্ভব হয়নি' : 'Unable to Load Report'}
          </h1>
          <p className="text-[16px] leading-[26px] text-ui-content-secondary max-w-md mx-auto">
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
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-ui-stroke-subtle hover:bg-ui-surface-subtle text-ui-content-secondary text-[16px] font-semibold transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-2 bg-ui-surface"
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
        <div className="w-14 h-14 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-full flex items-center justify-center mx-auto text-ui-content-muted">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-[24px] leading-[32px] font-bold text-ui-content-primary">
            {language === 'bn' ? 'প্রতিবেদনটি পাওয়া যায়নি বা অনুপলব্ধ' : 'Report Unavailable / Not Found'}
          </h1>
          <p className="text-[16px] leading-[26px] text-ui-content-secondary max-w-md mx-auto">
            {language === 'bn'
              ? 'অনুরোধকৃত প্রতিবেদনটি খুঁজে পাওয়া যায়নি। এটি প্রকাশিত নাও হতে পারে, এখনও পর্যালোচনায় থাকতে পারে অথবা লিংকটি সঠিক নাও হতে পারে।'
              : 'The requested report could not be found. It may not be published, may still be under review, or the link may be invalid.'}
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
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-ui-stroke-subtle hover:bg-ui-surface-subtle text-ui-content-secondary text-[16px] font-semibold transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-2 bg-ui-surface"
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

  const formatResponseDate = (dateStr: string | null | undefined, lang: 'bn' | 'en'): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

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
          className="inline-flex items-center gap-2 text-[16px] leading-[24px] font-medium text-ui-content-secondary hover:text-ui-content-primary bg-ui-surface hover:bg-ui-surface-subtle border border-ui-stroke-subtle px-4 py-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'bn' ? 'তালিকায় ফিরে যান' : 'Back to Reports'}</span>
        </button>

        {/* Quiet Share CTA */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-[16px] font-medium text-ui-content-secondary hover:text-ui-content-primary bg-ui-surface hover:bg-ui-surface-subtle border border-ui-stroke-subtle px-4 py-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px]"
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{language === 'bn' ? 'লিংক কপি হয়েছে' : 'Link Copied'}</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-ui-content-muted" />
              <span>{language === 'bn' ? 'শেয়ার করুন' : 'Share'}</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Main Article Content */}
      <article className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-7 space-y-5 shadow-2xs">
        {/* Category & Subcategory Header */}
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <CategoryBadge section={report.segment} language={language} size="md" />
          <span className="text-ui-content-muted">·</span>
          <span className="font-semibold text-ui-content-primary">
            {subcategory}
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-[32px] leading-[42px] font-bold text-ui-content-primary tracking-tight">
          {title}
        </h1>

        {/* Canonical Unified Metadata Bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-ui-stroke-subtle text-[14px] text-ui-content-secondary">
          <button
            type="button"
            onClick={() => navigateTo(`/location/${report.districtEn.toLowerCase()}`)}
            className="flex items-center gap-1.5 font-medium text-ui-content-primary hover:text-ui-content-primary transition-colors cursor-pointer min-h-[36px]"
          >
            <MapPin className="w-4 h-4 text-ui-content-muted shrink-0" />
            <span className="underline decoration-ui-stroke-subtle">{location}</span>
          </button>
          <div className="flex items-center gap-1.5 text-ui-content-muted">
            <Calendar className="w-4 h-4 text-ui-content-muted shrink-0" />
            <span>
              {language === 'bn' ? `ঘটনার তারিখ: ${incidentDate}` : `Incident Date: ${incidentDate}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-ui-content-muted">
            <Clock className="w-4 h-4 text-ui-content-muted shrink-0" />
            <span>
              {language === 'bn' ? `প্রকাশ: ${publishedDate}` : `Published: ${publishedDate}`}
            </span>
          </div>
        </div>

        {/* Reported Subject Context Block */}
        {report.reportedSubject && (
          <div className="p-4 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-medium text-ui-content-secondary text-[14px]">
                <UserX className="w-4 h-4 text-ui-content-muted" />
                <span>{language === 'bn' ? 'প্রতিবেদনে উল্লেখিত পক্ষ:' : 'Mentioned party:'}</span>
              </div>
              {subjectTargetName && (
                <button
                  type="button"
                  onClick={() => navigateTo(`/subject/${encodeURIComponent(subjectTargetName)}`)}
                  className="text-[14px] font-semibold text-ui-content-primary hover:underline cursor-pointer min-h-[32px] flex items-center"
                >
                  {language === 'bn' ? 'এই নামে প্রকাশিত প্রতিবেদন দেখুন →' : 'View reports mentioning this party →'}
                </button>
              )}
            </div>
            <div className="text-ui-content-primary font-semibold text-[16px]">
              {report.reportedSubject}
            </div>
            {report.organization && (
              <p className="text-[14px] text-ui-content-muted">{report.organization}</p>
            )}
          </div>
        )}

        {/* Summary */}
        {shortDesc && (
          <div className="p-4 rounded-xl bg-ui-surface-subtle border border-ui-stroke-subtle space-y-1.5">
            <h2 className="text-[14px] font-semibold text-ui-content-secondary">
              {language === 'bn' ? 'সারসংক্ষেপ' : 'Summary'}
            </h2>
            <p className="text-[16px] leading-[26px] text-ui-content-primary">
              {shortDesc}
            </p>
          </div>
        )}

        {/* Full Report Body */}
        <div className="pt-2 space-y-3">
          <h2 className="text-[20px] leading-[30px] font-bold text-ui-content-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-ui-content-muted" />
            <span>{language === 'bn' ? 'প্রতিবেদনের বিবরণ' : 'Report Narrative'}</span>
          </h2>
          <div className="text-[16px] leading-[26px] text-ui-content-primary space-y-3">
            <p>{fullDesc}</p>
          </div>
        </div>

        {/* Public Images Gallery (if approved and published) */}
        {((report.media && report.media.images && report.media.images.length > 0) || (report.images && report.images.length > 0)) && (
          <ReportMediaGrid images={report.media?.images || report.images || []} language={language} />
        )}

        {/* Supporting Information Section */}
        {evidenceList && evidenceList.length > 0 && (
          <div className="pt-4 border-t border-ui-stroke-subtle space-y-3">
            <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-ui-content-secondary" />
              <span>{language === 'bn' ? 'সহায়ক তথ্য' : 'Supporting information'}</span>
            </h3>
            <ul className="space-y-2 text-[14px] text-ui-content-secondary">
              {evidenceList.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2.5 bg-ui-surface-subtle p-3 rounded-lg border border-ui-stroke-subtle">
                  <span className="w-1.5 h-1.5 rounded-full bg-ui-stroke-strong shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[14px] text-ui-content-muted">
              {language === 'bn'
                ? '* ব্যক্তিগত গোপনীয়তা ও সুরক্ষায় সংবেদনশীল ফাইলসমূহ সার্বজনীনভাবে প্রদর্শিত হয় না।'
                : '* Sensitive contact materials are withheld for privacy.'}
            </p>
          </div>
        )}

        {/* Updates Timeline Section */}
        {report.updates && report.updates.length > 0 && (
          <div className="pt-4 border-t border-ui-stroke-subtle space-y-3">
            <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-ui-content-muted" />
              <span>{language === 'bn' ? 'আপডেট' : 'Updates'}</span>
            </h3>
            <div className="space-y-3">
              {report.updates.map((update, idx) => (
                <div key={idx} className="p-3.5 bg-ui-surface-subtle rounded-lg border border-ui-stroke-subtle space-y-1">
                  <div className="flex items-center justify-between text-[14px] font-semibold text-ui-content-primary">
                    <span>{language === 'bn' ? update.titleBn : update.titleEn}</span>
                    <span className="text-ui-content-muted">{language === 'bn' ? update.dateBn : update.dateEn}</span>
                  </div>
                  <p className="text-[16px] leading-[26px] text-ui-content-secondary">
                    {language === 'bn' ? update.contentBn : update.contentEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Published Responses Section */}
        {((report.response || storedResponses.length > 0) || (PUBLIC_RESPONSE_DISPLAY_CONNECTED && responseLoadError)) && (
          <div className="pt-4 border-t border-ui-stroke-subtle space-y-3">
            <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary flex items-center gap-2">
              <Scale className="w-4 h-4 text-ui-content-secondary" />
              <span>{language === 'bn' ? 'প্রকাশিত প্রতিক্রিয়া' : 'Published responses'}</span>
            </h3>

            {/* Error UI when responses failed to load and connection gate is active */}
            {PUBLIC_RESPONSE_DISPLAY_CONNECTED && responseLoadError && (
              <div className="p-3.5 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[14px]">
                <span className="text-ui-content-secondary">
                  {language === 'bn'
                    ? 'প্রকাশিত প্রতিক্রিয়াগুলো লোড করা যায়নি।'
                    : 'Published responses could not be loaded.'}
                </span>
                <button
                  type="button"
                  onClick={fetchReport}
                  className="min-h-[44px] px-3.5 py-2 text-[14px] font-semibold text-ui-content-primary bg-ui-surface border border-ui-stroke-subtle rounded-lg hover:bg-ui-surface-subtle transition-colors cursor-pointer inline-flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-ui-stroke-strong"
                >
                  {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
                </button>
              </div>
            )}

            {/* Legacy report.response Card */}
            {report.response && (
              <div className="p-4 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2">
                <div className="flex items-center justify-between text-[14px] text-ui-content-primary font-semibold">
                  <span>
                    {language === 'bn' ? report.response.respondentBn : report.response.respondentEn}
                  </span>
                  <span className="text-ui-content-muted">
                    {language === 'bn' ? report.response.dateBn : report.response.dateEn}
                  </span>
                </div>
                <blockquote className="text-[16px] leading-[26px] text-ui-content-secondary italic border-l-2 border-ui-stroke-subtle pl-3 break-words">
                  "{language === 'bn' ? report.response.statementBn : report.response.statementEn}"
                </blockquote>
              </div>
            )}

            {/* Canonical Published Responses Cards */}
            {storedResponses.map((resp) => {
              if (resp.responseType === 'citizen_information') {
                return (
                  <div key={resp.id} className="p-4 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
                      <span className="font-semibold text-ui-content-primary">
                        {language === 'bn' ? 'তথ্য / অভিজ্ঞতা' : 'Information / Experience'}
                      </span>
                      <div className="flex flex-wrap items-center gap-3 text-ui-content-muted text-[13px]">
                        {resp.incidentDate && (
                          <span>
                            {language === 'bn' ? 'ঘটনার তারিখ: ' : 'Incident date: '}
                            {formatResponseDate(resp.incidentDate, language)}
                          </span>
                        )}
                        {resp.publishedAt && (
                          <span>
                            {language === 'bn' ? 'প্রকাশিত: ' : 'Published: '}
                            {formatResponseDate(resp.publishedAt, language)}
                          </span>
                        )}
                      </div>
                    </div>
                    <blockquote className="text-[16px] leading-[26px] text-ui-content-secondary italic border-l-2 border-ui-stroke-subtle pl-3 break-words whitespace-pre-line">
                      "{resp.content}"
                    </blockquote>
                  </div>
                );
              }

              // Canonical Subject Response Card
              const subtitleParts: string[] = [];
              if (resp.designation) subtitleParts.push(resp.designation);
              if (resp.organizationName) subtitleParts.push(resp.organizationName);

              return (
                <div key={resp.id} className="p-4 bg-ui-surface-subtle rounded-xl border border-ui-stroke-subtle space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2 text-[14px]">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-ui-content-primary">
                        {language === 'bn' ? 'উল্লেখিত ব্যক্তি / পক্ষ' : 'Mentioned Person / Party'}
                      </div>
                      {resp.responderName && (
                        <div className="text-[14px] font-medium text-ui-content-secondary break-words">
                          {resp.responderName}
                          {subtitleParts.length > 0 && (
                            <span className="text-ui-content-muted font-normal"> ({subtitleParts.join(', ')})</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-ui-content-muted text-[13px]">
                      {resp.incidentDate && (
                        <span>
                          {language === 'bn' ? 'ঘটনার তারিখ: ' : 'Incident date: '}
                          {formatResponseDate(resp.incidentDate, language)}
                        </span>
                      )}
                      {resp.publishedAt && (
                        <span>
                          {language === 'bn' ? 'প্রকাশিত: ' : 'Published: '}
                          {formatResponseDate(resp.publishedAt, language)}
                        </span>
                      )}
                    </div>
                  </div>
                  <blockquote className="text-[16px] leading-[26px] text-ui-content-secondary italic border-l-2 border-ui-stroke-subtle pl-3 break-words whitespace-pre-line">
                    "{resp.content}"
                  </blockquote>
                </div>
              );
            })}
          </div>
        )}
      </article>

      {/* 3. Citizen Participation Action Box */}
      <div className="bg-ui-surface border border-ui-stroke-subtle rounded-2xl p-5 md:p-6 space-y-3 shadow-2xs">
        <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary">
          {language === 'bn' ? 'এই প্রতিবেদন সম্পর্কে কিছু জানেন?' : 'Do you know something about this report?'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setIsCitizenModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-ui-stroke-subtle bg-ui-surface-subtle hover:bg-ui-surface text-ui-content-secondary hover:text-ui-content-primary text-[16px] font-semibold text-center transition-colors min-h-[44px] cursor-pointer"
          >
            {language === 'bn'
              ? 'আমার কাছে তথ্য আছে / আমিও ভুক্তভোগী'
              : 'I have information / I experienced this too'}
          </button>
          <button
            type="button"
            onClick={() => setIsSubjectModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-ui-stroke-subtle bg-ui-surface-subtle hover:bg-ui-surface text-ui-content-secondary hover:text-ui-content-primary text-[16px] font-semibold text-center transition-colors min-h-[44px] cursor-pointer"
          >
            {language === 'bn' ? 'আমি উল্লেখিত ব্যক্তি বা পক্ষ' : 'I’m the person or party mentioned'}
          </button>
        </div>
      </div>

      {/* 4. Related Reports Section (Below article) */}
      {relatedReports.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] leading-[28px] font-bold text-ui-content-primary flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-ui-content-muted" />
              <span>{language === 'bn' ? 'সম্পর্কিত প্রতিবেদন' : 'Related Reports'}</span>
            </h3>
          </div>

          <div className="space-y-3">
            {relatedReports.map((relReport) => (
              <div
                key={relReport.id}
                onClick={() => navigateTo(`/report-detail/${relReport.id}`)}
                className="p-4 bg-ui-surface border border-ui-stroke-subtle hover:border-ui-stroke-strong rounded-xl space-y-2 cursor-pointer transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <CategoryBadge section={relReport.segment} language={language} size="sm" />
                  <span className="text-[14px] text-ui-content-muted">
                    {language === 'bn' ? relReport.publishedDateBn : relReport.publishedDateEn}
                  </span>
                </div>
                <h4 className="text-[16px] font-bold text-ui-content-primary line-clamp-2 leading-snug">
                  {language === 'bn' ? relReport.titleBn : relReport.titleEn}
                </h4>
                <p className="text-[14px] text-ui-content-secondary line-clamp-2">
                  {language === 'bn' ? relReport.shortDescriptionBn : relReport.shortDescriptionEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citizen Action Modal */}
      <CitizenActionModal
        isOpen={isCitizenModalOpen}
        onClose={() => setIsCitizenModalOpen(false)}
        reportId={report.id}
        reportTitle={title}
        language={language}
      />

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
