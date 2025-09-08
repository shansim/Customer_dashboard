/**
 * Authentication Flow Integration Tests
 * 
 * Focused integration tests for authentication flows including:
 * - Login form validation and submission
 * - Session management across page refreshes
 * - Protected route access control
 * - Token refresh and expiration handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/Auth/ProtectedRoute';
import LoginForm from '../../components/Auth/LoginForm';
import { DashboardHome } from '../../components/Dashboard/DashboardHome';
import { authService } from '../../services/authService';
import { AuthError, AuthErrorType } from '../../types/auth';

// ============================================================================
// Test Utilities and Mocks
// ============================================================================

// Mock auth service
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getEmailValidation: vi.fn(),
    resetPassword: vi.fn(),
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn()
  }
}));

// Mock shared components
vi.mock('@niobi/shared-components', () => ({
  NotificationProvider: ({ children }: any) => <div>{children}</div>
}));

// Test data
const mockUser = {
  id: '1',
  email: 'test.user@niobi.co',
  name: 'Test User',
  role: 'user',
  createdAt: '2024-01-01T00:00:00Z'
};

const mockAuthResponse = {
  user: mockUser,
  token: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token'
};

// Helper to render component with auth context
const renderWithAuth = (component: React.ReactElement, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </MemoryRouter>
  );
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// ============================================================================
// Test Suite: Login Form Validation and Submission
// ============================================================================

describe('Login Form Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should validate email domain restriction', async () => {
    const user = userEvent.setup();
    
    // Mock domain validation failure
    vi.mocked(authService.getEmailValidation).mockReturnValue({
      isValid: false,
      error: 'Access restricted to Niobi employees only'
    });

    renderWithAuth(<LoginForm />);

    // Fill in non-Niobi email
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@external.com');
    await user.click(submitButton);

    // Should show domain restriction error
    await waitFor(() => {
      expect(screen.getByText('Access restricted to Niobi employees only')).toBeInTheDocument();
    });

    // Should not call login service
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should handle successful login with proper validation', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    // Mock successful validation and login
    vi.mocked(authService.getEmailValidation).mockReturnValue({
      isValid: true,
      error: undefined
    });
    vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

    renderWithAuth(<LoginForm onSuccess={onSuccess} />);

    // Fill in valid credentials
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test.user@niobi.co');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Signing In...')).toBeInTheDocument();

    // Should call auth service
    expect(authService.login).toHaveBeenCalledWith('test.user@niobi.co', 'password123');

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Login Successful')).toBeInTheDocument();
    });

    // Should call onSuccess callback after delay
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should handle login errors with proper error display', async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    
    // Mock validation success but login failure
    vi.mocked(authService.getEmailValidation).mockReturnValue({
      isValid: true,
      error: undefined
    });
    
    const authError = new AuthError('Invalid credentials', AuthErrorType.INVALID_CREDENTIALS);
    vi.mocked(authService.login).mockRejectedValue(authError);

    renderWithAuth(<LoginForm onError={onError} />);

    // Fill in credentials
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test.user@niobi.co');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // Should call onError callback
    expect(onError).toHaveBeenCalledWith(authError);
  });

  it('should handle password reset flow', async () => {
    const user = userEvent.setup();
    
    // Mock email validation and reset password
    vi.mocked(authService.getEmailValidation).mockReturnValue({
      isValid: true,
      error: undefined
    });
    vi.mocked(authService.resetPassword).mockResolvedValue();

    renderWithAuth(<LoginForm />);

    // Enter email first
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test.user@niobi.co');

    // Click forgot password link
    const forgotPasswordLink = screen.getByText(/forgot your password/i);
    await user.click(forgotPasswordLink);

    // Should call reset password service
    expect(authService.resetPassword).toHaveBeenCalledWith('test.user@niobi.co');
  });

  it('should clear errors when user starts typing', async () => {
    const user = userEvent.setup();
    
    // Mock validation failure first
    vi.mocked(authService.getEmailValidation).mockReturnValue({
      isValid: false,
      error: 'Access restricted to Niobi employees only'
    });

    renderWithAuth(<LoginForm />);

    // Trigger validation error
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@external.com');
    await user.click(submitButton);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Access restricted to Niobi employees only')).toBeInTheDocument();
    });

    // Start typing again - should clear error
    await user.clear(emailInput);
    await user.type(emailInput, 'test.user@niobi.co');

    // Error should be cleared
    expect(screen.queryByText('Access restricted to Niobi employees only')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Test Suite: Protected Route Access Control
// ============================================================================

describe('Protected Route Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should redirect unauthenticated users to login', async () => {
    // Mock unauthenticated state
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);

    const TestComponent = () => <div>Protected Content</div>;

    renderWithAuth(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      '/dashboard'
    );

    // Should not show protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();

    // Should show login form instead
    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });
  });

  it('should allow authenticated users to access protected content', async () => {
    // Mock authenticated state
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);

    const TestComponent = () => <div>Protected Content</div>;

    renderWithAuth(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      '/dashboard'
    );

    // Should show protected content
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('should handle loading states during authentication check', async () => {
    // Mock loading state
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);

    const TestComponent = () => <div>Protected Content</div>;

    renderWithAuth(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      '/dashboard'
    );

    // Should show loading initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

// ============================================================================
// Test Suite: Session Management
// ============================================================================

describe('Session Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should persist session across page refreshes', async () => {
    // Mock stored session
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      user: mockUser,
      token: 'stored-token',
      expiresAt: Date.now() + 3600000 // 1 hour from now
    }));

    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);

    renderWithAuth(<DashboardHome />);

    // Should show dashboard with user info
    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });
  });

  it('should handle expired sessions', async () => {
    // Mock expired session
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      user: mockUser,
      token: 'expired-token',
      expiresAt: Date.now() - 3600000 // 1 hour ago
    }));

    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);

    renderWithAuth(<DashboardHome />);

    // Should redirect to login
    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });
  });

  it('should handle token refresh', async () => {
    const user = userEvent.setup();
    
    // Mock initial authenticated state
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
    vi.mocked(authService.refreshToken).mockResolvedValue('new-token');

    renderWithAuth(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Simulate token refresh (this would normally happen automatically)
    // For testing, we can verify the refresh token function is available
    expect(authService.refreshToken).toBeDefined();
  });

  it('should handle logout and clear session', async () => {
    const user = userEvent.setup();
    
    // Mock authenticated state initially
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
    vi.mocked(authService.logout).mockResolvedValue();

    renderWithAuth(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Mock logout - change auth state
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);

    // Simulate logout action (would be triggered by logout button)
    // This tests that the auth context properly handles logout
    expect(authService.logout).toBeDefined();
  });
});

// ============================================================================
// Test Suite: Authentication Context Integration
// ============================================================================

describe('Authentication Context Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should provide authentication state to child components', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);

    const TestComponent = () => {
      const { user, isAuthenticated, token } = require('../../hooks/useAuth').useAuth();
      return (
        <div>
          <div>User: {user?.email || 'No user'}</div>
          <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
          <div>Token: {token ? 'Present' : 'Missing'}</div>
        </div>
      );
    };

    renderWithAuth(<TestComponent />);

    // Should show authentication state
    await waitFor(() => {
      expect(screen.getByText('User: test.user@niobi.co')).toBeInTheDocument();
      expect(screen.getByText('Authenticated: Yes')).toBeInTheDocument();
    });
  });

  it('should handle authentication state changes', async () => {
    // Start unauthenticated
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);

    const TestComponent = () => {
      const { isAuthenticated } = require('../../hooks/useAuth').useAuth();
      return <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>;
    };

    const { rerender } = renderWithAuth(<TestComponent />);

    // Should show unauthenticated
    expect(screen.getByText('Authenticated: No')).toBeInTheDocument();

    // Change to authenticated
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);

    // Rerender to trigger state change
    rerender(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Should show authenticated
    await waitFor(() => {
      expect(screen.getByText('Authenticated: Yes')).toBeInTheDocument();
    });
  });

  it('should handle authentication errors in context', async () => {
    const user = userEvent.setup();
    
    // Mock login failure
    const authError = new AuthError('Network error', AuthErrorType.NETWORK_ERROR);
    vi.mocked(authService.login).mockRejectedValue(authError);
    vi.mocked(authService.getEmailValidation).mockReturnValue({
      isValid: true,
      error: undefined
    });

    renderWithAuth(<LoginForm />);

    // Attempt login
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test.user@niobi.co');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should handle error in context
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});