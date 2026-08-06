import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface-2 text-text-secondary',
        accent: 'border-accent-border bg-accent-muted text-accent',
        outline: 'border-border-strong text-text-secondary',
        success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
        warning: 'border-warning/30 bg-warning-muted text-warning',
        info: 'border-info/30 bg-info-muted text-info',
        violet: 'border-violet/30 bg-violet-muted text-violet',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
