import bcryptjs from 'bcryptjs';
import { DATABASE_SCHEMA, POSTGRES_DATABASE_SCHEMA } from './schema.js';
import { getDatabaseProvider, openDatabase, sqliteDbPath } from './client.js';

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function close(db) {
  return new Promise((resolve) => db.close(resolve));
}

async function ensureSqliteTableColumns(db, table, migrations) {
  const columns = (await all(db, `PRAGMA table_info(${table})`)).map((row) => row.name);

  for (const [column, sql] of migrations) {
    if (!columns.includes(column)) {
      await run(db, sql);
    }
  }
}

async function ensureSqliteColumns(db) {
  await ensureSqliteTableColumns(db, 'users', [
    ['bio', `ALTER TABLE users ADD COLUMN bio TEXT`],
    ['location', `ALTER TABLE users ADD COLUMN location TEXT`],
    ['phone', `ALTER TABLE users ADD COLUMN phone TEXT`],
    ['specialties', `ALTER TABLE users ADD COLUMN specialties TEXT`],
    ['avatar_data', `ALTER TABLE users ADD COLUMN avatar_data TEXT`],
    ['avatar_type', `ALTER TABLE users ADD COLUMN avatar_type TEXT`],
    ['updated_at', `ALTER TABLE users ADD COLUMN updated_at TIMESTAMP`]
  ]);

  await ensureSqliteTableColumns(db, 'activities', [
    ['file_name', `ALTER TABLE activities ADD COLUMN file_name TEXT`],
    ['file_data', `ALTER TABLE activities ADD COLUMN file_data TEXT`],
    ['file_size', `ALTER TABLE activities ADD COLUMN file_size INTEGER DEFAULT 0`]
  ]);

  await exec(db, `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rewards_user_id_unique ON rewards(user_id);`);
}

async function ensurePostgresColumns(db) {
  await exec(db, `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS specialties TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_type TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS file_name TEXT;
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS file_data TEXT;
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rewards_user_id_unique ON rewards(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
  `);
}

async function seedUserIfConfigured(db) {
  const email = String(process.env.SEED_USER_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.SEED_USER_PASSWORD || '');
  const name = String(process.env.SEED_USER_NAME || 'WizPlanning Teacher').trim();
  const role = String(process.env.SEED_USER_ROLE || 'teacher').trim();

  if (!email || !password) return;

  const existing = await get(db, `SELECT id FROM users WHERE email = ?`, [email]);
  if (existing) return;

  const hashedPassword = bcryptjs.hashSync(password, 10);
  const inserted = await run(
    db,
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    [name, email, hashedPassword, role]
  );

  await run(db, `INSERT INTO rewards (user_id, points) VALUES (?, 0)`, [inserted.lastID]);
  console.log(`Seeded initial user ${email}`);
}

export async function ensureDatabaseSchema() {
  const provider = getDatabaseProvider();
  const db = openDatabase();

  try {
    await exec(db, provider === 'postgres' ? POSTGRES_DATABASE_SCHEMA : DATABASE_SCHEMA);
    if (provider === 'postgres') {
      await ensurePostgresColumns(db);
    } else {
      await ensureSqliteColumns(db);
    }
    await seedUserIfConfigured(db);
    console.log(provider === 'postgres' ? 'PostgreSQL ready' : `SQLite ready at ${sqliteDbPath}`);
  } finally {
    await close(db);
  }
}
