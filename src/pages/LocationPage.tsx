import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin, ArrowLeft, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BANGLADESH_DISTRICTS } from '../data/districts';
import { PublicReportService } from '../services/publicReportService';
import { ReportItem } from '../types/report';
import { ReportCard } from '../components/report/ReportCard';
import { ReportFeedSkeleton } from '../components/ui/LoadingSkeleton';
import { SECTIONS } from '../theme/tokens';
import { PublicPageContainer } from '../components/layout/PublicPageContainer';

export interface LocationPageProps {
  locationId: string;
}

export const LocationPage: React.FC<LocationPageProps> = ({ locationId }) => {
  const { language, navigateTo } = useApp();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Find district metadata from districts dataset
  const district = useMemo(() => {
    const cleanId = locationId.toLowerCase().trim();
    return BANGLADESH_DISTRICTS.find(
      (d) =>
        d.id.toLowerCase() === cleanId ||
        d.nameEn.toLowerCase() === cleanId ||
        d.nameBn === locationId
    );
  }, [locationId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await PublicReportService.getByLocation(locationId);
      setReports(data);
    } catch (err) {
      console.warn('[LocationPage load error]', err);
      setFetchError('LOAD_ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Breakdowns by segment
  const harassmentCount = reports.filter((r) => r.segment === 'harassment').length;
  const rickshawCount = reports.filter((r) => r.segment === 'rickshaw').length;
  const extortionCount = reports.filter((r) => r.segment === 'extortion').length;

  const districtDisplayName = district
    ? language === 'bn'
      ? district.nameBn
      : district.nameEn
    : locationId;

  const divisionDisplayName = district
    ? language === 'bn'
      ? district.divisionBn
      : district.divisionEn
    : '';

  return (
    <PublicPageContainer id="location-page-container">
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
          <span>{language === 'bn' ? 'এক্সপ্লোরে ফিরুন' : 'Back to Explore'}</span>
        </button>
        <span>/</span>
        <span className="text-primary font-semibold">{districtDisplayName}</span>
      </div>

      {/* District Header Card */}
      <div className="bg-surface border border-subtle rounded-2xl p-5 md:p-7 space-y-4 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[32px] leading-[42px] font-bold text-primary tracking-tight">
              {districtDisplayName}
            </h1>
            {divisionDisplayName && (
              <span className="text-[14px] px-2.5 py-0.5 rounded-lg bg-surface-subtle text-secondary font-medium border border-subtle">
                {language === 'bn' ? `${divisionDisplayName} বিভাগ` : `${divisionDisplayName} Division`}
              </span>
            )}
          </div>
          <p className="text-[16px] leading-[26px] text-secondary">
            {language === 'bn'
              ? 'এই এলাকার প্রকাশিত নাগরিক প্রতিবেদনসমূহ।'
              : 'Published community reports associated with this area.'}
          </p>
        </div>

        {/* Quiet Inline Summary */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 border-t border-subtle text-[14px] text-secondary font-medium">
          <span>
            {language === 'bn' ? `${reports.length}টি প্রকাশিত প্রতিবেদন` : `${reports.length} published reports`}
          </span>
          {reports.length > 0 && (
            <>
              <span>·</span>
              <span>
                {language === 'bn' ? `${SECTIONS.harassment.shortNameBn} ${harassmentCount}` : `${SECTIONS.harassment.shortNameEn} ${harassmentCount}`}
              </span>
              <span>·</span>
              <span>
                {language === 'bn' ? `${SECTIONS.rickshaw.shortNameBn} ${rickshawCount}` : `${SECTIONS.rickshaw.shortNameEn} ${rickshawCount}`}
              </span>
              <span>·</span>
              <span>
                {language === 'bn' ? `${SECTIONS.extortion.shortNameBn} ${extortionCount}` : `${SECTIONS.extortion.shortNameEn} ${extortionCount}`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Loading State Skeleton Screen */}
      {isLoading && (
        <ReportFeedSkeleton
          count={3}
          id="location-feed-skeleton"
          ariaLabel={language === 'bn' ? 'এলাকার তথ্য লোড হচ্ছে...' : 'Loading location reports...'}
        />
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div className="bg-surface border border-rose-500/30 rounded-xl p-8 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-[16px] font-semibold text-rose-500">
            {language === 'bn'
              ? 'এলাকার তথ্য লোড করতে সমস্যা হয়েছে।'
              : 'Failed to load reports for this location. Please try again.'}
          </p>
          <button
            onClick={loadData}
            className="btn-primary-action px-4 py-2.5 rounded-xl text-[16px] font-semibold min-h-[44px]"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Reports Feed */}
      {!isLoading && !fetchError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] leading-[28px] font-bold text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" />
              <span>
                {language === 'bn'
                  ? 'প্রকাশিত প্রতিবেদন'
                  : 'Published Reports'}
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
            <div className="bg-surface border border-subtle rounded-xl p-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-muted mx-auto" />
              <h3 className="text-[16px] font-bold text-primary">
                {language === 'bn' ? 'এই এলাকার সঙ্গে বর্তমানে কোনো প্রকাশিত প্রতিবেদন যুক্ত নেই।' : 'No published reports are currently associated with this area.'}
              </h3>
            </div>
          )}
        </div>
      )}
    </PublicPageContainer>
  );
};
