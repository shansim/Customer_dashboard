// Force reload
import React from 'react';
import { niobiTheme } from '../../theme/niobi-theme';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

const getInputStyles = (
  variant: InputProps['variant'],
  size: InputProps['size'],
  hasError: boolean,
  isFocused: boolean
) => {
  const baseStyles = {
    width: '100%',
    fontFamily: niobiTheme.typography.fontFamily,
    borderRadius: niobiTheme.borderRadius.md,
    border: `1px solid ${hasError ? niobiTheme.colors.error : niobiTheme.colors.gray[300]}`,
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: variant === 'filled' ? niobiTheme.colors.gray[50] : 'white',
  };

  const sizeStyles = {
    sm: {
      padding: `${niobiTheme.spacing.sm} ${niobiTheme.spacing.md}`,
      fontSize: niobiTheme.typography.sizes.sm,
      lineHeight: niobiTheme.typography.lineHeights.tight,
    },
    md: {
      padding: `${niobiTheme.spacing.md} ${niobiTheme.spacing.md}`,
      fontSize: niobiTheme.typography.sizes.base,
      lineHeight: niobiTheme.typography.lineHeights.normal,
    },
    lg: {
      padding: `${niobiTheme.spacing.lg} ${niobiTheme.spacing.lg}`,
      fontSize: niobiTheme.typography.sizes.lg,
      lineHeight: niobiTheme.typography.lineHeights.normal,
    },
  };

  const focusStyles = isFocused
    ? {
        border: `1px solid ${hasError ? niobiTheme.colors.error : niobiTheme.colors.primary[500]}`,
        boxShadow: `0 0 0 3px ${hasError ? niobiTheme.colors.error + '20' : niobiTheme.colors.primary[500] + '20'}`,
      }
    : {};

  return {
    ...baseStyles,
    ...sizeStyles[size || 'md'],
    ...focusStyles,
  };
};

const getLabelStyles = (hasError: boolean) => ({
  display: 'block',
  marginBottom: niobiTheme.spacing.sm,
  fontSize: niobiTheme.typography.sizes.sm,
  fontWeight: niobiTheme.typography.weights.medium,
  color: hasError ? niobiTheme.colors.error : niobiTheme.colors.gray[700],
  fontFamily: niobiTheme.typography.fontFamily,
});

const getHelperTextStyles = (hasError: boolean) => ({
  marginTop: niobiTheme.spacing.sm,
  fontSize: niobiTheme.typography.sizes.sm,
  color: hasError ? niobiTheme.colors.error : niobiTheme.colors.gray[600],
  fontFamily: niobiTheme.typography.fontFamily,
});

const getInputWrapperStyles = () => ({
  position: 'relative' as const,
  display: 'flex',
  alignItems: 'center',
});

const getIconStyles = (position: 'left' | 'right') => ({
  position: 'absolute' as const,
  [position]: niobiTheme.spacing.md,
  color: niobiTheme.colors.gray[400],
  pointerEvents: 'none' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  style,
  onFocus,
  onBlur,
  id,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const hasError = Boolean(error);
  
  // Generate unique ID for accessibility
  const inputId = id || React.useId();

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputStyles = {
    ...getInputStyles(variant, size, hasError, isFocused),
    paddingLeft: leftIcon ? '2.5rem' : undefined,
    paddingRight: rightIcon ? '2.5rem' : undefined,
    ...style,
  };

  return (
    <div>
      {label && (
        <label htmlFor={inputId} style={getLabelStyles(hasError)}>
          {label}
        </label>
      )}
      <div style={getInputWrapperStyles()}>
        {leftIcon && (
          <span style={getIconStyles('left')}>
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          style={inputStyles}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon && (
          <span style={getIconStyles('right')}>
            {rightIcon}
          </span>
        )}
      </div>
      {(error || helperText) && (
        <div style={getHelperTextStyles(hasError)}>
          {error || helperText}
        </div>
      )}
    </div>
  );
};