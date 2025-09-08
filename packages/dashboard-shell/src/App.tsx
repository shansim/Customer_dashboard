/**
 * Main Application Component
 * 
 * Sets up routing, authentication, and layout for the dashboard shell application.
 * Includes error boundaries, loading states, and comprehensive error handling.
 */

import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { Breadcrumbs } from './components/Navigation/Breadcrumbs';
import { ErrorBoundary, NetworkErrorHandler } from './components/ErrorBoundary';
import { LoadingScreen, LoadingSpinner } from './components/Loading';
import { NotificationProvider } from '@niobi/shared-components';
import { routes, getRouteTitle } from './config/routes';

// ============================================================================
// Document Title Manager
// ============================================================================

/**
 * Component that updates document title based on current route
 */
const DocumentTitleManager: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const title = getRouteTitle(location.pathname);
    document.title = title;
  }, [location.pathname]);

  return null;
};

// ============================================================================
// Route Renderer
// ============================================================================

/**
 * Component that renders routes with proper authentication guards and error boundaries
 */
const RouteRenderer: React.FC = () => {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Render all configured routes */}
      {routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <ErrorBoundary
              level="page"
              name={route.title || 'Page'}
              showReload={true}
              showRetry={true}
            >
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <LoadingSpinner size="lg" message="Loading page..." />
                  </div>
                }
              >
                {route.requiresAuth ? (
                  <ProtectedRoute>
                    {route.path.startsWith('/dashboard') && route.path !== '/login' ? (
                      <DashboardLayout>
                        <Breadcrumbs />
                        <route.component />
                      </DashboardLayout>
                    ) : (
                      <route.component />
                    )}
                  </ProtectedRoute>
                ) : (
                  <route.component />
                )}
              </Suspense>
            </ErrorBoundary>
          }
        />
      ))}
      
      {/* Catch-all route for 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

// ============================================================================
// App Content Component
// ============================================================================

/**
 * App content that handles authentication loading states
 */
const AppContent: React.FC = () => {
  const { isLoading } = useAuth();

  // Show loading screen while authentication is initializing
  if (isLoading) {
    return <LoadingScreen 
      message="Initializing application..." 
      variant="auth"
      timeout={15000}
      onTimeout={() => {
        console.warn('App initialization timeout');
        // Could show error message or retry option
      }}
    />;
  }

  return (
    <NetworkErrorHandler>
      <DocumentTitleManager />
      <RouteRenderer />
    </NetworkErrorHandler>
  );
};

// ============================================================================
// Main App Component
// ============================================================================

/**
 * Main application component with routing and authentication
 * Includes comprehensive error handling and loading states
 */
export const App: React.FC = () => {
  return (
    <ErrorBoundary
      level="page"
      name="Application"
      onError={(error, errorInfo) => {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Application Error:', error, errorInfo);
        }
        
        // In production, you might want to send this to an error reporting service
        // Example: errorReportingService.captureException(error, { extra: errorInfo });
      }}
    >
      <NotificationProvider position="top-right" maxNotifications={3}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;