/**
 * LoginForm Example
 * 
 * Example usage of the LoginForm component for testing and demonstration
 */

import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { LoginForm } from '../components/Auth/LoginForm';
import { AuthError } from '../types/auth';

const LoginFormExample: React.FC = () => {
  const handleLoginSuccess = () => {
    console.log('Login successful!');
    alert('Login successful! (This is just a demo)');
  };

  const handleLoginError = (error: AuthError) => {
    console.error('Login error:', error);
  };

  return (
    <AuthProvider>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <LoginForm
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />
      </div>
    </AuthProvider>
  );
};

export default LoginFormExample;