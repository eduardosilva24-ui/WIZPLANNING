import { AuthService } from '../services/AuthService.js';

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = AuthService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const uid = decoded.id;
  let id = uid;
  if (typeof uid === 'string' && /^-?\d+$/.test(uid.trim())) id = parseInt(uid, 10);
  req.user = { ...decoded, id };
  next();
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({ error: err.message });
  }

  if (err.message.includes('unauthorized')) {
    return res.status(403).json({ error: err.message });
  }

  res.status(500).json({ error: err.message || 'Internal server error' });
};
