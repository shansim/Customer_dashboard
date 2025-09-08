/**
 * App Component Tests
 * 
 * Tests for the main App component including error boundaries and loading states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';

// Mock the auth context
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: false,
    user: null,
    token: null,
    login: vi.fn(),
    logout: vi.fn()
  })
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="browser-router">{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div data-testid="route">{element}</div>,
  Navigate: () => <div data-testid="navigate">Navigate</div>,
  useLocation: () => ({ pathname: '/dashboard' })
}));

// Mock components
vi.mock('../components/Auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>
}));

vi.mock('../components/Layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>
}));

vi.mock('../components/Navigation/Breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>
}));

vi.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}));

vi.mock('../components/Loading', () => ({
  LoadingScreen: ({ message }: { message?: string }) => <div data-testid="loading-screen">{message}</div>,
  LoadingSpinner: ({ message }: { message?: string }) => <div data-testid="loading-spinner">{message}</div>
}));

vi.mock('../config/routes', () => ({
  routes: [
    {
      path: '/dashboard',
      component: () => <div data-testid="dashboard-home">Dashboard Home</div>,
      requiresAuth: true,
      title: 'Dashboard'
    }
  ],
  getRouteTitle: () => 'Test Title'
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<App />);
    
    expect(screen.getAllByTestId('error-boundary')).toHaveLength(2); // Top level + route level
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });

  it('includes error boundary at the top level', () => {
    render(<App />);
    
    const errorBoundaries = screen.getAllByTestId('error-boundary');
    expect(errorBoundaries.length).toBeGreaterThan(0);
  });

  it('includes router and auth provider', () => {
    render(<App />);
    
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });
});