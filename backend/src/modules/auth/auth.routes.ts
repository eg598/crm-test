import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.get('/me', authMiddleware, authController.me);
