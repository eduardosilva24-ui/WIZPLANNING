import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../database/database.db');

export class RewardService {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }

  parseBadges(badges) {
    if (!badges) return [];
    try {
      const parsed = JSON.parse(badges);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Get user rewards
   */
  async getRewards(userId) {
    return new Promise((resolve, reject) => {
      const db = this.db;
      db.get(
        `SELECT * FROM rewards WHERE user_id = ?`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else {
            if (!row) {
              db.run(
                `INSERT INTO rewards (user_id, points) VALUES (?, 0)`,
                [userId],
                (insertErr) => {
                  if (insertErr) reject(insertErr);
                  else resolve({ userId, points: 0, badges: [], level: this.calculateLevel(0) });
                }
              );
              return;
            }
            const badges = this.parseBadges(row.badges);
            resolve({
              userId,
              points: row ? row.points : 0,
              badges,
              level: this.calculateLevel(row ? row.points : 0)
            });
          }
        }
      );
    });
  }

  /**
   * Award points to user
   */
  async awardPoints(userId, points, reason = '') {
    return new Promise((resolve, reject) => {
      const db = this.db;

      db.run(
        `UPDATE rewards SET points = points + ? WHERE user_id = ?`,
        [points, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ awarded: this.changes > 0, points, reason });
        }
      );
    });
  }

  /**
   * Add badge to user
   */
  async addBadge(userId, badge) {
    return new Promise((resolve, reject) => {
      const db = this.db;

      db.get(
        `SELECT badges FROM rewards WHERE user_id = ?`,
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          const existingBadges = this.parseBadges(row?.badges);
          let badges = [...existingBadges];
          if (!badges.includes(badge)) {
            badges.push(badge);
          }

          db.run(
            `UPDATE rewards SET badges = ? WHERE user_id = ?`,
            [JSON.stringify(badges), userId],
            (err) => {
              if (err) reject(err);
              else resolve({ badgeAdded: !existingBadges.includes(badge), badge });
            }
          );
        }
      );
    });
  }

  /**
   * Get daily bonus (if available)
   */
  async getDailyBonus(userId) {
    return new Promise((resolve, reject) => {
      const db = this.db;

      const awardBonus = () => {
        const today = new Date().toISOString().split('T')[0];
        db.run(
          `UPDATE rewards SET points = points + 5, last_bonus_date = ? WHERE user_id = ?`,
          [today, userId],
          (err) => {
            if (err) reject(err);
            else resolve({ bonusAwarded: true, points: 5 });
          }
        );
      };

      db.get(
        `SELECT last_bonus_date FROM rewards WHERE user_id = ?`,
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            db.run(
              `INSERT INTO rewards (user_id, points) VALUES (?, 0)`,
              [userId],
              (insertErr) => {
                if (insertErr) reject(insertErr);
                else awardBonus();
              }
            );
            return;
          }

          const today = new Date().toISOString().split('T')[0];
          const lastBonusDate = row?.last_bonus_date;

          if (lastBonusDate !== today) {
            awardBonus();
          } else {
            resolve({ bonusAwarded: false, message: 'Bonus already claimed today' });
          }
        }
      );
    });
  }

  /**
   * Calculate user level based on points
   */
  calculateLevel(points) {
    if (points < 50) return 'Beginner';
    if (points < 150) return 'Intermediate';
    if (points < 300) return 'Advanced';
    if (points < 500) return 'Expert';
    return 'Master';
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT u.id, u.name, r.points FROM rewards r
         JOIN users u ON r.user_id = u.id
         ORDER BY r.points DESC
         LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else {
            const leaderboard = rows.map((row, index) => ({
              rank: index + 1,
              ...row,
              level: this.calculateLevel(row.points)
            }));
            resolve(leaderboard);
          }
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

export default RewardService;
