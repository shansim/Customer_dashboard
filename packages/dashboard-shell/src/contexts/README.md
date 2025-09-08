# Authentication Context

This directory contains the authentication context and related functionality for the Customer Success Dashboard.

## Overview

The authentication system provides:
- Secure login/logout functionality
- Domain-restricted access (@niobi.co only)
- Session management with automatic token refresh
- Comprehensive error handling
- Loading states and user feedback
- Type-safe React Context and hooks

## Quick Start

### 1. Wrap your app with AuthProvider

```tsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourAppContent />
    </AuthProvider>
  );
}
```

### 2. Use authentication in components

```tsx
import { useAuth } from './hooks/useAuth';

function LoginButton() {
  const { login, isAuthenticated, user, logout } = useAuth();
  
  if (isAuthenticated) {
    return (
      <div>
        Welcome, {user?.name}!
        <button onClick={logout}>Logout</button>
      </div>
    );
  }
  
  return <button onClick={() => login(email, password)}>Login</button>;
}
```

## Available Hooks

### `useAuth()`
Primary authentication hook providing core functionality:
- `user`: Current user object or null
- `token`: Authentication token or null
- `login(email, password)`: Login function
- `logout()`: Logout function
- `isLoading`: Loading state
- `isAuthenticated`: Authentication status

### `useAuthStatus()`
Convenient status checks:
- `isAuthenticated`: User is logged in
- `isGuest`: User is not logged in and not loading
- `hasUser`: User object exists
- `userEmail`, `userName`, `userRole`: User properties

### `useLoginForm()`
Form-specific hook with validation:
- `submitLogin(email, password)`: Validated login submission
- `isSubmitting`: Form submission state
- `hasError`: Error state
- `getErrorMessage`: User-friendly error message
- `clearError()`: Clear current error

### `useLogout()`
Logout-specific hook:
- `handleLogout()`: Logout with loading state
- `isLoggingOut`: Logout loading state

### `useSession()`
Session management utilities:
- `token`: Current token
- `sessionValid`: Session validity
- `refreshToken()`: Manual token refresh
- `needsRefresh`: Whether token needs refresh

### `useEmailValidation()`
Email validation with domain checking:
- `validateEmail(email)`: Returns validation result with Niobi domain check

### `useAuthError()`
Error handling utilities:
- `error`: Current error object
- `handleAuthError(error)`: Process authentication errors
- `clearError()`: Clear current error
- `getErrorMessage(error)`: Get user-friendly error message

## Authentication Flow

### Login Process
1. User enters email and password
2. Email domain validation (@niobi.co required)
3. Rate limiting check
4. API authentication request
5. Session storage and context update
6. Automatic token refresh setup

### Session Management
- Sessions are stored securely in localStorage
- Automatic token refresh before expiration
- Session validation on app initialization
- Automatic logout on session expiry

### Logout Process
1. Server notification (if possible)
2. Local session cleanup
3. Context state reset
4. Redirect to login

## Security Features

### Domain Restriction
- Only @niobi.co email addresses are accepted
- Client-side and server-side validation
- Clear error messages for invalid domains

### Rate Limiting
- Maximum 5 login attempts per 15-minute window
- Per-email address tracking
- Automatic reset after successful login
- Persistent across browser refreshes

### Session Security
- Secure token storage
- Automatic session timeout (8 hours)
- Token refresh 1 hour before expiry
- CSRF protection ready

### Error Handling
- Generic error messages for security
- No information leakage about account existence
- Proper error boundaries
- User-friendly error messages

## Configuration

The authentication system can be configured via environment variables:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

Default configuration:
- Session timeout: 8 hours
- Refresh threshold: 1 hour before expiry
- Max login attempts: 5
- Rate limit window: 15 minutes
- Minimum password length: 8 characters

## Error Types

The system handles various error types:
- `INVALID_CREDENTIALS`: Wrong email/password
- `INVALID_EMAIL_DOMAIN`: Non-Niobi email address
- `EMAIL_NOT_VERIFIED`: Unverified email (future use)
- `ACCOUNT_LOCKED`: Locked account
- `SESSION_EXPIRED`: Expired session
- `NETWORK_ERROR`: Connection issues
- `RATE_LIMITED`: Too many attempts
- `UNKNOWN_ERROR`: Generic fallback

## Testing

Comprehensive test suite covers:
- Context provider functionality
- Hook behavior and edge cases
- Error handling scenarios
- Session management
- Integration flows

Run tests:
```bash
npm run test
```

## Examples

See `src/examples/AuthExample.tsx` for a complete working example demonstrating all authentication features.

## Integration with Dashboard

The authentication context is designed to integrate seamlessly with:
- Protected routes
- Dashboard layout components
- Feature-specific components
- API request interceptors

## Future Enhancements

Planned features:
- Multi-factor authentication
- Role-based permissions
- Password strength requirements
- Account lockout policies
- Audit logging
- Remember me functionality