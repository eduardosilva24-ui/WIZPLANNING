import RewardService from "./RewardService.js";
import { openDatabase } from "../database/client.js";

const POINTS_PER_CLASS = 10;

/**
 * Save planning + alunos; award points (hidden side-effect). Mirrors GAS launchClass.
 * @param {string} planningOutput
 * @param {Array<{nome:string,livro:string,numeroRaw:string}>} alunos
 * @param {number} professorUserId — authenticated user id (Node app)
 */
export function launchClass(planningOutput, alunos, professorUserId) {
  return new Promise((resolve, reject) => {
    const db = openDatabase();
    db.run(
      `INSERT INTO planner_launches (user_id, planning_output, alunos_json) VALUES (?, ?, ?)`,
      [professorUserId, planningOutput, JSON.stringify(alunos)],
      (err) => {
        if (err) {
          db.close(() => reject(err));
          return;
        }
        const rewards = new RewardService();
        rewards
          .awardPoints(professorUserId, POINTS_PER_CLASS, "lesson_planner_generate")
          .then(() => {
            rewards.close();
            db.close(() => resolve());
          })
          .catch((e) => {
            rewards.close();
            db.close(() => reject(e));
          });
      }
    );
  });
}
