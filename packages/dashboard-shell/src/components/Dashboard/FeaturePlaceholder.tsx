/**
 * Feature Placeholder Component
 * 
 * A placeholder component for features that are not yet implemented.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { niobiTheme } from '@niobi/shared-components';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface FeaturePlaceholderProps {
  title: string;
  description?: string;
  icon?: string;
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// Component Styles
// ============================================================================

const getContainerStyles = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  padding: niobiTheme.spacing['2xl'],
  textAlign: 'center' as const,
  fontFamily: niobiTheme.typography.fontFamily,
});

const getIconStyles = () => ({
  fontSize: '4rem',
  marginBottom: niobiTheme.spacing.xl,
  opacity: 0.6,
});

const getTitleStyles = () => ({
  fontSize: niobiTheme.typography.sizes['3xl'],
  fontWeight: niobiTheme.typography.weights.bold,
  color: niobiTheme.colors.gray[900],
  marginBottom: niobiTheme.spacing.lg,
});

const getDescriptionStyles = () => ({
  fontSize: niobiTheme.typography.sizes.lg,
  color: niobiTheme.colors.gray[600],
  lineHeight: niobiTheme.typography.lineHeights.relaxed,
  marginBottom: niobiTheme.spacing['2xl'],
  maxWidth: '500px',
});

const getComingSoonBadgeStyles = () => ({
  display: 'inline-block',
  padding: `${niobiTheme.spacing.sm} ${niobiTheme.spacing.lg}`,
  backgroundColor: '#e6f2f0', // Use darker background
  color: '#025041', // Use dark green text
  fontSize: niobiTheme.typography.sizes.sm,
  fontWeight: niobiTheme.typography.weights.medium,
  borderRadius: niobiTheme.borderRadius.full,
  border: `1px solid #99c3c2`, // Use darker border
  marginBottom: niobiTheme.spacing.xl,
});

const getBackLinkStyles = () => ({
  color: niobiTheme.colors.primary[600],
  textDecoration: 'none',
  fontSize: niobiTheme.typography.sizes.base,
  fontWeight: niobiTheme.typography.weights.medium,
  display: 'inline-flex',
  alignItems: 'center',
  gap: niobiTheme.spacing.sm,
  transition: 'color 0.2s ease',
});

// ============================================================================
// Main Component
// ============================================================================

export const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({
  title,
  description = 'This feature is currently under development and will be available soon.',
  icon = '🚧',
  className,
  style
}) => {
  return (
    <div 
      className={className}
      style={{
        ...getContainerStyles(),
        ...style
      }}
    >
      <div style={getIconStyles()}>
        {icon}
      </div>
      
      <h1 style={getTitleStyles()}>
        {title}
      </h1>
      
      <div style={getComingSoonBadgeStyles()}>
        Coming Soon
      </div>
      
      <p style={getDescriptionStyles()}>
        {description}
      </p>
      
      <Link 
        to="/dashboard"
        style={getBackLinkStyles()}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = niobiTheme.colors.primary[500];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = niobiTheme.colors.primary[600];
        }}
      >
        <span>←</span>
        Back to Dashboard
      </Link>
    </div>
  );
};

export default FeaturePlaceholder;