import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import { notificationService } from '../notifications/service';
import { prisma } from '../../database/prisma';
import type { ApplicationStatus, JobStatus } from '@prisma/client';
import type { ApplicationDTO } from './types';
import { ApplicationRepository } from './repository';

/** Application → linked Job status (null = don't touch the job). */
const STATUS_TO_JOB: Partial<Record<ApplicationStatus, JobStatus>> = {
  SUBMITTED: 'APPLIED',
  UNDER_REVIEW: 'APPLIED',
  INTERVIEWING: 'INTERVIEWING',
  OFFER: 'OFFER',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'CLOSED',
};

/** Statuses that count as "the employer actually replied". */
const RESPONDED_STATUSES = new Set<ApplicationStatus>(['INTERVIEWING', 'OFFER', 'REJECTED']);

const MILESTONES: Partial<Record<ApplicationStatus, { title: string }>> = {
  INTERVIEWING: { title: 'Application is in interviews' },
  OFFER: { title: 'You received an offer' },
  REJECTED: { title: 'Application was rejected' },
};

/** Fill in a first-response timestamp when the app first reaches a replied status. */
function applyFirstResponse(
  data: Parameters<ApplicationRepository['update']>[2],
  current: ApplicationDTO,
): void {
  if (RESPONDED_STATUSES.has(data.status as ApplicationStatus) && !current.firstResponseAt) {
    data.firstResponseAt = new Date();
  }
}

export class ApplicationService {
  constructor(private readonly repo: ApplicationRepository) {}

  async list(userId: string, query: Parameters<ApplicationRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async get(userId: string, id: string): Promise<ApplicationDTO> {
    const application = await this.repo.findById(userId, id);
    if (!application) throw ApiError.notFound('Application not found');
    return application;
  }

  /** Keep the linked job's status in sync and notify on milestones. */
  private async applyStatusSideEffects(userId: string, application: ApplicationDTO): Promise<void> {
    const jobStatus = STATUS_TO_JOB[application.status];
    if (jobStatus && application.jobId) {
      await prisma.job.updateMany({ where: { id: application.jobId, userId }, data: { status: jobStatus } });
    }
    const milestone = MILESTONES[application.status];
    if (milestone) {
      await notificationService.create({
        userId,
        type: 'APPLICATION',
        title: milestone.title,
        body: application.jobTitle ?? application.roleTitle ?? application.companyName ?? undefined,
        data: { applicationId: application.id },
      });
    }
  }

  async create(userId: string, data: Parameters<ApplicationRepository['create']>[1]): Promise<ApplicationDTO> {
    // First submitted application auto-records the applied date.
    if (data.status === 'SUBMITTED' && !data.appliedAt) data.appliedAt = new Date();
    // Records a first response if created directly in a replied state.
    if (data.status && RESPONDED_STATUSES.has(data.status)) data.firstResponseAt = new Date();
    const application = await this.repo.create(userId, data);
    await this.applyStatusSideEffects(userId, application);
    await auditService.log(userId, 'application.create', 'application', application.id, { status: application.status });
    return application;
  }

  async update(userId: string, id: string, data: Parameters<ApplicationRepository['update']>[2]): Promise<ApplicationDTO> {
    const current = await this.get(userId, id);
    const merged = { ...current, ...data };
    // Auto-set appliedAt when the application first becomes submitted.
    if (merged.status === 'SUBMITTED' && !merged.appliedAt) data.appliedAt = new Date();
    // Auto-record first employer response.
    if (data.status) applyFirstResponse(data, current);
    const updated = await this.repo.update(userId, id, data);
    const result = updated!;
    if (result.status !== current.status || result.jobId !== current.jobId) {
      await this.applyStatusSideEffects(userId, result);
    }
    await auditService.log(userId, 'application.update', 'application', id, { status: result.status });
    return result;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.repo.remove(userId, id);
    await auditService.log(userId, 'application.delete', 'application', id);
  }

  /** Bulk status move — runs the same job-sync + milestone logic per application. */
  async bulkUpdate(userId: string, ids: string[], status: ApplicationStatus): Promise<number> {
    let updated = 0;
    for (const id of ids) {
      const current = await this.repo.findById(userId, id);
      if (!current || current.status === status) continue;
      const data: Parameters<ApplicationRepository['update']>[2] = { status };
      if (status === 'SUBMITTED' && !current.appliedAt) data.appliedAt = new Date();
      applyFirstResponse(data, current);
      const result = await this.repo.update(userId, id, data);
      if (result) {
        await this.applyStatusSideEffects(userId, result);
        updated++;
      }
    }
    await auditService.log(userId, 'application.bulkUpdate', 'application', undefined, { count: updated, status });
    return updated;
  }

  async pipeline(userId: string) {
    return this.repo.pipeline(userId);
  }
}
