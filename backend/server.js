import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import authRoutes from './routes/auth.js';
import lessonPlanRoutes from './routes/lessonPlan.js';
import rewardRoutes from './routes/reward.js';
import activityRoutes from './routes/activity.js';
import notificationRoutes from './routes/notification.js';
import { activityController } from './controllers/activityController.js';
import { authController } from './controllers/authController.js';

import { authMiddleware, errorHandler } from './middleware/auth.js';
import { ensureDatabaseSchema } from './database/ensureSchema.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : null;

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(express.json());
app.use(cors({
  origin: allowedOrigins || true,
  credentials: true
}));
app.use(fileUpload());

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.get('/api/users/:userId/avatar', authController.getUserAvatar);
app.get('/api/users/:userId/profile', authMiddleware, authController.getPublicProfile);
app.use('/api/auth', authRoutes);
app.use('/api/lesson-plans', authMiddleware, lessonPlanRoutes);
app.use('/api/rewards', authMiddleware, rewardRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.get('/api/activities/:activityId/file', activityController.downloadActivityFile);
app.use('/api/activities', authMiddleware, activityRoutes);

// 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use(errorHandler);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
ensureDatabaseSchema()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`✓ WizPlanning listening on ${HOST}:${PORT}`);
      console.log(`  Open locally: http://localhost:${PORT}`);
      console.log(`  API: http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('Failed to prepare database:', err);
    process.exit(1);
  });
