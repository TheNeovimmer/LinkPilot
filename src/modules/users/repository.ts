import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import type { ProfileDTO } from './types';
import type { ProfileContext } from '../../prompts/system';

export class ProfileRepository {
  async findById(userId: string): Promise<ProfileDTO | null> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { select: { email: true, emailVerified: true, image: true } } },
    });
    if (!profile) return null;
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      title: profile.title,
      location: profile.location,
      linkedinUrl: profile.linkedinUrl,
      tone: profile.tone,
      goals: profile.goals,
      preferences: profile.preferences,
      email: profile.user.email,
      emailVerified: profile.user.emailVerified,
      image: profile.user.image,
      updatedAt: profile.updatedAt,
    };
  }

  async upsert(
    userId: string,
    data: Partial<{
      displayName: string;
      title: string | null;
      location: string | null;
      linkedinUrl: string | null;
      tone: string;
      goals: unknown;
      preferences: unknown;
    }>,
  ): Promise<ProfileDTO | null> {
    const prismaData = {
      ...data,
      goals: data.goals as Prisma.InputJsonValue | undefined,
      preferences: data.preferences as Prisma.InputJsonValue | undefined,
    };
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...prismaData },
      update: prismaData,
    });
    return this.findById(userId);
  }

  async updateImage(userId: string, imageUrl: string): Promise<ProfileDTO | null> {
    await prisma.user.update({ where: { id: userId }, data: { image: imageUrl } });
    return this.findById(userId);
  }

  /** Minimal profile view injected as AI context. */
  async findContext(userId: string): Promise<ProfileContext | null> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return null;
    return {
      displayName: profile.displayName,
      title: profile.title,
      location: profile.location,
      tone: profile.tone,
      goals: profile.goals,
    };
  }
}
