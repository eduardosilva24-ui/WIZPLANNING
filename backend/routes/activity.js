import express from 'express';
import { activityController } from '../controllers/activityController.js';

export const activityRoutes = express.Router();

activityRoutes.get('/', activityController.getActivities);
activityRoutes.get('/category/:category', activityController.getActivitiesByCategory);
activityRoutes.get('/user/:userId', activityController.getUserActivities);
activityRoutes.post('/upload', activityController.uploadActivity);
activityRoutes.get('/:activityId/file', activityController.downloadActivityFile);
activityRoutes.post('/:activityId/like', activityController.likeActivity);
activityRoutes.post('/:activityId/unlike', activityController.unlikeActivity);
activityRoutes.delete('/:activityId', activityController.deleteActivity);

export default activityRoutes;
