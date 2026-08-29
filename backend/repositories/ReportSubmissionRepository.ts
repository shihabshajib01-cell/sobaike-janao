import { dbEngine } from '../db/database';
import { DbReportSubmission, DbPublicReportVersion, DbClarificationRequest } from '../types';

function mapRowToSubmission(row: any, db: any): DbReportSubmission {
  const location = row.location_json ? JSON.parse(row.location_json) : {};
  const evidenceTypes = row.evidence_types_json ? JSON.parse(row.evidence_types_json) : [];
  const adminContact = row.admin_contact_json ? JSON.parse(row.admin_contact_json) : undefined;
  const publicationPreferences = row.publication_preferences_json
    ? JSON.parse(row.publication_preferences_json)
    : {};
  const mentionedParties = row.mentioned_parties_json
    ? JSON.parse(row.mentioned_parties_json)
    : (row.reported_subject ? [{ id: 'party-1', name: row.reported_subject, type: row.subject_type || 'individual', roleOrDesignation: row.role_or_designation || undefined, organization: row.organization || undefined, publicProfileHandle: row.public_profile_handle || undefined, identifyingDescription: row.identifying_description || undefined }] : []);

  // Fetch Public Version
  const pvRow = db.prepare(`
    SELECT * FROM public_versions WHERE report_id = ?
  `).get(row.id);

  let publicVersion: DbPublicReportVersion | undefined = undefined;
  if (pvRow) {
    publicVersion = {
      id: pvRow.id,
      reportId: pvRow.report_id,
      titleBn: pvRow.title_bn,
      titleEn: pvRow.title_en,
      shortDescriptionBn: pvRow.short_description_bn,
      shortDescriptionEn: pvRow.short_description_en,
      fullDescriptionBn: pvRow.full_description_bn,
      fullDescriptionEn: pvRow.full_description_en,
      reportedSubjectBn: pvRow.reported_subject_bn || undefined,
      reportedSubjectEn: pvRow.reported_subject_en || undefined,
      subjectType: pvRow.subject_type || undefined,
      organization: pvRow.organization || undefined,
      locationBn: pvRow.location_bn,
      locationEn: pvRow.location_en,
      districtBn: pvRow.district_bn || undefined,
      districtEn: pvRow.district_en || undefined,
      areaBn: pvRow.area_bn || undefined,
      areaEn: pvRow.area_en || undefined,
      coordinates: pvRow.approved_coordinates_json ? JSON.parse(pvRow.approved_coordinates_json) : undefined,
      evidenceSummaryBn: pvRow.evidence_summary_bn_json ? JSON.parse(pvRow.evidence_summary_bn_json) : [],
      evidenceSummaryEn: pvRow.evidence_summary_en_json ? JSON.parse(pvRow.evidence_summary_en_json) : [],
      sensitiveSettings: {
        reporterIdentity: pvRow.reporter_identity_visibility || 'hidden',
        locationPrivacy: pvRow.location_visibility || 'hidden',
        subjectNamePrivacy: pvRow.subject_visibility || 'hidden',
        organizationPrivacy: pvRow.organization_visibility || 'hidden',
        evidencePrivacy: pvRow.evidence_visibility || 'hidden',
      },
      isHighUrgency: Boolean(pvRow.is_high_urgency),
      preparedAt: pvRow.prepared_at,
      approvedAt: pvRow.approved_at || undefined,
      publishedAt: pvRow.published_at || undefined,
      updatedAt: pvRow.updated_at,
    };
  }

  // Fetch Clarification
  const clarRow = db.prepare(`
    SELECT * FROM clarification_requests WHERE report_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(row.id);

  let activeClarification: DbClarificationRequest | undefined = undefined;
  if (clarRow) {
    activeClarification = {
      id: clarRow.id,
      reportId: clarRow.report_id,
      message: clarRow.message,
      requestedFields: clarRow.requested_fields_json ? JSON.parse(clarRow.requested_fields_json) : [],
      reporterResponse: clarRow.reporter_response || undefined,
      createdAt: clarRow.created_at,
      respondedAt: clarRow.responded_at || undefined,
      resolvedAt: clarRow.resolved_at || undefined,
    };
  }

  // Fetch Related Links
  const relatedRows = db.prepare(`
    SELECT report_b_id as targetReportId, relationship_type as relationshipType FROM related_reports WHERE report_a_id = ?
    UNION
    SELECT report_a_id as targetReportId, relationship_type as relationshipType FROM related_reports WHERE report_b_id = ?
  `).all(row.id, row.id);

  // Fetch History from moderation_events
  const historyRows = db.prepare(`
    SELECT action, action_bn, action_en, new_status, note, created_at
    FROM moderation_events
    WHERE report_id = ?
    ORDER BY created_at ASC
  `).all(row.id);

  const history = historyRows.map((h: any) => ({
    status: h.new_status || 'submitted',
    statusBn: h.action_bn,
    statusEn: h.action_en,
    timestamp: h.created_at,
    noteBn: h.note || undefined,
    noteEn: h.note || undefined,
  }));

  return {
    id: row.id,
    pinHash: row.pin_hash,
    segment: row.segment,
    subcategoryId: row.subcategory_id,
    subcategoryBn: row.subcategory_bn,
    subcategoryEn: row.subcategory_en,
    title: row.title,
    reportedSubject: row.reported_subject || '',
    mentionedParties,
    subjectType: row.subject_type || 'individual',
    roleOrDesignation: row.role_or_designation || undefined,
    organization: row.organization || undefined,
    publicProfileHandle: row.public_profile_handle || undefined,
    identifyingDescription: row.identifying_description || undefined,
    incidentDate: row.incident_date,
    incidentTime: row.incident_time || undefined,
    frequency: row.frequency || 'one-time',
    relationshipContext: row.relationship_context || undefined,
    intimateWhatHappened: row.intimate_what_happened || undefined,
    intimatePlatform: row.intimate_platform || undefined,
    description: row.description,
    location,
    hasSupportingInfo: Boolean(row.has_supporting_info),
    evidenceTypes,
    evidenceDescription: row.evidence_description || undefined,
    privacyChoice: row.privacy_choice || 'anonymous',
    adminContact,
    publicationPreferences,
    status: row.status,
    statusBn: row.status_bn,
    statusEn: row.status_en,
    unpublishReason: row.unpublish_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at || undefined,
    publicVersion,
    activeClarification,
    relatedRelationships: relatedRows,
    history: history.length > 0 ? history : undefined,
  };
}

export const ReportSubmissionRepository = {
  getAll(filter?: { segment?: string; status?: string; search?: string }): DbReportSubmission[] {
    const db = dbEngine.getDb();
    let sql = 'SELECT * FROM report_submissions WHERE 1=1';
    const params: any[] = [];

    if (filter?.segment && filter.segment !== 'all') {
      sql += ' AND segment = ?';
      params.push(filter.segment);
    }
    if (filter?.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter?.search) {
      const q = `%${filter.search.trim()}%`;
      sql += ` AND (
        id LIKE ? OR 
        title LIKE ? OR 
        reported_subject LIKE ? OR 
        organization LIKE ? OR 
        location_json LIKE ?
      )`;
      params.push(q, q, q, q, q);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = db.prepare(sql).all(...params);
    return rows.map((r) => mapRowToSubmission(r, db));
  },

  getIdempotentSubmission(keyHash: string): { reportId: string; completedAt: string } | null {
    const db = dbEngine.getDb();
    const row = db.prepare(`
      SELECT report_id, completed_at FROM submission_idempotency WHERE key_hash = ? AND status = 'completed'
    `).get(keyHash) as { report_id: string; completed_at: string } | undefined;
    if (!row || !row.report_id) return null;
    return { reportId: row.report_id, completedAt: row.completed_at };
  },

  claimIdempotency(keyHash: string): { success: boolean; status?: 'processing' | 'completed' | 'failed'; reportId?: string } {
    const db = dbEngine.getDb();
    const now = new Date().toISOString();

    // 1. Atomic attempt to claim with ON CONFLICT DO NOTHING
    const insertRes = db.prepare(`
      INSERT INTO submission_idempotency (key_hash, report_id, status, created_at, completed_at)
      VALUES (?, NULL, 'processing', ?, NULL)
      ON CONFLICT(key_hash) DO NOTHING
    `).run(keyHash, now);

    if (insertRes.changes > 0) {
      return { success: true, status: 'processing' };
    }

    // 2. If already exists, inspect existing status
    const existing = db.prepare(`
      SELECT status, report_id FROM submission_idempotency WHERE key_hash = ?
    `).get(keyHash) as { status: 'processing' | 'completed' | 'failed'; report_id?: string } | undefined;

    if (!existing) {
      return { success: false, status: 'processing' };
    }

    // 3. If previous attempt failed, allow atomic re-claim
    if (existing.status === 'failed') {
      const updateRes = db.prepare(`
        UPDATE submission_idempotency
        SET status = 'processing', created_at = ?, completed_at = NULL, report_id = NULL
        WHERE key_hash = ? AND status = 'failed'
      `).run(now, keyHash);
      if (updateRes.changes > 0) {
        return { success: true, status: 'processing' };
      }
    }

    return {
      success: false,
      status: existing.status,
      reportId: existing.report_id || undefined,
    };
  },

  markIdempotencyFailed(keyHash: string): void {
    const db = dbEngine.getDb();
    db.prepare(`
      UPDATE submission_idempotency
      SET status = 'failed'
      WHERE key_hash = ? AND status = 'processing'
    `).run(keyHash);
  },

  createAtomicSubmission(params: {
    submission: DbReportSubmission;
    attachments: any[];
    moderationNote: string;
    idempotencyKeyHash?: string;
  }): void {
    const db = dbEngine.getDb();
    const tx = db.transaction(() => {
      const now = new Date().toISOString();

      const insertSub = db.prepare(`
        INSERT INTO report_submissions (
          id, internal_id, pin_hash, segment, subcategory_id, subcategory_bn, subcategory_en,
          title, reported_subject, mentioned_parties_json, subject_type, role_or_designation, organization,
          public_profile_handle, identifying_description, incident_date, incident_time,
          frequency, relationship_context, intimate_what_happened, intimate_platform,
          description, location_json, has_supporting_info, evidence_types_json,
          evidence_description, privacy_choice, admin_contact_json, publication_preferences_json,
          status, status_bn, status_en, unpublish_reason, created_at, updated_at, published_at
        ) VALUES (
          @id, @internal_id, @pin_hash, @segment, @subcategory_id, @subcategory_bn, @subcategory_en,
          @title, @reported_subject, @mentioned_parties_json, @subject_type, @role_or_designation, @organization,
          @public_profile_handle, @identifying_description, @incident_date, @incident_time,
          @frequency, @relationship_context, @intimate_what_happened, @intimate_platform,
          @description, @location_json, @has_supporting_info, @evidence_types_json,
          @evidence_description, @privacy_choice, @admin_contact_json, @publication_preferences_json,
          @status, @status_bn, @status_en, @unpublish_reason, @created_at, @updated_at, @published_at
        )
      `);

      insertSub.run({
        id: params.submission.id,
        internal_id: params.submission.internalId || `sub-${Date.now()}`,
        pin_hash: params.submission.pinHash,
        segment: params.submission.segment,
        subcategory_id: params.submission.subcategoryId,
        subcategory_bn: params.submission.subcategoryBn,
        subcategory_en: params.submission.subcategoryEn,
        title: params.submission.title,
        reported_subject: params.submission.reportedSubject,
        mentioned_parties_json: params.submission.mentionedParties ? JSON.stringify(params.submission.mentionedParties) : null,
        subject_type: params.submission.subjectType,
        role_or_designation: params.submission.roleOrDesignation || null,
        organization: params.submission.organization || null,
        public_profile_handle: params.submission.publicProfileHandle || null,
        identifying_description: params.submission.identifyingDescription || null,
        incident_date: params.submission.incidentDate,
        incident_time: params.submission.incidentTime || null,
        frequency: params.submission.frequency,
        relationship_context: params.submission.relationshipContext || null,
        intimate_what_happened: params.submission.intimateWhatHappened || null,
        intimate_platform: params.submission.intimatePlatform || null,
        description: params.submission.description,
        location_json: JSON.stringify(params.submission.location),
        has_supporting_info: params.submission.hasSupportingInfo ? 1 : 0,
        evidence_types_json: JSON.stringify(params.submission.evidenceTypes),
        evidence_description: params.submission.evidenceDescription || null,
        privacy_choice: params.submission.privacyChoice,
        admin_contact_json: params.submission.adminContact ? JSON.stringify(params.submission.adminContact) : null,
        publication_preferences_json: JSON.stringify(params.submission.publicationPreferences),
        status: params.submission.status,
        status_bn: params.submission.statusBn,
        status_en: params.submission.statusEn,
        unpublish_reason: params.submission.unpublishReason || null,
        created_at: params.submission.createdAt,
        updated_at: params.submission.updatedAt,
        published_at: params.submission.publishedAt || null,
      });

      if (params.attachments && params.attachments.length > 0) {
        const insertAttachment = db.prepare(`
          INSERT INTO report_attachments (
            id, report_id, storage_key, mime_type, width, height, size_bytes, sha256, sort_order, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const att of params.attachments) {
          insertAttachment.run(
            att.id,
            att.reportId,
            att.storageKey,
            att.mimeType,
            att.width,
            att.height,
            att.sizeBytes,
            att.sha256,
            att.sortOrder,
            att.createdAt
          );
        }
      }

      const insertModeration = db.prepare(`
        INSERT INTO moderation_events (
          id, report_id, action, action_bn, action_en, previous_status, new_status, note, actor, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertModeration.run(
        `mod-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        params.submission.id,
        'REPORT_SUBMITTED',
        'নাগরিক প্রতিবেদন জমা দেওয়া হয়েছে',
        'Citizen report submitted',
        null,
        'submitted',
        params.moderationNote,
        'Citizen Reporter',
        now
      );

      if (params.idempotencyKeyHash) {
        const updateIdemp = db.prepare(`
          UPDATE submission_idempotency
          SET status = 'completed', report_id = ?, completed_at = ?
          WHERE key_hash = ? AND status = 'processing'
        `).run(params.submission.id, now, params.idempotencyKeyHash);

        if (updateIdemp.changes === 0) {
          throw new Error('IDEMPOTENCY_CLAIM_NOT_FOUND');
        }
      }
    });

    tx();
  },

  getById(id: string): DbReportSubmission | null {
    const db = dbEngine.getDb();
    const cleanId = id.trim().toUpperCase();
    const row = db.prepare('SELECT * FROM report_submissions WHERE UPPER(id) = ?').get(cleanId);
    if (!row) return null;
    return mapRowToSubmission(row, db);
  },

  async create(submission: DbReportSubmission): Promise<DbReportSubmission> {
    const db = dbEngine.getDb();
    const insert = db.prepare(`
      INSERT INTO report_submissions (
        id, internal_id, pin_hash, segment, subcategory_id, subcategory_bn, subcategory_en,
        title, reported_subject, mentioned_parties_json, subject_type, role_or_designation, organization,
        public_profile_handle, identifying_description, incident_date, incident_time,
        frequency, relationship_context, intimate_what_happened, intimate_platform,
        description, location_json, has_supporting_info, evidence_types_json,
        evidence_description, privacy_choice, admin_contact_json, publication_preferences_json,
        status, status_bn, status_en, unpublish_reason, created_at, updated_at, published_at
      ) VALUES (
        @id, @internal_id, @pin_hash, @segment, @subcategory_id, @subcategory_bn, @subcategory_en,
        @title, @reported_subject, @mentioned_parties_json, @subject_type, @role_or_designation, @organization,
        @public_profile_handle, @identifying_description, @incident_date, @incident_time,
        @frequency, @relationship_context, @intimate_what_happened, @intimate_platform,
        @description, @location_json, @has_supporting_info, @evidence_types_json,
        @evidence_description, @privacy_choice, @admin_contact_json, @publication_preferences_json,
        @status, @status_bn, @status_en, @unpublish_reason, @created_at, @updated_at, @published_at
      )
    `);

    insert.run({
      id: submission.id,
      internal_id: `sub-${submission.id}`,
      pin_hash: submission.pinHash,
      segment: submission.segment,
      subcategory_id: submission.subcategoryId,
      subcategory_bn: submission.subcategoryBn,
      subcategory_en: submission.subcategoryEn,
      title: submission.title,
      reported_subject: submission.reportedSubject || null,
      mentioned_parties_json: submission.mentionedParties ? JSON.stringify(submission.mentionedParties) : null,
      subject_type: submission.subjectType || 'individual',
      role_or_designation: submission.roleOrDesignation || null,
      organization: submission.organization || null,
      public_profile_handle: submission.publicProfileHandle || null,
      identifying_description: submission.identifyingDescription || null,
      incident_date: submission.incidentDate,
      incident_time: submission.incidentTime || null,
      frequency: submission.frequency || 'one-time',
      relationship_context: submission.relationshipContext || null,
      intimate_what_happened: submission.intimateWhatHappened || null,
      intimate_platform: submission.intimatePlatform || null,
      description: submission.description,
      location_json: JSON.stringify(submission.location || {}),
      has_supporting_info: submission.hasSupportingInfo ? 1 : 0,
      evidence_types_json: JSON.stringify(submission.evidenceTypes || []),
      evidence_description: submission.evidenceDescription || '',
      privacy_choice: submission.privacyChoice,
      admin_contact_json: submission.adminContact ? JSON.stringify(submission.adminContact) : null,
      publication_preferences_json: JSON.stringify(submission.publicationPreferences || {}),
      status: submission.status,
      status_bn: submission.statusBn,
      status_en: submission.statusEn,
      unpublish_reason: submission.unpublishReason || null,
      created_at: submission.createdAt,
      updated_at: submission.updatedAt || submission.createdAt,
      published_at: submission.publishedAt || null,
    });

    return submission;
  },

  async update(id: string, updates: Partial<DbReportSubmission>): Promise<DbReportSubmission | null> {
    const db = dbEngine.getDb();
    const existing = this.getById(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updateStmt = db.prepare(`
      UPDATE report_submissions SET
        status = @status,
        status_bn = @status_bn,
        status_en = @status_en,
        unpublish_reason = @unpublish_reason,
        published_at = @published_at,
        updated_at = @updated_at
      WHERE id = @id
    `);

    updateStmt.run({
      id: existing.id,
      status: merged.status,
      status_bn: merged.statusBn,
      status_en: merged.statusEn,
      unpublish_reason: merged.unpublishReason || null,
      published_at: merged.publishedAt || null,
      updated_at: merged.updatedAt,
    });

    return this.getById(id);
  },
};
