import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { openDatabase, withDatabaseTransaction } from '../database/client.js';
import RewardService from './RewardService.js';

dotenv.config();

export function normalizeTeacherName(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function accountConflict(message) {
  const error = new Error(message);
  error.status = 409;
  error.code = 'ACCOUNT_CONFLICT';
  return error;
}

export class AuthService {
  constructor(database = openDatabase()) {
    this.db = database;
  }

  /**
   * Register a new user
   */
  async register(name, email, password) {
    const nameNorm = String(name || '').replace(/\s+/g, ' ').trim();
    const emailNorm = String(email || '').trim().toLowerCase();
    if (!nameNorm || !emailNorm || !password) throw new Error('Missing required fields');
    if (nameNorm.length < 2 || nameNorm.length > 80) {
      const error = new Error('O nome deve ter entre 2 e 80 caracteres.');
      error.status = 400;
      throw error;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      const error = new Error('Informe um e-mail válido.');
      error.status = 400;
      throw error;
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);
    const assignedRole = 'teacher';
    try {
      return await withDatabaseTransaction(this.db, async (transaction) => {
        await transaction.lock('wizplanning:user-registration');
        const existingUsers = await transaction.all('SELECT id, name, email FROM users');
        if (existingUsers.some(user => String(user.email || '').trim().toLowerCase() === emailNorm)) {
          throw accountConflict('Já existe uma conta com este e-mail.');
        }
        const normalizedName = normalizeTeacherName(nameNorm);
        if (existingUsers.some(user => normalizeTeacherName(user.name) === normalizedName)) {
          throw accountConflict('Já existe uma conta com este nome.');
        }

        const inserted = await transaction.run(
          `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
          [nameNorm, emailNorm, hashedPassword, assignedRole]
        );
        await transaction.run(`INSERT INTO rewards (user_id, points) VALUES (?, ?)`, [inserted.lastID, 0]);
        return { id: inserted.lastID, name: nameNorm, email: emailNorm, role: assignedRole };
      });
    } catch (error) {
      if (error.code === '23505' || error.message.includes('UNIQUE constraint failed')) {
        throw accountConflict('Já existe uma conta com este e-mail ou nome.');
      }
      throw error;
    }
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

    const currentUser = await this.getUserById(userId);
    if (!currentUser) throw new Error('User not found');

    await withDatabaseTransaction(this.db, async (transaction) => {
      await transaction.lock('wizplanning:user-registration');
      if (normalizeTeacherName(next.name) !== normalizeTeacherName(currentUser.name)) {
        const existingUsers = await transaction.all('SELECT id, name FROM users');
        const normalizedName = normalizeTeacherName(next.name);
        if (existingUsers.some(user =>
          String(user.id) !== String(userId) && normalizeTeacherName(user.name) === normalizedName
        )) throw accountConflict('Já existe uma conta com este nome.');
      }
      await transaction.run(
        `UPDATE users
         SET name = ?, bio = ?, location = ?, phone = ?, specialties = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [next.name, next.bio, next.location, next.phone, next.specialties, userId]
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
