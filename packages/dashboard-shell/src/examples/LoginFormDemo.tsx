/**
 * LoginForm Demo Component
 * 
 * Demonstrates the LoginForm component with proper Niobi branding
 * and authentication integration.
 */

import React from 'react';
import { LoginForm } from '../components/Auth/LoginForm';
import { AuthProvider } from '../contexts/AuthContext';

export const LoginFormDemo: React.FC = () => {
  const handleSuccess = () => {
    console.log('Login successful!');
  };

  const handleError = (error: any) => {
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
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </AuthProvider>
  );
};

export default LoginFormDemo;