import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../../database/database.db');
const uploadsDir = path.join(__dirname, '../../uploads');

export class ActivityService {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }

  /**
   * Create a new activity (file upload)
   */
  async createActivity(userId, title, description, filePath, fileType, category = 'general') {
    return new Promise((resolve, reject) => {
      const db = this.db;

      db.run(
        `INSERT INTO activities (title, description, file_path, file_type, created_by, category)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, filePath, fileType, userId, category],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          const activityId = this.lastID;

          // Award points for uploading activity
          db.run(
            `UPDATE rewards SET points = points + 20 WHERE user_id = ?`,
            [userId],
            (err) => {
              if (err) console.error('Error awarding points:', err);
            }
          );

          resolve({ id: activityId, title, description, fileType });
        }
      );
    });
  }

  /**
   * Get all activities (community feed)
   */
  async getActivities(limit = 20, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT a.*, u.name as creator_name FROM activities a
         JOIN users u ON a.created_by = u.id
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Get activities by category
   */
  async getActivitiesByCategory(category, limit = 20, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT a.*, u.name as creator_name FROM activities a
         JOIN users u ON a.created_by = u.id
         WHERE a.category = ?
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
        [category, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Get activities by user
   */
  async getActivitiesByUser(userId, limit = 20, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT a.*, u.name as creator_name FROM activities a
         JOIN users u ON a.created_by = u.id
         WHERE a.created_by = ?
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Like an activity
   */
  async likeActivity(userId, activityId) {
    return new Promise((resolve, reject) => {
      const db = this.db;

      db.run(
        `INSERT OR IGNORE INTO activity_likes (user_id, activity_id) VALUES (?, ?)`,
        [userId, activityId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          const liked = this.changes > 0;

          // Update like count
          db.run(
            `UPDATE activities SET likes = (SELECT COUNT(*) FROM activity_likes WHERE activity_id = ?) WHERE id = ?`,
            [activityId, activityId],
            (err) => {
              if (err) reject(err);
              else resolve({ liked });
            }
          );
        }
      );
    });
  }

  /**
   * Unlike an activity
   */
  async unlikeActivity(userId, activityId) {
    return new Promise((resolve, reject) => {
      const db = this.db;

      db.run(
        `DELETE FROM activity_likes WHERE user_id = ? AND activity_id = ?`,
        [userId, activityId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          const unliked = this.changes > 0;

          // Update like count
          db.run(
            `UPDATE activities SET likes = (SELECT COUNT(*) FROM activity_likes WHERE activity_id = ?) WHERE id = ?`,
            [activityId, activityId],
            (err) => {
              if (err) reject(err);
              else resolve({ unliked });
            }
          );
        }
      );
    });
  }

  /**
   * Check if user liked activity
   */
  async hasUserLiked(userId, activityId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT id FROM activity_likes WHERE user_id = ? AND activity_id = ?`,
        [userId, activityId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }

  /**
   * Delete activity
   */
  async deleteActivity(activityId, userId) {
    return new Promise((resolve, reject) => {
      const db = this.db;

      db.get(
        `SELECT file_path FROM activities WHERE id = ? AND created_by = ?`,
        [activityId, userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve({ deleted: false });
            return;
          }

          // Delete file
          if (row.file_path) {
            const fullPath = path.join(uploadsDir, row.file_path);
            fs.unlink(fullPath, (err) => {
              if (err) console.error('Error deleting file:', err);
            });
          }

          // Delete likes first so foreign-key checks cannot block the activity delete.
          db.run(
            `DELETE FROM activity_likes WHERE activity_id = ?`,
            [activityId],
            (likesErr) => {
              if (likesErr) {
                reject(likesErr);
                return;
              }

              db.run(
                `DELETE FROM activities WHERE id = ?`,
                [activityId],
                function(err) {
                  if (err) reject(err);
                  else resolve({ deleted: this.changes > 0 });
                }
              );
            }
          );
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

export default ActivityService;
