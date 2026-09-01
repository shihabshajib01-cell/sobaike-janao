import { SectionKey } from '../theme/tokens';

export interface ReportUpdate {
  dateBn: string;
  dateEn: string;
  titleBn: string;
  titleEn: string;
  contentBn: string;
  contentEn: string;
}

export interface ReportResponse {
  respondentBn?: string;
  respondentEn?: string;
  respondentName?: string;
  respondentTitle?: string;
  organization?: string;
  dateBn?: string;
  dateEn?: string;
  statementBn: string;
  statementEn: string;
  statusBn?: string;
  statusEn?: string;
}

export interface ReportTrustIndicators {
  evidenceSubmitted?: boolean;
  multipleReports?: boolean;
  updateAvailable?: boolean;
  responseReceived?: boolean;
  evidenceCount?: number;
  hasOfficialResponse?: boolean;
  hasRelatedReports?: boolean;
}

export interface PublicReportImage {
  id: string;
  url: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg' | 'image/png';
  sortOrder: number;
  srcSet?: string;
  sizes?: string;
}

export type ReportMediaType = 'none' | 'single' | 'gallery';

export interface ReportMedia {
  type: ReportMediaType;
  images: PublicReportImage[];
}

export interface ReportItem {
  id: string;
  segment: SectionKey;
  subcategoryId: string;
  subcategoryBn: string;
  subcategoryEn: string;
  titleBn: string;
  titleEn: string;
  shortDescriptionBn: string;
  shortDescriptionEn: string;
  fullDescriptionBn: string;
  fullDescriptionEn: string;
  reportedSubject?: string;
  reportedSubjectBn?: string;
  reportedSubjectEn?: string;
  subjectType?: 'individual' | 'business' | 'group' | 'location';
  organization?: string;
  locationBn: string;
  locationEn: string;
  districtBn: string;
  districtEn: string;
  areaBn: string;
  areaEn: string;
  incidentDateBn: string;
  incidentDateEn: string;
  publishedDateBn: string;
  publishedDateEn: string;
  publishedAt?: string;
  evidenceSummaryBn: string[];
  evidenceSummaryEn: string[];
  relatedReportCount?: number;
  status?: string;
  statusBn: string;
  statusEn: string;
  isHighUrgency?: boolean;
  coordinates?: { lat: number; lng: number };
  trustIndicators: ReportTrustIndicators;
  images?: PublicReportImage[];
  media?: ReportMedia;
  updates?: ReportUpdate[];
  response?: ReportResponse;
  relatedReportIds?: string[];
}
