import NotificationService from '../services/NotificationService.js';

const notificationService = new NotificationService();

export const notificationController = {
  async getNotifications(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 30;
      const offset = parseInt(req.query.offset, 10) || 0;
      const notifications = await notificationService.getNotifications(req.user.id, limit, offset);
      const unreadCount = await notificationService.getUnreadCount(req.user.id);
      res.json({ notifications, unreadCount });
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const unreadCount = await notificationService.getUnreadCount(req.user.id);
      res.json({ unreadCount });
    } catch (err) {
      next(err);
    }
  },

  async markRead(req, res, next) {
    try {
      const result = await notificationService.markRead(req.user.id, req.params.notificationId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req, res, next) {
    try {
      const result = await notificationService.markAllRead(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

export default notificationController;
