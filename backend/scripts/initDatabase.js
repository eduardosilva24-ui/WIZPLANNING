import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { DATABASE_SCHEMA } from '../database/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../database/database.db');

const dbDir = dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database at', dbPath);
  db.exec("PRAGMA foreign_keys = ON;", (err) => {
    if (err) {
      console.error("Failed to enable foreign keys:", err);
    } else {
      console.log("Foreign keys enabled.");
    }
  });
});

db.exec(DATABASE_SCHEMA, (err) => {
  if (err) {
    console.error('Error creating schema:', err);
    process.exit(1);
  }
  console.log('✓ Database schema initialized successfully');
  db.close();
});
