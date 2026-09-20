import {
  matchesCategoryFeedFilters,
  matchesCategoryLocationFilters,
} from './categoryFeedFilters';
import { matchesHarassmentClassification } from './harassmentClassification';
import type { HomeFeedFilterState } from './homeFeedFilters';
import type { ReportItem } from '../types/report';
import type { SectionKey } from '../theme/tokens';

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
