import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { BANGLADESH_DISTRICTS, DIVISIONS } from '../../data/districts';
import {
  CATEGORY_FEED_FILTER_CONFIG,
  EMPTY_CATEGORY_FEED_FILTERS,
} from '../../data/categoryFeedFilters';
import {
  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
  HARASSMENT_AGE_GROUP_OPTIONS,
  HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
  HARASSMENT_REPORTING_FOR_OPTIONS,
  getBilingualOptionLabel,
} from '../../data/harassmentClassification';
import {
  createEmptyHomeFeedFilters,
  HomeFeedFilterState,
} from '../../data/homeFeedFilters';
import { useTaxonomy } from '../../services/taxonomyService';
import { SectionKey } from '../../theme/tokens';
import { sortByLocalizedName, sortOptionsByLabel } from '../../utils/sorters';
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

interface SelectedFilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

const getIncidentPeriodLabel = (
  value: HomeFeedFilterState['category']['incidentPeriod'],
  isBn: boolean
): string => {
  if (value === 'last-7-days') return isBn ? 'গত ৭ দিন' : 'Last 7 days';
  if (value === 'last-30-days') return isBn ? 'গত ৩০ দিন' : 'Last 30 days';
  if (value === 'older') return isBn ? '৩০ দিনের বেশি আগে' : 'More than 30 days ago';
  return '';
};

const getEvidenceLabel = (
  value: HomeFeedFilterState['category']['evidence'],
  isBn: boolean
): string => {
  if (value === 'with-evidence') return isBn ? 'সহায়ক তথ্য আছে' : 'Has supporting information';
  if (value === 'without-evidence') return isBn ? 'সহায়ক তথ্য নেই' : 'No supporting information';
  return '';
};

const getUtilityBillTrendLabel = (
  value: HomeFeedFilterState['category']['utilityBillTrend'],
  isBn: boolean
): string => {
  if (value === 'increased') return isBn ? 'বিল বেড়েছে' : 'Bill increased';
  if (value === 'not-increased') return isBn ? 'বিল বাড়েনি' : 'Bill did not increase';
  return '';
};

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
    () => sortByLocalizedName(Object.values(segments), language),
    [segments, language]
  );

  const subcategoryOptions = useMemo(() => {
    if (draft.segmentId === 'all') return [];
    return sortByLocalizedName(subcategories[draft.segmentId] || [], language);
  }, [draft.segmentId, subcategories, language]);

  const districtOptions = useMemo(
    () =>
      sortByLocalizedName(
        BANGLADESH_DISTRICTS.filter(
          (district) =>
            draft.category.divisionId === 'all' ||
            district.divisionId === draft.category.divisionId
        ),
        language
      ),
    [draft.category.divisionId, language]
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

  const selectedFilterChips: SelectedFilterChip[] = [];

  if (draft.segmentId !== 'all') {
    const selectedSegment = segments[draft.segmentId];
    selectedFilterChips.push({
      id: 'category',
      label:
        (isBn ? selectedSegment?.nameBn : selectedSegment?.nameEn) ||
        draft.segmentId,
      onRemove: () => handleSegmentChange('all'),
    });
  }

  if (draft.subcategoryId !== 'all') {
    const selectedSubcategory = subcategoryOptions.find(
      (subcategory) => subcategory.id === draft.subcategoryId
    );
    selectedFilterChips.push({
      id: 'subcategory',
      label:
        (isBn ? selectedSubcategory?.nameBn : selectedSubcategory?.nameEn) ||
        draft.subcategoryId,
      onRemove: () =>
        setDraft((current) => ({ ...current, subcategoryId: 'all' })),
    });
  }

  if (draft.category.divisionId !== 'all') {
    const selectedDivision = DIVISIONS.find(
      (division) => division.id === draft.category.divisionId
    );
    selectedFilterChips.push({
      id: 'division',
      label:
        (isBn ? selectedDivision?.nameBn : selectedDivision?.nameEn) ||
        draft.category.divisionId,
      onRemove: () => handleDivisionChange('all'),
    });
  }

  if (draft.category.districtId !== 'all') {
    const selectedDistrict = BANGLADESH_DISTRICTS.find(
      (district) => district.id === draft.category.districtId
    );
    selectedFilterChips.push({
      id: 'district',
      label:
        (isBn ? selectedDistrict?.nameBn : selectedDistrict?.nameEn) ||
        draft.category.districtId,
      onRemove: () =>
        setDraft((current) => ({
          ...current,
          category: { ...current.category, districtId: 'all' },
        })),
    });
  }

  if (draft.segmentId === 'harassment') {
    if (draft.harassment.ageGroup !== 'all') {
      selectedFilterChips.push({
        id: 'age-group',
        label: `${isBn ? 'বয়স' : 'Age'}: ${getBilingualOptionLabel(
          HARASSMENT_AGE_GROUP_OPTIONS,
          draft.harassment.ageGroup,
          language
        )}`,
        onRemove: () =>
          setDraft((current) => ({
            ...current,
            harassment: { ...current.harassment, ageGroup: 'all' },
          })),
      });
    }

    if (draft.harassment.abuserRelationship !== 'all') {
      selectedFilterChips.push({
        id: 'relationship',
        label: `${isBn ? 'সম্পর্ক' : 'Relationship'}: ${getBilingualOptionLabel(
          HARASSMENT_ABUSER_RELATIONSHIP_OPTIONS,
          draft.harassment.abuserRelationship,
          language
        )}`,
        onRemove: () =>
          setDraft((current) => ({
            ...current,
            harassment: { ...current.harassment, abuserRelationship: 'all' },
          })),
      });
    }

    if (draft.harassment.reportingFor !== 'all') {
      selectedFilterChips.push({
        id: 'reporting-for',
        label: `${isBn ? 'প্রতিবেদন' : 'Reporting for'}: ${getBilingualOptionLabel(
          HARASSMENT_REPORTING_FOR_OPTIONS,
          draft.harassment.reportingFor,
          language
        )}`,
        onRemove: () =>
          setDraft((current) => ({
            ...current,
            harassment: { ...current.harassment, reportingFor: 'all' },
          })),
      });
    }
  } else if (draft.segmentId !== 'all') {
    if (categoryConfig?.showIncidentPeriod && draft.category.incidentPeriod !== 'all') {
      selectedFilterChips.push({
        id: 'incident-period',
        label: `${isBn ? 'সময়' : 'Time'}: ${getIncidentPeriodLabel(
          draft.category.incidentPeriod,
          isBn
        )}`,
        onRemove: () =>
          setDraft((current) => ({
            ...current,
            category: { ...current.category, incidentPeriod: 'all' },
          })),
      });
    }

    if (categoryConfig?.showEvidence && draft.category.evidence !== 'all') {
      selectedFilterChips.push({
        id: 'evidence',
        label: `${isBn ? 'প্রমাণ' : 'Evidence'}: ${getEvidenceLabel(
          draft.category.evidence,
          isBn
        )}`,
        onRemove: () =>
          setDraft((current) => ({
            ...current,
            category: { ...current.category, evidence: 'all' },
          })),
      });
    }

    if (
      categoryConfig?.showUtilityBillTrend &&
      draft.category.utilityBillTrend !== 'all'
    ) {
      selectedFilterChips.push({
        id: 'utility-bill-trend',
        label: `${isBn ? 'বিল' : 'Bill'}: ${getUtilityBillTrendLabel(
          draft.category.utilityBillTrend,
          isBn
        )}`,
        onRemove: () =>
          setDraft((current) => ({
            ...current,
            category: { ...current.category, utilityBillTrend: 'all' },
          })),
      });
    }
  }

  return (
    <Modal
      id="home-feed-filter-sheet"
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
        {selectedFilterChips.length > 0 && (
          <section
            aria-label={isBn ? 'নির্বাচিত ফিল্টার' : 'Selected filters'}
            className="border-b border-ui-stroke-subtle pb-2"
          >
            <div className="flex flex-wrap gap-2">
              {selectedFilterChips.map((chip) => (
                <button
                  key={chip.id}
                  id={`home-filter-chip-${chip.id}`}
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
            ...sortByLocalizedName(DIVISIONS, language).map((division) => ({
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
              ...sortOptionsByLabel(
                [
                  { value: 'with-evidence', label: isBn ? 'সহায়ক তথ্য আছে' : 'Has supporting information' },
                  { value: 'without-evidence', label: isBn ? 'সহায়ক তথ্য নেই' : 'No supporting information' },
                ],
                language
              ),
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
              ...sortOptionsByLabel(
                [
                  { value: 'increased', label: isBn ? 'বিল বেড়েছে' : 'Bill increased' },
                  { value: 'not-increased', label: isBn ? 'বিল বাড়েনি' : 'Bill did not increase' },
                ],
                language
              ),
            ]}
          />
        )}
      </div>
    </Modal>
  );
};
