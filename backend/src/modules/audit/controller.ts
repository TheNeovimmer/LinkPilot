import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import type { AuditLogRepository } from './repository.js';
import { AuditService } from './service.js';

export class AuditController {
  constructor(private readonly service: AuditService) {}

  list = asyncHandler(async (req, res) => {
    const query = req.query as unknown as Parameters<AuditLogRepository['list']>[1];
    const { items, meta } = await this.service.list(req.user!.id, query);
    ok(res, items, meta);
  });
}
