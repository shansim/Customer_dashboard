# Test Login Credentials

The dashboard is configured with mock authentication for development testing. Use any of these credentials to log in:

## Quick Login (Recommended for Development)

### Easy Development Login
- **Email:** `user@niobi.co`
- **Password:** `password`
- **Name:** Demo User
- **Role:** user

### Super Easy Login
- **Email:** `test@niobi.co`
- **Password:** `test`
- **Name:** Test User
- **Role:** user

## Available Test Users

### Admin User
- **Email:** `admin@niobi.co`
- **Password:** `admin123`
- **Name:** Admin User
- **Role:** admin

### Regular Users

#### John Doe
- **Email:** `john.doe@niobi.co`
- **Password:** `password123`
- **Name:** John Doe
- **Role:** user

#### Jane Smith
- **Email:** `jane.smith@niobi.co`
- **Password:** `password123`
- **Name:** Jane Smith
- **Role:** user

#### Test User
- **Email:** `test.user@niobi.co`
- **Password:** `test123`
- **Name:** Test User
- **Role:** user

#### Demo User
- **Email:** `demo@niobi.co`
- **Password:** `demo123`
- **Name:** Demo User
- **Role:** user

## How to Test

1. Start the development server:
   ```bash
   cd packages/dashboard-shell
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`

3. Use any of the credentials above to log in

4. The system will:
   - Validate that the email ends with `@niobi.co`
   - Check the credentials against the mock user database
   - Create a session and redirect to the dashboard
   - Show the reconciliation tool and other features

## Features to Test

After logging in, you can test:

- **Dashboard Navigation:** Click between different sections
- **Reconciliation Tool:** Access the main reconciliation functionality in full-screen mode
- **Responsive Design:** Resize the browser to test mobile/desktop layouts
- **Sidebar Navigation:** Toggle the sidebar menu (hidden in reconciliation tool)
- **User Profile:** Check the header for user information
- **Logout:** Test the logout functionality

## Domain Restriction

The system only accepts emails ending with `@niobi.co`. If you try to use any other email domain (like `@gmail.com`), you'll get an error message: "Access restricted to Niobi employees only"

## Mock Authentication

The authentication is currently using a mock service that simulates the real authentication flow without requiring a backend server. This allows you to test all the frontend functionality including:

- Login form validation
- Session management
- Protected routes
- Authentication context sharing
- Error handling

## Troubleshooting

If you encounter any issues:

1. Make sure you're using an email that ends with `@niobi.co`
2. Check the browser console for any error messages
3. Try refreshing the page if the login seems stuck
4. Verify you're using one of the exact passwords listed above

The mock authentication service will log its activities to the browser console, so you can see what's happening during the login process.