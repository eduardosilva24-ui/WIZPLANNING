import { AuthService } from '../services/AuthService.js';

const authService = new AuthService();

function getPublicBaseUrl(req) {
  const configured = String(process.env.PUBLIC_API_BASE || '').trim();
  if (configured) return configured.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function withAvatarUrl(req, user) {
  if (!user) return user;
  return {
    ...user,
    has_avatar: Boolean(user.has_avatar),
    avatar_url: user.has_avatar ? `${getPublicBaseUrl(req)}/api/users/${user.id}/avatar` : ''
  };
}

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
      res.json(withAvatarUrl(req, user));
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body || {});
      res.json(withAvatarUrl(req, user));
    } catch (err) {
      next(err);
    }
  },

  async updateAvatar(req, res, next) {
    try {
      if (!req.files || !req.files.avatar) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const user = await authService.updateAvatar(req.user.id, req.files.avatar);
      res.json(withAvatarUrl(req, user));
    } catch (err) {
      next(err);
    }
  },

  async getPublicProfile(req, res, next) {
    try {
      const user = await authService.getPublicUserById(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(withAvatarUrl(req, user));
    } catch (err) {
      next(err);
    }
  },

  async getUserAvatar(req, res, next) {
    try {
      const avatar = await authService.getUserAvatar(req.params.userId);
      if (!avatar || !avatar.avatar_data) {
        return res.status(404).json({ error: 'Profile photo not found' });
      }

      res.setHeader('Content-Type', avatar.avatar_type || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(Buffer.from(avatar.avatar_data, 'base64'));
    } catch (err) {
      next(err);
    }
  }
};
