/**
 * Services Index
 * 
 * Central export point for all service modules
 */

export { authService, AuthServiceImpl, AUTH_CONFIG } from './authService';
export type { 
  AuthService,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  SessionData,
  AuthError,
  EmailValidation,
  RateLimit,
  TokenValidation
} from '../types/auth';