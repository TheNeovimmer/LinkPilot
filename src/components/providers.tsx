'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { useSession } from '@/stores/session';
import { useTheme } from '@/stores/theme';
import { useLocale } from '@/stores/locale';
import { usePreferences } from '@/stores/preferences';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function Boot() {
  const initSession = useSession((s) => s.init);
  const themeInit = useTheme((s) => s.init);
  const localeInit = useLocale((s) => s.init);
  const preferencesInit = usePreferences((s) => s.init);

  useEffect(() => {
    void initSession();
    themeInit();
    localeInit();
    preferencesInit();
  }, [initSession, themeInit, localeInit, preferencesInit]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const theme = useTheme((s) => s.theme);
  const dark = theme === 'dark';

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <Boot />
        {children}
        <Toaster
          theme={theme}
          position="bottom-right"
          toastOptions={{
            style: dark
              ? { background: '#18181b', border: '1px solid #27272a', color: '#fafafa', fontSize: '13px' }
              : { background: '#ffffff', border: '1px solid #e4e4e7', color: '#18181b', fontSize: '13px' },
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
