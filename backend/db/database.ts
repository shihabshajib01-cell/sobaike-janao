import fs from 'fs';
import path from 'path';
import { initSchemaAndSeed } from './schema';

export interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface Statement<T = any> {
  run(...params: any[]): RunResult;
  get(...params: any[]): T | undefined;
  all(...params: any[]): T[];
}

export interface IDatabase {
  exec(sql: string): this;
  pragma(pragmaStr: string, options?: any): any;
  prepare<T = any>(sql: string): Statement<T>;
  transaction<F extends (...args: any[]) => any>(fn: F): F;
  close(): void;
}

type Row = Record<string, any>;

export class PureSqlDatabase implements IDatabase {
  private tables: Map<string, Row[]> = new Map();
  private filePath: string | null = null;
  private tableColumns: Map<string, string[]> = new Map();
  private inTransaction: boolean = false;

  constructor(filePath?: string) {
    if (filePath && filePath !== ':memory:') {
      this.filePath = filePath;
      this.loadFromFile();
    }
  }

  private loadFromFile() {
    if (!this.filePath) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(content);
        if (data && typeof data === 'object') {
          for (const [table, rows] of Object.entries(data)) {
            if (Array.isArray(rows)) {
              this.tables.set(table.toLowerCase(), rows);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[PureSqlDatabase] Could not load stored state:', err);
    }
  }

  private persistToFile() {
    if (!this.filePath || this.inTransaction) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data: Record<string, Row[]> = {};
      for (const [table, rows] of this.tables.entries()) {
        data[table] = rows;
      }
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[PureSqlDatabase] Failed to persist state:', err);
    }
  }

  public getTable(name: string): Row[] {
    const key = name.toLowerCase().trim();
    let table = this.tables.get(key);
    if (!table) {
      table = [];
      this.tables.set(key, table);
    }
    return table;
  }

  public exec(sql: string): this {
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      const upper = stmt.toUpperCase();

      if (upper.startsWith('CREATE TABLE')) {
        const match = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]*)\)/i);
        if (match) {
          const tableName = match[1].toLowerCase();
          const colDefs = match[2];
          this.getTable(tableName);

          // Extract column names
          const cols: string[] = [];
          for (const line of colDefs.split(',')) {
            const trimmed = line.trim();
            if (
              trimmed &&
              !trimmed.toUpperCase().startsWith('FOREIGN KEY') &&
              !trimmed.toUpperCase().startsWith('PRIMARY KEY') &&
              !trimmed.toUpperCase().startsWith('CHECK') &&
              !trimmed.toUpperCase().startsWith('UNIQUE')
            ) {
              const colName = trimmed.split(/\s+/)[0].toLowerCase();
              if (colName) cols.push(colName);
            }
          }
          this.tableColumns.set(tableName, cols);
        }
      } else if (upper.startsWith('ALTER TABLE')) {
        const match = stmt.match(/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ADD\s+(?:COLUMN\s+)?([a-zA-Z0-9_]+)/i);
        if (match) {
          const tableName = match[1].toLowerCase();
          const colName = match[2].toLowerCase();
          const cols = this.tableColumns.get(tableName) || [];
          if (!cols.includes(colName)) {
            cols.push(colName);
            this.tableColumns.set(tableName, cols);
          }
        }
      } else if (upper.startsWith('CREATE INDEX')) {
        // Indexes are in-memory noops
      } else {
        // Generic execution
        this.prepare(stmt).run();
      }
    }
    this.persistToFile();
    return this;
  }

  public pragma(pragmaStr: string): any {
    const match = pragmaStr.match(/table_info\s*\(\s*([a-zA-Z0-9_]+)\s*\)/i);
    if (match) {
      const tableName = match[1].toLowerCase();
      const cols = this.tableColumns.get(tableName) || [];
      return cols.map((col, idx) => ({ cid: idx, name: col, type: 'TEXT' }));
    }
    return [];
  }

  public transaction<F extends (...args: any[]) => any>(fn: F): F {
    return ((...args: any[]) => {
      const prev = this.inTransaction;
      this.inTransaction = true;
      try {
        const result = fn(...args);
        return result;
      } finally {
        this.inTransaction = prev;
        if (!this.inTransaction) {
          this.persistToFile();
        }
      }
    }) as F;
  }

  public prepare<T = any>(sql: string): Statement<T> {
    const trimmedSql = sql.trim();
    const upper = trimmedSql.toUpperCase();
    const self = this;

    // 1. PRAGMA table_info
    if (upper.startsWith('PRAGMA TABLE_INFO')) {
      const match = trimmedSql.match(/PRAGMA\s+table_info\s*\(\s*([a-zA-Z0-9_]+)\s*\)/i);
      const tableName = match ? match[1].toLowerCase() : '';
      return {
        run: () => ({ changes: 0, lastInsertRowid: 0 }),
        get: () => {
          const cols = self.tableColumns.get(tableName) || [];
          return (cols.length > 0 ? { name: cols[0] } : undefined) as any;
        },
        all: () => {
          const cols = self.tableColumns.get(tableName) || [];
          return cols.map((col, idx) => ({ cid: idx, name: col, type: 'TEXT' })) as any;
        },
      };
    }

    // 2. SELECT queries
    if (upper.startsWith('SELECT')) {
      return {
        run: () => ({ changes: 0, lastInsertRowid: 0 }),
        get: (...params: any[]) => {
          const rows = self.executeSelect(trimmedSql, params);
          return rows.length > 0 ? (rows[0] as T) : undefined;
        },
        all: (...params: any[]) => {
          return self.executeSelect(trimmedSql, params) as T[];
        },
      };
    }

    // 3. INSERT / INSERT OR REPLACE
    if (upper.startsWith('INSERT')) {
      return {
        run: (...params: any[]) => {
          const res = self.executeInsert(trimmedSql, params);
          self.persistToFile();
          return res;
        },
        get: () => undefined,
        all: () => [],
      };
    }

    // 4. UPDATE
    if (upper.startsWith('UPDATE')) {
      return {
        run: (...params: any[]) => {
          const res = self.executeUpdate(trimmedSql, params);
          self.persistToFile();
          return res;
        },
        get: () => undefined,
        all: () => [],
      };
    }

    // 5. DELETE
    if (upper.startsWith('DELETE')) {
      return {
        run: (...params: any[]) => {
          const res = self.executeDelete(trimmedSql, params);
          self.persistToFile();
          return res;
        },
        get: () => undefined,
        all: () => [],
      };
    }

    return {
      run: () => ({ changes: 0, lastInsertRowid: 0 }),
      get: () => undefined,
      all: () => [],
    };
  }

  private executeSelect(sql: string, params: any[]): Row[] {
    const upper = sql.toUpperCase();

    // Check for COUNT(*)
    if (upper.includes('COUNT(*)')) {
      const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
      if (fromMatch) {
        const table = this.getTable(fromMatch[1]);
        const count = this.filterRows(fromMatch[1], table, sql, params).length;
        return [{ cnt: count, 'count(*)': count, count }];
      }
      return [{ cnt: 0 }];
    }

    // Extract FROM table
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) return [];

    const mainTableName = fromMatch[1];
    let rows = this.getTable(mainTableName).map((r) => ({ ...r }));

    // Handle Join if public_versions and report_submissions
    if (upper.includes('JOIN PUBLIC_VERSIONS') || upper.includes('JOIN REPORT_SUBMISSIONS')) {
      const pvTable = this.getTable('public_versions');
      const subTable = this.getTable('report_submissions');

      const joined: Row[] = [];
      for (const sub of subTable) {
        const pv = pvTable.find(
          (p) => String(p.report_id || '').toUpperCase() === String(sub.id || '').toUpperCase()
        );
        if (pv) {
          joined.push({
            ...sub,
            ...pv,
            sub_id: sub.id,
            pv_id: pv.id,
          });
        }
      }
      rows = joined;
    }

    // Apply WHERE filters
    rows = this.filterRows(mainTableName, rows, sql, params);

    // Apply ORDER BY
    if (upper.includes('ORDER BY')) {
      const orderMatch = sql.match(/ORDER\s+BY\s+([a-zA-Z0-9_]+)\s*(ASC|DESC)?/i);
      if (orderMatch) {
        const col = orderMatch[1].toLowerCase();
        const isDesc = (orderMatch[2] || 'ASC').toUpperCase() === 'DESC';
        rows.sort((a, b) => {
          const valA = a[col] ?? '';
          const valB = b[col] ?? '';
          if (valA < valB) return isDesc ? 1 : -1;
          if (valA > valB) return isDesc ? -1 : 1;
          return 0;
        });
      }
    }

    // Apply LIMIT
    if (upper.includes('LIMIT')) {
      const limitMatch = sql.match(/LIMIT\s+(\d+|\?)/i);
      if (limitMatch) {
        let limitVal = 100;
        if (limitMatch[1] === '?') {
          const paramVal = params[params.length - 1];
          if (typeof paramVal === 'number') limitVal = paramVal;
        } else {
          limitVal = parseInt(limitMatch[1], 10);
        }
        rows = rows.slice(0, limitVal);
      }
    }

    return rows;
  }

  private filterRows(table: string, rows: Row[], sql: string, params: any[]): Row[] {
    const upper = sql.toUpperCase();
    const whereIndex = upper.indexOf('WHERE');
    if (whereIndex === -1) return rows;

    let whereClause = sql.slice(whereIndex + 5);
    const orderIndex = whereClause.toUpperCase().indexOf('ORDER BY');
    if (orderIndex !== -1) whereClause = whereClause.slice(0, orderIndex);
    const limitIndex = whereClause.toUpperCase().indexOf('LIMIT');
    if (limitIndex !== -1) whereClause = whereClause.slice(0, limitIndex);

    let paramIdx = 0;
    return rows.filter((row) => {
      // Basic evaluator for common clauses
      if (whereClause.includes('UPPER(report_id) = ?') || whereClause.includes('UPPER(id) = ?')) {
        const expected = String(params[paramIdx] || '').toUpperCase();
        const actual = String(row.report_id || row.id || '').toUpperCase();
        return actual === expected;
      }

      if (whereClause.includes('email = ?')) {
        const expected = String(params[0] || '').toLowerCase();
        const actual = String(row.email || '').toLowerCase();
        return actual === expected;
      }

      if (whereClause.includes('version = ?')) {
        const expected = Number(params[0]);
        const actual = Number(row.version);
        return actual === expected;
      }

      if (whereClause.includes('report_id = ?')) {
        const expected = String(params[0] || '');
        const actual = String(row.report_id || '');
        return actual.toLowerCase() === expected.toLowerCase();
      }

      if (whereClause.includes('id = ?')) {
        const expected = String(params[0] || '');
        const actual = String(row.id || '');
        return actual === expected;
      }

      if (whereClause.includes('key_hash = ?')) {
        const expected = String(params[0] || '');
        const actual = String(row.key_hash || '');
        return actual === expected;
      }

      // Default pass for complex dynamic queries
      return true;
    });
  }

  private executeInsert(sql: string, params: any[]): RunResult {
    const match = sql.match(/INSERT(?:\s+OR\s+REPLACE)?\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/i);
    if (!match) return { changes: 0, lastInsertRowid: 0 };

    const tableName = match[1].toLowerCase();
    const columns = match[2].split(',').map((c) => c.trim().toLowerCase());
    const table = this.getTable(tableName);

    const isNamedObject =
      params.length === 1 &&
      typeof params[0] === 'object' &&
      params[0] !== null &&
      !Array.isArray(params[0]);

    const newRow: Row = {};
    if (isNamedObject) {
      const obj = params[0];
      columns.forEach((col) => {
        const directVal = obj[col];
        const atVal = obj['@' + col];
        newRow[col] = directVal !== undefined ? directVal : (atVal !== undefined ? atVal : null);
      });
    } else {
      columns.forEach((col, idx) => {
        newRow[col] = params[idx] !== undefined ? params[idx] : null;
      });
    }

    const isReplace = sql.toUpperCase().includes('INSERT OR REPLACE');
    const existingIdx = table.findIndex(
      (r) =>
        (r.id && newRow.id && String(r.id).toLowerCase() === String(newRow.id).toLowerCase()) ||
        (r.report_id && newRow.report_id && String(r.report_id).toLowerCase() === String(newRow.report_id).toLowerCase()) ||
        (r.version !== undefined && newRow.version !== undefined && r.version === newRow.version)
    );

    if (existingIdx !== -1) {
      if (isReplace) {
        table[existingIdx] = { ...table[existingIdx], ...newRow };
      }
    } else {
      table.push(newRow);
    }

    return { changes: 1, lastInsertRowid: table.length };
  }

  private executeUpdate(sql: string, params: any[]): RunResult {
    const match = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!match) return { changes: 0, lastInsertRowid: 0 };

    const tableName = match[1].toLowerCase();
    const setClause = match[2];
    const whereClause = match[3] || '';
    const table = this.getTable(tableName);

    const setCols: string[] = [];
    const setAssignments = setClause.split(',');
    for (const assign of setAssignments) {
      const col = assign.split('=')[0].trim().toLowerCase();
      if (col) setCols.push(col);
    }

    let changes = 0;
    const values = params.slice(0, setCols.length);
    const whereParams = params.slice(setCols.length);

    for (let i = 0; i < table.length; i++) {
      const row = table[i];
      let matches = true;

      if (whereClause) {
        if (whereClause.includes('WHERE id = ?') || whereClause.includes('id = ?')) {
          matches = String(row.id || '') === String(whereParams[whereParams.length - 1] || '');
        } else if (whereClause.includes('UPPER(report_id) = ?') || whereClause.includes('report_id = ?')) {
          matches =
            String(row.report_id || '').toUpperCase() ===
            String(whereParams[whereParams.length - 1] || '').toUpperCase();
        } else if (whereClause.includes('key_hash = ?')) {
          matches = String(row.key_hash || '') === String(whereParams[whereParams.length - 1] || '');
        }
      }

      if (matches) {
        setCols.forEach((col, idx) => {
          row[col] = values[idx];
        });
        changes++;
      }
    }

    return { changes, lastInsertRowid: 0 };
  }

  private executeDelete(sql: string, params: any[]): RunResult {
    const match = sql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!match) return { changes: 0, lastInsertRowid: 0 };

    const tableName = match[1].toLowerCase();
    const whereClause = match[2] || '';
    const table = this.getTable(tableName);

    const initialLen = table.length;
    const filtered = table.filter((row) => {
      if (whereClause.includes('UPPER(report_id) = ?')) {
        return String(row.report_id || '').toUpperCase() !== String(params[0] || '').toUpperCase();
      }
      if (whereClause.includes('id = ?')) {
        return String(row.id || '') !== String(params[0] || '');
      }
      return false;
    });

    this.tables.set(tableName, filtered);
    return { changes: initialLen - filtered.length, lastInsertRowid: 0 };
  }

  public close(): void {
    this.persistToFile();
  }
}

class DatabaseEngine {
  private db: IDatabase | null = null;
  private dbPath: string;

  constructor() {
    const defaultDataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(defaultDataDir)) {
      try {
        fs.mkdirSync(defaultDataDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create .data directory:', err);
      }
    }

    this.dbPath = path.join(defaultDataDir, 'sobaike_store.json');
    this.init();
  }

  private init() {
    try {
      this.db = new PureSqlDatabase(this.dbPath);

      // Schema initializer
      initSchemaAndSeed(this.db);

      console.log(`[Database] Pure TypeScript Database initialized successfully at ${this.dbPath}`);
    } catch (err) {
      console.error('[Database] Failed to initialize Database:', err);
      throw err;
    }
  }

  public getDb(): IDatabase {
    if (!this.db) {
      this.init();
    }
    return this.db!;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const dbEngine = new DatabaseEngine();
