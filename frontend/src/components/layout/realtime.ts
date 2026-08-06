import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useEffect } from 'react';
import { api, unwrap } from '@/lib/api';
import type { AppNotification } from '@/types';
import { toast } from 'sonner';

const SOCKET_EVENT = 'notification';

/** Listen for realtime notifications over Socket.IO and keep the badge fresh. */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io('/', { withCredentials: true, transports: ['websocket', 'polling'] });

    const onNotification = (n: AppNotification) => {
      queryClient.setQueryData<AppNotification[]>(['notifications', 'unread'], (old) => [n, ...(old ?? [])].slice(0, 20));
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
      toast(n.title, {
        description: n.body ?? undefined,
        duration: 5000,
      });
    };

    socket.on(SOCKET_EVENT, onNotification);
    socket.on('connect_error', () => {
      // Notifications still work via polling; socket is a bonus.
    });
    return () => {
      socket.disconnect();
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
