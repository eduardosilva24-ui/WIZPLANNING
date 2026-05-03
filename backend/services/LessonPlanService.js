import { openDatabase } from '../database/client.js';
import RewardService from './RewardService.js';

export class LessonPlanService {
  constructor() {
    this.db = openDatabase();
  }

  /**
   * Create a new lesson plan
   */
  async createLessonPlan(userId, studentName, book, lesson, objectives, checkTime, notes = '') {
    return new Promise((resolve, reject) => {
      const objectivesJson = typeof objectives === 'string' ? objectives : JSON.stringify(objectives);
      const db = this.db;

      db.run(
        `INSERT INTO lesson_plans (user_id, student_name, book, lesson, objectives, check_time, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, studentName, book, lesson, objectivesJson, checkTime, notes],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          const planId = this.lastID;

          const rewards = new RewardService();
          rewards
            .awardPoints(userId, 10, 'lesson_plan_create')
            .then(() => resolve({ id: planId, userId, studentName, book, lesson }))
            .catch(reject)
            .finally(() => rewards.close());
        }
      );
    });
  }

  /**
   * Get lesson plans for a user
   */
  async getLessonPlansByUser(userId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM lesson_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else {
            // Parse objectives safely (string/text, not always JSON)
            const parsed = rows.map(row => ({
              ...row,
              objectives: typeof row.objectives === 'string' ? row.objectives : row.objectives || []
            }));
            resolve(parsed);
          }
        }
      );
    });
  }

  /**
   * Get a specific lesson plan
   */
  async getLessonPlanById(id, userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM lesson_plans WHERE id = ? AND user_id = ?`,
        [id, userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {
              if (typeof row.objectives === 'string') {
                try {
                  row.objectives = JSON.parse(row.objectives);
                } catch {
                  row.objectives = row.objectives;
                }
              }
            }
            resolve(row || null);
          }
        }
      );
    });
  }

  /**
   * Update a lesson plan
   */
  async updateLessonPlan(id, userId, updates) {
    return new Promise((resolve, reject) => {
      const { studentName, book, lesson, objectives, checkTime, notes } = updates;
      const objectivesJson = objectives && typeof objectives !== 'string' ? JSON.stringify(objectives) : objectives;

      this.db.run(
        `UPDATE lesson_plans 
         SET student_name = COALESCE(?, student_name),
             book = COALESCE(?, book),
             lesson = COALESCE(?, lesson),
             objectives = COALESCE(?, objectives),
             check_time = COALESCE(?, check_time),
             notes = COALESCE(?, notes),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [studentName, book, lesson, objectivesJson, checkTime, notes, id, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ id, updated: this.changes > 0 });
        }
      );
    });
  }

  /**
   * Delete a lesson plan
   */
  async deleteLessonPlan(id, userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM lesson_plans WHERE id = ? AND user_id = ?`,
        [id, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ deleted: this.changes > 0 });
        }
      );
    });
  }

  /**
   * Create class plan (turma)
   */
  async createClassPlan(userId, title, alunos_json, output) {
    return new Promise((resolve, reject) => {
      const db = this.db;

      db.run(
        `INSERT INTO lesson_plans (user_id, student_name, book, lesson, objectives, notes, check_time)
         VALUES (?, ?, 'Turma', 0, ?, ?, ?)`,
        [userId, title, alunos_json, output, 'Turma'],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          const planId = this.lastID;

          const rewards = new RewardService();
          rewards
            .awardPoints(userId, 20, 'class_plan_create')
            .then(() => resolve({ id: planId, title, type: 'class' }))
            .catch(reject)
            .finally(() => rewards.close());
        }
      );
    });
  }

  /**
   * Count total lesson plans for a user
   */
  async countLessonPlansByUser(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT COUNT(*) as total FROM lesson_plans WHERE user_id = ?`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.total || 0);
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

export default LessonPlanService;

