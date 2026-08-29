import { dbEngine } from '../db/database';
import { DbReportAttachment } from '../types';

function mapRowToAttachment(row: any): DbReportAttachment {
  return {
    id: row.id,
    reportId: row.report_id,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    sizeBytes: row.size_bytes,
    sha256: row.sha256,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export const ReportAttachmentRepository = {
  getById(id: string): DbReportAttachment | null {
    const db = dbEngine.getDb();
    const row = db.prepare('SELECT * FROM report_attachments WHERE id = ?').get(id);
    if (!row) return null;
    return mapRowToAttachment(row);
  },

  getByReportId(reportId: string): DbReportAttachment[] {
    const db = dbEngine.getDb();
    const cleanId = reportId.trim().toUpperCase();
    const rows = db
      .prepare('SELECT * FROM report_attachments WHERE UPPER(report_id) = ? ORDER BY sort_order ASC')
      .all(cleanId) as any[];
    return rows.map(mapRowToAttachment);
  },

  getApprovedPublicByReportId(reportId: string, approvedIds: string[]): DbReportAttachment[] {
    if (!approvedIds || approvedIds.length === 0) return [];
    const all = this.getByReportId(reportId);
    return all.filter((att) => approvedIds.includes(att.id));
  },

  async create(attachment: DbReportAttachment): Promise<DbReportAttachment> {
    const db = dbEngine.getDb();
    const stmt = db.prepare(`
      INSERT INTO report_attachments (
        id, report_id, storage_key, mime_type, width, height, size_bytes, sha256, sort_order, created_at
      ) VALUES (
        @id, @report_id, @storage_key, @mime_type, @width, @height, @size_bytes, @sha256, @sort_order, @created_at
      )
    `);

    stmt.run({
      id: attachment.id,
      report_id: attachment.reportId,
      storage_key: attachment.storageKey,
      mime_type: attachment.mimeType,
      width: attachment.width,
      height: attachment.height,
      size_bytes: attachment.sizeBytes,
      sha256: attachment.sha256,
      sort_order: attachment.sortOrder,
      created_at: attachment.createdAt,
    });

    return attachment;
  },

  async deleteByReportId(reportId: string): Promise<boolean> {
    const db = dbEngine.getDb();
    const cleanId = reportId.trim().toUpperCase();
    const result = db.prepare('DELETE FROM report_attachments WHERE UPPER(report_id) = ?').run(cleanId);
    return result.changes > 0;
  },
};
