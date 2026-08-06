import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/response.js';
import { buildMeta } from '../../utils/pagination.js';
import type { ConversationService } from './service.js';
import type { ConversationRepository } from './repository.js';

export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  list = asyncHandler(async (req, res) => {
    const query = req.query as unknown as Parameters<ConversationRepository['list']>[1];
    const { items, total } = await this.service.list(req.user!.id, query);
    ok(res, items, buildMeta({ page: query.page, limit: query.limit }, total));
  });

  get = asyncHandler(async (req, res) => {
    const conversation = await this.service.get(req.user!.id, req.params.id);
    ok(res, conversation);
  });

  create = asyncHandler(async (req, res) => {
    const conversation = await this.service.create(req.user!.id, req.body);
    created(res, conversation);
  });

  update = asyncHandler(async (req, res) => {
    const conversation = await this.service.update(req.user!.id, req.params.id, req.body);
    ok(res, conversation);
  });

  remove = asyncHandler(async (req, res) => {
    await this.service.remove(req.user!.id, req.params.id);
    noContent(res);
  });
}
