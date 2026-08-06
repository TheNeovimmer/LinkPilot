import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

/** Route-level crash guard — a render error shows a recovery screen instead of a blank app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : 'Something went wrong' };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent/12 ring-1 ring-accent-border">
          <span className="font-mono text-[15px] font-bold text-accent">L</span>
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-text">Something crashed</h1>
          <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-text-muted">
            {this.state.message ?? 'An unexpected error occurred.'}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-1 rounded-[var(--radius-control)] bg-accent px-4 py-2 text-[13px] font-medium text-accent-ink transition-opacity hover:opacity-90"
        >
          Reload the app
        </button>
      </div>
    );
  }
}
