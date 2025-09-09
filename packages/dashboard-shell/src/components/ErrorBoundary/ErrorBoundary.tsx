/**
 * Enhanced Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a user-friendly fallback UI with recovery options.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { auditLogger } from '../../services/auditLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'feature';
  name?: string;
  showReload?: boolean;
  showRetry?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error logging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to audit system
    auditLogger.logComponentError(
      this.props.name || 'Unknown Component',
      error.message,
      error.stack || '',
      errorInfo.componentStack ?? ''
    );

    // Store error info for display
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private getErrorTitle = () => {
    const { level, name } = this.props;
    
    if (level === 'component') {
      return `${name || 'Component'} Error`;
    } else if (level === 'feature') {
      return `${name || 'Feature'} Unavailable`;
    }
    
    return 'Something went wrong';
  };

  private getErrorMessage = () => {
    const { level } = this.props;
    
    if (level === 'component') {
      return 'This component encountered an error and cannot be displayed. You can try again or continue using other parts of the application.';
    } else if (level === 'feature') {
      return 'This feature is temporarily unavailable due to an error. Please try again or contact support if the problem persists.';
    }
    
    return 'We\'re sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem continues.';
  };

  private getContainerStyles = () => {
    const { level } = this.props;
    
    if (level === 'component') {
      return {
        padding: '1rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        margin: '0.5rem 0'
      };
    } else if (level === 'feature') {
      return {
        padding: '2rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        margin: '1rem',
        textAlign: 'center' as const
      };
    }
    
    return {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb'
    };
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level, showReload = true, showRetry = true } = this.props;
      const canRetry = showRetry && this.state.retryCount < this.maxRetries;
      const isPageLevel = level === 'page' || !level;

      // Component or feature level error
      if (!isPageLevel) {
        return (
          <div style={this.getContainerStyles()}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 1rem',
                backgroundColor: '#fee2e2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg
                  style={{ width: '24px', height: '24px', color: '#dc2626' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                {this.getErrorTitle()}
              </h3>
              
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '1rem',
                lineHeight: '1.5'
              }}>
                {this.getErrorMessage()}
              </p>

              {(canRetry || showReload) && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  {canRetry && (
                    <button
                      onClick={this.handleRetry}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#025041',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Try Again ({this.maxRetries - this.state.retryCount} left)
                    </button>
                  )}
                  
                  {showReload && isPageLevel && (
                    <button
                      onClick={this.handleReload}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Refresh Page
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      // Page level error (full screen)
      return (
        <div style={this.getContainerStyles()}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            backgroundColor: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            borderRadius: '0.5rem',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3rem',
              height: '3rem',
              margin: '0 auto 1rem',
              backgroundColor: '#fee2e2',
              borderRadius: '50%'
            }}>
              <svg
                style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              textAlign: 'center',
              marginBottom: '0.5rem'
            }}>
              {this.getErrorTitle()}
            </h1>
            
            <p style={{
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '1rem',
              lineHeight: '1.5'
            }}>
              {this.getErrorMessage()}
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem'
            }}>
              {showReload && (
                <button
                  onClick={this.handleReload}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Refresh Page
                </button>
              )}
              
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Try Again
                </button>
              )}
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '500',
                  marginBottom: '0.5rem'
                }}>
                  Error Details
                </summary>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.75rem',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
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