import { Router } from 'express';
import { usersController } from './users.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

export const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get('/', requireRole('supervisor', 'admin'), usersController.list);
usersRouter.get('/:id', requireRole('admin'), usersController.getById);
usersRouter.post('/', requireRole('admin'), usersController.create);
usersRouter.put('/:id', requireRole('admin'), usersController.update);
usersRouter.delete('/:id', requireRole('admin'), usersController.remove);
