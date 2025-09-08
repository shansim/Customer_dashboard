/**
 * Route Configuration
 * 
 * Defines all routes for the dashboard application with their components,
 * authentication requirements, and metadata.
 */

// React import removed as JSX is handled by build system
import React, { useEffect, useCallback, lazy } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { DashboardRoute } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';

// Lazy load components for better performance
const DashboardHome = lazy(() => import('../components/Dashboard/DashboardHome'));
const FeaturePlaceholder = lazy(() => import('../components/Dashboard/FeaturePlaceholder'));
const LoginForm = lazy(() => import('../components/Auth/LoginForm'));
const ReconciliationWrapper = lazy(() => import('../components/Features/ReconciliationWrapper'));

// ============================================================================
// Login Page Component
// ============================================================================

/**
 * Login page component that handles navigation after successful login
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect authenticated users away from login page
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleLoginSuccess = () => {
    // Navigate to dashboard or the originally requested page
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  return <LoginForm onSuccess={handleLoginSuccess} />;
};

// ============================================================================
// Route Definitions
// ============================================================================

/**
 * All application routes with their configuration
 */
export const routes: DashboardRoute[] = [
  // Authentication Routes
  {
    path: '/login',
    component: LoginPage,
    requiresAuth: false,
    title: 'Login - Niobi Customer Success',
    breadcrumb: 'Login'
  },

  // Dashboard Routes
  {
    path: '/dashboard',
    component: DashboardHome,
    requiresAuth: true,
    title: 'Dashboard - Niobi Customer Success',
    breadcrumb: 'Dashboard'
  },

  // Feature Routes
  {
    path: '/dashboard/reconciliation',
    component: ReconciliationWrapper,
    requiresAuth: true,
    title: 'Reconciliation Tool - Niobi Customer Success',
    breadcrumb: 'Reconciliation Tool'
  },

  {
    path: '/dashboard/customers',
    component: () => (
      <FeaturePlaceholder
        title="Customer Accounts"
        description="Manage customer information, accounts, and relationship data. This comprehensive tool will help you track customer interactions and maintain detailed customer profiles."
        icon="👥"
      />
    ),
    requiresAuth: true,
    title: 'Customer Accounts - Niobi Customer Success',
    breadcrumb: 'Customer Accounts'
  },

  {
    path: '/dashboard/reports',
    component: () => (
      <FeaturePlaceholder
        title="Reports & Analytics"
        description="Generate comprehensive reports and analyze customer success metrics. Get insights into customer behavior, financial trends, and operational performance."
        icon="📈"
      />
    ),
    requiresAuth: true,
    title: 'Reports & Analytics - Niobi Customer Success',
    breadcrumb: 'Reports & Analytics'
  },

  {
    path: '/dashboard/queries',
    component: () => (
      <FeaturePlaceholder
        title="Customer Queries"
        description="Handle customer inquiries and support requests efficiently. Track, manage, and resolve customer issues with comprehensive workflow management."
        icon="💬"
      />
    ),
    requiresAuth: true,
    title: 'Customer Queries - Niobi Customer Success',
    breadcrumb: 'Customer Queries'
  },

  // Error Routes
  {
    path: '/unauthorized',
    component: () => (
      <FeaturePlaceholder
        title="Access Denied"
        description="You don't have permission to access this resource. Please contact your administrator if you believe this is an error."
        icon="🚫"
      />
    ),
    requiresAuth: false,
    title: 'Unauthorized - Niobi Customer Success',
    breadcrumb: 'Unauthorized'
  },

  {
    path: '/404',
    component: () => (
      <FeaturePlaceholder
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Please check the URL or navigate back to the dashboard."
        icon="🔍"
      />
    ),
    requiresAuth: false,
    title: 'Page Not Found - Niobi Customer Success',
    breadcrumb: 'Not Found'
  }
];

// ============================================================================
// Route Utilities
// ============================================================================

/**
 * Find route configuration by path
 */
export const findRouteByPath = (path: string): DashboardRoute | undefined => {
  return routes.find(route => route.path === path);
};

/**
 * Get all protected routes
 */
export const getProtectedRoutes = (): DashboardRoute[] => {
  return routes.filter(route => route.requiresAuth);
};

/**
 * Get all public routes
 */
export const getPublicRoutes = (): DashboardRoute[] => {
  return routes.filter(route => !route.requiresAuth);
};

/**
 * Get route title by path
 */
export const getRouteTitle = (path: string): string => {
  const route = findRouteByPath(path);
  return route?.title || 'Niobi Customer Success';
};

/**
 * Get route breadcrumb by path
 */
export const getRouteBreadcrumb = (path: string): string => {
  const route = findRouteByPath(path);
  return route?.breadcrumb || 'Unknown';
};