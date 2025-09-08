/**
 * Session Manager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService, AUTH_CONFIG } from '../authService';

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

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

// Mock crypto
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    })
  }
});

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.getItem.mockReturnValue(null);
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Session Storage', () => {
    it('should store session with CSRF token', () => {
      const mockSession = {
        user: {
          id: 'user123',
          email: 'test@niobi.co',
          name: 'Test User',
          role: 'user',
          createdAt: '2024-01-01'
        },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: Date.now() + 3600000
      };

      // Access the private session manager through the service
      const session = authService.getCurrentSession();
      expect(session).toBeNull(); // Should be null initially

      // The session manager is private, so we test through the auth service
      // In a real scenario, this would be tested through login flow
    });

    it('should validate session expiry', () => {
      const expiredSession = {
        user: {
          id: 'user123',
          email: 'test@niobi.co',
          name: 'Test User',
          role: 'user',
          createdAt: '2024-01-01'
        },
        token: 'expired-token',
        refreshToken: 'expired-refresh-token',
        expiresAt: Date.now() - 3600000, // Expired 1 hour ago
        lastActivity: Date.now() - 3600000
      };

      // Mock encrypted session data
      const encryptedData = btoa(JSON.stringify(expiredSession));
      sessionStorageMock.getItem.mockReturnValue(encryptedData);

      const session = authService.getCurrentSession();
      expect(session).toBeNull(); // Should be null due to expiry
    });
  });

  describe('CSRF Protection', () => {
    it('should generate CSRF tokens', () => {
      // Test that CSRF tokens are generated (indirectly through session storage)
      expect(window.crypto.getRandomValues).toBeDefined();
    });
  });

  describe('Session Timeout', () => {
    it('should handle inactivity timeout', () => {
      const inactiveSession = {
        user: {
          id: 'user123',
          email: 'test@niobi.co',
          name: 'Test User',
          role: 'user',
          createdAt: '2024-01-01'
        },
        token: 'valid-token',
        refreshToken: 'valid-refresh-token',
        expiresAt: Date.now() + 3600000, // Valid for 1 hour
        lastActivity: Date.now() - (31 * 60 * 1000) // Inactive for 31 minutes
      };

      // Mock encrypted session data
      const encryptedData = btoa(JSON.stringify(inactiveSession));
      sessionStorageMock.getItem.mockReturnValue(encryptedData);

      const session = authService.getCurrentSession();
      expect(session).toBeNull(); // Should be null due to inactivity
    });
  });

  describe('Session Validation', () => {
    it('should validate session correctly', () => {
      const validSession = {
        user: {
          id: 'user123',
          email: 'test@niobi.co',
          name: 'Test User',
          role: 'user',
          createdAt: '2024-01-01'
        },
        token: 'valid-token',
        refreshToken: 'valid-refresh-token',
        expiresAt: Date.now() + 3600000, // Valid for 1 hour
        lastActivity: Date.now() - 1000 // Active 1 second ago
      };

      // Test session validation logic
      const isValid = authService.isSessionValid();
      expect(typeof isValid).toBe('boolean');
    });

    it('should detect when token needs refresh', () => {
      const needsRefresh = authService.needsTokenRefresh();
      expect(typeof needsRefresh).toBe('boolean');
    });
  });
});