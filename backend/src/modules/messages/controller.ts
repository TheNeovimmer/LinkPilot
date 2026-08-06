import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/response.js';
import type { MessageRepository } from './repository.js';
import type { MessageService } from './service.js';

export class MessageController {
  constructor(private readonly service: MessageService) {}

  list = asyncHandler(async (req, res) => {
    const query = req.query as unknown as Parameters<MessageRepository['list']>[1];
    const { items, meta } = await this.service.list(req.user!.id, req.params.conversationId, query);
    ok(res, items, meta);
  });

  create = asyncHandler(async (req, res) => {
    const message = await this.service.create(
      req.user!.id,
      req.params.conversationId,
      req.body.role,
      req.body.content,
    );
    created(res, message);
  });

  update = asyncHandler(async (req, res) => {
    const message = await this.service.update(req.user!.id, req.params.conversationId, req.params.id, req.body);
    ok(res, message);
  });

  remove = asyncHandler(async (req, res) => {
    await this.service.remove(req.user!.id, req.params.conversationId, req.params.id);
    noContent(res);
  });
}
