import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { DashboardService } from './service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';

const service = new DashboardService();

const router = Router();
router.use(requireAuth);
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    ok(res, await service.stats(req.user!.id));
  }),
);

export const dashboardRouter = router;
