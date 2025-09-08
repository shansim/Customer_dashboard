/**
 * ReconciliationWrapper Integration Tests
 * 
 * Tests the integration between the dashboard shell and reconciliation tool,
 * ensuring proper context passing and navigation functionality.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReconciliationWrapper } from '../ReconciliationWrapper';
import { AuthContext } from '../../../contexts/AuthContext';
import { AuthContextType } from '../../../types/auth';

// Mock the reconciliation-tool module
vi.mock('reconciliation-tool', () => ({
  ReconciliationFeature: ({ onNavigateBack, showBreadcrumbs, authContext }: any) => (
    <div data-testid="reconciliation-feature">
      <div data-testid="auth-user">{authContext?.user?.name || 'No user'}</div>
      <div data-testid="auth-status">{authContext?.isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      <div data-testid="breadcrumbs-status">{showBreadcrumbs ? 'Breadcrumbs enabled' : 'Breadcrumbs disabled'}</div>
      {onNavigateBack && (
        <button data-testid="back-button" onClick={onNavigateBack}>
          Back to Dashboard
        </button>
      )}
    </div>
  )
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ReconciliationWrapper', () => {
  const mockAuthContext: AuthContextType = {
    user: {
      id: '1',
      email: 'test@niobi.co',
      name: 'Test User',
      role: 'user',
      createdAt: '2024-01-01'
    },
    token: 'mock-token',
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
    isAuthenticated: true
  };

  const renderWithAuth = (authContext: AuthContextType) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authContext}>
          <ReconciliationWrapper />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the ReconciliationFeature component', () => {
    renderWithAuth(mockAuthContext);
    
    expect(screen.getByTestId('reconciliation-feature')).toBeInTheDocument();
  });

  it('passes authentication context to ReconciliationFeature', () => {
    renderWithAuth(mockAuthContext);
    
    expect(screen.getByTestId('auth-user')).toHaveTextContent('Test User');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
  });

  it('enables breadcrumbs by default', () => {
    renderWithAuth(mockAuthContext);
    
    expect(screen.getByTestId('breadcrumbs-status')).toHaveTextContent('Breadcrumbs enabled');
  });

  it('provides navigation back functionality', () => {
    renderWithAuth(mockAuthContext);
    
    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('handles unauthenticated state', () => {
    const unauthenticatedContext: AuthContextType = {
      ...mockAuthContext,
      user: null,
      token: null,
      isAuthenticated: false
    };

    renderWithAuth(unauthenticatedContext);
    
    expect(screen.getByTestId('auth-user')).toHaveTextContent('No user');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
  });

  it('handles loading state', () => {
    const loadingContext: AuthContextType = {
      ...mockAuthContext,
      isLoading: true
    };

    renderWithAuth(loadingContext);
    
    // Component should still render even in loading state
    expect(screen.getByTestId('reconciliation-feature')).toBeInTheDocument();
  });
});