export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !process.env.VERCEL) {
    const { startWorkers } = await import('./src/server/workers');
    startWorkers();
  }
}
