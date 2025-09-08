/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Handles user authentication, session management, and automatic token refresh.
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  AuthContextType,
  User,
  AuthError,
  AuthErrorType,
  AuthLoadingState,
  SessionData
} from '../types/auth';
import { authService } from '../services/authService';
import { auditLogger } from '../services/auditLogger';

// ============================================================================
// Context Creation
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Auth State Management
// ============================================================================

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loadingState: AuthLoadingState;
  error: AuthError | null;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: AuthLoadingState }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: AuthError | null }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: string }
  | { type: 'INITIALIZE_SESSION'; payload: { user: User; token: string } };

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true, // Start with loading true for session restoration
  isAuthenticated: false,
  loadingState: AuthLoadingState.IDLE,
  error: null
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload !== AuthLoadingState.IDLE,
        loadingState: action.payload,
        error: null
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
        loadingState: AuthLoadingState.IDLE,
        error: null
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        loadingState: AuthLoadingState.IDLE,
        error: null
      };

    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        loadingState: AuthLoadingState.IDLE,
        error: action.payload
      };

    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        token: action.payload,
        error: null
      };

    case 'INITIALIZE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
        loadingState: AuthLoadingState.IDLE,
        error: null
      };

    default:
      return state;
  }
}

// ============================================================================
// Auth Provider Component
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ============================================================================
  // Session Restoration and Management
  // ============================================================================

  /**
   * Initialize authentication state from stored session
   */
  const initializeAuth = useCallback(async () => {
    try {
      const session = authService.getCurrentSession();
      
      if (!session) {
        dispatch({ type: 'SET_LOADING', payload: AuthLoadingState.IDLE });
        return;
      }

      // Check if session is still valid
      if (!authService.isSessionValid()) {
        // Try to refresh token if needed
        if (authService.needsTokenRefresh()) {
          try {
            dispatch({ type: 'SET_LOADING', payload: AuthLoadingState.REFRESHING_TOKEN });
            const newToken = await authService.refreshToken();
            dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: newToken });
            dispatch({ 
              type: 'INITIALIZE_SESSION', 
              payload: { user: session.user, token: newToken } 
            });
          } catch (error) {
            // Refresh failed, clear session
            await authService.logout();
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          // Session expired, clear it
          await authService.logout();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        // Session is valid, restore it
        dispatch({ 
          type: 'INITIALIZE_SESSION', 
          payload: { user: session.user, token: session.token } 
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  /**
   * Set up automatic token refresh
   */
  useEffect(() => {
    if (!state.isAuthenticated || !state.token) return;

    const refreshInterval = setInterval(async () => {
      try {
        if (authService.needsTokenRefresh()) {
          const newToken = await authService.refreshToken();
          dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: newToken });
        }
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
        // Force logout on refresh failure
        await logout();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated, state.token]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    initializeAuth();
    
    // Listen for session timeout events
    const handleSessionTimeout = (event: CustomEvent) => {
      const session = authService.getCurrentSession();
      if (session) {
        auditLogger.logSessionTimeout(
          session.user.id,
          (session as any).sessionId,
          event.detail.reason
        );
      }
      dispatch({ type: 'LOGOUT' });
    };

    window.addEventListener('sessionTimeout', handleSessionTimeout as EventListener);
    
    return () => {
      window.removeEventListener('sessionTimeout', handleSessionTimeout as EventListener);
    };
  }, [initializeAuth]);

  // ============================================================================
  // Authentication Methods
  // ============================================================================

  /**
   * Login user with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: AuthLoadingState.LOGGING_IN });
      
      const response = await authService.login(email, password);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token
        }
      });
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'SET_ERROR', payload: authError });
      throw error; // Re-throw so components can handle it
    }
  }, []);

  /**
   * Logout user and clear session
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: AuthLoadingState.LOGGING_OUT });
      
      await authService.logout();
      
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear local state even if server logout fails
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: AuthContextType = {
    user: state.user,
    token: state.token,
    login,
    logout,
    clearError,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    loadingState: state.loadingState
  };

  // ============================================================================
  // Render Provider
  // ============================================================================

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// useAuth Hook
// ============================================================================

/**
 * Hook to consume authentication context
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
// Additional Hooks for Enhanced Functionality
// ============================================================================

/**
 * Hook that provides additional auth state and utilities
 */
export function useAuthState() {
  const auth = useAuth();
  const [state] = useReducer(authReducer, initialState);
  
  return {
    ...auth,
    loadingState: state.loadingState,
    error: state.error,
    isLoggingIn: state.loadingState === AuthLoadingState.LOGGING_IN,
    isLoggingOut: state.loadingState === AuthLoadingState.LOGGING_OUT,
    isRefreshingToken: state.loadingState === AuthLoadingState.REFRESHING_TOKEN
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
    userRole: user?.role
  };
}

// ============================================================================
// Export Context for Testing
// ============================================================================

export { AuthContext };