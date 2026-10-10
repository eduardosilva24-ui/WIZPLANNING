import assert from 'node:assert/strict';
import { test } from 'node:test';
import sqlite3 from 'sqlite3';
import { AuthService, normalizeTeacherName } from './AuthService.js';

function run(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, error => error ? reject(error) : resolve());
  });
}

function all(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, (error, rows) => error ? reject(error) : resolve(rows));
  });
}

function close(db) {
  return new Promise((resolve, reject) => {
    db.close(error => error ? reject(error) : resolve());
  });
}

async function makeAuthService() {
  const db = new sqlite3.Database(':memory:');
  await run(db, `CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'teacher'
  )`);
  await run(db, `CREATE TABLE rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    points INTEGER DEFAULT 0
  )`);
  return { db, auth: new AuthService(db) };
}

test('normalizes teacher names without case, accent, or repeated-space variants', () => {
  assert.equal(normalizeTeacherName('  MÁRIA   da Silva '), 'maria da silva');
});

test('prevents duplicate teacher names and emails, including simultaneous signups', async () => {
  const { db, auth } = await makeAuthService();
  try {
    const attempts = await Promise.allSettled([
      auth.register('Maria da Silva', 'maria@example.com', 'senha123'),
      auth.register('  MÁRIA   DA SILVA ', 'another@example.com', 'senha123')
    ]);

    assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
    const duplicateName = attempts.find(result => result.status === 'rejected');
    assert.equal(duplicateName.reason.status, 409);
    assert.match(duplicateName.reason.message, /nome/i);

    await assert.rejects(
      auth.register('Maria Outra', 'MARIA@example.com', 'senha123'),
      error => error.status === 409 && /e-mail/i.test(error.message)
    );

    assert.equal((await all(db, 'SELECT id FROM users')).length, 1);
    assert.equal((await all(db, 'SELECT user_id FROM rewards')).length, 1);
  } finally {
    await close(db);
  }
});
