import ActivityService from '../services/ActivityService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getDatabaseProvider } from '../database/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const activityService = new ActivityService();
const uploadsDir = path.join(__dirname, '../../uploads');

function getPublicBaseUrl(req) {
  const configured = String(process.env.PUBLIC_API_BASE || '').trim();
  if (configured) return configured.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function getActivityFileUrl(req, activity) {
  if (!activity.file_path && !activity.file_data) return null;
  const baseUrl = getPublicBaseUrl(req);
  return `${baseUrl}/api/activities/${activity.id}/file`;
}

function toActivityResponse(req, activity) {
  return {
    ...activity,
    creator_has_avatar: Boolean(activity.creator_has_avatar),
    creator_avatar_url: activity.creator_has_avatar
      ? `${getPublicBaseUrl(req)}/api/users/${activity.created_by}/avatar`
      : '',
    file_url: getActivityFileUrl(req, activity)
  };
}

export const activityController = {
  async getActivities(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const activities = await activityService.getActivities(limit, offset);
      const enrichedActivities = await Promise.all(
        activities.map(async (activity) => ({
          ...toActivityResponse(req, activity),
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
          ...toActivityResponse(req, activity),
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
          ...toActivityResponse(req, activity),
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

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = path.basename(String(file.name || 'activity-file'));
      const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'activity-file';
      const filename = `${timestamp}-${safeName}`;
      const filepath = path.join(uploadsDir, filename);
      const storeFileInDatabase =
        process.env.STORE_UPLOADS_IN_DB === '1' || getDatabaseProvider() === 'postgres';
      let fileData = '';

      if (storeFileInDatabase) {
        fileData = file.data.toString('base64');
      } else {
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Save file
        await file.mv(filepath);
      }

      // Create activity record
      const activity = await activityService.createActivity(
        req.user.id,
        title,
        description || '',
        filename,
        file.mimetype,
        category || 'general',
        originalName,
        fileData,
        Number(file.size || file.data?.length || 0)
      );

      res.status(201).json(toActivityResponse(req, { ...activity, file_path: filename }));
    } catch (err) {
      next(err);
    }
  },

  async downloadActivityFile(req, res, next) {
    try {
      const { activityId } = req.params;
      const file = await activityService.getActivityFile(activityId);

      if (!file || (!file.file_data && !file.file_path)) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.setHeader('Content-Type', file.file_type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(file.file_name || file.file_path || 'activity-file')}"`);

      if (file.file_data) {
        return res.send(Buffer.from(file.file_data, 'base64'));
      }

      return res.sendFile(path.join(uploadsDir, file.file_path));
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
