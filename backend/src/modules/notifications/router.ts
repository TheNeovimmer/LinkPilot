import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { notificationIdSchema, notificationQuerySchema } from './schema.js';
import { notificationService } from './service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, noContent } from '../../utils/response.js';

const controller = {
  list: asyncHandler(async (req, res) => {
    const query = req.query as unknown as Parameters<typeof notificationService.list>[1];
    const result = await notificationService.list(req.user!.id, query);
    ok(res, result.items, result.meta);
  }),
  unreadCount: asyncHandler(async (req, res) => {
    ok(res, { count: await notificationService.unreadCount(req.user!.id) });
  }),
  markRead: asyncHandler(async (req, res) => {
    await notificationService.markRead(req.user!.id, req.params.id);
    noContent(res);
  }),
  markAllRead: asyncHandler(async (req, res) => {
    ok(res, { marked: await notificationService.markAllRead(req.user!.id) });
  }),
  remove: asyncHandler(async (req, res) => {
    await notificationService.remove(req.user!.id, req.params.id);
    noContent(res);
  }),
};

const router = Router();
router.use(requireAuth);
router.get('/', validate({ query: notificationQuerySchema }), controller.list);
router.get('/unread-count', controller.unreadCount);
router.post('/read-all', controller.markAllRead);
router.patch('/:id/read', validate({ params: notificationIdSchema }), controller.markRead);
router.delete('/:id', validate({ params: notificationIdSchema }), controller.remove);

export const notificationRouter = router;
