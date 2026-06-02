import { Router } from 'express';
import { ticketsController } from './tickets.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';

export const ticketsRouter = Router();

ticketsRouter.use(authMiddleware);

ticketsRouter.get('/', ticketsController.list);
ticketsRouter.get('/:id', ticketsController.getById);
// Only supervisors create tickets (operators execute, not own tickets)
ticketsRouter.post('/', requireRole('supervisor'), ticketsController.create);
// Only supervisors can do full updates (priority, assignment, metadata)
ticketsRouter.put('/:id', requireRole('supervisor'), ticketsController.update);
// Both supervisor and operator can change status
ticketsRouter.patch('/:id/status', requireRole('supervisor', 'operator'), ticketsController.updateStatus);
// Only supervisor assigns operators
ticketsRouter.patch('/:id/assign', requireRole('supervisor'), ticketsController.assign);
ticketsRouter.delete('/:id', requireRole('supervisor', 'admin'), ticketsController.remove);

// Comments: both supervisor and operator can read/write
ticketsRouter.get('/:id/comments', ticketsController.listComments);
ticketsRouter.post('/:id/comments', requireRole('supervisor', 'operator'), ticketsController.addComment);
