import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { niobiTheme } from '@niobi/shared-components';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './layout.css';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  const isReconciliationPage = location.pathname === '/dashboard/reconciliation';

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (isReconciliationPage && !isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isReconciliationPage, isMobile]);

  const toggleSidebar = React.useCallback(() => {
    setIsSidebarOpen(prevIsOpen => !prevIsOpen);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar]);

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const layoutStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: niobiTheme.colors.gray[50],
    fontFamily: niobiTheme.typography.fontFamily,
  };

  const contentWrapperStyles: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  };

  const mainContentStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: isReconciliationPage ? '0' : (isMobile ? niobiTheme.spacing.md : niobiTheme.spacing.lg),
    backgroundColor: niobiTheme.colors.gray[50],
  };

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 40,
    display: isMobile && isSidebarOpen ? 'block' : 'none',
  };

  return (
    <div style={layoutStyles}>
      <div style={overlayStyles} onClick={closeSidebar} />
      
      {!isReconciliationPage && (
        <Header 
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
        />
      )}
      
      <div style={contentWrapperStyles}>
        {!isReconciliationPage && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            isMobile={isMobile}
            onClose={closeSidebar}
          />
        )}
        <main style={mainContentStyles} className="custom-scrollbar sidebar-scroll">
          {children}
        </main>
      </div>
    </div>
  );
};