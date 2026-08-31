// src/hooks/useNotification.js
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from './useAuth';
import { 
  addNotification as addNotificationAction,
  removeNotification as removeNotificationAction,
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
} from '../store/slices/notificationSlice';

export const useNotification = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { notifications: reduxNotifications, unreadCount: reduxUnreadCount } = useSelector(
    (state) => state.notifications || { notifications: [], unreadCount: 0 }
  );
  
  // Local state for notifications (for non-Redux usage)
  const [localNotifications, setLocalNotifications] = useState([]);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  const getUserRole = () => {
    return user?.role || localStorage.getItem('role') || 'admin';
  };

  // Load notifications based on role
  const loadNotifications = useCallback(() => {
    const role = getUserRole();
    const all = notificationService.getNotifications();
    const filtered = notificationService.getNotificationsByRole(role);
    setLocalNotifications(filtered);
    setLocalUnreadCount(filtered.filter(n => !n.read).length);
    
    // Also update Redux if available
    if (dispatch && addNotificationAction) {
      // Sync with Redux
      filtered.forEach(n => {
        if (!reduxNotifications.find(rn => rn.id === n.id)) {
          dispatch(addNotificationAction(n));
        }
      });
    }
  }, [user, dispatch]);

  // Main notify function for toast messages
  const notify = useCallback((message, type = 'info', options = {}) => {
    try {
      switch (type) {
        case 'success':
          toast.success(message, options);
          break;
        case 'error':
          toast.error(message, options);
          break;
        case 'warning':
          toast.warning(message, options);
          break;
        case 'info':
        default:
          toast.info(message, options);
          break;
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      console.log(`[${type}] ${message}`);
    }
  }, []);

  // Add notification
  const addNotification = (title, message, type = 'info', link = null, metadata = {}) => {
    const notif = notificationService.addNotification(title, message, type, link, metadata);
    loadNotifications();
    
    if (dispatch && addNotificationAction) {
      dispatch(addNotificationAction(notif));
    }
    
    // Show toast notification
    notify(message, type === 'registration' ? 'info' : type);
    
    return notif;
  };

  // Mark as read
  const markAsRead = (id) => {
    notificationService.markAsRead(id);
    loadNotifications();
    
    if (dispatch && markAsReadAction) {
      dispatch(markAsReadAction(id));
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    const role = getUserRole();
    notificationService.markAllAsRead(role);
    loadNotifications();
    
    if (dispatch && markAllAsReadAction) {
      dispatch(markAllAsReadAction());
    }
  };

  // Delete notification
  const deleteNotification = (id) => {
    notificationService.removeNotification(id);
    loadNotifications();
    
    if (dispatch && removeNotificationAction) {
      dispatch(removeNotificationAction(id));
    }
  };

  // Clear all
  const clearAll = () => {
    notificationService.clearAll();
    loadNotifications();
    
    if (dispatch && removeNotificationAction) {
      dispatch(removeNotificationAction());
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const icons = {
      registration: '📝',
      announcement: '📢',
      assignment: '📋',
      submission: '📤',
      grade: '📊',
      attendance: '✅',
      schedule: '📅',
      system: '⚙️',
      reminder: '🔔',
      payment: '💰'
    };
    return icons[type] || '📌';
  };

  // Get notification color
  const getNotificationColor = (type) => {
    const colors = {
      registration: '#f39c12',
      announcement: '#e67e22',
      assignment: '#3498db',
      submission: '#2ecc71',
      grade: '#9b59b6',
      attendance: '#1abc9c',
      schedule: '#e74c3c',
      system: '#4a9eff',
      reminder: '#f39c12',
      payment: '#2ecc71'
    };
    return colors[type] || '#6c757d';
  };

  // Setup listeners
  useEffect(() => {
    // Initial load
    loadNotifications();

    // Listen for changes
    const unsubscribe = notificationService.addListener(() => {
      loadNotifications();
    });

    // Listen for custom events
    const handleNotificationAdded = () => {
      loadNotifications();
    };
    window.addEventListener('notificationAdded', handleNotificationAdded);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('notificationAdded', handleNotificationAdded);
    };
  }, [loadNotifications]);

  // Use either Redux or local state
  const notifications = reduxNotifications.length > 0 ? reduxNotifications : localNotifications;
  const unreadCount = reduxUnreadCount > 0 ? reduxUnreadCount : localUnreadCount;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    loadNotifications,
    getNotificationIcon,
    getNotificationColor,
    notify
  };
};