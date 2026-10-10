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

  async withTransaction(work) {
    const client = await this.pool.connect();
    const transaction = {
      all: async (sql, params = []) => {
        const result = await client.query(normalizePostgresSql(sql), params);
        return result.rows || [];
      },
      get: async (sql, params = []) => {
        const result = await client.query(normalizePostgresSql(sql), params);
        return result.rows?.[0] || null;
      },
      run: async (sql, params = []) => {
        const result = await client.query(withReturningId(normalizePostgresSql(sql)), params);
        return { lastID: result.rows?.[0]?.id ?? null, changes: result.rowCount || 0 };
      },
      exec: async (sql) => client.query(sql),
      lock: async (key) => client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [String(key)])
    };

    try {
      await client.query('BEGIN');
      const result = await work(transaction);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  close(callback = () => {}) {
    callback();
  }
}

function sqliteRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function sqliteQuery(db, method, sql, params = []) {
  return new Promise((resolve, reject) => {
    db[method](sql, params, (error, result) => {
      if (error) reject(error);
      else resolve(method === 'all' ? result || [] : result || null);
    });
  });
}

const sqliteTransactionTails = new WeakMap();

export async function withDatabaseTransaction(db, work) {
  if (typeof db.withTransaction === 'function') return db.withTransaction(work);

  const previousTransaction = sqliteTransactionTails.get(db) || Promise.resolve();
  let releaseTransaction;
  const currentTransaction = new Promise((resolve) => { releaseTransaction = resolve; });
  sqliteTransactionTails.set(db, previousTransaction.then(() => currentTransaction));
  await previousTransaction;

  let transactionStarted = false;
  try {
    await sqliteRun(db, 'BEGIN IMMEDIATE');
    transactionStarted = true;
    const transaction = {
      all: (sql, params = []) => sqliteQuery(db, 'all', sql, params),
      get: (sql, params = []) => sqliteQuery(db, 'get', sql, params),
      run: (sql, params = []) => sqliteRun(db, sql, params),
      exec: (sql) => new Promise((resolve, reject) => {
        db.exec(sql, (error) => error ? reject(error) : resolve());
      }),
      lock: async () => {}
    };

    const result = await work(transaction);
    await sqliteRun(db, 'COMMIT');
    return result;
  } catch (error) {
    if (transactionStarted) await sqliteRun(db, 'ROLLBACK').catch(() => {});
    throw error;
  } finally {
    releaseTransaction();
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
