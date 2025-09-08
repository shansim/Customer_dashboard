/**
 * ErrorMessage Component
 * 
 * Displays user-friendly error messages with optional retry functionality
 */

import React from 'react';
import { niobiTheme } from '../../theme/niobi-theme';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'inline' | 'card' | 'banner';
}

const getErrorStyles = (variant: 'inline' | 'card' | 'banner') => {
  const baseStyles = {
    fontFamily: niobiTheme.typography.fontFamily,
    color: '#dc2626',
  };

  const variantStyles = {
    inline: {
      padding: niobiTheme.spacing.sm,
      fontSize: niobiTheme.typography.sizes.sm,
      lineHeight: niobiTheme.typography.lineHeights.relaxed,
    },
    card: {
      padding: niobiTheme.spacing.lg,
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: niobiTheme.borderRadius.md,
      boxShadow: niobiTheme.shadows.sm,
    },
    banner: {
      padding: niobiTheme.spacing.md,
      backgroundColor: '#fef2f2',
      borderLeft: `4px solid #dc2626`,
      borderRadius: niobiTheme.borderRadius.sm,
    },
  };

  return { ...baseStyles, ...variantStyles[variant] };
};

const getIconStyles = () => ({
  width: '20px',
  height: '20px',
  flexShrink: 0,
  color: '#dc2626',
});

const getTitleStyles = () => ({
  fontSize: niobiTheme.typography.sizes.base,
  fontWeight: niobiTheme.typography.weights.semibold,
  marginBottom: niobiTheme.spacing.xs,
  color: '#dc2626',
});

const getMessageStyles = () => ({
  fontSize: niobiTheme.typography.sizes.sm,
  lineHeight: niobiTheme.typography.lineHeights.relaxed,
  marginBottom: niobiTheme.spacing.sm,
});

const getDetailsStyles = () => ({
  fontSize: niobiTheme.typography.sizes.xs,
  color: '#6b7280',
  backgroundColor: '#f9fafb',
  padding: niobiTheme.spacing.sm,
  borderRadius: niobiTheme.borderRadius.sm,
  border: '1px solid #e5e7eb',
  marginTop: niobiTheme.spacing.sm,
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap' as const,
  overflow: 'auto',
  maxHeight: '120px',
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
      backgroundColor: '#dc2626',
      borderColor: '#dc2626',
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

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  details,
  showDetails = false,
  onRetry,
  onDismiss,
  retryLabel = 'Try Again',
  className,
  style,
  variant = 'card',
}) => {
  const [detailsVisible, setDetailsVisible] = React.useState(showDetails);

  const ErrorIcon = () => (
    <svg
      style={getIconStyles()}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div
      className={className}
      style={{
        ...getErrorStyles(variant),
        ...style,
      }}
      role="alert"
      aria-live="polite"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: niobiTheme.spacing.sm }}>
        <ErrorIcon />
        
        <div style={{ flex: 1 }}>
          {title && (
            <div style={getTitleStyles()}>
              {title}
            </div>
          )}
          
          <div style={getMessageStyles()}>
            {message}
          </div>

          {details && (
            <>
              <button
                onClick={() => setDetailsVisible(!detailsVisible)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: niobiTheme.typography.sizes.xs,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                {detailsVisible ? 'Hide Details' : 'Show Details'}
              </button>
              
              {detailsVisible && (
                <div style={getDetailsStyles()}>
                  {details}
                </div>
              )}
            </>
          )}

          {(onRetry || onDismiss) && (
            <div style={getActionsStyles()}>
              {onRetry && (
                <button
                  onClick={onRetry}
                  style={getButtonStyles('primary')}
                >
                  {retryLabel}
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  style={getButtonStyles('secondary')}
                >
                  Dismiss
                </button>
              )}
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
            aria-label="Dismiss error"
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

export default ErrorMessage;