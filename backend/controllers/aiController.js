import GeminiService, { GeminiServiceError } from '../services/GeminiService.js';

export const aiController = {
  async reviewLessonPlan(req, res, next) {
    try {
      const review = await GeminiService.reviewLessonPlan(req.body?.planText);
      res.json(review);
    } catch (error) {
      if (error instanceof GeminiServiceError) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  }
};
