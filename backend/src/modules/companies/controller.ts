import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created, noContent } from '../../utils/response.js';
import type { CompanyRepository } from './repository.js';
import type { CompanyService } from './service.js';

export class CompanyController {
  constructor(private readonly service: CompanyService) {}

  list = asyncHandler(async (req, res) => {
    const query = req.query as unknown as Parameters<CompanyRepository['list']>[1];
    const result = await this.service.list(req.user!.id, query);
    ok(res, result.items, result.meta);
  });

  all = asyncHandler(async (req, res) => {
    ok(res, await this.service.all(req.user!.id));
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
