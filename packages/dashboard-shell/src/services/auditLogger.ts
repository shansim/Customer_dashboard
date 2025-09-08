/**
 * Audit Logger Service
 * 
 * Handles logging of authentication and security events for audit trails.
 * In production, this would integrate with a proper logging service.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  REGISTRATION = 'REGISTRATION',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  CSRF_TOKEN_MISMATCH = 'CSRF_TOKEN_MISMATCH',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  COMPONENT_ERROR = 'COMPONENT_ERROR'
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  type: AuditEventType;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  details?: Record<string, any>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AuditLogConfig {
  maxLocalEntries: number;
  retentionDays: number;
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
}

// ============================================================================
// Audit Logger Implementation
// ============================================================================

class AuditLoggerService {
  private config: AuditLogConfig;
  private localStorageKey = 'niobi_audit_log';

  constructor(config?: Partial<AuditLogConfig>) {
    this.config = {
      maxLocalEntries: 1000,
      retentionDays: 30,
      enableConsoleLogging: import.meta.env.DEV,
      enableRemoteLogging: import.meta.env.PROD,
      remoteEndpoint: import.meta.env.VITE_AUDIT_ENDPOINT,
      ...config
    };
  }

  /**
   * Log an authentication event
   */
  async logEvent(
    type: AuditEventType,
    success: boolean,
    details?: {
      userId?: string;
      email?: string;
      sessionId?: string;
      errorMessage?: string;
      attemptCount?: number;
      [key: string]: any;
    }
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type,
      userId: details?.userId,
      email: details?.email,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: details?.sessionId,
      success,
      details: details || {},
      riskLevel: this.calculateRiskLevel(type, success, details)
    };

    // Store locally
    this.storeEventLocally(event);

    // Console logging for development
    if (this.config.enableConsoleLogging) {
      this.logToConsole(event);
    }

    // Remote logging for production
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      await this.sendToRemoteLogger(event);
    }

    // Check for suspicious patterns
    this.checkSuspiciousActivity(event);
  }

  /**
   * Log successful login
   */
  async logLoginSuccess(userId: string, email: string, sessionId: string): Promise<void> {
    await this.logEvent(AuditEventType.LOGIN_SUCCESS, true, {
      userId,
      email,
      sessionId
    });
  }

  /**
   * Log failed login attempt
   */
  async logLoginFailure(email: string, errorMessage: string, attemptCount?: number): Promise<void> {
    await this.logEvent(AuditEventType.LOGIN_FAILURE, false, {
      email,
      errorMessage,
      attemptCount
    });
  }

  /**
   * Log user logout
   */
  async logLogout(userId: string, email: string, sessionId: string): Promise<void> {
    await this.logEvent(AuditEventType.LOGOUT, true, {
      userId,
      email,
      sessionId
    });
  }

  /**
   * Log user registration
   */
  async logRegistration(userId: string, email: string): Promise<void> {
    await this.logEvent(AuditEventType.REGISTRATION, true, {
      userId,
      email
    });
  }

  /**
   * Log password reset request
   */
  async logPasswordResetRequest(email: string): Promise<void> {
    await this.logEvent(AuditEventType.PASSWORD_RESET_REQUEST, true, {
      email
    });
  }

  /**
   * Log token refresh
   */
  async logTokenRefresh(userId: string, sessionId: string): Promise<void> {
    await this.logEvent(AuditEventType.TOKEN_REFRESH, true, {
      userId,
      sessionId
    });
  }

  /**
   * Log session timeout
   */
  async logSessionTimeout(userId: string, sessionId: string, reason: string): Promise<void> {
    await this.logEvent(AuditEventType.SESSION_TIMEOUT, true, {
      userId,
      sessionId,
      reason
    });
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(email: string, attemptCount: number): Promise<void> {
    await this.logEvent(AuditEventType.RATE_LIMIT_EXCEEDED, false, {
      email,
      attemptCount
    });
  }

  /**
   * Log CSRF token mismatch
   */
  async logCSRFMismatch(userId?: string, sessionId?: string): Promise<void> {
    await this.logEvent(AuditEventType.CSRF_TOKEN_MISMATCH, false, {
      userId,
      sessionId
    });
  }

  /**
   * Get recent audit events (for admin dashboard)
   */
  getRecentEvents(limit: number = 100): AuditEvent[] {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (!stored) return [];

      const events: AuditEvent[] = JSON.parse(stored);
      return events
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to retrieve audit events:', error);
      return [];
    }
  }

  /**
   * Get events by type
   */
  getEventsByType(type: AuditEventType, limit: number = 50): AuditEvent[] {
    const allEvents = this.getRecentEvents(1000);
    return allEvents
      .filter(event => event.type === type)
      .slice(0, limit);
  }

  /**
   * Get failed login attempts for an email
   */
  getFailedLoginAttempts(email: string, timeWindowMs: number = 24 * 60 * 60 * 1000): AuditEvent[] {
    const cutoffTime = Date.now() - timeWindowMs;
    const allEvents = this.getRecentEvents(1000);
    
    return allEvents.filter(event => 
      event.type === AuditEventType.LOGIN_FAILURE &&
      event.email === email &&
      event.timestamp > cutoffTime
    );
  }

  /**
   * Clear old audit events
   */
  cleanupOldEvents(): void {
    try {
      const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      const stored = localStorage.getItem(this.localStorageKey);
      
      if (!stored) return;

      const events: AuditEvent[] = JSON.parse(stored);
      const filteredEvents = events.filter(event => event.timestamp > cutoffTime);
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(filteredEvents));
    } catch (error) {
      console.error('Failed to cleanup old audit events:', error);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string> {
    try {
      // In production, this would be handled by the server
      // For now, return a placeholder
      return 'client_ip';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Calculate risk level based on event type and context
   */
  private calculateRiskLevel(
    type: AuditEventType,
    success: boolean,
    details?: Record<string, any>
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    // High risk events
    if ([
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditEventType.CSRF_TOKEN_MISMATCH,
      AuditEventType.SUSPICIOUS_ACTIVITY
    ].includes(type)) {
      return 'HIGH';
    }

    // Medium risk events
    if ([
      AuditEventType.LOGIN_FAILURE,
      AuditEventType.INVALID_TOKEN,
      AuditEventType.SESSION_TIMEOUT
    ].includes(type)) {
      return 'MEDIUM';
    }

    // Multiple failed attempts increase risk
    if (type === AuditEventType.LOGIN_FAILURE && details?.attemptCount && details.attemptCount > 3) {
      return 'HIGH';
    }

    return 'LOW';
  }

  /**
   * Store event in local storage
   */
  private storeEventLocally(event: AuditEvent): void {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      const events: AuditEvent[] = stored ? JSON.parse(stored) : [];
      
      events.push(event);
      
      // Keep only the most recent events
      if (events.length > this.config.maxLocalEntries) {
        events.splice(0, events.length - this.config.maxLocalEntries);
      }
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store audit event locally:', error);
    }
  }

  /**
   * Log event to console for development
   */
  private logToConsole(event: AuditEvent): void {
    const logLevel = event.riskLevel === 'HIGH' ? 'error' : 
                    event.riskLevel === 'MEDIUM' ? 'warn' : 'info';
    
    console[logLevel](`[AUDIT] ${event.type}:`, {
      timestamp: new Date(event.timestamp).toISOString(),
      success: event.success,
      email: event.email,
      userId: event.userId,
      riskLevel: event.riskLevel,
      details: event.details
    });
  }

  /**
   * Send event to remote logging service
   */
  private async sendToRemoteLogger(event: AuditEvent): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send audit event to remote logger:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  }

  /**
   * Log component error
   */
  async logComponentError(
    componentName: string,
    errorMessage: string,
    errorStack: string,
    componentStack?: string
  ): Promise<void> {
    await this.logEvent(AuditEventType.COMPONENT_ERROR, false, {
      componentName,
      errorMessage,
      errorStack,
      componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }, 'MEDIUM');
  }

  /**
   * Check for suspicious activity patterns
   */
  private checkSuspiciousActivity(event: AuditEvent): void {
    // Check for rapid failed login attempts
    if (event.type === AuditEventType.LOGIN_FAILURE && event.email) {
      const recentFailures = this.getFailedLoginAttempts(event.email, 5 * 60 * 1000); // 5 minutes
      
      if (recentFailures.length >= 10) {
        this.logEvent(AuditEventType.SUSPICIOUS_ACTIVITY, false, {
          email: event.email,
          reason: 'Rapid failed login attempts',
          attemptCount: recentFailures.length
        });
      }
    }
  }
}

// ============================================================================
// Export Service Instance
// ============================================================================

export const auditLogger = new AuditLoggerService();

// Export class for testing
export { AuditLoggerService };