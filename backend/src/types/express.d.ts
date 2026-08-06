import type { AuthUser } from './index.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by the auth middleware when a session is valid. */
      user?: AuthUser;
      /** Correlation id assigned by the request-id middleware. */
      requestId?: string;
      /** Abort signal for streaming AI requests (client disconnect). */
      signal?: AbortSignal;
    }
  }
}

export {};
