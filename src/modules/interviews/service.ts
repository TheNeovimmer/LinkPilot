import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import { notificationService } from '../notifications/service';
import { prisma } from '../../database/prisma';
import type { InterviewDTO } from './types';
import { InterviewRepository } from './repository';
import { normalizeScope, scopeIdWhere, type ScopeInput } from '../../server/scope';

export class InterviewService {
  constructor(private readonly repo: InterviewRepository) {}

  async list(scopeInput: ScopeInput, query: Parameters<InterviewRepository['list']>[1]) {
    return this.repo.list(scopeInput, query);
  }

  async upcoming(scopeInput: ScopeInput) {
    return this.repo.upcoming(scopeInput);
  }

  async get(scopeInput: ScopeInput, id: string): Promise<InterviewDTO> {
    const interview = await this.repo.findById(scopeInput, id);
    if (!interview) throw ApiError.notFound('Interview not found');
    return interview;
  }

  /** A scheduled interview moves the linked job + application to INTERVIEWING. */
  private async syncLinkedStatus(scopeInput: ScopeInput, interview: InterviewDTO): Promise<void> {
    const scope = normalizeScope(scopeInput);
    if (interview.status !== 'SCHEDULED') return;
    if (interview.jobId) {
      await prisma.job.updateMany({ where: scopeIdWhere(scope, interview.jobId), data: { status: 'INTERVIEWING' } });
    }
    if (interview.applicationId) {
      await prisma.application.updateMany({ where: scopeIdWhere(scope, interview.applicationId), data: { status: 'INTERVIEWING' } });
    }
  }

  async create(scopeInput: ScopeInput, data: Parameters<InterviewRepository['create']>[1]): Promise<InterviewDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    const interview = await this.repo.create(scopeInput, data);
    await this.syncLinkedStatus(scopeInput, interview);
    await notificationService.create({
      userId,
      type: 'INTERVIEW',
      title: `Interview scheduled: ${interview.title}`,
      body: interview.companyName ?? undefined,
      data: { interviewId: interview.id, scheduledAt: interview.scheduledAt.toISOString() },
    });
    await auditService.log(userId, 'interview.create', 'interview', interview.id, { title: interview.title }, undefined, orgId || undefined);
    return interview;
  }

  async update(scopeInput: ScopeInput, id: string, data: Parameters<InterviewRepository['update']>[2]): Promise<InterviewDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    const current = await this.get(scopeInput, id);
    const updated = await this.repo.update(scopeInput, id, data);
    const result = updated!;

    // Re-arm the 24h reminder whenever the schedule changes.
    const rescheduled = data.scheduledAt && data.scheduledAt.getTime() !== current.scheduledAt.getTime();
    if (rescheduled && result.status === 'SCHEDULED') {
      await prisma.interview.update({ where: { id }, data: { remindedAt: null } });
    }
    if ((result.status !== current.status || rescheduled) && result.status === 'SCHEDULED') {
      await this.syncLinkedStatus(scopeInput, result);
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
    await auditService.log(userId, 'interview.update', 'interview', id, undefined, undefined, orgId || undefined);
    return result;
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<void> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    await this.repo.remove(scopeInput, id);
    await auditService.log(userId, 'interview.delete', 'interview', id, undefined, undefined, orgId || undefined);
  }
}
