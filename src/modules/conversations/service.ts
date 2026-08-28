import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import type { ConversationDTO } from './types';
import { ConversationRepository } from './repository';

export class ConversationService {
  constructor(private readonly repo: ConversationRepository) {}

  async list(userId: string, query: Parameters<ConversationRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async get(userId: string, id: string): Promise<ConversationDTO> {
    const conversation = await this.repo.findById(userId, id);
    if (!conversation) throw ApiError.notFound('Conversation not found');
    return conversation;
  }

  async create(
    userId: string,
    data: Parameters<ConversationRepository['create']>[1],
  ): Promise<ConversationDTO> {
    const conversation = await this.repo.create(userId, data);
    await auditService.log(userId, 'conversation.create', 'conversation', conversation.id, { name: conversation.contactName });
    return conversation;
  }

  async update(
    userId: string,
    id: string,
    data: Parameters<ConversationRepository['update']>[2],
  ): Promise<ConversationDTO> {
    await this.get(userId, id); // 404 if missing
    const updated = await this.repo.update(userId, id, data);
    await auditService.log(userId, 'conversation.update', 'conversation', id);
    return updated!;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.repo.remove(userId, id);
    await auditService.log(userId, 'conversation.delete', 'conversation', id);
  }
}
