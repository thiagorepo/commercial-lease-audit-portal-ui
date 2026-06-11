import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/* -------------------------------------------------------------------------- */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Why: Unhandled render errors crash the entire React tree. An error boundary
 *      catches those errors at the boundary level so the rest of the app stays alive.
 * What: React class component that catches rendering errors in its subtree and
 *       displays a recoverable fallback UI with the error message and a retry button.
 * Test: Force a child component to throw during render, assert the fallback UI
 *       appears with the error message and a clickable retry button.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught rendering error:', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-error-200 bg-error-50 p-8 text-center dark:border-error-800 dark:bg-error-950/30">
          <AlertTriangle className="h-10 w-10 text-error-500" />
          <div>
            <h2 className="text-lg font-semibold text-error-700 dark:text-error-400">
              Something went wrong
            </h2>
            <p className="mt-1 text-sm text-error-600 dark:text-error-500">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/* -------------------------------------------------------------------------- */

/**
 * Why: Simplifies wrapping arbitrary components with an ErrorBoundary without
 *      requiring explicit JSX nesting at every call site.
 * What: Higher-order component that wraps the given component in an ErrorBoundary.
 * Test: Pass a component that throws, verify the wrapped version renders the
 *       fallback instead of crashing.
 */
export function withErrorBoundary<P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
): React.ComponentType<P> {
  const displayName = WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component';

  const WithErrorBoundaryWrapper = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryWrapper.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundaryWrapper;
}
