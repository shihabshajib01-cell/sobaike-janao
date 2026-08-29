import React from 'react';
import { MapIcon } from './MapIcon';

interface MapSectionHeaderProps {
  language: 'bn' | 'en';
  viewMode: 'feed' | 'map';
  onViewModeChange: (mode: 'feed' | 'map') => void;
}

export const MapSectionHeader: React.FC<MapSectionHeaderProps> = ({
  language,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div
      id="map-section-header"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1"
    >
      <div className="space-y-1">
        <h1 className="text-[24px] md:text-[30px] leading-[1.3] font-bold text-primary tracking-tight">
          {viewMode === 'map'
            ? language === 'bn'
              ? 'প্রতিবেদনের মানচিত্র'
              : 'Reports Map'
            : language === 'bn'
            ? 'প্রতিবেদন খুঁজুন'
            : 'Explore Reports'}
        </h1>
        <p className="text-[15px] leading-[1.6] text-secondary">
          {viewMode === 'map'
            ? language === 'bn'
              ? 'এলাকা অনুযায়ী প্রকাশিত প্রতিবেদন দেখুন'
              : 'View published reports by geographic area'
            : language === 'bn'
            ? 'বিভাগ, এলাকা ও প্রকাশিত তথ্য অনুযায়ী প্রতিবেদন খুঁজুন।'
            : 'Browse published reports by category and location.'}
        </p>
      </div>

      {/* View Mode Switcher: List vs Map */}
      <div className="flex items-center bg-surface-subtle p-1 rounded-xl border border-subtle self-start sm:self-center shrink-0 shadow-2xs">
        <button
          type="button"
          onClick={() => onViewModeChange('feed')}
          className={`px-3.5 py-1.5 rounded-lg text-[14px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px] ${
            viewMode === 'feed'
              ? 'bg-surface text-primary shadow-2xs font-bold'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <MapIcon name="list" size="md" />
          <span>{language === 'bn' ? 'তালিকা' : 'List'}</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange('map')}
          className={`px-3.5 py-1.5 rounded-lg text-[14px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px] ${
            viewMode === 'map'
              ? 'bg-surface text-primary shadow-2xs font-bold'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <MapIcon name="map" size="md" />
          <span>{language === 'bn' ? 'মানচিত্র' : 'Map'}</span>
        </button>
      </div>
    </div>
  );
};

export default MapSectionHeader;
