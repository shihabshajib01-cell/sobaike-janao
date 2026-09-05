import React, { useState } from 'react';
import { ReportItem } from '../../types/report';
import { useApp } from '../../context/AppContext';
import { CategoryBadge } from '../ui/CategoryBadge';
import { ReportMediaGrid } from '../media/ReportMediaGrid';
import { AppIcon } from '../ui/AppIcon';

export interface ReportCardProps {
  report: ReportItem;
  className?: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, className = '' }) => {
  const { language, navigateTo } = useApp();
  const [isCopied, setIsCopied] = useState(false);

  const title = language === 'bn' ? report.titleBn : report.titleEn;
  const shortDesc = language === 'bn' ? report.shortDescriptionBn : report.shortDescriptionEn;
  const location = language === 'bn' ? report.locationBn : report.locationEn;
  const publishedDate = language === 'bn' ? report.publishedDateBn : report.publishedDateEn;

  const normalizedTitle = (title || '').trim();
  const normalizedDesc = (shortDesc || '').trim();
  const shouldShowDescription =
    normalizedDesc.length > 0 &&
    normalizedDesc !== normalizedTitle;

  const handleCardClick = () => {
    navigateTo(`/report-detail/${report.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}#/report-detail/${report.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  return (
    <article
      id={`report-card-${report.id}`}
      tabIndex={0}
      role="article"
      aria-label={title}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative bg-surface border border-subtle hover:border-theme focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)] focus-visible:outline-none rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-6 transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer text-left space-y-2 sm:space-y-2.5 md:space-y-3 select-none ${className}`}
    >
      {/* 1. Top Context Line: Service Badge */}
      <div className="flex items-center justify-between gap-2 text-[12px] sm:text-[13px] md:text-[14px]">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
          <CategoryBadge
            section={report.segment}
            language={language}
            size="sm"
            className="shrink-0 text-[11.5px] sm:text-[12px] md:text-[13px] py-0.5 sm:py-1 px-2 sm:px-2.5 min-h-[22px] sm:min-h-[26px]"
          />
        </div>
      </div>

      {/* 2. Main Headline (Refined Bengali typography, max 2 lines on mobile) */}
      <h3 className="text-[16px] sm:text-[17px] md:text-[20px] leading-[1.38] sm:leading-[1.4] md:leading-[30px] font-bold md:font-semibold text-primary group-hover:text-primary transition-colors line-clamp-2 break-words">
        {title}
      </h3>

      {/* 3. Reported Subject Context (Compact inline row) */}
      {report.reportedSubject && (
        <div className="text-[12px] sm:text-[13px] md:text-[14px] text-secondary flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-muted font-normal text-[11.5px] sm:text-[12px] md:text-[13px]">
            {language === 'bn' ? 'প্রতিবেদনে উল্লিখিত পক্ষ:' : 'Reported subject:'}
          </span>
          <span className="font-semibold text-primary truncate max-w-full">
            {report.reportedSubject}
          </span>
        </div>
      )}

      {/* 4. Description Preview (Lightened visual weight, 2 lines mobile / 3 lines desktop) */}
      {shouldShowDescription && (
        <p className="text-[13px] sm:text-[14px] md:text-[16px] leading-[1.5] sm:leading-[1.55] md:leading-[26px] text-secondary line-clamp-2 md:line-clamp-3 font-normal break-words">
          {shortDesc}
        </p>
      )}

      {/* 4.5 Supporting Media Preview (Rendered when approved public images exist, supports single and gallery) */}
      {((report.media && report.media.images && report.media.images.length > 0) || (report.images && report.images.length > 0)) && (
        <div className="pt-0.5 md:pt-1">
          <ReportMediaGrid
            images={report.media?.images || report.images || []}
            language={language}
            isCompact={true}
          />
        </div>
      )}

      {/* 5. Footer Metadata & Seamless Action Area */}
      <div className="flex items-center justify-between gap-2 pt-2 sm:pt-2.5 md:pt-3 border-t border-subtle text-[12px] sm:text-[13px] md:text-[14px] text-muted">
        {/* Location & Date */}
        <div className="flex items-center flex-wrap gap-x-2.5 sm:gap-x-3 gap-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1 sm:gap-1.5 text-secondary font-medium min-w-0">
            <AppIcon name="map-pin" size="xs" className="text-muted shrink-0 md:hidden" />
            <AppIcon name="map-pin" size="sm" className="text-muted shrink-0 hidden md:inline-block" />
            <span className="truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] md:max-w-xs">{location}</span>
          </div>
          <span className="text-muted text-[10px] sm:text-[12px] md:text-[13px]">•</span>
          <div className="flex items-center gap-1 text-muted shrink-0">
            <AppIcon name="calendar" size="xs" className="text-muted shrink-0 md:hidden" />
            <AppIcon name="calendar" size="sm" className="text-muted shrink-0 hidden md:inline-block" />
            <span className="whitespace-nowrap">{publishedDate}</span>
          </div>
        </div>

        {/* Quiet Integrated Actions: Share + View Details */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 text-[12.5px] sm:text-[13.5px] md:text-[16px]">
          <button
            type="button"
            onClick={handleShare}
            aria-label={language === 'bn' ? 'লিংক কপি করুন' : 'Copy link'}
            className="inline-flex items-center gap-1 sm:gap-1.5 text-secondary hover:text-primary active:bg-surface-subtle transition-colors cursor-pointer py-1 md:py-1.5 px-1.5 sm:px-2 min-h-[36px] sm:min-h-[44px] rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
          >
            {isCopied ? (
              <>
                <AppIcon name="check" size="xs" className="text-emerald-600 dark:text-[#86EFAC] md:hidden" />
                <AppIcon name="check" size="sm" className="text-emerald-600 dark:text-[#86EFAC] hidden md:inline-block" />
                <span className="text-emerald-700 dark:text-[#86EFAC] font-semibold text-[11.5px] sm:text-[13px] md:text-[14px]">
                  {language === 'bn' ? 'কপি হয়েছে' : 'Copied'}
                </span>
              </>
            ) : (
              <>
                <AppIcon name="share" size="xs" className="text-muted md:hidden" />
                <AppIcon name="share" size="sm" className="text-muted hidden md:inline-block" />
                <span className="text-[11.5px] sm:text-[13px] md:text-[14px]">{language === 'bn' ? 'শেয়ার' : 'Share'}</span>
              </>
            )}
          </button>

          <span className="text-subtle text-[10px] sm:text-[12px] md:text-[14px]">|</span>

          <span className="inline-flex items-center gap-1 sm:gap-1.5 font-semibold text-primary group-hover:text-primary transition-colors py-1 md:py-1.5 px-1 min-h-[36px] sm:min-h-[44px]">
            <span className="text-[11.5px] sm:text-[13px] md:text-[14px]">{language === 'bn' ? 'বিস্তারিত' : 'Details'}</span>
            <AppIcon name="arrow-right" size="xs" className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-transform md:hidden" />
            <AppIcon name="arrow-right" size="sm" className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-transform hidden md:inline-block" />
          </span>
        </div>
      </div>
    </article>
  );
};
