import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import { notificationService } from '../notifications/service';
import { prisma } from '../../database/prisma';
import type { ApplicationStatus, JobStatus } from '@prisma/client';
import type { ApplicationDTO } from './types';
import { ApplicationRepository } from './repository';
import { normalizeScope, scopeIdWhere, type ScopeInput } from '../../server/scope';

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

  async list(scopeInput: ScopeInput, query: Parameters<ApplicationRepository['list']>[1]) {
    return this.repo.list(scopeInput, query);
  }

  async get(scopeInput: ScopeInput, id: string): Promise<ApplicationDTO> {
    const application = await this.repo.findById(scopeInput, id);
    if (!application) throw ApiError.notFound('Application not found');
    return application;
  }

  /** Keep the linked job's status in sync and notify on milestones. */
  private async applyStatusSideEffects(scopeInput: ScopeInput, application: ApplicationDTO): Promise<void> {
    const { userId } = normalizeScope(scopeInput);
    const scope = normalizeScope(scopeInput);
    const jobStatus = STATUS_TO_JOB[application.status];
    if (jobStatus && application.jobId) {
      await prisma.job.updateMany({ where: scopeIdWhere(scope, application.jobId), data: { status: jobStatus } });
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

  async create(scopeInput: ScopeInput, data: Parameters<ApplicationRepository['create']>[1]): Promise<ApplicationDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    // First submitted application auto-records the applied date.
    if (data.status === 'SUBMITTED' && !data.appliedAt) data.appliedAt = new Date();
    // Records a first response if created directly in a replied state.
    if (data.status && RESPONDED_STATUSES.has(data.status)) data.firstResponseAt = new Date();
    const application = await this.repo.create(scopeInput, data);
    await this.applyStatusSideEffects(scopeInput, application);
    await auditService.log(userId, 'application.create', 'application', application.id, { status: application.status }, undefined, orgId || undefined);
    return application;
  }

  async update(scopeInput: ScopeInput, id: string, data: Parameters<ApplicationRepository['update']>[2]): Promise<ApplicationDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    const current = await this.get(scopeInput, id);
    const merged = { ...current, ...data };
    // Auto-set appliedAt when the application first becomes submitted.
    if (merged.status === 'SUBMITTED' && !merged.appliedAt) data.appliedAt = new Date();
    // Auto-record first employer response.
    if (data.status) applyFirstResponse(data, current);
    const updated = await this.repo.update(scopeInput, id, data);
    const result = updated!;
    if (result.status !== current.status || result.jobId !== current.jobId) {
      await this.applyStatusSideEffects(scopeInput, result);
    }
    await auditService.log(userId, 'application.update', 'application', id, { status: result.status }, undefined, orgId || undefined);
    return result;
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<void> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    await this.repo.remove(scopeInput, id);
    await auditService.log(userId, 'application.delete', 'application', id, undefined, undefined, orgId || undefined);
  }

  /** Bulk status move — runs the same job-sync + milestone logic per application. */
  async bulkUpdate(scopeInput: ScopeInput, ids: string[], status: ApplicationStatus): Promise<number> {
    const { userId, orgId } = normalizeScope(scopeInput);
    let updated = 0;
    for (const id of ids) {
      const current = await this.repo.findById(scopeInput, id);
      if (!current || current.status === status) continue;
      const data: Parameters<ApplicationRepository['update']>[2] = { status };
      if (status === 'SUBMITTED' && !current.appliedAt) data.appliedAt = new Date();
      applyFirstResponse(data, current);
      const result = await this.repo.update(scopeInput, id, data);
      if (result) {
        await this.applyStatusSideEffects(scopeInput, result);
        updated++;
      }
    }
    await auditService.log(userId, 'application.bulkUpdate', 'application', undefined, { count: updated, status }, undefined, orgId || undefined);
    return updated;
  }

  async pipeline(scopeInput: ScopeInput) {
    return this.repo.pipeline(scopeInput);
  }
}
