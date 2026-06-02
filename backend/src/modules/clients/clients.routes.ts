import { Router } from 'express';
import { clientsController } from './clients.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

export const clientsRouter = Router();

clientsRouter.use(authMiddleware);

clientsRouter.get('/', clientsController.list);
clientsRouter.get('/:id', clientsController.getById);
clientsRouter.post('/', requireRole('supervisor', 'admin'), clientsController.create);
clientsRouter.put('/:id', requireRole('supervisor', 'admin'), clientsController.update);
clientsRouter.delete('/:id', requireRole('admin'), clientsController.remove);
