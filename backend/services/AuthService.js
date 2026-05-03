import sqlite3 from 'sqlite3';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../database/database.db');

export class AuthService {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }

  /**
   * Register a new user
   */
  async register(name, email, password, role = 'teacher') {
    return new Promise((resolve, reject) => {
      if (!name || !email || !password) {
        reject(new Error('Missing required fields'));
        return;
      }

      const emailNorm = String(email).trim().toLowerCase();
      const hashedPassword = bcryptjs.hashSync(password, 10);
      const db = this.db;

      db.run(
        `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
        [String(name).trim(), emailNorm, hashedPassword, role],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              reject(new Error('Email already registered'));
            } else {
              reject(err);
            }
            return;
          }

          const userId = this.lastID;

          // Create reward record for new user
          db.run(
            `INSERT INTO rewards (user_id, points) VALUES (?, ?)`,
            [userId, 0],
            (err) => {
              if (err) reject(err);
              else resolve({ id: userId, name: String(name).trim(), email: emailNorm, role });
            }
          );
        }
      );
    });
  }

  /**
   * Login user and return JWT token
   */
  async login(email, password) {
    return new Promise((resolve, reject) => {
      const emailNorm = String(email || '').trim().toLowerCase();
      if (!emailNorm || !password) {
        reject(new Error('Email and password are required'));
        return;
      }
      this.db.get(
        `SELECT * FROM users WHERE email = ?`,
        [emailNorm],
        (err, user) => {
          if (err) {
            reject(err);
            return;
          }

          if (!user) {
            reject(new Error('User not found'));
            return;
          }

          const passwordMatch = bcryptjs.compareSync(password, user.password_hash);
          if (!passwordMatch) {
            reject(new Error('Invalid password'));
            return;
          }

          const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            AuthService.getJWTSecret(),
            { expiresIn: '7d' }
          );

          resolve({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        }
      );
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT id, name, email, role, created_at FROM users WHERE id = ?`,
        [userId],
        (err, user) => {
          if (err) reject(err);
          else resolve(user || null);
        }
      );
    });
  }

  /**
   * Get JWT secret from environment
   */
  static getJWTSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn('[AuthService] JWT_SECRET not set in environment, using default (development only)');
      return 'default-secret-key-development-only';
    }
    return secret;
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, AuthService.getJWTSecret());
    } catch (err) {
      return null;
    }
  }

  close() {
    this.db.close();
  }
}

export default AuthService;
