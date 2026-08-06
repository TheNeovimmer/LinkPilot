import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/response.js';
import { aiClient } from '../ai/client.js';
import type { JobRepository } from './repository.js';
import type { JobService } from './service.js';

export class JobController {
  constructor(private readonly service: JobService) {}

  list = asyncHandler(async (req, res) => {
    const query = req.query as unknown as Parameters<JobRepository['list']>[1];
    const result = await this.service.list(req.user!.id, query);
    ok(res, result.items, result.meta);
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

  stats = asyncHandler(async (req, res) => {
    ok(res, await this.service.stats(req.user!.id));
  });

  /** POST /semantic — embedding-based search (falls back to text search). */
  semantic = asyncHandler(async (req, res) => {
    const { q, limit } = req.body as { q: string; limit: number };
    try {
      const embedding = await aiClient.embed(q);
      const items = await this.service.semanticSearch(req.user!.id, embedding, limit);
      ok(res, { items, mode: 'semantic' });
    } catch {
      // No embedding model / vector op unavailable → text search fallback.
      const result = await this.service.list(req.user!.id, { q, limit, page: 1 } as never);
      ok(res, { items: result.items, mode: 'text' });
    }
  });
}
