/**
 * Authentication Utilities
 * 
 * Helper functions for authentication-related operations
 */

import { AuthError, AuthErrorType, PasswordValidation } from '../types/auth';

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Character variety checks
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChars) {
    errors.push('Password must contain at least one special character');
  }

  // Determine strength
  const varietyScore = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  
  if (password.length >= 12 && varietyScore >= 3) {
    strength = 'strong';
  } else if (password.length >= 8 && varietyScore >= 2) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors
  };
}

/**
 * Format authentication error for user display
 */
export function formatAuthError(error: AuthError): string {
  switch (error.type) {
    case AuthErrorType.INVALID_EMAIL_DOMAIN:
      return 'Access is restricted to Niobi employees only. Please use your @niobi.co email address.';
    
    case AuthErrorType.INVALID_CREDENTIALS:
      return 'Invalid email or password. Please check your credentials and try again.';
    
    case AuthErrorType.ACCOUNT_LOCKED:
      return 'Your account has been locked for security reasons. Please contact support for assistance.';
    
    case AuthErrorType.SESSION_EXPIRED:
      return 'Your session has expired. Please log in again to continue.';
    
    case AuthErrorType.RATE_LIMITED:
      if (error.retryAfter) {
        const minutes = Math.ceil(error.retryAfter / 60);
        return `Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      }
      return 'Too many login attempts. Please try again later.';
    
    case AuthErrorType.NETWORK_ERROR:
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    
    case AuthErrorType.EMAIL_NOT_VERIFIED:
      return 'Please verify your email address before logging in. Check your inbox for a verification link.';
    
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): error is AuthError {
  return error && error.name === 'AuthError' && error.type in AuthErrorType;
}

/**
 * Format time remaining for rate limiting
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Generate secure random string for CSRF tokens
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format (basic validation)
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract domain from email address
 */
export function getEmailDomain(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
}

/**
 * Check if email belongs to Niobi domain
 */
export function isNiobiEmail(email: string): boolean {
  return getEmailDomain(email) === 'niobi.co';
}

/**
 * Format user display name
 */
export function formatUserDisplayName(name: string, email: string): string {
  if (name && name.trim()) {
    return name.trim();
  }
  
  // Fallback to email username
  const username = email.split('@')[0];
  return username.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt;
}

/**
 * Check if token needs refresh (within threshold)
 */
export function shouldRefreshToken(expiresAt: number, thresholdMinutes: number = 60): boolean {
  const thresholdMs = thresholdMinutes * 60 * 1000;
  return (expiresAt - Date.now()) < thresholdMs;
}

/**
 * Create authorization header
 */
export function createAuthHeader(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Parse JWT token payload (without verification - for display purposes only)
 */
export function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

/**
 * Get token expiration time from JWT
 */
export function getTokenExpiration(token: string): number | null {
  const payload = parseJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
}