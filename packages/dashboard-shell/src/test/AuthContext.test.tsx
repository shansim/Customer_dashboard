/**
 * AuthContext Tests
 * 
 * Comprehensive tests for the authentication context, provider, and hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useAuthState, useAuthStatus, useLoginForm, useLogout } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { AuthErrorType, User } from '../types/auth';

// ============================================================================
// Test Mocks
// ============================================================================

// Mock the auth service
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentSession: vi.fn(),
    isSessionValid: vi.fn(),
    needsTokenRefresh: vi.fn(),
    refreshToken: vi.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// ============================================================================
// Test Data
// ============================================================================

const mockUser: User = {
  id: '1',
  email: 'test@niobi.co',
  name: 'Test User',
  role: 'user',
  createdAt: '2024-01-01T00:00:00Z'
};

const mockAuthResponse = {
  user: mockUser,
  token: 'mock-token',
  refreshToken: 'mock-refresh-token'
};

const mockSessionData = {
  user: mockUser,
  token: 'mock-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: Date.now() + 1000 * 60 * 60 // 1 hour from now
};

// ============================================================================
// Test Wrapper Component
// ============================================================================

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

// ============================================================================
// AuthProvider Tests
// ============================================================================

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(authService.getCurrentSession).mockReturnValue(null);
    vi.mocked(authService.isSessionValid).mockReturnValue(false);
    vi.mocked(authService.needsTokenRefresh).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial unauthenticated state', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should restore session on initialization', async () => {
    vi.mocked(authService.getCurrentSession).mockReturnValue(mockSessionData);
    vi.mocked(authService.isSessionValid).mockReturnValue(true);

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('mock-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should refresh token on initialization if needed', async () => {
    vi.mocked(authService.getCurrentSession).mockReturnValue(mockSessionData);
    vi.mocked(authService.isSessionValid).mockReturnValue(false);
    vi.mocked(authService.needsTokenRefresh).mockReturnValue(true);
    vi.mocked(authService.refreshToken).mockResolvedValue('new-token');

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(authService.refreshToken).toHaveBeenCalled();
    expect(result.current.token).toBe('new-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should clear session if refresh fails', async () => {
    vi.mocked(authService.getCurrentSession).mockReturnValue(mockSessionData);
    vi.mocked(authService.isSessionValid).mockReturnValue(false);
    vi.mocked(authService.needsTokenRefresh).mockReturnValue(true);
    vi.mocked(authService.refreshToken).mockRejectedValue(new Error('Refresh failed'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

// ============================================================================
// useAuth Hook Tests
// ============================================================================

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentSession).mockReturnValue(null);
  });

  it('should throw error when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('should handle successful login', async () => {
    vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@niobi.co', 'password');
    });

    expect(authService.login).toHaveBeenCalledWith('test@niobi.co', 'password');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('mock-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle login failure', async () => {
    const loginError = {
      type: AuthErrorType.INVALID_CREDENTIALS,
      message: 'Invalid credentials'
    };
    vi.mocked(authService.login).mockRejectedValue(loginError);

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      act(async () => {
        await result.current.login('test@niobi.co', 'wrong-password');
      })
    ).rejects.toEqual(loginError);

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle logout', async () => {
    // Start with authenticated state
    vi.mocked(authService.getCurrentSession).mockReturnValue(mockSessionData);
    vi.mocked(authService.isSessionValid).mockReturnValue(true);

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

// ============================================================================
// useAuthStatus Hook Tests
// ============================================================================

describe('useAuthStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentSession).mockReturnValue(null);
  });

  it('should return correct status for unauthenticated user', async () => {
    const { result } = renderHook(() => useAuthStatus(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isGuest).toBe(true);
    expect(result.current.hasUser).toBe(false);
    expect(result.current.userEmail).toBeUndefined();
    expect(result.current.userName).toBeUndefined();
    expect(result.current.userRole).toBeUndefined();
  });

  it('should return correct status for authenticated user', async () => {
    vi.mocked(authService.getCurrentSession).mockReturnValue(mockSessionData);
    vi.mocked(authService.isSessionValid).mockReturnValue(true);

    const { result } = renderHook(() => useAuthStatus(), {
      wrapper: TestWrapper
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isGuest).toBe(false);
    expect(result.current.hasUser).toBe(true);
    expect(result.current.userEmail).toBe('test@niobi.co');
    expect(result.current.userName).toBe('Test User');
    expect(result.current.userRole).toBe('user');
    expect(result.current.userId).toBe('1');
  });
});

// ============================================================================
// useLoginForm Hook Tests
// ============================================================================

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentSession).mockReturnValue(null);
  });

  it('should validate email domain', async () => {
    const { result } = renderHook(() => useLoginForm(), {
      wrapper: TestWrapper
    });

    const success = await act(async () => {
      return await result.current.submitLogin('test@gmail.com', 'password');
    });

    expect(success).toBe(false);
    expect(result.current.hasError).toBe(true);
    expect(result.current.getErrorMessage).toContain('Niobi employees only');
  });

  it('should validate password requirement', async () => {
    const { result } = renderHook(() => useLoginForm(), {
      wrapper: TestWrapper
    });

    const success = await act(async () => {
      return await result.current.submitLogin('test@niobi.co', '');
    });

    expect(success).toBe(false);
    expect(result.current.hasError).toBe(true);
    expect(result.current.getErrorMessage).toContain('Password is required');
  });

  it('should handle successful login', async () => {
    vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useLoginForm(), {
      wrapper: TestWrapper
    });

    const success = await act(async () => {
      return await result.current.submitLogin('test@niobi.co', 'password');
    });

    expect(success).toBe(true);
    expect(result.current.hasError).toBe(false);
    expect(authService.login).toHaveBeenCalledWith('test@niobi.co', 'password');
  });

  it('should handle login failure', async () => {
    const loginError = {
      type: AuthErrorType.INVALID_CREDENTIALS,
      message: 'Invalid credentials'
    };
    vi.mocked(authService.login).mockRejectedValue(loginError);

    const { result } = renderHook(() => useLoginForm(), {
      wrapper: TestWrapper
    });

    const success = await act(async () => {
      return await result.current.submitLogin('test@niobi.co', 'wrong-password');
    });

    expect(success).toBe(false);
    expect(result.current.hasError).toBe(true);
    expect(result.current.getErrorMessage).toContain('Invalid email or password');
  });

  it('should clear errors', async () => {
    const { result } = renderHook(() => useLoginForm(), {
      wrapper: TestWrapper
    });

    // Create an error first
    await act(async () => {
      await result.current.submitLogin('test@gmail.com', 'password');
    });

    expect(result.current.hasError).toBe(true);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.hasError).toBe(false);
  });
});

// ============================================================================
// useLogout Hook Tests
// ============================================================================

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentSession).mockReturnValue(mockSessionData);
    vi.mocked(authService.isSessionValid).mockReturnValue(true);
  });

  it('should handle successful logout', async () => {
    vi.mocked(authService.logout).mockResolvedValue();

    const { result } = renderHook(() => useLogout(), {
      wrapper: TestWrapper
    });

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(result.current.isLoggingOut).toBe(false);
  });

  it('should handle logout failure gracefully', async () => {
    vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useLogout(), {
      wrapper: TestWrapper
    });

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(result.current.isLoggingOut).toBe(false);
    // Should not throw error - logout should always succeed locally
  });

  it('should show loading state during logout', async () => {
    let resolveLogout: () => void;
    const logoutPromise = new Promise<void>((resolve) => {
      resolveLogout = resolve;
    });
    vi.mocked(authService.logout).mockReturnValue(logoutPromise);

    const { result } = renderHook(() => useLogout(), {
      wrapper: TestWrapper
    });

    act(() => {
      result.current.handleLogout();
    });

    expect(result.current.isLoggingOut).toBe(true);

    await act(async () => {
      resolveLogout();
      await logoutPromise;
    });

    expect(result.current.isLoggingOut).toBe(false);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('AuthProvider Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentSession).mockReturnValue(null);
  });

  it('should handle complete login/logout flow', async () => {
    vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);
    vi.mocked(authService.logout).mockResolvedValue();

    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initial state should be unauthenticated
    expect(result.current.isAuthenticated).toBe(false);

    // Login
    await act(async () => {
      await result.current.login('test@niobi.co', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});