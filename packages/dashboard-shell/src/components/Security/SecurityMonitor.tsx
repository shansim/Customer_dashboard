/**
 * Security Monitor Component
 * 
 * Handles security-related UI feedback including session timeouts,
 * security warnings, and audit event notifications.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { auditLogger, AuditEvent, AuditEventType } from '../../services/auditLogger';
import { useAuth } from '../../contexts/AuthContext';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  autoClose?: boolean;
  duration?: number;
}

interface SecurityMonitorProps {
  showAlerts?: boolean;
  maxAlerts?: number;
  className?: string;
}

// ============================================================================
// Security Monitor Component
// ============================================================================

export function SecurityMonitor({ 
  showAlerts = true, 
  maxAlerts = 3,
  className = ''
}: SecurityMonitorProps) {
  const { isAuthenticated, user } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);

  // ============================================================================
  // Alert Management
  // ============================================================================

  const addAlert = useCallback((alert: Omit<SecurityAlert, 'id' | 'timestamp'>) => {
    const newAlert: SecurityAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setAlerts(prev => {
      const updated = [newAlert, ...prev].slice(0, maxAlerts);
      return updated;
    });

    // Auto-close alert if specified
    if (alert.autoClose !== false) {
      const duration = alert.duration || (alert.type === 'error' ? 10000 : 5000);
      setTimeout(() => {
        removeAlert(newAlert.id);
      }, duration);
    }
  }, [maxAlerts]);

  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // ============================================================================
  // Security Event Handlers
  // ============================================================================

  useEffect(() => {
    if (!isAuthenticated) {
      setSessionWarningShown(false);
      return;
    }

    // Handle session timeout events
    const handleSessionTimeout = (event: CustomEvent) => {
      const reason = event.detail?.reason || 'unknown';
      
      addAlert({
        type: 'warning',
        title: 'Session Expired',
        message: reason === 'inactivity' 
          ? 'Your session has expired due to inactivity. Please log in again.'
          : 'Your session has expired. Please log in again.',
        autoClose: false
      });
    };

    // Handle security warnings
    const handleSecurityWarning = (event: CustomEvent) => {
      addAlert({
        type: 'warning',
        title: 'Security Warning',
        message: event.detail?.message || 'A security event has been detected.',
        duration: 8000
      });
    };

    // Handle CSRF errors
    const handleCSRFError = () => {
      addAlert({
        type: 'error',
        title: 'Security Error',
        message: 'A security token mismatch was detected. You have been logged out for your protection.',
        autoClose: false
      });
    };

    window.addEventListener('sessionTimeout', handleSessionTimeout as EventListener);
    window.addEventListener('securityWarning', handleSecurityWarning as EventListener);
    window.addEventListener('csrfError', handleCSRFError);

    return () => {
      window.removeEventListener('sessionTimeout', handleSessionTimeout as EventListener);
      window.removeEventListener('securityWarning', handleSecurityWarning as EventListener);
      window.removeEventListener('csrfError', handleCSRFError);
    };
  }, [isAuthenticated, addAlert]);

  // ============================================================================
  // Session Warning Logic
  // ============================================================================

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Check for recent failed login attempts
    const checkFailedAttempts = () => {
      const failedAttempts = auditLogger.getFailedLoginAttempts(user.email, 24 * 60 * 60 * 1000);
      
      if (failedAttempts.length > 0 && !sessionWarningShown) {
        addAlert({
          type: 'info',
          title: 'Security Notice',
          message: `There ${failedAttempts.length === 1 ? 'was' : 'were'} ${failedAttempts.length} failed login attempt${failedAttempts.length === 1 ? '' : 's'} on your account in the last 24 hours.`,
          duration: 10000
        });
        setSessionWarningShown(true);
      }
    };

    // Check immediately and then periodically
    checkFailedAttempts();
    const interval = setInterval(checkFailedAttempts, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, user, addAlert, sessionWarningShown]);

  // ============================================================================
  // Render Alerts
  // ============================================================================

  if (!showAlerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {alerts.map(alert => (
        <SecurityAlert
          key={alert.id}
          alert={alert}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Security Alert Component
// ============================================================================

interface SecurityAlertProps {
  alert: SecurityAlert;
  onClose: () => void;
}

function SecurityAlert({ alert, onClose }: SecurityAlertProps) {
  const getAlertStyles = () => {
    const baseStyles = "max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden";
    
    switch (alert.type) {
      case 'error':
        return `${baseStyles} border-l-4 border-red-500`;
      case 'warning':
        return `${baseStyles} border-l-4 border-yellow-500`;
      case 'info':
        return `${baseStyles} border-l-4 border-blue-500`;
      default:
        return `${baseStyles} border-l-4 border-gray-500`;
    }
  };

  const getIconColor = () => {
    switch (alert.type) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getIcon = () => {
    switch (alert.type) {
      case 'error':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={getAlertStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {alert.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {alert.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#025041]"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Security Status Hook
// ============================================================================

export function useSecurityStatus() {
  const { user, isAuthenticated } = useAuth();
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRecentEvents([]);
      return;
    }

    const updateEvents = () => {
      const events = auditLogger.getRecentEvents(10);
      const userEvents = events.filter(event => 
        event.userId === user.id || event.email === user.email
      );
      setRecentEvents(userEvents);
    };

    updateEvents();
    const interval = setInterval(updateEvents, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const getSecurityScore = useCallback(() => {
    if (!user) return 0;

    const failedAttempts = auditLogger.getFailedLoginAttempts(user.email, 24 * 60 * 60 * 1000);
    const highRiskEvents = recentEvents.filter(event => event.riskLevel === 'HIGH').length;
    
    let score = 100;
    score -= failedAttempts.length * 10;
    score -= highRiskEvents * 20;
    
    return Math.max(0, Math.min(100, score));
  }, [user, recentEvents]);

  return {
    recentEvents,
    securityScore: getSecurityScore(),
    hasRecentFailedAttempts: user ? auditLogger.getFailedLoginAttempts(user.email, 24 * 60 * 60 * 1000).length > 0 : false,
    hasHighRiskEvents: recentEvents.some(event => event.riskLevel === 'HIGH')
  };
}

export default SecurityMonitor;