import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, WifiOff, LogIn, RefreshCw } from "lucide-react";
import { Component, ReactNode } from "react";
import { ApiError, ErrorType, ApiErrorHandler } from "@/services/errorHandling";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | ApiError | null;
  errorInfo?: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service in production
    if (import.meta.env.PROD) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  private getErrorIcon = (error: Error | ApiError | null) => {
    if (!error) return AlertTriangle;
    
    if ('type' in error) {
      switch (error.type) {
        case ErrorType.NETWORK_ERROR:
        case ErrorType.TIMEOUT_ERROR:
          return WifiOff;
        case ErrorType.AUTHENTICATION_ERROR:
          return LogIn;
        default:
          return AlertTriangle;
      }
    }
    
    return AlertTriangle;
  };

  private getErrorMessage = (error: Error | ApiError | null): string => {
    if (!error) return 'An unexpected error occurred.';
    
    if ('type' in error) {
      return ApiErrorHandler.getUserFriendlyMessage(error);
    }
    
    return error.message || 'An unexpected error occurred.';
  };

  private getErrorActions = (error: Error | ApiError | null) => {
    if (!error) return [];

    const actions = [];
    
    if ('type' in error) {
      switch (error.type) {
        case ErrorType.NETWORK_ERROR:
        case ErrorType.TIMEOUT_ERROR:
        case ErrorType.SERVER_ERROR:
          actions.push({
            label: 'Retry',
            icon: RefreshCw,
            action: () => window.location.reload(),
            primary: true
          });
          break;
        case ErrorType.AUTHENTICATION_ERROR:
          actions.push({
            label: 'Go to Login',
            icon: LogIn,
            action: () => (window.location.href = '/login'),
            primary: true
          });
          break;
      }
    }

    // Always add reload option
    actions.push({
      label: 'Reload Page',
      icon: RotateCcw,
      action: () => window.location.reload(),
      primary: actions.length === 0
    });

    return actions;
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const Icon = this.getErrorIcon(this.state.error);
      const message = this.getErrorMessage(this.state.error);
      const actions = this.getErrorActions(this.state.error);

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-guarawatch-surface">
          <div className="flex flex-col items-center w-full max-w-2xl p-8 text-center">
            <Icon
              size={48}
              className="text-guarawatch-danger mb-6 flex-shrink-0"
            />

            <h2 className="text-xl font-semibold text-guarawatch-primary mb-4">
              Something went wrong
            </h2>

            <p className="text-guarawatch-muted mb-8 max-w-md">
              {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {actions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className={cn(
                      "flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
                      action.primary
                        ? "bg-guarawatch-primary text-white hover:bg-guarawatch-primary/90"
                        : "bg-guarawatch-bg text-guarawatch-primary border-2 border-guarawatch-primary hover:bg-guarawatch-primary hover:text-white"
                    )}
                  >
                    <ActionIcon size={16} />
                    {action.label}
                  </button>
                );
              })}
            </div>

            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 w-full text-left">
                <summary className="cursor-pointer text-sm text-guarawatch-muted hover:text-guarawatch-primary">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-4 rounded bg-guarawatch-bg overflow-auto">
                  <pre className="text-xs text-guarawatch-muted whitespace-break-spaces">
                    {'type' in this.state.error 
                      ? JSON.stringify(this.state.error, null, 2)
                      : this.state.error.stack
                    }
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
