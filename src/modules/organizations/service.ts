import { prisma } from '../../database/prisma';
import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import { atLeast, can, normalizeRole, type OrgRole } from '../rbac/roles';

function slugify(name: string, userId: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'workspace';
  return `${base}-${userId.slice(-6).toLowerCase()}`;
}

export class OrganizationService {
  async listForUser(userId: string) {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: { org: true },
      orderBy: { createdAt: 'asc' },
    });
    if (memberships.length > 0) {
      return memberships.map((m) => ({ id: m.org.id, name: m.org.name, slug: m.org.slug, role: m.role as OrgRole, joinedAt: m.createdAt }));
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const name = user?.name || user?.email?.split('@')[0] || 'Personal';
    const org = await prisma.organization.create({
      data: { name: `${name} workspace`, slug: slugify(name, userId) },
    });
    await prisma.membership.create({ data: { orgId: org.id, userId, role: 'OWNER' } });
    await auditService.log(userId, 'org.auto_create', 'organization', org.id, { name: org.name });
    return [{ id: org.id, name: org.name, slug: org.slug, role: 'OWNER' as OrgRole, joinedAt: new Date() }];
  }

  async membershipOf(userId: string, orgId: string) {
    return prisma.membership.findUnique({ where: { orgId_userId: { orgId, userId } } });
  }

  async requireRole(userId: string, orgId: string, min: OrgRole) {
    const m = await this.membershipOf(userId, orgId);
    if (!m) throw ApiError.forbidden('Not a member of this workspace');
    if (!atLeast(m.role as OrgRole, min)) throw ApiError.forbidden('Insufficient role');
    return m;
  }

  async create(userId: string, input: { name: string; slug: string }) {
    try {
      const org = await prisma.organization.create({ data: { name: input.name, slug: input.slug } });
      await prisma.membership.create({ data: { orgId: org.id, userId, role: 'OWNER' } });
      await auditService.log(userId, 'org.create', 'organization', org.id, { name: input.name });
      return { id: org.id, name: org.name, slug: org.slug, role: 'OWNER' as OrgRole };
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('Unique constraint')) throw ApiError.conflict('Slug already taken');
      throw e;
    }
  }

  async get(userId: string, orgId: string) {
    const m = await this.membershipOf(userId, orgId);
    if (!m) throw ApiError.forbidden('Not a member of this workspace');
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw ApiError.notFound('Workspace not found');
    const [memberCount, pendingInvites] = await Promise.all([
      prisma.membership.count({ where: { orgId } }),
      can('invite', m.role as OrgRole) ? prisma.orgInvitation.count({ where: { orgId, status: 'PENDING' } }) : 0,
    ]);
    return { id: org.id, name: org.name, slug: org.slug, role: m.role as OrgRole, memberCount, pendingInvites };
  }

  async update(userId: string, orgId: string, input: { name?: string }) {
    await this.requireRole(userId, orgId, 'ADMIN');
    const org = await prisma.organization.update({ where: { id: orgId }, data: { name: input.name } });
    await auditService.log(userId, 'org.update', 'organization', orgId, input);
    return { id: org.id, name: org.name, slug: org.slug };
  }

  async remove(userId: string, orgId: string) {
    await this.requireRole(userId, orgId, 'OWNER');
    await prisma.organization.delete({ where: { id: orgId } });
    await auditService.log(userId, 'org.delete', 'organization', orgId);
  }

  async listMembers(userId: string, orgId: string) {
    await this.requireRole(userId, orgId, 'VIEWER');
    const rows = await prisma.membership.findMany({
      where: { orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({ userId: r.userId, name: r.user?.name ?? null, email: r.user?.email ?? '', role: r.role as OrgRole, joinedAt: r.createdAt }));
  }

  async updateMemberRole(actorId: string, orgId: string, targetUserId: string, role: OrgRole) {
    const actor = await this.requireRole(actorId, orgId, 'ADMIN');
    const target = await this.membershipOf(targetUserId, orgId);
    if (!target) throw ApiError.notFound('Member not found');
    const next = normalizeRole(role);
    if (next === 'OWNER' && (actor.role as OrgRole) !== 'OWNER') throw ApiError.forbidden('Only owners can grant OWNER');
    if ((target.role as OrgRole) === 'OWNER' && next !== 'OWNER') {
      const owners = await prisma.membership.count({ where: { orgId, role: 'OWNER', NOT: { userId: targetUserId } } });
      if (owners === 0) throw ApiError.badRequest('Cannot demote the last owner');
    }
    await prisma.membership.update({ where: { orgId_userId: { orgId, userId: targetUserId } }, data: { role: next } });
    await auditService.log(actorId, 'org.member.role', 'membership', targetUserId, { orgId, role: next });
    return { ok: true };
  }

  async removeMember(actorId: string, orgId: string, targetUserId: string) {
    if (actorId !== targetUserId) await this.requireRole(actorId, orgId, 'ADMIN');
    else {
      const self = await this.membershipOf(actorId, orgId);
      if (!self) throw ApiError.forbidden('Not a member');
    }
    const target = await this.membershipOf(targetUserId, orgId);
    if (!target) throw ApiError.notFound('Member not found');
    if ((target.role as OrgRole) === 'OWNER') {
      const owners = await prisma.membership.count({ where: { orgId, role: 'OWNER', NOT: { userId: targetUserId } } });
      if (owners === 0) throw ApiError.badRequest('Cannot remove the last owner');
    }
    await prisma.membership.delete({ where: { orgId_userId: { orgId, userId: targetUserId } } });
    await auditService.log(actorId, 'org.member.remove', 'membership', targetUserId, { orgId });
    return { ok: true };
  }

  async invite(actorId: string, orgId: string, email: string, role: OrgRole) {
    await this.requireRole(actorId, orgId, 'ADMIN');
    const next = normalizeRole(role);
    const actor = await this.membershipOf(actorId, orgId);
    if (next === 'OWNER' && (actor?.role as OrgRole) !== 'OWNER') throw ApiError.forbidden('Only owners can invite OWNERS');
    const clean = email.trim().toLowerCase();
    await prisma.orgInvitation.deleteMany({ where: { orgId, email: clean, status: 'PENDING' } });
    const invite = await prisma.orgInvitation.create({
      data: { orgId, email: clean, role: next, status: 'PENDING', invitedBy: actorId, expiresAt: new Date(Date.now() + 7 * 86400000) },
    });
    await auditService.log(actorId, 'org.invite', 'invitation', invite.id, { orgId, email: clean, role: next });
    return { id: invite.id, token: invite.token, expiresAt: invite.expiresAt };
  }

  async listInvites(userId: string, orgId: string) {
    await this.requireRole(userId, orgId, 'ADMIN');
    return prisma.orgInvitation.findMany({ where: { orgId, status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
  }

  async revokeInvite(actorId: string, orgId: string, inviteId: string) {
    await this.requireRole(actorId, orgId, 'ADMIN');
    await prisma.orgInvitation.updateMany({ where: { id: inviteId, orgId, status: 'PENDING' }, data: { status: 'REVOKED' } });
    await auditService.log(actorId, 'org.invite.revoke', 'invitation', inviteId, { orgId });
    return { ok: true };
  }

  async acceptInvite(userId: string, token: string) {
    const invite = await prisma.orgInvitation.findUnique({ where: { token } });
    if (!invite || invite.status !== 'PENDING') throw ApiError.notFound('Invite not found or expired');
    if (invite.expiresAt.getTime() < Date.now()) {
      await prisma.orgInvitation.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
      throw ApiError.badRequest('Invite expired');
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.unauthorized();
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) throw ApiError.forbidden('Invite was sent to a different email');
    await prisma.membership.upsert({
      where: { orgId_userId: { orgId: invite.orgId, userId } },
      create: { orgId: invite.orgId, userId, role: invite.role },
      update: {},
    });
    await prisma.orgInvitation.update({ where: { id: invite.id }, data: { status: 'ACCEPTED' } });
    await auditService.log(userId, 'org.invite.accept', 'organization', invite.orgId);
    return { orgId: invite.orgId };
  }

  async myInvites(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];
    return prisma.orgInvitation.findMany({
      where: { email: user.email.toLowerCase(), status: 'PENDING', expiresAt: { gt: new Date() } },
      include: { org: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const organizationService = new OrganizationService();
