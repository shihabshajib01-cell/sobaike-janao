import React from 'react';
import { ReportItem } from '../../types/report';
import { SectionKey } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';
import { toBanglaDigits } from '../../utils/formatters';
import { CategoryBadge } from '../ui/CategoryBadge';
import { MapIcon } from './MapIcon';

interface RecentAreaReportsProps {
  reports: ReportItem[];
  selectedDistrict: string;
  selectedSection: SectionKey | 'all';
  language: 'bn' | 'en';
  onViewAllReports?: () => void;
}

export const RecentAreaReports: React.FC<RecentAreaReportsProps> = ({
  reports,
  language,
  onViewAllReports,
}) => {
  const { navigateTo } = useApp();

  const previewReports = reports.slice(0, 4);

  return (
    <section id="recent-area-reports-section" className="space-y-3 pt-2">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ui-stroke-subtle pb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[17px] md:text-[18px] font-bold text-ui-content-primary tracking-tight">
            {language === 'bn' ? 'সাম্প্রতিক প্রতিবেদন' : 'Recent reports'}
          </h3>
        </div>

        {reports.length > 4 && onViewAllReports && (
          <button
            type="button"
            onClick={onViewAllReports}
            className="text-[13px] font-bold text-ui-action-bg hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto min-h-[44px] sm:min-h-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus rounded-lg"
          >
            <span>
              {language === 'bn'
                ? `সবগুলো দেখুন (${toBanglaDigits(reports.length)})`
                : `View all in Reports (${reports.length})`}
            </span>
            <MapIcon name="arrow-right" size="xs" />
          </button>
        )}
      </div>

      {/* Reports Grid (Compact 4-card preview) */}
      {previewReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {previewReports.map((report) => {
            const title = language === 'bn' ? report.titleBn : report.titleEn;
            const shortDesc = language === 'bn' ? report.shortDescriptionBn : report.shortDescriptionEn;
            const location = language === 'bn' ? report.locationBn : report.locationEn;
            const date = language === 'bn' ? report.publishedDateBn : report.publishedDateEn;

            return (
              <article
                key={report.id}
                className="bg-ui-surface border border-ui-stroke-subtle rounded-xl p-3 sm:p-3.5 flex flex-col justify-between space-y-2 shadow-2xs text-left min-h-[148px]"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <CategoryBadge
                      section={report.segment}
                      language={language}
                      size="sm"
                    />
                  </div>

                  <h4 className="text-[14px] sm:text-[14.5px] font-bold text-ui-content-primary line-clamp-2 leading-snug">
                    {title}
                  </h4>

                  <p className="text-[12px] sm:text-[12.5px] text-ui-content-secondary line-clamp-2 leading-relaxed">
                    {shortDesc}
                  </p>
                </div>

                <div className="pt-2 border-t border-ui-stroke-subtle/80 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-1 text-[11.5px] sm:text-[12px]">
                  <div className="flex items-center gap-2 sm:gap-2.5 text-ui-content-secondary min-w-0 flex-wrap xs:flex-nowrap">
                    <span className="flex items-center gap-1 truncate max-w-[130px] sm:max-w-[170px]">
                      <MapIcon name="map-pin" size="sm" className="text-ui-content-secondary shrink-0" />
                      <span className="truncate">{location}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <MapIcon name="calendar" size="sm" className="text-ui-content-secondary shrink-0" />
                      <span>{date}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo(`/report-detail/${report.id}`)}
                    className="group/btn shrink-0 ml-auto sm:ml-0 text-[11.5px] sm:text-[12px] font-semibold text-ui-action-bg hover:underline flex items-center gap-0.5 min-h-[44px] cursor-pointer px-1 py-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                  >
                    <span>{language === 'bn' ? 'বিস্তারিত' : 'Details'}</span>
                    <MapIcon name="arrow-right" size="sm" className="text-ui-action-bg transition-transform group-hover/btn:translate-x-0.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-ui-surface border border-ui-stroke-subtle rounded-xl p-6 text-center space-y-2 shadow-2xs">
          <MapIcon name="alert-circle" size="xl" className="text-ui-content-secondary mx-auto" />
          <h4 className="text-[15px] font-bold text-ui-content-primary">
            {language === 'bn' ? 'এই এলাকায় কোনো প্রতিবেদন নেই' : 'No reports in this area'}
          </h4>
          <p className="text-[13px] text-ui-content-secondary max-w-sm mx-auto">
            {language === 'bn'
              ? 'অন্য কোনো জেলা নির্বাচন করুন বা সকল প্রতিবেদন দেখুন।'
              : 'Try selecting another district or explore all reports.'}
          </p>
        </div>
      )}
    </section>
  );
};

export default RecentAreaReports;
