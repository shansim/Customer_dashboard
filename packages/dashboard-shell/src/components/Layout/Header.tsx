import React, { useState } from 'react';
import { niobiTheme } from '@niobi/shared-components';
import { useAuth } from '../../contexts/AuthContext';

export interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isMobile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen, isMobile }) => {
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const headerStyles: React.CSSProperties = {
    height: '64px',
    backgroundColor: niobiTheme.colors.primary[500],
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${niobiTheme.spacing.lg}`,
    boxShadow: niobiTheme.shadows.sm,
    position: 'relative',
    zIndex: 20,
  };

  const leftSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: niobiTheme.spacing.md,
  };

  const menuButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'auto',
    height: '40px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: niobiTheme.borderRadius.md,
    cursor: 'pointer',
    fontSize: niobiTheme.typography.sizes.lg,
    color: 'white',
    transition: 'all 0.2s ease-in-out',
  };

  const menuButtonHoverStyles: React.CSSProperties = {
    backgroundColor: niobiTheme.colors.primary[600],
    color: 'white',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: niobiTheme.typography.sizes.xl,
    fontWeight: niobiTheme.typography.weights.semibold,
    color: 'white',
    margin: 0,
    marginLeft: isSidebarOpen ? '110px' : '0',
    transition: 'margin-left 0.3s ease-in-out',
    display: isMobile ? 'none' : 'block',
  };

  const rightSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: niobiTheme.spacing.md,
  };

  const userInfoStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: niobiTheme.spacing.sm,
    padding: `${niobiTheme.spacing.sm} ${niobiTheme.spacing.md}`,
    borderRadius: niobiTheme.borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    border: `1px solid ${niobiTheme.colors.primary[400]}`,
    backgroundColor: 'transparent',
    position: 'relative',
  };

  const userInfoHoverStyles: React.CSSProperties = {
    backgroundColor: niobiTheme.colors.primary[600],
    borderColor: niobiTheme.colors.primary[300],
  };

  const avatarStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: niobiTheme.borderRadius.full,
    backgroundColor: niobiTheme.colors.primary[700],
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: niobiTheme.typography.sizes.sm,
    fontWeight: niobiTheme.typography.weights.medium,
  };

  const userDetailsStyles: React.CSSProperties = {
    display: isMobile ? 'none' : 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  };

  const userNameStyles: React.CSSProperties = {
    fontSize: niobiTheme.typography.sizes.sm,
    fontWeight: niobiTheme.typography.weights.medium,
    color: 'white',
    margin: 0,
    lineHeight: niobiTheme.typography.lineHeights.tight,
  };

  const userEmailStyles: React.CSSProperties = {
    fontSize: niobiTheme.typography.sizes.xs,
    color: niobiTheme.colors.gray[300],
    margin: 0,
    lineHeight: niobiTheme.typography.lineHeights.tight,
  };

  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: niobiTheme.spacing.sm,
    backgroundColor: 'white',
    border: `1px solid ${niobiTheme.colors.gray[200]}`,
    borderRadius: niobiTheme.borderRadius.md,
    boxShadow: niobiTheme.shadows.lg,
    minWidth: '200px',
    zIndex: 50,
    display: isProfileMenuOpen ? 'block' : 'none',
  };

  const dropdownItemStyles: React.CSSProperties = {
    padding: `${niobiTheme.spacing.md} ${niobiTheme.spacing.lg}`,
    cursor: 'pointer',
    fontSize: niobiTheme.typography.sizes.sm,
    color: niobiTheme.colors.gray[700],
    borderBottom: `1px solid ${niobiTheme.colors.gray[100]}`,
    transition: 'all 0.2s ease-in-out',
  };

  const dropdownItemHoverStyles: React.CSSProperties = {
    backgroundColor: niobiTheme.colors.gray[50],
  };

  const chevronStyles: React.CSSProperties = {
    fontSize: niobiTheme.typography.sizes.sm,
    color: 'white',
    transform: isProfileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease-in-out',
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-profile-menu]')) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header style={headerStyles}>
      <div style={leftSectionStyles}>
        <button
          style={menuButtonStyles}
          onClick={(e) => {
            onToggleSidebar();
            e.currentTarget.blur();
          }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, menuButtonHoverStyles)}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <img src="/assets/niobi_logo.png" alt="Niobi Logo" style={{ width: '120px', height: 'auto' }} />
        </button>
        <h1 style={titleStyles}>Customer Success Dashboard</h1>
      </div>

      <div style={rightSectionStyles}>
        {user && (
          <div 
            style={userInfoStyles}
            onClick={toggleProfileMenu}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, userInfoHoverStyles)}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = niobiTheme.colors.primary[400];
            }}
            data-profile-menu
          >
            <div style={avatarStyles}>
              {getInitials(user.name || user.email)}
            </div>
            <div style={userDetailsStyles}>
              <p style={userNameStyles}>
                {user.name || 'User'}
              </p>
              <p style={userEmailStyles}>
                {user.email}
              </p>
            </div>
            <span style={chevronStyles}>▼</span>
            
            {/* Profile dropdown */}
            <div style={dropdownStyles}>
              <div 
                style={dropdownItemStyles}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, dropdownItemHoverStyles)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <strong>Profile Settings</strong>
                <div style={{ 
                  fontSize: niobiTheme.typography.sizes.xs, 
                  color: niobiTheme.colors.gray[500],
                  marginTop: niobiTheme.spacing.xs 
                }}>
                  Coming Soon
                </div>
              </div>
              <div 
                style={{
                  ...dropdownItemStyles,
                  borderBottom: 'none',
                  color: niobiTheme.colors.error,
                }}
                onClick={handleLogout}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, dropdownItemHoverStyles)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Sign Out
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};