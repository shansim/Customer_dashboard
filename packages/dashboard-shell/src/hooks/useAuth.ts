/**
 * Authentication Hooks
 * 
 * Custom hooks for consuming authentication context and managing auth state.
 * Provides convenient access to authentication functionality throughout the app.
 */

import { useContext, useCallback, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import {
  AuthContextType,
  AuthError,
  AuthErrorType,
  AuthLoadingState,
  EmailValidation
} from '../types/auth';
import { authService } from '../services/authService';

// ============================================================================
// Primary useAuth Hook
// ============================================================================

/**
 * Primary hook to consume authentication context
 * 
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ============================================================================
// Enhanced Authentication Hooks
// ============================================================================

/**
 * Hook that provides additional auth state and utilities
 */
export function useAuthState() {
  const auth = useAuth();
  const [error, setError] = useState<AuthError | null>(null);
  const [loadingState, setLoadingState] = useState<AuthLoadingState>(AuthLoadingState.IDLE);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    ...auth,
    error,
    loadingState,
    clearError,
    isLoggingIn: loadingState === AuthLoadingState.LOGGING_IN,
    isLoggingOut: loadingState === AuthLoadingState.LOGGING_OUT,
    isRefreshingToken: loadingState === AuthLoadingState.REFRESHING_TOKEN,
    isRegistering: loadingState === AuthLoadingState.REGISTERING,
    isResettingPassword: loadingState === AuthLoadingState.RESETTING_PASSWORD
  };
}

/**
 * Hook for checking specific authentication states
 */
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    isGuest: !isAuthenticated && !isLoading,
    hasUser: !!user,
    userEmail: user?.email,
    userName: user?.name,
    userRole: user?.role,
    userId: user?.id
  };
}

/**
 * Hook for session management utilities
 */
export function useSession() {
  const { token, isAuthenticated, logout } = useAuth();
  const [sessionValid, setSessionValid] = useState(true);
  
  // Check session validity periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkSession = () => {
      const isValid = authService.isSessionValid();
      setSessionValid(isValid);
      
      if (!isValid) {
        // Auto-logout on invalid session
        logout();
      }
    };
    
    // Check immediately
    checkSession();
    
    // Check every minute
    const interval = setInterval(checkSession, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);
  
  const refreshToken = useCallback(async () => {
    try {
      return await authService.refreshToken();
    } catch (error) {
      await logout();
      throw error;
    }
  }, [logout]);
  
  return {
    token,
    sessionValid,
    refreshToken,
    needsRefresh: authService.needsTokenRefresh(),
    sessionData: authService.getCurrentSession()
  };
}

/**
 * Hook for email validation with Niobi domain checking
 */
export function useEmailValidation() {
  const validateEmail = useCallback((email: string): EmailValidation => {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        isNiobiDomain: false,
        error: 'Email is required'
      };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        isNiobiDomain: false,
        error: 'Please enter a valid email address'
      };
    }

    // Check Niobi domain restriction
    const isNiobiDomain = email.toLowerCase().endsWith('@niobi.co');
    if (!isNiobiDomain) {
      return {
        isValid: false,
        isNiobiDomain: false,
        error: 'Access restricted to Niobi employees only'
      };
    }

    return {
      isValid: true,
      isNiobiDomain: true
    };
  }, []);

  return { validateEmail };
}

/**
 * Hook for handling authentication errors with user-friendly messages
 */
export function useAuthError() {
  const [error, setError] = useState<AuthError | null>(null);
  
  const handleAuthError = useCallback((error: unknown) => {
    if (error && typeof error === 'object' && 'type' in error) {
      const authError = error as AuthError;
      setError(authError);
    } else if (error instanceof Error) {
      setError({
        type: AuthErrorType.UNKNOWN_ERROR,
        message: error.message || 'An unexpected error occurred'
      });
    } else {
      setError({
        type: AuthErrorType.UNKNOWN_ERROR,
        message: 'An unexpected error occurred'
      });
    }
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const getErrorMessage = useCallback((error: AuthError): string => {
    switch (error.type) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return 'Invalid email or password. Please try again.';
      case AuthErrorType.INVALID_EMAIL_DOMAIN:
        return 'Access restricted to Niobi employees only.';
      case AuthErrorType.EMAIL_NOT_VERIFIED:
        return 'Please verify your email address before logging in.';
      case AuthErrorType.ACCOUNT_LOCKED:
        return 'Your account has been locked. Please contact support.';
      case AuthErrorType.SESSION_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case AuthErrorType.NETWORK_ERROR:
        return 'Unable to connect to the server. Please check your internet connection.';
      case AuthErrorType.RATE_LIMITED:
        return error.message || 'Too many attempts. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }, []);
  
  return {
    error,
    handleAuthError,
    clearError,
    getErrorMessage,
    hasError: !!error,
    isRateLimited: error?.type === AuthErrorType.RATE_LIMITED,
    isNetworkError: error?.type === AuthErrorType.NETWORK_ERROR,
    isSessionExpired: error?.type === AuthErrorType.SESSION_EXPIRED
  };
}

/**
 * Hook for managing login form state and validation
 */
export function useLoginForm() {
  const { login } = useAuth();
  const { validateEmail } = useEmailValidation();
  const { error, handleAuthError, clearError, getErrorMessage } = useAuthError();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const submitLogin = useCallback(async (email: string, password: string) => {
    // Clear any previous errors
    clearError();
    
    // Validate email first
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      handleAuthError({
        type: AuthErrorType.INVALID_EMAIL_DOMAIN,
        message: emailValidation.error || 'Invalid email'
      });
      return false;
    }
    
    // Validate password
    if (!password || password.length < 1) {
      handleAuthError({
        type: AuthErrorType.UNKNOWN_ERROR,
        message: 'Password is required'
      });
      return false;
    }
    
    try {
      setIsSubmitting(true);
      await login(email, password);
      return true;
    } catch (error) {
      handleAuthError(error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [login, validateEmail, handleAuthError, clearError]);
  
  return {
    submitLogin,
    isSubmitting,
    error,
    clearError,
    getErrorMessage: error ? getErrorMessage(error) : null,
    hasError: !!error
  };
}

/**
 * Hook for logout functionality with loading state
 */
export function useLogout() {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Logout should always succeed locally even if server fails
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout]);
  
  return {
    handleLogout,
    isLoggingOut
  };
}

/**
 * Hook for checking if user has specific permissions (future use)
 */
export function usePermissions() {
  const { user } = useAuth();
  
  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user]);
  
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  }, [user]);
  
  return {
    hasRole,
    hasAnyRole,
    userRole: user?.role,
    isAdmin: hasRole('admin'),
    isUser: hasRole('user')
  };
}