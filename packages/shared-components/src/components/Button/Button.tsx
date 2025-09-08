import React from 'react';
import { niobiTheme } from '../../theme/niobi-theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const getButtonStyles = (variant: ButtonProps['variant'], size: ButtonProps['size']) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: niobiTheme.typography.fontFamily,
    fontWeight: niobiTheme.typography.weights.medium,
    borderRadius: niobiTheme.borderRadius.md,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    textDecoration: 'none',
    outline: 'none',
    position: 'relative' as const,
  };

  const sizeStyles = {
    sm: {
      padding: `${niobiTheme.spacing.sm} ${niobiTheme.spacing.md}`,
      fontSize: niobiTheme.typography.sizes.sm,
      lineHeight: niobiTheme.typography.lineHeights.tight,
    },
    md: {
      padding: `${niobiTheme.spacing.md} ${niobiTheme.spacing.lg}`,
      fontSize: niobiTheme.typography.sizes.base,
      lineHeight: niobiTheme.typography.lineHeights.normal,
    },
    lg: {
      padding: `${niobiTheme.spacing.lg} ${niobiTheme.spacing.xl}`,
      fontSize: niobiTheme.typography.sizes.lg,
      lineHeight: niobiTheme.typography.lineHeights.normal,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: niobiTheme.colors.primary[500],
      color: 'white',
      boxShadow: niobiTheme.shadows.sm,
    },
    secondary: {
      backgroundColor: niobiTheme.colors.secondary[500],
      color: 'white',
      boxShadow: niobiTheme.shadows.sm,
    },
    outline: {
      backgroundColor: 'transparent',
      color: niobiTheme.colors.primary[600],
      border: `1px solid ${niobiTheme.colors.primary[300]}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: niobiTheme.colors.gray[700],
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size || 'md'],
    ...variantStyles[variant || 'primary'],
  };
};



const getDisabledStyles = () => ({
  opacity: 0.6,
  cursor: 'not-allowed',
  pointerEvents: 'none' as const,
});

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}) => {
  const buttonStyles = {
    ...getButtonStyles(variant, size),
    ...(disabled || isLoading ? getDisabledStyles() : {}),
    ...style,
  };

  return (
    <button
      style={buttonStyles}
      disabled={disabled || isLoading}
      data-variant={variant}
      {...props}
    >
      {isLoading && (
        <span
          style={{
            marginRight: niobiTheme.spacing.sm,
            display: 'inline-block',
            width: '1em',
            height: '1em',
            border: '2px solid transparent',
            borderTop: '2px solid currentColor',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      {leftIcon && !isLoading && (
        <span style={{ marginRight: niobiTheme.spacing.sm }}>{leftIcon}</span>
      )}
      {children}
      {rightIcon && (
        <span style={{ marginLeft: niobiTheme.spacing.sm }}>{rightIcon}</span>
      )}
    </button>
  );
};

const buttonDynamicStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  button[data-variant="primary"]:hover {
    background-color: ${niobiTheme.colors.primary[600]};
    box-shadow: ${niobiTheme.shadows.md};
  }

  button[data-variant="secondary"]:hover {
    background-color: ${niobiTheme.colors.secondary[600]};
    box-shadow: ${niobiTheme.shadows.md};
  }

  button[data-variant="outline"]:hover {
    background-color: ${niobiTheme.colors.primary[50]};
    border-color: ${niobiTheme.colors.primary[400]};
  }

  button[data-variant="ghost"]:hover {
    background-color: ${niobiTheme.colors.gray[100]};
  }

  button:focus {
    outline: 2px solid ${niobiTheme.colors.primary[200]};
    outline-offset: 2px;
  }
`;

const styleElement = document.createElement('style');
styleElement.textContent = buttonDynamicStyles;
document.head.appendChild(styleElement);