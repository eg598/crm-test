import { RequestHandler } from 'express';
import { ticketsService } from './tickets.service';
import { commentsService } from './comments.service';
import { validateRequired } from '../../utils/validate';
import { TicketStatus, TicketPriority } from '../../db/models/Ticket';

export const ticketsController = {
  list: (async (req, res, next) => {
    try {
      const { status, priority, category, clientId, assignedUserId, search, cursor, limit, overdue } =
        req.query as Record<string, string>;

      const result = await ticketsService.listTickets(req.user!, {
        status: status as TicketStatus,
        priority: priority as TicketPriority,
        category,
        clientId: clientId ? Number(clientId) : undefined,
        assignedUserId: assignedUserId ? Number(assignedUserId) : undefined,
        search,
        cursor: cursor ? Number(cursor) : undefined,
        limit: limit ? Number(limit) : 50,
        overdue: overdue === 'true',
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  getById: (async (req, res, next) => {
    try {
      const ticket = await ticketsService.getTicketById(Number(req.params.id), req.user!);
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  create: (async (req, res, next) => {
    try {
      const missing = validateRequired({
        title:          req.body.title,
        description:    req.body.description,
        category:       req.body.category,
        clientId:       req.body.clientId,
        assignedUserId: req.body.assignedUserId,
        deadline:       req.body.deadline,
      });
      if (missing) { res.status(400).json({ message: `${missing} is required` }); return; }
      const ticket = await ticketsService.createTicket(req.body, req.user!);
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  update: (async (req, res, next) => {
    try {
      const ticket = await ticketsService.updateTicket(Number(req.params.id), req.body, req.user!);
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  updateStatus: (async (req, res, next) => {
    try {
      const missing = validateRequired({ status: req.body.status });
      if (missing) { res.status(400).json({ message: `${missing} is required` }); return; }
      const ticket = await ticketsService.updateStatus(Number(req.params.id), req.body.status, req.user!);
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  assign: (async (req, res, next) => {
    try {
      const missing = validateRequired({ assignedUserId: req.body.assignedUserId });
      if (missing) { res.status(400).json({ message: `${missing} is required` }); return; }
      const ticket = await ticketsService.assignTicket(
        Number(req.params.id),
        Number(req.body.assignedUserId),
        req.user!
      );
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  remove: (async (req, res, next) => {
    try {
      await ticketsService.deleteTicket(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  listComments: (async (req, res, next) => {
    try {
      const comments = await commentsService.listComments(Number(req.params.id), req.user!);
      res.json(comments);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  addComment: (async (req, res, next) => {
    try {
      const missing = validateRequired({ body: req.body.body });
      if (missing) { res.status(400).json({ message: 'body is required' }); return; }
      const comment = await commentsService.addComment(Number(req.params.id), req.body.body, req.user!);
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
};
