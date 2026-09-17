import React, { useEffect, useMemo, useState } from 'react';
import { SectionKey } from '../../theme/tokens';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import {
  CategoryFilterValue,
  EMPTY_CATEGORY_FILTER_VALUE,
  getCategoryFilterVisibility,
} from '../../data/categoryFilters';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Select } from '../ui/Select';

export interface CategoryFilterSheetProps {
  isOpen: boolean;
  language: 'bn' | 'en';
  section: SectionKey;
  selectedSubcategory: string;
  value: CategoryFilterValue;
  onClose: () => void;
  onApply: (next: CategoryFilterValue) => void;
}

export const CategoryFilterSheet: React.FC<CategoryFilterSheetProps> = ({
  isOpen,
  language,
  section,
  selectedSubcategory,
  value,
  onClose,
  onApply,
}) => {
  const isBn = language === 'bn';
  const [draft, setDraft] = useState<CategoryFilterValue>(value);

  useEffect(() => {
    if (!isOpen) return;
    setDraft({ ...value });
  }, [isOpen, value]);

  const visibility = useMemo(
    () => getCategoryFilterVisibility(section, selectedSubcategory),
    [section, selectedSubcategory]
  );

  const districtOptions = useMemo(() => {
    return BANGLADESH_DISTRICTS.filter(
      (district) => draft.divisionId === 'all' || district.divisionId === draft.divisionId
    );
  }, [draft.divisionId]);

  const handleDivisionChange = (divisionId: string) => {
    setDraft((current) => {
      if (current.districtId === 'all') {
        return { ...current, divisionId };
      }

      const selectedDistrict = BANGLADESH_DISTRICTS.find(
        (district) => district.id === current.districtId
      );
      const districtStillValid =
        selectedDistrict &&
        (divisionId === 'all' || selectedDistrict.divisionId === divisionId);

      return {
        ...current,
        divisionId,
        districtId: districtStillValid ? current.districtId : 'all',
      };
    });
  };

  const resetDraft = () => {
    setDraft({ ...EMPTY_CATEGORY_FILTER_VALUE });
  };

  return (
    <Modal
      id={`category-filter-sheet-${section}`}
      isOpen={isOpen}
      onClose={onClose}
      title={isBn ? 'ফিল্টার' : 'Filter'}
      maxWidth="lg"
      mobilePresentation="sheet"
      footer={
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 w-full">
          <Button
            id={`${section}-filter-reset-btn`}
            type="button"
            variant="outline"
            onClick={resetDraft}
          >
            {isBn ? 'ফিল্টার মুছুন' : 'Clear filters'}
          </Button>
          <Button
            id={`${section}-filter-apply-btn`}
            type="button"
            fullWidth
            onClick={() => onApply({ ...draft })}
          >
            {isBn ? 'ফিল্টার প্রয়োগ করুন' : 'Apply filters'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Select
          id={`${section}-filter-division`}
          label={isBn ? 'বিভাগ' : 'Division'}
          value={draft.divisionId}
          onChange={(event) => handleDivisionChange(event.target.value)}
          options={[
            { value: 'all', label: isBn ? 'সকল বিভাগ' : 'All divisions' },
            ...DIVISIONS.map((division) => ({
              value: division.id,
              label: isBn ? division.nameBn : division.nameEn,
            })),
          ]}
        />

        <SearchableSelect
          id={`${section}-filter-district`}
          label={isBn ? 'জেলা' : 'District'}
          value={draft.districtId}
          onChange={(districtId) => setDraft((current) => ({ ...current, districtId }))}
          placeholder={isBn ? 'সকল জেলা' : 'All districts'}
          searchPlaceholder={isBn ? 'জেলা খুঁজুন...' : 'Search districts...'}
          noResultsText={isBn ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}
          options={[
            { value: 'all', label: isBn ? 'সকল জেলা' : 'All districts' },
            ...districtOptions.map((district) => ({
              value: district.id,
              label: isBn ? district.nameBn : district.nameEn,
              keywords: [district.nameBn, district.nameEn],
            })),
          ]}
        />

        {visibility.incidentPeriod && (
          <Select
            id={`${section}-filter-incident-period`}
            label={isBn ? 'ঘটনার সময়কাল' : 'Incident period'}
            value={draft.incidentPeriod}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                incidentPeriod: event.target.value as CategoryFilterValue['incidentPeriod'],
              }))
            }
            options={[
              { value: 'all', label: isBn ? 'সব সময়' : 'Any time' },
              { value: 'last_7_days', label: isBn ? 'গত ৭ দিন' : 'Last 7 days' },
              { value: 'last_30_days', label: isBn ? 'গত ৩০ দিন' : 'Last 30 days' },
              { value: 'last_90_days', label: isBn ? 'গত ৯০ দিন' : 'Last 90 days' },
            ]}
          />
        )}

        {visibility.incidentTimeBand && (
          <Select
            id={`${section}-filter-incident-time`}
            label={isBn ? 'ঘটনার সময়' : 'Incident time'}
            value={draft.incidentTimeBand}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                incidentTimeBand: event.target.value as CategoryFilterValue['incidentTimeBand'],
              }))
            }
            options={[
              { value: 'all', label: isBn ? 'সব সময়' : 'Any time of day' },
              { value: 'morning', label: isBn ? 'সকাল' : 'Morning' },
              { value: 'afternoon', label: isBn ? 'দুপুর / বিকেল' : 'Afternoon' },
              { value: 'evening', label: isBn ? 'সন্ধ্যা' : 'Evening' },
              { value: 'night', label: isBn ? 'রাত' : 'Night' },
            ]}
          />
        )}

        {visibility.utilityDuration && (
          <Select
            id={`${section}-filter-utility-duration`}
            label={isBn ? 'বিভ্রাটের স্থায়িত্ব' : 'Interruption duration'}
            value={draft.utilityDuration}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                utilityDuration: event.target.value as CategoryFilterValue['utilityDuration'],
              }))
            }
            options={[
              { value: 'all', label: isBn ? 'সব স্থায়িত্ব' : 'Any duration' },
              { value: 'under_1h', label: isBn ? '১ ঘণ্টার কম' : 'Under 1 hour' },
              { value: 'one_to_three_hours', label: isBn ? '১–৩ ঘণ্টা' : '1–3 hours' },
              { value: 'over_3h', label: isBn ? '৩ ঘণ্টার বেশি' : 'Over 3 hours' },
            ]}
          />
        )}

        {visibility.billAmount && (
          <Select
            id={`${section}-filter-bill-amount`}
            label={isBn ? 'সাম্প্রতিক বিলের পরিমাণ' : 'Recent bill amount'}
            value={draft.billAmount}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                billAmount: event.target.value as CategoryFilterValue['billAmount'],
              }))
            }
            options={[
              { value: 'all', label: isBn ? 'সব পরিমাণ' : 'Any amount' },
              { value: 'under_1000', label: isBn ? '৳১,০০০-এর কম' : 'Under ৳1,000' },
              { value: '1000_5000', label: isBn ? '৳১,০০০–৳৫,০০০' : '৳1,000–৳5,000' },
              { value: '5000_10000', label: isBn ? '৳৫,০০০–৳১০,০০০' : '৳5,000–৳10,000' },
              { value: 'over_10000', label: isBn ? '৳১০,০০০-এর বেশি' : 'Over ৳10,000' },
            ]}
          />
        )}

        {visibility.supportingInfo && (
          <Select
            id={`${section}-filter-supporting-info`}
            label={isBn ? 'সহায়ক তথ্য' : 'Supporting information'}
            value={draft.supportingInfo}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                supportingInfo: event.target.value as CategoryFilterValue['supportingInfo'],
              }))
            }
            options={[
              { value: 'all', label: isBn ? 'সব প্রতিবেদন' : 'All reports' },
              { value: 'with_supporting', label: isBn ? 'সহায়ক তথ্য আছে' : 'With supporting information' },
              { value: 'without_supporting', label: isBn ? 'সহায়ক তথ্য নেই' : 'Without supporting information' },
            ]}
          />
        )}
      </div>
    </Modal>
  );
};
