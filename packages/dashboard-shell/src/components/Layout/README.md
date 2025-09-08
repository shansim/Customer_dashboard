# Dashboard Layout Components

This directory contains the core layout components for the Customer Success Dashboard, implementing a responsive dashboard shell with Niobi branding.

## Components

### DashboardLayout

The main layout wrapper that provides the overall dashboard structure.

**Features:**
- Responsive design (mobile and desktop)
- Sidebar toggle functionality
- Consistent Niobi theme integration
- Flexible content area for embedded features

**Props:**
- `children: React.ReactNode` - Content to render in the main area

**Usage:**
```tsx
import { DashboardLayout } from './components/Layout';

function App() {
  return (
    <DashboardLayout>
      <YourContent />
    </DashboardLayout>
  );
}
```

### Sidebar

Navigation sidebar with Niobi branding and feature links.

**Features:**
- Niobi brand header with logo and title
- Navigation menu with icons and labels
- Active route highlighting
- Placeholder badges for future features
- Mobile-responsive with overlay
- Smooth animations and transitions

**Props:**
- `isOpen: boolean` - Controls sidebar visibility
- `isMobile: boolean` - Indicates mobile layout mode
- `onClose: () => void` - Callback for closing sidebar

**Navigation Items:**
- Dashboard (active feature)
- Reconciliation Tool (active feature)
- Customer Accounts (placeholder)
- Reports & Analytics (placeholder)
- Customer Queries (placeholder)

### Header

Top header bar with user profile and controls.

**Features:**
- Sidebar toggle button
- Dashboard title
- User profile dropdown with avatar
- Logout functionality
- Responsive design

**Props:**
- `onToggleSidebar: () => void` - Callback for sidebar toggle
- `isSidebarOpen: boolean` - Current sidebar state

**User Profile Features:**
- User avatar with initials
- Name and email display
- Profile settings (placeholder)
- Sign out functionality

## Styling

### Theme Integration
All components use the Niobi theme system from `shared-components`:
- Primary green colors (#025041)
- Consistent typography
- Standard spacing and border radius
- Professional shadows and transitions

### Responsive Design
- **Desktop (≥768px)**: Full sidebar layout
- **Mobile (<768px)**: Collapsible sidebar with overlay
- **Small mobile (<480px)**: Simplified header layout

### CSS Classes
Additional CSS classes are provided in `layout.css`:
- `.custom-scrollbar` - Styled scrollbars
- `.hover-lift` - Hover animations
- `.loading-spinner` - Loading states
- Responsive utilities for mobile layouts

## Accessibility

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus indicators using Niobi primary color
- Proper ARIA labels for screen readers

### Screen Reader Support
- Semantic HTML structure
- Descriptive button labels
- Proper heading hierarchy

## Testing

The components include comprehensive tests covering:
- Basic rendering functionality
- User interaction (sidebar toggle, logout)
- Responsive behavior
- Content rendering

Run tests with:
```bash
npm test -- DashboardLayout.test.tsx
```

## Integration Requirements

### Authentication Context
The Header component requires the `useAuth` hook to be available:
```tsx
const { user, logout } = useAuth();
```

### Router Integration
The Sidebar component uses React Router for navigation:
```tsx
import { useLocation, useNavigate } from 'react-router-dom';
```

### Expected Routes
- `/dashboard` - Dashboard home
- `/dashboard/reconciliation` - Reconciliation tool
- `/dashboard/customers` - Customer accounts (placeholder)
- `/dashboard/reports` - Reports & analytics (placeholder)
- `/dashboard/queries` - Customer queries (placeholder)

## Future Enhancements

### Planned Features
- Role-based navigation visibility
- Customizable sidebar themes
- Breadcrumb navigation
- Notification center in header
- Advanced user profile management

### Performance Optimizations
- Lazy loading for navigation items
- Virtual scrolling for large menus
- Optimized re-renders with React.memo

## Requirements Satisfied

This implementation satisfies the following requirements:

**Requirement 3.4**: Dashboard layout with sidebar and content area
**Requirement 4.1**: Consistent Niobi brand design system
**Requirement 4.6**: Responsive layout for mobile and desktop
**Requirement 6.3**: Navigation between dashboard and features

The layout components provide a solid foundation for the Customer Success Dashboard while maintaining the existing reconciliation tool functionality and preparing for future feature expansion.