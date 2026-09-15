import React from 'react';
import { Select } from '../ui/Select';
import { SearchableSelect } from '../ui/SearchableSelect';
import {
  HARASSMENT_AGE_GROUP_OPTIONS,
  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
  HARASSMENT_REPORTING_FOR_OPTIONS,
  HarassmentClassificationFilterState,
} from '../../data/harassmentClassification';

export interface HarassmentClassificationFiltersProps {
  language: 'bn' | 'en';
  value: HarassmentClassificationFilterState;
  onChange: (next: HarassmentClassificationFilterState) => void;
  className?: string;
}

export const HarassmentClassificationFilters: React.FC<HarassmentClassificationFiltersProps> = ({
  language,
  value,
  onChange,
  className = '',
}) => {
  const isBn = language === 'bn';

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${className}`}>
      <Select
        id="harassment-filter-age-group"
        label={isBn ? 'বয়সের গ্রুপ' : 'Age group'}
        value={value.ageGroup}
        onChange={(event) =>
          onChange({ ...value, ageGroup: event.target.value as HarassmentClassificationFilterState['ageGroup'] })
        }
        options={[
          { value: 'all', label: isBn ? 'সকল বয়স' : 'All ages' },
          ...HARASSMENT_AGE_GROUP_OPTIONS.map((item) => ({
            value: item.value,
            label: isBn ? item.labelBn : item.labelEn,
          })),
        ]}
      />

      <SearchableSelect
        id="harassment-filter-relationship"
        label={isBn ? 'অভিযুক্ত ব্যক্তির সঙ্গে সম্পর্ক' : 'Relationship with alleged abuser'}
        value={value.abuserRelationship}
        onChange={(next) =>
          onChange({
            ...value,
            abuserRelationship: next as HarassmentClassificationFilterState['abuserRelationship'],
          })
        }
        placeholder={isBn ? 'সকল সম্পর্ক' : 'All relationships'}
        searchPlaceholder={isBn ? 'সম্পর্ক খুঁজুন...' : 'Search relationships...'}
        noResultsText={isBn ? 'কোনো সম্পর্ক পাওয়া যায়নি' : 'No matching relationship'}
        options={[
          { value: 'all', label: isBn ? 'সকল সম্পর্ক' : 'All relationships' },
          ...HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS.map((item) => ({
            value: item.value,
            label: isBn ? item.labelBn : item.labelEn,
          })),
        ]}
      />

      <Select
        id="harassment-filter-reporting-for"
        label={isBn ? 'কার জন্য প্রতিবেদন' : 'Reporting for'}
        value={value.reportingFor}
        onChange={(event) =>
          onChange({ ...value, reportingFor: event.target.value as HarassmentClassificationFilterState['reportingFor'] })
        }
        options={[
          { value: 'all', label: isBn ? 'সকল' : 'All' },
          ...HARASSMENT_REPORTING_FOR_OPTIONS.map((item) => ({
            value: item.value,
            label: isBn ? item.labelBn : item.labelEn,
          })),
        ]}
      />
    </div>
  );
};
