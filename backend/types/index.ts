import { SectionKey } from '../../src/theme/tokens';
import { ReportStatus, SensitiveInfoSettings } from '../../src/services/types';

export interface DbAdminUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin';
  createdAt: string;
  lastLoginAt?: string;
}

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

export interface DbReportLocation {
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

export interface DbReportSubmission {
  internalId?: string;
  id: string; // Human-readable ID e.g. SJ-2026-482910
  pinHash: string; // Securely hashed PIN (never plain text)
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
  location: DbReportLocation;
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
  publicVersion?: DbPublicReportVersion;
  activeClarification?: DbClarificationRequest;
  relatedRelationships?: any[];
  history?: any[];
  status: ReportStatus;
  statusBn: string;
  statusEn: string;
  unpublishReason?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface DbPublicReportVersion {
  id: string;
  reportId: string;
  titleBn: string;
  titleEn: string;
  shortDescriptionBn: string;
  shortDescriptionEn: string;
  fullDescriptionBn: string;
  fullDescriptionEn: string;
  subjectVisibility?: 'public' | 'hidden';
  reportedSubjectBn?: string;
  reportedSubjectEn?: string;
  subjectType?: 'individual' | 'business' | 'group' | 'location';
  organizationVisibility?: 'public' | 'hidden';
  organization?: string;
  locationVisibility?: 'public' | 'generalized' | 'hidden';
  locationBn: string;
  locationEn: string;
  districtBn?: string;
  districtEn?: string;
  areaBn?: string;
  areaEn?: string;
  coordinates?: { lat: number; lng: number };
  approvedCoordinates?: { lat: number; lng: number };
  sensitiveSettings?: SensitiveInfoSettings;
  evidenceVisibility?: 'public' | 'hidden';
  evidenceSummaryBn: string[];
  evidenceSummaryEn: string[];
  reporterIdentityVisibility?: 'public' | 'hidden';
  publicReporterName?: string;
  incidentDateBn?: string;
  incidentDateEn?: string;
  isHighUrgency?: boolean;
  publicAttachmentIds?: string[];
  preparedAt: string;
  approvedAt?: string;
  publishedAt?: string;
  updatedAt: string;
}

export interface DbReportAttachment {
  id: string;
  reportId: string;
  storageKey: string;
  mimeType: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
  sizeBytes: number;
  sha256: string;
  sortOrder: number;
  createdAt: string;
}

export interface DbClarificationRequest {
  id: string;
  reportId: string;
  message: string;
  requestedFields?: string[];
  reporterResponse?: string;
  createdAt: string;
  respondedAt?: string;
  resolvedAt?: string;
}

export interface DbSubjectResponse {
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
  status: 'pending_editorial_review' | 'published' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
}

export interface DbModerationEvent {
  id: string;
  reportId: string;
  action: string;
  actionBn: string;
  actionEn: string;
  previousStatus?: ReportStatus;
  newStatus?: ReportStatus;
  note?: string;
  actor: string;
  createdAt: string;
}

export interface DbRelatedReport {
  id: string;
  reportAId: string;
  reportBId: string;
  relationshipType: 'same_subject' | 'same_organization' | 'same_location' | 'related_incident';
  createdAt: string;
}

export interface AppDatabaseSchema {
  version: number;
  admins: DbAdminUser[];
  submissions: DbReportSubmission[];
  publicVersions: DbPublicReportVersion[];
  clarifications: DbClarificationRequest[];
  responses: DbSubjectResponse[];
  moderationEvents: DbModerationEvent[];
  relatedReports: DbRelatedReport[];
}
