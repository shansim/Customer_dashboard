# Dashboard Shell

The main dashboard application that provides authentication, routing, and layout for the Customer Success Dashboard.

## Features

- **Authentication System**: Domain-restricted authentication for @niobi.co emails
- **Error Boundaries**: Comprehensive error handling at application and route levels
- **Loading States**: Loading screens and spinners for better UX
- **Protected Routing**: Route guards for authenticated access
- **Dashboard Layout**: Consistent layout with sidebar navigation
- **Responsive Design**: Mobile and desktop support

## Architecture

The dashboard shell follows a modular architecture:

```
src/
├── components/
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Dashboard home and navigation
│   ├── ErrorBoundary/  # Error handling components
│   ├── Features/       # Feature wrappers (reconciliation tool)
│   ├── Layout/         # Layout components
│   ├── Loading/        # Loading components
│   ├── Navigation/     # Navigation components
│   └── Security/       # Security monitoring
├── contexts/           # React contexts (Auth)
├── hooks/             # Custom hooks
├── services/          # API and business logic
├── types/             # TypeScript type definitions
├── config/            # Route configuration
└── App.tsx            # Main application component
```

## Key Components

### App.tsx
The main application component that sets up:
- Error boundaries at the top level
- React Router for navigation
- Authentication provider
- Loading states during initialization
- Route-level error boundaries

### Error Boundaries
- **Top-level**: Catches application-wide errors
- **Route-level**: Catches errors in specific routes
- **Fallback UI**: User-friendly error messages with recovery options

### Loading Components
- **LoadingScreen**: Full-screen loading for app initialization
- **LoadingSpinner**: Reusable spinner component
- **Suspense**: Route-level loading states

## Scripts

- `npm run dev`: Start development server on port 3000
- `npm run build`: Production build with TypeScript checking
- `npm run build:dev`: Development build without TypeScript checking
- `npm run test`: Run tests in watch mode
- `npm run test:run`: Run tests once
- `npm run lint`: Lint code
- `npm run preview`: Preview production build

## Environment

The application supports different environments:
- **Development**: Full error details and debugging
- **Production**: Optimized build with error reporting

## Integration

The dashboard shell integrates with:
- **reconciliation-tool**: Embedded as a feature
- **shared-components**: Common UI components
- **Authentication service**: Secure login and session management

## Error Handling

Comprehensive error handling includes:
- JavaScript errors caught by error boundaries
- Network errors handled by services
- Authentication errors with user feedback
- Route errors with fallback pages

## Security

Security features include:
- Domain-restricted authentication
- Session management with automatic refresh
- CSRF protection
- Audit logging
- Rate limiting

## Testing

The application includes:
- Unit tests for components
- Integration tests for authentication
- Error boundary testing
- Loading state testing