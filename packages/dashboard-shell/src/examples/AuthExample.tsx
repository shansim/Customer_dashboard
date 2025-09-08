/**
 * Authentication Example Component
 * 
 * Demonstrates how to use the authentication context and hooks.
 * This is for documentation and testing purposes.
 */

import React, { useState } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth, useAuthStatus, useLoginForm, useLogout } from '../hooks/useAuth';

// ============================================================================
// Login Form Component
// ============================================================================

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { submitLogin, isSubmitting, hasError, getErrorMessage, clearError } = useLoginForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitLogin(email, password);
    if (success) {
      setEmail('');
      setPassword('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 border rounded-lg">
      <h2 className="text-xl font-bold">Login</h2>
      
      {hasError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {getErrorMessage}
          <button 
            type="button" 
            onClick={clearError}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.name@niobi.co"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#025041] focus:border-[#025041]"
          required
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#025041] focus:border-[#025041]"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#025041] hover:bg-[#02483a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#025041] disabled:opacity-50"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

// ============================================================================
// User Profile Component
// ============================================================================

function UserProfile() {
  const { user } = useAuth();
  const { handleLogout, isLoggingOut } = useLogout();
  const { userEmail, userName, userRole } = useAuthStatus();

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg bg-[#f0f7f6]">
      <h2 className="text-xl font-bold mb-4">Welcome!</h2>
      
      <div className="space-y-2 mb-4">
        <p><strong>Name:</strong> {userName}</p>
        <p><strong>Email:</strong> {userEmail}</p>
        <p><strong>Role:</strong> {userRole}</p>
      </div>
      
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}

// ============================================================================
// Main Example Component
// ============================================================================

function AuthExampleContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isGuest } = useAuthStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Authentication Example
        </h1>
        
        {isGuest && (
          <div className="mb-8">
            <p className="text-center text-gray-600 mb-6">
              Please log in with your @niobi.co email address
            </p>
            <LoginForm />
          </div>
        )}
        
        {isAuthenticated && <UserProfile />}
        
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold mb-2">Authentication Status:</h3>
          <ul className="space-y-1 text-sm">
            <li>Authenticated: {isAuthenticated ? '✅' : '❌'}</li>
            <li>Loading: {isLoading ? '⏳' : '✅'}</li>
            <li>Guest: {isGuest ? '👤' : '🔒'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Wrapped Example with Provider
// ============================================================================

export function AuthExample() {
  return (
    <AuthProvider>
      <AuthExampleContent />
    </AuthProvider>
  );
}

export default AuthExample;