import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  // Lets a nested boundary render something smaller than the full-page fallback.
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

// Must be a class: there is no hook equivalent of componentDidCatch.
//
// Without this, a single render error anywhere unmounts the entire React tree and leaves a blank
// white page with no way back except a manual reload.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Kept as console.error rather than a toast: the toast host may itself be inside the subtree
    // that just failed. Replace with a reporting service when one exists.
    console.error('Unhandled render error:', error, errorInfo.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleDismiss = () => {
    // Clearing the error re-renders children. Useful when the failure was transient (a bad prop
    // from a since-refetched query); if it recurs the boundary simply catches it again.
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex p-3 rounded-full bg-rose-50 dark:bg-rose-900/20 mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>

          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This part of the page failed to load. Reloading usually fixes it. If it keeps happening,
            let your administrator know.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload
            </button>
            <button
              onClick={this.handleDismiss}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Try again
            </button>
          </div>

          {import.meta.env.DEV && (
            // Development only: the message can leak internals, and it is noise for a real user.
            <pre className="mt-6 text-left text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3 overflow-x-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
