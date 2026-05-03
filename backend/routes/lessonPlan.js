import express from 'express';
import { lessonPlanController } from '../controllers/lessonPlanController.js';

export const lessonPlanRoutes = express.Router();

lessonPlanRoutes.post('/generate', lessonPlanController.generatePlan);

lessonPlanRoutes.post('/save-class', lessonPlanController.saveClassPlan);



// Test endpoint (public, no auth)
lessonPlanRoutes.post('/test', (req, res, next) => {
  const sampleInput = 'João\\tNW2\\t1\\nMaria\\tNG\\t3';
  console.log('[TEST] Running with sample:', sampleInput);
  req.body = { texto: sampleInput, rawInput: sampleInput, horarioStr: '10:00' };
  req.user = { id: 'test-user' };
  lessonPlanController.generatePlan(req, res, next);
});
lessonPlanRoutes.post('/', lessonPlanController.createLessonPlan);
lessonPlanRoutes.get('/', lessonPlanController.getLessonPlans);

// Metadata endpoints
lessonPlanRoutes.get('/metadata/books', lessonPlanController.getBooks);
lessonPlanRoutes.get('/metadata/lessons/:book', lessonPlanController.getLessons);
lessonPlanRoutes.get('/:id', lessonPlanController.getLessonPlan);
lessonPlanRoutes.put('/:id', lessonPlanController.updateLessonPlan);
lessonPlanRoutes.delete('/:id', lessonPlanController.deleteLessonPlan);

export default lessonPlanRoutes;
