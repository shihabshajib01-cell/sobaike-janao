import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { POPULAR_DISTRICTS } from '../../data/categories';
import { useApp } from '../../context/AppContext';

export interface LocationSelectorProps {
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedDistrict,
  onSelectDistrict,
  className = '',
}) => {
  const { language } = useApp();

  const currentOption = POPULAR_DISTRICTS.find((d) => d.id === selectedDistrict) || POPULAR_DISTRICTS[0];

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 w-4 h-4 text-muted pointer-events-none" />
        <select
          id="location-filter-select"
          value={selectedDistrict}
          onChange={(e) => onSelectDistrict(e.target.value)}
          aria-label={language === 'bn' ? 'এলাকা বা জেলা নির্বাচন করুন' : 'Select area or district'}
          className="appearance-none pl-9 pr-8 py-2 text-[16px] leading-[24px] font-semibold bg-surface hover:bg-surface-subtle text-primary border border-subtle hover:border-theme rounded-xl min-h-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ui-focus)] transition-colors shadow-2xs"
        >
          {POPULAR_DISTRICTS.map((district) => (
            <option key={district.id} value={district.id}>
              {language === 'bn' ? district.nameBn : district.nameEn}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 w-3.5 h-3.5 text-muted pointer-events-none" />
      </div>
    </div>
  );
};
