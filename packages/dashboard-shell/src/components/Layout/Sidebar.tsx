import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { niobiTheme } from '@niobi/shared-components';
import { Home, Scale, Users, BarChart3, HelpCircle, Heart, DollarSign,  } from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode; 
  isActive?: boolean;
  isPlaceholder?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, isMobile, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: <Home color="#025041" size={20} />,
    },
    {
      id: 'reconciliation',
      label: 'Reconciliation Tool',
      path: '/dashboard/reconciliation',
      icon: <Scale color="#025041" size={20} />,
    },
    {
      id: 'customers',
      label: 'Customer Accounts',
      path: '/dashboard/customers',
      icon: <Users color="#025041" size={20} />,
      isPlaceholder: true,
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      path: '/dashboard/reports',
      icon: <BarChart3 color="#025041" size={20} />,
      isPlaceholder: true,
    },
    {
      id: 'queries',
      label: 'Customer Queries',
      path: '/dashboard/queries',
      icon: <HelpCircle color="#025041" size={20} />,
      isPlaceholder: true,
    },
    {
      id: 'health-scores',
      label: 'Customer Health Scores',
      path: '/dashboard/health-scores',
      icon: <Heart color="#025041" size={20} />,
      isPlaceholder: true,
    },
    {
      id: 'retention-metrics',
      label: 'Financial Retention Metrics',
      path: '/dashboard/retention-metrics',
      icon: <DollarSign color="#025041" size={20} />,
      isPlaceholder: true,
    },
  ];

  const handleNavigation = (item: NavigationItem) => {
    if (!item.isPlaceholder) {
      navigate(item.path);
      onClose();
    }
  };

  const sidebarStyles: React.CSSProperties = {
    position: isMobile ? 'fixed' : 'relative',
    top: 0,
    left: 0,
    height: '100%',
    width: isMobile ? (isOpen ? '100%' : '0') : (isOpen ? '300px' : '0'),
    minWidth: isMobile ? (isOpen ? '100%' : '0') : (isOpen ? '300px' : '0'),
    backgroundColor: niobiTheme.colors.gray[50],
    borderRight: `1px solid ${niobiTheme.colors.gray[200]}`,
    transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
    transition: isMobile
      ? 'transform 0.3s ease-in-out, width 0.3s ease-in-out'
      : 'min-width 0.3s ease-in-out, width 0.3s ease-in-out',
    zIndex: isMobile ? 50 : 30,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: isMobile ? niobiTheme.shadows.lg : 'none',
    overflow: isOpen ? 'visible' : 'hidden', // Ensure content is hidden when closed
  };

  const navStyles: React.CSSProperties = {
    flex: 1,
    overflowY: isOpen ? 'auto' : 'hidden', // Disable scrolling when sidebar is closed
    padding: isOpen ? niobiTheme.spacing.md : '0', // Remove padding when closed
    paddingBottom: isOpen ? niobiTheme.spacing.lg : '0',
    willChange: 'transform',
  };

  const closeButtonStyles: React.CSSProperties = {
    position: 'absolute',
    top: niobiTheme.spacing.md,
    right: niobiTheme.spacing.md,
    background: 'transparent',
    border: 'none',
    fontSize: niobiTheme.typography.sizes.xl,
    cursor: 'pointer',
    color: niobiTheme.colors.gray[500],
  };

  const navItemStyles = (item: NavigationItem): React.CSSProperties => {
    const isActive = location.pathname === item.path;
    const isDisabled = item.isPlaceholder;
    
    return {
      display: 'flex',
      alignItems: 'center',
      gap: niobiTheme.spacing.md,
      padding: `${niobiTheme.spacing.md} ${niobiTheme.spacing.lg}`,
      marginBottom: niobiTheme.spacing.sm,
      borderRadius: niobiTheme.borderRadius.md,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      backgroundColor: isActive && item.id !== 'dashboard' ? niobiTheme.colors.primary[50] : 'transparent',
      color: isActive 
        ? niobiTheme.colors.primary[700] 
        : isDisabled 
          ? niobiTheme.colors.gray[400]
          : niobiTheme.colors.gray[700],
      border: '1px solid transparent',
      transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
      fontSize: niobiTheme.typography.sizes.base,
      fontWeight: isActive ? niobiTheme.typography.weights.medium : niobiTheme.typography.weights.normal,
      opacity: isDisabled ? 0.6 : 1,
    };
  };


  const placeholderBadgeStyles: React.CSSProperties = {
    fontSize: niobiTheme.typography.sizes.xs,
    backgroundColor: niobiTheme.colors.gray[200],
    color: niobiTheme.colors.gray[600],
    padding: `${niobiTheme.spacing.xs} ${niobiTheme.spacing.sm}`,
    borderRadius: niobiTheme.borderRadius.full,
    marginLeft: 'auto',
  };

  const footerStyles: React.CSSProperties = {
    padding: isOpen ? niobiTheme.spacing.sm : '0', // Remove padding when closed
    fontSize: isOpen ? niobiTheme.typography.sizes.xs : '0', // Hide text when closed
    color: isOpen ? niobiTheme.colors.gray[500] : 'transparent', // Hide text color when closed
    textAlign: 'center',
    transition: 'all 0.3s ease-in-out', // Smooth transition for hiding footer
  };

  const currentYear = new Date().getFullYear();

  return (
    <aside style={sidebarStyles}>
      {isMobile && (
        <button style={closeButtonStyles} onClick={onClose}>
          &times;
        </button>
      )}
      {/* Navigation */}
      <nav style={navStyles} className="custom-scrollbar sidebar-scroll">
        {navigationItems.map((item) => {
          const originalStyles = navItemStyles(item);
          
          return (
            <div
              key={item.id}
              style={originalStyles}
              onClick={() => handleNavigation(item)}
            >
              <span style={{ fontSize: niobiTheme.typography.sizes.lg, color: niobiTheme.colors.primary[500] }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.isPlaceholder && (
                <span style={placeholderBadgeStyles}>
                  Coming Soon
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
{isOpen && (
 <div style={footerStyles}>
   <p style={{ margin: 0 }}>
     © {currentYear} Niobi
   </p>
 </div>
)}
    </aside>
  );
};