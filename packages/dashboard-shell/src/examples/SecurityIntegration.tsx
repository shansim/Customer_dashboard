/**
 * Security Integration Example
 * 
 * This example shows how to integrate the security components
 * into a dashboard application.
 */

import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { SecurityMonitor, SessionTimeoutWarning } from '../components/Security';

// ============================================================================
// Example Dashboard App with Security
// ============================================================================

export function SecureDashboardApp() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Security Components */}
        <SecurityMonitor showAlerts={true} maxAlerts={5} />
        <SessionTimeoutWarning warningTimeMinutes={5} />
        
        {/* Main App Content */}
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Secure Dashboard
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Security Status Card */}
            <SecurityStatusCard />
            
            {/* Recent Activity Card */}
            <RecentActivityCard />
            
            {/* Session Info Card */}
            <SessionInfoCard />
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

// ============================================================================
// Security Status Card
// ============================================================================

function SecurityStatusCard() {
  const { useSecurityStatus } = require('../components/Security/SecurityMonitor');
  const { securityScore, hasRecentFailedAttempts, hasHighRiskEvents } = useSecurityStatus();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#025041]';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-[#f0f7f6]';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Security Status
      </h3>
      
      <div className={`rounded-lg p-4 ${getScoreBg(securityScore)}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Security Score
          </span>
          <span className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
            {securityScore}/100
          </span>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        {hasRecentFailedAttempts && (
          <div className="flex items-center text-sm text-yellow-700">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Recent failed login attempts detected
          </div>
        )}
        
        {hasHighRiskEvents && (
          <div className="flex items-center text-sm text-red-700">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            High-risk security events detected
          </div>
        )}
        
        {!hasRecentFailedAttempts && !hasHighRiskEvents && (
          <div className="flex items-center text-sm text-[#025041]">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            All security checks passed
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Recent Activity Card
// ============================================================================

function RecentActivityCard() {
  const { useSecurityStatus } = require('../components/Security/SecurityMonitor');
  const { recentEvents } = useSecurityStatus();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Recent Security Events
      </h3>
      
      <div className="space-y-3">
        {recentEvents.slice(0, 5).map((event) => (
          <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-3 ${
                event.riskLevel === 'HIGH' ? 'bg-red-500' :
                event.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-[#025041]'
              }`} />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {event.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              event.success ? 'bg-[#f0f7f6] text-[#025041]' : 'bg-red-100 text-red-800'
            }`}>
              {event.success ? 'Success' : 'Failed'}
            </span>
          </div>
        ))}
        
        {recentEvents.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No recent security events
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Session Info Card
// ============================================================================

function SessionInfoCard() {
  const { authService } = require('../services/authService');
  const session = authService.getCurrentSession();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Session Information
      </h3>
      
      {session ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">User</p>
            <p className="text-sm text-gray-900">{session.user.name}</p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">Session Expires</p>
            <p className="text-sm text-gray-900">
              {new Date(session.expiresAt).toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700">Last Activity</p>
            <p className="text-sm text-gray-900">
              {session.lastActivity ? 
                new Date(session.lastActivity).toLocaleString() : 
                'Unknown'
              }
            </p>
          </div>
          
          <div className="pt-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-[#025041] rounded-full mr-2" />
              <span className="text-sm text-[#025041]">Session Active</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No active session</p>
      )}
    </div>
  );
}

export default SecureDashboardApp;