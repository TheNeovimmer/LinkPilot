'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, Copy, Plus, Trash2, UserPlus } from 'lucide-react';
import { api, apiErrorMessage, unwrap } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { useOrg, type OrgSummary } from '@/stores/org';
import { toast } from 'sonner';

interface Member { userId: string; name: string | null; email: string; role: OrgSummary['role']; joinedAt: string }
interface Invite { id: string; email: string; role: string; token: string; expiresAt: string }
interface MyInvite { id: string; token: string; role: string; org: { id: string; name: string; slug: string } }

const ROLES: OrgSummary['role'][] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

function canManage(role: OrgSummary['role'] | null | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

export function WorkspacesPage() {
  const queryClient = useQueryClient();
  const orgs = useOrg((s) => s.orgs);
  const activeId = useOrg((s) => s.activeOrgId);
  const setActive = useOrg((s) => s.setActive);
  const refreshOrgs = useOrg((s) => s.refresh);
  const active = orgs.find((o) => o.id === activeId) ?? orgs[0] ?? null;
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgSummary['role']>('MEMBER');
  const [lastToken, setLastToken] = useState<string | null>(null);
  const searchParams = useSearchParams();
  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) return;
    (async () => {
      try {
        await api.post('/organizations/invites/accept', { token });
        toast.success('Joined workspace');
        await refreshOrgs();
        queryClient.invalidateQueries({ queryKey: ['my-invites'] });
      } catch (e) {
        toast.error(apiErrorMessage(e));
      }
    })();
  }, [searchParams, queryClient, refreshOrgs]);

  const { data: members } = useQuery({
    queryKey: ['org-members', active?.id],
    queryFn: async () => unwrap<Member[]>(await api.get(`/organizations/${active?.id}/members`)),
    enabled: !!active?.id,
  });

  const { data: invites } = useQuery({
    queryKey: ['org-invites', active?.id],
    queryFn: async () => unwrap<Invite[]>(await api.get(`/organizations/${active?.id}/invites`)),
    enabled: !!active?.id && canManage(active?.role),
  });

  const { data: mine } = useQuery({
    queryKey: ['my-invites'],
    queryFn: async () => unwrap<MyInvite[]>(await api.get('/organizations/invites/mine')),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['org-members'] });
    queryClient.invalidateQueries({ queryKey: ['org-invites'] });
    queryClient.invalidateQueries({ queryKey: ['my-invites'] });
    void refreshOrgs();
  };

  const createOrg = useMutation({
    mutationFn: async () => (await api.post('/organizations', { name, slug })).data,
    onSuccess: async () => { setName(''); setSlug(''); await refreshOrgs(); toast.success('Workspace created'); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const sendInvite = useMutation({
    mutationFn: async () => (await api.post(`/organizations/${active?.id}/invites`, { email: inviteEmail, role: inviteRole })).data.data as { token: string },
    onSuccess: (d) => { setLastToken(d.token); setInviteEmail(''); invalidate(); toast.success('Invite created — share the link'); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const accept = useMutation({
    mutationFn: async (token: string) => (await api.post('/organizations/invites/accept', { token })).data,
    onSuccess: async () => { invalidate(); await refreshOrgs(); toast.success('Joined workspace'); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const changeRole = useMutation({
    mutationFn: async (v: { userId: string; role: string }) => api.patch(`/organizations/${active?.id}/members/${v.userId}`, { role: v.role }),
    onSuccess: () => { invalidate(); toast.success('Role updated'); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => api.delete(`/organizations/${active?.id}/members/${userId}`),
    onSuccess: () => { invalidate(); toast.success('Member removed'); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  return (
    <div className='flex flex-col gap-5'>
      <PageHeader title='Workspaces' description='Teams share pipelines, members have roles, invites are email-bound.' />
      {(mine ?? []).length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Pending invites for you</CardTitle></CardHeader>
          <CardContent className='flex flex-col gap-2'>
            {(mine ?? []).map((i) => (
              <div key={i.id} className='flex items-center gap-3 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2'>
                <span className='min-w-0 flex-1 truncate text-[13px] text-text'>{i.org.name} <span className='font-mono text-[11px] text-text-muted'>· {i.role}</span></span>
                <Button size='sm' onClick={() => accept.mutate(i.token)}>Accept</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <div className='grid gap-4 lg:grid-cols-3'>
        <Card>
          <CardHeader><CardTitle>Your workspaces</CardTitle></CardHeader>
          <CardContent className='flex flex-col gap-1.5'>
            {orgs.map((o) => (
              <button key={o.id} onClick={() => { setActive(o.id); window.location.reload(); }} className='flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] border border-border px-3 py-2 text-left transition-colors hover:border-border-strong'>
                <Building2 className='h-4 w-4 shrink-0 text-text-muted' strokeWidth={1.75} />
                <span className='min-w-0 flex-1'><span className='block truncate text-[13px] font-medium text-text'>{o.name}</span><span className='block font-mono text-[10.5px] text-text-muted'>{o.role}</span></span>
                {o.id === active?.id ? <Check className='h-4 w-4 shrink-0 text-accent' strokeWidth={2} /> : null}
              </button>
            ))}
            <div className='mt-3 flex flex-col gap-2 border-t border-border pt-3'>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Acme hiring team' />
              <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))} placeholder='acme-hiring' />
              <Button size='sm' disabled={!name || !slug || createOrg.isPending} onClick={() => createOrg.mutate()}><Plus className='h-3.5 w-3.5' strokeWidth={2} />New workspace</Button>
            </div>
          </CardContent>
        </Card>
        <Card className='lg:col-span-2'>
          <CardHeader><CardTitle>Members {active ? `· ${active.name}` : ''}</CardTitle></CardHeader>
          <CardContent>
            {!active ? <EmptyState icon={Building2} title='No workspace' description='Create one to invite your team.' /> : !members ? (
              <div className='space-y-2'><Skeleton className='h-10 w-full' /><Skeleton className='h-10 w-full' /></div>
            ) : (
              <div className='divide-y divide-border/60'>
                {members.map((m) => (
                  <div key={m.userId} className='flex items-center gap-3 py-2.5 first:pt-0 last:pb-0'>
                    <div className='min-w-0 flex-1'><p className='truncate text-[13px] font-medium text-text'>{m.name ?? m.email}</p><p className='truncate font-mono text-[11px] text-text-muted'>{m.email}</p></div>
                    {canManage(active.role) && m.userId !== activeId ? (
                      <select value={m.role} onChange={(e) => changeRole.mutate({ userId: m.userId, role: e.target.value })} className='h-7 cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-[12px] text-text'>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : <span className='rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-text-muted'>{m.role}</span>}
                    {canManage(active.role) ? (
                      <Button variant='ghost' size='icon-sm' onClick={() => removeMember.mutate(m.userId)}><Trash2 className='h-3.5 w-3.5 text-destructive' strokeWidth={1.75} /></Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            {active && canManage(active.role) ? (
              <div className='mt-4 flex flex-col gap-2 border-t border-border pt-4'>
                <p className='flex items-center gap-1.5 text-[12.5px] font-medium text-text'><UserPlus className='h-3.5 w-3.5' strokeWidth={1.75} />Invite by email</p>
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder='teammate@company.com' type='email' />
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as OrgSummary['role'])} className='h-9 cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-[13px] text-text'>
                    {ROLES.filter((r) => active.role === 'OWNER' ? true : r !== 'OWNER').map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <Button size='sm' disabled={!inviteEmail || sendInvite.isPending} onClick={() => sendInvite.mutate()}>Invite</Button>
                </div>
                {lastToken ? (
                  <button onClick={() => { void navigator.clipboard?.writeText(`${window.location.origin}/workspaces?token=${lastToken}`); toast.success('Invite link copied'); }} className='flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-control)] border border-accent-border bg-accent-muted px-3 py-2 text-left font-mono text-[11.5px] text-accent'>
                    <Copy className='h-3.5 w-3.5 shrink-0' strokeWidth={2} />{`${window.location.origin}/workspaces?token=${lastToken}`}
                  </button>
                ) : null}
                {(invites ?? []).length > 0 ? (
                  <div className='flex flex-col gap-1.5'>
                    {(invites ?? []).map((i) => (
                      <div key={i.id} className='flex items-center gap-2 text-[12.5px] text-text-secondary'><span className='min-w-0 flex-1 truncate'>{i.email} · {i.role}</span><span className='font-mono text-[11px] text-text-muted'>expires soon</span></div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
