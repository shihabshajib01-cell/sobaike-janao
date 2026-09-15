import React from 'react';
import { POPULAR_DISTRICTS } from '../../data/categories';
import { useApp } from '../../context/AppContext';
import { SearchableSelect } from '../ui/SearchableSelect';

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

  return (
    <div className={`min-w-[180px] sm:min-w-[210px] ${className}`}>
      <SearchableSelect
        id="location-filter-select"
        value={selectedDistrict}
        onChange={onSelectDistrict}
        placeholder={language === 'bn' ? 'জেলা নির্বাচন' : 'Filter by district'}
        searchPlaceholder={language === 'bn' ? 'জেলা খুঁজুন...' : 'Search districts...'}
        noResultsText={language === 'bn' ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}
        options={POPULAR_DISTRICTS.map((district) => ({
          value: district.id,
          label: language === 'bn' ? district.nameBn : district.nameEn,
          keywords: [district.nameBn, district.nameEn],
        }))}
      />
    </div>
  );
};
