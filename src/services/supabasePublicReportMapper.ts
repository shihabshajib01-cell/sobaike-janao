import { ReportItem } from '../types/report';
import { SectionKey } from '../theme/tokens';
import { toBanglaDigits } from '../utils/formatters';

export interface SupabasePublicReportRPC {
  id: string;
  segment: string;
  subcategoryId: string;
  subcategoryBn?: string;
  subcategoryEn?: string;
  titleBn?: string;
  titleEn?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  reportedSubject?: string | null;
  organization?: string | null;
  district?: string | null;
  area?: string | null;
  location?: string | null;
  incidentDate?: string | null;
  publishedAt?: string | null;
  priority?: string | null;
  hasSupportingInfo?: boolean | null;
  status?: string | null;
}

const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const ENGLISH_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const formatBanglaDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return toBanglaDigits(dateStr);
  }
  const day = toBanglaDigits(d.getDate().toString().padStart(2, '0'));
  const month = BANGLA_MONTHS[d.getMonth()];
  const year = toBanglaDigits(d.getFullYear());
  return `${day} ${month} ${year}`;
};

export const formatEnglishDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return dateStr;
  }
  const day = d.getDate().toString().padStart(2, '0');
  const month = ENGLISH_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

export const mapSupabasePublicReportToItem = (
  rpc: SupabasePublicReportRPC
): ReportItem => {
  const segment = (rpc.segment as SectionKey) || 'harassment';
  const subcategoryId = rpc.subcategoryId || '';
  const subcategoryBn = rpc.subcategoryBn || subcategoryId;
  const subcategoryEn = rpc.subcategoryEn || subcategoryId;

  const titleBn = rpc.titleBn || rpc.titleEn || rpc.id;
  const titleEn = rpc.titleEn || rpc.titleBn || rpc.id;

  const fullDescBn = rpc.descriptionBn || rpc.descriptionEn || '';
  const fullDescEn = rpc.descriptionEn || rpc.descriptionBn || '';

  const locationBn = rpc.location ? rpc.location : 'অবস্থান গোপন';
  const locationEn = rpc.location ? rpc.location : 'Location withheld';

  const districtBn = rpc.district || '';
  const districtEn = rpc.district || '';

  const areaBn = rpc.area || '';
  const areaEn = rpc.area || '';

  const incidentDateBn = rpc.incidentDate ? formatBanglaDate(rpc.incidentDate) : '';
  const incidentDateEn = rpc.incidentDate ? formatEnglishDate(rpc.incidentDate) : '';

  const publishedDateBn = rpc.publishedAt ? formatBanglaDate(rpc.publishedAt) : '';
  const publishedDateEn = rpc.publishedAt ? formatEnglishDate(rpc.publishedAt) : '';

  const priority = rpc.priority ? rpc.priority.toLowerCase() : 'medium';
  const isHighUrgency = priority === 'urgent' || priority === 'high';

  return {
    id: rpc.id,
    segment,
    subcategoryId,
    subcategoryBn,
    subcategoryEn,
    titleBn,
    titleEn,
    shortDescriptionBn: fullDescBn,
    shortDescriptionEn: fullDescEn,
    fullDescriptionBn: fullDescBn,
    fullDescriptionEn: fullDescEn,
    reportedSubject: rpc.reportedSubject || undefined,
    reportedSubjectBn: rpc.reportedSubject || undefined,
    reportedSubjectEn: rpc.reportedSubject || undefined,
    subjectType: 'individual',
    organization: rpc.organization || undefined,
    locationBn,
    locationEn,
    districtBn,
    districtEn,
    areaBn,
    areaEn,
    incidentDateBn,
    incidentDateEn,
    publishedDateBn,
    publishedDateEn,
    publishedAt: rpc.publishedAt || undefined,
    evidenceSummaryBn: [],
    evidenceSummaryEn: [],
    status: 'published',
    statusBn: 'প্রকাশিত',
    statusEn: 'Published',
    isHighUrgency,
    images: [],
    media: {
      type: 'none',
      images: [],
    },
    trustIndicators: {
      evidenceSubmitted: Boolean(rpc.hasSupportingInfo),
      multipleReports: false,
      updateAvailable: false,
      responseReceived: false,
      evidenceCount: 0,
      hasOfficialResponse: false,
      hasRelatedReports: false,
    },
    relatedReportIds: [],
    updates: [],
  };
};
