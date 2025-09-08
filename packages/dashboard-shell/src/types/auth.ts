/**
 * Authentication Types and Interfaces
 * 
 * This file contains all type definitions for the authentication system,
 * including user models, context types, service interfaces, and error handling.
 */

// ============================================================================
// User and Authentication Models
// ============================================================================

/**
 * User interface representing an authenticated user
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

/**
 * Authentication context type for React Context
 */
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError?: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: AuthError | null;
  loadingState?: AuthLoadingState;
}

/**
 * Response from authentication service operations
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// ============================================================================
// Authentication Service Interface
// ============================================================================

/**
 * Authentication service interface defining all auth operations
 */
export interface AuthService {
  login(email: string, password: string): Promise<AuthResponse>;
  register(userData: RegisterRequest): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(): Promise<string>;
  validateEmail(email: string): boolean;
  resetPassword(email: string): Promise<void>;
}

// ============================================================================
// Request and Response Types
// ============================================================================

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

/**
 * Password reset request payload
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation payload
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// Session Management Types
// ============================================================================

/**
 * Session data stored locally
 */
export interface SessionData {
  user: User;
  token: string;
  expiresAt: number;
  refreshToken: string;
  csrfToken?: string;
  lastActivity?: number;
  sessionId?: string;
}

/**
 * Session configuration options
 */
export interface SessionConfig {
  timeoutMinutes: number;
  refreshThresholdMinutes: number;
  maxRetries: number;
}

/**
 * Token validation result
 */
export interface TokenValidation {
  isValid: boolean;
  expiresAt: number;
  needsRefresh: boolean;
}

// ============================================================================
// Navigation Models
// ============================================================================

/**
 * Navigation item for dashboard sidebar
 */
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType;
  isActive?: boolean;
  isPlaceholder?: boolean;
  children?: NavigationItem[];
}

/**
 * Dashboard route configuration
 */
export interface DashboardRoute {
  path: string;
  component: React.ComponentType;
  requiresAuth: boolean;
  title: string;
  breadcrumb?: string;
}

/**
 * Breadcrumb item for navigation
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Authentication error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_EMAIL_DOMAIN = 'INVALID_EMAIL_DOMAIN',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Authentication error interface
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: string;
  retryAfter?: number; // For rate limiting
}

/**
 * Form validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * API error response
 */
export interface ApiError {
  status: number;
  message: string;
  errors?: ValidationError[];
  timestamp: string;
}

// ============================================================================
// Authentication State Types
// ============================================================================

/**
 * Authentication loading states
 */
export enum AuthLoadingState {
  IDLE = 'IDLE',
  LOGGING_IN = 'LOGGING_IN',
  REGISTERING = 'REGISTERING',
  LOGGING_OUT = 'LOGGING_OUT',
  REFRESHING_TOKEN = 'REFRESHING_TOKEN',
  RESETTING_PASSWORD = 'RESETTING_PASSWORD'
}

/**
 * Authentication status
 */
export enum AuthStatus {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  AUTHENTICATED = 'AUTHENTICATED',
  EXPIRED = 'EXPIRED',
  LOADING = 'LOADING'
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Email validation result
 */
export interface EmailValidation {
  isValid: boolean;
  isNiobiDomain: boolean;
  error?: string;
}

/**
 * Password strength validation
 */
export interface PasswordValidation {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
}

/**
 * Rate limiting information
 */
export interface RateLimit {
  remaining: number;
  resetTime: number;
  isLimited: boolean;
}