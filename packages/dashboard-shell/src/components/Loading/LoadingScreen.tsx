/**
 * Enhanced Loading Screen Component
 * 
 * Full-screen loading component with progress indication and timeout handling
 */

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingScreenProps {
  message?: string;
  progress?: number; // 0-100
  timeout?: number; // milliseconds
  onTimeout?: () => void;
  showProgress?: boolean;
  variant?: 'default' | 'auth' | 'feature';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  progress,
  timeout = 30000, // 30 seconds default
  onTimeout,
  showProgress = false,
  variant = 'default'
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (timeout > 0) {
      const timeoutId = setTimeout(() => {
        setHasTimedOut(true);
        onTimeout?.();
      }, timeout);

      // Update elapsed time every second
      const intervalId = setInterval(() => {
        setElapsedTime(prev => prev + 1000);
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
        clearInterval(intervalId);
      };
    }
  }, [timeout, onTimeout]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'auth':
        return {
          backgroundColor: '#f9fafb',
          color: '#374151',
        };
      case 'feature':
        return {
          backgroundColor: 'transparent',
          minHeight: '200px',
          color: '#6b7280',
        };
      default:
        return {
          backgroundColor: '#f9fafb',
          color: '#374151',
        };
    }
  };

  const getLogo = () => {
    if (variant === 'auth') {
      return (
        <div style={{
          width: '82px',
          height: '82px',
          margin: '0 auto 1.5rem',
          backgroundColor: '#025041',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <img src="/assets/niobi_logo.png" alt="Niobi Logo" style={{height: '32px' }} />    
        </div>
      );
    }

    return (
      <div style={{ marginBottom: '1rem' }}>
        <svg
          style={{
            width: '4rem',
            height: '4rem',
            margin: '0 auto',
            color: '#025041'
          }}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    );
  };

  const containerStyle = {
    minHeight: variant === 'feature' ? '200px' : '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...getVariantStyles()
  };

  if (hasTimedOut) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            margin: '0 auto 1rem',
            backgroundColor: '#fef3c7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg
              style={{ width: '1.5rem', height: '1.5rem', color: '#d97706' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            Taking longer than expected
          </h3>
          
          <p style={{
            color: '#6b7280',
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}>
            This is taking longer than usual. Please check your connection or try refreshing the page.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#025041',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        {getLogo()}
        
        <LoadingSpinner size="lg" message={message} />
        
        {showProgress && typeof progress === 'number' && (
          <div style={{ marginTop: '1rem', width: '200px', margin: '1rem auto 0' }}>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                  height: '100%',
                  backgroundColor: '#025041',
                  transition: 'width 0.3s ease-in-out'
                }}
              />
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginTop: '0.5rem'
            }}>
              {Math.round(progress)}% complete
            </div>
          </div>
        )}
        
        {elapsedTime > 10000 && !hasTimedOut && (
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '1rem'
          }}>
            Still loading... ({Math.round(elapsedTime / 1000)}s)
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;