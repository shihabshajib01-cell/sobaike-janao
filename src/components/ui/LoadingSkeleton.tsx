import React from 'react';

export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
  return (
    <div
      className={`animate-pulse bg-surface-hover rounded-md ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

export interface ReportCardSkeletonProps {
  id?: string;
  hasMediaPreview?: boolean;
  className?: string;
}

export const ReportCardSkeleton: React.FC<ReportCardSkeletonProps> = ({
  id,
  hasMediaPreview = false,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`bg-surface border border-subtle rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-6 space-y-2 sm:space-y-2.5 md:space-y-3.5 shadow-2xs select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Top Context Line: Category badge placeholder + subcategory dot placeholder */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Skeleton className="w-20 sm:w-24 h-4 sm:h-5 rounded-md" />
          <span className="text-muted text-[11px] sm:text-[12px] opacity-40">•</span>
          <Skeleton className="w-24 sm:w-32 h-3.5 sm:h-4 rounded" />
        </div>
        <Skeleton className="w-16 sm:w-20 h-4 sm:h-5 rounded-md" />
      </div>

      {/* 2. Main Headline */}
      <div className="space-y-1.5 pt-0.5">
        <Skeleton className="w-4/5 sm:w-3/4 h-5 sm:h-6 md:h-7 rounded-md" />
        <Skeleton className="w-1/2 h-4 sm:h-5 rounded-md hidden sm:block" />
      </div>

      {/* 3. Reported Subject Context */}
      <div className="flex items-center gap-2 pt-0.5">
        <Skeleton className="w-20 sm:w-24 h-3.5 sm:h-4 rounded" />
        <Skeleton className="w-28 sm:w-36 h-3.5 sm:h-4 rounded font-medium" />
      </div>

      {/* 4. Description Preview (2-3 lines) */}
      <div className="space-y-1.5 sm:space-y-2 pt-0.5 sm:pt-1">
        <Skeleton className="w-full h-3.5 sm:h-4 rounded" />
        <Skeleton className="w-11/12 h-3.5 sm:h-4 rounded" />
        <Skeleton className="w-4/5 h-3.5 sm:h-4 rounded hidden sm:block" />
      </div>

      {/* 4.5 Optional Media Grid Preview placeholder */}
      {hasMediaPreview && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
          <Skeleton className="h-20 sm:h-28 rounded-xl" />
          <Skeleton className="h-20 sm:h-28 rounded-xl" />
          <Skeleton className="h-20 sm:h-28 rounded-xl" />
        </div>
      )}

      {/* 5. Footer Metadata Row: Location · Date · Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 sm:pt-2.5 md:pt-3.5 border-t border-subtle">
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="w-24 sm:w-32 h-3.5 sm:h-4 rounded" />
          <span className="text-muted text-[10px] sm:text-[12px] opacity-40">•</span>
          <Skeleton className="w-16 sm:w-24 h-3.5 sm:h-4 rounded" />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Skeleton className="w-10 sm:w-14 h-5 sm:h-6 rounded-lg" />
          <span className="text-subtle opacity-40 text-[10px] sm:text-[12px]">|</span>
          <Skeleton className="w-12 sm:w-18 h-5 sm:h-6 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export interface ReportFeedSkeletonProps {
  count?: number;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

export const ReportFeedSkeleton: React.FC<ReportFeedSkeletonProps> = ({
  count = 3,
  id = 'report-feed-skeleton',
  className = 'space-y-3',
  ariaLabel = 'Loading reports...',
}) => {
  return (
    <div
      id={id}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className={className}
    >
      <span className="sr-only">{ariaLabel}</span>
      {Array.from({ length: count }).map((_, idx) => (
        <ReportCardSkeleton
          key={idx}
          id={`${id}-item-${idx}`}
          hasMediaPreview={idx === 1} // Staggered realistic layout
        />
      ))}
    </div>
  );
};

/**
 * Visual skeleton loader for the Interactive Leaflet Map Card
 */
export interface MapCardSkeletonProps {
  id?: string;
  className?: string;
  ariaLabel?: string;
}

export const MapCardSkeleton: React.FC<MapCardSkeletonProps> = ({
  id = 'map-card-skeleton',
  className = '',
  ariaLabel = 'Loading incident map...',
}) => {
  return (
    <div
      id={id}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`relative rounded-2xl border border-subtle bg-surface shadow-xs overflow-hidden flex flex-col select-none ${className}`}
      style={{ minHeight: '520px' }}
    >
      <span className="sr-only">{ariaLabel}</span>

      {/* Top-Right Mock Controls Skeleton */}
      <div className="absolute top-3.5 right-3.5 z-20 flex flex-col gap-1.5 shadow-sm">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="w-9 h-9 rounded-xl" />
      </div>

      {/* Top-Left Mock Map Legend Skeleton */}
      <div className="absolute top-3.5 left-3.5 z-20 bg-surface/90 backdrop-blur-xs border border-subtle rounded-xl p-3 shadow-2xs flex flex-col gap-2 w-44">
        <Skeleton className="w-24 h-3.5 rounded" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-24 h-3 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-16 h-3 rounded" />
          </div>
        </div>
      </div>

      {/* Bottom-Left Mock Marker Count Skeleton */}
      <div className="absolute bottom-3.5 left-3.5 z-20 bg-surface/95 backdrop-blur-xs border border-subtle rounded-xl px-3 py-2 shadow-2xs flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="w-28 h-4 rounded" />
      </div>

      {/* Map Surface Graphic Pulsing Grid Background */}
      <div className="w-full flex-1 flex items-center justify-center p-8 bg-surface-subtle relative overflow-hidden">
        {/* Abstract topographic / grid lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_center,var(--ui-accent)_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Pulsing marker placeholders mimicking geographic clusters across Bangladesh */}
        <div className="relative w-full max-w-sm h-72 flex items-center justify-center">
          {/* Dhaka Center Cluster */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-surface-hover border-2 border-surface animate-ping opacity-35" />
            <div className="w-8 h-8 rounded-full bg-surface-hover border-2 border-surface absolute top-1" />
          </div>

          {/* Chittagong / South-East Cluster */}
          <div className="absolute bottom-6 right-10 flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-surface-hover border-2 border-surface" />
          </div>

          {/* Sylhet / North-East Cluster */}
          <div className="absolute top-10 right-14 flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-surface-hover border-2 border-surface" />
          </div>

          {/* Rajshahi / North-West Cluster */}
          <div className="absolute top-14 left-10 flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-surface-hover border-2 border-surface" />
          </div>

          {/* Khulna / South-West Cluster */}
          <div className="absolute bottom-12 left-14 flex flex-col items-center">
            <div className="w-7 h-7 rounded-full bg-surface-hover border-2 border-surface" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Visual skeleton loader for the District Ranking & Summary Panel
 */
export interface DistrictRankingSkeletonProps {
  id?: string;
  className?: string;
}

export const DistrictRankingSkeleton: React.FC<DistrictRankingSkeletonProps> = ({
  id = 'district-ranking-skeleton',
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-subtle bg-surface shadow-xs p-4 sm:p-5 space-y-4 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-subtle">
        <div className="space-y-1">
          <Skeleton className="w-32 h-5 rounded-md" />
          <Skeleton className="w-48 h-3.5 rounded" />
        </div>
        <Skeleton className="w-14 h-6 rounded-full" />
      </div>

      {/* Category Breakdown Metric Pills */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>

      {/* District List Skeletons */}
      <div className="space-y-2 pt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-xl border border-subtle bg-surface flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="w-24 h-4 rounded" />
                <Skeleton className="w-16 h-3 rounded" />
              </div>
            </div>
            <Skeleton className="w-12 h-6 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Visual skeleton loader for Recent Area Reports Grid
 */
export const RecentAreaReportsSkeleton: React.FC<{ count?: number; id?: string }> = ({
  count = 3,
  id = 'recent-area-reports-skeleton',
}) => {
  return (
    <div id={id} className="space-y-3 pt-2 select-none" aria-hidden="true">
      <div className="flex items-center justify-between border-b border-subtle pb-2.5">
        <div className="space-y-1">
          <Skeleton className="w-36 h-5 rounded" />
          <Skeleton className="w-52 h-3.5 rounded" />
        </div>
        <Skeleton className="w-16 h-4 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl bg-surface border border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="w-20 h-4 rounded" />
              <Skeleton className="w-12 h-3 rounded" />
            </div>
            <Skeleton className="w-4/5 h-5 rounded" />
            <Skeleton className="w-full h-4 rounded" />
            <div className="flex items-center justify-between pt-2 border-t border-subtle">
              <Skeleton className="w-20 h-3 rounded" />
              <Skeleton className="w-14 h-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Comprehensive Map Explore Layout Skeleton (Map + Ranking + Recent Reports)
 */
export const MapExploreSkeleton: React.FC<{ id?: string; ariaLabel?: string }> = ({
  id = 'map-explore-skeleton',
  ariaLabel = 'Loading interactive map and reports...',
}) => {
  return (
    <div
      id={id}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className="space-y-6 animate-in fade-in duration-150"
    >
      <span className="sr-only">{ariaLabel}</span>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 w-full">
          <MapCardSkeleton />
        </div>
        <div className="lg:col-span-4 w-full">
          <DistrictRankingSkeleton />
        </div>
      </div>
      <RecentAreaReportsSkeleton count={3} />
    </div>
  );
};

export const StatCardSkeleton: React.FC<{ id?: string }> = ({ id }) => {
  return (
    <div id={id} className="p-4 sm:p-5 bg-surface border border-subtle rounded-2xl space-y-2.5 shadow-2xs select-none" aria-hidden="true">
      <Skeleton className="w-24 h-4 rounded" />
      <Skeleton className="w-16 h-8 rounded-lg" />
      <Skeleton className="w-32 h-4 rounded" />
    </div>
  );
};

export const ReportDetailSkeleton: React.FC<{ id?: string }> = ({ id = 'report-detail-skeleton' }) => {
  return (
    <div id={id} className="space-y-6 select-none" role="status" aria-busy="true" aria-label="Loading report details...">
      <span className="sr-only">Loading report details...</span>
      {/* Back button */}
      <Skeleton className="w-24 h-8 rounded-lg" />

      {/* Main card */}
      <div className="bg-surface border border-subtle rounded-3xl p-6 md:p-8 space-y-6 shadow-2xs">
        {/* Context bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-28 h-6 rounded-md" />
            <Skeleton className="w-36 h-5 rounded" />
          </div>
          <Skeleton className="w-24 h-6 rounded-full" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="w-4/5 h-8 md:h-9 rounded-lg" />
          <Skeleton className="w-2/3 h-7 md:h-8 rounded-lg" />
        </div>

        {/* Metadata pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="w-32 h-7 rounded-lg" />
          <Skeleton className="w-28 h-7 rounded-lg" />
          <Skeleton className="w-36 h-7 rounded-lg" />
        </div>

        {/* Long content description */}
        <div className="space-y-3 pt-2">
          <Skeleton className="w-full h-4 rounded" />
          <Skeleton className="w-full h-4 rounded" />
          <Skeleton className="w-11/12 h-4 rounded" />
          <Skeleton className="w-4/5 h-4 rounded" />
          <Skeleton className="w-5/6 h-4 rounded" />
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <Skeleton className="h-36 sm:h-44 rounded-2xl" />
          <Skeleton className="h-36 sm:h-44 rounded-2xl" />
          <Skeleton className="h-36 sm:h-44 rounded-2xl hidden sm:block" />
        </div>
      </div>
    </div>
  );
};
