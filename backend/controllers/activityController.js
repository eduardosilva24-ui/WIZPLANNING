import ActivityService from '../services/ActivityService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const activityService = new ActivityService();
const uploadsDir = path.join(__dirname, '../../uploads');

export const activityController = {
  async getActivities(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const activities = await activityService.getActivities(limit, offset);
      const enrichedActivities = await Promise.all(
        activities.map(async (activity) => ({
          ...activity,
          file_url: activity.file_path ? `/uploads/${activity.file_path}` : null,
          likedByCurrentUser: await activityService.hasUserLiked(req.user.id, activity.id)
        }))
      );

      res.json(enrichedActivities);
    } catch (err) {
      next(err);
    }
  },

  async getActivitiesByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const activities = await activityService.getActivitiesByCategory(category, limit, offset);
      const enrichedActivities = await Promise.all(
        activities.map(async (activity) => ({
          ...activity,
          file_url: activity.file_path ? `/uploads/${activity.file_path}` : null,
          likedByCurrentUser: await activityService.hasUserLiked(req.user.id, activity.id)
        }))
      );

      res.json(enrichedActivities);
    } catch (err) {
      next(err);
    }
  },

  async getUserActivities(req, res, next) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const activities = await activityService.getActivitiesByUser(userId, limit, offset);
      const enrichedActivities = await Promise.all(
        activities.map(async (activity) => ({
          ...activity,
          file_url: activity.file_path ? `/uploads/${activity.file_path}` : null,
          likedByCurrentUser: await activityService.hasUserLiked(req.user.id, activity.id)
        }))
      );

      res.json(enrichedActivities);
    } catch (err) {
      next(err);
    }
  },

  async uploadActivity(req, res, next) {
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { title, description, category } = req.body;
      const file = req.files.file;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = path.basename(String(file.name || 'activity-file'));
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'activity-file';
      const filename = `${timestamp}-${safeName}`;
      const filepath = path.join(uploadsDir, filename);

      // Save file
      await file.mv(filepath);

      // Create activity record
      const activity = await activityService.createActivity(
        req.user.id,
        title,
        description || '',
        filename,
        file.mimetype,
        category || 'general'
      );

      res.status(201).json({
        ...activity,
        file_path: filename,
        file_url: `/uploads/${filename}`
      });
    } catch (err) {
      next(err);
    }
  },

  async likeActivity(req, res, next) {
    try {
      const { activityId } = req.params;
      const result = await activityService.likeActivity(req.user.id, activityId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async unlikeActivity(req, res, next) {
    try {
      const { activityId } = req.params;
      const result = await activityService.unlikeActivity(req.user.id, activityId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async deleteActivity(req, res, next) {
    try {
      const { activityId } = req.params;
      const result = await activityService.deleteActivity(activityId, req.user.id);

      if (!result.deleted) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      res.json({ message: 'Activity deleted' });
    } catch (err) {
      next(err);
    }
  }
};
