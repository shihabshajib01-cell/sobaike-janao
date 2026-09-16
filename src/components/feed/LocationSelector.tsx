import React from 'react';
import { POPULAR_DISTRICTS } from '../../data/categories';
import { useApp } from '../../context/AppContext';
import { SearchableSelect } from '../ui/SearchableSelect';

export interface LocationSelectorOption {
  id: string;
  nameBn: string;
  nameEn: string;
}

export interface LocationSelectorProps {
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  options?: LocationSelectorOption[];
  className?: string;
  id?: string;
  variant?: 'default' | 'compact';
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedDistrict,
  onSelectDistrict,
  options = POPULAR_DISTRICTS,
  className = '',
  id = 'location-filter-select',
  variant = 'default',
}) => {
  const { language } = useApp();
  const sizingClass =
    variant === 'compact'
      ? 'w-[132px] min-w-[132px] min-[390px]:w-[148px] min-[390px]:min-w-[148px]'
      : 'min-w-[180px] sm:min-w-[210px]';

  return (
    <div className={`${sizingClass} ${className}`}>
      <SearchableSelect
        id={id}
        value={selectedDistrict}
        onChange={onSelectDistrict}
        placeholder={language === 'bn' ? 'জেলা নির্বাচন' : 'Filter by district'}
        searchPlaceholder={language === 'bn' ? 'জেলা খুঁজুন...' : 'Search districts...'}
        noResultsText={language === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}
        options={options.map((district) => ({
          value: district.id,
          label: language === 'bn' ? district.nameBn : district.nameEn,
          keywords: [district.nameBn, district.nameEn],
        }))}
      />
    </div>
  );
};
