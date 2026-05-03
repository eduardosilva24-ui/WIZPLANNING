import { openDatabase } from '../database/client.js';

export class NotificationService {
  constructor() {
    this.db = openDatabase();
  }

  parseMetadata(metadata) {
    if (!metadata) return {};
    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  async createNotification(userId, type, title, message, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO notifications (user_id, type, title, message, metadata) VALUES (?, ?, ?, ?, ?)`,
        [userId, type, title, message, JSON.stringify(metadata || {})],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, userId, type, title, message, metadata });
        }
      );
    });
  }

  async getNotifications(userId, limit = 30, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          resolve((rows || []).map((row) => ({
            ...row,
            metadata: this.parseMetadata(row.metadata),
            read: Boolean(row.read_at)
          })));
        }
      );
    });
  }

  async getUnreadCount(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND read_at IS NULL`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(Number(row?.total || 0));
        }
      );
    });
  }

  async markRead(userId, notificationId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
        [notificationId, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes > 0 });
        }
      );
    });
  }

  async markAllRead(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL`,
        [userId],
        function(err) {
          if (err) reject(err);
          else resolve({ updated: this.changes || 0 });
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

export default NotificationService;
