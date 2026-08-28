import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('lp-skeleton rounded-[6px]', className)} {...props} />;
}

export { Skeleton };
