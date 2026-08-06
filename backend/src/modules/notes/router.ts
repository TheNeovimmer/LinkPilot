import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createNoteSchema, noteIdSchema, noteQuerySchema, updateNoteSchema } from './schema.js';
import { NoteRepository } from './repository.js';
import { NoteService } from './service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/response.js';

const service = new NoteService(new NoteRepository());

const controller = {
  list: asyncHandler(async (req, res) => {
    const query = req.query as unknown as Parameters<NoteRepository['list']>[1];
    const result = await service.list(req.user!.id, query);
    ok(res, result.items, result.meta);
  }),
  tags: asyncHandler(async (req, res) => {
    ok(res, await service.tags(req.user!.id));
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
router.get('/', validate({ query: noteQuerySchema }), controller.list);
router.get('/tags', controller.tags);
router.post('/', validate({ body: createNoteSchema }), controller.create);
router.get('/:id', validate({ params: noteIdSchema }), controller.get);
router.patch('/:id', validate({ params: noteIdSchema, body: updateNoteSchema }), controller.update);
router.delete('/:id', validate({ params: noteIdSchema }), controller.remove);

export const noteRouter = router;
