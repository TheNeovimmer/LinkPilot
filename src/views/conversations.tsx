'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { ConversationList } from '@/components/conversations/conversation-list';
import { ConversationThread } from '@/components/conversations/conversation-thread';
import { ConversationForm } from '@/components/conversations/conversation-form';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types';

export function ConversationsPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => (id ? ((await api.get(`/conversations/${id}`)).data.data as Conversation) : null),
    enabled: Boolean(id),
  });

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[480px] overflow-hidden rounded-[var(--radius-card)] border border-border bg-[#0c0c0f]">
      {/* List pane */}
      <div className={cn(id ? 'hidden lg:flex' : 'flex', 'w-full flex-col lg:w-[340px] lg:shrink-0 lg:border-r lg:border-border')}>
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-[13px] font-semibold text-text">Conversations</span>
          <Button size="icon-sm" variant="secondary" onClick={() => setFormOpen(true)} title="New conversation">
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Button>
        </div>
        <ConversationList />
      </div>

      {/* Detail pane */}
      <div className={cn('flex-1', id ? 'flex' : 'hidden lg:flex')}>
        {isLoading ? (
          <div className="flex-1 p-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="mt-6 space-y-3">
              <Skeleton className="ml-auto h-16 w-2/3" />
              <Skeleton className="h-16 w-2/3" />
            </div>
          </div>
        ) : conversation ? (
          <ConversationThread
            conversation={conversation}
            onEdit={() => setFormOpen(true)}
            onDeleted={() => router.replace('/conversations')}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Select a conversation"
              description="Pick a conversation from the list, or start a new one to track a recruiter chat."
              action={
                <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                  New conversation
                </Button>
              }
            />
          </div>
        )}
      </div>

      <ConversationForm open={formOpen} onOpenChange={setFormOpen} conversation={conversation ?? null} />
    </div>
  );
}
