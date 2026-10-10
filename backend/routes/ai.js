import express from 'express';
import { aiController } from '../controllers/aiController.js';

export const aiRoutes = express.Router();

aiRoutes.post('/review-lesson', aiController.reviewLessonPlan);

export default aiRoutes;
