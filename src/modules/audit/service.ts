import type { Prisma } from '@prisma/client';
import type { AuditAction } from './types';
import { AuditLogRepository } from './repository';

export class AuditService {
  constructor(private readonly repo: AuditLogRepository) {}

  /** Record an audit entry. Fire-and-forget safe: never throws into the caller. */
  async log(
    userId: string | null,
    action: AuditAction | string,
    entity?: string,
    entityId?: string,
    meta?: Prisma.InputJsonValue,
    ip?: string,
  ): Promise<void> {
    try {
      await this.repo.log({ userId, action, entity, entityId, meta, ip });
    } catch {
      // Audit must never break the primary operation.
    }
  }

  async list(userId: string, query: Parameters<AuditLogRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }
}

export const auditService = new AuditService(new AuditLogRepository());
