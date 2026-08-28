import { handle, requireUser, ok, created, noContent, rawJson, sseResponse, type AuthUser } from '@/server/http';
import { getAiClient, getAiSettingsView, writeAiSettings } from '@/modules/ai/config';
import type { AiService } from '@/modules/ai/service';
import { AiService as AiServiceImpl } from '@/modules/ai/service';

import { ApplicationService } from '@/modules/applications/service';
import { ApplicationRepository } from '@/modules/applications/repository';
import { CompanyService } from '@/modules/companies/service';
import { CompanyRepository } from '@/modules/companies/repository';
import { ConversationService } from '@/modules/conversations/service';
import { ConversationRepository } from '@/modules/conversations/repository';
import { InterviewService } from '@/modules/interviews/service';
import { InterviewRepository } from '@/modules/interviews/repository';
import { JobService } from '@/modules/jobs/service';
import { JobRepository } from '@/modules/jobs/repository';
import { MessageService } from '@/modules/messages/service';
import { MessageRepository } from '@/modules/messages/repository';
import { NoteService } from '@/modules/notes/service';
import { NoteRepository } from '@/modules/notes/repository';
import { RecruiterService } from '@/modules/recruiters/service';
import { RecruiterRepository } from '@/modules/recruiters/repository';
import { ReminderService } from '@/modules/reminders/service';
import { ReminderRepository } from '@/modules/reminders/repository';
import { UserService } from '@/modules/users/service';
import { ProfileRepository } from '@/modules/users/repository';
import { auditService } from '@/modules/audit/service';
import { notificationService } from '@/modules/notifications/service';
import { DashboardService } from '@/modules/dashboard/service';

import {
  applicationIdSchema,
  applicationQuerySchema,
  bulkApplicationSchema,
  createApplicationSchema,
  updateApplicationSchema,
} from '@/modules/applications/schema';
import {
  companyIdSchema,
  companyQuerySchema,
  createCompanySchema,
  updateCompanySchema,
} from '@/modules/companies/schema';
import {
  conversationIdSchema,
  conversationQuerySchema,
  createConversationSchema,
  updateConversationSchema,
} from '@/modules/conversations/schema';
import {
  createInterviewSchema,
  interviewIdSchema,
  interviewQuerySchema,
  updateInterviewSchema,
} from '@/modules/interviews/schema';
import {
  bulkUpdateJobSchema,
  createJobSchema,
  importJobSchema,
  jobIdSchema,
  jobQuerySchema,
  semanticSearchSchema,
  updateJobSchema,
} from '@/modules/jobs/schema';
import {
  createMessageSchema,
  messageIdParamsSchema,
  messageListQuerySchema,
  replaceMessageSchema,
} from '@/modules/messages/schema';
import { createNoteSchema, noteIdSchema, noteQuerySchema, updateNoteSchema } from '@/modules/notes/schema';
import { notificationIdSchema, notificationQuerySchema } from '@/modules/notifications/schema';
import {
  createRecruiterSchema,
  recruiterIdSchema,
  recruiterQuerySchema,
  updateRecruiterSchema,
} from '@/modules/recruiters/schema';
import {
  createReminderSchema,
  reminderIdSchema,
  reminderQuerySchema,
  updateReminderSchema,
} from '@/modules/reminders/schema';
import { updateProfileSchema } from '@/modules/users/schema';
import { auditQuerySchema } from '@/modules/audit/schema';
import {
  analyzeJobSchema,
  draftReplySchema,
  interviewPrepSchema,
  rewriteSchema,
  summarizeSchema,
  updateAiSettingsSchema,
} from '@/modules/ai/schema';

// ---- service singletons (mirrors the original Express routers) -------------
const applicationService = new ApplicationService(new ApplicationRepository());
const companyService = new CompanyService(new CompanyRepository());
const conversationService = new ConversationService(new ConversationRepository());
const interviewService = new InterviewService(new InterviewRepository());
const jobService = new JobService(new JobRepository());
const messageService = new MessageService(new MessageRepository(), new ConversationRepository());
const noteService = new NoteService(new NoteRepository());
const recruiterService = new RecruiterService(new RecruiterRepository());
const reminderService = new ReminderService(new ReminderRepository());
const userService = new UserService(new ProfileRepository());
const dashboardService = new DashboardService();

const convRepo = new ConversationRepository();
const msgRepo = new MessageRepository();
const jobRepo = new JobRepository();
const interviewRepo = new InterviewRepository();
const profileRepo = new ProfileRepository();

const aiService: AiService = new AiServiceImpl({
  getConversation: (userId, id) => convRepo.findById(userId, id),
  getLastMessages: async (userId, conversationId, n) => {
    const conversation = await convRepo.findById(userId, conversationId);
    if (!conversation) return [];
    return msgRepo.lastN(conversationId, n);
  },
  getJob: (userId, id) => jobRepo.findAiView(userId, id),
  updateJobAnalysis: (userId, id, fitScore, analysis) => jobRepo.updateAnalysis(userId, id, fitScore, analysis),
  getInterview: (userId, id) => interviewRepo.findAiView(userId, id),
  updateInterviewPrep: (userId, id, prep) => interviewRepo.updatePrep(userId, id, prep),
  getProfile: (userId) => profileRepo.findContext(userId),
});

// ---- helpers ----------------------------------------------------------------

async function parseBody(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function queryOf<T>(req: Request, schema: { parse: (v: unknown) => T }): T {
  const url = new URL(req.url);
  const q = Object.fromEntries(url.searchParams.entries());
  return schema.parse(q);
}

// ---
// Zod parses JSON bodies into string dates / loose enums, while the services
// accept Prisma-typed input (Date objects). Casting is safe because Prisma
// accepts ISO date strings at runtime (mirrors the original Express `req.body`).
// ---
function asServiceInput<T>(value: unknown): T {
  return value as T;
}


// ---- module handlers --------------------------------------------------------

async function handleAuth(req: Request, user: AuthUser): Promise<Response> {
  void user;
  const { auth } = await import('@/modules/auth/auth');
  const session = await auth.api.getSession({ headers: req.headers });
  return ok(session ? { user: session.user } : null);
}

async function handleUsers(req: Request, method: string, path: string[], user: AuthUser): Promise<Response> {
  const sub = path[1] ?? '';
  if (method === 'GET' && sub === 'me') return ok(await userService.getProfile(user.id));
  if (method === 'PATCH' && sub === 'me') {
    const body = updateProfileSchema.parse(await parseBody(req));
    return ok(await userService.updateProfile(user.id, body));
  }
  if (method === 'POST' && sub === 'me' && path[2] === 'avatar') {
    return handleAvatar(req, user);
  }
  if (method === 'DELETE' && sub === 'me') {
    await userService.deleteAccount(user.id);
    return noContent();
  }
  if (method === 'GET' && sub === 'export') {
    const data = await userService.exportData(user.id);
    return rawJson(data, 200, { 'Content-Disposition': `attachment; filename="linkpilot-export-${new Date().toISOString().slice(0, 10)}.json"` });
  }
  throw new Error(`Not found: ${method} /users/${path.slice(1).join('/')}`);
}

async function handleAvatar(req: Request, user: AuthUser): Promise<Response> {
  const { default: fs } = await import('node:fs');
  const { default: path } = await import('node:path');
  const { default: crypto } = await import('node:crypto');
  const { default: multer } = await import('multer');
  const { env } = await import('@/config/env');
  const { ApiError } = await import('@/utils/ApiError');

  const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw ApiError.badRequest('No file uploaded');
  if (!ALLOWED.has(file.type)) throw ApiError.badRequest('Only PNG, JPEG, WebP or GIF images are allowed');
  if (file.size > 5 * 1024 * 1024) throw ApiError.badRequest('Image exceeds 5MB');
  const buf = Buffer.from(await file.arrayBuffer());
  if (!sniffImage(buf, file.type)) throw ApiError.badRequest('File is not a valid image');

  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name).toLowerCase() || '.png';
  const filename = `${crypto.randomUUID()}${ext}`;
  fs.writeFileSync(path.join(env.UPLOAD_DIR, filename), buf);

  const url = `/uploads/${filename}`;
  const profile = await userService.updateAvatar(user.id, url);
  if (profile.image && profile.image !== url) {
    const old = path.resolve(env.UPLOAD_DIR, path.basename(profile.image));
    const uploadsRoot = path.resolve(env.UPLOAD_DIR);
    if (old.startsWith(uploadsRoot)) fs.unlink(old, () => {});
  }
  // static serving handled by route/rewrite — placeholder for uploads URL
  void multer;
  return ok(profile);
}

function sniffImage(buf: Buffer, mimetype: string): boolean {
  if (mimetype === 'image/png') return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimetype === 'image/jpeg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mimetype === 'image/gif') return buf.length > 6 && (buf.subarray(0, 6).toString('ascii') === 'GIF87a' || buf.subarray(0, 6).toString('ascii') === 'GIF89a');
  if (mimetype === 'image/webp') return buf.length > 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

// Companies
async function handleCompanies(req: Request, method: string, path: string[], user: AuthUser): Promise<Response> {
  const id = path[1];
  if (method === 'GET' && !id && id !== 'all') {
    const r = await companyService.list(user.id, queryOf(req, companyQuerySchema));
    return ok(r.items, (r as unknown as { meta: unknown }).meta as never);
  }
  if (method === 'GET' && id === 'all') return ok(await companyService.all(user.id));
  if (method === 'POST' && !id) return created(await asServiceInput<Parameters<typeof companyService.create>[1]>(createCompanySchema.parse(await parseBody(req))));
  if (id && id !== 'all') {
    companyIdSchema.parse({ id });
    if (method === 'GET') return ok(await companyService.get(user.id, id));
    if (method === 'PATCH') return ok(await asServiceInput<Parameters<typeof companyService.update>[2]>(updateCompanySchema.parse(await parseBody(req))));
    if (method === 'DELETE') {
      await companyService.remove(user.id, id);
      return noContent();
    }
  }
  throw new Error(`Not found: ${method} /companies`);
}

// Generic CRUD helper
function isId(x: string | undefined): boolean {
  return !!x && x !== 'all' && x !== 'pipeline' && x !== 'stats' && x !== 'import' && x !== 'bulk' && x !== 'semantic' && x !== 'tags' && x !== 'upcoming' && x !== 'unread-count' && x !== 'read-all' && x !== 'export' && x !== 'me' && x !== 'read' && x !== 'messages';
}

// ---- the main route handler ------------------------------------------------

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(async () => {
    const { path } = await ctx.params;
    const user = await requireUser(req);
    return dispatch(req, path, user);
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(async () => {
    const { path } = await ctx.params;
    const user = await requireUser(req);
    return dispatch(req, path, user);
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(async () => {
    const { path } = await ctx.params;
    const user = await requireUser(req);
    return dispatch(req, path, user);
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(async () => {
    const { path } = await ctx.params;
    const user = await requireUser(req);
    return dispatch(req, path, user);
  });
}

const method = (req: Request) => req.method;

async function dispatch(req: Request, path: string[], user: AuthUser): Promise<Response> {
  const m = method(req);
  const [resource, ...rest] = path;

  switch (resource) {
    case 'auth':
      return handleAuth(req, user);
    case 'users':
      return handleUsers(req, m, path, user);
    case 'companies':
      return handleCompanies(req, m, path, user);
    case 'conversations': {
      const cid = rest[0];
      if (cid && rest[1] === 'messages') return handleMessages(req, m, rest.slice(2), user, cid);
      if (m === 'GET' && !cid) {
        const r = await conversationService.list(user.id, queryOf(req, conversationQuerySchema));
        return ok(r.items, (r as unknown as { meta: unknown }).meta as never);
      }
      if (m === 'POST' && !cid) return created(await asServiceInput<Parameters<typeof conversationService.create>[1]>(createConversationSchema.parse(await parseBody(req))));
      if (cid) {
        conversationIdSchema.parse({ id: cid });
        if (m === 'GET') return ok(await conversationService.get(user.id, cid));
        if (m === 'PATCH') return ok(await conversationService.update(user.id, cid, updateConversationSchema.parse(await parseBody(req))));
        if (m === 'DELETE') {
          await conversationService.remove(user.id, cid);
          return noContent();
        }
      }
      throw new Error('Not found: conversations');
    }
    case 'recruiters': {
      const id = rest[0];
      if (m === 'GET' && id === 'pipeline') return ok(await recruiterService.pipeline(user.id));
      if (m === 'GET' && !id) {
        const r = await recruiterService.list(user.id, queryOf(req, recruiterQuerySchema));
        return ok(r.items, (r as unknown as { meta: unknown }).meta as never);
      }
      if (m === 'POST' && !id) return created(await asServiceInput<Parameters<typeof recruiterService.create>[1]>(createRecruiterSchema.parse(await parseBody(req))));
      if (isId(id)) {
        recruiterIdSchema.parse({ id });
        if (m === 'GET') return ok(await recruiterService.get(user.id, id));
        if (m === 'PATCH') return ok(await asServiceInput<Parameters<typeof recruiterService.update>[2]>(updateRecruiterSchema.parse(await parseBody(req))));
        if (m === 'DELETE') {
          await recruiterService.remove(user.id, id);
          return noContent();
        }
      }
      throw new Error('Not found: recruiters');
    }
    case 'jobs': {
      const id = rest[0];
      if (m === 'GET' && id === 'stats') return ok(await jobService.stats(user.id));
      if (m === 'POST' && id === 'import') return created(await jobService.importFromText(user.id, importJobSchema.parse(await parseBody(req)).text));
      if (m === 'PATCH' && id === 'bulk') {
        const body = bulkUpdateJobSchema.parse(await parseBody(req));
        return ok({ updated: await jobService.bulkUpdate(user.id, body.ids, body.status) });
      }
      if (m === 'POST' && id === 'semantic') {
        const body = semanticSearchSchema.parse(await parseBody(req));
        const client = await getAiClient(user.id);
        try {
          const embedding = await client.embed(body.q);
          return ok({ items: await jobService.semanticSearch(user.id, embedding, body.limit ?? 10), mode: 'semantic' });
        } catch {
          // No embedding model / vector op unavailable → text search fallback.
          const result = await jobService.list(user.id, { q: body.q, limit: body.limit ?? 10, page: 1 } as never);
          return ok({ items: result.items, mode: 'text' });
        }
      }
      if (m === 'GET' && !id) {
        const r = await jobService.list(user.id, queryOf(req, jobQuerySchema));
        return ok(r.items, (r as unknown as { meta: unknown }).meta as never);
      }
      if (m === 'POST' && !id) return created(await asServiceInput<Parameters<typeof jobService.create>[1]>(createJobSchema.parse(await parseBody(req))));
      if (id) {
        jobIdSchema.parse({ id });
        if (m === 'GET') return ok(await jobService.get(user.id, id));
        if (m === 'PATCH') return ok(await asServiceInput<Parameters<typeof jobService.update>[2]>(updateJobSchema.parse(await parseBody(req))));
        if (m === 'DELETE') {
          await jobService.remove(user.id, id);
          return noContent();
        }
      }
      throw new Error('Not found: jobs');
    }
    case 'applications': {
      const id = rest[0];
      if (m === 'GET' && id === 'pipeline') return ok(await applicationService.pipeline(user.id));
      if (m === 'PATCH' && id === 'bulk') {
        const body = bulkApplicationSchema.parse(await parseBody(req));
        return ok({ updated: await applicationService.bulkUpdate(user.id, body.ids, body.status) });
      }
      if (m === 'GET' && !id) {
        const r = await applicationService.list(user.id, queryOf(req, applicationQuerySchema));
        return ok(r.items, (r as unknown as { meta: unknown }).meta as never);
      }
      if (m === 'POST' && !id) return created(await asServiceInput<Parameters<typeof applicationService.create>[1]>(createApplicationSchema.parse(await parseBody(req))));
      if (id) {
        applicationIdSchema.parse({ id });
        if (m === 'GET') return ok(await applicationService.get(user.id, id));
        if (m === 'PATCH') return ok(await asServiceInput<Parameters<typeof applicationService.update>[2]>(updateApplicationSchema.parse(await parseBody(req))));
        if (m === 'DELETE') {
          await applicationService.remove(user.id, id);
          return noContent();
        }
      }
      throw new Error('Not found: applications');
    }
    case 'interviews': {
      const id = rest[0];
      if (m === 'GET' && id === 'upcoming') return ok(await interviewService.upcoming(user.id));
      if (m === 'GET' && !id) {
        const r = await interviewService.list(user.id, queryOf(req, interviewQuerySchema));
        return ok(r.items, (r as unknown as { meta: unknown }).meta as never);
      }
      if (m === 'POST' && !id) return created(await asServiceInput<Parameters<typeof interviewService.create>[1]>(createInterviewSchema.parse(await parseBody(req))));
      if (id) {
        interviewIdSchema.parse({ id });
        if (m === 'GET') return ok(await interviewService.get(user.id, id));
        if (m === 'PATCH') return ok(await asServiceInput<Parameters<typeof interviewService.update>[2]>(updateInterviewSchema.parse(await parseBody(req))));
        if (m === 'DELETE') {
          await interviewService.remove(user.id, id);
          return noContent();
        }
      }
      throw new Error('Not found: interviews');
    }
    case 'notes': {
      const id = rest[0];
      if (m === 'GET' && id === 'tags') return ok(await noteService.tags(user.id));
      if (m === 'GET' && !id) {
        const r = await noteService.list(user.id, queryOf(req, noteQuerySchema));
        return ok(r.items, (r as unknown as { meta: unknown }).meta as never);
      }
      if (m === 'POST' && !id) return created(await asServiceInput<Parameters<typeof noteService.create>[1]>(createNoteSchema.parse(await parseBody(req))));
      if (id) {
        noteIdSchema.parse({ id });
        if (m === 'GET') return ok(await noteService.get(user.id, id));
        if (m === 'PATCH') return ok(await asServiceInput<Parameters<typeof noteService.update>[2]>(updateNoteSchema.parse(await parseBody(req))));
        if (m === 'DELETE') {
          await noteService.remove(user.id, id);
          return noContent();
        }
      }
      throw new Error('Not found: notes');
    }
    case 'reminders': {
      const id = rest[0];
      if (m === 'GET' && !id) {
        const r = await reminderService.list(user.id, queryOf(req, reminderQuerySchema));
        return ok(r.items, (r as unknown as { meta: unknown }).meta as never);
      }
      if (m === 'POST' && !id) return created(await asServiceInput<Parameters<typeof reminderService.create>[1]>(createReminderSchema.parse(await parseBody(req))));
      if (id) {
        reminderIdSchema.parse({ id });
        if (m === 'GET') return ok(await reminderService.get(user.id, id));
        if (m === 'PATCH') return ok(await asServiceInput<Parameters<typeof reminderService.update>[2]>(updateReminderSchema.parse(await parseBody(req))));
        if (m === 'DELETE') {
          await reminderService.remove(user.id, id);
          return noContent();
        }
      }
      throw new Error('Not found: reminders');
    }
    case 'notifications': {
      const id = rest[0];
      if (m === 'GET' && id === 'unread-count') return ok({ count: await notificationService.unreadCount(user.id) });
      if (m === 'POST' && id === 'read-all') return ok({ marked: await notificationService.markAllRead(user.id) });
      if (m === 'GET' && !id) {
        const r = await notificationService.list(user.id, queryOf(req, notificationQuerySchema));
        return ok(r.items, (r as unknown as { meta: unknown }).meta as never);
      }
      if (id && rest[1] === 'read' && m === 'PATCH') {
        notificationIdSchema.parse({ id });
        await notificationService.markRead(user.id, id);
        return noContent();
      }
      if (id) {
        notificationIdSchema.parse({ id });
        if (m === 'DELETE') {
          await notificationService.remove(user.id, id);
          return noContent();
        }
      }
      throw new Error('Not found: notifications');
    }
    case 'dashboard':
      if (m === 'GET' && rest[0] === 'stats') return ok(await dashboardService.stats(user.id));
      throw new Error('Not found: dashboard');
    case 'audit-logs': {
      const r = await auditService.list(user.id, queryOf(req, auditQuerySchema));
      return ok((r as unknown as { items: unknown }).items, (r as unknown as { meta: unknown }).meta as never);
    }
    case 'ai':
      return handleAi(req, m, rest[0], user);
    default:
      throw new Error(`Not found: ${resource}`);
  }
}

// ---- messages (nested under conversations) ---------------------------------

async function handleMessages(req: Request, m: string, rest: string[], user: AuthUser, conversationId: string): Promise<Response> {
  const id = rest[0];
  if (m === 'GET' && !id) {
    const r = await messageService.list(user.id, conversationId, queryOf(req, messageListQuerySchema));
    return ok(r.items, (r as unknown as { meta: unknown }).meta as never);
  }
  if (m === 'POST' && !id) {
    const body = createMessageSchema.parse(await parseBody(req));
    return created(await messageService.create(user.id, conversationId, body.role, body.content));
  }
  if (id) {
    messageIdParamsSchema.parse({ id, conversationId });
    if (m === 'PATCH') {
      const body = replaceMessageSchema.parse(await parseBody(req));
      return ok(await messageService.update(user.id, conversationId, id, body));
    }
    if (m === 'DELETE') {
      await messageService.remove(user.id, conversationId, id);
      return noContent();
    }
  }
  throw new Error('Not found: messages');
}

// ---- AI endpoints (draft-reply / rewrite stream via SSE) -------------------

async function handleAi(req: Request, m: string, action: string | undefined, user: AuthUser): Promise<Response> {
  // Per-user AI provider settings.
  if (action === 'settings') {
    if (m === 'GET') return ok(await getAiSettingsView(user.id));
    if (m === 'PUT') {
      const patch = updateAiSettingsSchema.parse(await parseBody(req));
      await writeAiSettings(user.id, patch);
      return ok(await getAiSettingsView(user.id));
    }
    throw new Error('Not found: ai/settings');
  }

  if (m !== 'POST' || !action) throw new Error('Not found: ai');
  const body = await parseBody(req);
  const client = await getAiClient(user.id);

  if (action === 'draft-reply') {
    draftReplySchema.parse(body);
    if (!client.isConfigured()) {
      return Response.json({ success: false, error: { code: 'AI_NOT_CONFIGURED', message: 'AI is not configured. Add an API key on the Settings page or set AI_API_KEY in the environment.' } }, { status: 503 });
    }
    return sseResponse(async (write, signal) => {
      const result = await aiService.draftReply(user.id, { conversationId: body.conversationId as string, extraContext: body.extraContext as string | undefined, tone: body.tone as string | undefined, signal }, (d) => write({ type: 'delta', text: d }));
      write({ type: 'done', ...result });
    }, req);
  }

  if (action === 'rewrite') {
    rewriteSchema.parse(body);
    if (!client.isConfigured()) {
      return Response.json({ success: false, error: { code: 'AI_NOT_CONFIGURED', message: 'AI is not configured. Add an API key on the Settings page or set AI_API_KEY in the environment.' } }, { status: 503 });
    }
    return sseResponse(async (write, signal) => {
      const result = await aiService.rewrite(user.id, { text: body.text as string, tone: body.tone as string | undefined, instruction: body.instruction as string | undefined, signal }, (d) => write({ type: 'delta', text: d }));
      write({ type: 'done', ...result });
    }, req);
  }

  if (action === 'analyze-job') {
    analyzeJobSchema.parse(body);
    return ok(await aiService.analyzeJob(user.id, body.jobId as string));
  }
  if (action === 'interview-prep') {
    interviewPrepSchema.parse(body);
    return ok(await aiService.prepareInterview(user.id, body.interviewId as string));
  }
  if (action === 'summarize') {
    summarizeSchema.parse(body);
    return ok(await aiService.summarizeConversation(user.id, body.conversationId as string));
  }
  throw new Error('Not found: ai');
}
