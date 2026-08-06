import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export interface Schemas {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
}

/**
 * Zod validation middleware. Parses req.params / req.query / req.body against
 * the given schemas and replaces them with the parsed (typed) values.
 */
export function validate({ params, query, body }: Schemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (params) req.params = params.parse(req.params);
      if (query) {
        const parsed = query.parse(req.query);
        // Express 5 makes req.query a getter on the raw parser; reassign safely.
        Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
      }
      if (body) req.body = body.parse(req.body);
      next();
    } catch (err) {
      const details = err instanceof Error ? (err as { issues?: unknown }).issues : err;
      next(ApiError.badRequest('Invalid request payload', details ?? err));
    }
  };
}
