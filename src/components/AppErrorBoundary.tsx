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
  message: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(): State {
    // Use a generic user-safe message in the UI — raw Error.message may contain
    // technical internals that are meaningless (or alarming) to end users.
    // The full error is logged with context in componentDidCatch below.
    return {
      hasError: true,
      message:
        "The application encountered an unexpected error. Please try reloading.",
    };
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
  }

  private handleReset = (): void => {
    // Soft reset: clears the error state so the component tree re-mounts.
    // Preserves any in-memory app state — prefer this over a full reload.
    this.setState({ hasError: false, message: "" });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="h-screen flex flex-col items-center justify-center gap-4 bg-neutral-100 text-neutral-900 p-8"
        >
          <h1 className="text-2xl font-semibold text-red-600">
            Something went wrong
          </h1>
          <p className="text-neutral-600 text-sm max-w-md text-center">
            {this.state.message}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-md text-sm hover:bg-neutral-300 transition-colors"
            >
              Try again
            </button>
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
