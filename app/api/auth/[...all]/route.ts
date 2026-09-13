import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/modules/auth/auth';

export const runtime = 'nodejs';

export const { GET, POST } = toNextJsHandler(auth);
