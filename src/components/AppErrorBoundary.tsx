/**
 * AppErrorBoundary - Root-level React Error Boundary.
 * Catches unhandled render errors from the component tree and displays
 * a user-friendly fallback instead of a blank screen.
 */

import { Component, ReactNode, ReactElement } from "react";

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

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  override componentDidCatch(
    error: unknown,
    info: { componentStack: string }
  ): void {
    console.error(
      "[AppErrorBoundary] Caught render error:",
      error,
      info.componentStack
    );
  }

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
          <button
            onClick={this.handleReload}
            className="px-4 py-2 bg-brand-600 text-white rounded-md text-sm hover:bg-brand-500 transition-colors"
          >
            Reload application
          </button>
        </div>
      );
    }

    return this.props.children as ReactElement;
  }
}
