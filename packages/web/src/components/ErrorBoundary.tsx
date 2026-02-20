import { Component, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { captureException } from '../config/sentry';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo.componentStack);

    // Send error to Sentry with component stack information
    captureException(error, {
      componentStack: errorInfo.componentStack || undefined,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Use default ErrorFallback component
      return (
        <ErrorFallback
          error={error?.message || 'An unexpected error occurred'}
          resetError={this.handleReset}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
