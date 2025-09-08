/**
 * Authentication Service Demo
 * 
 * Demonstrates how to use the authentication service in practice
 */

import { authService } from './authService';
import { isAuthError, formatAuthError } from '../utils/authUtils';

/**
 * Demo: Login flow
 */
export async function demoLogin() {
  console.log('🔐 Authentication Service Demo - Login Flow');
  
  try {
    // Example 1: Valid Niobi email
    console.log('\n1. Testing valid Niobi email validation:');
    const isValid = authService.validateEmail('john.doe@niobi.co');
    console.log(`✅ john.doe@niobi.co is valid: ${isValid}`);
    
    // Example 2: Invalid email domain
    console.log('\n2. Testing invalid email domain:');
    const isInvalid = authService.validateEmail('john@gmail.com');
    console.log(`❌ john@gmail.com is valid: ${isInvalid}`);
    
    // Example 3: Detailed email validation
    console.log('\n3. Detailed email validation:');
    const validation = authService.getEmailValidation('jane@niobi.co');
    console.log('Validation result:', validation);
    
    // Example 4: Login attempt (will fail without server)
    console.log('\n4. Login attempt (will fail - no server):');
    try {
      await authService.login('john@niobi.co', 'password123');
      console.log('✅ Login successful');
    } catch (error) {
      if (isAuthError(error)) {
        console.log(`❌ Login failed: ${formatAuthError(error)}`);
      } else {
        console.log('❌ Unexpected error:', error);
      }
    }
    
    // Example 5: Session management
    console.log('\n5. Session management:');
    const session = authService.getCurrentSession();
    console.log('Current session:', session ? 'Found' : 'None');
    
    const isSessionValid = authService.isSessionValid();
    console.log('Session valid:', isSessionValid);
    
    const needsRefresh = authService.needsTokenRefresh();
    console.log('Needs refresh:', needsRefresh);
    
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

/**
 * Demo: Registration flow
 */
export async function demoRegistration() {
  console.log('\n👤 Authentication Service Demo - Registration Flow');
  
  try {
    // Example registration data
    const registrationData = {
      email: 'newuser@niobi.co',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      name: 'New User'
    };
    
    console.log('Registration data:', registrationData);
    
    // This will fail without a server, but demonstrates the interface
    try {
      await authService.register(registrationData);
      console.log('✅ Registration successful');
    } catch (error) {
      if (isAuthError(error)) {
        console.log(`❌ Registration failed: ${formatAuthError(error)}`);
      } else {
        console.log('❌ Unexpected error:', error);
      }
    }
    
  } catch (error) {
    console.error('Registration demo failed:', error);
  }
}

/**
 * Demo: Password reset flow
 */
export async function demoPasswordReset() {
  console.log('\n🔑 Authentication Service Demo - Password Reset Flow');
  
  try {
    // Valid Niobi email
    console.log('Attempting password reset for: user@niobi.co');
    
    try {
      await authService.resetPassword('user@niobi.co');
      console.log('✅ Password reset request sent');
    } catch (error) {
      if (isAuthError(error)) {
        console.log(`❌ Password reset failed: ${formatAuthError(error)}`);
      } else {
        console.log('❌ Unexpected error:', error);
      }
    }
    
    // Invalid email domain
    console.log('\nAttempting password reset for: user@gmail.com');
    
    try {
      await authService.resetPassword('user@gmail.com');
      console.log('✅ Password reset request sent');
    } catch (error) {
      if (isAuthError(error)) {
        console.log(`❌ Password reset failed: ${formatAuthError(error)}`);
      } else {
        console.log('❌ Unexpected error:', error);
      }
    }
    
  } catch (error) {
    console.error('Password reset demo failed:', error);
  }
}

/**
 * Run all demos
 */
export async function runAllDemos() {
  console.log('🚀 Starting Authentication Service Demos\n');
  
  await demoLogin();
  await demoRegistration();
  await demoPasswordReset();
  
  console.log('\n✨ All demos completed!');
}

// Run demos if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDemos().catch(console.error);
}