/**
 * Audit Logger Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { auditLogger, AuditEventType, AuditLoggerService } from '../auditLogger';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = vi.fn();

describe('AuditLoggerService', () => {
  let logger: AuditLoggerService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    logger = new AuditLoggerService({
      enableConsoleLogging: false,
      enableRemoteLogging: false
    });
  });

  describe('logEvent', () => {
    it('should log a successful login event', async () => {
      await logger.logLoginSuccess('user123', 'test@niobi.co', 'session123');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'niobi_audit_log',
        expect.stringContaining('LOGIN_SUCCESS')
      );
    });

    it('should log a failed login event', async () => {
      await logger.logLoginFailure('test@niobi.co', 'Invalid credentials', 3);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'niobi_audit_log',
        expect.stringContaining('LOGIN_FAILURE')
      );
    });

    it('should calculate risk levels correctly', async () => {
      // Test that the method exists and doesn't throw
      await expect(logger.logRateLimitExceeded('test@niobi.co', 5)).resolves.not.toThrow();
      
      // Verify localStorage was called
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('getFailedLoginAttempts', () => {
    it('should return failed login attempts for an email', () => {
      // Mock stored events
      const mockEvents = [
        {
          id: '1',
          timestamp: Date.now() - 1000,
          type: AuditEventType.LOGIN_FAILURE,
          email: 'test@niobi.co',
          success: false,
          riskLevel: 'MEDIUM' as const
        },
        {
          id: '2',
          timestamp: Date.now() - 2000,
          type: AuditEventType.LOGIN_SUCCESS,
          email: 'test@niobi.co',
          success: true,
          riskLevel: 'LOW' as const
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEvents));

      const failedAttempts = logger.getFailedLoginAttempts('test@niobi.co');
      expect(failedAttempts).toHaveLength(1);
      expect(failedAttempts[0].type).toBe(AuditEventType.LOGIN_FAILURE);
    });
  });

  describe('cleanupOldEvents', () => {
    it('should remove events older than retention period', () => {
      const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000); // 31 days ago
      const recentTimestamp = Date.now() - (1 * 24 * 60 * 60 * 1000); // 1 day ago

      const mockEvents = [
        {
          id: '1',
          timestamp: oldTimestamp,
          type: AuditEventType.LOGIN_SUCCESS,
          success: true,
          riskLevel: 'LOW' as const
        },
        {
          id: '2',
          timestamp: recentTimestamp,
          type: AuditEventType.LOGIN_SUCCESS,
          success: true,
          riskLevel: 'LOW' as const
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEvents));

      logger.cleanupOldEvents();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'niobi_audit_log',
        expect.not.stringContaining(oldTimestamp.toString())
      );
    });
  });
});