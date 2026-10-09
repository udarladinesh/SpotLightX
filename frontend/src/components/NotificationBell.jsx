import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../services/notificationService';

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await getUnreadCount();
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      // Quietly ignore network failures in background count checks
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCount();

    // Listen for custom notification refresh events dispatched by actions
    const handleRefresh = () => fetchCount();
    window.addEventListener('spotly_notification_refresh', handleRefresh);

    // Periodic check every 45 seconds when authenticated
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchCount();
      }
    }, 45000);

    return () => {
      window.removeEventListener('spotly_notification_refresh', handleRefresh);
      clearInterval(interval);
    };
  }, [fetchCount]);

  // Refresh when route changes (e.g., leaving /notifications)
  useEffect(() => {
    if (isAuthenticated) {
      fetchCount();
    }
  }, [location.pathname, isAuthenticated, fetchCount]);

  if (!isAuthenticated) return null;

  const isActive = location.pathname === '/notifications';

  return (
    <Link
      to="/notifications"
      className={`notification-bell-btn ${isActive ? 'active' : ''}`}
      title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'Notifications'}
      aria-label="Notifications"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="notification-badge" aria-hidden="true">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
