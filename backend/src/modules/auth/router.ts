import { Router } from 'express';
import { auth } from './auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';

const router = Router();

// Convenience session check (same data as /api/auth/get-session, standard envelope).
// Mounted at /api/v1/auth/session.
router.get('/session', asyncHandler(async (req, res) => {
  const session = await auth.api.getSession({ headers: req.headers });
  ok(res, session ? { user: session.user } : null);
}));

export const authRouter = router;
