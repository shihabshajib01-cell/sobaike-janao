import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { ReportItem } from '../../types/report';
import { useApp } from '../../context/AppContext';
import { CategoryBadge } from '../ui/CategoryBadge';
import { ReportMediaGrid } from '../media/ReportMediaGrid';
import { AppIcon } from '../ui/AppIcon';
import { formatBillingMonth, toBanglaDigits } from '../../utils/formatters';
import {
  PublicEngagementCounts,
  PublicEngagementService,
} from '../../services/publicEngagementService';

export interface ReportCardProps {
  report: ReportItem;
  className?: string;
}

const INITIAL_ENGAGEMENT: PublicEngagementCounts = { viewCount: 0, shareCount: 0 };
const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"], [role="link"], [role="textbox"]';

export const ReportCard: React.FC<ReportCardProps> = ({ report, className = '' }) => {
  const { language, navigateTo } = useApp();
  const [isCopied, setIsCopied] = useState(false);
  const [engagement, setEngagement] = useState<PublicEngagementCounts>(INITIAL_ENGAGEMENT);

  const title = language === 'bn' ? report.titleBn : report.titleEn;
  const shortDesc = language === 'bn' ? report.shortDescriptionBn : report.shortDescriptionEn;
  const location = language === 'bn' ? report.locationBn : report.locationEn;
  const publishedDate = language === 'bn' ? report.publishedDateBn : report.publishedDateEn;

  const normalizedTitle = (title || '').trim();
  const normalizedDesc = (shortDesc || '').trim();
  const shouldShowDescription = normalizedDesc.length > 0 && normalizedDesc !== normalizedTitle;

  useEffect(() => {
    let active = true;
    PublicEngagementService.getCounts(report.id).then((counts) => {
      if (active) setEngagement(counts);
    });
    return () => {
      active = false;
    };
  }, [report.id]);

  const registerView = () => {
    void PublicEngagementService.trackView(report.id).then((counts) => {
      if (counts) setEngagement(counts);
    });
  };

  const openReportDetail = () => {
    registerView();
    navigateTo(`/report-detail/${report.id}`);
  };

  const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (target && target !== event.currentTarget && target.closest(INTERACTIVE_SELECTOR)) return;
    openReportDetail();
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openReportDetail();
  };

  const registerShare = () => {
    void PublicEngagementService.trackShare(report.id).then((counts) => {
      if (counts) setEngagement(counts);
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}#/report-detail/${report.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
        registerShare();
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        registerShare();
        setIsCopied(true);
        window.setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        console.warn('[ReportCard share error]', error);
      }
    }
  };

  const displayCount = (value: number) =>
    language === 'bn' ? toBanglaDigits(value) : value.toLocaleString();

  const relativePublishedTime = (() => {
    if (!report.publishedAt) return publishedDate;
    const published = new Date(report.publishedAt).getTime();
    if (!Number.isFinite(published)) return publishedDate;
    const diffMinutes = Math.max(0, Math.floor((Date.now() - published) / 60000));
    if (diffMinutes < 60) {
      const value = Math.max(1, diffMinutes);
      return language === 'bn' ? `${toBanglaDigits(value)} মিনিট আগে` : `${value} min ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return language === 'bn' ? `${toBanglaDigits(diffHours)} ঘণ্টা আগে` : `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return language === 'bn' ? `${toBanglaDigits(diffDays)} দিন আগে` : `${diffDays}d ago`;
    }
    return publishedDate;
  })();

  return (
    <article
      id={`report-card-${report.id}`}
      role="link"
      tabIndex={0}
      aria-label={title}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`group relative ui-card p-3.5 sm:p-4 md:p-6 transition-all duration-150 cursor-pointer text-left space-y-2 sm:space-y-2.5 md:space-y-3 select-none hover:border-ui-stroke-default focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus focus-visible:ring-offset-1 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 type-meta">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
          <CategoryBadge section={report.segment} language={language} size="sm" className="shrink-0" />
        </div>
        <p className="type-meta text-ui-content-secondary whitespace-nowrap shrink-0">
          {relativePublishedTime}
        </p>
      </div>

      <h3 className="type-h3 text-ui-content-primary transition-colors line-clamp-2 break-words">
        {title}
      </h3>

      {report.reportedSubject && (
        <div className="type-meta text-ui-content-secondary flex items-center gap-1.5 flex-wrap min-w-0">
          <p className="type-helper text-ui-content-muted">
            {language === 'bn' ? 'প্রতিবেদনে উল্লিখিত পক্ষ:' : 'Reported subject:'}
          </p>
          <p className="type-helper font-[var(--font-weight-semibold)] text-ui-content-primary truncate max-w-full">
            {report.reportedSubject}
          </p>
        </div>
      )}

      {(report.subcategoryId === 'excess-electricity-bill' || report.recentBillAmount !== undefined) && (
        <div className="flex items-center gap-2 type-helper bg-ui-surface-subtle border border-ui-stroke-subtle ui-radius-badge-md px-2.5 py-1 text-ui-content-secondary max-w-full flex-wrap">
          <p className="type-helper font-[var(--font-weight-semibold)] text-ui-content-primary">
            {report.recentBillMonth ? formatBillingMonth(report.recentBillMonth, language) : (language === 'bn' ? 'সাম্প্রতিক বিল' : 'Recent bill')}: ৳{report.recentBillAmount !== undefined ? (language === 'bn' ? toBanglaDigits(report.recentBillAmount) : report.recentBillAmount.toLocaleString()) : '-'}
          </p>
          {report.previousBillAmount !== undefined && (
            <p className="type-helper text-ui-content-muted">
              ({language === 'bn' ? 'পূর্বে: ' : 'prev: '}৳{language === 'bn' ? toBanglaDigits(report.previousBillAmount) : report.previousBillAmount.toLocaleString()})
            </p>
          )}
        </div>
      )}

      {shouldShowDescription && (
        <p className="type-body text-ui-content-secondary line-clamp-2 md:line-clamp-3 break-words">
          {shortDesc}
        </p>
      )}

      {((report.media && report.media.images && report.media.images.length > 0) || (report.images && report.images.length > 0)) && (
        <div className="hidden">
          <ReportMediaGrid images={report.media?.images || report.images || []} language={language} isCompact={true} />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2.5 md:pt-3 border-t border-ui-stroke-subtle type-meta text-ui-content-muted">
        <div className="flex items-center flex-wrap gap-x-2.5 sm:gap-x-3 gap-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1 sm:gap-1.5 text-ui-content-secondary font-[var(--font-weight-medium)] min-w-0">
            <AppIcon name="map-pin" size="xs" className="text-ui-content-muted shrink-0 md:hidden" />
            <AppIcon name="map-pin" size="sm" className="text-ui-content-muted shrink-0 hidden md:inline-block" />
            <p className="type-meta truncate max-w-[210px] sm:max-w-[280px] md:max-w-xs">{location}</p>
          </div>
          <span className="hidden" aria-hidden="true">•</span>
          <div
            className="flex items-center gap-1 text-ui-content-muted shrink-0"
            aria-label={`${displayCount(engagement.viewCount)} ${language === 'bn' ? 'ভিউ' : 'views'}`}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="type-meta whitespace-nowrap">{displayCount(engagement.viewCount)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 type-action">
          <button
            type="button"
            onClick={handleShare}
            aria-label={language === 'bn' ? 'প্রতিবেদন শেয়ার করুন' : 'Share report'}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 text-ui-content-secondary transition-colors cursor-pointer py-1.5 px-2 min-h-[44px] min-w-[44px] ui-radius-badge-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus active:scale-95"
          >
            {isCopied ? (
              <span className="inline-flex items-center gap-1" aria-live="polite">
                <AppIcon name="check" size="xs" className="text-ui-success-text md:hidden" />
                <AppIcon name="check" size="sm" className="text-ui-success-text hidden md:inline-block" />
                <span className="text-ui-success-text font-[var(--font-weight-semibold)]">{language === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <AppIcon name="share" size="xs" className="text-ui-content-muted md:hidden" />
                <AppIcon name="share" size="sm" className="text-ui-content-muted hidden md:inline-block" />
                <span className="hidden">{language === 'bn' ? 'শেয়ার' : 'Share'}</span>
                <span className="hidden type-meta text-ui-content-muted">{displayCount(engagement.shareCount)}</span>
              </span>
            )}
          </button>

          <span className="hidden" aria-hidden="true">|</span>

          <Link
            to={`/report-detail/${report.id}`}
            onClick={(e) => {
              e.stopPropagation();
              registerView();
            }}
            aria-label={language === 'bn' ? `${title} - বিস্তারিত দেখুন` : `View details for ${title}`}
            className="hidden"
          >
            <span>{language === 'bn' ? 'বিস্তারিত' : 'Details'}</span>
            <AppIcon name="arrow-right" size="xs" className="text-ui-content-muted group-hover:translate-x-0.5 transition-transform md:hidden" />
            <AppIcon name="arrow-right" size="sm" className="text-ui-content-muted group-hover:translate-x-0.5 transition-transform hidden md:inline-block" />
          </Link>
        </div>
      </div>
    </article>
  );
};
