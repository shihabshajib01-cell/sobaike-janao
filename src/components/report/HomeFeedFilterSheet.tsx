import React, { useEffect, useMemo, useState } from 'react';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import {
  CATEGORY_FEED_FILTER_CONFIG,
  EMPTY_CATEGORY_FEED_FILTERS,
} from '../../data/categoryFeedFilters';
import {
  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
} from '../../data/harassmentClassification';
import {
  createEmptyHomeFeedFilters,
  HomeFeedFilterState,
} from '../../data/homeFeedFilters';
import { useTaxonomy } from '../../services/taxonomyService';
import { SectionKey } from '../../theme/tokens';
import { Modal } from '../ui/Modal';
import { ModalActions } from '../ui/ModalActions';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Select } from '../ui/Select';
import { HarassmentClassificationFilters } from './HarassmentClassificationFilters';

export interface HomeFeedFilterSheetProps {
  isOpen: boolean;
  language: 'bn' | 'en';
  value: HomeFeedFilterState;
  onClose: () => void;
  onApply: (next: HomeFeedFilterState) => void;
}

const cloneFilters = (value: HomeFeedFilterState): HomeFeedFilterState => ({
  segmentId: value.segmentId,
  subcategoryId: value.subcategoryId,
  category: { ...value.category },
  harassment: { ...value.harassment },
});

export const HomeFeedFilterSheet: React.FC<HomeFeedFilterSheetProps> = ({
  isOpen,
  language,
  value,
  onClose,
  onApply,
}) => {
  const isBn = language === 'bn';
  const { segments, subcategories } = useTaxonomy();
  const [draft, setDraft] = useState<HomeFeedFilterState>(() => cloneFilters(value));

  useEffect(() => {
    if (!isOpen) return;
    setDraft(cloneFilters(value));
  }, [isOpen, value]);

  const segmentOptions = useMemo(
    () =>
      Object.values(segments).sort(
        (a, b) =>
          (a.sortOrder ?? Number.MAX_SAFE_INTEGER) -
            (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
          a.nameEn.localeCompare(b.nameEn)
      ),
    [segments]
  );

  const subcategoryOptions = useMemo(() => {
    if (draft.segmentId === 'all') return [];
    return subcategories[draft.segmentId] || [];
  }, [draft.segmentId, subcategories]);

  const districtOptions = useMemo(
    () =>
      BANGLADESH_DISTRICTS.filter(
        (district) =>
          draft.category.divisionId === 'all' ||
          district.divisionId === draft.category.divisionId
      ),
    [draft.category.divisionId]
  );

  const categoryConfig =
    draft.segmentId !== 'all' && draft.segmentId !== 'harassment'
      ? CATEGORY_FEED_FILTER_CONFIG[draft.segmentId as SectionKey]
      : undefined;

  const handleSegmentChange = (segmentId: string) => {
    setDraft((current) => ({
      ...current,
      segmentId,
      subcategoryId: 'all',
      category: {
        ...EMPTY_CATEGORY_FEED_FILTERS,
        divisionId: current.category.divisionId,
        districtId: current.category.districtId,
      },
      harassment: { ...EMPTY_HARASSMENT_CLASSIFICATION_FILTERS },
    }));
  };

  const handleDivisionChange = (divisionId: string) => {
    setDraft((current) => {
      let districtId = current.category.districtId;

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

      return {
        ...current,
        category: {
          ...current.category,
          divisionId,
          districtId,
        },
      };
    });
  };

  return (
    <Modal
      id="home-feed-filter-sheet"
      isOpen={isOpen}
      onClose={onClose}
      title={isBn ? 'ফিল্টার' : 'Filter'}
      maxWidth="lg"
      mobilePresentation="sheet"
      footer={
        <ModalActions
          primary={{
            id: 'home-feed-filter-apply-btn',
            type: 'button',
            onClick: () => onApply(cloneFilters(draft)),
            label: isBn ? 'ফিল্টার প্রয়োগ করুন' : 'Apply filters',
          }}
          secondary={{
            id: 'home-feed-filter-reset-btn',
            type: 'button',
            onClick: () => setDraft(createEmptyHomeFeedFilters()),
            label: isBn ? 'ফিল্টার মুছুন' : 'Clear filters',
          }}
        />
      }
    >
      <div className="space-y-5">
        <Select
          id="home-feed-filter-category"
          label={isBn ? 'বিষয়' : 'Category'}
          value={draft.segmentId}
          onChange={(event) => handleSegmentChange(event.target.value)}
          options={[
            { value: 'all', label: isBn ? 'সকল বিষয়' : 'All categories' },
            ...segmentOptions.map((segment) => ({
              value: segment.id,
              label: isBn ? segment.nameBn : segment.nameEn,
            })),
          ]}
        />

        {draft.segmentId !== 'all' && subcategoryOptions.length > 0 && (
          <SearchableSelect
            id="home-feed-filter-subcategory"
            label={isBn ? 'উপবিষয়' : 'Subcategory'}
            value={draft.subcategoryId}
            onChange={(subcategoryId) =>
              setDraft((current) => ({ ...current, subcategoryId }))
            }
            placeholder={isBn ? 'সকল উপবিষয়' : 'All subcategories'}
            searchPlaceholder={isBn ? 'উপবিষয় খুঁজুন...' : 'Search subcategories...'}
            noResultsText={isBn ? 'কোনো উপবিষয় পাওয়া যায়নি' : 'No matching subcategory'}
            options={[
              { value: 'all', label: isBn ? 'সকল উপবিষয়' : 'All subcategories' },
              ...subcategoryOptions
                .filter((subcategory) => subcategory.id !== 'all')
                .map((subcategory) => ({
                  value: subcategory.id,
                  label: isBn ? subcategory.nameBn : subcategory.nameEn,
                  keywords: [subcategory.nameBn, subcategory.nameEn],
                })),
            ]}
          />
        )}

        <Select
          id="home-feed-filter-division"
          label={isBn ? 'বিভাগ' : 'Division'}
          value={draft.category.divisionId}
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
          id="home-feed-filter-district"
          label={isBn ? 'জেলা' : 'District'}
          value={draft.category.districtId}
          onChange={(districtId) =>
            setDraft((current) => ({
              ...current,
              category: { ...current.category, districtId },
            }))
          }
          placeholder={isBn ? 'সকল জেলা' : 'All districts'}
          searchPlaceholder={isBn ? 'জেলা খুঁজুন...' : 'Search districts...'}
          noResultsText={isBn ? 'কোনো জেলা পাওয়া যায়নি' : 'No matching district'}
          options={[
            { value: 'all', label: isBn ? 'সকল জেলা' : 'All districts' },
            ...districtOptions.map((district) => ({
              value: district.id,
              label: isBn ? district.nameBn : district.nameEn,
              keywords: [
                district.nameBn,
                district.nameEn,
                district.divisionBn,
                district.divisionEn,
              ],
            })),
          ]}
        />

        {draft.segmentId === 'harassment' && (
          <HarassmentClassificationFilters
            language={language}
            value={draft.harassment}
            onChange={(harassment) =>
              setDraft((current) => ({ ...current, harassment }))
            }
            className="grid-cols-1 sm:grid-cols-1 lg:grid-cols-1"
          />
        )}

        {categoryConfig?.showIncidentPeriod && (
          <Select
            id="home-feed-filter-incident-period"
            label={isBn ? 'ঘটনার সময়কাল' : 'Incident period'}
            value={draft.category.incidentPeriod}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                category: {
                  ...current.category,
                  incidentPeriod: event.target
                    .value as HomeFeedFilterState['category']['incidentPeriod'],
                },
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

        {categoryConfig?.showEvidence && (
          <Select
            id="home-feed-filter-evidence"
            label={isBn ? 'সহায়ক তথ্য বা প্রমাণ' : 'Supporting information'}
            value={draft.category.evidence}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                category: {
                  ...current.category,
                  evidence: event.target
                    .value as HomeFeedFilterState['category']['evidence'],
                },
              }))
            }
            options={[
              { value: 'all', label: isBn ? 'সকল প্রতিবেদন' : 'All reports' },
              { value: 'with-evidence', label: isBn ? 'সহায়ক তথ্য আছে' : 'Has supporting information' },
              { value: 'without-evidence', label: isBn ? 'সহায়ক তথ্য নেই' : 'No supporting information' },
            ]}
          />
        )}

        {categoryConfig?.showUtilityBillTrend && (
          <Select
            id="home-feed-filter-bill-trend"
            label={isBn ? 'বিদ্যুৎ বিলের পরিবর্তন' : 'Electricity bill change'}
            value={draft.category.utilityBillTrend}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                category: {
                  ...current.category,
                  utilityBillTrend: event.target
                    .value as HomeFeedFilterState['category']['utilityBillTrend'],
                },
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
