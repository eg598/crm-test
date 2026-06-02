import { RequestHandler } from 'express';
import { UserRole } from '../db/models/User';

export const requireRole = (...roles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
};
