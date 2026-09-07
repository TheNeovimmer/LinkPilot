import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import { prisma } from '../../database/prisma';
import { AttachmentRepository } from './repository';
import { normalizeScope, scopeIdWhere, type ScopeInput } from '../../server/scope';
import { isAttachmentKind, type AttachmentDTO, type AttachmentKind } from './types';

export class AttachmentService {
  constructor(private readonly repo: AttachmentRepository) {}

  /**
   * Validate that the parent record exists and belongs to the user, so an
   * attachment can't be attached to someone else's application/note.
   */
  private async assertParent(scopeInput: ScopeInput, applicationId?: string | null, noteId?: string | null): Promise<void> {
    const scope = normalizeScope(scopeInput);
    if (applicationId) {
      const app = await prisma.application.findFirst({ where: scopeIdWhere(scope, applicationId), select: { id: true } });
      if (!app) throw ApiError.notFound('Application not found');
    }
    if (noteId) {
      const note = await prisma.note.findFirst({ where: scopeIdWhere(scope, noteId), select: { id: true } });
      if (!note) throw ApiError.notFound('Note not found');
    }
  }

  async create(
    scopeInput: ScopeInput,
    input: {
      applicationId?: string | null;
      noteId?: string | null;
      kind?: string;
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      content?: Buffer;
    },
  ): Promise<AttachmentDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    if (!input.applicationId && !input.noteId) throw ApiError.badRequest('An application or note must be selected');
    await this.assertParent(scopeInput, input.applicationId ?? null, input.noteId ?? null);
    const kind: AttachmentKind = isAttachmentKind(input.kind) ? input.kind : 'other';
    const attachment = await this.repo.create(scopeInput, {
      applicationId: input.applicationId ?? null,
      noteId: input.noteId ?? null,
      kind,
      filename: input.filename,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      url: input.url,
      ...(input.content ? { content: input.content } : {}),
    });
    await auditService.log(userId, 'attachment.create', 'attachment', attachment.id, { kind }, undefined, orgId || undefined);
    return attachment;
  }

  async list(scopeInput: ScopeInput, applicationId?: string | null, noteId?: string | null): Promise<AttachmentDTO[]> {
    return this.repo.listFor(scopeInput, applicationId ?? null, noteId ?? null);
  }

  /** File bytes for the /uploads serving route (null when missing or legacy without data). */
  async findFile(scopeInput: ScopeInput, filename: string) {
    const file = await this.repo.findFileByName(scopeInput, filename);
    if (!file?.data) return null;
    return { mimeType: file.mimeType, size: file.size, data: file.data };
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<void> {
    const { userId, orgId } = normalizeScope(scopeInput);
    const attachment = await this.repo.remove(scopeInput, id);
    if (!attachment) throw ApiError.notFound('Attachment not found');
    // Legacy filesystem cleanup for pre-DB rows (never throws on IO errors).
    const { removeUpload } = await import('@/lib/storage');
    removeUpload(attachment.url);
    await auditService.log(userId, 'attachment.delete', 'attachment', id, undefined, undefined, orgId || undefined);
  }
}