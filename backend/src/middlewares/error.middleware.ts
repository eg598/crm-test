import { ErrorRequestHandler } from 'express';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  const status: number = (err as { status?: number }).status ?? 500;
  const message: string = err instanceof Error ? err.message : 'Internal Server Error';

  if (status === 500) {
    console.error('[Error]', err);
  }

  res.status(status).json({ message });
};
