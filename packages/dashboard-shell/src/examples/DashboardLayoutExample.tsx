import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout';

// Mock auth context for example
const mockAuthContext = {
  user: {
    id: '1',
    email: 'demo@niobi.co',
    name: 'Demo User',
    role: 'user',
    createdAt: '2024-01-01T00:00:00Z'
  },
  token: 'demo-token',
  login: async () => {},
  logout: async () => {},
  isLoading: false,
  isAuthenticated: true
};

// Mock the useAuth hook for the example
const OriginalUseAuth = require('../hooks/useAuth').useAuth;

export const DashboardLayoutExample: React.FC = () => {
  // Override useAuth for this example
  React.useEffect(() => {
    const mockModule = require('../hooks/useAuth');
    mockModule.useAuth = () => mockAuthContext;
    
    return () => {
      mockModule.useAuth = OriginalUseAuth;
    };
  }, []);

  return (
    <BrowserRouter>
      <DashboardLayout>
        <div style={{ 
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          margin: '1rem'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            marginBottom: '1rem',
            color: '#374151'
          }}>
            Dashboard Layout Example
          </h2>
          <p style={{ 
            color: '#6b7280', 
            lineHeight: 1.6,
            marginBottom: '1rem'
          }}>
            This is an example of the DashboardLayout component with:
          </p>
          <ul style={{ 
            color: '#6b7280', 
            lineHeight: 1.6,
            paddingLeft: '1.5rem'
          }}>
            <li>✅ Responsive sidebar with Niobi branding</li>
            <li>✅ Header with user profile and logout functionality</li>
            <li>✅ Navigation menu with active states</li>
            <li>✅ Mobile-responsive design</li>
            <li>✅ Consistent Niobi theme styling</li>
            <li>✅ Placeholder items for future features</li>
          </ul>
          
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #22c55e',
            borderRadius: '6px'
          }}>
            <h3 style={{ 
              color: '#15803d', 
              fontSize: '1.125rem', 
              fontWeight: 600,
              marginBottom: '0.5rem'
            }}>
              Features Implemented:
            </h3>
            <ul style={{ 
              color: '#15803d', 
              margin: 0,
              paddingLeft: '1.5rem'
            }}>
              <li>Sidebar toggle functionality</li>
              <li>User profile dropdown</li>
              <li>Responsive mobile layout</li>
              <li>Navigation with placeholder badges</li>
              <li>Consistent Niobi green theme</li>
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </BrowserRouter>
  );
};