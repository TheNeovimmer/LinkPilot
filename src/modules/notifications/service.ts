import { ApiError } from '../../utils/ApiError';
import type { Prisma } from '@prisma/client';
import type { NotificationDTO, NotificationType } from './types';
import { NotificationRepository } from './repository';

export type NotificationPublisher = (userId: string, notification: NotificationDTO) => void;

export class NotificationService {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly publish: NotificationPublisher = () => {},
  ) {}

  /** Persist a notification and push it to the user's live socket connection. */
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }): Promise<NotificationDTO> {
    const notification = await this.repo.create({ ...data, data: data.data as Prisma.InputJsonValue | undefined });
    this.publish(data.userId, notification);
    return notification;
  }

  async list(userId: string, query: Parameters<NotificationRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async unreadCount(userId: string) {
    return this.repo.unreadCount(userId);
  }

  async markRead(userId: string, id: string): Promise<void> {
    const marked = await this.repo.markRead(userId, id);
    if (!marked) throw ApiError.notFound('Notification not found');
  }

  async markAllRead(userId: string): Promise<number> {
    return this.repo.markAllRead(userId);
  }

  async remove(userId: string, id: string): Promise<void> {
    const removed = await this.repo.remove(userId, id);
    if (!removed) throw ApiError.notFound('Notification not found');
  }
}

/** Default instance wired to the socket publisher once the server boots. */
export const notificationService = new NotificationService(new NotificationRepository());

/** Called by socket/index.ts after the socket server starts. */
export function wireNotificationPublisher(publisher: NotificationPublisher): void {
  (notificationService as unknown as { publish: NotificationPublisher }).publish = publisher;
}
