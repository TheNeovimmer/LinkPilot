import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, Save, Sparkles, UserCircle } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/common/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { toast } from 'sonner';
import type { Profile } from '@/types';

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'confident', label: 'Confident' },
  { value: 'concise', label: 'Concise' },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    displayName: '',
    title: '',
    location: '',
    linkedinUrl: '',
    tone: 'professional' as string,
    targetRole: '',
    salaryRange: '',
  });
  const [loaded, setLoaded] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const p = (await api.get('/users/me')).data.data as Profile;
      if (!loaded) {
        setForm({
          displayName: p.displayName ?? '',
          title: p.title ?? '',
          location: p.location ?? '',
          linkedinUrl: p.linkedinUrl ?? '',
          tone: p.tone ?? 'professional',
          targetRole: p.goals?.targetRole ?? '',
          salaryRange: p.goals?.salaryRange ?? '',
        });
        setLoaded(true);
      }
      return p;
    },
  });

  const save = useMutation({
    mutationFn: async () =>
      api.patch('/users/me', {
        displayName: form.displayName || undefined,
        title: form.title || null,
        location: form.location || null,
        linkedinUrl: form.linkedinUrl || '',
        tone: form.tone,
        goals: {
          targetRole: form.targetRole || undefined,
          salaryRange: form.salaryRange || undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success('Profile saved — the AI now writes with this context');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success('Avatar updated');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <PageHeader title="Settings" description="Your profile powers every AI draft, analysis and prep." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
            Profile & AI context
          </CardTitle>
          <CardDescription>This context is injected into every AI prompt — keep it current.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-surface-3 ring-1 ring-border-strong">
                {profile?.image ? (
                  <img src={profile.image} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="h-7 w-7 text-text-muted" strokeWidth={1.5} />
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-text-secondary transition-colors hover:text-text cursor-pointer"
                title="Upload avatar"
              >
                <Camera className="h-3 w-3" strokeWidth={1.75} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatar.mutate(file);
                }}
              />
            </div>
            <div>
              <p className="text-[13.5px] font-medium text-text">{profile?.displayName ?? 'Your name'}</p>
              <p className="font-mono text-[11px] text-text-muted">{profile?.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <Input value={form.displayName} onChange={set('displayName')} placeholder="Ada Lovelace" />
            </Field>
            <Field label="Current title">
              <Input value={form.title} onChange={set('title')} placeholder="Senior Frontend Engineer" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location">
              <Input value={form.location} onChange={set('location')} placeholder="Berlin, Germany" />
            </Field>
            <Field label="LinkedIn URL">
              <Input value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/…" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Writing tone">
              <select value={form.tone} onChange={set('tone')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Target role">
              <Input value={form.targetRole} onChange={set('targetRole')} placeholder="Staff Frontend Engineer" />
            </Field>
          </div>
          <Field label="Salary range">
            <Input value={form.salaryRange} onChange={set('salaryRange')} placeholder="$140k – $180k" />
          </Field>

          <div className="flex justify-end border-t border-border pt-4">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <Save className="h-3.5 w-3.5" strokeWidth={1.75} />}
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
            AI provider
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-[13px] text-text-muted">
          <p className="leading-relaxed">
            LinkPilot uses any OpenAI-compatible endpoint. By default it points at <span className="font-mono text-[12px] text-text-secondary">OpenCode Zen</span> —
            set <span className="font-mono text-[12px] text-text-secondary">AI_API_KEY</span> in the backend environment to enable drafting, job analysis and
            interview prep. No key is ever stored in the browser.
          </p>
          <p className="font-mono text-[11.5px] text-text-muted/70">
            AI_BASE_URL · AI_MODEL · AI_API_KEY — see backend <span className="text-text-secondary">.env.example</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
