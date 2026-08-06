/** Minimal types for node-cron (the package ships no declarations). */
declare module 'node-cron' {
  export function schedule(pattern: string, task: () => void | Promise<void>, options?: unknown): unknown;
}
