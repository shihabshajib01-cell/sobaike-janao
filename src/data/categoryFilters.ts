import { SectionKey } from '../theme/tokens';
import { ReportItem } from '../types/report';
import { BANGLADESH_DISTRICTS } from './districts';

export type IncidentPeriodFilter = 'all' | 'last_7_days' | 'last_30_days' | 'last_90_days';
export type IncidentTimeBandFilter = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';
export type SupportingInfoFilter = 'all' | 'with_supporting' | 'without_supporting';
export type UtilityDurationFilter = 'all' | 'under_1h' | 'one_to_three_hours' | 'over_3h';
export type BillAmountFilter = 'all' | 'under_1000' | '1000_5000' | '5000_10000' | 'over_10000';

export interface CategoryFilterValue {
  divisionId: string;
  districtId: string;
  incidentPeriod: IncidentPeriodFilter;
  incidentTimeBand: IncidentTimeBandFilter;
  supportingInfo: SupportingInfoFilter;
  utilityDuration: UtilityDurationFilter;
  billAmount: BillAmountFilter;
}

export const EMPTY_CATEGORY_FILTER_VALUE: CategoryFilterValue = {
  divisionId: 'all',
  districtId: 'all',
  incidentPeriod: 'all',
  incidentTimeBand: 'all',
  supportingInfo: 'all',
  utilityDuration: 'all',
  billAmount: 'all',
};

export const CATEGORY_DISTRICT_OPTIONS = [
  { id: 'all', nameBn: 'সারা বাংলাদেশ', nameEn: 'All Bangladesh' },
  ...BANGLADESH_DISTRICTS.map((district) => ({
    id: district.id,
    nameBn: district.nameBn,
    nameEn: district.nameEn,
  })),
];

const normalizeDistrictName = (value?: string) =>
  value
    ?.trim()
    .toLocaleLowerCase()
    .replace('chittagong', 'chattogram')
    .replace('barisal', 'barishal');

export const resolveReportDistrict = (report: ReportItem) => {
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

export const matchesCategoryLocation = (
  report: ReportItem,
  divisionId: string,
  districtId: string
): boolean => {
  if (divisionId === 'all' && districtId === 'all') return true;

  const district = resolveReportDistrict(report);
  if (!district) return false;
  if (divisionId !== 'all' && district.divisionId !== divisionId) return false;
  if (districtId !== 'all' && district.id !== districtId) return false;
  return true;
};

export const getCategoryFilterVisibility = (
  section: SectionKey,
  selectedSubcategory: string
) => {
  const isUtilityInterruption =
    section === 'load_shedding' &&
    (selectedSubcategory === 'load-shedding-outage' || selectedSubcategory === 'gas-shortage');
  const isUtilityBill =
    section === 'load_shedding' && selectedSubcategory === 'excess-electricity-bill';

  return {
    incidentPeriod: section !== 'load_shedding' || isUtilityInterruption,
    incidentTimeBand:
      section === 'extortion' ||
      section === 'public_safety' ||
      section === 'road_transport' ||
      section === 'rickshaw',
    supportingInfo: section !== 'harassment',
    utilityDuration: isUtilityInterruption,
    billAmount: isUtilityBill,
  };
};

const matchesIncidentPeriod = (report: ReportItem, filter: IncidentPeriodFilter): boolean => {
  if (filter === 'all') return true;
  if (!report.incidentDateRaw) return false;

  const rawDate = report.incidentDateRaw.trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? new Date(`${rawDate}T00:00:00`)
    : new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const incidentStart = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  ).getTime();
  const daysAgo = Math.floor((todayStart - incidentStart) / 86_400_000);
  if (daysAgo < 0) return false;

  if (filter === 'last_7_days') return daysAgo <= 7;
  if (filter === 'last_30_days') return daysAgo <= 30;
  return daysAgo <= 90;
};

const parseClockMinutes = (value?: string): number | null => {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
};

const matchesIncidentTimeBand = (
  report: ReportItem,
  filter: IncidentTimeBandFilter
): boolean => {
  if (filter === 'all') return true;
  const minutes = parseClockMinutes(report.incidentTime);
  if (minutes === null) return false;
  const hour = Math.floor(minutes / 60);

  if (filter === 'morning') return hour >= 5 && hour < 12;
  if (filter === 'afternoon') return hour >= 12 && hour < 17;
  if (filter === 'evening') return hour >= 17 && hour < 21;
  return hour >= 21 || hour < 5;
};

const matchesSupportingInfo = (
  report: ReportItem,
  filter: SupportingInfoFilter
): boolean => {
  if (filter === 'all') return true;
  const hasSupportingInfo = Boolean(report.trustIndicators?.evidenceSubmitted);
  return filter === 'with_supporting' ? hasSupportingInfo : !hasSupportingInfo;
};

const matchesUtilityDuration = (
  report: ReportItem,
  filter: UtilityDurationFilter
): boolean => {
  if (filter === 'all') return true;
  const start = parseClockMinutes(report.incidentTime);
  const end = parseClockMinutes(report.utilityEndTime);
  if (start === null || end === null || end <= start) return false;

  const duration = end - start;
  if (filter === 'under_1h') return duration < 60;
  if (filter === 'one_to_three_hours') return duration >= 60 && duration <= 180;
  return duration > 180;
};

const matchesBillAmount = (report: ReportItem, filter: BillAmountFilter): boolean => {
  if (filter === 'all') return true;
  const amount = report.recentBillAmount;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return false;

  if (filter === 'under_1000') return amount < 1000;
  if (filter === '1000_5000') return amount >= 1000 && amount <= 5000;
  if (filter === '5000_10000') return amount > 5000 && amount <= 10000;
  return amount > 10000;
};

export const matchesCategoryFilters = (
  report: ReportItem,
  section: SectionKey,
  selectedSubcategory: string,
  filters: CategoryFilterValue
): boolean => {
  if (report.segment !== section) return false;
  if (selectedSubcategory !== 'all' && report.subcategoryId !== selectedSubcategory) return false;
  if (!matchesCategoryLocation(report, filters.divisionId, filters.districtId)) return false;

  const visibility = getCategoryFilterVisibility(section, selectedSubcategory);

  if (visibility.incidentPeriod && !matchesIncidentPeriod(report, filters.incidentPeriod)) {
    return false;
  }
  if (visibility.incidentTimeBand && !matchesIncidentTimeBand(report, filters.incidentTimeBand)) {
    return false;
  }
  if (visibility.supportingInfo && !matchesSupportingInfo(report, filters.supportingInfo)) {
    return false;
  }
  if (visibility.utilityDuration && !matchesUtilityDuration(report, filters.utilityDuration)) {
    return false;
  }
  if (visibility.billAmount && !matchesBillAmount(report, filters.billAmount)) {
    return false;
  }

  return true;
};
