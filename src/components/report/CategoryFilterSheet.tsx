import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
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

interface SelectedFilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

const getIncidentPeriodLabel = (
  value: CategoryFeedFilterState['incidentPeriod'],
  isBn: boolean
): string => {
  if (value === 'last-7-days') return isBn ? 'গত ৭ দিন' : 'Last 7 days';
  if (value === 'last-30-days') return isBn ? 'গত ৩০ দিন' : 'Last 30 days';
  if (value === 'older') return isBn ? '৩০ দিনের বেশি আগে' : 'More than 30 days ago';
  return '';
};

const getEvidenceLabel = (
  value: CategoryFeedFilterState['evidence'],
  isBn: boolean
): string => {
  if (value === 'with-evidence') return isBn ? 'সহায়ক তথ্য আছে' : 'Has supporting information';
  if (value === 'without-evidence') return isBn ? 'সহায়ক তথ্য নেই' : 'No supporting information';
  return '';
};

const getUtilityBillTrendLabel = (
  value: CategoryFeedFilterState['utilityBillTrend'],
  isBn: boolean
): string => {
  if (value === 'increased') return isBn ? 'বিল বেড়েছে' : 'Bill increased';
  if (value === 'not-increased') return isBn ? 'বিল বাড়েনি' : 'Bill did not increase';
  return '';
};

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

  const selectedFilterChips: SelectedFilterChip[] = [];

  if (draft.divisionId !== 'all') {
    const selectedDivision = DIVISIONS.find((division) => division.id === draft.divisionId);
    selectedFilterChips.push({
      id: 'division',
      label: (isBn ? selectedDivision?.nameBn : selectedDivision?.nameEn) || draft.divisionId,
      onRemove: () => handleDivisionChange('all'),
    });
  }

  if (draft.districtId !== 'all') {
    const selectedDistrict = BANGLADESH_DISTRICTS.find(
      (district) => district.id === draft.districtId
    );
    selectedFilterChips.push({
      id: 'district',
      label: (isBn ? selectedDistrict?.nameBn : selectedDistrict?.nameEn) || draft.districtId,
      onRemove: () => setDraft((current) => ({ ...current, districtId: 'all' })),
    });
  }

  if (config?.showIncidentPeriod && draft.incidentPeriod !== 'all') {
    selectedFilterChips.push({
      id: 'incident-period',
      label: `${isBn ? 'সময়' : 'Time'}: ${getIncidentPeriodLabel(draft.incidentPeriod, isBn)}`,
      onRemove: () => setDraft((current) => ({ ...current, incidentPeriod: 'all' })),
    });
  }

  if (config?.showEvidence && draft.evidence !== 'all') {
    selectedFilterChips.push({
      id: 'evidence',
      label: `${isBn ? 'প্রমাণ' : 'Evidence'}: ${getEvidenceLabel(draft.evidence, isBn)}`,
      onRemove: () => setDraft((current) => ({ ...current, evidence: 'all' })),
    });
  }

  if (config?.showUtilityBillTrend && draft.utilityBillTrend !== 'all') {
    selectedFilterChips.push({
      id: 'utility-bill-trend',
      label: `${isBn ? 'বিল' : 'Bill'}: ${getUtilityBillTrendLabel(draft.utilityBillTrend, isBn)}`,
      onRemove: () => setDraft((current) => ({ ...current, utilityBillTrend: 'all' })),
    });
  }

  return (
    <Modal
      id={`${section}-filter-sheet`}
      isOpen={isOpen}
      onClose={onClose}
      title={isBn ? 'ফিল্টার' : 'Filter'}
      maxWidth="lg"
      mobilePresentation="sheet"
      contentClassName={
        selectedFilterChips.length > 0
          ? 'overflow-y-auto overscroll-contain px-5 sm:px-6 pt-3 sm:pt-4 pb-5 sm:pb-6'
          : undefined
      }
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
        {selectedFilterChips.length > 0 && (
          <section
            aria-label={isBn ? 'নির্বাচিত ফিল্টার' : 'Selected filters'}
            className="border-b border-ui-stroke-subtle pb-2"
          >
            <div className="flex flex-wrap gap-2">
              {selectedFilterChips.map((chip) => (
                <button
                  key={chip.id}
                  id={`${section}-filter-chip-${chip.id}`}
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={
                    isBn
                      ? `${chip.label} ফিল্টার মুছুন`
                      : `Remove ${chip.label} filter`
                  }
                  className="inline-flex min-h-[44px] max-w-full items-center gap-2 ui-radius-pill border border-ui-stroke-subtle bg-ui-surface px-3 py-2 type-compact font-[var(--font-weight-medium)] text-ui-content-primary transition-colors hover:bg-ui-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                >
                  <X className="h-4 w-4 shrink-0 text-role-on-surface-muted" aria-hidden="true" />
                  <span className="truncate">{chip.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

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
