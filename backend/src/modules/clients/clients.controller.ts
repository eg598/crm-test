import { RequestHandler } from 'express';
import { clientsService } from './clients.service';
import { validateRequired, isValidEmail, isValidPhone } from '../../utils/validate';

const REQUIRED_CLIENT_FIELDS = (body: Record<string, unknown>) =>
  validateRequired({
    name:          body.name,
    contactPerson: body.contactPerson,
    email:         body.email,
    phone:         body.phone,
    address:       body.address,
    comment:       body.comment,
  });

export const clientsController = {
  list: (async (req, res, next) => {
    try {
      const { search, page, limit } = req.query as Record<string, string>;
      const result = await clientsService.listClients({
        search,
        page: page ? Number(page) : 1,
        limit: limit ? Math.min(Number(limit), 100) : 20,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  getById: (async (req, res, next) => {
    try {
      const client = await clientsService.getClientById(Number(req.params.id));
      res.json(client);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  create: (async (req, res, next) => {
    try {
      const missing = REQUIRED_CLIENT_FIELDS(req.body);
      if (missing) { res.status(400).json({ message: `${missing} is required` }); return; }
      if (!isValidEmail(String(req.body.email))) {
        res.status(400).json({ message: 'Invalid email format' }); return;
      }
      if (!isValidPhone(String(req.body.phone))) {
        res.status(400).json({ message: 'Invalid phone format' }); return;
      }
      const client = await clientsService.createClient(req.body);
      res.status(201).json(client);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  update: (async (req, res, next) => {
    try {
      const missing = REQUIRED_CLIENT_FIELDS(req.body);
      if (missing) { res.status(400).json({ message: `${missing} is required` }); return; }
      if (!isValidEmail(String(req.body.email))) {
        res.status(400).json({ message: 'Invalid email format' }); return;
      }
      if (!isValidPhone(String(req.body.phone))) {
        res.status(400).json({ message: 'Invalid phone format' }); return;
      }
      const client = await clientsService.updateClient(Number(req.params.id), req.body);
      res.json(client);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  remove: (async (req, res, next) => {
    try {
      await clientsService.deleteClient(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
};
