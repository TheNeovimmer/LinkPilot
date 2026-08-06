import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/common/field';
import { signIn, signUp } from '@/lib/api';
import { useSession } from '@/stores/session';
import { toast } from 'sonner';

export function LoginPage() {
  const status = useSession((s) => s.status);
  const setUser = useSession((s) => s.setUser);
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'authed') return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(name || email.split('@')[0], email, password);
      }
      await useSession.getState().init();
      const user = useSession.getState().user;
      if (user) {
        setUser(user);
        navigate('/', { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-[360px]">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-overlay)] bg-accent/12 ring-1 ring-accent-border">
            <span className="font-mono text-xl font-bold text-accent">L</span>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-text">LinkPilot</h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-[13px] text-text-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
              Your private AI career copilot
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-overlay)] border border-border bg-surface p-6">
          <div className="mb-5 grid grid-cols-2 rounded-[var(--radius-control)] border border-border bg-surface-2 p-0.5 text-[13px] font-medium">
            <button
              onClick={() => setMode('signin')}
              className={`rounded-[6px] py-1.5 transition-colors cursor-pointer ${mode === 'signin' ? 'bg-surface-3 text-text' : 'text-text-muted hover:text-text-secondary'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`rounded-[6px] py-1.5 transition-colors cursor-pointer ${mode === 'signup' ? 'bg-surface-3 text-text' : 'text-text-muted hover:text-text-secondary'}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === 'signup' ? (
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
              </Field>
            ) : null}
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </Field>
            <Field label="Password" hint={mode === 'signup' ? 'At least 8 characters' : undefined}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
            </Field>
            <Button type="submit" disabled={busy || !email || !password} className="mt-1">
              {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-text-muted">
            Single-user workspace. Your data stays in your own database.
          </p>
        </div>

        {mode === 'signin' ? (
          <p className="mt-4 text-center text-[11.5px] text-text-muted">
            Demo? Seed the database (<span className="font-mono">npm run db:seed</span>) then use{' '}
            <span className="font-mono">demo@linkpilot.app</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
