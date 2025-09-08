/**
 * Breadcrumbs Component
 * 
 * Displays navigation breadcrumbs showing the user's current location
 * within the dashboard structure with active route highlighting.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BreadcrumbItem } from '../../types/auth';
import { niobiTheme } from '@niobi/shared-components';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// Route to Breadcrumb Mapping
// ============================================================================

const routeToBreadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { label: 'Dashboard', path: '/dashboard', isActive: true }
  ],
  '/dashboard/reconciliation': [
    { label: 'Dashboard', path: '/dashboard', isActive: false },
    { label: 'Reconciliation Tool', path: '/dashboard/reconciliation', isActive: true }
  ],
  '/dashboard/customers': [
    { label: 'Dashboard', path: '/dashboard', isActive: false },
    { label: 'Customer Accounts', path: '/dashboard/customers', isActive: true }
  ],
  '/dashboard/reports': [
    { label: 'Dashboard', path: '/dashboard', isActive: false },
    { label: 'Reports & Analytics', path: '/dashboard/reports', isActive: true }
  ]
};

// ============================================================================
// Component Styles
// ============================================================================

const getBreadcrumbsStyles = () => ({
  display: 'flex',
  alignItems: 'center',
  padding: `${niobiTheme.spacing.md} 0`,
  fontSize: niobiTheme.typography.sizes.sm,
  color: niobiTheme.colors.gray[600],
  fontFamily: niobiTheme.typography.fontFamily,
});

const getBreadcrumbItemStyles = (isActive: boolean, hasLink: boolean) => ({
  color: isActive 
    ? niobiTheme.colors.gray[900] 
    : hasLink 
      ? niobiTheme.colors.primary[600] 
      : niobiTheme.colors.gray[600],
  textDecoration: hasLink ? 'none' : undefined,
  fontWeight: isActive ? niobiTheme.typography.weights.medium : niobiTheme.typography.weights.normal,
  cursor: hasLink ? 'pointer' : 'default',
  transition: 'color 0.2s ease',
});

const getBreadcrumbLinkHoverStyles = () => ({
  ':hover': {
    color: niobiTheme.colors.primary[700],
  }
});

const getSeparatorStyles = () => ({
  margin: `0 ${niobiTheme.spacing.sm}`,
  color: niobiTheme.colors.gray[400],
  userSelect: 'none' as const,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate breadcrumbs from current location
 */
const generateBreadcrumbsFromLocation = (pathname: string): BreadcrumbItem[] => {
  // Check if we have a predefined mapping
  if (routeToBreadcrumbMap[pathname]) {
    return routeToBreadcrumbMap[pathname];
  }

  // Generate breadcrumbs dynamically from path segments
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Capitalize and format segment name
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label,
      path: isLast ? undefined : currentPath,
      isActive: isLast
    });
  });

  return breadcrumbs;
};

// ============================================================================
// Main Component
// ============================================================================

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
  style
}) => {
  const location = useLocation();

  // Use provided items or generate from current location
  const breadcrumbItems = items || generateBreadcrumbsFromLocation(location.pathname);

  // Don't render breadcrumbs if there's only one item or none
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav 
      className={className}
      style={{
        ...getBreadcrumbsStyles(),
        ...style
      }}
      aria-label="Breadcrumb navigation"
    >
      <ol style={{ 
        display: 'flex', 
        alignItems: 'center', 
        listStyle: 'none', 
        margin: 0, 
        padding: 0 
      }}>
        {breadcrumbItems.map((item, index) => (
          <li key={`${item.path || item.label}-${index}`} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Separator */}
            {index > 0 && (
              <span style={getSeparatorStyles()} aria-hidden="true">
                /
              </span>
            )}
            
            {/* Breadcrumb Item */}
            {item.path && !item.isActive ? (
              <Link
                to={item.path}
                style={getBreadcrumbItemStyles(item.isActive, true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = niobiTheme.colors.primary[500];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = niobiTheme.colors.primary[500];
                }}
                aria-current={item.isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span
                style={getBreadcrumbItemStyles(item.isActive, false)}
                aria-current={item.isActive ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;