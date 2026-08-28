import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/database/prisma.js', () => ({
  prisma: {
    job: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    application: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    interview: { update: vi.fn().mockResolvedValue({}) },
  },
}));
vi.mock('../src/modules/audit/service.js', () => ({ auditService: { log: vi.fn().mockResolvedValue(undefined) } }));
vi.mock('../src/modules/notifications/service.js', () => ({
  notificationService: { create: vi.fn().mockResolvedValue({ id: 'n1' }) },
}));

import { prisma } from '../src/database/prisma.js';
import { notificationService } from '../src/modules/notifications/service.js';
import { ApplicationService } from '../src/modules/applications/service.js';
import { InterviewService } from '../src/modules/interviews/service.js';

const mockedPrisma = vi.mocked(prisma);

const fakeRepo = () => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  list: vi.fn(),
  pipeline: vi.fn(),
});

describe('ApplicationService status side effects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('syncs the linked job to APPLIED and auto-sets appliedAt on first SUBMITTED', async () => {
    const repo = fakeRepo();
    repo.create.mockResolvedValue({
      id: 'app1',
      jobId: 'job1',
      jobTitle: 'Engineer',
      companyName: null,
      roleTitle: null,
      status: 'SUBMITTED',
      appliedAt: null,
      notes: null,
      coverLetter: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      interviewCount: 0,
    });
    const service = new ApplicationService(repo as never);
    await service.create('user1', { status: 'SUBMITTED' });

    // appliedAt auto-set on the create payload
    expect(repo.create).toHaveBeenCalledWith('user1', expect.objectContaining({ appliedAt: expect.any(Date) }));
    expect(mockedPrisma.job.updateMany).toHaveBeenCalledWith({
      where: { id: 'job1', userId: 'user1' },
      data: { status: 'APPLIED' },
    });
  });

  it('notifies only on milestones (OFFER) and not on plain updates (DRAFT)', async () => {
    const repo = fakeRepo();
    repo.findById.mockResolvedValue({ id: 'app2', status: 'DRAFT', jobId: 'job2' });
    repo.update.mockResolvedValue({
      id: 'app2', jobId: 'job2', jobTitle: null, companyName: null, roleTitle: null,
      status: 'OFFER', appliedAt: null, notes: null, coverLetter: null,
      createdAt: new Date(), updatedAt: new Date(), interviewCount: 0,
    });
    const service = new ApplicationService(repo as never);
    await service.update('user1', 'app2', { status: 'OFFER' });

    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'APPLICATION', title: expect.stringContaining('offer') }),
    );
    expect(mockedPrisma.job.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'OFFER' } }),
    );
  });

  it('keeps DRAFT applications from touching the job status', async () => {
    const repo = fakeRepo();
    repo.create.mockResolvedValue({
      id: 'app3', jobId: 'job3', jobTitle: null, companyName: null, roleTitle: null,
      status: 'DRAFT', appliedAt: null, notes: null, coverLetter: null,
      createdAt: new Date(), updatedAt: new Date(), interviewCount: 0,
    });
    const service = new ApplicationService(repo as never);
    await service.create('user1', { status: 'DRAFT' });
    expect(mockedPrisma.job.updateMany).not.toHaveBeenCalled();
    expect(notificationService.create).not.toHaveBeenCalled();
  });
});

describe('InterviewService side effects', () => {
  beforeEach(() => vi.clearAllMocks());

  const interview = (overrides: Record<string, unknown> = {}) => ({
    id: 'iv1',
    title: 'Loop',
    scheduledAt: new Date('2026-09-01T10:00:00Z'),
    durationMin: 45,
    mode: 'VIDEO',
    status: 'SCHEDULED',
    location: null,
    feedback: null,
    prep: null,
    jobId: 'job1',
    recruiterId: null,
    applicationId: 'app1',
    createdAt: new Date(),
    updatedAt: new Date(),
    jobTitle: null,
    companyName: null,
    recruiterName: null,
    ...overrides,
  });

  it('moves linked job + application to INTERVIEWING and notifies', async () => {
    const repo = fakeRepo();
    repo.create.mockResolvedValue(interview());
    const service = new InterviewService(repo as never);
    await service.create('user1', { title: 'Loop', scheduledAt: new Date() });

    expect(mockedPrisma.job.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'INTERVIEWING' } }),
    );
    expect(mockedPrisma.application.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'INTERVIEWING' } }),
    );
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INTERVIEW', title: expect.stringContaining('scheduled') }),
    );
  });

  it('re-arms the 24h reminder when rescheduled', async () => {
    const repo = fakeRepo();
    repo.findById.mockResolvedValue(interview());
    repo.update.mockResolvedValue(interview({ scheduledAt: new Date('2026-09-02T10:00:00Z') }));
    const service = new InterviewService(repo as never);
    await service.update('user1', 'iv1', { scheduledAt: new Date('2026-09-02T10:00:00Z') });

    expect(mockedPrisma.interview.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { remindedAt: null } }),
    );
  });
});
