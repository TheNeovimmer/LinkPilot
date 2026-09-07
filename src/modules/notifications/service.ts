import { ApiError } from '../../utils/ApiError';
import type { Prisma } from '@prisma/client';
import type { NotificationDTO, NotificationType } from './types';
import { NotificationRepository } from './repository';
import { normalizeScope, type ScopeInput } from '../../server/scope';

export type NotificationPublisher = (userId: string, notification: NotificationDTO) => void;

export class NotificationService {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly publish: NotificationPublisher = () => {},
  ) {}

  /** Persist a notification and push it to the user's live socket connection. */
  async create(data: {
    userId: string;
    orgId?: string | null;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }): Promise<NotificationDTO> {
    const notification = await this.repo.create({ ...data, data: data.data as Prisma.InputJsonValue | undefined });
    this.publish(data.userId, notification);
    return notification;
  }

  /** Pipeline events for the whole workspace: every member is notified (actor included).
   * Personal scope notifies the owner only, preserving single-user behavior. */
  async createForMembers(
    scopeInput: ScopeInput,
    data: {
      type: NotificationType;
      title: string;
      body?: string;
      data?: Record<string, unknown>;
    },
  ): Promise<NotificationDTO[]> {
    const scope = normalizeScope(scopeInput);
    if (!scope.orgId) return [await this.create({ userId: scope.userId, orgId: null, ...data })];
    const { prisma } = await import('../../database/prisma');
    const members = await prisma.membership.findMany({ where: { orgId: scope.orgId }, select: { userId: true } });
    const out: NotificationDTO[] = [];
    const seen = new Set<string>();
    for (const m of members) {
      if (seen.has(m.userId)) continue;
      seen.add(m.userId);
      out.push(await this.create({ userId: m.userId, orgId: scope.orgId, ...data }));
    }
    return out;
  }

  async list(scopeInput: ScopeInput, query: Parameters<NotificationRepository['list']>[1]) {
    return this.repo.list(scopeInput, query);
  }

  async unreadCount(scopeInput: ScopeInput) {
    return this.repo.unreadCount(scopeInput);
  }

  async markRead(scopeInput: ScopeInput, id: string): Promise<void> {
    const marked = await this.repo.markRead(scopeInput, id);
    if (!marked) throw ApiError.notFound('Notification not found');
  }

  async markAllRead(scopeInput: ScopeInput): Promise<number> {
    return this.repo.markAllRead(scopeInput);
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<void> {
    const removed = await this.repo.remove(scopeInput, id);
    if (!removed) throw ApiError.notFound('Notification not found');
  }
}

/** Default instance wired to the socket publisher once the server boots. */
export const notificationService = new NotificationService(new NotificationRepository());

/** Called by socket/index.ts after the socket server starts. */
export function wireNotificationPublisher(publisher: NotificationPublisher): void {
  (notificationService as unknown as { publish: NotificationPublisher }).publish = publisher;
}
