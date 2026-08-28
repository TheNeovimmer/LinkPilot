import Link from 'next/link';
import { WifiOff, CloudOff, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-overlay)] bg-surface-2 ring-1 ring-border">
          <WifiOff className="h-6 w-6 text-text-muted" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text">You&apos;re offline</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
            LinkPilot couldn&apos;t reach the server. Reconnect to keep tracking — nothing is lost, everything syncs when
            you&apos;re back.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
          <CloudOff className="h-3.5 w-3.5" strokeWidth={1.75} />
          Add LinkPilot to your home screen to open it like an app.
        </div>
        <Link href="/login">
          <Button variant="secondary">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Try reconnecting
          </Button>
        </Link>
      </div>
    </main>
  );
}