/**
 * LoginForm Component
 * 
 * A branded login form component that implements Niobi's design system
 * with domain-restricted authentication and comprehensive validation.
 */

import React, { useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input, SuccessFeedback, niobiTheme } from '@niobi/shared-components';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { AuthError, AuthErrorType, EmailValidation } from '../../types/auth';
import { AuthErrorHandler } from './AuthErrorHandler';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

interface FormState {
  showSuccess: boolean;
  authError: AuthError | null;
}

// ============================================================================
// Component Styles
// ============================================================================

const getFormStyles = () => ({
  width: '100%',
  maxWidth: '400px',
  margin: '0 auto',
  padding: niobiTheme.spacing['2xl'],
  backgroundColor: 'white',
  borderRadius: niobiTheme.borderRadius.lg,
  boxShadow: niobiTheme.shadows.lg,
  fontFamily: niobiTheme.typography.fontFamily,
});


const getFormFieldStyles = () => ({
  marginBottom: niobiTheme.spacing.lg,
  display: 'block',
  textAlign: 'center' as const,
  justifyContent: 'center',
});


const getSubmitButtonStyles = () => ({
  width: '100%',
  marginTop: niobiTheme.spacing.md,
});

// ============================================================================
// Main Component
// ============================================================================

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  style
}) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    showSuccess: false,
    authError: null
  });
  const [showPassword, setShowPassword] = useState(false);

  // ============================================================================
  // Validation Functions
  // ============================================================================

  /**
   * Validate email field with domain restriction
   */
  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }

    const emailValidation: EmailValidation = authService.getEmailValidation(email);
    
    if (!emailValidation.isValid) {
      return emailValidation.error;
    }

    return undefined;
  }, []);

  /**
   * Validate password field
   */
  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    return undefined;
  }, []);

  /**
   * Validate entire form
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    const emailError = validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateEmail, validatePassword]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle input field changes
   */
  const handleInputChange = useCallback((field: keyof FormData) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));

      // Clear field-specific error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: undefined
        }));
      }

      // Clear auth error when user makes changes
      if (formState.authError) {
        setFormState(prev => ({
          ...prev,
          authError: null,
          showSuccess: false
        }));
      }
    };
  }, [errors, formState.authError]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors and state
    setErrors({});
    setFormState({ showSuccess: false, authError: null });

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password);
      
      // Show success feedback briefly before redirect
      setFormState({ showSuccess: true, authError: null });
      
      // Use a much shorter delay to prevent race condition
      setTimeout(() => {
        onSuccess?.();
      }, 200); // Reduced from 1000ms to 200ms
      
    } catch (error) {
      const authError = error as AuthError;
      
      // Handle email domain errors at field level
      if (authError.type === AuthErrorType.INVALID_EMAIL_DOMAIN) {
        setErrors({ email: authError.message });
      } else {
        // All other errors go to the error handler
        setFormState({ showSuccess: false, authError });
      }

      onError?.(authError);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, login, onSuccess, onError, validateForm]);

  // ============================================================================
  // Render Component
  // ============================================================================

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#025041' }}>
      <img src="/assets/niobi_logo.png" alt="Niobi Logo" style={{ margin: '0 auto 1rem', height: '100px' }} />
      {/* Right Panel - Login Form */}
      <div className="w-full flex items-center justify-center px-8 py-12 bg-transparent">
        <div 
          className="w-full max-w-md"
          style={{
            ...getFormStyles(),
            ...style
          }}
        >
          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Success Message */}
            {formState.showSuccess && (
              <SuccessFeedback
                title="Login Successful"
                message="Welcome back! Redirecting to your dashboard..."
                variant="card"
                style={{ marginBottom: niobiTheme.spacing.lg }}
              />
            )}

            {/* Error Handler */}
            {formState.authError && (
              <div style={{ marginBottom: niobiTheme.spacing.lg }}>
                <AuthErrorHandler
                  error={formState.authError}
                  context="login"
                  onRetry={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                  onDismiss={() => setFormState(prev => ({ ...prev, authError: null }))}
                />
              </div>
            )}

            {/* Email Field */}
            <div style={getFormFieldStyles()}>
              <Input
                type="email"
                label="Enter your email"
                placeholder="Enter your work email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={errors.email}
                disabled={isFormDisabled}
                autoComplete="email"
                autoFocus
                size="lg"
                className="placeholder:text-center"
              />
            </div>

            {/* Password Field */}
            <div style={getFormFieldStyles()}>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={errors.password}
                  disabled={isFormDisabled}
                  autoComplete="current-password"
                  size="lg"
                  className="placeholder:text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ top: '60%' }}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={isFormDisabled}
              style={getSubmitButtonStyles()}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Export Component
// ============================================================================

export default LoginForm;