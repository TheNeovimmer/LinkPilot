import type { Prisma } from '@prisma/client';
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
  /** File bytes stored in the database. Omitted for legacy filesystem rows. */
  content?: Buffer;
}

export interface AttachmentFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer | null;
}

export class AttachmentRepository {
  async create(scopeInput: ScopeInput, data: AttachmentInput): Promise<AttachmentDTO> {
    const scope = normalizeScope(scopeInput);
    const { content, ...rest } = data;
    const row = await prisma.attachment.create({
      data: { ...scopeCreateData(scope), ...rest, ...(content ? { data: content } : {}) } as Prisma.AttachmentUncheckedCreateInput,
      omit: { data: true },
    });
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
      omit: { data: true },
    });
    return rows.map(mapAttachment);
  }

  async findById(scopeInput: ScopeInput, id: string): Promise<AttachmentDTO | null> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.attachment.findFirst({ where: scopeIdWhere(scope, id), omit: { data: true } });
    return row ? mapAttachment(row) : null;
  }

  /** Fetch file bytes for serving. Scope-gated: callers only receive their workspace files. */
  async findFileByName(scopeInput: ScopeInput, filename: string): Promise<AttachmentFile | null> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.attachment.findFirst({
      where: scopeAndWhere(scope, { filename }),
      select: { id: true, filename: true, mimeType: true, size: true, data: true },
    });
    return row as AttachmentFile | null;
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<AttachmentDTO | null> {
    const scope = normalizeScope(scopeInput);
    const existing = await this.findById(scope, id);
    if (!existing) return null;
    await prisma.attachment.deleteMany({ where: scopeIdWhere(scope, id) });
    return existing;
  }
}