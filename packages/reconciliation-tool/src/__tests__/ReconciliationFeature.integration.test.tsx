/**
 * ReconciliationFeature Integration Tests
 * 
 * Tests to verify that all existing functionality is preserved
 * when the reconciliation tool is integrated with the dashboard context.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReconciliationFeature } from '../ReconciliationFeature';

// Mock file reading functionality
const mockFileReader = {
  readAsText: vi.fn(),
  result: null,
  onload: null,
  onerror: null
};

// Mock FileReader
global.FileReader = vi.fn(() => mockFileReader) as any;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

describe('ReconciliationFeature Integration', () => {
  const mockAuthContext = {
    user: {
      id: '1',
      email: 'test@niobi.co',
      name: 'Test User',
      role: 'user'
    },
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false
  };

  const mockOnNavigateBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main reconciliation interface', () => {
    render(
      <ReconciliationFeature
        onNavigateBack={mockOnNavigateBack}
        authContext={mockAuthContext}
      />
    );

    // Check for main title
    expect(screen.getByText('Transaction Reconciliation Tool')).toBeInTheDocument();
    
    // Check for file upload sections
    expect(screen.getByText('Internal System Export')).toBeInTheDocument();
    expect(screen.getByText('Provider Statement')).toBeInTheDocument();
    
    // Check for processing controls
    expect(screen.getByText('Processing Controls')).toBeInTheDocument();
    expect(screen.getByText('Analyze Transactions')).toBeInTheDocument();
  });

  it('displays back button when onNavigateBack is provided', () => {
    render(
      <ReconciliationFeature
        onNavigateBack={mockOnNavigateBack}
        authContext={mockAuthContext}
      />
    );

    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('hides back button when onNavigateBack is not provided', () => {
    render(
      <ReconciliationFeature
        authContext={mockAuthContext}
      />
    );

    // Back button should not be visible
    expect(screen.queryByText('Back to Dashboard')).not.toBeInTheDocument();
  });

  it('back button calls onNavigateBack when clicked', () => {
    render(
      <ReconciliationFeature
        onNavigateBack={mockOnNavigateBack}
        authContext={mockAuthContext}
      />
    );

    const backButton = screen.getByText('Back to Dashboard');
    expect(backButton).toBeInTheDocument();
    
    fireEvent.click(backButton);
    expect(mockOnNavigateBack).toHaveBeenCalledTimes(1);
  });

  it('works without authentication context', () => {
    render(
      <ReconciliationFeature
        onNavigateBack={mockOnNavigateBack}
      />
    );

    // Should still render the main interface
    expect(screen.getByText('Transaction Reconciliation Tool')).toBeInTheDocument();
  });

  it('preserves existing functionality - file upload areas', () => {
    render(
      <ReconciliationFeature
        onNavigateBack={mockOnNavigateBack}
        authContext={mockAuthContext}
      />
    );

    // Check for upload descriptions
    expect(screen.getByText(/Upload your internal transaction export/)).toBeInTheDocument();
    expect(screen.getByText(/Upload your provider transaction statement/)).toBeInTheDocument();
  });

  it('preserves existing functionality - instructions section', () => {
    render(
      <ReconciliationFeature
        onNavigateBack={mockOnNavigateBack}
        authContext={mockAuthContext}
      />
    );

    expect(screen.getByText('How to Use This Tool')).toBeInTheDocument();
    expect(screen.getByText('Supported File Formats')).toBeInTheDocument();
    expect(screen.getByText('What This Tool Does')).toBeInTheDocument();
  });

  it('analyze button is disabled initially', () => {
    render(
      <ReconciliationFeature
        onNavigateBack={mockOnNavigateBack}
        authContext={mockAuthContext}
      />
    );

    const analyzeButton = screen.getByText('Analyze Transactions');
    expect(analyzeButton).toBeDisabled();
  });
});