import { BANGLADESH_DISTRICTS } from '../data/districts';
import { ReportItem } from '../types/report';

export type PartyDetailFilter = 'all' | 'named' | 'organization' | 'unspecified';
export type UtilityDetailFilter =
  | 'all'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'bill-positive'
  | 'bill-25'
  | 'bill-50'
  | 'bill-100';

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

export const matchesReportLocation = (
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

export const matchesPartyDetailFilter = (
  report: ReportItem,
  filter: PartyDetailFilter
) => {
  if (filter === 'all') return true;

  const hasSubject = Boolean(report.reportedSubject?.trim());
  const hasOrganization = Boolean(report.organization?.trim());

  if (filter === 'organization') return hasOrganization;
  if (filter === 'named') return hasSubject && !hasOrganization;
  return !hasSubject && !hasOrganization;
};

const classifyTimeOfDay = (time?: string) => {
  if (!time) return null;
  const match = time.match(/^(\d{1,2}):/);
  if (!match) return null;
  const hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;

  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export const matchesUtilityDetailFilter = (
  report: ReportItem,
  selectedSubcategory: string,
  filter: UtilityDetailFilter
) => {
  if (filter === 'all') return true;

  if (
    selectedSubcategory === 'load-shedding-outage' ||
    selectedSubcategory === 'gas-shortage'
  ) {
    return classifyTimeOfDay(report.incidentTime) === filter;
  }

  if (selectedSubcategory === 'excess-electricity-bill') {
    if (
      report.recentBillAmount === undefined ||
      report.previousBillAmount === undefined ||
      report.previousBillAmount <= 0
    ) {
      return false;
    }

    const increasePercent =
      ((report.recentBillAmount - report.previousBillAmount) / report.previousBillAmount) * 100;

    if (filter === 'bill-positive') return increasePercent > 0;
    if (filter === 'bill-25') return increasePercent >= 25;
    if (filter === 'bill-50') return increasePercent >= 50;
    if (filter === 'bill-100') return increasePercent >= 100;
  }

  return true;
};
