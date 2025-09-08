/**
 * Service Validation Script
 * 
 * Simple validation to ensure the auth service compiles and basic functionality works
 */

import { authService } from './authService';

// Basic validation function
export function validateAuthService(): boolean {
  try {
    // Test email validation
    const validEmail = authService.validateEmail('test@niobi.co');
    const invalidEmail = authService.validateEmail('test@gmail.com');
    
    if (!validEmail || invalidEmail) {
      console.error('Email validation failed');
      return false;
    }

    // Test email validation details
    const emailValidation = authService.getEmailValidation('test@niobi.co');
    if (!emailValidation.isValid || !emailValidation.isNiobiDomain) {
      console.error('Detailed email validation failed');
      return false;
    }

    const invalidEmailValidation = authService.getEmailValidation('test@gmail.com');
    if (invalidEmailValidation.isValid || invalidEmailValidation.isNiobiDomain) {
      console.error('Invalid email should not pass validation');
      return false;
    }

    // Test session management
    const session = authService.getCurrentSession();
    const isValid = authService.isSessionValid();
    const needsRefresh = authService.needsTokenRefresh();

    // These should work without throwing errors
    console.log('Session:', session);
    console.log('Is valid:', isValid);
    console.log('Needs refresh:', needsRefresh);

    console.log('✅ Auth service validation passed');
    return true;

  } catch (error) {
    console.error('❌ Auth service validation failed:', error);
    return false;
  }
}

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateAuthService();
}