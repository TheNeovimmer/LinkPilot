'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { CommandPalette } from '@/components/layout/command-palette';
import { useUI } from '@/stores/ui';
import { useSession } from '@/stores/session';
import { useRealtimeNotifications } from '@/components/layout/realtime';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function FullScreenLoader() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-background">
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-overlay)] bg-accent/12 ring-1 ring-accent-border">
        <span className="font-mono text-base font-bold text-accent">L</span>
      </div>
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  const status = useSession((s) => s.status);
  const router = useRouter();

  useRealtimeNotifications();

  useEffect(() => {
    if (status === 'anon') router.replace('/login');
  }, [status, router]);

  if (status === 'loading') return <FullScreenLoader />;
  if (status !== 'authed') return null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 start-0 animate-in slide-in-from-start duration-200">
            <Sidebar />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className={cn('flex-1 overflow-y-auto')}>
          <div className="mx-auto max-w-[1200px] px-5 py-6 lg:px-8">{children}</div>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
