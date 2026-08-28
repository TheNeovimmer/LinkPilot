import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '@/lib/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { timeAgo } from '@/lib/format';
import { toast } from 'sonner';
import { useUnreadCount, useUnreadNotifications } from './realtime';
import type { AppNotification } from '@/types';

const TYPE_DOT: Record<string, string> = {
  REMINDER: 'bg-warning',
  INTERVIEW: 'bg-violet',
  APPLICATION: 'bg-violet',
  AI: 'bg-accent',
  SYSTEM: 'bg-info',
};

export function NotificationsPopover() {
  const { data: count } = useUnreadCount();
  const { data: items, isLoading } = useUnreadNotifications();
  const queryClient = useQueryClient();

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      queryClient.setQueryData(['notifications', 'count'], 0);
      queryClient.setQueryData<AppNotification[]>(['notifications', 'unread'], (old) => old?.map((n) => ({ ...n, read: true })) ?? []);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-[17px] w-[17px]" strokeWidth={1.75} />
          {count ? (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="text-[13px] font-medium text-text">Notifications</span>
          {count ? (
            <button onClick={markAllRead} className="flex items-center gap-1 text-[11.5px] text-text-muted transition-colors hover:text-text cursor-pointer">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          ) : null}
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items?.length ? (
            items.map((n) => (
              <div key={n.id} className="flex gap-2.5 border-b border-border/60 px-4 py-2.5 last:border-0">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT[n.type] ?? 'bg-text-muted'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium leading-snug text-text">{n.title}</p>
                  {n.body ? <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-text-muted">{n.body}</p> : null}
                  <p className="mt-1 font-mono text-[10px] text-text-muted/70">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Inbox className="h-5 w-5 text-text-muted" strokeWidth={1.5} />
              <p className="text-[13px] text-text-muted">You're all caught up.</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
