import { requireUser, sseResponse, toError } from '@/server/http';
import { subscribe } from '@/server/realtime';

/** Server-Sent Events stream of realtime notifications for the current user. */
export async function GET(request: Request): Promise<Response> {
  let user;
  try {
    user = await requireUser(request);
  } catch (err) {
    return toError(err);
  }

  return sseResponse((write, signal) => {
    const unsub = subscribe(user.id, (notification) => write({ type: 'notification', notification }));
    write({ type: 'ready' });
    return new Promise<void>((resolve) => {
      if (signal.aborted) {
        unsub();
        resolve();
        return;
      }
      signal.addEventListener('abort', () => {
        unsub();
        resolve();
      });
    });
  }, request);
}
