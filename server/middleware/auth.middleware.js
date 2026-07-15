import jwt from 'jsonwebtoken';
import { env } from '../config/env.config.js';
import { db } from '../database/db.js';
import { tenantContext } from '../utils/context.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    const user = await db.findOne('users', { id: decoded.id });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User account is inactive or not found' });
    }

    req.user = {
      id: user.id,
      orgId: user.orgId || 'default',
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      department: user.department
    };
    
    tenantContext.run({ orgId: user.orgId || 'default' }, () => {
      next();
    });
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
