/**
 * Dashboard Home Component
 * 
 * The main dashboard landing page with navigation to features and welcome message.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, niobiTheme } from '@niobi/shared-components';
import { Scale, Users, BarChart3, HelpCircle, Heart, DollarSign,  } from 'lucide-react';
import { R } from 'vitest/dist/reporters-w_64AS5f.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface DashboardHomeProps {
  className?: string;
  style?: React.CSSProperties;
}

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  path: string;
  isAvailable: boolean;
  icon: React.ReactNode;
}

// ============================================================================
// Feature Configuration
// ============================================================================

const features: FeatureCard[] = [
  {
    id: 'reconciliation',
    title: 'Reconciliation Tool',
    description: 'Process and reconcile financial transactions with automated matching and reporting.',
    path: '/dashboard/reconciliation',
    isAvailable: true,
    icon: <Scale color="#025041" size={20} />
  },
  {
    id: 'customers',
    title: 'Customer Accounts',
    description: 'Manage customer information, accounts, and relationship data.',
    path: '/dashboard/customers',
    isAvailable: false,
    icon: <Users color="#025041" size={20} />
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    description: 'Generate comprehensive reports and analyze customer success metrics.',
    path: '/dashboard/reports',
    isAvailable: false,
    icon: <BarChart3 color="#025041" size={20} />
  },
  {
    id: 'queries',
    title: 'Customer Queries',
    description: 'Handle customer inquiries and support requests efficiently.',
    path: '/dashboard/queries',
    isAvailable: false,
    icon: <HelpCircle color="#025041" size={20} />
  },
  {
    id: 'health-scores',
    title: 'Customer Health Scores',
    description: 'Monitor and analyze customer health with predictive scoring models.',
    path: '/dashboard/health-scores',
    isAvailable: false,
    icon: <Heart color="#025041" size={20} />
  },
  {
    id: 'retention-metrics',
    title: 'Financial Retention Metrics',
    description: 'Track and visualize key financial retention and churn metrics.',
    path: '/dashboard/retention-metrics',
    isAvailable: false,
    icon: <DollarSign color="#025041" size={20} />
  }
];

// ============================================================================
// Component Styles
// ============================================================================

const getContainerStyles = () => ({
  padding: niobiTheme.spacing['2xl'],
  maxWidth: '1200px',
  margin: '0 auto',
  fontFamily: niobiTheme.typography.fontFamily,
});

const getHeaderStyles = () => ({
  marginBottom: niobiTheme.spacing['2xl'],
});

const getWelcomeStyles = () => ({
  fontSize: niobiTheme.typography.sizes['3xl'],
  fontWeight: niobiTheme.typography.weights.bold,
  color: niobiTheme.colors.gray[900],
  marginBottom: niobiTheme.spacing.md,
});

const getSubtitleStyles = () => ({
  fontSize: niobiTheme.typography.sizes.lg,
  color: niobiTheme.colors.gray[600],
  lineHeight: niobiTheme.typography.lineHeights.relaxed,
});

const getFeaturesGridStyles = () => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: niobiTheme.spacing.xl,
  marginTop: niobiTheme.spacing.lg,
});

const getFeatureCardStyles = (isAvailable: boolean) => ({
  padding: niobiTheme.spacing.xl,
  cursor: isAvailable ? 'pointer' : 'default',
  opacity: isAvailable ? 1 : 0.6,
  transition: 'all 0.2s ease',
  border: `1px solid ${niobiTheme.colors.gray[200]}`,
  borderRadius: niobiTheme.borderRadius.lg,
  backgroundColor: 'white',
  boxShadow: niobiTheme.shadows.sm,
});

const getFeatureIconStyles = () => ({
  fontSize: '2rem',
  marginBottom: niobiTheme.spacing.md,
  display: 'block',
});

const getFeatureTitleStyles = () => ({
  fontSize: niobiTheme.typography.sizes.xl,
  fontWeight: niobiTheme.typography.weights.semibold,
  color: niobiTheme.colors.gray[900],
  marginBottom: niobiTheme.spacing.sm,
});

const getFeatureDescriptionStyles = () => ({
  fontSize: niobiTheme.typography.sizes.base,
  color: niobiTheme.colors.gray[600],
  lineHeight: niobiTheme.typography.lineHeights.relaxed,
  marginBottom: niobiTheme.spacing.lg,
});

const getComingSoonBadgeStyles = () => ({
  display: 'inline-block',
  padding: `${niobiTheme.spacing.xs} ${niobiTheme.spacing.sm}`,
  backgroundColor: niobiTheme.colors.gray[100],
  color: niobiTheme.colors.gray[600],
  fontSize: niobiTheme.typography.sizes.xs,
  fontWeight: niobiTheme.typography.weights.medium,
  borderRadius: niobiTheme.borderRadius.full,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
});

// ============================================================================
// Main Component
// ============================================================================

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  className,
  style
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleFeatureClick = (feature: FeatureCard) => {
    if (feature.isAvailable) {
      navigate(feature.path);
    }
  };

  const handleFeatureKeyPress = (event: React.KeyboardEvent, feature: FeatureCard) => {
    if ((event.key === 'Enter' || event.key === ' ') && feature.isAvailable) {
      event.preventDefault();
      navigate(feature.path);
    }
  };

  // ============================================================================
  // Render Component
  // ============================================================================

  return (
    <div 
      className={className}
      style={{
        ...getContainerStyles(),
        ...style
      }}
    >
      

      {/* Features Grid */}
      <section>
        <div style={getFeaturesGridStyles()}>
          {features.map((feature) => (
            <div
              key={feature.id}
              style={getFeatureCardStyles(feature.isAvailable)}
              onClick={() => handleFeatureClick(feature)}
              onKeyPress={(e) => handleFeatureKeyPress(e, feature)}
              tabIndex={feature.isAvailable ? 0 : -1}
              role={feature.isAvailable ? 'button' : undefined}
              aria-label={feature.isAvailable ? `Navigate to ${feature.title}` : `${feature.title} - Coming Soon`}
              onMouseEnter={(e) => {
                if (feature.isAvailable) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = niobiTheme.shadows.md;
                }
              }}
              onMouseLeave={(e) => {
                if (feature.isAvailable) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = niobiTheme.shadows.sm;
                }
              }}
            >
              <span style={getFeatureIconStyles()}>
                {feature.icon}
              </span>
              
              <h2 style={getFeatureTitleStyles()}>
                {feature.title}
              </h2>
              
              <p style={getFeatureDescriptionStyles()}>
                {feature.description}
              </p>

              {feature.isAvailable ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(feature.path);
                  }}
                >
                  Open Tool
                </Button>
              ) : (
                <span style={getComingSoonBadgeStyles()}>
                  Coming Soon
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardHome;