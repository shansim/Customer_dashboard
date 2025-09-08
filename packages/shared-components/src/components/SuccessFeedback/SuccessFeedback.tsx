/**
 * Success Feedback Component
 * 
 * Displays success messages with optional actions
 */

import React from 'react';
import { niobiTheme } from '../../theme/niobi-theme';

export interface SuccessFeedbackProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'inline' | 'card' | 'banner';
  showIcon?: boolean;
}

const getSuccessStyles = (variant: 'inline' | 'card' | 'banner') => {
  const baseStyles = {
    fontFamily: niobiTheme.typography.fontFamily,
    color: '#065f46',
  };

  const variantStyles = {
    inline: {
      padding: niobiTheme.spacing.sm,
      fontSize: niobiTheme.typography.sizes.sm,
      lineHeight: niobiTheme.typography.lineHeights.relaxed,
    },
    card: {
      padding: niobiTheme.spacing.lg,
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: niobiTheme.borderRadius.md,
      boxShadow: niobiTheme.shadows.sm,
    },
    banner: {
      padding: niobiTheme.spacing.md,
      backgroundColor: '#f0fdf4',
      borderLeft: `4px solid #22c55e`,
      borderRadius: niobiTheme.borderRadius.sm,
    },
  };

  return { ...baseStyles, ...variantStyles[variant] };
};

const getIconStyles = () => ({
  width: '20px',
  height: '20px',
  flexShrink: 0,
  color: '#22c55e',
});

const getTitleStyles = () => ({
  fontSize: niobiTheme.typography.sizes.base,
  fontWeight: niobiTheme.typography.weights.semibold,
  marginBottom: niobiTheme.spacing.xs,
  color: '#065f46',
});

const getMessageStyles = () => ({
  fontSize: niobiTheme.typography.sizes.sm,
  lineHeight: niobiTheme.typography.lineHeights.relaxed,
  marginBottom: niobiTheme.spacing.sm,
});

const getActionsStyles = () => ({
  display: 'flex',
  gap: niobiTheme.spacing.sm,
  marginTop: niobiTheme.spacing.md,
  alignItems: 'center',
});

const getButtonStyles = (variant: 'primary' | 'secondary') => {
  const baseStyles = {
    padding: `${niobiTheme.spacing.xs} ${niobiTheme.spacing.sm}`,
    borderRadius: niobiTheme.borderRadius.sm,
    fontSize: niobiTheme.typography.sizes.sm,
    fontWeight: niobiTheme.typography.weights.medium,
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.2s ease-in-out',
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#22c55e',
      borderColor: '#22c55e',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: '#d1d5db',
      color: '#6b7280',
    },
  };

  return { ...baseStyles, ...variantStyles[variant] };
};

export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({
  title,
  message,
  action,
  onDismiss,
  className,
  style,
  variant = 'card',
  showIcon = true,
}) => {
  const SuccessIcon = () => (
    <svg
      style={getIconStyles()}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div
      className={className}
      style={{
        ...getSuccessStyles(variant),
        ...style,
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: niobiTheme.spacing.sm }}>
        {showIcon && <SuccessIcon />}
        
        <div style={{ flex: 1 }}>
          {title && (
            <div style={getTitleStyles()}>
              {title}
            </div>
          )}
          
          <div style={getMessageStyles()}>
            {message}
          </div>

          {action && (
            <div style={getActionsStyles()}>
              <button
                onClick={action.onClick}
                style={getButtonStyles('primary')}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        {onDismiss && variant !== 'inline' && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: niobiTheme.spacing.xs,
              color: '#6b7280',
              borderRadius: niobiTheme.borderRadius.sm,
            }}
            aria-label="Dismiss success message"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SuccessFeedback;