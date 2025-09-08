/**
 * Session Timeout Warning Component
 * 
 * Displays a warning modal when the user's session is about to expire,
 * giving them the option to extend their session.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface SessionTimeoutWarningProps {
  warningTimeMinutes?: number; // Show warning X minutes before expiry
  className?: string;
}

// ============================================================================
// Session Timeout Warning Component
// ============================================================================

export function SessionTimeoutWarning({ 
  warningTimeMinutes = 5,
  className = ''
}: SessionTimeoutWarningProps) {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  // ============================================================================
  // Session Monitoring
  // ============================================================================

  const checkSessionExpiry = useCallback(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    const session = authService.getCurrentSession();
    if (!session) {
      setShowWarning(false);
      return;
    }

    const now = Date.now();
    const expiresAt = session.expiresAt;
    const warningThreshold = warningTimeMinutes * 60 * 1000;
    const timeUntilExpiry = expiresAt - now;

    if (timeUntilExpiry <= 0) {
      // Session has expired
      setShowWarning(false);
      logout();
      return;
    }

    if (timeUntilExpiry <= warningThreshold && !showWarning) {
      // Show warning
      setShowWarning(true);
      setTimeRemaining(Math.ceil(timeUntilExpiry / 1000));
    } else if (timeUntilExpiry > warningThreshold && showWarning) {
      // Hide warning if session was extended
      setShowWarning(false);
    }

    if (showWarning) {
      setTimeRemaining(Math.ceil(timeUntilExpiry / 1000));
    }
  }, [isAuthenticated, warningTimeMinutes, showWarning, logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check immediately
    checkSessionExpiry();

    // Check every 10 seconds
    const interval = setInterval(checkSessionExpiry, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkSessionExpiry]);

  // ============================================================================
  // Session Extension
  // ============================================================================

  const extendSession = useCallback(async () => {
    if (isExtending) return;

    setIsExtending(true);
    try {
      await authService.refreshToken();
      setShowWarning(false);
      setTimeRemaining(0);
    } catch (error) {
      console.error('Failed to extend session:', error);
      // Let the session expire naturally
    } finally {
      setIsExtending(false);
    }
  }, [isExtending]);

  const logoutNow = useCallback(() => {
    setShowWarning(false);
    logout();
  }, [logout]);

  // ============================================================================
  // Time Formatting
  // ============================================================================

  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!showWarning || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div className={`bg-white rounded-lg shadow-xl max-w-md w-full ${className}`}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg 
                  className="h-6 w-6 text-yellow-500" 
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
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Session Expiring Soon
                </h3>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 mb-4">
              Your session will expire in{' '}
              <span className="font-semibold text-red-600">
                {formatTimeRemaining(timeRemaining)}
              </span>
              . Would you like to extend your session?
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-5 w-5 text-yellow-400" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    If you don't extend your session, you'll be automatically logged out 
                    and any unsaved work may be lost.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={logoutNow}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#025041]"
              disabled={isExtending}
            >
              Logout Now
            </button>
            <button
              type="button"
              onClick={extendSession}
              disabled={isExtending}
              className="px-4 py-2 text-sm font-medium text-white bg-[#025041] border border-transparent rounded-md hover:bg-[#02483a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#025041] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExtending ? (
                <>
                  <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Extending...
                </>
              ) : (
                'Extend Session'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SessionTimeoutWarning;