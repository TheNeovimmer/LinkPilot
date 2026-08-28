'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Save, Sparkles } from 'lucide-react';
import { apiErrorMessage, getAiSettings, saveAiSettings } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/common/field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * Per-user AI provider configuration. The API key is persisted server-side only
 * and is never sent back to the browser — the UI shows a masked hint instead.
 */
export function AiProviderCard() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{
    baseUrl: string;
    model: string;
    embeddingModel: string;
    apiKey: string;
    enabled: boolean;
  }>({ baseUrl: '', model: '', embeddingModel: '', apiKey: '', enabled: false });
  const [loaded, setLoaded] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const s = await getAiSettings();
      if (!loaded) {
        setForm({
          baseUrl: s.baseUrl,
          model: s.model,
          embeddingModel: s.embeddingModel ?? '',
          apiKey: '',
          enabled: s.enabled,
        });
        setLoaded(true);
      }
      return s;
    },
  });

  const save = useMutation({
    mutationFn: () =>
      saveAiSettings({
        baseUrl: form.baseUrl.trim() || undefined,
        model: form.model.trim() || undefined,
        embeddingModel: form.embeddingModel.trim() || null,
        apiKey: form.apiKey || undefined,
        enabled: form.enabled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      setLoaded(false);
      setForm((f) => ({ ...f, apiKey: '' }));
      toast.success('AI provider saved');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const set = (key: 'baseUrl' | 'model' | 'embeddingModel' | 'apiKey') => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
          AI provider
        </CardTitle>
        <CardDescription>
          Point LinkPilot at any OpenAI-compatible endpoint. Settings are stored per-user and the API key never leaves the
          server — leave the key blank to keep the one already saved.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Base URL">
            <Input value={form.baseUrl} onChange={set('baseUrl')} placeholder="https://api.openai.com/v1" />
          </Field>
          <Field label="Model">
            <Input value={form.model} onChange={set('model')} placeholder="gpt-4o-mini" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Embedding model" hint="Optional — enables semantic job search">
            <Input value={form.embeddingModel} onChange={set('embeddingModel')} placeholder="text-embedding-3-small" />
          </Field>
          <Field
            label="API key"
            hint={
              settings?.hasApiKey ? `Saved ${settings.apiKeyHint} — leave blank to keep it` : 'Required to enable AI features'
            }
          >
            <Input
              value={form.apiKey}
              onChange={set('apiKey')}
              type="password"
              autoComplete="new-password"
              placeholder={settings?.hasApiKey ? '••••••••' : 'sk-…'}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2.5 text-[13px] text-text-secondary">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            className="h-4 w-4 accent-accent"
          />
          Enable AI features
          {settings?.enabled ? <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2.25} /> : null}
        </label>

        <div className="flex justify-end border-t border-border pt-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <Save className="h-3.5 w-3.5" strokeWidth={1.75} />}
            Save AI settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}