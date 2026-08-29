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
}

export const RecentAreaReports: React.FC<RecentAreaReportsProps> = ({
  reports,
  selectedDistrict,
  selectedSection,
  language,
}) => {
  const { navigateTo } = useApp();

  const getDistrictNameDisplay = () => {
    if (selectedDistrict === 'all') {
      return language === 'bn' ? 'সারাদেশ' : 'All Regions';
    }
    const match = reports.find(
      (r) =>
        r.districtEn.toLowerCase() === selectedDistrict.toLowerCase() ||
        r.districtBn === selectedDistrict
    );
    if (match) {
      return language === 'bn' ? match.districtBn : match.districtEn;
    }
    return selectedDistrict;
  };

  return (
    <section id="recent-area-reports-section" className="space-y-3.5 pt-2">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-subtle pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] font-bold text-primary tracking-tight">
              {language === 'bn' ? 'এই এলাকার সাম্প্রতিক প্রতিবেদন' : 'Recent Area Reports'}
            </h3>
            <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-surface-subtle border border-subtle text-secondary">
              {getDistrictNameDisplay()}
            </span>
          </div>
          <p className="text-[13px] text-secondary mt-0.5">
            {language === 'bn'
              ? 'নির্বাচিত এলাকার সর্বশেষ প্রকাশিত নাগরিক তথ্য ও সতর্কবার্তা'
              : 'Latest published citizen reports and alerts in the selected area'}
          </p>
        </div>

        <span className="text-[13px] font-medium text-muted">
          {language === 'bn'
            ? `${toBanglaDigits(reports.length)}টি প্রতিবেদন প্রাপ্ত`
            : `${reports.length} reports available`}
        </span>
      </div>

      {/* Reports Grid / Cards */}
      {reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reports.slice(0, 6).map((report) => {
            const title = language === 'bn' ? report.titleBn : report.titleEn;
            const shortDesc = language === 'bn' ? report.shortDescriptionBn : report.shortDescriptionEn;
            const location = language === 'bn' ? report.locationBn : report.locationEn;
            const date = language === 'bn' ? report.publishedDateBn : report.publishedDateEn;

            return (
              <div
                key={report.id}
                className="bg-surface border border-subtle hover:border-theme rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs group text-left"
              >
                <div className="space-y-2">
                  {/* Category Badge & Report ID */}
                  <div className="flex items-center justify-between gap-2">
                    <CategoryBadge
                      section={report.segment}
                      language={language}
                      size="sm"
                    />

                    <span className="text-[12px] font-mono text-muted">
                      #{report.id}
                    </span>
                  </div>

                  {/* Title */}
                  <h4
                    onClick={() => navigateTo(`/report-detail/${report.id}`)}
                    className="text-[15px] font-bold text-primary group-hover:text-primary transition-colors line-clamp-2 leading-snug cursor-pointer"
                  >
                    {title}
                  </h4>

                  {/* Short Description */}
                  <p className="text-[13px] text-secondary line-clamp-2 leading-relaxed">
                    {shortDesc}
                  </p>
                </div>

                {/* Footer Meta & Action */}
                <div className="pt-2.5 border-t border-subtle flex items-center justify-between gap-2 text-[12px]">
                  <div className="flex items-center gap-3 text-muted min-w-0">
                    <span className="flex items-center gap-1 truncate max-w-[160px]">
                      <MapIcon name="map-pin" size="sm" className="text-muted" />
                      <span className="truncate">{location}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <MapIcon name="calendar" size="sm" className="text-muted" />
                      <span>{date}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo(`/report-detail/${report.id}`)}
                    className="shrink-0 text-[12px] font-semibold text-primary group-hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
                    <MapIcon name="arrow-right" size="sm" className="text-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-subtle rounded-2xl p-8 text-center space-y-2">
          <MapIcon name="alert-circle" size="xl" className="text-muted mx-auto" />
          <h4 className="text-[15px] font-bold text-primary">
            {language === 'bn' ? 'এই এলাকায় কোনো প্রতিবেদন নেই' : 'No reports found for this area'}
          </h4>
          <p className="text-[13px] text-muted max-w-sm mx-auto">
            {language === 'bn'
              ? 'অন্য কোনো জেলা নির্বাচন করুন অথবা সকল প্রতিবেদনের তালিকা দেখুন।'
              : 'Try selecting another district or explore nationwide reports.'}
          </p>
        </div>
      )}
    </section>
  );
};

export default RecentAreaReports;

