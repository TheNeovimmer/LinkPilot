import { ApiError } from '../../utils/ApiError.js';
import { auditService } from '../audit/service.js';
import { cacheDel } from '../../database/redis.js';
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
}
