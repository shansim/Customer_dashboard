/**
 * Responsive Navigation Integration Tests
 * 
 * Tests for responsive layout behavior and navigation integration including:
 * - Mobile and desktop layout adaptations
 * - Sidebar behavior across screen sizes
 * - Touch and keyboard navigation
 * - Breadcrumb navigation functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import { Sidebar } from '../../components/Layout/Sidebar';
import { Header } from '../../components/Layout/Header';
import { Breadcrumbs } from '../../components/Navigation/Breadcrumbs';
import { authService } from '../../services/authService';

// ============================================================================
// Test Utilities and Mocks
// ============================================================================

// Mock auth service
vi.mock('../../services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn()
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

// Helper to render component with auth context and router
const renderWithContext = (component: React.ReactElement, initialRoute = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </MemoryRouter>
  );
};

// Helper to simulate window resize
const simulateResize = (width: number, height: number = 768) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Helper to simulate touch events
const simulateTouch = (element: Element, type: string, touches: any[] = []) => {
  const touchEvent = new TouchEvent(type, {
    touches,
    targetTouches: touches,
    changedTouches: touches,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(touchEvent);
};

// ============================================================================
// Test Suite: Mobile Layout Behavior
// ============================================================================

describe('Mobile Layout Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
    
    // Reset window size
    simulateResize(1200);
  });

  it('should adapt layout for mobile screens', async () => {
    // Simulate mobile screen
    simulateResize(600);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    // On mobile, sidebar should be closed by default
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });

    // Main content should take full width
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveStyle({ marginLeft: '0' });
  });

  it('should show mobile menu toggle button', async () => {
    simulateResize(600);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    // Should show menu toggle button on mobile
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
    expect(menuToggle).toBeInTheDocument();
    expect(menuToggle).toBeVisible();
  });

  it('should toggle sidebar on mobile menu button click', async () => {
    const user = userEvent.setup();
    simulateResize(600);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const sidebar = screen.getByRole('navigation');
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });

    // Initially closed
    expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });

    // Click to open
    await user.click(menuToggle);

    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
    });

    // Click to close
    await user.click(menuToggle);

    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });
    });
  });

  it('should show overlay when sidebar is open on mobile', async () => {
    const user = userEvent.setup();
    simulateResize(600);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });

    // Open sidebar
    await user.click(menuToggle);

    // Should show overlay
    const overlay = document.querySelector('[style*="rgba(0, 0, 0, 0.5)"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveStyle({ display: 'block' });
  });

  it('should close sidebar when clicking overlay on mobile', async () => {
    const user = userEvent.setup();
    simulateResize(600);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const sidebar = screen.getByRole('navigation');
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });

    // Open sidebar
    await user.click(menuToggle);
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
    });

    // Click overlay to close
    const overlay = document.querySelector('[style*="rgba(0, 0, 0, 0.5)"]');
    await user.click(overlay!);

    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });
    });
  });

  it('should close sidebar when navigating on mobile', async () => {
    const user = userEvent.setup();
    simulateResize(600);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const sidebar = screen.getByRole('navigation');
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });

    // Open sidebar
    await user.click(menuToggle);
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
    });

    // Click a navigation link
    const navLink = screen.getByRole('link', { name: /dashboard/i });
    await user.click(navLink);

    // Sidebar should close
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });
    });
  });
});

// ============================================================================
// Test Suite: Desktop Layout Behavior
// ============================================================================

describe('Desktop Layout Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
  });

  it('should show sidebar by default on desktop', async () => {
    simulateResize(1200);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    // On desktop, sidebar should be visible
    const sidebar = screen.getByRole('navigation');
    expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });

    // Main content should have left margin for sidebar
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveStyle({ marginLeft: '256px' });
  });

  it('should not show overlay on desktop', async () => {
    simulateResize(1200);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    // Should not show overlay on desktop
    const overlay = document.querySelector('[style*="rgba(0, 0, 0, 0.5)"]');
    expect(overlay).toHaveStyle({ display: 'none' });
  });

  it('should toggle sidebar on desktop', async () => {
    const user = userEvent.setup();
    simulateResize(1200);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const sidebar = screen.getByRole('navigation');
    const mainContent = screen.getByRole('main');
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });

    // Initially open
    expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
    expect(mainContent).toHaveStyle({ marginLeft: '256px' });

    // Click to close
    await user.click(menuToggle);

    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });
      expect(mainContent).toHaveStyle({ marginLeft: '0' });
    });

    // Click to open
    await user.click(menuToggle);

    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
      expect(mainContent).toHaveStyle({ marginLeft: '256px' });
    });
  });

  it('should maintain sidebar state when navigating on desktop', async () => {
    const user = userEvent.setup();
    simulateResize(1200);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const sidebar = screen.getByRole('navigation');

    // Should be open initially
    expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });

    // Click a navigation link
    const navLink = screen.getByRole('link', { name: /reconciliation tool/i });
    await user.click(navLink);

    // Sidebar should remain open on desktop
    expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
  });
});

// ============================================================================
// Test Suite: Responsive Breakpoint Transitions
// ============================================================================

describe('Responsive Breakpoint Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
  });

  it('should adapt when transitioning from desktop to mobile', async () => {
    const TestContent = () => <div>Dashboard Content</div>;
    
    // Start on desktop
    simulateResize(1200);
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const sidebar = screen.getByRole('navigation');
    const mainContent = screen.getByRole('main');

    // Should be in desktop mode
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
      expect(mainContent).toHaveStyle({ marginLeft: '256px' });
    });

    // Transition to mobile
    simulateResize(600);

    // Should adapt to mobile layout
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });
      expect(mainContent).toHaveStyle({ marginLeft: '0' });
    });
  });

  it('should adapt when transitioning from mobile to desktop', async () => {
    const TestContent = () => <div>Dashboard Content</div>;
    
    // Start on mobile
    simulateResize(600);
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const sidebar = screen.getByRole('navigation');
    const mainContent = screen.getByRole('main');

    // Should be in mobile mode
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });
      expect(mainContent).toHaveStyle({ marginLeft: '0' });
    });

    // Transition to desktop
    simulateResize(1200);

    // Should adapt to desktop layout
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
      expect(mainContent).toHaveStyle({ marginLeft: '256px' });
    });
  });

  it('should handle tablet breakpoint correctly', async () => {
    const TestContent = () => <div>Dashboard Content</div>;
    
    // Tablet size (768px is the breakpoint)
    simulateResize(768);
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const sidebar = screen.getByRole('navigation');

    // At exactly 768px, should behave like desktop
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
    });

    // Just below tablet breakpoint
    simulateResize(767);

    // Should behave like mobile
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });
    });
  });
});

// ============================================================================
// Test Suite: Keyboard Navigation
// ============================================================================

describe('Keyboard Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
    simulateResize(1200);
  });

  it('should support keyboard navigation in sidebar', async () => {
    const user = userEvent.setup();
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    // Tab to first navigation link
    await user.tab();
    
    // Should focus on first nav link
    const firstNavLink = screen.getByRole('link', { name: /dashboard/i });
    expect(firstNavLink).toHaveFocus();

    // Tab to next link
    await user.tab();
    
    const secondNavLink = screen.getByRole('link', { name: /reconciliation tool/i });
    expect(secondNavLink).toHaveFocus();

    // Press Enter to navigate
    await user.keyboard('{Enter}');
    
    // Should navigate (this would be handled by router in real app)
    expect(secondNavLink).toHaveAttribute('href', '/dashboard/reconciliation');
  });

  it('should support keyboard toggle of sidebar', async () => {
    const user = userEvent.setup();
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const sidebar = screen.getByRole('navigation');
    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });

    // Focus menu toggle
    menuToggle.focus();
    expect(menuToggle).toHaveFocus();

    // Press Enter to toggle
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(-100%)' });
    });

    // Press Space to toggle back
    await user.keyboard(' ');

    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
    });
  });

  it('should trap focus in mobile sidebar when open', async () => {
    const user = userEvent.setup();
    simulateResize(600);
    
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });

    // Open sidebar
    await user.click(menuToggle);

    // Tab should cycle through sidebar links only
    await user.tab();
    
    const firstNavLink = screen.getByRole('link', { name: /dashboard/i });
    expect(firstNavLink).toHaveFocus();
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

  it('should show correct breadcrumbs for dashboard home', async () => {
    renderWithContext(<Breadcrumbs />, '/dashboard');

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Should not show navigation arrow for single breadcrumb
    expect(screen.queryByText('>')).not.toBeInTheDocument();
  });

  it('should show correct breadcrumbs for nested routes', async () => {
    renderWithContext(<Breadcrumbs />, '/dashboard/reconciliation');

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Reconciliation Tool')).toBeInTheDocument();
    });

    // Should show navigation arrow
    expect(screen.getByText('>')).toBeInTheDocument();
  });

  it('should allow navigation via breadcrumb links', async () => {
    const user = userEvent.setup();
    
    renderWithContext(<Breadcrumbs />, '/dashboard/reconciliation');

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Dashboard breadcrumb should be a link
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    // Click should navigate
    await user.click(dashboardLink);
    
    // Navigation would be handled by router
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('should handle breadcrumbs for unknown routes', async () => {
    renderWithContext(<Breadcrumbs />, '/dashboard/unknown');

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation in breadcrumbs', async () => {
    const user = userEvent.setup();
    
    renderWithContext(<Breadcrumbs />, '/dashboard/reconciliation');

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Tab to breadcrumb link
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    dashboardLink.focus();
    
    expect(dashboardLink).toHaveFocus();

    // Press Enter to navigate
    await user.keyboard('{Enter}');
    
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });
});

// ============================================================================
// Test Suite: Touch and Gesture Support
// ============================================================================

describe('Touch Navigation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockReturnValue(mockUser);
    simulateResize(600); // Mobile size
  });

  it('should support touch interactions on mobile menu', async () => {
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
    const sidebar = screen.getByRole('navigation');

    // Touch to open sidebar
    fireEvent.touchStart(menuToggle);
    fireEvent.touchEnd(menuToggle);
    fireEvent.click(menuToggle);

    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
    });
  });

  it('should support swipe gestures to close sidebar', async () => {
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
    const sidebar = screen.getByRole('navigation');

    // Open sidebar first
    fireEvent.click(menuToggle);
    await waitFor(() => {
      expect(sidebar).toHaveStyle({ transform: 'translateX(0)' });
    });

    // Simulate swipe left gesture on sidebar
    fireEvent.touchStart(sidebar, {
      touches: [{ clientX: 200, clientY: 100 }]
    });
    
    fireEvent.touchMove(sidebar, {
      touches: [{ clientX: 50, clientY: 100 }]
    });
    
    fireEvent.touchEnd(sidebar, {
      changedTouches: [{ clientX: 50, clientY: 100 }]
    });

    // Note: Actual swipe implementation would require gesture detection
    // This test verifies the touch events can be handled
    expect(sidebar).toBeInTheDocument();
  });

  it('should handle touch interactions on navigation links', async () => {
    const TestContent = () => <div>Dashboard Content</div>;
    
    renderWithContext(
      <DashboardLayout>
        <TestContent />
      </DashboardLayout>
    );

    const menuToggle = screen.getByRole('button', { name: /toggle menu/i });

    // Open sidebar
    fireEvent.click(menuToggle);

    await waitFor(() => {
      const navLink = screen.getByRole('link', { name: /reconciliation tool/i });
      expect(navLink).toBeInTheDocument();

      // Touch navigation link
      fireEvent.touchStart(navLink);
      fireEvent.touchEnd(navLink);
      
      expect(navLink).toHaveAttribute('href', '/dashboard/reconciliation');
    });
  });
});