/**
 * Error Handling Components Tests
 * 
 * Tests for the enhanced error handling and user feedback components
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary/ErrorBoundary';
import { NetworkErrorHandler } from '../components/ErrorBoundary/NetworkErrorHandler';
import { AuthErrorHandler } from '../components/Auth/AuthErrorHandler';
import { AuthError, AuthErrorType } from '../types/auth';

// Mock component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('should catch and display component errors', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError} level="component" name="TestComponent">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('TestComponent Error')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary level="component" name="TestComponent">
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should provide retry functionality', () => {
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError} level="component" name="TestComponent" showRetry={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText(/Try Again/);
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    // After retry, the error should be cleared and component re-rendered
  });
});

describe('AuthErrorHandler', () => {
  it('should display invalid email domain error', () => {
    const error: AuthError = {
      type: AuthErrorType.INVALID_EMAIL_DOMAIN,
      message: 'Access restricted to Niobi employees only'
    };

    render(<AuthErrorHandler error={error} context="login" />);

    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.getByText(/Niobi employees.*@niobi\.co.*access this system/)).toBeInTheDocument();
  });

  it('should display network error with retry option', () => {
    const error: AuthError = {
      type: AuthErrorType.NETWORK_ERROR,
      message: 'Unable to connect to server'
    };
    
    const onRetry = vi.fn();

    render(<AuthErrorHandler error={error} context="login" onRetry={onRetry} />);

    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Retry Connection');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalled();
  });

  it('should display rate limited error without retry', () => {
    const error: AuthError = {
      type: AuthErrorType.RATE_LIMITED,
      message: 'Too many attempts',
      retryAfter: 300 // 5 minutes
    };

    render(<AuthErrorHandler error={error} context="login" />);

    expect(screen.getByText('Too Many Attempts')).toBeInTheDocument();
    expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument();
  });

  it('should handle dismissal', () => {
    const error: AuthError = {
      type: AuthErrorType.INVALID_CREDENTIALS,
      message: 'Invalid credentials'
    };
    
    const onDismiss = vi.fn();

    render(<AuthErrorHandler error={error} context="login" onDismiss={onDismiss} />);

    const dismissButton = screen.getByLabelText('Dismiss error');
    fireEvent.click(dismissButton);
    
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('NetworkErrorHandler', () => {
  // Mock navigator.onLine
  const mockNavigator = vi.spyOn(window.navigator, 'onLine', 'get');

  it('should render children when online', () => {
    mockNavigator.mockReturnValue(true);

    render(
      <NetworkErrorHandler>
        <div>Online content</div>
      </NetworkErrorHandler>
    );

    expect(screen.getByText('Online content')).toBeInTheDocument();
  });

  it('should show offline message when offline', () => {
    mockNavigator.mockReturnValue(false);

    render(
      <NetworkErrorHandler>
        <div>Online content</div>
      </NetworkErrorHandler>
    );

    expect(screen.getByText('Connection Lost')).toBeInTheDocument();
    expect(screen.getByText(/offline/)).toBeInTheDocument();
  });

  it('should call onNetworkError callback', () => {
    const onNetworkError = vi.fn();
    mockNavigator.mockReturnValue(false);

    render(
      <NetworkErrorHandler onNetworkError={onNetworkError}>
        <div>Content</div>
      </NetworkErrorHandler>
    );

    // The callback should be called during the effect
    waitFor(() => {
      expect(onNetworkError).toHaveBeenCalledWith(false);
    });
  });
});