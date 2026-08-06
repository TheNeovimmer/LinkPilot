import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  createReminderSchema,
  reminderIdSchema,
  reminderQuerySchema,
  updateReminderSchema,
} from './schema.js';
import { ReminderRepository } from './repository.js';
import { ReminderService } from './service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/response.js';

const service = new ReminderService(new ReminderRepository());

const controller = {
  list: asyncHandler(async (req, res) => {
    const query = req.query as unknown as Parameters<ReminderRepository['list']>[1];
    const result = await service.list(req.user!.id, query);
    ok(res, result.items, result.meta);
  }),
  get: asyncHandler(async (req, res) => {
    ok(res, await service.get(req.user!.id, req.params.id));
  }),
  create: asyncHandler(async (req, res) => {
    created(res, await service.create(req.user!.id, req.body));
  }),
  update: asyncHandler(async (req, res) => {
    ok(res, await service.update(req.user!.id, req.params.id, req.body));
  }),
  remove: asyncHandler(async (req, res) => {
    await service.remove(req.user!.id, req.params.id);
    noContent(res);
  }),
};

const router = Router();
router.use(requireAuth);
router.get('/', validate({ query: reminderQuerySchema }), controller.list);
router.post('/', validate({ body: createReminderSchema }), controller.create);
router.get('/:id', validate({ params: reminderIdSchema }), controller.get);
router.patch('/:id', validate({ params: reminderIdSchema, body: updateReminderSchema }), controller.update);
router.delete('/:id', validate({ params: reminderIdSchema }), controller.remove);

export const reminderRouter = router;
