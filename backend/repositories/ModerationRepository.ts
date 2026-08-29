import { dbEngine } from '../db/database';
import { DbModerationEvent } from '../types';

export const ModerationRepository = {
  getAllEvents(): DbModerationEvent[] {
    const db = dbEngine.getDb();
    const rows = db.prepare(`
      SELECT 
        id, report_id as reportId, action, action_bn as actionBn, action_en as actionEn,
        previous_status as previousStatus, new_status as newStatus, note, actor, created_at as createdAt
      FROM moderation_events
      ORDER BY created_at DESC
    `).all() as DbModerationEvent[];

    return rows;
  },

  getEventsByReportId(reportId: string): DbModerationEvent[] {
    const db = dbEngine.getDb();
    const cleanId = reportId.trim().toUpperCase();
    const rows = db.prepare(`
      SELECT 
        id, report_id as reportId, action, action_bn as actionBn, action_en as actionEn,
        previous_status as previousStatus, new_status as newStatus, note, actor, created_at as createdAt
      FROM moderation_events
      WHERE UPPER(report_id) = ?
      ORDER BY created_at DESC
    `).all(cleanId) as DbModerationEvent[];

    return rows;
  },

  async logEvent(event: Omit<DbModerationEvent, 'id' | 'createdAt'>): Promise<DbModerationEvent> {
    const db = dbEngine.getDb();
    const newEvent: DbModerationEvent = {
      id: `mod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...event,
      createdAt: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO moderation_events (
        id, report_id, action, action_bn, action_en, previous_status, new_status, note, actor, created_at
      ) VALUES (
        @id, @reportId, @action, @actionBn, @actionEn, @previousStatus, @newStatus, @note, @actor, @createdAt
      )
    `).run({
      id: newEvent.id,
      reportId: newEvent.reportId,
      action: newEvent.action,
      actionBn: newEvent.actionBn,
      actionEn: newEvent.actionEn,
      previousStatus: newEvent.previousStatus || null,
      newStatus: newEvent.newStatus || null,
      note: newEvent.note || null,
      actor: newEvent.actor,
      createdAt: newEvent.createdAt,
    });

    return newEvent;
  },
};
