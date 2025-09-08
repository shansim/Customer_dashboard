/**
 * Authentication Error Handler Component
 * 
 * Provides user-friendly error messages and recovery options for authentication failures
 */

import React from 'react';
import { AuthError, AuthErrorType } from '../../types/auth';
import { ErrorMessage } from '@niobi/shared-components';

export interface AuthErrorHandlerProps {
  error: AuthError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  context?: 'login' | 'register' | 'reset' | 'general';
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  context = 'general'
}) => {
  if (!error) return null;

  const getErrorConfig = (error: AuthError) => {
    switch (error.type) {
      case AuthErrorType.INVALID_EMAIL_DOMAIN:
        return {
          title: 'Access Restricted',
          message: 'Only Niobi employees with @niobi.co email addresses can access this system.',
          showRetry: false,
          variant: 'card' as const
        };

      case AuthErrorType.INVALID_CREDENTIALS:
        return {
          title: 'Login Failed',
          message: 'The email or password you entered is incorrect. Please check your credentials and try again.',
          showRetry: true,
          variant: 'card' as const
        };

      case AuthErrorType.RATE_LIMITED:
        return {
          title: 'Too Many Attempts',
          message: error.message,
          details: error.retryAfter 
            ? `You can try again in ${Math.ceil(error.retryAfter / 60)} minutes.`
            : 'Please wait before trying again.',
          showRetry: false,
          variant: 'card' as const
        };

      case AuthErrorType.ACCOUNT_LOCKED:
        return {
          title: 'Account Locked',
          message: 'Your account has been temporarily locked for security reasons.',
          details: 'Please contact your system administrator or try again later.',
          showRetry: false,
          variant: 'card' as const
        };

      case AuthErrorType.SESSION_EXPIRED:
        return {
          title: 'Session Expired',
          message: 'Your session has expired for security reasons. Please log in again to continue.',
          showRetry: context === 'login',
          variant: 'banner' as const
        };

      case AuthErrorType.EMAIL_NOT_VERIFIED:
        return {
          title: 'Email Not Verified',
          message: 'Please check your email and click the verification link before logging in.',
          details: 'Didn\'t receive the email? Check your spam folder or contact support.',
          showRetry: false,
          variant: 'card' as const
        };

      case AuthErrorType.NETWORK_ERROR:
        return {
          title: 'Connection Problem',
          message: 'Unable to connect to the authentication server. Please check your internet connection.',
          details: 'If the problem persists, please contact support.',
          showRetry: true,
          variant: 'card' as const
        };

      case AuthErrorType.UNKNOWN_ERROR:
      default:
        return {
          title: 'Authentication Error',
          message: error.message || 'An unexpected error occurred during authentication.',
          details: 'Please try again or contact support if the problem continues.',
          showRetry: true,
          variant: 'card' as const
        };
    }
  };

  const config = getErrorConfig(error);

  return (
    <ErrorMessage
      title={config.title}
      message={config.message}
      details={config.details}
      variant={config.variant}
      onRetry={config.showRetry ? onRetry : undefined}
      onDismiss={onDismiss}
      retryLabel={getRetryLabel(error.type, context)}
    />
  );
};

function getRetryLabel(errorType: AuthErrorType, context: string): string {
  switch (errorType) {
    case AuthErrorType.NETWORK_ERROR:
      return 'Retry Connection';
    case AuthErrorType.SESSION_EXPIRED:
      return 'Log In Again';
    case AuthErrorType.INVALID_CREDENTIALS:
      return context === 'login' ? 'Try Again' : 'Retry';
    default:
      return 'Try Again';
  }
}

export default AuthErrorHandler;