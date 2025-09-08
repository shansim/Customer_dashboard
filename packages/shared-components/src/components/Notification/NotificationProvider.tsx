/**
 * Notification Provider
 * 
 * Provides a context for managing multiple notifications throughout the app
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationType } from './Notification';
import { niobiTheme } from '../../theme/niobi-theme';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
}

export interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  // Convenience methods
  showSuccess: (message: string, title?: string, duration?: number) => string;
  showError: (message: string, title?: string, duration?: number) => string;
  showWarning: (message: string, title?: string, duration?: number) => string;
  showInfo: (message: string, title?: string, duration?: number) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const getContainerStyles = (position: string) => {
  const baseStyles = {
    position: 'fixed' as const,
    zIndex: 9999,
    padding: niobiTheme.spacing.lg,
    pointerEvents: 'none' as const,
  };

  const positionStyles = {
    'top-right': { top: 0, right: 0 },
    'top-left': { top: 0, left: 0 },
    'bottom-right': { bottom: 0, right: 0 },
    'bottom-left': { bottom: 0, left: 0 },
    'top-center': { top: 0, left: '50%', transform: 'translateX(-50%)' },
    'bottom-center': { bottom: 0, left: '50%', transform: 'translateX(-50%)' },
  };

  return {
    ...baseStyles,
    ...positionStyles[position as keyof typeof positionStyles],
  };
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  position = 'top-right',
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id'>) => {
    const id = generateId();
    const newNotification: NotificationItem = {
      ...notification,
      id,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Limit the number of notifications
      return updated.slice(0, maxNotifications);
    });

    return id;
  }, [generateId, maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'success', message, title, duration });
  }, [addNotification]);

  const showError = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'error', message, title, duration });
  }, [addNotification]);

  const showWarning = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'warning', message, title, duration });
  }, [addNotification]);

  const showInfo = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'info', message, title, duration });
  }, [addNotification]);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Container */}
      <div style={getContainerStyles(position)}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={{
              pointerEvents: 'auto',
              marginBottom: niobiTheme.spacing.sm,
              minWidth: '320px',
              maxWidth: '480px',
            }}
          >
            <Notification
              type={notification.type}
              title={notification.title}
              message={notification.message}
              duration={notification.duration}
              onDismiss={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;