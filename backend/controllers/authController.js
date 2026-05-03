import { AuthService } from '../services/AuthService.js';

const authService = new AuthService();

export const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      const user = await authService.register(name, email, password, role || 'teacher');
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  },

  async getProfile(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
};
