import express from 'express';
import { notificationController } from '../controllers/notificationController.js';

export const notificationRoutes = express.Router();

notificationRoutes.get('/', notificationController.getNotifications);
notificationRoutes.get('/unread-count', notificationController.getUnreadCount);
notificationRoutes.post('/mark-all-read', notificationController.markAllRead);
notificationRoutes.post('/:notificationId/read', notificationController.markRead);

export default notificationRoutes;
