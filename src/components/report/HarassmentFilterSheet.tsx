import React, { useEffect, useMemo, useState } from 'react';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import {
  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
  HarassmentClassificationFilterState,
} from '../../data/harassmentClassification';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Select } from '../ui/Select';
import { HarassmentClassificationFilters } from './HarassmentClassificationFilters';

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
    return BANGLADESH_DISTRICTS.filter(
      (district) => draftDivisionId === 'all' || district.divisionId === draftDivisionId
    );
  }, [draftDivisionId]);

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

  return (
    <Modal
      id="harassment-filter-sheet"
      isOpen={isOpen}
      onClose={onClose}
      title={isBn ? 'ফিল্টার' : 'Filter'}
      maxWidth="lg"
      mobilePresentation="sheet"
      footer={
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 w-full">
          <Button
            id="harassment-filter-reset-btn"
            type="button"
            variant="outline"
            onClick={resetDraft}
          >
            {isBn ? 'ফিল্টার মুছুন' : 'Clear filters'}
          </Button>
          <Button
            id="harassment-filter-apply-btn"
            type="button"
            fullWidth
            onClick={() =>
              onApply({
                divisionId: draftDivisionId,
                districtId: draftDistrictId,
                classification: draftClassification,
              })
            }
          >
            {isBn ? 'ফিল্টার প্রয়োগ করুন' : 'Apply filters'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Select
          id="harassment-filter-division"
          label={isBn ? 'বিভাগ' : 'Division'}
          value={draftDivisionId}
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
