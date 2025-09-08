/**
 * Mock Authentication Service for Development
 * 
 * Provides mock authentication for testing the dashboard without a backend server.
 * This service simulates the real authentication flow with predefined test users.
 */

import { AuthResponse, User, AuthError, AuthErrorType, EmailValidation } from '../types/auth';

// ============================================================================
// Mock User Database
// ============================================================================

const MOCK_USERS: Array<{ email: string; password: string; user: User }> = [
    {
        email: 'admin@niobi.co',
        password: 'admin123',
        user: {
            id: '1',
            email: 'admin@niobi.co',
            name: 'Admin User',
            role: 'admin',
            createdAt: '2024-01-01T00:00:00Z'
        }
    },
    {
        email: 'john.doe@niobi.co',
        password: 'password123',
        user: {
            id: '2',
            email: 'john.doe@niobi.co',
            name: 'John Doe',
            role: 'user',
            createdAt: '2024-01-01T00:00:00Z'
        }
    },
    {
        email: 'Shannon.simiyu@niobi.co',
        password: 'password123',
        user: {
            id: '3',
            email: 'shannon.simiyu@niobi.co',
            name: 'Shannon Simiyu',
            role: 'user',
            createdAt: '2024-01-01T00:00:00Z'
        }
    },
    {
        email: 'test.user@niobi.co',
        password: 'test123',
        user: {
            id: '4',
            email: 'test.user@niobi.co',
            name: 'Test User',
            role: 'user',
            createdAt: '2024-01-01T00:00:00Z'
        }
    },
    {
        email: 'demo@niobi.co',
        password: 'demo123',
        user: {
            id: '5',
            email: 'demo@niobi.co',
            name: 'Demo User',
            role: 'user',
            createdAt: '2024-01-01T00:00:00Z'
        }
    },
    // Easy login credentials for development
    {
        email: 'user@niobi.co',
        password: 'password',
        user: {
            id: '6',
            email: 'user@niobi.co',
            name: 'Demo User',
            role: 'user',
            createdAt: '2024-01-01T00:00:00Z'
        }
    },
    {
        email: 'test@niobi.co',
        password: 'test',
        user: {
            id: '7',
            email: 'test@niobi.co',
            name: 'Test User',
            role: 'user',
            createdAt: '2024-01-01T00:00:00Z'
        }
    }
];

// ============================================================================
// Mock Authentication Service
// ============================================================================

class MockAuthService {
    private readonly NIOBI_EMAIL_DOMAIN = '@niobi.co'

    /**
     * Validate email domain
     */
    validateEmail(email: string): boolean {
        return email.toLowerCase().endsWith(this.NIOBI_EMAIL_DOMAIN);
    }

    /**
     * Get email validation result
     */
    getEmailValidation(email: string): EmailValidation {
        if (!email) {
            return {
                isValid: false,
                isNiobiDomain: false,
                error: 'Email is required'
            };
        }

        if (!this.validateEmail(email)) {
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
     * Mock login function
     */
    async login(email: string, password: string): Promise<AuthResponse> {
        console.log('🔐 Mock Auth: Attempting login for', email);

        // Simulate network delay
        await this.delay();

        // Validate email domain first
        if (!this.validateEmail(email)) {
            const error: AuthError = {
                type: AuthErrorType.INVALID_EMAIL_DOMAIN,
                message: 'Access restricted to Niobi employees only'
            };
            throw error;
        }

        // Find user in mock database
        const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!mockUser) {
            const error: AuthError = {
                type: AuthErrorType.INVALID_CREDENTIALS,
                message: 'Invalid email or password'
            };
            throw error;
        }

        // Check password
        if (mockUser.password !== password) {
            const error: AuthError = {
                type: AuthErrorType.INVALID_CREDENTIALS,
                message: 'Invalid email or password'
            };
            throw error;
        }

        // Generate tokens
        const token = this.generateMockToken(mockUser.user);
        const refreshToken = this.generateMockRefreshToken();

        console.log('✅ Mock Auth: Login successful for', mockUser.user.name);

        return {
            user: mockUser.user,
            token,
            refreshToken
        };
    }

    /**
     * Mock logout function
     */
    async logout(): Promise<void> {
        console.log('🔓 Mock Auth: Logout successful');
        await this.delay();
    }

    /**
     * Mock token refresh
     */
    async refreshToken(): Promise<string> {
        console.log('🔄 Mock Auth: Token refresh');
        await this.delay();
        return this.generateMockToken();
    }

    /**
     * Mock password reset
     */
    async resetPassword(email: string): Promise<void> {
        console.log('📧 Mock Auth: Password reset for', email);
        await this.delay();
    }

    /**
     * Get test users for easy reference
     */
    getTestUsers() {
        return MOCK_USERS.map(({ email, password, user }) => ({
            email,
            password,
            name: user.name,
            role: user.role
        }));
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Simulate network delay
     */
    private delay(ms: number = 500): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate mock JWT token
     */
    private generateMockToken(user?: User): string {
        const payload = {
            sub: user?.id || 'mock-user',
            email: user?.email || 'mock@niobi.co',
            role: user?.role || 'user',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
        };
        
        return `mock-jwt-${btoa(JSON.stringify(payload))}`;
    }

    /**
     * Generate mock refresh token
     */
    private generateMockRefreshToken(): string {
        return `mock-refresh-${Math.random().toString(36).substring(2)}`;
    }
}

// ============================================================================
// Export Service Instance
// ============================================================================

export const mockAuthService = new MockAuthService();

// Export test users for easy reference
export const TEST_USERS = mockAuthService.getTestUsers();

// Console log available test users in development
if (import.meta.env.DEV) {
    console.log('🧪 Mock Authentication Service Loaded');
    console.log('📋 Available Test Users:');
    TEST_USERS.forEach(user => {
        console.log(`   • ${user.name}: ${user.email} / ${user.password}`);
    });
    console.log('💡 Use any of these credentials to test the login functionality');
    console.log('🚀 Quick login: user@niobi.co / password');
}