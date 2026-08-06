import type { RequestHandler } from 'express';
import { auth } from '../modules/auth/auth.js';
import { ApiError } from '../utils/ApiError.js';

/** Require a valid Better Auth session; attaches req.user. */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) throw ApiError.unauthorized();
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    };
    next();
  } catch (err) {
    next(err);
  }
};

/** Optional auth: attaches req.user when a session exists, otherwise continues. */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      };
    }
    next();
  } catch {
    next();
  }
};
