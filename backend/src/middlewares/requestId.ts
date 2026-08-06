import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

/** Assign a correlation id to every request (echoed in error responses + logs). */
export const requestId: RequestHandler = (req, res, next) => {
  const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
};
