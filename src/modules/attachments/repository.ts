import { prisma } from '../../database/prisma';
import { mapAttachment, type AttachmentDTO } from './types';

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
  async create(userId: string, data: AttachmentInput): Promise<AttachmentDTO> {
    const row = await prisma.attachment.create({ data: { userId, ...data } });
    return mapAttachment(row);
  }

  async listFor(userId: string, applicationId?: string | null, noteId?: string | null): Promise<AttachmentDTO[]> {
    const rows = await prisma.attachment.findMany({
      where: {
        userId,
        ...(applicationId ? { applicationId } : {}),
        ...(noteId ? { noteId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapAttachment);
  }

  async findById(userId: string, id: string): Promise<AttachmentDTO | null> {
    const row = await prisma.attachment.findFirst({ where: { id, userId } });
    return row ? mapAttachment(row) : null;
  }

  async remove(userId: string, id: string): Promise<AttachmentDTO | null> {
    const existing = await this.findById(userId, id);
    if (!existing) return null;
    await prisma.attachment.deleteMany({ where: { id, userId } });
    return existing;
  }
}