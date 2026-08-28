'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  /** Delay in seconds before the entrance starts (used to stagger siblings). */
  delay?: number;
  className?: string;
}

/**
 * Subtle, motion-gated entrance wrapper.
 * Collapses to a static render when the user prefers reduced motion.
 * Animates only transform + opacity (GPU-friendly, no layout thrash).
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
