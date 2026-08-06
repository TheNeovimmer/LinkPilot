import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));
};

/** Central error handler — every thrown error funnels through here. */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const requestId = req.requestId ?? '-';

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION', message: 'Validation failed', details: err.issues },
      requestId,
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
      requestId,
    });
    return;
  }

  logger.error(`Unhandled error [${requestId}] ${req.method} ${req.path}`, err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL', message: 'Internal server error' },
    requestId,
  });
};
