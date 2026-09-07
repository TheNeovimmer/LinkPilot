'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { api, unwrap } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { useSession } from '@/stores/session';

interface AdminOrg { id: string; name: string; slug: string; _count: { memberships: number } }
interface AdminUser { id: string; email: string; name: string | null; platformRole: string; createdAt: string }

export function AdminPage() {
  const user = useSession((s) => s.user);
  const isAdmin = user?.platformRole === 'SUPER_ADMIN';
  const { data: orgs } = useQuery({
    queryKey: ['admin-orgs'],
    queryFn: async () => unwrap<AdminOrg[]>(await api.get('/admin/orgs')),
    enabled: isAdmin,
  });
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => unwrap<AdminUser[]>(await api.get('/admin/users')),
    enabled: isAdmin,
  });
  if (!isAdmin) return <p className='text-[13px] text-text-muted'>Platform admin only.</p>;
  return (
    <div className='flex flex-col gap-5'>
      <PageHeader title='Platform admin' description='All workspaces and users. SUPER_ADMIN only, enforced server-side.' />
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader><CardTitle>Workspaces · {orgs?.length ?? 0}</CardTitle></CardHeader>
          <CardContent>
            {!orgs ? <div className='space-y-2'><Skeleton className='h-10 w-full' /><Skeleton className='h-10 w-full' /></div> : (
              <div className='divide-y divide-border/60'>
                {orgs.map((o) => (
                  <div key={o.id} className='flex items-center gap-2 py-2 first:pt-0 last:pb-0'>
                    <ShieldCheck className='h-4 w-4 shrink-0 text-text-muted' strokeWidth={1.75} />
                    <span className='min-w-0 flex-1 truncate text-[13px] text-text'>{o.name} <span className='font-mono text-[11px] text-text-muted'>· {o.slug}</span></span>
                    <span className='font-mono text-[11px] text-text-muted'>{o._count.memberships} members</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Users · {users?.length ?? 0}</CardTitle></CardHeader>
          <CardContent>
            {!users ? <div className='space-y-2'><Skeleton className='h-10 w-full' /><Skeleton className='h-10 w-full' /></div> : (
              <div className='divide-y divide-border/60'>
                {users.map((u) => (
                  <div key={u.id} className='flex items-center gap-2 py-2 first:pt-0 last:pb-0'>
                    <span className='min-w-0 flex-1 truncate text-[13px] text-text'>{u.email}</span>
                    <span className='rounded-full border border-border px-2 py-0.5 font-mono text-[10.5px] text-text-muted'>{u.platformRole}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
