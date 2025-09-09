/**
 * Authentication Service
 * 
 * This service handles all authentication operations including login, registration,
 * logout, session management, and security features like rate limiting and email validation.
 */

import {
  AuthService,
  AuthResponse,
  RegisterRequest,
  SessionData,
  AuthError,
  AuthErrorType,
  EmailValidation,
  RateLimit,
  TokenValidation
} from '../types/auth';
import { auditLogger, AuditEventType } from './auditLogger';

// ============================================================================
// Configuration Constants
// ============================================================================

const CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  NIOBI_EMAIL_DOMAIN: '@niobi.co',
  SESSION_TIMEOUT_MINUTES: 480, // 8 hours
  REFRESH_THRESHOLD_MINUTES: 60, // Refresh token 1 hour before expiry
  MAX_LOGIN_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW_MINUTES: 15,
  PASSWORD_MIN_LENGTH: 8,
  SESSION_STORAGE_KEY: 'niobi_session',
  RATE_LIMIT_STORAGE_KEY: 'niobi_rate_limit'
};

// ============================================================================
// Rate Limiting Implementation
// ============================================================================

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  /**
   * Check if an email is rate limited
   */
  isRateLimited(email: string): RateLimit {
    const now = Date.now();
    const windowStart = now - (CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    
    // Get attempts for this email
    const emailAttempts = this.attempts.get(email) || [];
    
    // Filter to only recent attempts
    const recentAttempts = emailAttempts.filter(timestamp => timestamp > windowStart);
    
    // Update the attempts list
    this.attempts.set(email, recentAttempts);
    
    const remaining = Math.max(0, CONFIG.MAX_LOGIN_ATTEMPTS - recentAttempts.length);
    const isLimited = recentAttempts.length >= CONFIG.MAX_LOGIN_ATTEMPTS;
    
    // Calculate reset time (end of current window)
    const oldestAttempt = Math.min(...recentAttempts);
    const resetTime = oldestAttempt + (CONFIG.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    
    return {
      remaining,
      resetTime: isLimited ? resetTime : 0,
      isLimited
    };
  }

  /**
   * Record a failed login attempt
   */
  recordAttempt(email: string): void {
    const attempts = this.attempts.get(email) || [];
    attempts.push(Date.now());
    this.attempts.set(email, attempts);
    
    // Persist to localStorage for browser refresh persistence
    try {
      const rateLimitData = Object.fromEntries(this.attempts);
      localStorage.setItem(CONFIG.RATE_LIMIT_STORAGE_KEY, JSON.stringify(rateLimitData));
    } catch (error) {
      console.warn('Failed to persist rate limit data:', error);
    }
  }

  /**
   * Clear attempts for successful login
   */
  clearAttempts(email: string): void {
    this.attempts.delete(email);
    
    // Update localStorage
    try {
      const rateLimitData = Object.fromEntries(this.attempts);
      localStorage.setItem(CONFIG.RATE_LIMIT_STORAGE_KEY, JSON.stringify(rateLimitData));
    } catch (error) {
      console.warn('Failed to update rate limit data:', error);
    }
  }

  /**
   * Load rate limit data from localStorage
   */
  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CONFIG.RATE_LIMIT_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.attempts = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load rate limit data:', error);
    }
  }
}

// ============================================================================
// Session Management
// ============================================================================

class SessionManager {
  private sessionTimeoutId: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private readonly ACTIVITY_CHECK_INTERVAL = 60000; // 1 minute
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.startActivityMonitoring();
    this.setupVisibilityChangeHandler();
  }

  /**
   * Store session data securely with CSRF token
   */
  storeSession(sessionData: SessionData): void {
    try {
      // Generate CSRF token for this session
      const csrfToken = this.generateCSRFToken();
      
      const enhancedSessionData = {
        ...sessionData,
        csrfToken,
        lastActivity: Date.now(),
        sessionId: this.generateSessionId()
      };

      const encrypted = this.encryptSessionData(enhancedSessionData);
      
      // Use sessionStorage for more secure storage (cleared on tab close)
      sessionStorage.setItem(CONFIG.SESSION_STORAGE_KEY, encrypted);
      
      // Store CSRF token separately for validation
      sessionStorage.setItem('csrf_token', csrfToken);
      
      this.updateLastActivity();
      this.startSessionTimeout();
      
    } catch (error) {
      console.error('Failed to store session:', error);
      throw new Error('Session storage failed');
    }
  }

  /**
   * Retrieve session data with validation
   */
  getSession(): SessionData | null {
    try {
      const encrypted = sessionStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
      if (!encrypted) return null;
      
      const sessionData = this.decryptSessionData(encrypted);
      
      // Validate session hasn't expired due to inactivity
      if (this.isSessionExpiredByInactivity(sessionData)) {
        this.clearSession();
        return null;
      }
      
      // Update last activity
      this.updateLastActivity();
      
      return sessionData;
    } catch (error) {
      console.warn('Failed to retrieve session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Clear session data and cleanup
   */
  clearSession(): void {
    sessionStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
    sessionStorage.removeItem('csrf_token');
    localStorage.removeItem('last_activity');
    
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  /**
   * Get CSRF token for API requests
   */
  getCSRFToken(): string | null {
    return sessionStorage.getItem('csrf_token');
  }

  /**
   * Validate token expiration and activity
   */
  validateToken(sessionData: SessionData): TokenValidation {
    const now = Date.now();
    const expiresAt = sessionData.expiresAt;
    const refreshThreshold = CONFIG.REFRESH_THRESHOLD_MINUTES * 60 * 1000;
    
    // Check if session expired due to inactivity
    const isExpiredByInactivity = this.isSessionExpiredByInactivity(sessionData);
    
    return {
      isValid: now < expiresAt && !isExpiredByInactivity,
      expiresAt,
      needsRefresh: (expiresAt - now) < refreshThreshold && !isExpiredByInactivity
    };
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(): void {
    this.lastActivityTime = Date.now();
    localStorage.setItem('last_activity', this.lastActivityTime.toString());
  }

  /**
   * Check if session expired due to inactivity
   */
  private isSessionExpiredByInactivity(sessionData: any): boolean {
    const lastActivity = sessionData.lastActivity || this.lastActivityTime;
    const now = Date.now();
    return (now - lastActivity) > this.INACTIVITY_TIMEOUT;
  }

  /**
   * Start monitoring user activity
   */
  private startActivityMonitoring(): void {
    // Monitor user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const activityHandler = () => {
      this.updateLastActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, activityHandler, true);
    });

    // Periodic activity check
    setInterval(() => {
      const session = this.getSession();
      if (session && this.isSessionExpiredByInactivity(session)) {
        this.handleSessionTimeout();
      }
    }, this.ACTIVITY_CHECK_INTERVAL);
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(): void {
    this.clearSession();
    
    // Dispatch custom event for components to handle
    window.dispatchEvent(new CustomEvent('sessionTimeout', {
      detail: { reason: 'inactivity' }
    }));
  }

  /**
   * Start session timeout timer
   */
  private startSessionTimeout(): void {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
    }

    this.sessionTimeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * Setup visibility change handler for tab switching
   */
  private setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Tab became visible, check session validity
        const session = this.getSession();
        if (session && this.isSessionExpiredByInactivity(session)) {
          this.handleSessionTimeout();
        }
      }
    });
  }

  /**
   * Generate CSRF token
   */
  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enhanced encryption for session data
   */
  private encryptSessionData(data: any): string {
    // In production, use proper encryption like AES
    // For now, use base64 with additional obfuscation
    const jsonString = JSON.stringify(data);
    const encoded = btoa(jsonString);
    
    // Simple XOR obfuscation (use proper encryption in production)
    const key = 'niobi_session_key';
    let obfuscated = '';
    for (let i = 0; i < encoded.length; i++) {
      obfuscated += String.fromCharCode(
        encoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return btoa(obfuscated);
  }

  /**
   * Enhanced decryption for session data
   */
  private decryptSessionData(encrypted: string): any {
    try {
      const obfuscated = atob(encrypted);
      
      // Reverse XOR obfuscation
      const key = 'niobi_session_key';
      let decoded = '';
      for (let i = 0; i < obfuscated.length; i++) {
        decoded += String.fromCharCode(
          obfuscated.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      
      const jsonString = atob(decoded);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Failed to decrypt session data');
    }
  }
}

// ============================================================================
// Authentication Service Implementation
// ============================================================================

class AuthServiceImpl implements AuthService {
  private rateLimiter: RateLimiter;
  protected sessionManager: SessionManager;

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.sessionManager = new SessionManager();
    
    // Load rate limit data on initialization
    this.rateLimiter.loadFromStorage();
  }

  /**
   * Validate email domain restriction
   */
  validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Check Niobi domain restriction
    return email.toLowerCase().endsWith(CONFIG.NIOBI_EMAIL_DOMAIN);
  }

  /**
   * Get detailed email validation
   */
  getEmailValidation(email: string): EmailValidation {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);
    const isNiobiDomain = email.toLowerCase().endsWith(CONFIG.NIOBI_EMAIL_DOMAIN);

    if (!isValidFormat) {
      return {
        isValid: false,
        isNiobiDomain: false,
        error: 'Please enter a valid email address'
      };
    }

    if (!isNiobiDomain) {
      return {
        isValid: false,
        isNiobiDomain: false,
        error: 'Access restricted to Niobi employees only'
      };
    }

    return {
      isValid: true,
      isNiobiDomain: true
    };
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Validate email domain first
    if (!this.validateEmail(email)) {
      await auditLogger.logLoginFailure(email, 'Invalid email domain');
      throw this.createAuthError(
        AuthErrorType.INVALID_EMAIL_DOMAIN,
        'Access restricted to Niobi employees only'
      );
    }

    // Check rate limiting
    const rateLimit = this.rateLimiter.isRateLimited(email);
    if (rateLimit.isLimited) {
      await auditLogger.logRateLimitExceeded(email, CONFIG.MAX_LOGIN_ATTEMPTS);
      const resetTime = new Date(rateLimit.resetTime).toLocaleTimeString();
      throw this.createAuthError(
        AuthErrorType.RATE_LIMITED,
        `Too many login attempts. Please try again after ${resetTime}`,
        undefined,
        Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      );
    }

    try {
      const response = await this.makeApiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        // Record failed attempt
        this.rateLimiter.recordAttempt(email);
        const attemptCount = this.rateLimiter.isRateLimited(email).remaining;
        
        if (response.status === 401) {
          await auditLogger.logLoginFailure(email, 'Invalid credentials', CONFIG.MAX_LOGIN_ATTEMPTS - attemptCount);
          throw this.createAuthError(
            AuthErrorType.INVALID_CREDENTIALS,
            'Invalid email or password'
          );
        }
        
        if (response.status === 423) {
          await auditLogger.logLoginFailure(email, 'Account locked');
          throw this.createAuthError(
            AuthErrorType.ACCOUNT_LOCKED,
            'Account is locked. Please contact support.'
          );
        }

        await auditLogger.logLoginFailure(email, `HTTP ${response.status}`);
        throw this.createAuthError(
          AuthErrorType.UNKNOWN_ERROR,
          'Login failed. Please try again.'
        );
      }

      const authResponse: AuthResponse = await response.json();
      
      // Clear rate limiting on successful login
      this.rateLimiter.clearAttempts(email);
      
      // Store session
      const sessionData: SessionData = {
        user: authResponse.user,
        token: authResponse.token,
        refreshToken: authResponse.refreshToken,
        expiresAt: Date.now() + (CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000)
      };
      
      this.sessionManager.storeSession(sessionData);
      
      // Log successful login
      await auditLogger.logLoginSuccess(
        authResponse.user.id,
        authResponse.user.email,
        (sessionData as any).sessionId
      );
      
      return authResponse;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AuthError') {
        throw error;
      }
      
      // Network or other errors
      await auditLogger.logLoginFailure(email, 'Network error');
      throw this.createAuthError(
        AuthErrorType.NETWORK_ERROR,
        'Unable to connect to authentication server'
      );
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Validate email domain
    if (!this.validateEmail(userData.email)) {
      throw this.createAuthError(
        AuthErrorType.INVALID_EMAIL_DOMAIN,
        'Access restricted to Niobi employees only'
      );
    }

    // Validate password confirmation
    if (userData.password !== userData.confirmPassword) {
      throw this.createAuthError(
        AuthErrorType.UNKNOWN_ERROR,
        'Passwords do not match'
      );
    }

    // Validate password strength
    if (userData.password.length < CONFIG.PASSWORD_MIN_LENGTH) {
      throw this.createAuthError(
        AuthErrorType.UNKNOWN_ERROR,
        `Password must be at least ${CONFIG.PASSWORD_MIN_LENGTH} characters long`
      );
    }

    try {
      const response = await this.makeApiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name
        })
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw this.createAuthError(
            AuthErrorType.UNKNOWN_ERROR,
            'An account with this email already exists'
          );
        }

        throw this.createAuthError(
          AuthErrorType.UNKNOWN_ERROR,
          'Registration failed. Please try again.'
        );
      }

      const authResponse: AuthResponse = await response.json();
      
      // Store session
      const sessionData: SessionData = {
        user: authResponse.user,
        token: authResponse.token,
        refreshToken: authResponse.refreshToken,
        expiresAt: Date.now() + (CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000)
      };
      
      this.sessionManager.storeSession(sessionData);
      
      // Log successful registration
      await auditLogger.logRegistration(authResponse.user.id, authResponse.user.email);
      
      return authResponse;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AuthError') {
        throw error;
      }
      
      throw this.createAuthError(
        AuthErrorType.NETWORK_ERROR,
        'Unable to connect to authentication server'
      );
    }
  }

  /**
   * Logout user and clear session
   */
  async logout(): Promise<void> {
    const session = this.sessionManager.getSession();
    
    try {
      if (session?.token) {
        // Log logout before clearing session
        await auditLogger.logLogout(
          session.user.id,
          session.user.email,
          (session as any).sessionId
        );

        // Notify server of logout
        await this.makeApiRequest('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'X-CSRF-Token': this.sessionManager.getCSRFToken() || ''
          }
        });
      }
    } catch (error) {
      // Continue with local logout even if server request fails
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear local session
      this.sessionManager.clearSession();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<string> {
    const session = this.sessionManager.getSession();
    
    if (!session?.refreshToken) {
      throw this.createAuthError(
        AuthErrorType.SESSION_EXPIRED,
        'Session expired. Please log in again.'
      );
    }

    try {
      const response = await this.makeApiRequest('/auth/refresh', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': this.sessionManager.getCSRFToken() || ''
        },
        body: JSON.stringify({
          refreshToken: session.refreshToken
        })
      });

      if (!response.ok) {
        throw this.createAuthError(
          AuthErrorType.SESSION_EXPIRED,
          'Session expired. Please log in again.'
        );
      }

      const { token, refreshToken } = await response.json();
      
      // Update session with new tokens
      const updatedSession: SessionData = {
        ...session,
        token,
        refreshToken,
        expiresAt: Date.now() + (CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000)
      };
      
      this.sessionManager.storeSession(updatedSession);
      
      // Log token refresh
      await auditLogger.logTokenRefresh(session.user.id, (session as any).sessionId);
      
      return token;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AuthError') {
        throw error;
      }
      
      throw this.createAuthError(
        AuthErrorType.NETWORK_ERROR,
        'Unable to refresh session'
      );
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    // Validate email domain
    if (!this.validateEmail(email)) {
      throw this.createAuthError(
        AuthErrorType.INVALID_EMAIL_DOMAIN,
        'Access restricted to Niobi employees only'
      );
    }

    try {
      const response = await this.makeApiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      // Log password reset request (always log, regardless of whether email exists)
      await auditLogger.logPasswordResetRequest(email);

      if (!response.ok) {
        // Don't reveal whether email exists for security
        // Always show success message
      }

      // Always show success message for security
      // (Don't reveal whether email exists in system)
      
    } catch (error) {
      throw this.createAuthError(
        AuthErrorType.NETWORK_ERROR,
        'Unable to process password reset request'
      );
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionData | null {
    return this.sessionManager.getSession();
  }

  /**
   * Check if current session is valid
   */
  isSessionValid(): boolean {
    const session = this.sessionManager.getSession();
    if (!session) return false;
    
    const validation = this.sessionManager.validateToken(session);
    return validation.isValid;
  }

  /**
   * Check if token needs refresh
   */
  needsTokenRefresh(): boolean {
    const session = this.sessionManager.getSession();
    if (!session) return false;
    
    const validation = this.sessionManager.validateToken(session);
    return validation.needsRefresh;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Make authenticated API request with CSRF protection
   */
  private async makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Add CSRF token for state-changing requests
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      (options.method || 'GET').toUpperCase()
    );
    
    if (isStateChanging) {
      const csrfToken = this.sessionManager.getCSRFToken();
      if (csrfToken) {
        (defaultHeaders as any)['X-CSRF-Token'] = csrfToken;
      }
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    
    // Check for CSRF token mismatch
    if (response.status === 403 && response.headers.get('X-CSRF-Error')) {
      const session = this.sessionManager.getSession();
      await auditLogger.logCSRFMismatch(
        session?.user.id,
        (session as any)?.sessionId
      );
      
      // Clear session on CSRF mismatch
      this.sessionManager.clearSession();
      
      throw this.createAuthError(
        AuthErrorType.SESSION_EXPIRED,
        'Security token mismatch. Please log in again.'
      );
    }

    return response;
  }

  /**
   * Create standardized auth error
   */
  private createAuthError(
    type: AuthErrorType,
    message: string,
    details?: string,
    retryAfter?: number
  ): AuthError {
    const error = new Error(message) as Error & AuthError;
    error.name = 'AuthError';
    error.type = type;
    error.message = message;
    error.details = details;
    error.retryAfter = retryAfter;
    
    return error;
  }
}

// ============================================================================
// Development Mock Integration
// ============================================================================

// Import mock service for development
import { mockAuthService } from './mockAuthService';

// Create a wrapper that uses mock service in development
class DevelopmentAuthService extends AuthServiceImpl {
  private useMock = import.meta.env.VITE_MOCK_AUTH === 'true' || import.meta.env.DEV;

  async login(email: string, password: string): Promise<AuthResponse> {
    if (this.useMock) {
      console.log('🧪 Using mock authentication service');
      const mockResponse = await mockAuthService.login(email, password);
      
      // Store session using parent class session manager
      const sessionData: SessionData = {
        user: mockResponse.user,
        token: mockResponse.token,
        refreshToken: mockResponse.refreshToken,
        expiresAt: Date.now() + (CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000)
      };
      
      this.sessionManager.storeSession(sessionData);
      
      return mockResponse;
    }
    
    return super.login(email, password);
  }

  async logout(): Promise<void> {
    if (this.useMock) {
      console.log('🧪 Using mock logout');
      await mockAuthService.logout();
      this.sessionManager.clearSession();
      return;
    }
    
    return super.logout();
  }

  async refreshToken(): Promise<string> {
    if (this.useMock) {
      console.log('🧪 Using mock token refresh');
      const newToken = await mockAuthService.refreshToken();
      
      // Update session with new token
      const session = this.sessionManager.getSession();
      if (session) {
        const updatedSession: SessionData = {
          ...session,
          token: newToken,
          expiresAt: Date.now() + (CONFIG.SESSION_TIMEOUT_MINUTES * 60 * 1000)
        };
        this.sessionManager.storeSession(updatedSession);
      }
      
      return newToken;
    }
    
    return super.refreshToken();
  }

  async resetPassword(email: string): Promise<void> {
    if (this.useMock) {
      console.log('🧪 Using mock password reset');
      return mockAuthService.resetPassword(email);
    }
    
    return super.resetPassword(email);
  }

  validateEmail(email: string): boolean {
    if (this.useMock) {
      return mockAuthService.validateEmail(email);
    }
    
    return super.validateEmail(email);
  }

  getEmailValidation(email: string): EmailValidation {
    if (this.useMock) {
      return mockAuthService.getEmailValidation(email);
    }
    
    return super.getEmailValidation(email);
  }
}

// ============================================================================
// Export Service Instance
// ============================================================================

// Create singleton instance with development mock support
export const authService = new DevelopmentAuthService();

// Export class for testing
export { AuthServiceImpl };

// Export configuration for testing
export { CONFIG as AUTH_CONFIG };

// Export mock service and test users for development
export { mockAuthService, TEST_USERS } from './mockAuthService';