'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from '@/stores/session';
import { useLocale } from '@/stores/locale';
import { initials } from '@/lib/utils';

export function UserMenu() {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const t = useLocale((s) => s.t);
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 text-[12px] font-semibold text-text-secondary ring-1 ring-border-strong transition-colors hover:ring-accent-border cursor-pointer">
          {initials(user?.name ?? user?.email)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <p className="truncate text-[13px] font-medium normal-case tracking-normal text-text">{user?.name ?? user?.email}</p>
          <p className="truncate font-mono text-[10px] text-text-muted">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t('user.account')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={async () => {
            await logout();
            router.push('/login');
          }}
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t('user.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
