import { ApiError } from '../../utils/ApiError.js';
import { auditService } from '../audit/service.js';
import { notificationService } from '../notifications/service.js';
import { prisma } from '../../database/prisma.js';
import type { InterviewDTO } from './types.js';
import { InterviewRepository } from './repository.js';

export class InterviewService {
  constructor(private readonly repo: InterviewRepository) {}

  async list(userId: string, query: Parameters<InterviewRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async upcoming(userId: string) {
    return this.repo.upcoming(userId);
  }

  async get(userId: string, id: string): Promise<InterviewDTO> {
    const interview = await this.repo.findById(userId, id);
    if (!interview) throw ApiError.notFound('Interview not found');
    return interview;
  }

  /** A scheduled interview moves the linked job + application to INTERVIEWING. */
  private async syncLinkedStatus(userId: string, interview: InterviewDTO): Promise<void> {
    if (interview.status !== 'SCHEDULED') return;
    if (interview.jobId) {
      await prisma.job.updateMany({ where: { id: interview.jobId, userId }, data: { status: 'INTERVIEWING' } });
    }
    if (interview.applicationId) {
      await prisma.application.updateMany({ where: { id: interview.applicationId, userId }, data: { status: 'INTERVIEWING' } });
    }
  }

  async create(userId: string, data: Parameters<InterviewRepository['create']>[1]): Promise<InterviewDTO> {
    const interview = await this.repo.create(userId, data);
    await this.syncLinkedStatus(userId, interview);
    await notificationService.create({
      userId,
      type: 'INTERVIEW',
      title: `Interview scheduled: ${interview.title}`,
      body: interview.companyName ?? undefined,
      data: { interviewId: interview.id, scheduledAt: interview.scheduledAt.toISOString() },
    });
    await auditService.log(userId, 'interview.create', 'interview', interview.id, { title: interview.title });
    return interview;
  }

  async update(userId: string, id: string, data: Parameters<InterviewRepository['update']>[2]): Promise<InterviewDTO> {
    const current = await this.get(userId, id);
    const updated = await this.repo.update(userId, id, data);
    const result = updated!;

    // Re-arm the 24h reminder whenever the schedule changes.
    const rescheduled = data.scheduledAt && data.scheduledAt.getTime() !== current.scheduledAt.getTime();
    if (rescheduled && result.status === 'SCHEDULED') {
      await prisma.interview.update({ where: { id }, data: { remindedAt: null } });
    }
    if ((result.status !== current.status || rescheduled) && result.status === 'SCHEDULED') {
      await this.syncLinkedStatus(userId, result);
    }
    if (result.status === 'COMPLETED' && current.status !== 'COMPLETED') {
      await notificationService.create({
        userId,
        type: 'SYSTEM',
        title: `Interview completed: ${result.title}`,
        body: 'Log the outcome while it is fresh.',
        data: { interviewId: result.id },
      });
    }
    await auditService.log(userId, 'interview.update', 'interview', id);
    return result;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.repo.remove(userId, id);
    await auditService.log(userId, 'interview.delete', 'interview', id);
  }
}
