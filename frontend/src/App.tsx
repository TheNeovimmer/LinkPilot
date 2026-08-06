import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { useSession } from '@/stores/session';
import { AppShell } from '@/components/layout/app-shell';
import { useRealtimeNotifications } from '@/components/layout/realtime';
import { LoginPage } from '@/pages/login';
import { DashboardPage } from '@/pages/dashboard';
import { ConversationsPage } from '@/pages/conversations';
import { JobsPage } from '@/pages/jobs';
import { RecruitersPage } from '@/pages/recruiters';
import { CompaniesPage } from '@/pages/companies';
import { ApplicationsPage } from '@/pages/applications';
import { InterviewsPage } from '@/pages/interviews';
import { NotesPage } from '@/pages/notes';
import { RemindersPage } from '@/pages/reminders';
import { ActivityPage } from '@/pages/activity';
import { SettingsPage } from '@/pages/settings';
import { NotFoundPage } from '@/pages/not-found';
import { Skeleton } from '@/components/ui/skeleton';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function FullScreenLoader() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-background">
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-overlay)] bg-accent/12 ring-1 ring-accent-border">
        <span className="font-mono text-base font-bold text-accent">L</span>
      </div>
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

function Protected() {
  const status = useSession((s) => s.status);
  const location = useLocation();
  useRealtimeNotifications();

  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'anon') return <Navigate to="/login" replace state={{ from: location }} />;
  return <AppShell />;
}

export default function App() {
  const init = useSession((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Protected />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/conversations" element={<ConversationsPage />} />
            <Route path="/conversations/:id" element={<ConversationsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/recruiters" element={<RecruitersPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/interviews" element={<InterviewsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: '#18181b', border: '1px solid #27272a', color: '#fafafa', fontSize: '13px' } }} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
