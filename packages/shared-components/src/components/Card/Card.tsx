import React from 'react';
import { niobiTheme } from '../../theme/niobi-theme';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
}

const getCardStyles = (
  variant: CardProps['variant'],
  padding: CardProps['padding'],
  hoverable: boolean,
  isHovered: boolean
) => {
  const baseStyles = {
    borderRadius: niobiTheme.borderRadius.lg,
    backgroundColor: 'white',
    transition: 'all 0.2s ease-in-out',
    fontFamily: niobiTheme.typography.fontFamily,
  };

  const variantStyles = {
    default: {
      border: 'none',
      boxShadow: 'none',
    },
    outlined: {
      border: `1px solid ${niobiTheme.colors.gray[200]}`,
      boxShadow: 'none',
    },
    elevated: {
      border: 'none',
      boxShadow: niobiTheme.shadows.md,
    },
  };

  const paddingStyles = {
    none: { padding: '0' },
    sm: { padding: niobiTheme.spacing.md },
    md: { padding: niobiTheme.spacing.lg },
    lg: { padding: niobiTheme.spacing.xl },
  };

  const hoverStyles = hoverable && isHovered
    ? {
        transform: 'translateY(-2px)',
        boxShadow: niobiTheme.shadows.lg,
        cursor: 'pointer',
      }
    : {};

  return {
    ...baseStyles,
    ...variantStyles[variant || 'default'],
    ...paddingStyles[padding || 'md'],
    ...hoverStyles,
  };
};

const getHeaderStyles = () => ({
  marginBottom: niobiTheme.spacing.lg,
  paddingBottom: niobiTheme.spacing.md,
  borderBottom: `1px solid ${niobiTheme.colors.gray[200]}`,
});

const getFooterStyles = () => ({
  marginTop: niobiTheme.spacing.lg,
  paddingTop: niobiTheme.spacing.md,
  borderTop: `1px solid ${niobiTheme.colors.gray[200]}`,
});

const getContentStyles = (hasHeader: boolean, hasFooter: boolean) => ({
  ...(hasHeader && { marginTop: '0' }),
  ...(hasFooter && { marginBottom: '0' }),
});

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  header,
  footer,
  hoverable = false,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable) {
      setIsHovered(true);
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable) {
      setIsHovered(false);
    }
    onMouseLeave?.(e);
  };

  const cardStyles = {
    ...getCardStyles(variant, padding, hoverable, isHovered),
    ...style,
  };

  return (
    <div
      style={cardStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {header && (
        <div style={getHeaderStyles()}>
          {header}
        </div>
      )}
      <div style={getContentStyles(Boolean(header), Boolean(footer))}>
        {children}
      </div>
      {footer && (
        <div style={getFooterStyles()}>
          {footer}
        </div>
      )}
    </div>
  );
};