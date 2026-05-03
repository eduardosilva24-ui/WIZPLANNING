import express from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRoutes = express.Router();

authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.get('/profile', authMiddleware, authController.getProfile);
authRoutes.put('/profile', authMiddleware, authController.updateProfile);
authRoutes.post('/profile/avatar', authMiddleware, authController.updateAvatar);

export default authRoutes;
