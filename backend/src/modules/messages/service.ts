import { ApiError } from '../../utils/ApiError.js';
import { auditService } from '../audit/service.js';
import type { MessageDTO } from './types.js';
import { MessageRepository } from './repository.js';
import { ConversationRepository } from '../conversations/repository.js';

export class MessageService {
  constructor(
    private readonly repo: MessageRepository,
    private readonly conversations: ConversationRepository,
  ) {}

  private async assertConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversations.findById(userId, conversationId);
    if (!conversation) throw ApiError.notFound('Conversation not found');
  }

  async list(userId: string, conversationId: string, query: Parameters<MessageRepository['list']>[1]) {
    await this.assertConversation(userId, conversationId);
    return this.repo.list(conversationId, query);
  }

  async create(
    userId: string,
    conversationId: string,
    role: 'ME' | 'THEM',
    content: string,
  ): Promise<MessageDTO> {
    await this.assertConversation(userId, conversationId);
    const message = await this.repo.create(conversationId, role, content);
    await this.conversations.touchLastMessage(conversationId);
    await auditService.log(userId, 'message.create', 'message', message.id, { conversationId, role });
    return message;
  }

  async update(
    userId: string,
    conversationId: string,
    id: string,
    data: { role?: 'ME' | 'THEM'; content?: string },
  ): Promise<MessageDTO> {
    await this.assertConversation(userId, conversationId);
    const updated = await this.repo.update(conversationId, id, data);
    if (!updated) throw ApiError.notFound('Message not found');
    await auditService.log(userId, 'message.update', 'message', id);
    return updated;
  }

  async remove(userId: string, conversationId: string, id: string): Promise<void> {
    await this.assertConversation(userId, conversationId);
    const removed = await this.repo.remove(conversationId, id);
    if (!removed) throw ApiError.notFound('Message not found');
    await auditService.log(userId, 'message.delete', 'message', id);
  }
}
