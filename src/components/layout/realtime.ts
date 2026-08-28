'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { AppNotification } from '@/types';
import { toast } from 'sonner';

/** Listen for realtime notifications over SSE and keep the badge fresh. */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const es = new EventSource('/api/v1/notifications/stream');

    const onMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { type: string; notification?: AppNotification };
        if (payload.type === 'notification' && payload.notification) {
          const n = payload.notification;
          queryClient.setQueryData<AppNotification[]>(['notifications', 'unread'], (old) => [n, ...(old ?? [])].slice(0, 20));
          queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
          toast(n.title, {
            description: n.body ?? undefined,
            duration: 5000,
          });
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    es.addEventListener('message', onMessage);
    // Notifications still work via polling; SSE is a bonus.
    es.onerror = () => {
      /* reconnect handled by EventSource */
    };

    return () => {
      es.removeEventListener('message', onMessage);
      es.close();
    };
  }, [queryClient]);
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return (unwrap(res) as { count: number }).count;
    },
    refetchInterval: 60_000,
  });
}

export function useUnreadNotifications(limit = 8) {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await api.get('/notifications', { params: { unread: true, limit } });
      return unwrap(res) as AppNotification[];
    },
    refetchInterval: 60_000,
  });
}
