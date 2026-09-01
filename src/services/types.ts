import { SectionKey } from '../theme/tokens';
import { ReportItem, ReportUpdate, ReportResponse, ReportTrustIndicators, PublicReportImage } from '../types/report';

export type { PublicReportImage };

export interface MentionedParty {
  id: string;
  type?: 'individual' | 'business' | 'group' | 'organization' | 'unknown';
  name: string;
  roleOrDesignation?: string;
  organization?: string;
  phoneOrContact?: string;
  publicProfileHandle?: string;
  address?: string;
  identifyingDescription?: string;
}

export interface ReportLocationData {
  formattedAddress: string;
  division: string;
  district: string;
  upazilaOrThana: string;
  area: string;
  road: string;
  landmark: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'more_info_needed'
  | 'approved'
  | 'published'
  | 'not_published';

export interface StatusHistoryEntry {
  date: string;
  status: ReportStatus;
  statusBn: string;
  statusEn: string;
  noteBn: string;
  noteEn: string;
}

export interface ClarificationRequest {
  id: string;
  reportId: string;
  message: string;
  requestedFields?: string[];
  createdAt: string;
  resolvedAt?: string;
  reporterResponse?: string;
}

export interface SensitiveInfoSettings {
  reporterIdentity: 'public' | 'hidden';
  locationPrivacy: 'public' | 'generalized' | 'hidden';
  subjectNamePrivacy: 'public' | 'hidden';
  organizationPrivacy: 'public' | 'hidden';
  evidencePrivacy: 'public' | 'hidden';
}

export interface PublicVersionData {
  titleBn: string;
  titleEn: string;
  shortDescriptionBn: string;
  shortDescriptionEn: string;
  fullDescriptionBn: string;
  fullDescriptionEn: string;
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
  evidenceSummaryBn: string[];
  evidenceSummaryEn: string[];
  sensitiveSettings: SensitiveInfoSettings;
  isHighUrgency?: boolean;
  coordinates?: { lat: number; lng: number };
  publicAttachmentIds?: string[];
}

export interface PendingReportImage {
  clientId: string;
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
}

export interface SubmittedReport {
  id: string;
  segment: SectionKey;
  subcategoryId: string;
  subcategoryBn: string;
  subcategoryEn: string;
  title: string;
  reportedSubject: string;
  mentionedParties?: MentionedParty[];
  subjectType: 'individual' | 'business' | 'group' | 'organization' | 'unknown';
  roleOrDesignation?: string;
  organization?: string;
  publicProfileHandle?: string;
  identifyingDescription?: string;
  incidentDate: string;
  incidentTime?: string;
  frequency: 'one-time' | 'repeated';
  relationshipContext?: string;
  intimateWhatHappened?: string;
  intimatePlatform?: string;
  description: string;
  location: ReportLocationData;
  hasSupportingInfo: boolean;
  evidenceTypes: string[];
  evidenceDescription: string;
  privacyChoice: 'anonymous' | 'admin_only' | 'public_identity';
  adminContact?: {
    name: string;
    contact: string;
  };
  publicationPreferences: {
    showSubjectName: boolean;
    showOrganization: boolean;
    showGeneralLocation: boolean;
    showDescription: boolean;
  };
  status: ReportStatus;
  statusBn: string;
  statusEn: string;
  createdAt: string;
  publishedAt?: string;
  history: StatusHistoryEntry[];
  publicVersion?: PublicVersionData;
  activeClarification?: ClarificationRequest;
  unpublishReason?: string;
  linkedReportIds?: string[];
  relatedRelationships?: Array<{
    targetReportId: string;
    relationshipType: 'same_subject' | 'same_organization' | 'same_location' | 'related_incident';
  }>;
}

export const CURRENT_REPORT_FLOW_VERSION = 3;

export interface DraftReport {
  flowVersion?: number;
  segment: SectionKey | null;
  currentStep: number;
  subcategoryId: string;
  title: string;
  subjectType: 'individual' | 'business' | 'group' | 'organization' | 'unknown';
  reportedSubject: string;
  mentionedParties?: MentionedParty[];
  roleOrDesignation: string;
  organization: string;
  publicProfileHandle: string;
  identifyingDescription: string;
  incidentDate: string;
  incidentTime: string;
  frequency: 'one-time' | 'repeated';
  relationshipContext: string;
  intimateWhatHappened: string;
  intimatePlatform: string;
  description: string;
  location: ReportLocationData;
  isDetailedLocation?: boolean;
  hasSupportingInfo: boolean;
  evidenceTypes: string[];
  evidenceDescription: string;
  privacyChoice: 'anonymous' | 'admin_only' | 'public_identity';
  adminName: string;
  adminContact: string;
  confirmPublicIdentity: boolean;
  publicationPreferences: {
    showSubjectName: boolean;
    showOrganization: boolean;
    showGeneralLocation: boolean;
    showDescription: boolean;
  };
  lastSavedAt: string;
}

export interface SubjectResponseRequest {
  id: string;
  reportId: string;
  reportTitle?: string;
  responderType: 'mentioned_person' | 'organization_rep' | 'legal_rep';
  responderName: string;
  contactEmailOrPhone: string;
  contactInfo?: string;
  organizationName?: string;
  designation?: string;
  officialStatement: string;
  supportingDocumentsNote?: string;
  supportingDocumentsSummary?: string[];
  requestCorrectionOrRemoval?: boolean;
  correctionDetails?: string;
  createdAt: string;
  status: 'pending_editorial_review' | 'published' | 'rejected';
  rejectionReason?: string;
  publishedAt?: string;
}

export interface CitizenSupplementaryInfo {
  id: string;
  reportId: string;
  type: 'witness_information' | 'experienced_similar' | 'clarification_response';
  description: string;
  witnessDate?: string;
  contactConsent: boolean;
  contactInfo?: string;
  createdAt: string;
}

export interface ModerationAuditLog {
  id: string;
  reportId: string;
  action: string;
  actionBn: string;
  actionEn: string;
  dateTime: string;
  previousStatus?: ReportStatus;
  newStatus?: ReportStatus;
  note?: string;
  actor: string;
}
