import type { Conversation, ConversationStatus } from '@prisma/client';

export type { ConversationStatus };

export interface ConversationDTO {
  id: string;
  contactName: string;
  contactLinkedInUrl: string | null;
  contactHeadline: string | null;
  companyId: string | null;
  recruiterId: string | null;
  status: ConversationStatus;
  pinned: boolean;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  companyName: string | null;
  recruiterName: string | null;
}

export interface ConversationListResult {
  items: ConversationDTO[];
  total: number;
}

export type ConversationRecord = Conversation;
