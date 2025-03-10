'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorReported: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorReported: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorReported: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.reportError(error, errorInfo);
  }

  async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      // Don't report if we're in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error not reported in development mode:', error);
        this.setState({ errorReported: true });
        return;
      }

      // Get the current route for context
      const route = window.location.pathname;
      
      // Collect browser information
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      // Create the error report
      const errorReport = {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        componentStack: errorInfo.componentStack,
        route,
        browserInfo,
        timestamp: new Date().toISOString()
      };

      // Send to our error API endpoint
      const response = await fetch('/api/debug/error-catcher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      if (response.ok) {
        this.setState({ errorReported: true });
      } else {
        console.error('Failed to report error:', await response.text());
      }
    } catch (reportingError) {
      console.error('Error while reporting error:', reportingError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorReported: false
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      // Default behavior: refresh the page
      window.location.reload();
    }
  };

  render() {
    const { hasError, error, errorReported } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If there's a custom fallback, use it
      if (fallback) {
        return fallback;
      }

      // Otherwise, show our default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <div className="bg-gray-50 p-4 rounded mb-4 text-left overflow-auto max-h-32">
              <p className="text-sm text-gray-700 font-mono">
                {error?.message || 'An unknown error occurred'}
              </p>
            </div>
            
            <p className="text-gray-600 mb-6">
              {errorReported 
                ? "This error has been reported to our team." 
                : "We're having trouble reporting this error."}
            </p>
            
            <div className="flex flex-col space-y-2">
              <button 
                onClick={this.handleReset}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Try Again
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 mt-2"
              >
                Go to Home Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary; 