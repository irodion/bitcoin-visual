import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[BitcoinVisual] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-bg px-6">
          <div className="panel-cool rounded-card border border-border p-10 text-center shadow-container">
            <div className="mb-4 text-4xl">{"\u26A0"}</div>
            <h2 className="text-xl font-bold text-text-primary">Something went wrong</h2>
            <p className="mt-2 max-w-sm text-sm text-text-secondary">
              An unexpected error occurred. Try reloading the page.
            </p>
            <button
              type="button"
              className="mt-6 cursor-pointer rounded-pill bg-accent px-6 py-2.5 text-sm font-bold text-text-on-accent transition-opacity hover:opacity-90 active:opacity-80"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
