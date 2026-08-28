'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { apiErrorMessage, deleteAttachment, listAttachments, uploadAttachment } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Attachment } from '@/types';

const KIND_LABEL: Record<Attachment['kind'], string> = {
  resume: 'Resume',
  coverLetter: 'Cover letter',
  contract: 'Contract',
  other: 'Other',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Attach/resume/cover-letter manager for an application or note. */
export function AttachmentList({ entity, id }: { entity: 'application' | 'note'; id: string | null }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<'resume' | 'coverLetter' | 'contract' | 'other'>('resume');

  const { data: attachments } = useQuery({
    queryKey: ['attachments', entity, id],
    queryFn: () => listAttachments(entity, id),
    enabled: Boolean(id),
  });

  const upload = useMutation({
    mutationFn: ({ kind: k, file }: { kind: string; file: File }) => uploadAttachment(entity, id!, k, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      toast.success('File attached');
      if (inputRef.current) inputRef.current.value = '';
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (att: Attachment) => deleteAttachment(att.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      toast.success('Attachment removed');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!id) return null;

  return (
    <div className="rounded-[var(--radius-control)] border border-border bg-surface-2/50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-text-secondary">
        <Paperclip className="h-3.5 w-3.5" strokeWidth={1.75} />
        Attachments
      </div>

      {attachments?.length ? (
        <ul className="mb-3 space-y-1.5">
          {attachments.map((att) => (
            <li key={att.id} className="flex items-center gap-2 rounded-[var(--radius-control)] bg-surface px-2.5 py-1.5 ring-1 ring-border">
              <FileText className="h-3.5 w-3.5 shrink-0 text-text-secondary" strokeWidth={1.75} />
              <a href={att.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[12.5px] text-text hover:text-accent">
                {att.originalName}
              </a>
              <span className="rounded-full bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-text-muted">{KIND_LABEL[att.kind] ?? att.kind}</span>
              <span className="font-mono text-[10px] text-text-muted">{formatSize(att.size)}</span>
              <a href={att.url} download className="text-text-muted transition-colors hover:text-text" title="Download">
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
              <button onClick={() => remove.mutate(att)} className="text-text-muted transition-colors hover:text-destructive cursor-pointer" title="Remove">
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-[12px] text-text-muted">No files attached yet — save the exact resume &amp; cover letter you sent.</p>
      )}

      <div className="flex items-center gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="h-7 shrink-0 cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-[12px] text-text focus:border-accent-border focus:outline-none"
        >
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <Button type="button" variant="secondary" size="sm" disabled={upload.isPending} onClick={() => inputRef.current?.click()} className="shrink-0">
          {upload.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />}
          {upload.isPending ? 'Uploading…' : 'Upload'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate({ kind, file });
          }}
        />
      </div>
    </div>
  );
}