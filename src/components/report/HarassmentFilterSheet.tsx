import React, { useEffect, useMemo, useState } from 'react';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import {
  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
  HarassmentClassificationFilterState,
} from '../../data/harassmentClassification';
import { CategoryIcon } from '../branding/CategoryIcon';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Select } from '../ui/Select';
import { HarassmentClassificationFilters } from './HarassmentClassificationFilters';

export type HarassmentSubjectFilter = SectionKey | 'all';

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
  onApply: (next: HarassmentFilterValue, subject: HarassmentSubjectFilter) => void;
}

const SUBJECT_ORDER: SectionKey[] = [
  'harassment',
  'extortion',
  'public_safety',
  'road_transport',
  'load_shedding',
  'illegal_occupation',
  'rickshaw',
];

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
  const [draftSubject, setDraftSubject] = useState<HarassmentSubjectFilter>('harassment');
  const [draftClassification, setDraftClassification] = useState<HarassmentClassificationFilterState>(
    value.classification
  );

  useEffect(() => {
    if (!isOpen) return;
    setDraftDivisionId(value.divisionId);
    setDraftDistrictId(value.districtId);
    setDraftSubject('harassment');
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
    setDraftSubject('harassment');
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
      contentClassName="space-y-5"
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
              onApply(
                {
                  divisionId: draftDivisionId,
                  districtId: draftDistrictId,
                  classification: draftClassification,
                },
                draftSubject
              )
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

        <div>
          <p className="type-label text-ui-content-primary mb-2">
            {isBn ? 'বিষয়' : 'Subject'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="harassment-filter-subject-all"
              type="button"
              aria-pressed={draftSubject === 'all'}
              onClick={() => setDraftSubject('all')}
              className={`min-h-[48px] px-3 py-2 ui-radius-control ui-border-default type-action transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer ${
                draftSubject === 'all'
                  ? 'border-ui-accent-border bg-ui-accent-soft text-ui-content-primary'
                  : 'border-ui-stroke-default bg-ui-surface text-ui-content-secondary hover:bg-ui-surface-hover'
              }`}
            >
              {isBn ? 'সব বিষয়' : 'All subjects'}
            </button>

            {SUBJECT_ORDER.map((sectionKey) => {
              const section = SECTIONS[sectionKey];
              const selected = draftSubject === sectionKey;
              return (
                <button
                  key={sectionKey}
                  id={`harassment-filter-subject-${sectionKey}`}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setDraftSubject(sectionKey)}
                  className={`min-h-[48px] px-3 py-2 ui-radius-control ui-border-default type-action inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus cursor-pointer ${
                    selected
                      ? 'border-ui-accent-border bg-ui-accent-soft text-ui-content-primary'
                      : 'border-ui-stroke-default bg-ui-surface text-ui-content-secondary hover:bg-ui-surface-hover'
                  }`}
                >
                  <CategoryIcon section={sectionKey} size="xs" ariaLabel="" />
                  <span>{isBn ? section.shortNameBn : section.shortNameEn}</span>
                </button>
              );
            })}
          </div>
        </div>

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
