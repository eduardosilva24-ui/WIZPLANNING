import RewardService from '../services/RewardService.js';

const rewardService = new RewardService();

export const rewardController = {
  async getRewards(req, res, next) {
    try {
      const rewards = await rewardService.getRewards(req.user.id);
      res.json(rewards);
    } catch (err) {
      next(err);
    }
  },

  async getDailyBonus(req, res, next) {
    try {
      const result = await rewardService.getDailyBonus(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const leaderboard = await rewardService.getLeaderboard(limit);
      res.json({ leaderboard });
    } catch (err) {
      next(err);
    }
  }
};
