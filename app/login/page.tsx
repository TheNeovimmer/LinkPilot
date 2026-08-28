'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/common/field';
import { signIn, signUp, verifyTwoFactor } from '@/lib/api';
import { useSession } from '@/stores/session';
import { useLocale } from '@/stores/locale';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { toast } from 'sonner';

export default function LoginPage() {
  const status = useSession((s) => s.status);
  const setUser = useSession((s) => s.setUser);
  const t = useLocale((s) => s.t);
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (status === 'authed') router.replace('/dashboard');
  }, [status, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        if (result.twoFactorRequired) {
          setTwoFactorRequired(true);
          return;
        }
      } else {
        await signUp(name || email.split('@')[0], email, password);
      }
      await useSession.getState().init();
      const user = useSession.getState().user;
      if (user) {
        setUser(user);
        router.replace('/dashboard');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await verifyTwoFactor(code);
      await useSession.getState().init();
      const user = useSession.getState().user;
      if (user) {
        setUser(user);
        router.replace('/dashboard');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="absolute top-4 end-4 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
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
              {t('login.brandSub')}
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-overlay)] border border-border bg-surface p-6">
          <div className="mb-5 grid grid-cols-2 rounded-[var(--radius-control)] border border-border bg-surface-2 p-0.5 text-[13px] font-medium">
            <button
              onClick={() => setMode('signin')}
              className={`rounded-[6px] py-1.5 transition-colors cursor-pointer ${mode === 'signin' ? 'bg-surface-3 text-text' : 'text-text-muted hover:text-text-secondary'}`}
            >
              {t('login.signIn')}
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`rounded-[6px] py-1.5 transition-colors cursor-pointer ${mode === 'signup' ? 'bg-surface-3 text-text' : 'text-text-muted hover:text-text-secondary'}`}
            >
              {t('login.createAccount')}
            </button>
          </div>

          {twoFactorRequired ? (
            <form onSubmit={submitCode} className="flex flex-col gap-3">
              <p className="text-[12.5px] text-text-muted">Enter the 6-digit code from your authenticator app.</p>
              <Field label="Two-factor code">
                <Input
                  inputMode="numeric"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="font-mono text-center tracking-[0.4em]"
                  required
                />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={busy || code.length < 6} className="flex-1">
                  {busy ? '…' : 'Verify'}
                </Button>
                <Button type="button" variant="secondary" disabled={busy} onClick={() => setTwoFactorRequired(false)}>
                  Back
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              {mode === 'signup' ? (
                <Field label={t('login.name')}>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('login.name')} autoComplete="name" />
                </Field>
              ) : null}
              <Field label={t('login.email')}>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
              </Field>
              <Field label={t('login.password')} hint={mode === 'signup' ? t('login.passwordHint') : undefined}>
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
                {busy ? '…' : mode === 'signin' ? t('login.submit.signIn') : t('login.submit.signUp')}
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-[11px] leading-relaxed text-text-muted">
            {t('login.privacy')}
          </p>
        </div>
      </div>
    </div>
  );
}
