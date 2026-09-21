import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import {
  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
  HARASSMENT_AGE_GROUP_OPTIONS,
  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
  HARASSMENT_REPORTING_FOR_OPTIONS,
  HarassmentClassificationFilterState,
  getBilingualOptionLabel,
} from '../../data/harassmentClassification';
import { ModalActions } from '../ui/ModalActions';
import { Modal } from '../ui/Modal';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Select } from '../ui/Select';
import { HarassmentClassificationFilters } from './HarassmentClassificationFilters';
import { sortByLocalizedName } from '../../utils/sorters';

export interface HarassmentFilterValue {
  divisionId: string;
  districtId: string;
  classification: HarassmentClassificationFilterState;
}

export interface HarassmentFilterSheetProps {
  isOpen: boolean;
  language: 'bn' | 'en';
  value: HarassmentFilterValue;
  onClose: () => void;
  onApply: (next: HarassmentFilterValue) => void;
}

interface SelectedFilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

export const HarassmentFilterSheet: React.FC<HarassmentFilterSheetProps> = ({
  isOpen,
  language,
  value,
  onClose,
  onApply,
}) => {
  const isBn = language === 'bn';
  const [draftDivisionId, setDraftDivisionId] = useState(value.divisionId);
  const [draftDistrictId, setDraftDistrictId] = useState(value.districtId);
  const [draftClassification, setDraftClassification] = useState<HarassmentClassificationFilterState>(
    value.classification
  );

  useEffect(() => {
    if (!isOpen) return;
    setDraftDivisionId(value.divisionId);
    setDraftDistrictId(value.districtId);
    setDraftClassification({ ...value.classification });
  }, [isOpen, value.divisionId, value.districtId, value.classification]);

  const districtOptions = useMemo(() => {
    return sortByLocalizedName(
      BANGLADESH_DISTRICTS.filter(
        (district) => draftDivisionId === 'all' || district.divisionId === draftDivisionId
      ),
      language
    );
  }, [draftDivisionId, language]);

  const handleDivisionChange = (divisionId: string) => {
    setDraftDivisionId(divisionId);
    if (draftDistrictId === 'all') return;

    const selectedDistrict = BANGLADESH_DISTRICTS.find(
      (district) => district.id === draftDistrictId
    );
    if (!selectedDistrict || (divisionId !== 'all' && selectedDistrict.divisionId !== divisionId)) {
      setDraftDistrictId('all');
    }
  };

  const resetDraft = () => {
    setDraftDivisionId('all');
    setDraftDistrictId('all');
    setDraftClassification({ ...EMPTY_HARASSMENT_CLASSIFICATION_FILTERS });
  };

  const selectedFilterChips: SelectedFilterChip[] = [];

  if (draftDivisionId !== 'all') {
    const selectedDivision = DIVISIONS.find((division) => division.id === draftDivisionId);
    selectedFilterChips.push({
      id: 'division',
      label: (isBn ? selectedDivision?.nameBn : selectedDivision?.nameEn) || draftDivisionId,
      onRemove: () => handleDivisionChange('all'),
    });
  }

  if (draftDistrictId !== 'all') {
    const selectedDistrict = BANGLADESH_DISTRICTS.find(
      (district) => district.id === draftDistrictId
    );
    selectedFilterChips.push({
      id: 'district',
      label: (isBn ? selectedDistrict?.nameBn : selectedDistrict?.nameEn) || draftDistrictId,
      onRemove: () => setDraftDistrictId('all'),
    });
  }

  if (draftClassification.ageGroup !== 'all') {
    selectedFilterChips.push({
      id: 'age-group',
      label: `${isBn ? 'বয়স' : 'Age'}: ${getBilingualOptionLabel(
        HARASSMENT_AGE_GROUP_OPTIONS,
        draftClassification.ageGroup,
        language
      )}`,
      onRemove: () =>
        setDraftClassification((current) => ({ ...current, ageGroup: 'all' })),
    });
  }

  if (draftClassification.abuserRelationship !== 'all') {
    selectedFilterChips.push({
      id: 'relationship',
      label: `${isBn ? 'সম্পর্ক' : 'Relationship'}: ${getBilingualOptionLabel(
        HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
        draftClassification.abuserRelationship,
        language
      )}`,
      onRemove: () =>
        setDraftClassification((current) => ({ ...current, abuserRelationship: 'all' })),
    });
  }

  if (draftClassification.reportingFor !== 'all') {
    selectedFilterChips.push({
      id: 'reporting-for',
      label: `${isBn ? 'প্রতিবেদন' : 'Reporting for'}: ${getBilingualOptionLabel(
        HARASSMENT_REPORTING_FOR_OPTIONS,
        draftClassification.reportingFor,
        language
      )}`,
      onRemove: () =>
        setDraftClassification((current) => ({ ...current, reportingFor: 'all' })),
    });
  }

  return (
    <Modal
      id="harassment-filter-sheet"
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
            id: 'harassment-filter-apply-btn',
            type: 'button',
            onClick: () =>
              onApply({
                divisionId: draftDivisionId,
                districtId: draftDistrictId,
                classification: draftClassification,
              }),
            label: isBn ? 'ফিল্টার প্রয়োগ করুন' : 'Apply filters',
          }}
          secondary={{
            id: 'harassment-filter-reset-btn',
            type: 'button',
            onClick: resetDraft,
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
                  id={`harassment-filter-chip-${chip.id}`}
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
          id="harassment-filter-division"
          label={isBn ? 'বিভাগ' : 'Division'}
          value={draftDivisionId}
          onChange={(event) => handleDivisionChange(event.target.value)}
          options={[
            { value: 'all', label: isBn ? 'সকল বিভাগ' : 'All divisions' },
            ...sortByLocalizedName(DIVISIONS, language).map((division) => ({
              value: division.id,
              label: isBn ? division.nameBn : division.nameEn,
            })),
          ]}
        />

        <SearchableSelect
          id="harassment-filter-district"
          label={isBn ? 'জেলা' : 'District'}
          value={draftDistrictId}
          onChange={setDraftDistrictId}
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

        <HarassmentClassificationFilters
          language={language}
          value={draftClassification}
          onChange={setDraftClassification}
          className="grid-cols-1 sm:grid-cols-1 lg:grid-cols-1"
        />
      </div>
    </Modal>
  );
};
