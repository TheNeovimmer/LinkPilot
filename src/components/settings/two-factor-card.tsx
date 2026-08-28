'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, KeyRound, Loader2, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';
import { disableTwoFactor, enableTwoFactor, regenerateBackupCodes, verifyTwoFactorSetup } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/common/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/stores/session';
import { toast } from 'sonner';

/** Extract the TOTP secret from an otpauth:// URI. */
function secretFromURI(uri: string): string {
  try {
    const url = new URL(uri);
    return url.searchParams.get('secret') ?? '';
  } catch {
    return '';
  }
}

interface SetupState {
  password: string;
  totpURI: string;
  secret: string;
  backupCodes: string[];
  code: string;
}

const EMPTY: SetupState = { password: '', totpURI: '', secret: '', backupCodes: [], code: '' };

export function TwoFactorCard() {
  const user = useSession((s) => s.user);
  const refresh = useSession((s) => s.init);
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [password, setPassword] = useState('');

  const enabled = Boolean(user?.twoFactorEnabled);

  const startSetup = useMutation({
    mutationFn: async () => {
      const p = setup?.password ?? password;
      const result = await enableTwoFactor(p);
      if (!result.totpURI) throw new Error('Could not create a TOTP secret');
      setSetup((cur) => ({
        ...(cur ?? EMPTY),
        password: p,
        totpURI: result.totpURI,
        secret: secretFromURI(result.totpURI),
        backupCodes: result.backupCodes,
      }));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to enable 2FA'),
  });

  const finishSetup = useMutation({
    mutationFn: () => verifyTwoFactorSetup(setup!.code),
    onSuccess: async () => {
      await refresh();
      setSetup(null);
      toast.success('Two-factor authentication is on');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Invalid code'),
  });

  const turnOff = useMutation({
    mutationFn: () => disableTwoFactor(password),
    onSuccess: async () => {
      await refresh();
      setPassword('');
      toast.success('Two-factor authentication disabled');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to disable 2FA'),
  });

  const regenerate = useMutation({
    mutationFn: regenerateBackupCodes,
    onSuccess: (codes) => {
      setSetup((cur) => ({ ...(cur ?? EMPTY), password, backupCodes: codes }));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to regenerate codes'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {enabled ? <ShieldCheck className="h-4 w-4 text-accent" strokeWidth={1.75} /> : <KeyRound className="h-4 w-4 text-accent" strokeWidth={1.75} />}
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          {enabled
            ? 'Enabled — sign-ins require a code from your authenticator app.'
            : 'Protect your account with a time-based code from an authenticator app.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!enabled && !setup ? (
          <div className="space-y-3">
            <Field label="Current password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </Field>
            <div className="flex justify-end border-t border-border pt-3">
              <Button onClick={() => startSetup.mutate()} disabled={startSetup.isPending || !password}>
                {startSetup.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} />}
                Enable two-factor
              </Button>
            </div>
          </div>
        ) : null}

        {setup ? (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-control)] border border-border bg-surface-2 p-3">
              <p className="mb-1 text-[12px] font-medium text-text-secondary">1 · Add to your authenticator app</p>
              <p className="text-[12px] text-text-muted">
                In Google Authenticator, Authy, 1Password… tap “Add account” and scan this code:
              </p>
              <code className="mt-2 block break-all rounded-[6px] bg-background px-2.5 py-2 font-mono text-[12px] text-accent">{setup.secret}</code>
            </div>

            {setup.backupCodes.length ? (
              <div className="rounded-[var(--radius-control)] border border-warning/30 bg-warning-muted p-3">
                <p className="mb-2 text-[12px] font-medium text-warning">Save these backup codes — they won&apos;t be shown again</p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[12px] text-text">
                  {setup.backupCodes.map((c) => (
                    <span key={c} className="rounded-[4px] bg-background/60 px-2 py-1">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <Field label="2 · Enter the 6-digit code" hint="Confirm it works before enabling.">
              <Input
                inputMode="numeric"
                value={setup.code}
                onChange={(e) => setSetup((cur) => ({ ...cur!, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="••••••"
                className="font-mono tracking-[0.4em]"
              />
            </Field>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button variant="secondary" onClick={() => setSetup(null)} disabled={finishSetup.isPending}>
                Cancel
              </Button>
              <Button onClick={() => finishSetup.mutate()} disabled={finishSetup.isPending || setup.code.length < 6}>
                {finishSetup.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <Check className="h-3.5 w-3.5" strokeWidth={1.75} />}
                Verify &amp; enable
              </Button>
            </div>
          </div>
        ) : null}

        {enabled && !setup ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-accent-border bg-accent-muted px-3 py-2 text-[13px] text-accent-strong">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              Active on this account
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
              <Button variant="secondary" size="sm" onClick={() => regenerate.mutate()}>
                {regenerate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />}
                New backup codes
              </Button>
              <div className="flex items-center gap-2">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password to confirm" className="w-44" />
                <Button variant="destructive" size="sm" onClick={() => turnOff.mutate()} disabled={turnOff.isPending || !password}>
                  {turnOff.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <ShieldOff className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  Disable
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}