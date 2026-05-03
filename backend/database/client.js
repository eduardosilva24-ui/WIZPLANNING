import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const sqliteDbPath = join(__dirname, '..', '..', 'database', 'database.db');

let pgPool;

export function getDatabaseProvider() {
  return process.env.DATABASE_URL ? 'postgres' : 'sqlite';
}

function ensureSqliteDirectory() {
  fs.mkdirSync(dirname(sqliteDbPath), { recursive: true });
}

function getPostgresPool() {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === '0' ? false : { rejectUnauthorized: false }
    });
  }
  return pgPool;
}

function normalizePostgresSql(sql) {
  let normalized = sql.trim();

  if (/^INSERT\s+OR\s+IGNORE\s+INTO/i.test(normalized)) {
    normalized = normalized.replace(/^INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
    if (!/\sON\s+CONFLICT\s/i.test(normalized)) {
      normalized = `${normalized} ON CONFLICT DO NOTHING`;
    }
  }

  let index = 0;
  normalized = normalized.replace(/\?/g, () => `$${++index}`);

  return normalized;
}

function withReturningId(sql) {
  if (/^INSERT\s+/i.test(sql) && !/\sRETURNING\s+/i.test(sql)) {
    return `${sql} RETURNING id`;
  }
  return sql;
}

class PostgresCompatDatabase {
  constructor() {
    this.pool = getPostgresPool();
  }

  all(sql, params = [], callback = () => {}) {
    this.pool
      .query(normalizePostgresSql(sql), params)
      .then((result) => callback(null, result.rows || []))
      .catch((err) => callback(err));
  }

  get(sql, params = [], callback = () => {}) {
    this.pool
      .query(normalizePostgresSql(sql), params)
      .then((result) => callback(null, result.rows?.[0]))
      .catch((err) => callback(err));
  }

  run(sql, params = [], callback = () => {}) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    const query = withReturningId(normalizePostgresSql(sql));
    this.pool
      .query(query, params)
      .then((result) => {
        callback.call(
          {
            lastID: result.rows?.[0]?.id ?? null,
            changes: result.rowCount || 0
          },
          null
        );
      })
      .catch((err) => callback.call({ lastID: null, changes: 0 }, err));
  }

  exec(sql, callback = () => {}) {
    this.pool
      .query(sql)
      .then(() => callback(null))
      .catch((err) => callback(err));
  }

  close(callback = () => {}) {
    callback();
  }
}

export function openDatabase(callback) {
  if (getDatabaseProvider() === 'postgres') {
    const db = new PostgresCompatDatabase();
    if (callback) queueMicrotask(() => callback(null));
    return db;
  }

  ensureSqliteDirectory();
  return new sqlite3.Database(sqliteDbPath, callback);
}
