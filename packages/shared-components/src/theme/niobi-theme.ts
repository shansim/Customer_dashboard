export interface NiobiTheme {
  colors: {
    primary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    secondary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    gray: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    sizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    weights: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeights: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export const niobiTheme: NiobiTheme = {
  colors: {
    primary: {
      50: '#e6f2f0', // Darker shade for backgrounds
      100: '#ccdde1', // Darker shade for light backgrounds
      200: '#99c3c2', // Darker shade for borders
      300: '#025041', // Darker shade for hover states
      400: '#338f84', // Darker shade for secondary elements
      500: '#025041', // Main Niobi green
      600: '#025041', // Main Niobi green
      700: '#025041', // Darker for hover states
      800: '#01382d', // Even darker
      900: '#012820', // Darkest
    },
    secondary: {
      50: '#e6f2f0', // Darker shade for backgrounds
      100: '#ccdde1', // Darker shade for light backgrounds
      200: '#99c3c2', // Darker shade for borders
      300: '#66a9a3', // Darker shade for hover states
      400: '#338f84', // Darker shade for secondary elements
      500: '#025041', // Main Niobi green
      600: '#025041', // Main Niobi green
      700: '#02483a', // Darker for hover states
      800: '#01382d', // Even darker
      900: '#012820', // Darkest
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
};

// CSS custom properties for theme integration
export const generateCSSVariables = (theme: NiobiTheme): string => {
  return `
    :root {
      --niobi-primary-50: ${theme.colors.primary[50]};
      --niobi-primary-100: ${theme.colors.primary[100]};
      --niobi-primary-200: ${theme.colors.primary[200]};
      --niobi-primary-300: ${theme.colors.primary[300]};
      --niobi-primary-400: ${theme.colors.primary[400]};
      --niobi-primary-500: ${theme.colors.primary[500]};
      --niobi-primary-600: ${theme.colors.primary[600]};
      --niobi-primary-700: ${theme.colors.primary[700]};
      --niobi-primary-800: ${theme.colors.primary[800]};
      --niobi-primary-900: ${theme.colors.primary[900]};
      
      --niobi-secondary-50: ${theme.colors.secondary[50]};
      --niobi-secondary-500: ${theme.colors.secondary[500]};
      --niobi-secondary-900: ${theme.colors.secondary[900]};
      
      --niobi-gray-50: ${theme.colors.gray[50]};
      --niobi-gray-100: ${theme.colors.gray[100]};
      --niobi-gray-200: ${theme.colors.gray[200]};
      --niobi-gray-300: ${theme.colors.gray[300]};
      --niobi-gray-400: ${theme.colors.gray[400]};
      --niobi-gray-500: ${theme.colors.gray[500]};
      --niobi-gray-600: ${theme.colors.gray[600]};
      --niobi-gray-700: ${theme.colors.gray[700]};
      --niobi-gray-800: ${theme.colors.gray[800]};
      --niobi-gray-900: ${theme.colors.gray[900]};
      
      --niobi-font-family: ${theme.typography.fontFamily};
      --niobi-spacing-sm: ${theme.spacing.sm};
      --niobi-spacing-md: ${theme.spacing.md};
      --niobi-spacing-lg: ${theme.spacing.lg};
      --niobi-spacing-xl: ${theme.spacing.xl};
      
      --niobi-border-radius-sm: ${theme.borderRadius.sm};
      --niobi-border-radius-md: ${theme.borderRadius.md};
      --niobi-border-radius-lg: ${theme.borderRadius.lg};
      
      --niobi-shadow-sm: ${theme.shadows.sm};
      --niobi-shadow-md: ${theme.shadows.md};
      --niobi-shadow-lg: ${theme.shadows.lg};
    }
  `;
};