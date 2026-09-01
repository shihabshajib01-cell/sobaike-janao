import { dbEngine } from '../db/database';
import { DbPublicReportVersion, DbReportSubmission } from '../types';
import { ReportItem, PublicReportImage } from '../../src/types/report';
import { ReportAttachmentRepository } from './ReportAttachmentRepository';
import { MOCK_REPORTS } from '../../src/data/mockReports';

function mapRowToPv(row: any): DbPublicReportVersion {
  return {
    id: row.id,
    reportId: row.report_id,
    titleBn: row.title_bn,
    titleEn: row.title_en,
    shortDescriptionBn: row.short_description_bn,
    shortDescriptionEn: row.short_description_en,
    fullDescriptionBn: row.full_description_bn,
    fullDescriptionEn: row.full_description_en,
    reportedSubjectBn: row.reported_subject_bn || undefined,
    reportedSubjectEn: row.reported_subject_en || undefined,
    subjectType: row.subject_type || undefined,
    organization: row.organization || undefined,
    locationBn: row.location_bn,
    locationEn: row.location_en,
    districtBn: row.district_bn || undefined,
    districtEn: row.district_en || undefined,
    areaBn: row.area_bn || undefined,
    areaEn: row.area_en || undefined,
    coordinates: row.approved_coordinates_json ? JSON.parse(row.approved_coordinates_json) : undefined,
    evidenceSummaryBn: row.evidence_summary_bn_json ? JSON.parse(row.evidence_summary_bn_json) : [],
    evidenceSummaryEn: row.evidence_summary_en_json ? JSON.parse(row.evidence_summary_en_json) : [],
    sensitiveSettings: {
      reporterIdentity: row.reporter_identity_visibility || 'hidden',
      locationPrivacy: row.location_visibility || 'hidden',
      subjectNamePrivacy: row.subject_visibility || 'hidden',
      organizationPrivacy: row.organization_visibility || 'hidden',
      evidencePrivacy: row.evidence_visibility || 'hidden',
    },
    isHighUrgency: Boolean(row.is_high_urgency),
    publicAttachmentIds: row.public_attachment_ids_json ? JSON.parse(row.public_attachment_ids_json) : [],
    preparedAt: row.prepared_at,
    approvedAt: row.approved_at || undefined,
    publishedAt: row.published_at || undefined,
    updatedAt: row.updated_at,
  };
}

export const PublicReportRepository = {
  getByReportId(reportId: string): DbPublicReportVersion | null {
    const db = dbEngine.getDb();
    const cleanId = reportId.trim().toUpperCase();
    const row = db.prepare('SELECT * FROM public_versions WHERE UPPER(report_id) = ?').get(cleanId);
    if (!row) return null;
    return mapRowToPv(row);
  },

  async saveOrUpdate(pv: DbPublicReportVersion): Promise<DbPublicReportVersion> {
    const db = dbEngine.getDb();
    const existing = this.getByReportId(pv.reportId);
    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE public_versions SET
          title_bn = @title_bn,
          title_en = @title_en,
          short_description_bn = @short_description_bn,
          short_description_en = @short_description_en,
          full_description_bn = @full_description_bn,
          full_description_en = @full_description_en,
          subject_visibility = @subject_visibility,
          reported_subject_bn = @reported_subject_bn,
          reported_subject_en = @reported_subject_en,
          subject_type = @subject_type,
          organization_visibility = @organization_visibility,
          organization = @organization,
          location_visibility = @location_visibility,
          location_bn = @location_bn,
          location_en = @location_en,
          district_bn = @district_bn,
          district_en = @district_en,
          area_bn = @area_bn,
          area_en = @area_en,
          approved_coordinates_json = @approved_coordinates_json,
          evidence_visibility = @evidence_visibility,
          evidence_summary_bn_json = @evidence_summary_bn_json,
          evidence_summary_en_json = @evidence_summary_en_json,
          reporter_identity_visibility = @reporter_identity_visibility,
          public_reporter_name = @public_reporter_name,
          incident_date_bn = @incident_date_bn,
          incident_date_en = @incident_date_en,
          is_high_urgency = @is_high_urgency,
          public_attachment_ids_json = @public_attachment_ids_json,
          approved_at = @approved_at,
          published_at = @published_at,
          updated_at = @updated_at
        WHERE UPPER(report_id) = @report_id
      `).run({
        report_id: pv.reportId.toUpperCase(),
        title_bn: pv.titleBn,
        title_en: pv.titleEn,
        short_description_bn: pv.shortDescriptionBn || pv.fullDescriptionBn.slice(0, 160) + '...',
        short_description_en: pv.shortDescriptionEn || pv.fullDescriptionEn.slice(0, 160) + '...',
        full_description_bn: pv.fullDescriptionBn,
        full_description_en: pv.fullDescriptionEn,
        subject_visibility: pv.sensitiveSettings?.subjectNamePrivacy || 'hidden',
        reported_subject_bn: pv.reportedSubjectBn || null,
        reported_subject_en: pv.reportedSubjectEn || null,
        subject_type: pv.subjectType || 'individual',
        organization_visibility: pv.sensitiveSettings?.organizationPrivacy || 'hidden',
        organization: pv.organization || null,
        location_visibility: pv.sensitiveSettings?.locationPrivacy || 'hidden',
        location_bn: pv.locationBn,
        location_en: pv.locationEn,
        district_bn: pv.districtBn || null,
        district_en: pv.districtEn || null,
        area_bn: pv.areaBn || null,
        area_en: pv.areaEn || null,
        approved_coordinates_json: pv.coordinates ? JSON.stringify(pv.coordinates) : null,
        evidence_visibility: pv.sensitiveSettings?.evidencePrivacy || 'hidden',
        evidence_summary_bn_json: JSON.stringify(pv.evidenceSummaryBn || []),
        evidence_summary_en_json: JSON.stringify(pv.evidenceSummaryEn || []),
        reporter_identity_visibility: pv.sensitiveSettings?.reporterIdentity || 'hidden',
        public_reporter_name: null,
        incident_date_bn: pv.incidentDateBn,
        incident_date_en: pv.incidentDateEn,
        is_high_urgency: pv.isHighUrgency ? 1 : 0,
        public_attachment_ids_json: JSON.stringify(pv.publicAttachmentIds || []),
        approved_at: pv.approvedAt || existing.approvedAt || null,
        published_at: pv.publishedAt || existing.publishedAt || null,
        updated_at: now,
      });
    } else {
      db.prepare(`
        INSERT INTO public_versions (
          id, report_id, title_bn, title_en, short_description_bn, short_description_en,
          full_description_bn, full_description_en, subject_visibility, reported_subject_bn,
          reported_subject_en, subject_type, organization_visibility, organization,
          location_visibility, location_bn, location_en, district_bn, district_en,
          area_bn, area_en, approved_coordinates_json, evidence_visibility,
          evidence_summary_bn_json, evidence_summary_en_json, reporter_identity_visibility,
          public_reporter_name, incident_date_bn, incident_date_en, is_high_urgency,
          public_attachment_ids_json, prepared_at, approved_at, published_at, updated_at
        ) VALUES (
          @id, @report_id, @title_bn, @title_en, @short_description_bn, @short_description_en,
          @full_description_bn, @full_description_en, @subject_visibility, @reported_subject_bn,
          @reported_subject_en, @subject_type, @organization_visibility, @organization,
          @location_visibility, @location_bn, @location_en, @district_bn, @district_en,
          @area_bn, @area_en, @approved_coordinates_json, @evidence_visibility,
          @evidence_summary_bn_json, @evidence_summary_en_json, @reporter_identity_visibility,
          @public_reporter_name, @incident_date_bn, @incident_date_en, @is_high_urgency,
          @public_attachment_ids_json, @prepared_at, @approved_at, @published_at, @updated_at
        )
      `).run({
        id: pv.id || `pv-${pv.reportId}`,
        report_id: pv.reportId,
        title_bn: pv.titleBn,
        title_en: pv.titleEn,
        short_description_bn: pv.shortDescriptionBn || pv.fullDescriptionBn.slice(0, 160) + '...',
        short_description_en: pv.shortDescriptionEn || pv.fullDescriptionEn.slice(0, 160) + '...',
        full_description_bn: pv.fullDescriptionBn,
        full_description_en: pv.fullDescriptionEn,
        subject_visibility: pv.sensitiveSettings?.subjectNamePrivacy || 'hidden',
        reported_subject_bn: pv.reportedSubjectBn || null,
        reported_subject_en: pv.reportedSubjectEn || null,
        subject_type: pv.subjectType || 'individual',
        organization_visibility: pv.sensitiveSettings?.organizationPrivacy || 'hidden',
        organization: pv.organization || null,
        location_visibility: pv.sensitiveSettings?.locationPrivacy || 'hidden',
        location_bn: pv.locationBn,
        location_en: pv.locationEn,
        district_bn: pv.districtBn || null,
        district_en: pv.districtEn || null,
        area_bn: pv.areaBn || null,
        area_en: pv.areaEn || null,
        approved_coordinates_json: pv.coordinates ? JSON.stringify(pv.coordinates) : null,
        evidence_visibility: pv.sensitiveSettings?.evidencePrivacy || 'hidden',
        evidence_summary_bn_json: JSON.stringify(pv.evidenceSummaryBn || []),
        evidence_summary_en_json: JSON.stringify(pv.evidenceSummaryEn || []),
        reporter_identity_visibility: pv.sensitiveSettings?.reporterIdentity || 'hidden',
        public_reporter_name: null,
        incident_date_bn: pv.incidentDateBn,
        incident_date_en: pv.incidentDateEn,
        is_high_urgency: pv.isHighUrgency ? 1 : 0,
        public_attachment_ids_json: JSON.stringify(pv.publicAttachmentIds || []),
        prepared_at: pv.preparedAt || now,
        approved_at: pv.approvedAt || null,
        published_at: pv.publishedAt || null,
        updated_at: now,
      });
    }

    return this.getByReportId(pv.reportId)!;
  },

  async deleteByReportId(reportId: string): Promise<boolean> {
    const db = dbEngine.getDb();
    const result = db.prepare('DELETE FROM public_versions WHERE UPPER(report_id) = ?').run(reportId.trim().toUpperCase());
    return result.changes > 0;
  },

  /**
   * Strict privacy-compliant Public ReportItem generator.
   * ABSOLUTELY NEVER LEAKS:
   * - Reporter private contact / real name
   * - PIN / PIN hash
   * - Hidden subject / Hidden organization / Hidden location
   * - Private evidence notes / Intimate details / Admin notes
   */
  transformToPublicReportItem(
    submission: DbReportSubmission,
    pv: DbPublicReportVersion,
    relatedReportIds: string[] = [],
    hasOfficialResponse = false
  ): ReportItem {
    const titleBn = pv.titleBn || 'সর্বজনীন নাগরিক প্রতিবেদন';
    const titleEn = pv.titleEn || 'Public Citizen Report';
    const shortDescriptionBn = pv.shortDescriptionBn || pv.fullDescriptionBn.slice(0, 160) + '...';
    const shortDescriptionEn = pv.shortDescriptionEn || pv.fullDescriptionEn.slice(0, 160) + '...';
    const fullDescriptionBn = pv.fullDescriptionBn;
    const fullDescriptionEn = pv.fullDescriptionEn;

    // Subject Privacy
    const subjectPrivacy = pv.sensitiveSettings?.subjectNamePrivacy || 'hidden';
    let reportedSubject: string | undefined = undefined;
    let reportedSubjectBn: string | undefined = 'পরিচয় গোপন';
    let reportedSubjectEn: string | undefined = 'Subject withheld';

    if (subjectPrivacy === 'public' && pv.reportedSubjectBn) {
      reportedSubject = pv.reportedSubjectBn;
      reportedSubjectBn = pv.reportedSubjectBn;
      reportedSubjectEn = pv.reportedSubjectEn || pv.reportedSubjectBn;
    }

    // Organization Privacy
    const orgPrivacy = pv.sensitiveSettings?.organizationPrivacy || 'hidden';
    const organization = orgPrivacy === 'public' && pv.organization ? pv.organization : undefined;

    // Location Privacy
    const locPrivacy = pv.sensitiveSettings?.locationPrivacy || 'hidden';
    let locationBn = 'স্থান গোপন রাখা হয়েছে';
    let locationEn = 'Location withheld';
    let districtBn = 'জেলা অপ্রকাশিত';
    let districtEn = 'District withheld';
    let areaBn = '';
    let areaEn = '';
    let coordinates: { lat: number; lng: number } | undefined = undefined;

    if (locPrivacy === 'public') {
      locationBn = pv.locationBn || `${pv.areaBn || ''}, ${pv.districtBn || ''}`;
      locationEn = pv.locationEn || `${pv.areaEn || ''}, ${pv.districtEn || ''}`;
      districtBn = pv.districtBn || '';
      districtEn = pv.districtEn || '';
      areaBn = pv.areaBn || '';
      areaEn = pv.areaEn || '';
      if (pv.coordinates && typeof pv.coordinates.lat === 'number' && typeof pv.coordinates.lng === 'number') {
        coordinates = pv.coordinates;
      }
    } else if (locPrivacy === 'generalized') {
      districtBn = pv.districtBn || '';
      districtEn = pv.districtEn || '';
      areaBn = pv.areaBn || '';
      areaEn = pv.areaEn || '';
      locationBn = [pv.areaBn, pv.districtBn].filter(Boolean).join(', ') || pv.districtBn || '';
      locationEn = [pv.areaEn, pv.districtEn].filter(Boolean).join(', ') || pv.districtEn || '';
      // No coordinates for generalized
      coordinates = undefined;
    } else {
      // Hidden
      coordinates = undefined;
    }

    // Evidence summary: only approved public items
    const evidenceSummaryBn =
      pv.sensitiveSettings?.evidencePrivacy === 'public' && pv.evidenceSummaryBn && pv.evidenceSummaryBn.length > 0
        ? pv.evidenceSummaryBn
        : [];
    const evidenceSummaryEn =
      pv.sensitiveSettings?.evidencePrivacy === 'public' && pv.evidenceSummaryEn && pv.evidenceSummaryEn.length > 0
        ? pv.evidenceSummaryEn
        : [];

    // Public Image Attachments (strictly only approved IDs when evidence is public)
    let images: PublicReportImage[] | undefined = undefined;
    if (
      pv.sensitiveSettings?.evidencePrivacy === 'public' &&
      pv.publicAttachmentIds &&
      pv.publicAttachmentIds.length > 0
    ) {
      const approvedAtts = ReportAttachmentRepository.getApprovedPublicByReportId(
        submission.id,
        pv.publicAttachmentIds
      );
      if (approvedAtts.length > 0) {
        images = approvedAtts.map((att) => ({
          id: att.id,
          url: `/api/public/attachments/${att.id}`,
          width: att.width,
          height: att.height,
          mimeType: att.mimeType,
          sortOrder: att.sortOrder,
        }));
      }
    }

    if (!images || images.length === 0) {
      const mockMatch = MOCK_REPORTS.find((m) => m.id.toUpperCase() === submission.id.toUpperCase());
      if (mockMatch && mockMatch.images && mockMatch.images.length > 0) {
        images = mockMatch.images;
      }
    }

    const imageCount = images && images.length > 0 ? images.length : 0;
    const mediaType: 'none' | 'single' | 'gallery' =
      imageCount === 0 ? 'none' : imageCount === 1 ? 'single' : 'gallery';

    return {
      id: submission.id,
      segment: submission.segment,
      subcategoryId: submission.subcategoryId,
      subcategoryBn: submission.subcategoryBn,
      subcategoryEn: submission.subcategoryEn,
      titleBn,
      titleEn,
      shortDescriptionBn,
      shortDescriptionEn,
      fullDescriptionBn,
      fullDescriptionEn,
      reportedSubject,
      reportedSubjectBn,
      reportedSubjectEn,
      subjectType: pv.subjectType || 'individual',
      organization,
      locationBn,
      locationEn,
      districtBn,
      districtEn,
      areaBn,
      areaEn,
      coordinates,
      incidentDateBn: pv.incidentDateBn || '',
      incidentDateEn: pv.incidentDateEn || '',
      publishedDateBn: pv.publishedAt ? new Date(pv.publishedAt).toLocaleDateString('bn-BD') : '',
      publishedDateEn: pv.publishedAt
        ? new Date(pv.publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        : '',
      evidenceSummaryBn,
      evidenceSummaryEn,
      images,
      media: {
        type: mediaType,
        images: images || [],
      },
      status: 'published',
      statusBn: 'প্রকাশিত প্রতিবেদন',
      statusEn: 'Published',
      isHighUrgency: Boolean(pv.isHighUrgency),
      relatedReportCount: relatedReportIds.length,
      relatedReportIds,
      trustIndicators: {
        evidenceCount:
          (pv.sensitiveSettings?.evidencePrivacy === 'public' ? (pv.evidenceSummaryBn?.length || 0) : 0) +
          (images ? images.length : 0),
        hasOfficialResponse,
        hasRelatedReports: relatedReportIds.length > 0,
      },
    };
  },

  getAllPublished(filter?: {
    segment?: string;
    subcategory?: string;
    district?: string;
    search?: string;
    sort?: string;
    limit?: number;
  }): ReportItem[] {
    const db = dbEngine.getDb();

    // Query published submissions with their public_versions
    const rows = db.prepare(`
      SELECT s.*, pv.*, s.id as sub_id, pv.id as pv_id
      FROM report_submissions s
      JOIN public_versions pv ON UPPER(s.id) = UPPER(pv.report_id)
      WHERE s.status = 'published'
      ORDER BY s.published_at DESC, s.created_at DESC
    `).all() as any[];

    const result: ReportItem[] = [];

    for (const row of rows) {
      const submission = {
        id: row.sub_id,
        segment: row.segment,
        subcategoryId: row.subcategory_id,
        subcategoryBn: row.subcategory_bn,
        subcategoryEn: row.subcategory_en,
        title: row.title,
        status: row.status,
        privacyChoice: row.privacy_choice,
      } as any;

      const pv = mapRowToPv(row);

      // Related Reports
      const relRows = db.prepare(`
        SELECT report_b_id as id FROM related_reports WHERE UPPER(report_a_id) = ?
        UNION
        SELECT report_a_id as id FROM related_reports WHERE UPPER(report_b_id) = ?
      `).all(row.sub_id.toUpperCase(), row.sub_id.toUpperCase()) as { id: string }[];
      const relatedIds = relRows.map((r) => r.id);

      // Check published responses
      const pubRespRows = db.prepare(`
        SELECT * FROM subject_responses
        WHERE UPPER(report_id) = ? AND status = 'published'
        ORDER BY published_at DESC, created_at DESC
      `).all(row.sub_id.toUpperCase()) as any[];

      const hasOfficialResponse = pubRespRows.length > 0;
      const publicItem = this.transformToPublicReportItem(submission, pv, relatedIds, hasOfficialResponse);

      if (pubRespRows.length > 0) {
        const resp = pubRespRows[0];
        publicItem.response = {
          respondentName: resp.responder_name,
          respondentTitle: resp.designation || resp.responder_type,
          organization: resp.organization_name || undefined,
          statementBn: resp.official_statement,
          statementEn: resp.official_statement,
          dateBn: resp.published_at ? new Date(resp.published_at).toLocaleDateString('bn-BD') : undefined,
          dateEn: resp.published_at
            ? new Date(resp.published_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
            : undefined,
        };
      }

      // Apply Filters
      if (filter?.segment && filter.segment !== 'all' && publicItem.segment !== filter.segment) {
        continue;
      }
      if (filter?.subcategory && filter.subcategory !== 'all' && publicItem.subcategoryId !== filter.subcategory) {
        continue;
      }
      if (filter?.district && filter.district !== 'all') {
        const d = (publicItem.districtEn || '').toLowerCase();
        if (!d.includes(filter.district.toLowerCase())) {
          continue;
        }
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase().trim();
        const matches =
          publicItem.titleBn.toLowerCase().includes(q) ||
          publicItem.titleEn.toLowerCase().includes(q) ||
          publicItem.shortDescriptionBn.toLowerCase().includes(q) ||
          publicItem.shortDescriptionEn.toLowerCase().includes(q) ||
          publicItem.fullDescriptionBn.toLowerCase().includes(q) ||
          publicItem.fullDescriptionEn.toLowerCase().includes(q) ||
          (publicItem.reportedSubject && publicItem.reportedSubject.toLowerCase().includes(q)) ||
          (publicItem.organization && publicItem.organization.toLowerCase().includes(q)) ||
          (publicItem.locationBn && publicItem.locationBn.toLowerCase().includes(q)) ||
          (publicItem.locationEn && publicItem.locationEn.toLowerCase().includes(q));

        if (!matches) continue;
      }

      result.push(publicItem);
    }

    // Sorting
    result.sort((a, b) => {
      if (filter?.sort === 'oldest') {
        return a.id > b.id ? 1 : -1;
      }
      return b.id > a.id ? 1 : -1;
    });

    if (filter?.limit && filter.limit > 0) {
      return result.slice(0, filter.limit);
    }

    return result;
  },

  getPublishedById(id: string): ReportItem | null {
    const all = this.getAllPublished();
    const cleanId = id.trim().toUpperCase();
    return all.find((r) => r.id.toUpperCase() === cleanId) || null;
  },

  getMappableReports(filter?: { segment?: string }): ReportItem[] {
    const all = this.getAllPublished(filter);
    return all.filter((r) => {
      if (!r.coordinates) return false;
      return typeof r.coordinates.lat === 'number' && typeof r.coordinates.lng === 'number';
    });
  },
};
