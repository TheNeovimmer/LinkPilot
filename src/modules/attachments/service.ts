import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import { prisma } from '../../database/prisma';
import { AttachmentRepository } from './repository';
import { isAttachmentKind, type AttachmentDTO, type AttachmentKind } from './types';

export class AttachmentService {
  constructor(private readonly repo: AttachmentRepository) {}

  /**
   * Validate that the parent record exists and belongs to the user, so an
   * attachment can't be attached to someone else's application/note.
   */
  private async assertParent(userId: string, applicationId?: string | null, noteId?: string | null): Promise<void> {
    if (applicationId) {
      const app = await prisma.application.findFirst({ where: { id: applicationId, userId }, select: { id: true } });
      if (!app) throw ApiError.notFound('Application not found');
    }
    if (noteId) {
      const note = await prisma.note.findFirst({ where: { id: noteId, userId }, select: { id: true } });
      if (!note) throw ApiError.notFound('Note not found');
    }
  }

  async create(
    userId: string,
    input: {
      applicationId?: string | null;
      noteId?: string | null;
      kind?: string;
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    },
  ): Promise<AttachmentDTO> {
    if (!input.applicationId && !input.noteId) throw ApiError.badRequest('An application or note must be selected');
    await this.assertParent(userId, input.applicationId ?? null, input.noteId ?? null);
    const kind: AttachmentKind = isAttachmentKind(input.kind) ? input.kind : 'other';
    const attachment = await this.repo.create(userId, {
      applicationId: input.applicationId ?? null,
      noteId: input.noteId ?? null,
      kind,
      filename: input.filename,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      url: input.url,
    });
    await auditService.log(userId, 'attachment.create', 'attachment', attachment.id, { kind });
    return attachment;
  }

  async list(userId: string, applicationId?: string | null, noteId?: string | null): Promise<AttachmentDTO[]> {
    return this.repo.listFor(userId, applicationId ?? null, noteId ?? null);
  }

  async remove(userId: string, id: string): Promise<void> {
    const attachment = await this.repo.remove(userId, id);
    if (!attachment) throw ApiError.notFound('Attachment not found');
    // Best-effort cleanup of the underlying file (never throws on IO errors).
    const { removeUpload } = await import('@/lib/storage');
    removeUpload(attachment.url);
    await auditService.log(userId, 'attachment.delete', 'attachment', id);
  }
}