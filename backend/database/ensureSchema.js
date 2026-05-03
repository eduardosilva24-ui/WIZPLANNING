import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { DATABASE_SCHEMA } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Same path as AuthService / init-db: `<project>/database/database.db` */
const dbPath = join(__dirname, '..', '..', 'database', 'database.db');

/**
 * Ensures database file + tables exist before the API accepts traffic.
 */
export function ensureDatabaseSchema() {
  return new Promise((resolve, reject) => {
    const dir = dirname(dbPath);
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      reject(e);
      return;
    }

    const db = new sqlite3.Database(dbPath, (openErr) => {
      if (openErr) {
        reject(openErr);
        return;
      }

      db.exec(DATABASE_SCHEMA, (execErr) => {
        db.close(() => {});
        if (execErr) {
          reject(execErr);
        } else {
          console.log('✓ SQLite ready at', dbPath);
          resolve();
        }
      });
    });
  });
}
