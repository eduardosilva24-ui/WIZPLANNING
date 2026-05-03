import { openDatabase } from '../database/client.js';
import NotificationService from './NotificationService.js';

export const BADGE_DEFINITIONS = {
  first_lesson: {
    id: 'first_lesson',
    name: 'First Class Planned',
    description: 'Prepared the first class plan.',
    icon: 'Lesson'
  },
  first_post: {
    id: 'first_post',
    name: 'Community Starter',
    description: 'Shared the first activity with other teachers.',
    icon: 'Post'
  },
  first_like_given: {
    id: 'first_like_given',
    name: 'Peer Supporter',
    description: 'Liked another teacher activity for the first time.',
    icon: 'Like'
  },
  first_like_received: {
    id: 'first_like_received',
    name: 'Peer Approved',
    description: 'Received the first like on a shared activity.',
    icon: 'Star'
  },
  profile_complete: {
    id: 'profile_complete',
    name: 'Introduced',
    description: 'Completed the teacher profile with photo and bio.',
    icon: 'Profile'
  },
  daily_bonus: {
    id: 'daily_bonus',
    name: 'Daily Check-in',
    description: 'Claimed the first daily bonus.',
    icon: 'Daily'
  },
  points_50: {
    id: 'points_50',
    name: '50 Point Spark',
    description: 'Reached 50 reward points.',
    icon: '50'
  },
  points_150: {
    id: 'points_150',
    name: '150 Point Builder',
    description: 'Reached 150 reward points.',
    icon: '150'
  },
  points_300: {
    id: 'points_300',
    name: '300 Point Pro',
    description: 'Reached 300 reward points.',
    icon: '300'
  },
  points_500: {
    id: 'points_500',
    name: '500 Point Master',
    description: 'Reached 500 reward points.',
    icon: '500'
  },
  top_teacher: {
    id: 'top_teacher',
    name: 'Leaderboard Leader',
    description: 'Reached first place on the leaderboard.',
    icon: 'Top'
  }
};

export class RewardService {
  constructor() {
    this.db = openDatabase();
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  parseBadges(badges) {
    if (!badges) return [];
    try {
      const parsed = JSON.parse(badges);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((badge) => typeof badge === 'string' ? badge : badge?.id)
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  decorateBadges(badgeIds) {
    return [...new Set(badgeIds)]
      .map((id) => BADGE_DEFINITIONS[id] || {
        id,
        name: id,
        description: 'Custom achievement.',
        icon: 'Badge'
      });
  }

  async ensureRewardRecord(userId) {
    const row = await this.get(`SELECT * FROM rewards WHERE user_id = ?`, [userId]);
    if (row) return row;

    await this.run(`INSERT INTO rewards (user_id, points, badges) VALUES (?, 0, ?)`, [userId, JSON.stringify([])]);
    return this.get(`SELECT * FROM rewards WHERE user_id = ?`, [userId]);
  }

  async getRewards(userId) {
    const row = await this.ensureRewardRecord(userId);
    const badgeIds = this.parseBadges(row.badges);
    return {
      userId,
      points: Number(row.points || 0),
      badges: this.decorateBadges(badgeIds),
      badgeIds,
      level: this.calculateLevel(Number(row.points || 0))
    };
  }

  async awardPoints(userId, points, reason = '') {
    await this.ensureRewardRecord(userId);
    await this.run(`UPDATE rewards SET points = points + ? WHERE user_id = ?`, [points, userId]);
    await this.evaluateBadges(userId, reason);
    return { awarded: true, points, reason };
  }

  async addBadge(userId, badgeId) {
    await this.ensureRewardRecord(userId);
    const row = await this.get(`SELECT badges FROM rewards WHERE user_id = ?`, [userId]);
    const existingBadges = this.parseBadges(row?.badges);

    if (existingBadges.includes(badgeId)) {
      return { badgeAdded: false, badge: BADGE_DEFINITIONS[badgeId] || { id: badgeId } };
    }

    const nextBadges = [...existingBadges, badgeId];
    await this.run(`UPDATE rewards SET badges = ? WHERE user_id = ?`, [JSON.stringify(nextBadges), userId]);

    const badge = BADGE_DEFINITIONS[badgeId] || {
      id: badgeId,
      name: badgeId,
      description: 'New achievement unlocked.',
      icon: 'Badge'
    };

    const notifications = new NotificationService();
    try {
      await notifications.createNotification(
        userId,
        'badge',
        `New badge: ${badge.name}`,
        badge.description,
        { badgeId: badge.id }
      );
    } finally {
      notifications.close();
    }

    return { badgeAdded: true, badge };
  }

  async evaluateBadges(userId, reason = '') {
    const rewards = await this.getRewards(userId);
    const points = Number(rewards.points || 0);

    const lessonPlans = await this.get(`SELECT COUNT(*) as total FROM lesson_plans WHERE user_id = ?`, [userId]);
    const launches = await this.get(`SELECT COUNT(*) as total FROM planner_launches WHERE user_id = ?`, [userId]);
    const activities = await this.get(`SELECT COUNT(*) as total FROM activities WHERE created_by = ?`, [userId]);
    const likesReceived = await this.get(`SELECT COALESCE(SUM(likes), 0) as total FROM activities WHERE created_by = ?`, [userId]);
    const likesGiven = await this.get(`SELECT COUNT(*) as total FROM activity_likes WHERE user_id = ?`, [userId]);
    const profile = await this.get(
      `SELECT bio, avatar_data FROM users WHERE id = ?`,
      [userId]
    );

    const checks = [
      [Number(lessonPlans?.total || 0) + Number(launches?.total || 0) > 0, 'first_lesson'],
      [Number(activities?.total || 0) > 0, 'first_post'],
      [Number(likesReceived?.total || 0) > 0, 'first_like_received'],
      [Number(likesGiven?.total || 0) > 0, 'first_like_given'],
      [Boolean(profile?.bio && profile?.avatar_data), 'profile_complete'],
      [reason === 'daily_bonus', 'daily_bonus'],
      [points >= 50, 'points_50'],
      [points >= 150, 'points_150'],
      [points >= 300, 'points_300'],
      [points >= 500, 'points_500']
    ];

    for (const [condition, badgeId] of checks) {
      if (condition) await this.addBadge(userId, badgeId);
    }

    const leader = await this.get(
      `SELECT u.id, r.points FROM rewards r JOIN users u ON r.user_id = u.id ORDER BY r.points DESC, u.created_at ASC LIMIT 1`
    );

    if (Number(leader?.id) === Number(userId) && Number(leader?.points || 0) > 0) {
      await this.addBadge(userId, 'top_teacher');
    }
  }

  async getDailyBonus(userId) {
    await this.ensureRewardRecord(userId);
    const row = await this.get(`SELECT last_bonus_date FROM rewards WHERE user_id = ?`, [userId]);
    const today = new Date().toISOString().split('T')[0];
    const lastBonusDate = row?.last_bonus_date instanceof Date
      ? row.last_bonus_date.toISOString().split('T')[0]
      : row?.last_bonus_date
        ? String(row.last_bonus_date).split('T')[0]
        : null;

    if (lastBonusDate === today) {
      return { bonusAwarded: false, message: 'Bonus already claimed today' };
    }

    await this.run(
      `UPDATE rewards SET points = points + 5, last_bonus_date = ? WHERE user_id = ?`,
      [today, userId]
    );
    await this.evaluateBadges(userId, 'daily_bonus');
    return { bonusAwarded: true, points: 5 };
  }

  calculateLevel(points) {
    if (points < 50) return 'Beginner';
    if (points < 150) return 'Intermediate';
    if (points < 300) return 'Advanced';
    if (points < 500) return 'Expert';
    return 'Master';
  }

  async getLeaderboard(limit = 10) {
    const rows = await this.all(
      `SELECT u.id, u.name, u.bio, u.location, u.specialties, r.points, r.badges
       FROM rewards r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.points DESC, u.created_at ASC
       LIMIT ?`,
      [limit]
    );

    return rows.map((row, index) => {
      const badgeIds = this.parseBadges(row.badges);
      return {
        rank: index + 1,
        id: row.id,
        name: row.name,
        bio: row.bio || '',
        location: row.location || '',
        specialties: row.specialties || '',
        points: Number(row.points || 0),
        level: this.calculateLevel(Number(row.points || 0)),
        badges: this.decorateBadges(badgeIds)
      };
    });
  }

  close() {
    this.db.close();
  }
}

export default RewardService;
