import { dbEngine } from '../db/database';
import { DbRelatedReport } from '../types';

export const RelatedReportRepository = {
  getRelatedReportIds(reportId: string): { targetReportId: string; relationshipType: string }[] {
    const db = dbEngine.getDb();
    const cleanId = reportId.trim().toUpperCase();

    const rows = db.prepare(`
      SELECT report_b_id as targetReportId, relationship_type as relationshipType
      FROM related_reports
      WHERE UPPER(report_a_id) = ?
      UNION
      SELECT report_a_id as targetReportId, relationship_type as relationshipType
      FROM related_reports
      WHERE UPPER(report_b_id) = ?
    `).all(cleanId, cleanId) as { targetReportId: string; relationshipType: string }[];

    return rows;
  },

  async link(
    reportAId: string,
    reportBId: string,
    relationshipType: 'same_subject' | 'same_organization' | 'same_location' | 'related_incident'
  ): Promise<boolean> {
    const db = dbEngine.getDb();
    const cleanA = reportAId.trim().toUpperCase();
    const cleanB = reportBId.trim().toUpperCase();
    if (cleanA === cleanB) return false;

    const existing = db.prepare(`
      SELECT COUNT(*) as cnt FROM related_reports
      WHERE (UPPER(report_a_id) = ? AND UPPER(report_b_id) = ?)
         OR (UPPER(report_a_id) = ? AND UPPER(report_b_id) = ?)
    `).get(cleanA, cleanB, cleanB, cleanA) as { cnt: number };

    if (existing.cnt === 0) {
      const id = `rel-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      db.prepare(`
        INSERT INTO related_reports (id, report_a_id, report_b_id, relationship_type, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, cleanA, cleanB, relationshipType, new Date().toISOString());
    }

    return true;
  },

  async unlink(reportAId: string, reportBId: string): Promise<boolean> {
    const db = dbEngine.getDb();
    const cleanA = reportAId.trim().toUpperCase();
    const cleanB = reportBId.trim().toUpperCase();

    const result = db.prepare(`
      DELETE FROM related_reports
      WHERE (UPPER(report_a_id) = ? AND UPPER(report_b_id) = ?)
         OR (UPPER(report_a_id) = ? AND UPPER(report_b_id) = ?)
    `).run(cleanA, cleanB, cleanB, cleanA);

    return result.changes > 0;
  },
};
