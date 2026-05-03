import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { openDatabase } from '../database/client.js';
import RewardService from './RewardService.js';
import NotificationService from './NotificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');

export class ActivityService {
  constructor() {
    this.db = openDatabase();
  }

  /**
   * Create a new activity (file upload)
   */
  async createActivity(userId, title, description, filePath, fileType, category = 'general', fileName = '', fileData = '', fileSize = 0) {
    return new Promise((resolve, reject) => {
      const db = this.db;

      db.run(
        `INSERT INTO activities (title, description, file_path, file_name, file_type, file_data, file_size, created_by, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, filePath, fileName, fileType, fileData, fileSize, userId, category],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          const activityId = this.lastID;

          const rewards = new RewardService();
          rewards
            .awardPoints(userId, 20, 'activity_upload')
            .then(() => resolve({ id: activityId, title, description, filePath, fileName, fileType, fileSize }))
            .catch(reject)
            .finally(() => rewards.close());
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
        `SELECT a.id, a.title, a.description, a.file_path, a.file_name, a.file_type, a.file_size,
                a.created_by, a.category, a.likes, a.created_at, u.name as creator_name,
                u.bio as creator_bio, u.location as creator_location, u.specialties as creator_specialties,
                CASE WHEN u.avatar_data IS NULL THEN 0 ELSE 1 END as creator_has_avatar
         FROM activities a
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
        `SELECT a.id, a.title, a.description, a.file_path, a.file_name, a.file_type, a.file_size,
                a.created_by, a.category, a.likes, a.created_at, u.name as creator_name,
                u.bio as creator_bio, u.location as creator_location, u.specialties as creator_specialties,
                CASE WHEN u.avatar_data IS NULL THEN 0 ELSE 1 END as creator_has_avatar
         FROM activities a
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
        `SELECT a.id, a.title, a.description, a.file_path, a.file_name, a.file_type, a.file_size,
                a.created_by, a.category, a.likes, a.created_at, u.name as creator_name,
                u.bio as creator_bio, u.location as creator_location, u.specialties as creator_specialties,
                CASE WHEN u.avatar_data IS NULL THEN 0 ELSE 1 END as creator_has_avatar
         FROM activities a
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
              if (err) {
                reject(err);
                return;
              }

              if (!liked) {
                resolve({ liked });
                return;
              }

              db.get(
                `SELECT a.id, a.title, a.created_by, u.name as liker_name
                 FROM activities a
                 LEFT JOIN users u ON u.id = ?
                 WHERE a.id = ?`,
                [userId, activityId],
                async (activityErr, activity) => {
                  if (activityErr) {
                    reject(activityErr);
                    return;
                  }

                  const rewards = new RewardService();
                  const notifications = new NotificationService();
                  try {
                    await rewards.evaluateBadges(userId, 'activity_like_given');
                    if (activity && Number(activity.created_by) !== Number(userId)) {
                      await rewards.evaluateBadges(activity.created_by, 'activity_like_received');
                      await notifications.createNotification(
                        activity.created_by,
                        'like',
                        'New like on your activity',
                        `${activity.liker_name || 'A teacher'} liked "${activity.title}".`,
                        { activityId: activity.id, likerId: userId }
                      );
                    }
                    resolve({ liked });
                  } catch (sideEffectErr) {
                    reject(sideEffectErr);
                  } finally {
                    rewards.close();
                    notifications.close();
                  }
                }
              );
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
   * Get uploaded file data for download.
   */
  async getActivityFile(activityId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT file_path, file_name, file_type, file_data FROM activities WHERE id = ?`,
        [activityId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
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
        `SELECT file_path, file_data FROM activities WHERE id = ? AND created_by = ?`,
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
          if (row.file_path && !row.file_data) {
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
