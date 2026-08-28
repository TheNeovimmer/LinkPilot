import type { Attachment } from '@prisma/client';

export interface AttachmentDTO {
  id: string;
  applicationId: string | null;
  noteId: string | null;
  kind: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
}

export const ATTACHMENT_KINDS = ['resume', 'coverLetter', 'contract', 'other'] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export function isAttachmentKind(v: unknown): v is AttachmentKind {
  return typeof v === 'string' && (ATTACHMENT_KINDS as readonly string[]).includes(v);
}

export function mapAttachment(a: Attachment): AttachmentDTO {
  return {
    id: a.id,
    applicationId: a.applicationId,
    noteId: a.noteId,
    kind: a.kind,
    originalName: a.originalName,
    mimeType: a.mimeType,
    size: a.size,
    url: a.url,
    createdAt: a.createdAt,
  };
}