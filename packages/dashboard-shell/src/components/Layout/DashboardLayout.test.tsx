import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { DashboardLayout } from './DashboardLayout';

// Mock the useAuth hook
const mockUser = {
  id: '1',
  email: 'test@niobi.co',
  name: 'Test User',
  role: 'user',
  createdAt: '2024-01-01T00:00:00Z'
};

const mockAuth = {
  user: mockUser,
  token: 'mock-token',
  login: vi.fn(),
  logout: vi.fn(),
  isLoading: false,
  isAuthenticated: true
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuth
}));

// Mock window.innerWidth for responsive tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('DashboardLayout', () => {
  it('renders dashboard layout with children', () => {
    renderWithRouter(
      <DashboardLayout>
        <div data-testid="test-content">Test Content</div>
      </DashboardLayout>
    );

    // Check if content is rendered
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders basic layout structure', () => {
    renderWithRouter(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Check if basic elements are present
    expect(screen.getByText('Niobi')).toBeInTheDocument();
    expect(screen.getByText('Customer Success Dashboard')).toBeInTheDocument();
  });
});