import React, { useEffect, useMemo, useState } from 'react';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import {
  CATEGORY_FEED_FILTER_CONFIG,
  CategoryFeedFilterState,
  EMPTY_CATEGORY_FEED_FILTERS,
} from '../../data/categoryFeedFilters';
import { SectionKey } from '../../theme/tokens';
import { ModalActions } from '../ui/ModalActions';
import { Modal } from '../ui/Modal';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Select } from '../ui/Select';

export interface CategoryFilterSheetProps {
  section: SectionKey;
  isOpen: boolean;
  language: 'bn' | 'en';
  value: CategoryFeedFilterState;
  onClose: () => void;
  onApply: (next: CategoryFeedFilterState) => void;
}

export const CategoryFilterSheet: React.FC<CategoryFilterSheetProps> = ({
  section,
  isOpen,
  language,
  value,
  onClose,
  onApply,
}) => {
  const isBn = language === 'bn';
  const config = CATEGORY_FEED_FILTER_CONFIG[section];
  const [draft, setDraft] = useState<CategoryFeedFilterState>(value);

  useEffect(() => {
    if (!isOpen) return;
    setDraft({ ...value });
  }, [isOpen, value]);

  const districtOptions = useMemo(() => {
    return BANGLADESH_DISTRICTS.filter(
      (district) => draft.divisionId === 'all' || district.divisionId === draft.divisionId
    );
  }, [draft.divisionId]);

  const handleDivisionChange = (divisionId: string) => {
    setDraft((current) => {
      let districtId = current.districtId;
      if (districtId !== 'all') {
        const selectedDistrict = BANGLADESH_DISTRICTS.find(
          (district) => district.id === districtId
        );
        if (
          !selectedDistrict ||
          (divisionId !== 'all' && selectedDistrict.divisionId !== divisionId)
        ) {
          districtId = 'all';
        }
      }

      return { ...current, divisionId, districtId };
    });
  };

  return (
    <Modal
      id={`${section}-filter-sheet`}
      isOpen={isOpen}
      onClose={onClose}
      title={isBn ? 'ফিল্টার' : 'Filter'}
      maxWidth="lg"
      mobilePresentation="sheet"
      footer={
        <ModalActions
          primary={{
            id: `${section}-filter-apply-btn`,
            type: 'button',
            onClick: () => onApply({ ...draft }),
            label: isBn ? 'ফিল্টার প্রয়োগ করুন' : 'Apply filters',
          }}
          secondary={{
            id: `${section}-filter-reset-btn`,
            type: 'button',
            onClick: () => setDraft({ ...EMPTY_CATEGORY_FEED_FILTERS }),
            label: isBn ? 'ফিল্টার মুছুন' : 'Clear filters',
          }}
        />
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

        {config?.showIncidentPeriod && (
          <Select
            id={`${section}-filter-incident-period`}
            label={isBn ? 'ঘটনার সময়কাল' : 'Incident period'}
            value={draft.incidentPeriod}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                incidentPeriod: event.target.value as CategoryFeedFilterState['incidentPeriod'],
              }))
            }
            options={[
              { value: 'all', label: isBn ? 'সব সময়' : 'Any time' },
              { value: 'last-7-days', label: isBn ? 'গত ৭ দিন' : 'Last 7 days' },
              { value: 'last-30-days', label: isBn ? 'গত ৩০ দিন' : 'Last 30 days' },
              { value: 'older', label: isBn ? '৩০ দিনের বেশি আগে' : 'More than 30 days ago' },
            ]}
          />
        )}

        {config?.showEvidence && (
          <Select
            id={`${section}-filter-evidence`}
            label={isBn ? 'সহায়ক তথ্য বা প্রমাণ' : 'Supporting information'}
            value={draft.evidence}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                evidence: event.target.value as CategoryFeedFilterState['evidence'],
              }))
            }
            options={[
              { value: 'all', label: isBn ? 'সকল প্রতিবেদন' : 'All reports' },
              { value: 'with-evidence', label: isBn ? 'সহায়ক তথ্য আছে' : 'Has supporting information' },
              { value: 'without-evidence', label: isBn ? 'সহায়ক তথ্য নেই' : 'No supporting information' },
            ]}
          />
        )}

        {config?.showUtilityBillTrend && (
          <Select
            id={`${section}-filter-bill-trend`}
            label={isBn ? 'বিদ্যুৎ বিলের পরিবর্তন' : 'Electricity bill change'}
            value={draft.utilityBillTrend}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                utilityBillTrend: event.target.value as CategoryFeedFilterState['utilityBillTrend'],
              }))
            }
            options={[
              { value: 'all', label: isBn ? 'সকল' : 'All' },
              { value: 'increased', label: isBn ? 'বিল বেড়েছে' : 'Bill increased' },
              { value: 'not-increased', label: isBn ? 'বিল বাড়েনি' : 'Bill did not increase' },
            ]}
          />
        )}
      </div>
    </Modal>
  );
};
