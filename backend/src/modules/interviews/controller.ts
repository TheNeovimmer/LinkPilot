import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/response.js';
import type { InterviewRepository } from './repository.js';
import type { InterviewService } from './service.js';

export class InterviewController {
  constructor(private readonly service: InterviewService) {}

  list = asyncHandler(async (req, res) => {
    const query = req.query as unknown as Parameters<InterviewRepository['list']>[1];
    const result = await this.service.list(req.user!.id, query);
    ok(res, result.items, result.meta);
  });

  upcoming = asyncHandler(async (req, res) => {
    ok(res, await this.service.upcoming(req.user!.id));
  });

  get = asyncHandler(async (req, res) => {
    ok(res, await this.service.get(req.user!.id, req.params.id));
  });

  create = asyncHandler(async (req, res) => {
    created(res, await this.service.create(req.user!.id, req.body));
  });

  update = asyncHandler(async (req, res) => {
    ok(res, await this.service.update(req.user!.id, req.params.id, req.body));
  });

  remove = asyncHandler(async (req, res) => {
    await this.service.remove(req.user!.id, req.params.id);
    noContent(res);
  });
}
