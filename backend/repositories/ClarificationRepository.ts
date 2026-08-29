import { dbEngine } from '../db/database';
import { DbClarificationRequest } from '../types';

export const ClarificationRepository = {
  getByReportId(reportId: string): DbClarificationRequest | null {
    const db = dbEngine.getDb();
    const cleanId = reportId.trim().toUpperCase();
    const row = db.prepare(`
      SELECT * FROM clarification_requests
      WHERE UPPER(report_id) = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(cleanId) as any;

    if (!row) return null;

    return {
      id: row.id,
      reportId: row.report_id,
      message: row.message,
      requestedFields: row.requested_fields_json ? JSON.parse(row.requested_fields_json) : [],
      reporterResponse: row.reporter_response || undefined,
      createdAt: row.created_at,
      respondedAt: row.responded_at || undefined,
      resolvedAt: row.resolved_at || undefined,
    };
  },

  async create(clarification: DbClarificationRequest): Promise<DbClarificationRequest> {
    const db = dbEngine.getDb();
    const insert = db.prepare(`
      INSERT OR REPLACE INTO clarification_requests (
        id, report_id, message, requested_fields_json, reporter_response, created_at, responded_at, resolved_at
      ) VALUES (
        @id, @report_id, @message, @requested_fields_json, @reporter_response, @created_at, @responded_at, @resolved_at
      )
    `);

    insert.run({
      id: clarification.id,
      report_id: clarification.reportId,
      message: clarification.message,
      requested_fields_json: JSON.stringify(clarification.requestedFields || []),
      reporter_response: clarification.reporterResponse || null,
      created_at: clarification.createdAt,
      responded_at: clarification.respondedAt || null,
      resolved_at: clarification.resolvedAt || null,
    });

    return clarification;
  },

  async update(id: string, updates: Partial<DbClarificationRequest>): Promise<DbClarificationRequest | null> {
    const db = dbEngine.getDb();
    const existing = db.prepare('SELECT * FROM clarification_requests WHERE id = ? OR UPPER(report_id) = ?').get(id, id.toUpperCase()) as any;
    if (!existing) return null;

    const merged = {
      message: updates.message !== undefined ? updates.message : existing.message,
      requested_fields_json: updates.requestedFields !== undefined ? JSON.stringify(updates.requestedFields) : existing.requested_fields_json,
      reporter_response: updates.reporterResponse !== undefined ? updates.reporterResponse : existing.reporter_response,
      responded_at: updates.respondedAt !== undefined ? updates.respondedAt : existing.responded_at,
      resolved_at: updates.resolvedAt !== undefined ? updates.resolvedAt : existing.resolved_at,
    };

    db.prepare(`
      UPDATE clarification_requests SET
        message = @message,
        requested_fields_json = @requested_fields_json,
        reporter_response = @reporter_response,
        responded_at = @responded_at,
        resolved_at = @resolved_at
      WHERE id = @id
    `).run({
      id: existing.id,
      ...merged,
    });

    return this.getByReportId(existing.report_id);
  },
};
