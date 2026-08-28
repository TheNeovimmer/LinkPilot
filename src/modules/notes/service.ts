import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import type { NoteDTO } from './types';
import { NoteRepository } from './repository';

export class NoteService {
  constructor(private readonly repo: NoteRepository) {}

  async list(userId: string, query: Parameters<NoteRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async get(userId: string, id: string): Promise<NoteDTO> {
    const note = await this.repo.findById(userId, id);
    if (!note) throw ApiError.notFound('Note not found');
    return note;
  }

  async create(userId: string, data: Parameters<NoteRepository['create']>[1]): Promise<NoteDTO> {
    const note = await this.repo.create(userId, data);
    await auditService.log(userId, 'note.create', 'note', note.id, { title: note.title });
    return note;
  }

  async update(userId: string, id: string, data: Parameters<NoteRepository['update']>[2]): Promise<NoteDTO> {
    await this.get(userId, id);
    const updated = await this.repo.update(userId, id, data);
    await auditService.log(userId, 'note.update', 'note', id);
    return updated!;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.repo.remove(userId, id);
    await auditService.log(userId, 'note.delete', 'note', id);
  }

  async tags(userId: string) {
    return this.repo.tags(userId);
  }
}
