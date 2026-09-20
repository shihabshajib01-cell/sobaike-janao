import { BANGLADESH_DISTRICTS } from './districts';
import {
  CategoryFeedFilterState,
  EMPTY_CATEGORY_FEED_FILTERS,
  matchesCategoryFeedFilters,
  matchesCategoryLocationFilters,
} from './categoryFeedFilters';
import {
  EMPTY_HARASSMENT_CLASSIFICATION_FILTERS,
  HarassmentClassificationFilterState,
  hasActiveHarassmentClassificationFilters,
  matchesHarassmentClassification,
} from './harassmentClassification';
import { ReportItem } from '../types/report';
import { SectionKey } from '../theme/tokens';

export interface HomeFeedFilterState {
  segmentId: string;
  subcategoryId: string;
  category: CategoryFeedFilterState;
  harassment: HarassmentClassificationFilterState;
}

export const createEmptyHomeFeedFilters = (): HomeFeedFilterState => ({
  segmentId: 'all',
  subcategoryId: 'all',
  category: { ...EMPTY_CATEGORY_FEED_FILTERS },
  harassment: { ...EMPTY_HARASSMENT_CLASSIFICATION_FILTERS },
});

export const countActiveHomeFeedFilters = (filters: HomeFeedFilterState): number => {
  let count = 0;

  if (filters.segmentId !== 'all') count += 1;
  if (filters.subcategoryId !== 'all') count += 1;
  if (filters.category.divisionId !== 'all') count += 1;
  if (filters.category.districtId !== 'all') count += 1;

  if (filters.segmentId === 'harassment') {
    if (filters.harassment.ageGroup !== 'all') count += 1;
    if (filters.harassment.abuserRelationship !== 'all') count += 1;
    if (filters.harassment.reportingFor !== 'all') count += 1;
  } else if (filters.segmentId !== 'all') {
    if (filters.category.incidentPeriod !== 'all') count += 1;
    if (filters.category.evidence !== 'all') count += 1;
    if (filters.category.utilityBillTrend !== 'all') count += 1;
  }

  return count;
};

/**
 * Home keeps its optimized paginated RPC whenever district is the only
 * effective feed constraint. Any filter that the paginated RPC cannot express
 * switches Home to the existing complete ranked feed before client filtering.
 */
export const hasHomeFeedNonPaginatedFilters = (filters: HomeFeedFilterState): boolean => {
  const divisionNeedsClientFiltering =
    filters.category.divisionId !== 'all' && filters.category.districtId === 'all';

  return (
    divisionNeedsClientFiltering ||
    filters.segmentId !== 'all' ||
    filters.subcategoryId !== 'all' ||
    filters.category.incidentPeriod !== 'all' ||
    filters.category.evidence !== 'all' ||
    filters.category.utilityBillTrend !== 'all' ||
    hasActiveHarassmentClassificationFilters(filters.harassment)
  );
};

export const resolveHomeFeedServerDistrict = (filters: HomeFeedFilterState): string => {
  const districtSelection = filters.category.districtId;
  if (!districtSelection || districtSelection === 'all') return 'all';

  const normalizedSelection = districtSelection.trim().toLowerCase();
  const district = BANGLADESH_DISTRICTS.find(
    (item) =>
      item.id === districtSelection ||
      item.nameBn === districtSelection ||
      item.nameEn.toLowerCase() === normalizedSelection
  );

  return district?.nameEn || districtSelection;
};

export const matchesHomeFeedFilters = (
  report: ReportItem,
  filters: HomeFeedFilterState
): boolean => {
  if (filters.segmentId !== 'all' && report.segment !== filters.segmentId) {
    return false;
  }

  if (
    filters.subcategoryId !== 'all' &&
    report.subcategoryId !== filters.subcategoryId
  ) {
    return false;
  }

  if (filters.segmentId === 'harassment') {
    if (
      !matchesCategoryLocationFilters(
        report,
        filters.category.divisionId,
        filters.category.districtId
      )
    ) {
      return false;
    }

    return matchesHarassmentClassification(report, filters.harassment);
  }

  if (filters.segmentId === 'all') {
    return matchesCategoryLocationFilters(
      report,
      filters.category.divisionId,
      filters.category.districtId
    );
  }

  return matchesCategoryFeedFilters(
    report,
    filters.segmentId as SectionKey,
    filters.category
  );
};
