import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-sm font-medium transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-ink hover:bg-accent-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]',
        secondary: 'bg-surface-2 text-text border border-border hover:bg-surface-3 hover:border-border-strong',
        ghost: 'text-text-secondary hover:text-text hover:bg-surface-2',
        outline: 'border border-border-strong text-text bg-transparent hover:bg-surface-2',
        destructive: 'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3 text-[13px]',
        lg: 'h-10 px-5',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
