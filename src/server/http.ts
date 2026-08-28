import { ZodError } from 'zod';
import { auth } from '../modules/auth/auth';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/** The authenticated user attached to v1 requests. */
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/** Resolve the current session user (or null). */
export async function getUser(req: Request): Promise<AuthUser | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  };
}

/** Require a session, throwing the standard 401 otherwise. */
export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getUser(req);
  if (!user) throw ApiError.unauthorized();
  return user;
}

// --- response envelope -----------------------------------------------------

export function ok<T>(data: T, meta?: { page: number; limit: number; total: number; totalPages: number }): Response {
  return Response.json(meta ? { success: true, data, meta } : { success: true, data });
}

export function created<T>(data: T): Response {
  return Response.json({ success: true, data }, { status: 201 });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function rawJson(data: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** Map any thrown error to the standard { success:false, error } envelope. */
export function toError(err: unknown): Response {
  if (err instanceof ZodError) {
    return Response.json(
      { success: false, error: { code: 'VALIDATION', message: 'Validation failed', details: err.issues } },
      { status: 400 },
    );
  }
  if (err instanceof ApiError) {
    return Response.json(
      { success: false, error: { code: err.code, message: err.message, details: err.details } },
      { status: err.statusCode },
    );
  }
  logger.error('Unhandled error', err);
  return Response.json(
    { success: false, error: { code: 'INTERNAL', message: 'Internal server error' } },
    { status: 500 },
  );
}

/** Wrapper turning an async handler that may throw into a Response. */
export async function handle<T>(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    return toError(err);
  }
}

// --- SSE --------------------------------------------------------------------

const encoder = new TextEncoder();

/**
 * Build a `text/event-stream` Response that runs `start` with a writer.
 * The writer accepts plain objects and emits them as `data: {...}` frames.
 */
export function sseResponse(
  start: (write: (obj: unknown) => void, signal: AbortSignal) => Promise<void>,
  request?: Request,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {
          /* connection closed */
        }
      };
      const signal = request?.signal ?? new AbortController().signal;
      void start(write, signal).then(
        () => {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        },
        (err) => {
          const message = err instanceof Error ? err.message : 'AI error';
          if (err instanceof ApiError) write({ type: 'error', message });
          else write({ type: 'error', message });
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        },
      );
    },
    cancel() {
      /* client disconnected */
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
