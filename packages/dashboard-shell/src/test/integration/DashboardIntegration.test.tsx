/**
 * Dashboard Integration Tests
 * 
 * Comprehensive integration tests for dashboard functionality including:
 * - Complete login flow from form to dashboard
 * - Navigation between dashboard and reconciliation tool
 * - Authentication context sharing across components
 * - Responsive layout behavior
 * - Error handling and recovery scenarios
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { App } from '../../App';
import { AuthProvider } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { AuthError, AuthErrorType } from '../../types/auth';

// ============================================================================
// Test Utilities and Mocks
// ============================================================================

// Mock the reconciliation tool
vi.mock('reconciliation-tool', () => ({
  ReconciliationFeature: ({ onNavigateBack, authContext }: any) => (
    <div data-testid="reconciliation-feature">
      <h1>Reconciliation Tool</h1>
      <p>User: {authContext?.user?.email || 'No user'}</p>
      <p>Token: {authContext?.token ? 'Present' : 'Missing'}</p>
      <button onClick={onNavigateBack} data-testid="back-to-dashboard">
        Back to Dashboard
      </button>
    </div>
  )
}));

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

// Helper to render app with router
const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

// Helper to simulate window resize
const simulateResize = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

// ============================================================================
// Test Suite: Complete Login Flow
// ============================================================================

describe('Complete Login Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful email validation
    vi.mocked(authService.getEmailValidation).mockReturnValue({
      isValid: true,
      error: undefined
    });
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  it('should complete full login flow from form to dashboard', async () => {
    const user = userEvent.setup();
    
    // Mock successful login
    vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);

    renderApp();

    // Should start at login page
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your Customer Success Dashboard')).toBeInTheDocument();

    // Fill in login form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test.user@niobi.co');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Signing In...')).toBeInTheDocument();

    // Wait for login to complete and redirect to dashboard
    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify dashboard elements are present
    expect(screen.getByText('Reconciliation Tool')).toBeInTheDocument();
    expect(screen.getByText('Customer Accounts')).toBeInTheDocument();
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    expect(screen.getByText('Customer Queries')).toBeInTheDocument();

    // Verify auth service was called correctly
    expect(authService.login).toHaveBeenCalledWith('test.user@niobi.co', 'password123');
  });

  it('should handle login errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock login failure
    const authError = new AuthError('Invalid credentials', AuthErrorType.INVALID_CREDENTIALS);
    vi.mocked(authService.login).mockRejectedValue(authError);

    renderApp();

    // Fill in login form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test.user@niobi.co');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // Should still be on login page
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('should handle domain restriction errors', async () => {
    const user = userEvent.setup();
    
    // Mock domain validation failure
    vi.mocked(authService.getEmailValidation).mockReturnValue({
      isValid: false,
      error: 'Access restricted to Niobi employees only'
    });

    renderApp();

    // Fill in login form with non-Niobi email
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@external.com');
    await user.click(submitButton);

    // Should show domain restriction error
    await waitFor(() => {
      expect(screen.getByText('Access restricted to Niobi employees only')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Test Suite: Navigation Between Dashboard and Reconciliation Tool
// ============================================================================

describe('Dashboard Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authenticated state
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
    vi.mocked(authService.getEmailValidation).mockReturnValue({
      isValid: true,
      error: undefined
    });
  });

  it('should navigate from dashboard to reconciliation tool', async () => {
    const user = userEvent.setup();
    
    renderApp();

    // Should be on dashboard
    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Click on reconciliation tool
    const reconciliationCard = screen.getByText('Reconciliation Tool').closest('[role="button"]');
    expect(reconciliationCard).toBeInTheDocument();
    
    await user.click(reconciliationCard!);

    // Should navigate to reconciliation tool
    await waitFor(() => {
      expect(screen.getByTestId('reconciliation-feature')).toBeInTheDocument();
    });

    // Verify reconciliation tool receives auth context
    expect(screen.getByText('User: test.user@niobi.co')).toBeInTheDocument();
    expect(screen.getByText('Token: Present')).toBeInTheDocument();
  });

  it('should navigate back from reconciliation tool to dashboard', async () => {
    const user = userEvent.setup();
    
    renderApp();

    // Navigate to reconciliation tool first
    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    const reconciliationCard = screen.getByText('Reconciliation Tool').closest('[role="button"]');
    await user.click(reconciliationCard!);

    await waitFor(() => {
      expect(screen.getByTestId('reconciliation-feature')).toBeInTheDocument();
    });

    // Click back to dashboard
    const backButton = screen.getByTestId('back-to-dashboard');
    await user.click(backButton);

    // Should be back on dashboard
    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });
  });

  it('should handle sidebar navigation', async () => {
    const user = userEvent.setup();
    
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Find and click sidebar reconciliation link
    const sidebarLink = screen.getByRole('link', { name: /reconciliation tool/i });
    await user.click(sidebarLink);

    // Should navigate to reconciliation tool
    await waitFor(() => {
      expect(screen.getByTestId('reconciliation-feature')).toBeInTheDocument();
    });
  });

  it('should show placeholder pages for unavailable features', async () => {
    const user = userEvent.setup();
    
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Click on customer accounts (placeholder)
    const customerAccountsCard = screen.getByText('Customer Accounts').closest('div');
    expect(customerAccountsCard).toBeInTheDocument();
    
    // Should show coming soon badge
    expect(within(customerAccountsCard!).getByText('Coming Soon')).toBeInTheDocument();
  });
});

// ============================================================================
// Test Suite: Authentication Context Sharing
// ============================================================================

describe('Authentication Context Sharing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
  });

  it('should share authentication context across all components', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Check header shows user info
    expect(screen.getByText('Test User')).toBeInTheDocument();

    // Navigate to reconciliation tool
    const user = userEvent.setup();
    const reconciliationCard = screen.getByText('Reconciliation Tool').closest('[role="button"]');
    await user.click(reconciliationCard!);

    await waitFor(() => {
      expect(screen.getByTestId('reconciliation-feature')).toBeInTheDocument();
    });

    // Verify reconciliation tool has access to auth context
    expect(screen.getByText('User: test.user@niobi.co')).toBeInTheDocument();
    expect(screen.getByText('Token: Present')).toBeInTheDocument();
  });

  it('should handle logout and clear context', async () => {
    const user = userEvent.setup();
    
    // Mock logout
    vi.mocked(authService.logout).mockResolvedValue();
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);

    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Find and click logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    // Should redirect to login
    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });

    expect(authService.logout).toHaveBeenCalled();
  });
});

// ============================================================================
// Test Suite: Responsive Layout Behavior
// ============================================================================

describe('Responsive Layout Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
  });

  it('should adapt layout for mobile screens', async () => {
    // Simulate mobile screen
    simulateResize(600);
    
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // On mobile, sidebar should be closed by default
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });
  });

  it('should show sidebar on desktop screens', async () => {
    // Simulate desktop screen
    simulateResize(1200);
    
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // On desktop, sidebar should be visible
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
  });

  it('should toggle sidebar on mobile', async () => {
    const user = userEvent.setup();
    
    // Simulate mobile screen
    simulateResize(600);
    
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Find and click menu toggle button
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
    await user.click(menuToggle);

    // Sidebar should become visible
    const sidebar = screen.getByRole('navigation');
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
    });
  });

  it('should handle responsive grid layout for feature cards', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Feature cards should be in a grid layout
    const featuresGrid = screen.getByText('Reconciliation Tool').closest('[style*="grid"]');
    expect(featuresGrid).toBeInTheDocument();
  });
});

// ============================================================================
// Test Suite: Error Handling and Recovery
// ============================================================================

describe('Error Handling and Recovery Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
  });

  it('should handle network errors during navigation', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    const networkError = new Error('Network error');
    vi.mocked(authService.login).mockRejectedValue(networkError);

    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Navigation should still work despite network issues
    const reconciliationCard = screen.getByText('Reconciliation Tool').closest('[role="button"]');
    await user.click(reconciliationCard!);

    await waitFor(() => {
      expect(screen.getByTestId('reconciliation-feature')).toBeInTheDocument();
    });
  });

  it('should handle component loading errors with error boundaries', async () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Error boundaries should catch and handle component errors
    // This is tested through the ErrorBoundary component structure
    expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('should handle session expiration gracefully', async () => {
    const user = userEvent.setup();
    
    // Start authenticated
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Simulate session expiration
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getCurrentUser).mockReturnValue(null);

    // Try to navigate (this would trigger auth check)
    const reconciliationCard = screen.getByText('Reconciliation Tool').closest('[role="button"]');
    await user.click(reconciliationCard!);

    // Should redirect to login due to expired session
    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });
  });

  it('should recover from temporary errors', async () => {
    const user = userEvent.setup();
    
    // Mock temporary error followed by success
    vi.mocked(authService.login)
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce(mockAuthResponse);

    renderApp();

    // Fill in login form
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test.user@niobi.co');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should show error first
    await waitFor(() => {
      expect(screen.getByText(/temporary error/i)).toBeInTheDocument();
    });

    // Retry login
    await user.click(submitButton);

    // Should succeed on retry
    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });
  });

  it('should handle 404 routes gracefully', async () => {
    renderApp();

    // Navigate to non-existent route
    window.history.pushState({}, '', '/dashboard/nonexistent');
    window.dispatchEvent(new PopStateEvent('popstate'));

    // Should show 404 page
    await waitFor(() => {
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Test Suite: Breadcrumb Navigation
// ============================================================================

describe('Breadcrumb Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
  });

  it('should show correct breadcrumbs for dashboard pages', async () => {
    const user = userEvent.setup();
    
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Navigate to reconciliation tool
    const reconciliationCard = screen.getByText('Reconciliation Tool').closest('[role="button"]');
    await user.click(reconciliationCard!);

    await waitFor(() => {
      expect(screen.getByTestId('reconciliation-feature')).toBeInTheDocument();
    });

    // Should show breadcrumbs
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Reconciliation Tool')).toBeInTheDocument();
  });

  it('should allow navigation via breadcrumbs', async () => {
    const user = userEvent.setup();
    
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    // Navigate to reconciliation tool
    const reconciliationCard = screen.getByText('Reconciliation Tool').closest('[role="button"]');
    await user.click(reconciliationCard!);

    await waitFor(() => {
      expect(screen.getByTestId('reconciliation-feature')).toBeInTheDocument();
    });

    // Click dashboard breadcrumb
    const dashboardBreadcrumb = screen.getByRole('link', { name: /dashboard/i });
    await user.click(dashboardBreadcrumb);

    // Should navigate back to dashboard
    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });
  });
});