import type { CategoryFeedFilterState } from './categoryFeedFilters';
import type { HarassmentClassificationFilterState } from './harassmentClassification';

export interface HomeFeedFilterState {
  segmentId: string;
  subcategoryId: string;
  category: CategoryFeedFilterState;
  harassment: HarassmentClassificationFilterState;
}

export const createEmptyHomeFeedFilters = (): HomeFeedFilterState => ({
  segmentId: 'all',
  subcategoryId: 'all',
  category: {
    divisionId: 'all',
    districtId: 'all',
    incidentPeriod: 'all',
    evidence: 'all',
    utilityBillTrend: 'all',
  },
  harassment: {
    ageGroup: 'all',
    abuserRelationship: 'all',
    reportingFor: 'all',
  },
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

  const hasHarassmentClassification =
    filters.harassment.ageGroup !== 'all' ||
    filters.harassment.abuserRelationship !== 'all' ||
    filters.harassment.reportingFor !== 'all';

  return (
    divisionNeedsClientFiltering ||
    filters.segmentId !== 'all' ||
    filters.subcategoryId !== 'all' ||
    filters.category.incidentPeriod !== 'all' ||
    filters.category.evidence !== 'all' ||
    filters.category.utilityBillTrend !== 'all' ||
    hasHarassmentClassification
  );
};

/**
 * The live canonical_district_name() RPC helper accepts district ids as well as
 * Bangla/English names, so Home can keep the selected canonical id intact.
 */
export const resolveHomeFeedServerDistrict = (filters: HomeFeedFilterState): string =>
  filters.category.districtId || 'all';
