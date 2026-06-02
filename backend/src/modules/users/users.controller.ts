import { RequestHandler } from 'express';
import { usersService } from './users.service';
import { validateRequired } from '../../utils/validate';

export const usersController = {
  list: (async (_req, res, next) => {
    try {
      const users = await usersService.listUsers();
      res.json(users);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  getById: (async (req, res, next) => {
    try {
      const user = await usersService.getUserById(Number(req.params.id));
      res.json(user);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  create: (async (req, res, next) => {
    try {
      const missing = validateRequired({ name: req.body.name, email: req.body.email, password: req.body.password });
      if (missing) { res.status(400).json({ message: `${missing} is required` }); return; }
      const user = await usersService.createUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  update: (async (req, res, next) => {
    try {
      const user = await usersService.updateUser(Number(req.params.id), req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  remove: (async (req, res, next) => {
    try {
      await usersService.deleteUser(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  importUsers: (async (req, res, next) => {
    try {
      const users = req.body.users;
      if (!Array.isArray(users) || users.length === 0) {
        res.status(400).json({ message: 'Request body must contain a non-empty "users" array' });
        return;
      }
      const result = await usersService.importUsers(users);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
};
