import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-overlay)] bg-surface-2 ring-1 ring-border">
        <Compass className="h-5 w-5 text-text-muted" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">404</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-text">This page drifted off the map</h1>
        <p className="mt-1 text-[13px] text-text-muted">The route you followed does not exist.</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
