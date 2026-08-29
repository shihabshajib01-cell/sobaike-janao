import { dbEngine } from '../db/database';
import { DbAdminUser } from '../types';

export const AdminRepository = {
  findByEmail(email: string): DbAdminUser | null {
    const db = dbEngine.getDb();
    const cleanEmail = email.trim().toLowerCase();
    const row = db.prepare(`
      SELECT id, email, password_hash as passwordHash, name, role, created_at as createdAt, last_login_at as lastLoginAt
      FROM admin_users
      WHERE email = ?
    `).get(cleanEmail) as DbAdminUser | undefined;

    return row || null;
  },

  findById(id: string): DbAdminUser | null {
    const db = dbEngine.getDb();
    const row = db.prepare(`
      SELECT id, email, password_hash as passwordHash, name, role, created_at as createdAt, last_login_at as lastLoginAt
      FROM admin_users
      WHERE id = ?
    `).get(id) as DbAdminUser | undefined;

    return row || null;
  },

  async updateLastLogin(id: string): Promise<void> {
    const db = dbEngine.getDb();
    const now = new Date().toISOString();
    db.prepare(`UPDATE admin_users SET last_login_at = ? WHERE id = ?`).run(now, id);
  },
};
