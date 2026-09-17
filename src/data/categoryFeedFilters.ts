import { BANGLADESH_DISTRICTS } from './districts';
import { SectionKey } from '../theme/tokens';
import { ReportItem } from '../types/report';

export type IncidentPeriodFilter = 'all' | 'last-7-days' | 'last-30-days' | 'older';
export type EvidenceAvailabilityFilter = 'all' | 'with-evidence' | 'without-evidence';
export type UtilityBillTrendFilter = 'all' | 'increased' | 'not-increased';

export interface CategoryFeedFilterState {
  divisionId: string;
  districtId: string;
  incidentPeriod: IncidentPeriodFilter;
  evidence: EvidenceAvailabilityFilter;
  utilityBillTrend: UtilityBillTrendFilter;
}

export const EMPTY_CATEGORY_FEED_FILTERS: CategoryFeedFilterState = {
  divisionId: 'all',
  districtId: 'all',
  incidentPeriod: 'all',
  evidence: 'all',
  utilityBillTrend: 'all',
};

export interface CategoryFeedFilterConfig {
  showIncidentPeriod: boolean;
  showEvidence: boolean;
  showUtilityBillTrend: boolean;
}

export const CATEGORY_FEED_FILTER_CONFIG: Partial<Record<SectionKey, CategoryFeedFilterConfig>> = {
  extortion: {
    showIncidentPeriod: true,
    showEvidence: true,
    showUtilityBillTrend: false,
  },
  public_safety: {
    showIncidentPeriod: true,
    showEvidence: true,
    showUtilityBillTrend: false,
  },
  road_transport: {
    showIncidentPeriod: true,
    showEvidence: true,
    showUtilityBillTrend: false,
  },
  load_shedding: {
    showIncidentPeriod: true,
    showEvidence: true,
    showUtilityBillTrend: true,
  },
  illegal_occupation: {
    showIncidentPeriod: true,
    showEvidence: true,
    showUtilityBillTrend: false,
  },
  rickshaw: {
    showIncidentPeriod: true,
    showEvidence: true,
    showUtilityBillTrend: false,
  },
};

const normalizeDistrictName = (value?: string) =>
  value
    ?.trim()
    .toLocaleLowerCase()
    .replace('chittagong', 'chattogram')
    .replace('barisal', 'barishal');

const resolveReportDistrict = (report: ReportItem) => {
  const districtBn = report.districtBn?.trim();
  const districtEn = normalizeDistrictName(report.districtEn);

  return BANGLADESH_DISTRICTS.find((district) => {
    const optionEn = normalizeDistrictName(district.nameEn);
    return (
      (districtBn && (districtBn === district.nameBn || districtBn.includes(district.nameBn))) ||
      (districtEn && optionEn && (districtEn === optionEn || districtEn.includes(optionEn)))
    );
  });
};

export const matchesCategoryLocationFilters = (
  report: ReportItem,
  divisionId: string,
  districtId: string
) => {
  if (divisionId === 'all' && districtId === 'all') return true;

  const district = resolveReportDistrict(report);
  if (!district) return false;
  if (divisionId !== 'all' && district.divisionId !== divisionId) return false;
  if (districtId !== 'all' && district.id !== districtId) return false;
  return true;
};

const parseIncidentDate = (report: ReportItem): Date | null => {
  const raw = report.incidentDate;
  if (raw) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date;
  }

  if (report.incidentDateEn) {
    const fallback = new Date(report.incidentDateEn);
    if (!Number.isNaN(fallback.getTime())) return fallback;
  }

  return null;
};

const matchesIncidentPeriod = (report: ReportItem, period: IncidentPeriodFilter) => {
  if (period === 'all') return true;

  const incidentDate = parseIncidentDate(report);
  if (!incidentDate) return false;

  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const ageMs = now.getTime() - incidentDate.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const ageDays = ageMs / dayMs;

  if (period === 'last-7-days') return ageDays >= 0 && ageDays <= 7;
  if (period === 'last-30-days') return ageDays >= 0 && ageDays <= 30;
  return ageDays > 30;
};

const matchesEvidenceAvailability = (
  report: ReportItem,
  evidence: EvidenceAvailabilityFilter
) => {
  if (evidence === 'all') return true;
  const hasEvidence = Boolean(report.trustIndicators?.evidenceSubmitted);
  return evidence === 'with-evidence' ? hasEvidence : !hasEvidence;
};

const matchesUtilityBillTrend = (report: ReportItem, trend: UtilityBillTrendFilter) => {
  if (trend === 'all') return true;
  if (
    typeof report.recentBillAmount !== 'number' ||
    typeof report.previousBillAmount !== 'number'
  ) {
    return false;
  }

  const increased = report.recentBillAmount > report.previousBillAmount;
  return trend === 'increased' ? increased : !increased;
};

export const matchesCategoryFeedFilters = (
  report: ReportItem,
  section: SectionKey,
  filters: CategoryFeedFilterState
) => {
  if (!matchesCategoryLocationFilters(report, filters.divisionId, filters.districtId)) {
    return false;
  }

  const config = CATEGORY_FEED_FILTER_CONFIG[section];
  if (!config) return true;

  if (config.showIncidentPeriod && !matchesIncidentPeriod(report, filters.incidentPeriod)) {
    return false;
  }

  if (config.showEvidence && !matchesEvidenceAvailability(report, filters.evidence)) {
    return false;
  }

  if (
    config.showUtilityBillTrend &&
    !matchesUtilityBillTrend(report, filters.utilityBillTrend)
  ) {
    return false;
  }

  return true;
};
