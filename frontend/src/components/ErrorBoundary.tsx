import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0D17] text-gray-900 dark:text-gray-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-card p-8 rounded-2xl shadow-xl text-center border border-gray-200 dark:border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-3xl">
              ⚡
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              StellarFlow encountered an unexpected error while rendering this page.
            </p>
            {this.state.error?.message && (
              <pre className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded-xl mb-6 text-left overflow-x-auto text-red-500">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#3E1BDB] to-[#7B61FF] hover:from-[#4b23ff] hover:to-[#8c75ff] shadow-md transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

