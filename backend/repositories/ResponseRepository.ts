import { dbEngine } from '../db/database';
import { DbSubjectResponse } from '../types';

function mapRowToResponse(row: any): DbSubjectResponse {
  return {
    id: row.id,
    reportId: row.report_id,
    reportTitle: row.report_title || undefined,
    responderType: row.responder_type,
    responderName: row.responder_name,
    contactEmailOrPhone: row.contact_email_or_phone,
    contactInfo: row.contact_info || undefined,
    organizationName: row.organization_name || undefined,
    designation: row.designation || undefined,
    officialStatement: row.official_statement,
    supportingDocumentsNote: row.supporting_documents_note || undefined,
    supportingDocumentsSummary: row.supporting_documents_summary_json
      ? JSON.parse(row.supporting_documents_summary_json)
      : [],
    requestCorrectionOrRemoval: Boolean(row.request_correction_or_removal),
    correctionDetails: row.correction_details || undefined,
    status: row.status,
    rejectionReason: row.rejection_reason || undefined,
    createdAt: row.created_at,
    publishedAt: row.published_at || undefined,
    updatedAt: row.updated_at || row.created_at,
  };
}

export const ResponseRepository = {
  getAll(filter?: { status?: string; reportId?: string }): DbSubjectResponse[] {
    const db = dbEngine.getDb();
    let sql = 'SELECT * FROM subject_responses WHERE 1=1';
    const params: any[] = [];

    if (filter?.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter?.reportId) {
      sql += ' AND UPPER(report_id) = ?';
      params.push(filter.reportId.trim().toUpperCase());
    }

    sql += ' ORDER BY created_at DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(mapRowToResponse);
  },

  getById(id: string): DbSubjectResponse | null {
    const db = dbEngine.getDb();
    const row = db.prepare('SELECT * FROM subject_responses WHERE id = ?').get(id);
    if (!row) return null;
    return mapRowToResponse(row);
  },

  getPublishedByReportId(reportId: string): DbSubjectResponse[] {
    return this.getAll({ status: 'published', reportId });
  },

  async create(resp: DbSubjectResponse): Promise<DbSubjectResponse> {
    const db = dbEngine.getDb();
    const insert = db.prepare(`
      INSERT INTO subject_responses (
        id, report_id, report_title, responder_type, responder_name, contact_email_or_phone,
        contact_info, organization_name, designation, official_statement,
        supporting_documents_note, supporting_documents_summary_json, request_correction_or_removal,
        correction_details, status, rejection_reason, created_at, published_at, updated_at
      ) VALUES (
        @id, @report_id, @report_title, @responder_type, @responder_name, @contact_email_or_phone,
        @contact_info, @organization_name, @designation, @official_statement,
        @supporting_documents_note, @supporting_documents_summary_json, @request_correction_or_removal,
        @correction_details, @status, @rejection_reason, @created_at, @published_at, @updated_at
      )
    `);

    insert.run({
      id: resp.id,
      report_id: resp.reportId,
      report_title: resp.reportTitle || null,
      responder_type: resp.responderType,
      responder_name: resp.responderName,
      contact_email_or_phone: resp.contactEmailOrPhone,
      contact_info: resp.contactInfo || null,
      organization_name: resp.organizationName || null,
      designation: resp.designation || null,
      official_statement: resp.officialStatement,
      supporting_documents_note: resp.supportingDocumentsNote || null,
      supporting_documents_summary_json: JSON.stringify(resp.supportingDocumentsSummary || []),
      request_correction_or_removal: resp.requestCorrectionOrRemoval ? 1 : 0,
      correction_details: resp.correctionDetails || null,
      status: resp.status,
      rejection_reason: resp.rejectionReason || null,
      created_at: resp.createdAt,
      published_at: resp.publishedAt || null,
      updated_at: resp.updatedAt || resp.createdAt,
    });

    return resp;
  },

  async update(id: string, updates: Partial<DbSubjectResponse>): Promise<DbSubjectResponse | null> {
    const db = dbEngine.getDb();
    const existing = this.getById(id);
    if (!existing) return null;

    const merged: DbSubjectResponse = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.prepare(`
      UPDATE subject_responses SET
        status = @status,
        rejection_reason = @rejection_reason,
        published_at = @published_at,
        updated_at = @updated_at
      WHERE id = @id
    `).run({
      id: merged.id,
      status: merged.status,
      rejection_reason: merged.rejectionReason || null,
      published_at: merged.publishedAt || null,
      updated_at: merged.updatedAt,
    });

    return this.getById(id);
  },
};
