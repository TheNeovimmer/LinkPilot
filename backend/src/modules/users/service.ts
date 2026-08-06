import { ApiError } from '../../utils/ApiError.js';
import { auditService } from '../audit/service.js';
import { cacheDel } from '../../database/redis.js';
import { prisma } from '../../database/prisma.js';
import type { ProfileDTO } from './types.js';
import { ProfileRepository } from './repository.js';

export class UserService {
  constructor(private readonly repo: ProfileRepository) {}

  async getProfile(userId: string): Promise<ProfileDTO> {
    const profile = await this.repo.findById(userId);
    if (!profile) {
      // Auto-create on first access so the profile always exists.
      return (await this.repo.upsert(userId, {}))!;
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    data: Parameters<ProfileRepository['upsert']>[1],
  ): Promise<ProfileDTO> {
    const updated = await this.repo.upsert(userId, data);
    if (!updated) throw ApiError.notFound('Profile not found');
    await cacheDel(`dashboard:${userId}`);
    await auditService.log(userId, 'profile.update', 'profile', userId);
    return updated;
  }

  async updateAvatar(userId: string, imageUrl: string): Promise<ProfileDTO> {
    const updated = await this.repo.updateImage(userId, imageUrl);
    if (!updated) throw ApiError.notFound('Profile not found');
    return updated;
  }

  /** Permanently delete the account and every row owned by it. */
  async deleteAccount(userId: string): Promise<void> {
    await prisma.$transaction([
      // Domain rows first (no FK from domain → user, so delete manually in FK-safe order).
      prisma.message.deleteMany({ where: { conversation: { userId } } }),
      prisma.interview.deleteMany({ where: { userId } }),
      prisma.application.deleteMany({ where: { userId } }),
      prisma.job.deleteMany({ where: { userId } }),
      prisma.conversation.deleteMany({ where: { userId } }),
      prisma.recruiter.deleteMany({ where: { userId } }),
      prisma.company.deleteMany({ where: { userId } }),
      prisma.note.deleteMany({ where: { userId } }),
      prisma.reminder.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.auditLog.deleteMany({ where: { userId } }),
      prisma.profile.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    await cacheDel(`dashboard:${userId}`);
  }

  /** Full backup of every row owned by the user (self-hosted = own your data). */
  async exportData(userId: string) {
    const [
      profile,
      companies,
      recruiters,
      conversations,
      messages,
      jobs,
      applications,
      interviews,
      notes,
      reminders,
      notifications,
      auditLogs,
    ] = await Promise.all([
      this.repo.findById(userId),
      prisma.company.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.recruiter.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.conversation.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.message.findMany({ where: { conversation: { userId } }, orderBy: { createdAt: 'asc' } }),
      prisma.job.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.application.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.interview.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.note.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.reminder.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      prisma.auditLog.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    ]);
    return {
      app: 'LinkPilot',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile,
      companies,
      recruiters,
      conversations,
      messages,
      jobs,
      applications,
      interviews,
      notes,
      reminders,
      notifications,
      auditLogs,
    };
  }
}
