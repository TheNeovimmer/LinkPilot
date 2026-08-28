import type { NotificationDTO } from '../modules/notifications/types';
import { wireNotificationPublisher } from '../modules/notifications/service';

/**
 * In-memory realtime registry backing the notifications SSE endpoint.
 * Replaces the Socket.IO publisher in the original Express backend.
 */
type Subscriber = (notification: NotificationDTO) => void;

const subscriptions = new Map<string, Set<Subscriber>>();

export function subscribe(userId: string, cb: Subscriber): () => void {
  let set = subscriptions.get(userId);
  if (!set) {
    set = new Set();
    subscriptions.set(userId, set);
  }
  set.add(cb);
  return () => {
    set.delete(cb);
    if (set.size === 0) subscriptions.delete(userId);
  };
}

export function publishNotification(userId: string, notification: NotificationDTO): void {
  const set = subscriptions.get(userId);
  if (!set) return;
  for (const cb of set) cb(notification);
}

// Wire the service singleton to this in-memory registry once.
wireNotificationPublisher(publishNotification);
