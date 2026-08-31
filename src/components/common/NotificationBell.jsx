// src/components/dashboard/admin/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaBell, FaCheckCircle, FaInfoCircle, FaExclamationTriangle, 
  FaBullhorn, FaUserPlus, FaTimesCircle, FaClock, FaTrash,
  FaChevronDown, FaChevronUp, FaSync, FaTasks, FaFileAlt,
  FaUserGraduate, FaCalendarCheck, FaBook
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const NotificationBell = () => {
  const { isArabic } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    loadNotifications,
    getNotificationIcon,
    getNotificationColor
  } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef(null);

  // Language locale for time formatting
  const locale = isArabic ? ar : enUS;

  // Get user role for role-specific notifications
  const getUserRole = () => {
    return user?.role || localStorage.getItem('role') || 'admin';
  };

  const userRole = getUserRole();

  // Get role-specific empty state message
  const getEmptyMessage = () => {
    const messages = {
      admin: isArabic ? 'لا توجد إشعارات إدارية' : 'No admin notifications',
      teacher: isArabic ? 'لا توجد إشعارات للمعلم' : 'No teacher notifications',
      parent: isArabic ? 'لا توجد إشعارات لولي الأمر' : 'No parent notifications',
      student: isArabic ? 'لا توجد إشعارات للطالب' : 'No student notifications'
    };
    return messages[userRole] || messages.admin;
  };

  // Get role-specific notification types
  const getNotificationTypes = () => {
    const types = {
      admin: ['registration', 'system', 'announcement', 'reminder'],
      teacher: ['assignment', 'submission', 'schedule', 'announcement'],
      parent: ['grade', 'attendance', 'announcement'],
      student: ['grade', 'announcement']
    };
    return types[userRole] || ['announcement'];
  };

  // Format time
  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale 
      });
    } catch {
      return isArabic ? 'منذ قليل' : 'Just now';
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  // Get display notifications
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  // Get notification icon by type
  const getIcon = (type) => {
    const icons = {
      registration: <FaUserPlus />,
      announcement: <FaBullhorn />,
      assignment: <FaTasks />,
      submission: <FaFileAlt />,
      grade: <FaBook />,
      attendance: <FaCalendarCheck />,
      schedule: <FaClock />,
      system: <FaInfoCircle />,
      reminder: <FaBell />
    };
    return icons[type] || <FaInfoCircle />;
  };

  // Get notification color by type
  const getColor = (type) => {
    const colors = {
      registration: '#f39c12',
      announcement: '#e67e22',
      assignment: '#3498db',
      submission: '#2ecc71',
      grade: '#9b59b6',
      attendance: '#1abc9c',
      schedule: '#e74c3c',
      system: '#4a9eff',
      reminder: '#f39c12'
    };
    return colors[type] || '#6c757d';
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    if (isArabic) {
      const labels = { high: 'عاجل', medium: 'متوسط', low: 'منخفض' };
      return labels[priority] || '';
    }
    return priority || '';
  };

  // Filter notifications by role
  const getFilteredNotifications = () => {
    const allowedTypes = getNotificationTypes();
    return notifications.filter(n => allowedTypes.includes(n.type));
  };

  // Get unread count for this role
  const getRoleUnreadCount = () => {
    const allowedTypes = getNotificationTypes();
    return notifications.filter(n => allowedTypes.includes(n.type) && !n.read).length;
  };

  const roleUnreadCount = getRoleUnreadCount();

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        className="notification-toggle-btn"
        onClick={toggleDropdown}
        aria-label={isArabic ? 'الإشعارات' : 'Notifications'}
      >
        <FaBell size={20} />
        {roleUnreadCount > 0 && (
          <Badge pill bg="danger" className="notification-badge">
            {roleUnreadCount > 99 ? '99+' : roleUnreadCount}
          </Badge>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-panel">
          {/* Header */}
          <div className="notification-panel-header">
            <span className="fw-bold">
              {isArabic ? 'الإشعارات' : 'Notifications'}
              <span className="notification-count-badge">
                {roleUnreadCount > 0 && `${roleUnreadCount} ${isArabic ? 'جديد' : 'new'}`}
              </span>
            </span>
            <div className="header-actions">
              {roleUnreadCount > 0 && (
                <button 
                  className="action-btn mark-read-btn"
                  onClick={() => {
                    markAllAsRead();
                    loadNotifications();
                  }}
                >
                  {isArabic ? 'تعيين الكل كمقروء' : 'Mark all read'}
                </button>
              )}
              <button 
                className="action-btn refresh-btn"
                onClick={() => loadNotifications()}
                disabled={loading}
              >
                <FaSync className={loading ? 'spinning' : ''} size={12} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <div className="loading-state">
                <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : getFilteredNotifications().length === 0 ? (
              <div className="empty-state">
                <FaBell size={40} className="empty-icon" />
                <p>{getEmptyMessage()}</p>
                <small className="text-muted">
                  {isArabic ? 'ستظهر الإشعارات هنا عند توفرها' : 'Notifications will appear here when available'}
                </small>
              </div>
            ) : (
              <>
                {getFilteredNotifications().slice(0, showAll ? undefined : 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div 
                      className="notification-icon-wrapper"
                      style={{ color: getColor(notification.type) }}
                    >
                      {getIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title-row">
                        <span className="notification-title">
                          {notification.title}
                          {!notification.read && (
                            <span className="unread-dot">●</span>
                          )}
                        </span>
                        {notification.priority === 'high' && (
                          <Badge bg="danger" className="priority-badge">
                            {isArabic ? 'عاجل' : 'Urgent'}
                          </Badge>
                        )}
                      </div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-footer-row">
                        <span className="notification-time">
                          <FaClock size={10} className="me-1" />
                          {formatTime(notification.created_at || notification.time)}
                        </span>
                        {notification.metadata?.student_name && (
                          <span className="notification-meta">
                            👤 {notification.metadata.student_name}
                          </span>
                        )}
                        {notification.metadata?.assignment_title && (
                          <span className="notification-meta">
                            📋 {notification.metadata.assignment_title}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="delete-notification-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      aria-label={isArabic ? 'حذف' : 'Delete'}
                      title={isArabic ? 'حذف الإشعار' : 'Delete notification'}
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}

                {/* Show More/Less Button */}
                {getFilteredNotifications().length > 5 && (
                  <button
                    className="show-more-btn"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? (
                      <>
                        <FaChevronUp size={12} className="me-1" />
                        {isArabic ? 'عرض أقل' : 'Show Less'}
                      </>
                    ) : (
                      <>
                        <FaChevronDown size={12} className="me-1" />
                        {isArabic ? 'عرض المزيد' : 'Show More'} 
                        ({getFilteredNotifications().length - 5} {isArabic ? 'المزيد' : 'more'})
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="notification-panel-footer">
            <button 
              className="view-all-btn"
              onClick={() => {
                navigate('/dashboard/admin/notifications');
                setIsOpen(false);
              }}
            >
              {isArabic ? 'عرض جميع الإشعارات' : 'View All Notifications'}
              <FaChevronDown size={12} className="ms-1" style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .notification-bell-wrapper {
          position: relative;
          display: inline-block;
        }

        .notification-toggle-btn {
          position: relative;
          background: none;
          border: none;
          color: var(--text-secondary, #6c757d);
          padding: 8px 10px;
          border-radius: 50%;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .notification-toggle-btn:hover {
          background: rgba(26, 95, 122, 0.08);
          color: #1a5f7a;
          transform: scale(1.05);
        }

        .notification-toggle-btn:active {
          transform: scale(0.95);
        }

        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          font-size: 0.5rem;
          padding: 2px 6px;
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-card, #ffffff);
          background: #e74c3c;
          color: white;
          font-weight: 700;
        }

        .notification-dropdown-panel {
          position: absolute;
          top: calc(100% + 8px);
          ${isArabic ? 'left: 0;' : 'right: 0;'}
          width: 420px;
          max-height: 520px;
          background: var(--bg-card, #ffffff);
          border-radius: 16px;
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
          border: 1px solid var(--border-color, #e9ecef);
          z-index: 1050;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideDown 0.25s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notification-panel-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #e9ecef);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
          background: var(--bg-card, #ffffff);
        }

        .notification-panel-header .fw-bold {
          font-size: 1rem;
          color: var(--text-primary, #2d3436);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notification-count-badge {
          font-size: 0.7rem;
          font-weight: 500;
          color: #e74c3c;
          background: rgba(231, 76, 60, 0.1);
          padding: 2px 10px;
          border-radius: 20px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn {
          background: none;
          border: none;
          font-size: 0.7rem;
          color: var(--text-secondary, #6c757d);
          padding: 4px 10px;
          border-radius: 6px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .action-btn:hover {
          background: rgba(26, 95, 122, 0.08);
          color: #1a5f7a;
        }

        .mark-read-btn {
          color: #1a5f7a;
          font-weight: 500;
        }

        .refresh-btn {
          padding: 4px 8px;
        }

        .refresh-btn .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .notification-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
          max-height: 400px;
        }

        .notification-list::-webkit-scrollbar {
          width: 4px;
        }

        .notification-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .notification-list::-webkit-scrollbar-thumb {
          background: var(--border-color, #e9ecef);
          border-radius: 10px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          position: relative;
        }

        .notification-item:hover {
          background: rgba(26, 95, 122, 0.04);
        }

        .notification-item.unread {
          background: rgba(26, 95, 122, 0.06);
          border-left-color: #1a5f7a;
        }

        .notification-item.unread:hover {
          background: rgba(26, 95, 122, 0.1);
        }

        .notification-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
          background: rgba(0, 0, 0, 0.04);
          margin-top: 2px;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .notification-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary, #2d3436);
        }

        .unread-dot {
          color: #1a5f7a;
          font-size: 0.5rem;
          margin-left: 4px;
        }

        .priority-badge {
          font-size: 0.55rem;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .notification-message {
          font-size: 0.78rem;
          color: var(--text-secondary, #6c757d);
          margin-top: 2px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notification-footer-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        .notification-time {
          font-size: 0.65rem;
          color: var(--text-secondary, #6c757d);
          opacity: 0.7;
          display: flex;
          align-items: center;
        }

        .notification-meta {
          font-size: 0.6rem;
          color: var(--text-secondary, #6c757d);
          background: rgba(0, 0, 0, 0.04);
          padding: 2px 8px;
          border-radius: 12px;
        }

        .delete-notification-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #6c757d);
          opacity: 0.4;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .delete-notification-btn:hover {
          opacity: 1;
          color: #e74c3c;
          background: rgba(231, 76, 60, 0.1);
        }

        .show-more-btn {
          width: 100%;
          padding: 10px;
          background: none;
          border: none;
          border-top: 1px solid var(--border-color, #e9ecef);
          color: var(--text-secondary, #6c757d);
          font-size: 0.78rem;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .show-more-btn:hover {
          background: rgba(26, 95, 122, 0.04);
          color: #1a5f7a;
        }

        .load-more-btn {
          width: 100%;
          padding: 10px;
          background: none;
          border: none;
          border-top: 1px solid var(--border-color, #e9ecef);
          color: #1a5f7a;
          font-size: 0.78rem;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .load-more-btn:hover:not(:disabled) {
          background: rgba(26, 95, 122, 0.04);
        }

        .load-more-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary, #6c757d);
        }

        .empty-state .empty-icon {
          opacity: 0.3;
          margin-bottom: 12px;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .empty-state small {
          font-size: 0.75rem;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
        }

        .notification-panel-footer {
          padding: 10px 20px;
          border-top: 1px solid var(--border-color, #e9ecef);
          flex-shrink: 0;
          background: var(--bg-card, #ffffff);
        }

        .view-all-btn {
          width: 100%;
          padding: 8px;
          background: none;
          border: none;
          color: var(--text-secondary, #6c757d);
          font-size: 0.78rem;
          transition: all 0.2s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .view-all-btn:hover {
          color: #1a5f7a;
          background: rgba(26, 95, 122, 0.04);
          border-radius: 8px;
        }

        /* RTL Specific */
        [dir="rtl"] .notification-item {
          border-left: none;
          border-right: 3px solid transparent;
        }

        [dir="rtl"] .notification-item.unread {
          border-right-color: #1a5f7a;
        }

        [dir="rtl"] .unread-dot {
          margin-left: 0;
          margin-right: 4px;
        }

        [dir="rtl"] .notification-time .me-1 {
          margin-right: 0 !important;
          margin-left: 0.25rem !important;
        }

        [dir="rtl"] .ms-1 {
          margin-left: 0 !important;
          margin-right: 0.25rem !important;
        }

        /* Responsive */
        @media (max-width: 576px) {
          .notification-dropdown-panel {
            width: 340px;
            right: -60px;
            max-height: 450px;
          }

          [dir="rtl"] .notification-dropdown-panel {
            right: auto;
            left: -60px;
          }

          .notification-item {
            padding: 10px 14px;
          }

          .notification-panel-header {
            padding: 12px 14px;
          }

          .notification-panel-footer {
            padding: 8px 14px;
          }
        }

        @media (max-width: 400px) {
          .notification-dropdown-panel {
            width: 300px;
            right: -40px;
          }

          [dir="rtl"] .notification-dropdown-panel {
            right: auto;
            left: -40px;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;