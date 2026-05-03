import express from 'express';
import { rewardController } from '../controllers/rewardController.js';

export const rewardRoutes = express.Router();

rewardRoutes.get('/', rewardController.getRewards);
rewardRoutes.post('/daily-bonus', rewardController.getDailyBonus);
rewardRoutes.get('/leaderboard', rewardController.getLeaderboard);

export default rewardRoutes;
