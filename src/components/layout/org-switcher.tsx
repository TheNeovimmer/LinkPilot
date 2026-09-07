'use client';

import Link from 'next/link';
import { Building2, Check, Plus } from 'lucide-react';
import { useOrg } from '@/stores/org';
import { cn } from '@/lib/utils';

export function OrgSwitcher() {
  const orgs = useOrg((s) => s.orgs);
  const activeId = useOrg((s) => s.activeOrgId);
  const setActive = useOrg((s) => s.setActive);
  const active = orgs.find((o) => o.id === activeId) ?? orgs[0];
  if (!active) return null;
  return (
    <details className='relative'>
      <summary className='flex w-full cursor-pointer list-none items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden'>
        <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-accent/12 ring-1 ring-accent-border'>
          <Building2 className='h-3.5 w-3.5 text-accent' strokeWidth={1.75} />
        </span>
        <span className='min-w-0 flex-1 text-left leading-tight'>
          <span className='block truncate text-[12.5px] font-medium text-text'>{active.name}</span>
          <span className='block font-mono text-[10px] uppercase tracking-wide text-text-muted'>{active.role}</span>
        </span>
      </summary>
      <div className='absolute start-0 end-0 top-full z-50 mt-1 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-xl'>
        <div className='max-h-56 overflow-y-auto p-1.5'>
          {orgs.map((o) => (
            <button
              key={o.id}
              onClick={() => { setActive(o.id); (document.activeElement as HTMLElement | null)?.blur(); window.location.reload(); }}
              className={cn('flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 text-left transition-colors hover:bg-surface-2')}
            >
              <span className='min-w-0 flex-1'>
                <span className='block truncate text-[12.5px] font-medium text-text'>{o.name}</span>
                <span className='block font-mono text-[10px] text-text-muted'>{o.role}</span>
              </span>
              {o.id === active.id ? <Check className='h-3.5 w-3.5 shrink-0 text-accent' strokeWidth={2} /> : null}
            </button>
          ))}
        </div>
        <div className='border-t border-border p-1.5'>
          <Link href='/workspaces' className='flex items-center gap-2 rounded-[6px] px-2.5 py-2 text-[12.5px] text-text-secondary transition-colors hover:bg-surface-2 hover:text-text'>
            <Plus className='h-3.5 w-3.5' strokeWidth={1.75} />
            Manage workspaces
          </Link>
        </div>
      </div>
    </details>
  );
}
