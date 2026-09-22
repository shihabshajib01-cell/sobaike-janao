import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileCheck,
  Home,
  Layers,
  MapPin,
  Scale,
  Share2,
  UserX,
  Zap,
} from 'lucide-react';
import { formatBillingMonth, toBanglaDigits } from '../utils/formatters';
import { CategoryBadge } from '../components/ui/CategoryBadge';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { CitizenActionModal } from '../components/report-detail/CitizenActionModal';
import { SubjectResponseModal } from '../components/report-detail/SubjectResponseModal';
import { PublicReportService } from '../services/publicReportService';
import { PublicEngagementService } from '../services/publicEngagementService';
import { PUBLIC_RESPONSE_DISPLAY_CONNECTED } from '../services/publicResponseService';
import { ReportMediaGrid } from '../components/media/ReportMediaGrid';
import { ReportItem, PublicPublishedResponse, PublicConfiguredReportField } from '../types/report';
import { ReportDetailSkeleton } from '../components/ui/LoadingSkeleton';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';
import { useSeo } from '../components/seo/SeoManager';
import {
  BRAND_NAME,
  buildBrandedSeoTitle,
  buildReportSeoTitle,
  isSeoIndexableReportContent,
  normalizeSeoDescription,
} from '../lib/seo';
import { HarassmentContextSummary } from '../components/report/HarassmentContextSummary';
import { getBriberyDepartmentLabel } from '../data/briberyOptions';

export interface ReportDetailPageProps {
  reportId: string;
}

const goBackWithFallback = (fallback: () => void) => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  fallback();
};

export const ReportDetailPage: React.FC<ReportDetailPageProps> = ({ reportId }) => {
  const { language, navigateTo } = useApp();
  const { setDynamicSeo } = useSeo();
  const [isCopied, setIsCopied] = useState(false);
  const [isCitizenModalOpen, setIsCitizenModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [report, setReport] = useState<ReportItem | null>(null);
  const [storedResponses, setStoredResponses] = useState<PublicPublishedResponse[]>([]);
  const [configuredFields, setConfiguredFields] = useState<PublicConfiguredReportField[]>([]);
  const [responseLoadError, setResponseLoadError] = useState<boolean>(false);
  const [showAllResponses, setShowAllResponses] = useState(false);
  const [relatedReports, setRelatedReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [viewCount, setViewCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);

  const fetchReport = () => {
    setIsLoading(true);
    setFetchError(false);
    setStoredResponses([]);
    setConfiguredFields([]);
    setResponseLoadError(false);

    PublicReportService.getById(reportId)
      .then(async (res) => {
        if (res && res.report) {
          setReport(res.report);
          setStoredResponses(res.responses || []);
          setResponseLoadError(Boolean(res.responseLoadError));
          const fields = await PublicReportService.getConfiguredFields(res.report.id);
          setConfiguredFields(fields);

          if (
            res.report.relatedReportIds &&
            Array.isArray(res.report.relatedReportIds) &&
            res.report.relatedReportIds.length > 0
          ) {
            try {
              const related = await PublicReportService.getRelatedReports(
                res.report.id,
                res.report.relatedReportIds
              );
              setRelatedReports(related.slice(0, 3));
            } catch (error) {
              console.warn('[ReportDetailPage related reports error]', error);
              setRelatedReports([]);
            }
          } else {
            setRelatedReports([]);
          }
        } else {
          setReport(null);
        }
      })
      .catch((error) => {
        console.warn('[ReportDetailPage API fetch error]', error);
        setFetchError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  useEffect(() => {
    let active = true;
    PublicEngagementService.getCounts(reportId).then((counts) => {
      if (!active) return;
      setViewCount(counts.viewCount);
      setShareCount(counts.shareCount);
    });
    return () => {
      active = false;
    };
  }, [reportId]);

  useEffect(() => {
    if (isLoading) return;

    if (report) {
      const publicTitle = language === 'bn' ? report.titleBn : report.titleEn;
      const bnDescription = report.shortDescriptionBn || report.fullDescriptionBn || '';
      const enDescription = report.shortDescriptionEn || report.fullDescriptionEn || '';
      const rawDescription =
        language === 'bn'
          ? bnDescription
          : enDescription &&
              enDescription !== bnDescription &&
              enDescription.trim().length >= 50
            ? enDescription
            : `Published citizen report about ${report.titleEn || report.titleBn}. Review the report details, location, available sources, public-interest context, and the latest updates on Sobaike Janao.`;

      const description = normalizeSeoDescription(rawDescription, language);
      const indexable = isSeoIndexableReportContent(
        report.titleBn,
        report.titleEn,
        bnDescription,
        enDescription
      );

      setDynamicSeo({
        title: buildReportSeoTitle(publicTitle, BRAND_NAME[language], report.id),
        description,
        robots: indexable
          ? 'index, follow, max-image-preview:large'
          : 'noindex, follow',
        ogType: 'article',
        ogSiteName: BRAND_NAME[language],
        canonicalPath: `/report-detail/${encodeURIComponent(report.id)}`,
        image: report.images?.[0]?.url,
        imageAlt: publicTitle,
        pageType: 'article',
        publishedTime: report.publishedAt || undefined,
        modifiedTime: report.updatedAt || report.publishedAt || undefined,
      });
      return;
    }

    setDynamicSeo({
      title: buildBrandedSeoTitle(
        language === 'bn' ? 'প্রতিবেদনটি পাওয়া যায়নি' : 'Report unavailable',
        BRAND_NAME[language]
      ),
      description:
        language === 'bn'
          ? 'অনুরোধকৃত প্রতিবেদনটি পাওয়া যায়নি বা অনুপলব্ধ।'
          : 'The requested report could not be found or is unavailable.',
      robots: 'noindex, follow',
      ogType: 'website',
      ogSiteName: BRAND_NAME[language],
      canonicalPath: `/report-detail/${encodeURIComponent(reportId)}`,
      pageType: 'website',
    });
  }, [report, reportId, isLoading, language, setDynamicSeo]);

  if (isLoading) {
    return (
      <PublicPageContainer
        id="report-detail-loading-container"
        className="w-full max-w-[900px] mx-auto"
      >
        <ReportDetailSkeleton id="report-detail-loading-skeleton" language={language} />
      </PublicPageContainer>
    );
  }

  if (fetchError) {
    return (
      <PublicPageContainer
        id="report-detail-error-container"
        className="w-full max-w-[900px] mx-auto"
      >
        <div role="alert" className="w-full py-12 text-center space-y-6">
          <div className="w-14 h-14 bg-ui-error-bg border border-ui-error-border ui-radius-pill flex items-center justify-center mx-auto text-ui-error-text">
            <AlertCircle className="w-7 h-7" aria-hidden="true" />
          </div>

          <h1 className="type-h2 text-ui-content-primary">
            {language === 'bn' ? 'প্রতিবেদন লোড করা যায়নি' : "Couldn't load report"}
          </h1>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={fetchReport}
              className="w-full md:w-auto"
            >
              {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => goBackWithFallback(() => navigateTo('/'))}
              leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
              className="hidden md:inline-flex"
            >
              {language === 'bn' ? 'ফিরে যান' : 'Go back'}
            </Button>
          </div>
        </div>
      </PublicPageContainer>
    );
  }

  if (!report) {
    return (
      <PublicPageContainer
        id="report-detail-not-found-container"
        className="w-full max-w-[900px] mx-auto"
      >
        <div role="alert" className="w-full py-12 text-center space-y-6">
          <div className="w-14 h-14 bg-ui-surface-subtle border border-ui-stroke-subtle ui-radius-pill flex items-center justify-center mx-auto text-ui-content-muted">
            <AlertCircle className="w-7 h-7" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="type-h2 text-ui-content-primary">
              {language === 'bn' ? 'প্রতিবেদন পাওয়া যায়নি' : 'Report not found'}
            </h1>
            <p className="type-body text-ui-content-secondary max-w-[480px] mx-auto">
              {language === 'bn'
                ? 'প্রতিবেদনটি অনুপলব্ধ হতে পারে বা লিংকটি সঠিক নয়।'
                : 'This report may be unavailable or the link may be incorrect.'}
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => goBackWithFallback(() => navigateTo('/'))}
              leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
              className="hidden md:inline-flex"
            >
              {language === 'bn' ? 'ফিরে যান' : 'Go back'}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigateTo('/')}
              leftIcon={<Home className="w-4 h-4" aria-hidden="true" />}
              className="w-full md:w-auto"
            >
              {language === 'bn' ? 'মূল পাতায় ফিরুন' : 'Back to home'}
            </Button>
          </div>
        </div>
      </PublicPageContainer>
    );
  }

  const title = language === 'bn' ? report.titleBn : report.titleEn;
  const shortDesc = language === 'bn' ? report.shortDescriptionBn : report.shortDescriptionEn;
  const fullDesc = language === 'bn' ? report.fullDescriptionBn : report.fullDescriptionEn;
  const detailText = fullDesc || shortDesc;
  const verifiedSources = (report.sources || []).filter(
    (source) => source.publisherName && source.canonicalUrl
  );
  const hasVerifiedSources = verifiedSources.length > 0;
  const subcategory = language === 'bn' ? report.subcategoryBn : report.subcategoryEn;
  const location = language === 'bn' ? report.locationBn : report.locationEn;
  const incidentDateRaw = language === 'bn' ? report.incidentDateBn : report.incidentDateEn;
  const incidentDate =
    incidentDateRaw && incidentDateRaw !== 'undefined' && incidentDateRaw !== 'null'
      ? incidentDateRaw
      : language === 'bn'
      ? 'ঘটনার তারিখ দেওয়া হয়নি'
      : 'Incident date not provided';
  const evidenceList = language === 'bn' ? report.evidenceSummaryBn : report.evidenceSummaryEn;
  const subjectTargetName =
    report.reportedSubjectEn || report.reportedSubjectBn || report.reportedSubject || '';
  const hasPublishedResponses =
    Boolean(report.response) ||
    storedResponses.length > 0 ||
    (PUBLIC_RESPONSE_DISPLAY_CONNECTED && responseLoadError);

  const formatResponseDate = (
    dateStr: string | null | undefined,
    lang: 'bn' | 'en'
  ): string => {
    if (!dateStr) return '';

    try {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const publishedResponseItems = [
    ...(report.response
      ? [{
          id: 'report-response',
          type: 'legacy' as const,
          label: language === 'bn' ? report.response.respondentBn : report.response.respondentEn,
          name: '',
          subtitle: '',
          incidentDate: '',
          publishedDate: language === 'bn' ? report.response.dateBn : report.response.dateEn,
          content: language === 'bn' ? report.response.statementBn : report.response.statementEn,
        }]
      : []),
    ...storedResponses.map((response) => ({
      id: response.id,
      type: response.responseType,
      label:
        response.responseType === 'citizen_information'
          ? language === 'bn' ? 'তথ্য বা অভিজ্ঞতা' : 'Information / experience'
          : language === 'bn' ? 'উল্লেখিত ব্যক্তি বা পক্ষ' : 'Mentioned person / party',
      name: response.responseType === 'citizen_information' ? '' : response.responderName || '',
      subtitle: [response.designation, response.organizationName].filter(Boolean).join(', '),
      incidentDate: response.incidentDate ? formatResponseDate(response.incidentDate, language) : '',
      publishedDate: response.publishedAt ? formatResponseDate(response.publishedAt, language) : '',
      content: response.content,
    })),
  ];
  const visiblePublishedResponses = showAllResponses
    ? publishedResponseItems
    : publishedResponseItems.slice(0, 3);
  const hiddenResponseCount = Math.max(0, publishedResponseItems.length - 3);

  const displayEngagementCount = (value: number) =>
    language === 'bn' ? toBanglaDigits(value) : value.toLocaleString();

  const formatConfiguredValue = (
    value: unknown,
    options: Array<{ value: string; labelEn: string; labelBn: string }> = []
  ): string => {
    const formatOption = (item: unknown) => {
      const raw = String(item ?? '');
      const option = options.find((entry) => entry.value === raw);
      return option ? (language === 'bn' ? option.labelBn : option.labelEn) : raw;
    };

    if (Array.isArray(value)) return value.map(formatOption).join(', ');
    if (typeof value === 'boolean') {
      return value
        ? language === 'bn'
          ? 'হ্যাঁ'
          : 'Yes'
        : language === 'bn'
          ? 'না'
          : 'No';
    }
    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>)
        .filter((item) => item !== null && item !== undefined && String(item).trim() !== '')
        .map((item) => String(item))
        .join(', ');
    }
    return formatOption(value);
  };

  const relativePublishedTime = (() => {
    if (!report.publishedAt) return language === 'bn' ? report.publishedDateBn : report.publishedDateEn;
    const published = new Date(report.publishedAt).getTime();
    const diff = Date.now() - published;
    if (!Number.isFinite(published) || diff < 0) return language === 'bn' ? report.publishedDateBn : report.publishedDateEn;
    const minutes = Math.max(1, Math.floor(diff / 60000));
    if (minutes < 60) {
      const n = language === 'bn' ? toBanglaDigits(minutes) : minutes;
      return language === 'bn' ? `${n} মিনিট আগে` : `${n} min ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      const n = language === 'bn' ? toBanglaDigits(hours) : hours;
      return language === 'bn' ? `${n} ঘণ্টা আগে` : `${n} hr ago`;
    }
    const days = Math.floor(hours / 24);
    const n = language === 'bn' ? toBanglaDigits(days) : days;
    return language === 'bn' ? `${n} দিন আগে` : `${n} days ago`;
  })();

  const registerShare = () => {
    void PublicEngagementService.trackShare(report.id).then((counts) => {
      if (!counts) return;
      setViewCount(counts.viewCount);
      setShareCount(counts.shareCount);
    });
  };

  const openRelatedReport = (relatedReportId: string) => {
    void PublicEngagementService.trackView(relatedReportId);
    navigateTo(`/report-detail/${relatedReportId}`);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    const markCopied = () => {
      registerShare();
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    };

    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
        registerShare();
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        markCopied();
        return;
      }

      // Compatibility fallback for older and embedded browsers where the
      // asynchronous Clipboard API is unavailable.
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (copied) {
        markCopied();
      } else {
        throw new Error('Copy command was not supported.');
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        console.warn('[ReportDetailPage share error]', error);
      }
    }
  };

  return (
    <PublicPageContainer
      id="report-detail-page-container"
      className="w-full max-w-[900px] mx-auto"
    >
      <div className="w-full space-y-4 md:space-y-5">
        <div className="flex items-center justify-between gap-3 md:gap-4">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => goBackWithFallback(() => navigateTo('/'))}
            leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
          >
            {language === 'bn' ? 'তালিকায় ফিরুন' : 'Back to reports'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleShare}
            leftIcon={
              isCopied ? (
                <Check className="w-4 h-4 text-ui-success-text" aria-hidden="true" />
              ) : (
                <Share2 className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
              )
            }
            className={isCopied ? 'text-ui-success-text' : ''}
          >
            {isCopied
              ? language === 'bn'
                ? 'লিংক কপি হয়েছে'
                : 'Link copied'
              : language === 'bn'
              ? 'শেয়ার করুন'
              : 'Share'}
          </Button>
        </div>

        <article className="bg-ui-surface ui-border-default border-ui-stroke-subtle ui-radius-card p-5 md:p-6 space-y-5 ui-elevation-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 type-meta min-w-0">
              <CategoryBadge section={report.segment} language={language} size="md" />
              <span className="text-ui-content-muted">·</span>
              <span className="font-[var(--font-weight-semibold)] text-ui-content-primary">{subcategory}</span>
            </div>
            <span className="type-meta text-ui-content-secondary shrink-0 pt-1">{relativePublishedTime}</span>
          </div>

          <h1 className="type-h1 text-ui-content-primary tracking-tight">{title}</h1>

          {detailText && (
            <div className="max-w-[760px] type-body text-ui-content-primary leading-7">
              <p className="whitespace-pre-line">{detailText}</p>
            </div>
          )}

          {hasVerifiedSources && (
            <div className="max-w-[760px] type-compact text-ui-content-primary space-y-3">
              {verifiedSources.map((source, index) => (
                <div key={`${source.canonicalUrl}-${index}`} className="space-y-1">
                  <p>
                    <span className="font-[var(--font-weight-semibold)]">
                      {verifiedSources.length > 1
                        ? language === 'bn'
                          ? `উৎস ${toBanglaDigits(index + 1)}`
                          : `Source ${index + 1}`
                        : language === 'bn'
                          ? 'উৎস'
                          : 'Source'}:
                    </span>{' '}
                    {source.publisherName || (language === 'bn' ? 'মূল সূত্র' : 'Original source')}
                  </p>
                  <p className="break-all select-text">{source.canonicalUrl}</p>
                </div>
              ))}
            </div>
          )}

          <p className="max-w-[760px] type-meta text-ui-content-muted">
            {language === 'bn'
              ? hasVerifiedSources
                ? 'প্রকাশের আগে প্রতিবেদনটি মডারেশন করা হয়েছে এবং উপরের লিংকগুলো মূল উৎস হিসেবে দেখানো হয়েছে। প্রকাশিত হওয়া কোনো অভিযোগের সরকারি বা বিচারিক সত্যতা প্রমাণ করে না।'
                : 'এটি একটি মডারেটেড নাগরিক প্রতিবেদন। প্রকাশিত হওয়া কোনো অভিযোগের সরকারি বা বিচারিক সত্যতা প্রমাণ করে না; তথ্য, প্রেক্ষাপট ও পরবর্তী আপডেট একসঙ্গে বিবেচনা করুন।'
              : hasVerifiedSources
                ? 'This report was moderated before publication and the links above are shown as its source references. Publication does not mean an allegation has been proven by a court or government authority.'
                : 'This is a moderated citizen report. Publication does not mean an allegation has been proven by a court or government authority; consider the report details, context, and later updates together.'}
          </p>

          <div className="border-t border-ui-divider" aria-hidden="true" />

          <div className="flex items-center justify-between gap-4 type-meta text-ui-content-secondary min-w-0">
            {location && (
              report.districtEn ? (
                <button type="button" onClick={() => navigateTo(`/location/${report.districtEn.toLowerCase()}`)}
                  className="flex items-center gap-1.5 min-w-0 font-[var(--font-weight-medium)] text-ui-content-secondary min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ui-radius-badge-md">
                  <MapPin className="w-[18px] h-[18px] text-ui-content-secondary shrink-0" aria-hidden="true" />
                  <span className="truncate">{location}</span>
                </button>
              ) : (
                <span className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-[18px] h-[18px] text-ui-content-secondary shrink-0" aria-hidden="true" />
                  <span className="truncate">{location}</span>
                </span>
              )
            )}
            <div className="flex items-center gap-3 shrink-0">
              <span className="h-5 border-l border-ui-divider" aria-hidden="true" />
              <span className="flex items-center gap-1.5" aria-label={`${displayEngagementCount(viewCount)} ${language === 'bn' ? 'ভিউ' : 'views'}`}>
                <Eye className="w-[18px] h-[18px] text-ui-content-secondary shrink-0" aria-hidden="true" />
                <span>{displayEngagementCount(viewCount)}</span>
              </span>
              <span className="h-5 border-l border-ui-divider" aria-hidden="true" />
              <span className="flex items-center gap-1.5" aria-label={`${displayEngagementCount(shareCount)} ${language === 'bn' ? 'শেয়ার' : 'shares'}`}>
                <Share2 className="w-[18px] h-[18px] text-ui-content-secondary shrink-0" aria-hidden="true" />
                <span>{displayEngagementCount(shareCount)}</span>
              </span>
            </div>
          </div>

          {/* Source-grounded reports must not display citizen-form classifications unless those answers were actually captured through the configured form. */}
          {!hasVerifiedSources && <HarassmentContextSummary report={report} language={language} />}

          {report.reportedSubject && (
            <div className="p-4 bg-ui-surface-subtle ui-radius-control ui-border-default border-ui-stroke-subtle space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-[var(--font-weight-medium)] text-ui-content-secondary type-meta">
                  <UserX className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
                  <span>{language === 'bn' ? 'প্রতিবেদনে উল্লেখিত পক্ষ:' : 'Mentioned party:'}</span>
                </div>
                {subjectTargetName && (
                  <button
                    type="button"
                    onClick={() => navigateTo(`/subject/${encodeURIComponent(subjectTargetName)}`)}
                    className="type-meta font-[var(--font-weight-semibold)] text-ui-content-primary hover:underline cursor-pointer min-h-[44px] flex items-center px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ui-radius-badge-md"
                  >
                    {language === 'bn'
                      ? 'এই নামে প্রকাশিত প্রতিবেদন দেখুন →'
                      : 'View reports mentioning this party →'}
                  </button>
                )}
              </div>
              <p className="type-label font-[var(--font-weight-semibold)] text-ui-content-primary">
                {report.reportedSubject}
              </p>
              {report.organization && (
                <p className="type-meta text-ui-content-muted">{report.organization}</p>
              )}
            </div>
          )}

          {(report.recentBillMonth || report.recentBillAmount !== undefined) && (
            <div className="p-4 bg-ui-surface-subtle ui-radius-control ui-border-default border-ui-stroke-subtle space-y-3">
              <p className="type-meta font-[var(--font-weight-semibold)] text-ui-content-secondary flex items-center gap-2">
                <Zap className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
                <span>
                  {language === 'bn'
                    ? 'বিদ্যুৎ বিল সংক্রান্ত বিবরণ'
                    : 'Electricity billing details'}
                </span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-ui-surface ui-radius-badge-md ui-border-default border-ui-stroke-subtle space-y-1">
                  <span className="type-meta text-ui-content-muted block">
                    {language === 'bn'
                      ? 'সাম্প্রতিক বিলের মাস ও পরিমাণ'
                      : 'Recent bill month & amount'}
                  </span>
                  <p className="type-label font-[var(--font-weight-bold)] text-ui-content-primary">
                    {report.recentBillMonth
                      ? formatBillingMonth(report.recentBillMonth, language)
                      : '-'}
                  </p>
                  <p className="type-label font-[var(--font-weight-semibold)] text-ui-error-text">
                    {report.recentBillAmount !== undefined
                      ? `৳ ${
                          language === 'bn'
                            ? toBanglaDigits(report.recentBillAmount)
                            : report.recentBillAmount.toLocaleString()
                        }`
                      : '-'}
                  </p>
                </div>

                <div className="p-3 bg-ui-surface ui-radius-badge-md ui-border-default border-ui-stroke-subtle space-y-1">
                  <span className="type-meta text-ui-content-muted block">
                    {language === 'bn'
                      ? 'পূর্ববর্তী বিলের মাস ও পরিমাণ'
                      : 'Previous bill month & amount'}
                  </span>
                  <p className="type-label font-[var(--font-weight-bold)] text-ui-content-primary">
                    {report.previousBillMonth
                      ? formatBillingMonth(report.previousBillMonth, language)
                      : '-'}
                  </p>
                  <p className="type-label font-[var(--font-weight-semibold)] text-ui-content-secondary">
                    {report.previousBillAmount !== undefined
                      ? `৳ ${
                          language === 'bn'
                            ? toBanglaDigits(report.previousBillAmount)
                            : report.previousBillAmount.toLocaleString()
                        }`
                      : '-'}
                  </p>
                </div>
              </div>

              {report.recentBillAmount !== undefined &&
                report.previousBillAmount !== undefined && (
                  <div className="flex items-center gap-2 type-meta text-ui-content-secondary pt-2 border-t border-ui-divider">
                    <span className="text-ui-content-muted">
                      {language === 'bn' ? 'পার্থক্য বা বৃদ্ধি:' : 'Difference / increase:'}
                    </span>
                    <span className="font-[var(--font-weight-semibold)] text-ui-error-text">
                      +৳{' '}
                      {language === 'bn'
                        ? toBanglaDigits(
                            Math.max(0, report.recentBillAmount - report.previousBillAmount)
                          )
                        : Math.max(
                            0,
                            report.recentBillAmount - report.previousBillAmount
                          ).toLocaleString()}
                      {report.previousBillAmount > 0 && (
                        <span className="ml-1 font-[var(--font-weight-regular)] text-ui-content-muted">
                          (
                          {Math.round(
                            ((report.recentBillAmount - report.previousBillAmount) /
                              report.previousBillAmount) *
                              100
                          )}
                          % {language === 'bn' ? 'বৃদ্ধি' : 'increase'})
                        </span>
                      )}
                    </span>
                  </div>
                )}
            </div>
          )}

          {report.segment === 'extortion' &&
            report.subcategoryId !== 'bribe-demanded-service' &&
            (report.incidentTime || report.frequency) && (
              <div
                id="extortion-timeline-details"
                className="pt-4 border-t border-ui-divider flex flex-wrap gap-x-5 gap-y-2 type-meta text-ui-content-secondary"
              >
                {report.incidentTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
                    {language === 'bn' ? `সময়: ${report.incidentTime}` : `Time: ${report.incidentTime}`}
                  </span>
                )}
                {report.frequency && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-ui-content-muted">
                      {language === 'bn' ? 'পুনরাবৃত্তি:' : 'Frequency:'}
                    </span>
                    <span className="font-[var(--font-weight-semibold)] text-ui-content-primary">
                      {report.frequency === 'repeated'
                        ? language === 'bn' ? 'নিয়মিত / একাধিকবার' : 'Repeated / ongoing'
                        : language === 'bn' ? 'এককালীন' : 'One-time'}
                    </span>
                  </span>
                )}
              </div>
            )}

          {report.segment === 'extortion' &&
            report.subcategoryId === 'bribe-demanded-service' &&
            (report.briberyDepartment ||
              report.briberyService ||
              report.briberyAmount !== undefined ||
              report.incidentTime ||
              report.frequency) && (
              <div
                id="bribery-report-details"
                className="pt-4 border-t border-ui-divider space-y-3"
              >
                <h2 className="type-h4 text-ui-content-primary">
                  {language === 'bn' ? 'ঘুষ সংক্রান্ত তথ্য' : 'Bribery details'}
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {report.briberyDepartment && (
                    <div className="p-3 bg-ui-surface-subtle ui-radius-badge-md ui-border-default border-ui-stroke-subtle">
                      <dt className="type-meta text-ui-content-muted">
                        {language === 'bn' ? 'দপ্তর' : 'Department'}
                      </dt>
                      <dd className="mt-1 type-body font-[var(--font-weight-semibold)] text-ui-content-primary break-words">
                        {getBriberyDepartmentLabel(report.briberyDepartment, language)}
                      </dd>
                    </div>
                  )}
                  {report.briberyService && (
                    <div className="p-3 bg-ui-surface-subtle ui-radius-badge-md ui-border-default border-ui-stroke-subtle">
                      <dt className="type-meta text-ui-content-muted">
                        {language === 'bn' ? 'সেবা বা প্রক্রিয়া' : 'Service or process'}
                      </dt>
                      <dd className="mt-1 type-body font-[var(--font-weight-semibold)] text-ui-content-primary break-words">
                        {report.briberyService}
                      </dd>
                    </div>
                  )}
                  {report.briberyAmount !== undefined && (
                    <div className="p-3 bg-ui-surface-subtle ui-radius-badge-md ui-border-default border-ui-stroke-subtle">
                      <dt className="type-meta text-ui-content-muted">
                        {language === 'bn' ? 'টাকার পরিমাণ' : 'Amount (BDT)'}
                      </dt>
                      <dd className="mt-1 type-body font-[var(--font-weight-semibold)] text-ui-content-primary">
                        ৳ {language === 'bn' ? toBanglaDigits(report.briberyAmount) : report.briberyAmount.toLocaleString()}
                      </dd>
                    </div>
                  )}
                  {report.incidentTime && (
                    <div className="p-3 bg-ui-surface-subtle ui-radius-badge-md ui-border-default border-ui-stroke-subtle">
                      <dt className="type-meta text-ui-content-muted">
                        {language === 'bn' ? 'সময়' : 'Time'}
                      </dt>
                      <dd className="mt-1 type-body font-[var(--font-weight-semibold)] text-ui-content-primary">
                        {report.incidentTime}
                      </dd>
                    </div>
                  )}
                  {report.frequency && (
                    <div className="p-3 bg-ui-surface-subtle ui-radius-badge-md ui-border-default border-ui-stroke-subtle">
                      <dt className="type-meta text-ui-content-muted">
                        {language === 'bn' ? 'পুনরাবৃত্তি' : 'Frequency'}
                      </dt>
                      <dd className="mt-1 type-body font-[var(--font-weight-semibold)] text-ui-content-primary">
                        {report.frequency === 'repeated'
                          ? language === 'bn' ? 'নিয়মিত' : 'Repeated'
                          : language === 'bn' ? 'এককালীন' : 'One-time'}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

          {report.incidentTime &&
            report.segment === 'load_shedding' &&
            (report.subcategoryId === 'load-shedding-outage' ||
              report.subcategoryId === 'gas-shortage') && (
              <div className="flex flex-wrap gap-3 type-meta text-ui-content-secondary">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
                  {language === 'bn'
                    ? `বিভ্রাটের শুরু: ${report.incidentTime}`
                    : `Outage started: ${report.incidentTime}`}
                </span>
                {report.utilityEndTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
                    {language === 'bn'
                      ? `বিভ্রাটের সমাপ্তি: ${report.utilityEndTime}`
                      : `Outage ended: ${report.utilityEndTime}`}
                  </span>
                )}
              </div>
            )}

          {configuredFields.length > 0 && (
            <section
              id="configured-report-fields"
              className="pt-4 border-t border-ui-divider space-y-3"
              aria-labelledby="configured-report-fields-title"
            >
              <h3
                id="configured-report-fields-title"
                className="type-h4 text-ui-content-primary"
              >
                {language === 'bn' ? 'অতিরিক্ত তথ্য' : 'Additional information'}
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {configuredFields.map((field) => (
                  <div
                    key={field.fieldKey}
                    className="p-3 bg-ui-surface-subtle ui-radius-badge-md ui-border-default border-ui-stroke-subtle"
                  >
                    <dt className="type-meta text-ui-content-muted">
                      {language === 'bn' ? field.labelBn : field.labelEn}
                    </dt>
                    <dd className="mt-1 type-body font-[var(--font-weight-semibold)] text-ui-content-primary break-words whitespace-pre-wrap">
                      {formatConfiguredValue(field.value, field.options)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {((report.media?.images && report.media.images.length > 0) ||
            (report.images && report.images.length > 0)) && (
            <ReportMediaGrid
              images={report.media?.images || report.images || []}
              language={language}
            />
          )}

          {evidenceList && evidenceList.length > 0 && (
            <div className="pt-4 border-t border-ui-divider space-y-3">
              <h3 className="type-h4 text-ui-content-primary flex items-center gap-2">
                <FileCheck className="w-[18px] h-[18px] text-ui-content-secondary shrink-0" aria-hidden="true" />
                <span>{language === 'bn' ? 'সহায়ক তথ্য' : 'Supporting information'}</span>
              </h3>
              <ul className="space-y-2 type-meta text-ui-content-secondary">
                {evidenceList.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex items-center gap-2.5 bg-ui-surface-subtle p-3 ui-radius-badge-md ui-border-default border-ui-stroke-subtle"
                  >
                    <span className="w-1.5 h-1.5 ui-radius-pill bg-ui-stroke-strong shrink-0" />
                    <span className="font-[var(--font-weight-medium)]">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="type-meta text-ui-content-muted">
                {language === 'bn'
                  ? '* ব্যক্তিগত গোপনীয়তার জন্য সংবেদনশীল তথ্য সার্বজনীনভাবে প্রদর্শিত হয় না।'
                  : '* Sensitive contact materials are withheld for privacy.'}
              </p>
            </div>
          )}

          {report.updates && report.updates.length > 0 && (
            <div className="pt-4 border-t border-ui-divider space-y-3">
              <h3 className="type-h4 text-ui-content-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
                <span>{language === 'bn' ? 'আপডেট' : 'Updates'}</span>
              </h3>
              <div className="space-y-3">
                {report.updates.map((update, index) => (
                  <div
                    key={`${update.dateEn}-${index}`}
                    className="p-3.5 bg-ui-surface-subtle ui-radius-badge-md ui-border-default border-ui-stroke-subtle space-y-1"
                  >
                    <div className="flex items-center justify-between gap-3 type-meta font-[var(--font-weight-semibold)] text-ui-content-primary">
                      <span>{language === 'bn' ? update.titleBn : update.titleEn}</span>
                      <span className="text-ui-content-muted shrink-0">
                        {language === 'bn' ? update.dateBn : update.dateEn}
                      </span>
                    </div>
                    <p className="type-body text-ui-content-secondary">
                      {language === 'bn' ? update.contentBn : update.contentEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        {hasPublishedResponses && (
          <section
            id="published-responses-section"
            className="bg-ui-surface ui-border-default border-ui-stroke-subtle ui-radius-card p-5 md:p-6 space-y-4 ui-elevation-card"
          >
            <h2 className="type-h3 text-ui-content-primary flex items-center gap-2">
              <Scale className="w-5 h-5 text-ui-content-secondary" aria-hidden="true" />
              <span>
                {language === 'bn' ? 'প্রকাশিত প্রতিক্রিয়া' : 'Published responses'}
                {' '}({language === 'bn' ? toBanglaDigits(publishedResponseItems.length) : publishedResponseItems.length})
              </span>
            </h2>

            {PUBLIC_RESPONSE_DISPLAY_CONNECTED && responseLoadError && (
              <div className="p-3.5 bg-ui-surface-subtle ui-radius-control ui-border-default border-ui-stroke-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 type-meta">
                <span className="text-ui-content-secondary">
                  {language === 'bn'
                    ? 'প্রকাশিত প্রতিক্রিয়াগুলো লোড করা যায়নি।'
                    : 'Published responses could not be loaded.'}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={fetchReport}
                  className="shrink-0"
                >
                  {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}
                </Button>
              </div>
            )}

            <div className="divide-y divide-ui-divider">
              {visiblePublishedResponses.map((response) => (
                <article
                  key={response.id}
                  className="py-4 first:pt-0 last:pb-0 bg-transparent rounded-none shadow-none"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-4">
                    <div className="min-w-0">
                      <p className="type-meta font-[var(--font-weight-semibold)] text-ui-content-primary">
                        {response.label}
                      </p>
                      {response.name && (
                        <p className="type-meta text-ui-content-secondary mt-1 break-words">
                          <span className="font-[var(--font-weight-medium)]">{response.name}</span>
                          {response.subtitle && <span className="text-ui-content-secondary"> · {response.subtitle}</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 type-meta text-ui-content-secondary sm:justify-end shrink-0">
                      {response.incidentDate && (
                        <span>{language === 'bn' ? 'ঘটনার তারিখ: ' : 'Incident date: '}{response.incidentDate}</span>
                      )}
                      {response.publishedDate && (
                        <span>{language === 'bn' ? 'প্রকাশিত: ' : 'Published: '}{response.publishedDate}</span>
                      )}
                    </div>
                  </div>
                  <blockquote className="mt-2.5 type-body text-ui-content-primary border-l-2 border-ui-stroke-default pl-3 break-words whitespace-pre-line">
                    “{response.content}”
                  </blockquote>
                </article>
              ))}
            </div>

            {hiddenResponseCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllResponses((current) => !current)}
                className="w-full min-h-[44px] mt-1 flex items-center justify-center gap-2 type-meta font-[var(--font-weight-semibold)] text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle border-t border-ui-divider cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ui-radius-control"
                aria-expanded={showAllResponses}
              >
                <span>
                  {showAllResponses
                    ? language === 'bn' ? 'কম দেখুন' : 'Show less'
                    : language === 'bn'
                    ? `আরও ${toBanglaDigits(hiddenResponseCount)}টি প্রতিক্রিয়া দেখুন`
                    : `Show ${hiddenResponseCount} more response${hiddenResponseCount === 1 ? '' : 's'}`}
                </span>
                {showAllResponses
                  ? <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                  : <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />}
              </button>
            )}
          </section>
        )}

        <section
          id="report-response-action-box"
          className="bg-ui-surface ui-border-default border-ui-stroke-subtle ui-radius-card p-5 md:p-6 space-y-3 ui-elevation-card"
        >
          <h2 className="type-h3 text-ui-content-primary">
            {language === 'bn'
              ? 'এই প্রতিবেদন সম্পর্কে কিছু জানেন?'
              : 'Do you know something about this report?'}
          </h2>

          <p className="type-meta text-ui-content-secondary">
            {language === 'bn'
              ? 'আপনার তথ্য এই ঘটনার সত্যতা যাচাইয়ে সহায়তা করতে পারে।'
              : 'Your information may help verify this report.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <Button
              id="btn-respond-citizen-info"
              type="button"
              variant="primary"
              size="md"
              fullWidth
              onClick={() => setIsCitizenModalOpen(true)}
              className="whitespace-normal"
            >
              {language === 'bn'
                ? 'আমার কাছে তথ্য আছে বা আমিও ভুক্তভোগী'
                : 'I have information / I experienced this too'}
            </Button>
            <Button
              id="btn-respond-subject-party"
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => setIsSubjectModalOpen(true)}
              className="whitespace-normal"
            >
              {language === 'bn'
                ? 'আমি উল্লেখিত ব্যক্তি বা পক্ষ'
                : 'I’m the person or party mentioned'}
            </Button>
          </div>
        </section>

        {relatedReports.length > 0 && (
          <section className="space-y-3 pt-2">
            <h2 className="type-h3 text-ui-content-primary flex items-center gap-1.5">
              <Layers className="w-5 h-5 text-ui-content-muted" aria-hidden="true" />
              <span>{language === 'bn' ? 'সম্পর্কিত প্রতিবেদন' : 'Related reports'}</span>
            </h2>

            <div className="space-y-3">
              {relatedReports.map((relatedReport) => (
                <div
                  key={relatedReport.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openRelatedReport(relatedReport.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openRelatedReport(relatedReport.id);
                    }
                  }}
                  className="p-4 bg-ui-surface ui-border-default border-ui-stroke-subtle hover:border-ui-stroke-strong ui-radius-control space-y-2 cursor-pointer transition-colors ui-elevation-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                >
                  <div className="flex items-center gap-2">
                    <CategoryBadge
                      section={relatedReport.segment}
                      language={language}
                      size="sm"
                    />
                    <span className="type-meta text-ui-content-muted">
                      {language === 'bn'
                        ? relatedReport.publishedDateBn
                        : relatedReport.publishedDateEn}
                    </span>
                  </div>
                  <h3 className="type-h4 text-ui-content-primary line-clamp-2">
                    {language === 'bn' ? relatedReport.titleBn : relatedReport.titleEn}
                  </h3>
                  <p className="type-meta text-ui-content-secondary line-clamp-2">
                    {language === 'bn'
                      ? relatedReport.shortDescriptionBn
                      : relatedReport.shortDescriptionEn}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <CitizenActionModal
          isOpen={isCitizenModalOpen}
          onClose={() => setIsCitizenModalOpen(false)}
          reportId={report.id}
          reportTitle={title}
          language={language}
        />

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