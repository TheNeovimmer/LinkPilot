import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import type { MessageDTO } from './types';
import { MessageRepository } from './repository';
import { ConversationRepository } from '../conversations/repository';
import { normalizeScope, type ScopeInput } from '../../server/scope';

export class MessageService {
  constructor(
    private readonly repo: MessageRepository,
    private readonly conversations: ConversationRepository,
  ) {}

  private async assertConversation(scopeInput: ScopeInput, conversationId: string): Promise<void> {
    const conversation = await this.conversations.findById(scopeInput, conversationId);
    if (!conversation) throw ApiError.notFound('Conversation not found');
  }

  async list(scopeInput: ScopeInput, conversationId: string, query: Parameters<MessageRepository['list']>[1]) {
    await this.assertConversation(scopeInput, conversationId);
    return this.repo.list(conversationId, query);
  }

  async create(
    scopeInput: ScopeInput,
    conversationId: string,
    role: 'ME' | 'THEM',
    content: string,
  ): Promise<MessageDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.assertConversation(scopeInput, conversationId);
    const message = await this.repo.create(conversationId, role, content);
    await this.conversations.touchLastMessage(conversationId);
    await auditService.log(userId, 'message.create', 'message', message.id, { conversationId, role }, undefined, orgId || undefined);
    return message;
  }

  async update(
    scopeInput: ScopeInput,
    conversationId: string,
    id: string,
    data: { role?: 'ME' | 'THEM'; content?: string },
  ): Promise<MessageDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.assertConversation(scopeInput, conversationId);
    const updated = await this.repo.update(conversationId, id, data);
    if (!updated) throw ApiError.notFound('Message not found');
    await auditService.log(userId, 'message.update', 'message', id, undefined, undefined, orgId || undefined);
    return updated;
  }

  async remove(scopeInput: ScopeInput, conversationId: string, id: string): Promise<void> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.assertConversation(scopeInput, conversationId);
    const removed = await this.repo.remove(conversationId, id);
    if (!removed) throw ApiError.notFound('Message not found');
    await auditService.log(userId, 'message.delete', 'message', id, undefined, undefined, orgId || undefined);
  }
}
