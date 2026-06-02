import { RequestHandler } from 'express';
import { authService } from './auth.service';
import { validateRequired } from '../../utils/validate';

export const authController = {
  login: (async (req, res, next) => {
    try {
      const missing = validateRequired({ email: req.body.email, password: req.body.password });
      if (missing) {
        res.status(400).json({ message: `${missing} is required` });
        return;
      }
      const result = await authService.login(req.body.email, req.body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,

  me: (async (req, res, next) => {
    try {
      const user = await authService.getMe(req.user!.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }) as RequestHandler,
};
