import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import type { ConversationDTO } from './types';
import { ConversationRepository } from './repository';
import { normalizeScope, type ScopeInput } from '../../server/scope';

export class ConversationService {
  constructor(private readonly repo: ConversationRepository) {}

  async list(scopeInput: ScopeInput, query: Parameters<ConversationRepository['list']>[1]) {
    return this.repo.list(scopeInput, query);
  }

  async get(scopeInput: ScopeInput, id: string): Promise<ConversationDTO> {
    const conversation = await this.repo.findById(scopeInput, id);
    if (!conversation) throw ApiError.notFound('Conversation not found');
    return conversation;
  }

  async create(
    scopeInput: ScopeInput,
    data: Parameters<ConversationRepository['create']>[1],
  ): Promise<ConversationDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    const conversation = await this.repo.create(scopeInput, data);
    await auditService.log(userId, 'conversation.create', 'conversation', conversation.id, { name: conversation.contactName }, undefined, orgId || undefined);
    return conversation;
  }

  async update(
    scopeInput: ScopeInput,
    id: string,
    data: Parameters<ConversationRepository['update']>[2],
  ): Promise<ConversationDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id); // 404 if missing
    const updated = await this.repo.update(scopeInput, id, data);
    await auditService.log(userId, 'conversation.update', 'conversation', id, undefined, undefined, orgId || undefined);
    return updated!;
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<void> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    await this.repo.remove(scopeInput, id);
    await auditService.log(userId, 'conversation.delete', 'conversation', id, undefined, undefined, orgId || undefined);
  }
}
