import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import {
  applicationIdSchema,
  applicationQuerySchema,
  bulkApplicationSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from './schema.js';
import { ApplicationRepository } from './repository.js';
import { ApplicationService } from './service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/response.js';

const service = new ApplicationService(new ApplicationRepository());

const controller = {
  list: asyncHandler(async (req, res) => {
    const query = req.query as unknown as Parameters<ApplicationRepository['list']>[1];
    const result = await service.list(req.user!.id, query);
    ok(res, result.items, result.meta);
  }),
  pipeline: asyncHandler(async (req, res) => {
    ok(res, await service.pipeline(req.user!.id));
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
  bulkUpdate: asyncHandler(async (req, res) => {
    const { ids, status } = req.body as { ids: string[]; status: string };
    ok(res, { updated: await service.bulkUpdate(req.user!.id, ids, status as never) });
  }),
  remove: asyncHandler(async (req, res) => {
    await service.remove(req.user!.id, req.params.id);
    noContent(res);
  }),
};

const router = Router();
router.use(requireAuth);
router.get('/', validate({ query: applicationQuerySchema }), controller.list);
router.get('/pipeline', controller.pipeline);
router.post('/', validate({ body: createApplicationSchema }), controller.create);
router.patch('/bulk', validate({ body: bulkApplicationSchema }), controller.bulkUpdate);
router.get('/:id', validate({ params: applicationIdSchema }), controller.get);
router.patch('/:id', validate({ params: applicationIdSchema, body: updateApplicationSchema }), controller.update);
router.delete('/:id', validate({ params: applicationIdSchema }), controller.remove);

export const applicationRouter = router;
