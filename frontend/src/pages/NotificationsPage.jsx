import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../services/notificationService';
import {
  Bell,
  BellOff,
  Heart,
  MessageSquare,
  Bookmark,
  UserPlus,
  Sparkles,
  Film,
  CheckCheck,
  Trash2,
  RefreshCw,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'LIKE':
      return <Heart size={15} className="notif-type-icon like" fill="currentColor" />;
    case 'COMMENT':
      return <MessageSquare size={15} className="notif-type-icon comment" />;
    case 'SAVE':
      return <Bookmark size={15} className="notif-type-icon save" fill="currentColor" />;
    case 'FOLLOW':
      return <UserPlus size={15} className="notif-type-icon follow" />;
    case 'VIDEO_PUBLISHED':
      return <Sparkles size={15} className="notif-type-icon publish" />;
    default:
      return <Bell size={15} className="notif-type-icon default" />;
  }
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const activeRequestRef = useRef(0);

  const loadNotifications = useCallback(async () => {
    const reqId = ++activeRequestRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await getNotifications({ page: 1, limit: 20 });
      if (reqId === activeRequestRef.current) {
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
        setUnreadCount(data.unreadCount || 0);
        setPage(1);
        setHasNextPage(Boolean(data.hasNextPage || data.pagination?.hasNextPage));
      }
    } catch (err) {
      if (reqId === activeRequestRef.current) {
        console.error('Fetch notifications error:', err);
        setError(
          err.response?.data?.message ||
            'Failed to load notifications. Please check your network and try again.'
        );
      }
    } finally {
      if (reqId === activeRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const data = await getNotifications({ page: nextPage, limit: 20 });
      const newItems = data.notifications || [];
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n._id));
        const unique = newItems.filter((n) => !existingIds.has(n._id));
        return [...prev, ...unique];
      });
      setPage(nextPage);
      setHasNextPage(Boolean(data.hasNextPage || data.pagination?.hasNextPage));
    } catch (err) {
      console.error('Load more notifications error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);

    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
      setUnreadCount(0);
      window.dispatchEvent(new Event('spotly_notification_refresh'));
    } catch (err) {
      console.error('Mark all as read error:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleClickNotification = async (notification) => {
    // If unread, mark as read
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        window.dispatchEvent(new Event('spotly_notification_refresh'));
      } catch (err) {
        console.warn('Failed to mark notification as read:', err.message);
      }
    }

    // Navigate to related target
    if (notification.video && notification.video._id) {
      navigate(`/v/${notification.video._id}`);
    } else if (notification.sender && notification.sender.username) {
      navigate(`/u/${notification.sender.username}`);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation(); // prevent item click navigation
    try {
      await deleteNotification(notificationId);
      const deletedItem = notifications.find((n) => n._id === notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setTotal((t) => Math.max(0, t - 1));
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      window.dispatchEvent(new Event('spotly_notification_refresh'));
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  return (
    <div className="notifications-page">
      <div className="container notifications-container">
        {/* Page Header */}
        <header className="notifications-header">
          <div className="notifications-header-left">
            <div className="notifications-pill">
              <Bell size={14} className="icon-pulse" />
              <span>Activity Center</span>
            </div>
            <h1 className="notifications-title">
              Your <span className="gradient-text">Notifications</span>
            </h1>
            <p className="notifications-subtitle">
              Stay updated when other creators and fans interact with your showcases and profile.
            </p>
          </div>

          <div className="notifications-header-actions">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="btn btn-secondary btn-sm"
                title="Mark all notifications as read"
              >
                <CheckCheck size={16} />
                <span>{isMarkingAll ? 'Marking...' : 'Mark all as read'}</span>
              </button>
            )}

            <button
              onClick={loadNotifications}
              disabled={isLoading}
              className="btn btn-glass btn-sm btn-icon-only"
              title="Refresh notifications"
            >
              <RefreshCw size={16} className={isLoading ? 'icon-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Unread Status Tag */}
        {!isLoading && !error && notifications.length > 0 && (
          <div className="notifications-meta-bar">
            <span className="notifications-count-tag">
              {unreadCount > 0 ? (
                <>
                  You have <strong className="unread-highlight">{unreadCount} unread</strong> notification{unreadCount === 1 ? '' : 's'}
                </>
              ) : (
                'All caught up! No unread notifications.'
              )}
            </span>
          </div>
        )}

        {/* Content States */}
        {isLoading ? (
          /* Loading Skeletons */
          <div className="notifications-list">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="notification-skeleton shimmer">
                <div className="skeleton-avatar shimmer" />
                <div className="skeleton-notif-body">
                  <div className="skeleton-line title shimmer" style={{ width: '70%' }} />
                  <div className="skeleton-line meta shimmer" style={{ width: '30%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="glass-card notif-empty-card error">
            <AlertCircle size={44} color="var(--status-error)" />
            <h3>Unable to Load Notifications</h3>
            <p>{error}</p>
            <button onClick={loadNotifications} className="btn btn-primary btn-sm">
              <RefreshCw size={15} />
              <span>Try Again</span>
            </button>
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="glass-card notif-empty-card">
            <div className="empty-card-icon-wrap">
              <BellOff size={36} color="var(--accent-purple)" />
            </div>
            <h3>No notifications yet</h3>
            <p>
              When other dancers, producers, vocalists, or fans like your showcases, follow your profile,
              or post comments, you will see their activity here.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
              <Link to="/discover" className="btn btn-primary">
                <Sparkles size={16} />
                <span>Explore Talent Feed</span>
              </Link>
              <Link to="/upload" className="btn btn-secondary">
                <Film size={16} />
                <span>Upload a Showcase</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Notifications List */
          <>
            <div className="notifications-list">
              {notifications.map((item) => {
                const sender = item.sender || {};
                const senderAvatar =
                  sender.profileImage ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${sender.username || 'spotly'}`;

                return (
                  <div
                    key={item._id}
                    onClick={() => handleClickNotification(item)}
                    className={`notification-item ${!item.isRead ? 'unread' : ''}`}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Unread Indicator Bar / Dot */}
                    {!item.isRead && <span className="unread-dot" title="Unread" />}

                    {/* Sender Avatar & Type Badge */}
                    <div className="notif-avatar-container">
                      {item.sender ? (
                        <img
                          src={senderAvatar}
                          alt={sender.displayName || 'Sender'}
                          className="notif-sender-avatar"
                        />
                      ) : (
                        <div className="notif-system-avatar">
                          <Sparkles size={20} color="var(--accent-indigo)" />
                        </div>
                      )}
                      <div className="notif-badge-wrap">
                        {getNotificationIcon(item.type)}
                      </div>
                    </div>

                    {/* Message & Context */}
                    <div className="notif-content">
                      <p className="notif-message-text">{item.message}</p>
                      
                      <div className="notif-meta-row">
                        <span className="notif-time">{formatTimeAgo(item.createdAt)}</span>
                        
                        {item.video && item.video.title && (
                          <span className="notif-video-tag" title={item.video.title}>
                            <Film size={12} />
                            <span>{item.video.title}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons (Delete) */}
                    <div className="notif-actions">
                      <button
                        onClick={(e) => handleDeleteNotification(e, item._id)}
                        className="notif-delete-btn"
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination / Load More Footer */}
            <div className="discover-pagination-wrap">
              {hasNextPage ? (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="btn btn-secondary btn-load-more"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw size={16} className="icon-spin" />
                      <span>Loading more notifications...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Notifications</span>
                      <span className="load-more-remaining">
                        ({total - notifications.length} remaining)
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <div className="feed-end-message">
                  <span className="dot-end" />
                  <span>You've reviewed all {total} notifications</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
