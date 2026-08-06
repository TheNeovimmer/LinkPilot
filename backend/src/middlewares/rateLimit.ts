import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

/** Global API limiter. */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, _next, options) => {
    throw ApiError.rateLimited(options.message);
  },
});

/** Stricter limiter for auth + AI endpoints. */
export const strictLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, _next, options) => {
    throw ApiError.rateLimited(options.message);
  },
});
