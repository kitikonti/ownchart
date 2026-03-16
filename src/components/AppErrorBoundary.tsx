/**
 * AppErrorBoundary - Root-level React Error Boundary.
 * Catches unhandled render errors from the component tree and displays
 * a user-friendly fallback instead of a blank screen.
 */

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  /** Tracks how many times the error boundary has fired in this session. */
  errorCount: number;
}

// Use a generic user-safe message in the UI — raw Error.message may contain
// technical internals that are meaningless (or alarming) to end users.
// The full error is logged with context in componentDidCatch.
const ERROR_FALLBACK_MESSAGE =
  "The application encountered an unexpected error. Please try reloading.";

/**
 * After this many errors in the same boundary instance, the "Try again" button
 * is hidden to prevent users from being stuck in an endless error-retry loop.
 * The "Reload application" button remains available at all times.
 *
 * Note: errorCount is session-persistent within a single boundary instance —
 * it is NOT reset after a successful "Try again" recovery (see handleReset).
 * This is intentional: the counter's purpose is to detect persistent error
 * loops, and resetting after recovery would allow a looping error to reset its
 * own counter by briefly succeeding. The trade-off is that a user who hits
 * three unrelated errors across a long session will see the Reload-only UI
 * sooner than expected. This is considered acceptable — persistent reload
 * guidance is never harmful, and the user can still close and reopen the app.
 */
const MAX_RETRY_ATTEMPTS = 3;

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  // The `error` argument is intentionally omitted from this static method's
  // parameter list — it is handled with full context (including componentStack)
  // in componentDidCatch. getDerivedStateFromError only needs to flip hasError
  // so the fallback UI renders synchronously.
  //
  // Note: errorCount is NOT incremented here because getDerivedStateFromError
  // is static and cannot access `this` or previous state. It is incremented in
  // componentDidCatch, which React always calls immediately after in the same
  // error-handling pass. React batches both state updates into a single commit,
  // so the rendered fallback always sees the correct (incremented) errorCount.
  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Intentional console.error: this is the appropriate place to log
    // render errors for debugging. Replace with an error-reporting service
    // (e.g. Sentry) if one is added in the future.
    console.error(
      "[AppErrorBoundary] Caught render error:",
      error,
      info.componentStack
    );
    // Increment the error count so the UI can adapt after repeated failures
    // (e.g. hide "Try again" to avoid an endless error loop). React batches
    // this setState with the hasError flip from getDerivedStateFromError above.
    this.setState((prev) => ({ errorCount: prev.errorCount + 1 }));
  }

  private handleReset = (): void => {
    // Soft reset: clears the error state so the component tree re-mounts.
    // Preserves any in-memory app state — prefer this over a full reload.
    // If the root cause is still present the error will re-appear; in that
    // case the user should use "Reload application" instead.
    this.setState({ hasError: false });
    // Note: errorCount is intentionally NOT reset here. It persists across
    // "Try again" attempts so we can detect persistent error loops and guide
    // the user toward the "Reload application" action instead.
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // After MAX_RETRY_ATTEMPTS the "Try again" option is hidden — repeated
      // errors indicate a persistent root cause that a soft reset won't fix.
      const canRetry = this.state.errorCount < MAX_RETRY_ATTEMPTS;

      return (
        <div
          role="alert"
          className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-100 text-slate-900 p-8"
        >
          <h1 className="text-2xl font-semibold text-red-600">
            Something went wrong
          </h1>
          <p className="text-slate-600 text-sm max-w-md text-center">
            {ERROR_FALLBACK_MESSAGE}
          </p>
          <div className="flex gap-3">
            {canRetry && (
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md text-sm hover:bg-slate-300 transition-colors"
              >
                Try again
              </button>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 bg-brand-600 text-white rounded-md text-sm hover:bg-brand-500 transition-colors"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
