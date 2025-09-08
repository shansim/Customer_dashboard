/**
 * Network Error Handler Component
 * 
 * Handles network connectivity issues and provides graceful degradation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ErrorMessage } from '@niobi/shared-components';

export interface NetworkErrorHandlerProps {
  children: React.ReactNode;
  onNetworkError?: (isOnline: boolean) => void;
  showOfflineMessage?: boolean;
  retryInterval?: number;
}

export const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({
  children,
  onNetworkError,
  showOfflineMessage = true,
  retryInterval = 30000, // 30 seconds
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRetryMessage, setShowRetryMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isDevelopment = import.meta.env.DEV;

  const checkNetworkStatus = useCallback(async () => {
    // In development mode, always assume we're online
    if (isDevelopment) {
      setIsOnline(true);
      return true;
    }

    try {
      // In production, try to fetch a small resource to test connectivity
      // Use a more reliable endpoint or fallback to browser status
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      const online = response.ok;
      setIsOnline(online);
      
      if (online && !isOnline) {
        // Network restored
        setShowRetryMessage(false);
        setRetryCount(0);
      }
      
      return online;
    } catch (error) {
      // If fetch fails, fall back to browser's online status
      const browserOnline = navigator.onLine;
      setIsOnline(browserOnline);
      return browserOnline;
    }
  }, [isOnline, isDevelopment]);

  const handleRetry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    const online = await checkNetworkStatus();
    
    if (!online) {
      setShowRetryMessage(true);
      // Auto-retry after interval
      setTimeout(() => {
        if (!isOnline) {
          handleRetry();
        }
      }, retryInterval);
    }
  }, [checkNetworkStatus, isOnline, retryInterval]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRetryMessage(false);
      setRetryCount(0);
      onNetworkError?.(true);
    };

    const handleOffline = () => {
      // In development mode, ignore offline events
      if (isDevelopment) {
        return;
      }
      setIsOnline(false);
      onNetworkError?.(false);
    };

    // Listen for browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // In development mode, don't do periodic checks
    if (!isDevelopment) {
      // Periodic connectivity check only in production
      const intervalId = setInterval(checkNetworkStatus, retryInterval);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(intervalId);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkNetworkStatus, onNetworkError, retryInterval, isDevelopment]);

  // In development mode, never show offline message
  if (!isOnline && showOfflineMessage && !isDevelopment) {
    return (
      <div style={{ padding: '1rem' }}>
        <ErrorMessage
          title="Connection Lost"
          message="You appear to be offline. Some features may not work properly until your connection is restored."
          variant="banner"
          onRetry={handleRetry}
          retryLabel={retryCount > 0 ? `Retry (${retryCount})` : 'Check Connection'}
        />
        
        {/* Show children in degraded mode */}
        <div style={{ opacity: 0.7, pointerEvents: 'none' }}>
          {children}
        </div>
      </div>
    );
  }

  // Show retry message if user manually retried but still offline
  if (showRetryMessage && !isOnline && !isDevelopment) {
    return (
      <div style={{ padding: '1rem' }}>
        <ErrorMessage
          title="Still Offline"
          message={`Connection attempt ${retryCount} failed. Automatically retrying in ${retryInterval / 1000} seconds...`}
          variant="banner"
          onRetry={handleRetry}
          retryLabel="Try Now"
        />
        
        <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default NetworkErrorHandler;