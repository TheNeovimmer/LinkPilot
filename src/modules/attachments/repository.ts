import { prisma } from '../../database/prisma';
import { mapAttachment, type AttachmentDTO } from './types';
import { normalizeScope, scopeAndWhere, scopeCreateData, scopeIdWhere, type ScopeInput } from '../../server/scope';

export interface AttachmentInput {
  applicationId?: string | null;
  noteId?: string | null;
  kind: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export class AttachmentRepository {
  async create(scopeInput: ScopeInput, data: AttachmentInput): Promise<AttachmentDTO> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.attachment.create({ data: { ...scopeCreateData(scope), ...data } });
    return mapAttachment(row);
  }

  async listFor(scopeInput: ScopeInput, applicationId?: string | null, noteId?: string | null): Promise<AttachmentDTO[]> {
    const scope = normalizeScope(scopeInput);
    const rows = await prisma.attachment.findMany({
      where: scopeAndWhere(scope, {
        ...(applicationId ? { applicationId } : {}),
        ...(noteId ? { noteId } : {}),
      }),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapAttachment);
  }

  async findById(scopeInput: ScopeInput, id: string): Promise<AttachmentDTO | null> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.attachment.findFirst({ where: scopeIdWhere(scope, id) });
    return row ? mapAttachment(row) : null;
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<AttachmentDTO | null> {
    const scope = normalizeScope(scopeInput);
    const existing = await this.findById(scope, id);
    if (!existing) return null;
    await prisma.attachment.deleteMany({ where: scopeIdWhere(scope, id) });
    return existing;
  }
}