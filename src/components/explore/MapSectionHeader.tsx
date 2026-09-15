import React from 'react';
import { MapIcon } from './MapIcon';

export type ExploreViewMode = 'heatmap' | 'reports';

interface MapSectionHeaderProps {
  language: 'bn' | 'en';
  viewMode: ExploreViewMode;
  onViewModeChange: (mode: ExploreViewMode) => void;
}

export const MapSectionHeader: React.FC<MapSectionHeaderProps> = ({
  language,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div
      id="map-section-header"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1"
    >
      <div className="space-y-0.5">
        <h1 className="text-[24px] md:text-[28px] leading-[1.3] font-bold text-ui-content-primary tracking-tight">
          {language === 'bn' ? 'প্রতিবেদন বিশ্লেষণ' : 'Report insights'}
        </h1>
        <p className="text-[14px] md:text-[15px] leading-[1.5] text-ui-content-secondary">
          {language === 'bn'
            ? 'এলাকা অনুযায়ী প্রতিবেদন ও হটস্পট দেখুন'
            : 'Explore reports and hotspots by area'}
        </p>
      </div>

      {/* Top-Level Mode Switcher: Heatmap vs Reports */}
      <div
        role="group"
        aria-label={language === 'bn' ? 'ভিউ পরিবর্তন' : 'View mode switcher'}
        className="flex items-center bg-ui-surface-subtle p-1 rounded-xl border border-ui-stroke-subtle self-start sm:self-center shrink-0 shadow-2xs"
      >
        <button
          type="button"
          aria-pressed={viewMode === 'heatmap'}
          onClick={() => onViewModeChange('heatmap')}
          className={`px-3.5 py-2 rounded-lg text-[14px] font-semibold flex items-center gap-2 transition-all cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus border ${
            viewMode === 'heatmap'
              ? 'bg-ui-surface text-ui-content-primary shadow-2xs font-bold border-ui-stroke-subtle/50 dark:bg-ui-action-bg dark:text-ui-action-text dark:border-ui-action-bg dark:ring-1 dark:ring-ui-accent-border'
              : 'border-transparent text-ui-content-secondary hover:text-ui-content-primary dark:text-ui-content-secondary dark:hover:text-ui-content-primary'
          }`}
        >
          <MapIcon name="flame" size="md" aria-hidden="true" />
          <span>{language === 'bn' ? 'মানচিত্র' : 'Map'}</span>
        </button>

        <button
          type="button"
          aria-pressed={viewMode === 'reports'}
          onClick={() => onViewModeChange('reports')}
          className={`px-3.5 py-2 rounded-lg text-[14px] font-semibold flex items-center gap-2 transition-all cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus border ${
            viewMode === 'reports'
              ? 'bg-ui-surface text-ui-content-primary shadow-2xs font-bold border-ui-stroke-subtle/50 dark:bg-ui-action-bg dark:text-ui-action-text dark:border-ui-action-bg dark:ring-1 dark:ring-ui-accent-border'
              : 'border-transparent text-ui-content-secondary hover:text-ui-content-primary dark:text-ui-content-secondary dark:hover:text-ui-content-primary'
          }`}
        >
          <MapIcon name="file-text" size="md" aria-hidden="true" />
          <span>{language === 'bn' ? 'প্রতিবেদন' : 'Reports'}</span>
        </button>
      </div>
    </div>
  );
};

export default MapSectionHeader;
