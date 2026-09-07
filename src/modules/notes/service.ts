import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import type { NoteDTO } from './types';
import { NoteRepository } from './repository';
import { normalizeScope, type ScopeInput } from '../../server/scope';

export class NoteService {
  constructor(private readonly repo: NoteRepository) {}

  async list(scopeInput: ScopeInput, query: Parameters<NoteRepository['list']>[1]) {
    return this.repo.list(scopeInput, query);
  }

  async get(scopeInput: ScopeInput, id: string): Promise<NoteDTO> {
    const note = await this.repo.findById(scopeInput, id);
    if (!note) throw ApiError.notFound('Note not found');
    return note;
  }

  async create(scopeInput: ScopeInput, data: Parameters<NoteRepository['create']>[1]): Promise<NoteDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    const note = await this.repo.create(scopeInput, data);
    await auditService.log(userId, 'note.create', 'note', note.id, { title: note.title }, undefined, orgId || undefined);
    return note;
  }

  async update(scopeInput: ScopeInput, id: string, data: Parameters<NoteRepository['update']>[2]): Promise<NoteDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    const updated = await this.repo.update(scopeInput, id, data);
    await auditService.log(userId, 'note.update', 'note', id, undefined, undefined, orgId || undefined);
    return updated!;
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<void> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    await this.repo.remove(scopeInput, id);
    await auditService.log(userId, 'note.delete', 'note', id, undefined, undefined, orgId || undefined);
  }

  async tags(scopeInput: ScopeInput) {
    return this.repo.tags(scopeInput);
  }
}
