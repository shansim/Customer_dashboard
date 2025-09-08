/**
 * LoginForm Component Tests
 * 
 * Comprehensive tests for the LoginForm component including validation,
 * error handling, and authentication integration.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginForm } from '../components/Auth/LoginForm';
import { AuthProvider } from '../contexts/AuthContext';
import { authService } from '../services/authService';

// Mock the auth service
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    getEmailValidation: vi.fn(),
    resetPassword: vi.fn()
  }
}));

// Test wrapper with AuthProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with all required elements', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByText('NIOBI')).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your Customer Success Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument();
  });

  it('validates email domain restriction', async () => {
    const mockGetEmailValidation = vi.mocked(authService.getEmailValidation);
    mockGetEmailValidation.mockReturnValue({
      isValid: false,
      isNiobiDomain: false,
      error: 'Access restricted to Niobi employees only'
    });

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@gmail.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Access restricted to Niobi employees only')).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    const mockGetEmailValidation = vi.mocked(authService.getEmailValidation);
    
    mockGetEmailValidation.mockReturnValue({
      isValid: true,
      isNiobiDomain: true
    });

    // Mock the useAuth hook
    const mockUseAuth = {
      login: mockLogin,
      isLoading: false,
      user: null,
      token: null,
      logout: vi.fn(),
      isAuthenticated: false
    };

    vi.doMock('../contexts/AuthContext', () => ({
      useAuth: () => mockUseAuth,
      AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
    }));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@niobi.co' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@niobi.co', 'password123');
    });
  });
});