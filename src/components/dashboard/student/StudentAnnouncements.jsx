// src/components/dashboard/student/StudentAnnouncements.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Row, Col, Card, Badge, Button, Form, 
  InputGroup, Alert, Spinner, Pagination, Nav, Tab,
  Modal, Dropdown, ProgressBar
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBell, FaBullhorn, FaCalendarAlt, FaClock, FaUser,
  FaEnvelope, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaSearch, FaFilter, FaSort, FaEye, FaShare, FaBookmark,
  FaRegBookmark, FaThumbsUp, FaComment, FaPaperPlane,
  FaArrowRight, FaArrowLeft, FaSync, FaDownload,
  FaPrint, FaFile, FaImage, FaVideo, FaTag, FaUsers,
  FaStar, FaRegStar, FaInfoCircle, FaNewspaper,
  FaGraduationCap, FaChalkboardTeacher, FaUserGraduate,
  FaTrash, FaTrashAlt, FaCheckDouble, FaSpinner,
  FaTimes
} from 'react-icons/fa';
import { format, formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// ===== FIXED IMPORT PATHS =====
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../hooks/useNotification';
import {
  getTranslation,
  getAnnouncementTitle,
  getAnnouncementContent,
  getAnnouncementTranslation,
  getAnnouncementKeys,
  getAllAnnouncements
} from '../../../utils/translations';

// ===== HELPER FUNCTIONS =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const getAnnouncementsFromStorage = () => {
  try {
    const stored = localStorage.getItem('announcements');
    if (stored) {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error('Error getting announcements:', error);
    return [];
  }
};

const getNotificationsFromStorage = () => {
  try {
    const stored = localStorage.getItem('school_notifications');
    if (stored) {
      const data = JSON.parse(stored);
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

const saveNotificationsToStorage = (notifications) => {
  try {
    localStorage.setItem('school_notifications', JSON.stringify(notifications));
    return true;
  } catch (error) {
    console.error('Error saving notifications:', error);
    return false;
  }
};

const saveAnnouncementsToStorage = (announcements) => {
  try {
    localStorage.setItem('announcements', JSON.stringify(announcements));
    return true;
  } catch (error) {
    console.error('Error saving announcements:', error);
    return false;
  }
};

const StudentAnnouncements = () => {
  const { isArabic, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();
  const notificationSound = useRef(null);

  // ===== STATE =====
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(6);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('announcements');
  const [sortBy, setSortBy] = useState('newest');

  // ===== DELETE MODAL STATE =====
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.95rem, 1.2vw, 1.1rem)' : 'clamp(0.9rem, 1.1vw, 1.05rem)',
  };

  // ===== CHECK DARK MODE & MOBILE =====
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark' ||
        document.querySelector('.dashboard-wrapper.dark-theme') !== null;
      setDarkMode(isDark);
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ===== TYPE & PRIORITY OPTIONS =====
  const typeOptions = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'announcement', label: isArabic ? 'إعلان' : 'Announcement', icon: <FaBullhorn />, color: '#c49a6c' },
    { value: 'event', label: isArabic ? 'حدث' : 'Event', icon: <FaCalendarAlt />, color: '#2ecc71' },
    { value: 'meeting', label: isArabic ? 'اجتماع' : 'Meeting', icon: <FaUsers />, color: '#f39c12' },
    { value: 'exam', label: isArabic ? 'امتحان' : 'Exam', icon: <FaCheckCircle />, color: '#e74c3c' },
    { value: 'news', label: isArabic ? 'خبر' : 'News', icon: <FaNewspaper />, color: '#9b59b6' },
  ];

  const priorityOptions = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'high', label: isArabic ? 'عالي' : 'High', color: '#e74c3c' },
    { value: 'medium', label: isArabic ? 'متوسط' : 'Medium', color: '#f39c12' },
    { value: 'low', label: isArabic ? 'منخفض' : 'Low', color: '#2ecc71' }
  ];

  const statusOptions = [
    { value: 'all', label: isArabic ? 'الكل' : 'All' },
    { value: 'read', label: isArabic ? 'مقروء' : 'Read', color: '#2ecc71' },
    { value: 'unread', label: isArabic ? 'غير مقروء' : 'Unread', color: '#e74c3c' }
  ];

  // ===== GET TYPE LABELS =====
  const getTypeLabel = (type) => {
    const found = typeOptions.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getTypeIcon = (type) => {
    const found = typeOptions.find(t => t.value === type);
    return found ? found.icon : <FaBullhorn />;
  };

  const getTypeColor = (type) => {
    const found = typeOptions.find(t => t.value === type);
    return found ? found.color : '#6c757d';
  };

  const getPriorityLabel = (priority) => {
    const found = priorityOptions.find(p => p.value === priority);
    return found ? found.label : priority;
  };

  const getPriorityColor = (priority) => {
    const found = priorityOptions.find(p => p.value === priority);
    return found ? found.color : '#6c757d';
  };

  // ===== GET TRANSLATED CONTENT =====
  const getTranslatedTitle = (announcement) => {
    if (!announcement) return '';
    if (announcement.translationKey) {
      const translation = getAnnouncementTranslation(announcement.translationKey, language);
      if (translation.title !== announcement.translationKey) {
        return translation.title;
      }
    }
    return isArabic ? (announcement.titleAr || announcement.title) : announcement.title;
  };

  const getTranslatedContent = (announcement) => {
    if (!announcement) return '';
    if (announcement.translationKey) {
      const translation = getAnnouncementTranslation(announcement.translationKey, language);
      if (translation.content !== announcement.translationKey) {
        return translation.content;
      }
    }
    return isArabic ? (announcement.contentAr || announcement.content) : announcement.content;
  };

  // ===== LOAD DATA =====
  const loadData = () => {
    setLoading(true);
    try {
      // Load announcements
      const allAnnouncements = getAnnouncementsFromStorage();
      const publishedAnnouncements = allAnnouncements.filter(a => a.status === 'published' && a.isActive !== false);
      
      // Load notifications
      const allNotifications = getNotificationsFromStorage();
      
      // Filter notifications for this student
      let userNotifications = [];
      if (user) {
        const userEmail = user.email || '';
        const userId = user.id || '';
        
        userNotifications = allNotifications.filter(n => {
          if (n.recipientEmail === userEmail) return true;
          if (n.recipientId === userId) return true;
          if (n.studentId === userId) return true;
          
          if (n.targetAudience) {
            if (n.targetAudience.includes('all')) return true;
            if (n.targetAudience.includes('students') && user.role === 'student') return true;
            if (n.targetAudience.includes('parents') && user.role === 'parent') return true;
            if (n.targetAudience.includes('teachers') && user.role === 'teacher') return true;
          }
          
          return false;
        });
      }
      
      setNotifications(userNotifications);
      
      // Calculate unread count
      const unread = userNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // Sort announcements by date
      const sortedAnnouncements = publishedAnnouncements.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        if (sortBy === 'newest') return dateB - dateA;
        if (sortBy === 'oldest') return dateA - dateB;
        if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
        return dateB - dateA;
      });
      
      setAnnouncements(sortedAnnouncements);
      applyFilters(sortedAnnouncements);
    } catch (error) {
      console.error('Error loading data:', error);
      if (notify) {
        notify(isArabic ? 'فشل في تحميل البيانات' : 'Failed to load data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== APPLY FILTERS =====
  const applyFilters = (data = announcements) => {
    let filtered = [...data];
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        (a.title || '').toLowerCase().includes(searchLower) ||
        (a.titleAr || '').toLowerCase().includes(searchLower) ||
        (a.content || '').toLowerCase().includes(searchLower) ||
        (a.contentAr || '').toLowerCase().includes(searchLower) ||
        (a.author || '').toLowerCase().includes(searchLower)
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.type === filterType);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(a => a.priority === filterPriority);
    }
    
    if (filterStatus !== 'all') {
      if (filterStatus === 'read') {
        filtered = filtered.filter(a => a.isRead === true);
      } else if (filterStatus === 'unread') {
        filtered = filtered.filter(a => !a.isRead);
      }
    }
    
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);
    setFilteredAnnouncements(paginated);
  };

  // ===== EFFECTS =====
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [announcements, searchTerm, filterType, filterPriority, filterStatus, currentPage]);

  // ===== LISTEN FOR NEW NOTIFICATIONS =====
  useEffect(() => {
    const handleNewNotification = (event) => {
      const detail = event.detail;
      if (detail) {
        const isForStudent = detail.targetAudience?.includes('all') || 
                            detail.targetAudience?.includes('students');
        if (isForStudent) {
          setNotifications(prev => {
            const updated = [{
              ...detail,
              read: false,
              createdAt: new Date().toISOString()
            }, ...prev];
            return updated;
          });
          setUnreadCount(prev => prev + 1);
          playNotificationSound();
          if (notify) {
            notify(
              isArabic ? `📢 إعلان جديد: ${detail.titleAr || detail.title}` : 
              `📢 New Announcement: ${detail.title}`,
              'info'
            );
          }
        }
      }
    };

    const handleAnnouncementAdded = (event) => {
      const detail = event.detail;
      if (detail && detail.announcement) {
        const ann = detail.announcement;
        if (ann.status === 'published' && ann.isActive !== false) {
          const targetAudience = ann.targetAudience || [];
          if (targetAudience.includes('all') || targetAudience.includes('students')) {
            setAnnouncements(prev => [ann, ...prev]);
          }
        }
      }
    };

    window.addEventListener('newNotification', handleNewNotification);
    window.addEventListener('announcementsUpdated', loadData);
    window.addEventListener('announcementAdded', handleAnnouncementAdded);

    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
      window.removeEventListener('announcementsUpdated', loadData);
      window.removeEventListener('announcementAdded', handleAnnouncementAdded);
    };
  }, []);

  // ===== PLAY NOTIFICATION SOUND =====
  const playNotificationSound = () => {
    try {
      if (notificationSound.current) {
        notificationSound.current.play().catch(() => {});
      }
    } catch (error) {
      console.log('Sound play error:', error);
    }
  };

  // ===== MARK NOTIFICATION AS READ =====
  const markAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(n => {
      if (n.id === notificationId) {
        return { ...n, read: true };
      }
      return n;
    });
    setNotifications(updatedNotifications);
    
    const unread = updatedNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    
    const allNotifications = getNotificationsFromStorage();
    const updatedAll = allNotifications.map(n => {
      if (n.id === notificationId) {
        return { ...n, read: true };
      }
      return n;
    });
    saveNotificationsToStorage(updatedAll);
  };

  // ===== MARK ALL NOTIFICATIONS AS READ =====
  const markAllNotificationsAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    
    const allNotifications = getNotificationsFromStorage();
    const updatedAll = allNotifications.map(n => {
      if (n.targetAudience && (n.targetAudience.includes('all') || n.targetAudience.includes('students'))) {
        return { ...n, read: true };
      }
      return n;
    });
    saveNotificationsToStorage(updatedAll);
    
    if (notify) {
      notify(isArabic ? 'تم تحديد الكل كمقروء' : 'All marked as read', 'success');
    }
  };

  // ===== DELETE SINGLE ANNOUNCEMENT =====
  const handleDeleteClick = (announcement, e) => {
    e.stopPropagation();
    setAnnouncementToDelete(announcement);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!announcementToDelete) return;
    
    setDeleting(true);
    try {
      const allAnnouncements = getAnnouncementsFromStorage();
      const updatedAnnouncements = allAnnouncements.filter(a => a.id !== announcementToDelete.id);
      
      saveAnnouncementsToStorage(updatedAnnouncements);
      
      // Also remove from notifications
      const allNotifications = getNotificationsFromStorage();
      const updatedNotifications = allNotifications.filter(n => n.announcementId !== announcementToDelete.id);
      saveNotificationsToStorage(updatedNotifications);
      
      // Update local state
      setAnnouncements(prev => prev.filter(a => a.id !== announcementToDelete.id));
      
      if (notify) {
        notify(
          isArabic ? 'تم حذف الإعلان بنجاح' : 'Announcement deleted successfully',
          'success'
        );
      }
      
      setShowDeleteModal(false);
      setAnnouncementToDelete(null);
      loadData();
      
    } catch (error) {
      console.error('Error deleting announcement:', error);
      if (notify) {
        notify(
          isArabic ? 'فشل في حذف الإعلان' : 'Failed to delete announcement',
          'error'
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAnnouncementToDelete(null);
    setDeleting(false);
  };

  // ===== DELETE ALL ANNOUNCEMENTS =====
  const handleDeleteAll = () => {
    const confirmDeleteAll = window.confirm(
      isArabic 
        ? 'هل أنت متأكد من حذف جميع الإعلانات؟ هذا الإجراء لا يمكن التراجع عنه.'
        : 'Are you sure you want to delete all announcements? This action cannot be undone.'
    );
    
    if (!confirmDeleteAll) return;
    
    setDeletingAll(true);
    try {
      // Keep only announcements that are NOT for students (if any)
      const allAnnouncements = getAnnouncementsFromStorage();
      const studentAnnouncements = allAnnouncements.filter(a => {
        const targetAudience = a.targetAudience || [];
        return targetAudience.includes('all') || targetAudience.includes('students');
      });
      
      // Remove student announcements
      const updatedAnnouncements = allAnnouncements.filter(a => {
        const targetAudience = a.targetAudience || [];
        return !(targetAudience.includes('all') || targetAudience.includes('students'));
      });
      
      saveAnnouncementsToStorage(updatedAnnouncements);
      
      // Also remove student notifications
      const allNotifications = getNotificationsFromStorage();
      const updatedNotifications = allNotifications.filter(n => {
        const isStudent = n.targetAudience?.includes('all') || n.targetAudience?.includes('students');
        return !isStudent;
      });
      saveNotificationsToStorage(updatedNotifications);
      
      // Update local state
      setAnnouncements(prev => prev.filter(a => {
        const targetAudience = a.targetAudience || [];
        return !(targetAudience.includes('all') || targetAudience.includes('students'));
      }));
      
      if (notify) {
        notify(
          isArabic ? `تم حذف جميع الإعلانات (${studentAnnouncements.length})` : `Deleted all announcements (${studentAnnouncements.length})`,
          'success'
        );
      }
      
      loadData();
      
    } catch (error) {
      console.error('Error deleting all announcements:', error);
      if (notify) {
        notify(
          isArabic ? 'فشل في حذف جميع الإعلانات' : 'Failed to delete all announcements',
          'error'
        );
      }
    } finally {
      setDeletingAll(false);
    }
  };

  // ===== VIEW ANNOUNCEMENT =====
  const viewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowViewModal(true);
    
    const allAnnouncements = getAnnouncementsFromStorage();
    const updatedAnnouncements = allAnnouncements.map(a => {
      if (a.id === announcement.id) {
        return { ...a, views: (a.views || 0) + 1 };
      }
      return a;
    });
    saveAnnouncementsToStorage(updatedAnnouncements);
    
    const updatedAnn = { ...announcement, views: (announcement.views || 0) + 1 };
    setSelectedAnnouncement(updatedAnn);
    setAnnouncements(prev => prev.map(a => a.id === announcement.id ? updatedAnn : a));
  };

  // ===== RENDER NOTIFICATION CARD =====
  const renderNotificationCard = (notification) => {
    const isUnread = !notification.read;
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
      addSuffix: true,
      locale: isArabic ? ar : enUS
    });
    
    const title = isArabic ? (notification.titleAr || notification.title) : notification.title;
    const message = isArabic ? (notification.messageAr || notification.message) : notification.message;
    
    return (
      <div 
        key={notification.id} 
        className={`notification-item ${isUnread ? 'unread' : 'read'}`}
        style={{
          background: darkMode ? '#1a1a2e' : '#ffffff',
          border: `1px solid ${isUnread ? '#c49a6c' : darkMode ? '#2d2d44' : '#e9ecef'}`,
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '12px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          borderLeft: isUnread ? '4px solid #c49a6c' : '4px solid transparent'
        }}
        onClick={() => {
          markAsRead(notification.id);
          if (notification.link) {
            navigate(notification.link);
          }
        }}
      >
        <div className="d-flex justify-content-between align-items-start">
          <div className="d-flex align-items-start gap-3">
            <div 
              className="notification-icon"
              style={{
                background: isUnread ? 'rgba(196, 154, 108, 0.15)' : 'rgba(108, 117, 125, 0.1)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: isUnread ? '#c49a6c' : '#6c757d'
              }}
            >
              {notification.type === 'announcement' ? <FaBullhorn /> :
               notification.type === 'event' ? <FaCalendarAlt /> :
               notification.type === 'exam' ? <FaCheckCircle /> :
               notification.type === 'meeting' ? <FaUsers /> :
               <FaBell />}
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h6 className="mb-0 fw-bold" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {title}
                </h6>
                {isUnread && (
                  <Badge style={{ background: '#c49a6c', color: 'white', borderRadius: '50px', fontSize: '0.6rem' }}>
                    {isArabic ? 'جديد' : 'New'}
                  </Badge>
                )}
                {notification.priority === 'high' && (
                  <Badge style={{ background: '#e74c3c', color: 'white', borderRadius: '50px', fontSize: '0.6rem' }}>
                    {isArabic ? 'عاجل' : 'Urgent'}
                  </Badge>
                )}
              </div>
              <p className="mb-1" style={{ color: darkMode ? '#adb5bd' : '#6c757d', fontSize: '0.9rem' }}>
                {message}
              </p>
              <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.7rem' }}>
                <FaClock className="me-1" /> {timeAgo}
                {notification.author && (
                  <> · <FaUser className="me-1" /> {notification.author}</>
                )}
              </small>
            </div>
          </div>
          {!notification.read && (
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 text-muted"
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
              }}
              style={{ fontSize: '0.7rem' }}
            >
              {isArabic ? 'تحديد كمقروء' : 'Mark read'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ===== RENDER ANNOUNCEMENT CARD =====
  const renderAnnouncementCard = (announcement) => {
    const typeColor = getTypeColor(announcement.type);
    const priorityColor = getPriorityColor(announcement.priority);
    const title = getTranslatedTitle(announcement);
    const content = getTranslatedContent(announcement);
    const timeAgo = formatDistanceToNow(new Date(announcement.date || announcement.createdAt), { 
      addSuffix: true,
      locale: isArabic ? ar : enUS
    });
    const isUrgent = announcement.priority === 'high';
    
    return (
      <Col key={announcement.id} xs={12} md={6} lg={4}>
        <div 
          className="announcement-card h-100"
          style={{
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${isUrgent ? '#e74c3c' : darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '16px',
            padding: '20px',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
          onClick={() => viewAnnouncement(announcement)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Delete Button */}
          <Button
            variant="danger"
            size="sm"
            className="delete-btn"
            onClick={(e) => handleDeleteClick(announcement, e)}
            style={{
              position: 'absolute',
              top: '8px',
              right: isArabic ? 'auto' : '8px',
              left: isArabic ? '8px' : 'auto',
              zIndex: 20,
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.5,
              transition: 'all 0.3s ease',
              background: darkMode 
                ? 'rgba(220, 53, 69, 0.2)' 
                : 'rgba(220, 53, 69, 0.1)',
              border: 'none',
              color: '#dc3545',
              fontSize: '0.8rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc3545';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = darkMode 
                ? 'rgba(220, 53, 69, 0.2)' 
                : 'rgba(220, 53, 69, 0.1)';
              e.currentTarget.style.color = '#dc3545';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.opacity = '0.5';
            }}
            title={isArabic ? 'حذف الإعلان' : 'Delete announcement'}
          >
            <FaTrash size={14} />
          </Button>

          {isUrgent && (
            <div 
              className="urgent-badge"
              style={{
                position: 'absolute',
                top: '0',
                right: isArabic ? 'auto' : '0',
                left: isArabic ? '0' : 'auto',
                background: '#e74c3c',
                color: 'white',
                padding: '4px 16px',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                borderRadius: '0 0 8px 8px'
              }}
            >
              ⚡ {isArabic ? 'عاجل' : 'URGENT'}
            </div>
          )}
          
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div className="d-flex align-items-center gap-2">
              <div 
                className="type-icon"
                style={{
                  background: `${typeColor}20`,
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: typeColor
                }}
              >
                {getTypeIcon(announcement.type)}
              </div>
              <Badge 
                style={{ 
                  background: priorityColor,
                  color: 'white',
                  borderRadius: '50px',
                  fontSize: '0.6rem'
                }}
              >
                {getPriorityLabel(announcement.priority)}
              </Badge>
            </div>
            <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.65rem' }}>
              <FaClock className="me-1" /> {timeAgo}
            </small>
          </div>
          
          <h5 
            className="fw-bold mb-2"
            style={{ 
              color: darkMode ? '#e9ecef' : '#212529',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              paddingRight: isArabic ? '0' : '32px',
              paddingLeft: isArabic ? '32px' : '0'
            }}
          >
            {title}
          </h5>
          
          <p 
            className="mb-3"
            style={{ 
              color: darkMode ? '#adb5bd' : '#6c757d',
              fontSize: '0.9rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {content}
          </p>
          
          {(announcement.image || announcement.video) && (
            <div className="mb-2">
              {announcement.mediaType === 'image' && (
                <img 
                  src={announcement.image} 
                  alt={title} 
                  style={{ 
                    width: '100%', 
                    height: '120px', 
                    objectFit: 'cover', 
                    borderRadius: '8px' 
                  }} 
                />
              )}
              {announcement.mediaType === 'video' && (
                <video 
                  src={announcement.video} 
                  style={{ 
                    width: '100%', 
                    height: '120px', 
                    objectFit: 'cover', 
                    borderRadius: '8px' 
                  }} 
                />
              )}
            </div>
          )}
          
          <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
            <div className="d-flex gap-2">
              <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.65rem' }}>
                <FaEye className="me-1" /> {formatNumber(announcement.views || 0)}
              </small>
              <small style={{ color: darkMode ? '#6c757d' : '#adb5bd', fontSize: '0.65rem' }}>
                <FaThumbsUp className="me-1" /> {formatNumber(announcement.likes || 0)}
              </small>
            </div>
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 text-decoration-none"
              style={{ color: '#c49a6c', fontSize: '0.75rem' }}
              onClick={(e) => {
                e.stopPropagation();
                viewAnnouncement(announcement);
              }}
            >
              {isArabic ? 'اقرأ المزيد' : 'Read More'} <FaArrowRight className="ms-1" />
            </Button>
          </div>
        </div>
      </Col>
    );
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="text-center py-5" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري تحميل الإعلانات...' : 'Loading announcements...'}
        </p>
      </div>
    );
  }

  return (
    <div className="student-announcements" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Audio for notifications */}
      <audio ref={notificationSound} style={{ display: 'none' }}>
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>

      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ ...arabicFontStyle, color: '#c49a6c', fontSize: isArabic ? 'clamp(1.1rem, 1.8vw, 1.5rem)' : 'clamp(1rem, 1.6vw, 1.4rem)' }}>
            <FaBell className="me-2" /> 
            {isArabic ? 'الإعلانات والإشعارات' : 'Announcements & Notifications'}
          </h4>
          <p className="text-muted mb-0" style={{ ...arabicFontStyle, fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)' }}>
            {isArabic 
              ? `ابق على اطلاع بآخر الإعلانات (${formatNumber(totalItems)} إعلان)`
              : `Stay updated with the latest announcements (${formatNumber(totalItems)} announcements)`}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {unreadCount > 0 && (
            <Badge 
              style={{ 
                background: '#c49a6c', 
                color: 'white', 
                borderRadius: '50px',
                padding: '8px 16px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FaBell className={unreadCount > 0 ? 'animate-pulse' : ''} />
              {isArabic ? `${formatNumber(unreadCount)} إشعار جديد` : `${formatNumber(unreadCount)} new notification${unreadCount > 1 ? 's' : ''}`}
            </Badge>
          )}
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={loadData}
            style={{ ...arabicFontStyle, borderRadius: '12px' }}
          >
            <FaSync className="me-1" /> {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="tabs" className="mb-4" style={{ borderBottom: `2px solid ${darkMode ? '#2d2d44' : '#e9ecef'}` }}>
          <Nav.Item>
            <Nav.Link 
              eventKey="announcements" 
              style={{ 
                color: activeTab === 'announcements' ? '#c49a6c' : darkMode ? '#adb5bd' : '#6c757d',
                fontWeight: activeTab === 'announcements' ? 'bold' : 'normal',
                borderBottom: activeTab === 'announcements' ? '2px solid #c49a6c' : 'none',
                ...arabicFontStyle
              }}
            >
              <FaBullhorn className="me-2" /> 
              {isArabic ? 'الإعلانات' : 'Announcements'}
              <Badge className="ms-2" style={{ background: '#c49a6c', color: 'white', borderRadius: '50px' }}>
                {formatNumber(announcements.length)}
              </Badge>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              eventKey="notifications" 
              style={{ 
                color: activeTab === 'notifications' ? '#c49a6c' : darkMode ? '#adb5bd' : '#6c757d',
                fontWeight: activeTab === 'notifications' ? 'bold' : 'normal',
                borderBottom: activeTab === 'notifications' ? '2px solid #c49a6c' : 'none',
                ...arabicFontStyle,
                position: 'relative'
              }}
            >
              <FaBell className="me-2" /> 
              {isArabic ? 'الإشعارات' : 'Notifications'}
              {unreadCount > 0 && (
                <span 
                  className="ms-2"
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}
                >
                  {formatNumber(unreadCount)}
                </span>
              )}
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* ANNOUNCEMENTS TAB */}
          <Tab.Pane eventKey="announcements">
            {/* Filters and Actions */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={announcements.length === 0 || deletingAll}
                  style={{ ...arabicFontStyle, borderRadius: '50px' }}
                >
                  {deletingAll ? (
                    <>
                      <FaSpinner className="spinning me-1" />
                      {isArabic ? 'جاري الحذف...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <FaTrashAlt className="me-1" />
                      {isArabic ? 'حذف الكل' : 'Delete All'}
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-muted small" style={{ ...arabicFontStyle, fontSize: '0.75rem' }}>
                {isArabic 
                  ? `عرض ${formatNumber(filteredAnnouncements.length)} من ${formatNumber(totalItems)} إعلان`
                  : `Showing ${formatNumber(filteredAnnouncements.length)} of ${formatNumber(totalItems)} announcements`}
              </div>
            </div>

            {/* Filters */}
            <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
              <Card.Body>
                <Row className="g-3">
                  <Col xs={12} md={5} lg={4}>
                    <InputGroup>
                      <InputGroup.Text style={{ background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px 0 0 12px' }}>
                        <FaSearch className="text-muted" />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder={isArabic ? 'بحث في الإعلانات...' : 'Search announcements...'}
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529' }}
                      />
                      {searchTerm && (
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => setSearchTerm('')}
                          style={{ ...arabicFontStyle, borderRadius: '0 12px 12px 0' }}
                        >
                          <FaTimesCircle />
                        </Button>
                      )}
                    </InputGroup>
                  </Col>
                  <Col xs={4} md={2} lg={2}>
                    <Form.Select
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                    >
                      {typeOptions.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col xs={4} md={2} lg={2}>
                    <Form.Select
                      value={filterPriority}
                      onChange={(e) => {
                        setFilterPriority(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                    >
                      {priorityOptions.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col xs={4} md={2} lg={2}>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{ ...arabicFontStyle, background: darkMode ? '#2d2d44' : 'white', color: darkMode ? '#e9ecef' : '#212529', borderRadius: '12px' }}
                    >
                      <option value="newest">{isArabic ? 'الأحدث' : 'Newest'}</option>
                      <option value="oldest">{isArabic ? 'الأقدم' : 'Oldest'}</option>
                      <option value="popular">{isArabic ? 'الأكثر مشاهدة' : 'Most Viewed'}</option>
                    </Form.Select>
                  </Col>
                  <Col xs={12} md={12} lg={2} className="d-flex gap-2">
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="flex-grow-1"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterType('all');
                        setFilterPriority('all');
                        setSortBy('newest');
                        setCurrentPage(1);
                      }}
                      style={{ ...arabicFontStyle, borderRadius: '12px' }}
                    >
                      <FaFilter className="me-1" /> {isArabic ? 'مسح' : 'Clear'}
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Announcements Grid */}
            {filteredAnnouncements.length === 0 ? (
              <div className="text-center py-5">
                <FaBullhorn size={48} className="text-muted opacity-25 mb-3" />
                <h5 style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {isArabic ? 'لا توجد إعلانات' : 'No announcements'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? 'سوف تظهر هنا الإعلانات الجديدة من الإدارة والمعلمين' 
                    : 'New announcements from administration and teachers will appear here'}
                </p>
              </div>
            ) : (
              <>
                <Row className="g-4">
                  {filteredAnnouncements.map(renderAnnouncementCard)}
                </Row>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 mt-4 border-top gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
                    <div className="text-muted small" style={{ ...arabicFontStyle, color: darkMode ? '#adb5bd' : '#6c757d', fontSize: isMobile ? '0.65rem' : 'inherit' }}>
                      {isArabic 
                        ? `عرض ${formatNumber(filteredAnnouncements.length)} من ${formatNumber(totalItems)} إعلان`
                        : `Showing ${formatNumber(filteredAnnouncements.length)} of ${formatNumber(totalItems)} announcements`}
                    </div>
                    <Pagination className="mb-0" size={isMobile ? 'sm' : 'md'}>
                      <Pagination.Prev 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      />
                      {[...Array(Math.min(totalPages, isMobile ? 3 : 5))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= (isMobile ? 3 : 5)) {
                          pageNum = i + 1;
                        } else if (currentPage <= (isMobile ? 2 : 3)) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - (isMobile ? 1 : 2)) {
                          pageNum = totalPages - (isMobile ? 2 : 4) + i;
                        } else {
                          pageNum = currentPage - (isMobile ? 1 : 2) + i;
                        }
                        return (
                          <Pagination.Item
                            key={pageNum}
                            active={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                            style={{ color: darkMode ? '#e9ecef' : '#212529', borderRadius: '8px' }}
                          >
                            {formatNumber(pageNum)}
                          </Pagination.Item>
                        );
                      })}
                      <Pagination.Next 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Tab.Pane>

          {/* NOTIFICATIONS TAB */}
          <Tab.Pane eventKey="notifications">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529' }}>
                {isArabic ? 'الإشعارات' : 'Notifications'}
                {unreadCount > 0 && (
                  <Badge className="ms-2" style={{ background: '#e74c3c', color: 'white', borderRadius: '50px' }}>
                    {formatNumber(unreadCount)} {isArabic ? 'غير مقروء' : 'unread'}
                  </Badge>
                )}
              </h5>
              <div className="d-flex gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={markAllNotificationsAsRead}
                    style={{ ...arabicFontStyle, borderRadius: '12px' }}
                  >
                    <FaCheckDouble className="me-1" /> 
                    {isArabic ? 'تحديد الكل كمقروء' : 'Mark all as read'}
                  </Button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-5">
                <FaBell size={48} className="text-muted opacity-25 mb-3" />
                <h5 style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {isArabic ? 'لا توجد إشعارات' : 'No notifications'}
                </h5>
                <p className="text-muted" style={arabicFontStyle}>
                  {isArabic 
                    ? 'ستظهر هنا الإشعارات الجديدة' 
                    : 'New notifications will appear here'}
                </p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map(renderNotificationCard)}
              </div>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* ===== VIEW ANNOUNCEMENT MODAL ===== */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaEye className="me-2 text-primary" />
            {isArabic ? 'تفاصيل الإعلان' : 'Announcement Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          {selectedAnnouncement && (
            <div>
              <div className="text-center mb-4">
                <div 
                  className="announcement-avatar-lg mx-auto"
                  style={{
                    background: `linear-gradient(135deg, ${getTypeColor(selectedAnnouncement.type)}, ${getTypeColor(selectedAnnouncement.type)}dd)`,
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '2rem',
                    margin: '0 auto',
                    boxShadow: `0 8px 30px ${getTypeColor(selectedAnnouncement.type)}40`
                  }}
                >
                  {getTranslatedTitle(selectedAnnouncement).charAt(0).toUpperCase()}
                </div>
                <h4 className="fw-bold mt-3" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                  {getTranslatedTitle(selectedAnnouncement)}
                </h4>
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  <Badge style={{ background: getTypeColor(selectedAnnouncement.type), color: 'white', borderRadius: '8px' }}>
                    {getTypeIcon(selectedAnnouncement.type)} {getTypeLabel(selectedAnnouncement.type)}
                  </Badge>
                  <Badge style={{ background: getPriorityColor(selectedAnnouncement.priority), color: 'white', borderRadius: '8px' }}>
                    {getPriorityLabel(selectedAnnouncement.priority)}
                  </Badge>
                  <Badge style={{ background: '#6c757d', color: 'white', borderRadius: '8px' }}>
                    <FaUser className="me-1" /> {selectedAnnouncement.author || (isArabic ? 'المسؤول' : 'Admin')}
                  </Badge>
                </div>
              </div>

              {(selectedAnnouncement.image || selectedAnnouncement.video) && (
                <div className="mb-3">
                  {selectedAnnouncement.mediaType === 'image' && (
                    <img src={selectedAnnouncement.image} alt={selectedAnnouncement.title} className="img-fluid rounded" style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }} />
                  )}
                  {selectedAnnouncement.mediaType === 'video' && (
                    <video src={selectedAnnouncement.video} controls className="img-fluid rounded" style={{ maxHeight: '300px', width: '100%' }} />
                  )}
                </div>
              )}

              <div className="detail-item">
                <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529', whiteSpace: 'pre-wrap', fontSize: '1rem' }}>
                  {getTranslatedContent(selectedAnnouncement)}
                </p>
              </div>

              <Row className="mt-3">
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaCalendarAlt className="me-1" /> {isArabic ? 'التاريخ والوقت' : 'Date & Time'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {selectedAnnouncement.date || format(new Date(selectedAnnouncement.createdAt), 'PPP')}
                      {selectedAnnouncement.time && ` - ${selectedAnnouncement.time}`}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item">
                    <label className="text-muted small" style={arabicFontStyle}>
                      <FaEye className="me-1" /> {isArabic ? 'المشاهدات' : 'Views'}
                    </label>
                    <p className="fw-semibold mb-0" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                      {formatNumber(selectedAnnouncement.views || 0)}
                    </p>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={() => setShowViewModal(false)} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {isArabic ? 'إغلاق' : 'Close'}
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => {
              setShowViewModal(false);
              if (selectedAnnouncement) {
                setAnnouncementToDelete(selectedAnnouncement);
                setShowDeleteModal(true);
              }
            }}
            style={{ ...arabicFontStyle, borderRadius: '12px' }}
          >
            <FaTrash className="me-1" /> {isArabic ? 'حذف' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <Modal show={showDeleteModal} onHide={handleDeleteCancel} centered className="modern-modal">
        <Modal.Header closeButton className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Modal.Title style={{ ...arabicFontStyle, color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '1rem' : 'inherit' }}>
            <FaExclamationTriangle className="me-2 text-danger" />
            {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: darkMode ? '#0d1117' : 'white' }}>
          <div className="text-center mb-3">
            <div
              className="rounded-circle bg-danger bg-opacity-10 d-inline-flex p-3 mb-3"
              style={{
                width: '64px',
                height: '64px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaTrashAlt size={28} className="text-danger" />
            </div>
          </div>
          <p
            style={{
              ...arabicFontStyle,
              fontSize: 'clamp(0.9rem, 1vw, 1.05rem)',
              textAlign: 'center',
              color: darkMode ? '#e9ecef' : '#212529',
            }}
          >
            {isArabic
              ? `هل أنت متأكد من حذف الإعلان "${getTranslatedTitle(announcementToDelete)}"؟`
              : `Are you sure you want to delete the announcement "${getTranslatedTitle(announcementToDelete)}"?`}
          </p>
          <p
            className="text-muted text-center"
            style={{
              ...arabicFontStyle,
              fontSize: 'clamp(0.8rem, 0.9vw, 0.9rem)',
            }}
          >
            {isArabic
              ? 'هذا الإجراء لا يمكن التراجع عنه وسيتم حذف الإعلان نهائياً'
              : 'This action cannot be undone and the announcement will be permanently deleted'}
          </p>
          {announcementToDelete?.priority === 'high' && (
            <div
              className="mt-2 p-2 bg-warning bg-opacity-10 rounded-3 text-center"
              style={{
                border: '1px solid rgba(255, 193, 7, 0.3)',
              }}
            >
              <FaExclamationTriangle className="text-warning me-1" />
              <small
                style={{
                  ...arabicFontStyle,
                  color: darkMode ? '#e9ecef' : '#212529',
                }}
              >
                {isArabic
                  ? '⚠️ هذا إعلان مهم. هل أنت متأكد من حذفه؟'
                  : '⚠️ This is an important announcement. Are you sure you want to delete it?'}
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ background: darkMode ? '#1a1a2e' : 'white' }}>
          <Button variant="secondary" onClick={handleDeleteCancel} disabled={deleting} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            <FaTimes className="me-1" /> {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleting} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
            {deleting ? (
              <>
                <FaSpinner className="spinning me-2" />
                {isArabic ? 'جاري الحذف...' : 'Deleting...'}
              </>
            ) : (
              <>
                <FaTrash className="me-1" /> {isArabic ? 'تأكيد الحذف' : 'Confirm Delete'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .student-announcements {
          padding: 0;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .modern-card {
          background: ${darkMode ? '#1a1a2e' : '#ffffff'};
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .modern-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .modern-modal .modal-content {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .notification-item {
          transition: all 0.3s ease;
        }

        .notification-item:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .notification-item.unread {
          background: ${darkMode ? 'rgba(196, 154, 108, 0.05)' : 'rgba(196, 154, 108, 0.03)'};
        }

        .announcement-card {
          transition: all 0.3s ease;
        }

        .announcement-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.1);
        }

        .announcement-card:hover .delete-btn {
          opacity: 1 !important;
        }

        .delete-btn {
          transition: all 0.3s ease;
        }

        .detail-item {
          padding: 8px 0;
        }

        .detail-item label {
          display: block;
          font-size: 0.7rem;
          color: #6c757d;
          margin-bottom: 2px;
          font-weight: 500;
        }

        .detail-item p {
          font-size: 0.95rem;
          margin-bottom: 0;
        }

        .announcement-avatar-lg {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 2.5rem;
          margin: 0 auto;
          transition: transform 0.3s ease;
        }

        .announcement-avatar-lg:hover {
          transform: scale(1.05);
        }

        .nav-tabs .nav-link {
          border: none;
          padding: 12px 20px;
          transition: all 0.3s ease;
        }

        .nav-tabs .nav-link:hover {
          background: transparent;
          color: #c49a6c;
        }

        .nav-tabs .nav-link.active {
          background: transparent;
          border: none;
          color: #c49a6c;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          .announcement-card {
            padding: 16px !important;
          }
          .nav-tabs .nav-link {
            padding: 10px 12px;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 576px) {
          .announcement-card h5 {
            font-size: 0.9rem !important;
          }
          .announcement-card p {
            font-size: 0.8rem !important;
          }
          .nav-tabs .nav-link {
            padding: 8px 10px;
            font-size: 0.75rem;
          }
          .modern-modal .modal-header {
            padding: 12px 16px 0 !important;
          }
          .modern-modal .modal-body {
            padding: 12px 16px 16px !important;
          }
          .modern-modal .modal-footer {
            padding: 8px 16px 16px !important;
          }
          .delete-btn {
            width: 28px !important;
            height: 28px !important;
            font-size: 0.6rem !important;
            top: 6px !important;
            right: 6px !important;
          }
          .delete-btn svg {
            font-size: 12px !important;
          }
          .dashboard-wrapper.rtl .delete-btn {
            right: auto !important;
            left: 6px !important;
          }
        }

        [dir="rtl"] .me-1 {
          margin-right: 0 !important;
          margin-left: 0.25rem !important;
        }

        [dir="rtl"] .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }

        [dir="rtl"] .ms-1 {
          margin-left: 0 !important;
          margin-right: 0.25rem !important;
        }

        [dir="rtl"] .ms-2 {
          margin-left: 0 !important;
          margin-right: 0.5rem !important;
        }

        [dir="rtl"] .ms-3 {
          margin-left: 0 !important;
          margin-right: 1rem !important;
        }
      `}</style>
    </div>
  );
};

export default StudentAnnouncements;