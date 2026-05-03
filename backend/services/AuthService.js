import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { openDatabase } from '../database/client.js';
import RewardService from './RewardService.js';

dotenv.config();

export class AuthService {
  constructor() {
    this.db = openDatabase();
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
            if (err.code === '23505' || err.message.includes('UNIQUE constraint failed')) {
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
              role: user.role,
              bio: user.bio || '',
              location: user.location || '',
              phone: user.phone || '',
              specialties: user.specialties || ''
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
        `SELECT id, name, email, role, bio, location, phone, specialties,
                CASE WHEN avatar_data IS NULL THEN 0 ELSE 1 END as has_avatar,
                updated_at, created_at
         FROM users WHERE id = ?`,
        [userId],
        (err, user) => {
          if (err) reject(err);
          else resolve(user || null);
        }
      );
    });
  }

  async getPublicUserById(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT id, name, role, bio, location, specialties,
                CASE WHEN avatar_data IS NULL THEN 0 ELSE 1 END as has_avatar,
                created_at
         FROM users WHERE id = ?`,
        [userId],
        (err, user) => {
          if (err) reject(err);
          else resolve(user || null);
        }
      );
    });
  }

  async updateProfile(userId, updates) {
    const allowed = {
      name: updates.name,
      bio: updates.bio,
      location: updates.location,
      phone: updates.phone,
      specialties: updates.specialties
    };

    const next = Object.fromEntries(
      Object.entries(allowed).map(([key, value]) => [key, value == null ? '' : String(value).trim()])
    );

    if (!next.name) {
      throw new Error('Name is required');
    }

    await new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE users
         SET name = ?, bio = ?, location = ?, phone = ?, specialties = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [next.name, next.bio, next.location, next.phone, next.specialties, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    await this.evaluateProfileBadges(userId);
    return this.getUserById(userId);
  }

  async updateAvatar(userId, file) {
    if (!file || !file.data) {
      throw new Error('No image provided');
    }

    const mime = String(file.mimetype || '');
    if (!mime.startsWith('image/')) {
      throw new Error('Profile photo must be an image');
    }

    await new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE users
         SET avatar_data = ?, avatar_type = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [file.data.toString('base64'), mime, userId],
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    await this.evaluateProfileBadges(userId);
    return this.getUserById(userId);
  }

  async getUserAvatar(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT avatar_data, avatar_type FROM users WHERE id = ?`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        }
      );
    });
  }

  async evaluateProfileBadges(userId) {
    const rewards = new RewardService();
    try {
      await rewards.evaluateBadges(userId, 'profile_update');
    } finally {
      rewards.close();
    }
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
