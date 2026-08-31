// src/components/dashboard/teacher/TeacherNotifications.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Form, Row, Col } from 'react-bootstrap';
import { FaBell, FaCheckDouble, FaTrash, FaSearch, FaSync, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useNotification } from '../../../hooks/useNotification';
import { teacherService } from '../../../services/teacherService';
import LoadingSpinner from '../../common/LoadingSpinner';
import EmptyState from '../../common/EmptyState';

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const TeacherNotifications = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [teacher, setTeacher] = useState(null);

  // ===== ARABIC FONT STYLE =====
  const arabicFontStyle = {
    fontFamily: isArabic ? '"Hacen Tunisia", "Hacen Tunisia Bd", "Noto Sans Arabic", "Vazirmatn", "Traditional Arabic", "Arabic Typesetting", serif' : 'inherit',
    lineHeight: isArabic ? '1.8' : '1.6',
    letterSpacing: isArabic ? '0.5px' : '0px',
    fontSize: isArabic ? 'clamp(0.9rem, 1.1vw, 1.05rem)' : 'clamp(0.85rem, 1vw, 1rem)',
  };

  // ===== Check dark mode & mobile =====
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

  // ===== LOAD NOTIFICATIONS =====
  const loadNotifications = () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading teacher notifications...');
      
      // Get current teacher
      const currentTeacher = teacherService.getCurrentTeacher();
      console.log('👨‍🏫 Current teacher:', currentTeacher);
      
      if (!currentTeacher) {
        setError(isArabic ? 'لم يتم العثور على المعلم' : 'Teacher not found');
        setLoading(false);
        return;
      }
      
      setTeacher(currentTeacher);
      
      // Get all notifications from localStorage
      const allNotifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
      console.log('📬 All notifications:', allNotifications.length);
      
      // Filter notifications for this teacher
      const teacherNotifications = allNotifications.filter(n => {
        // Check if notification is for this teacher
        const isForTeacher = 
          n.recipientId === currentTeacher.id || 
          n.recipientRole === 'teacher' ||
          n.recipientRole === 'all' ||
          n.recipientRole === 'teachers' ||
          (n.recipientId === undefined && n.recipientRole === undefined);
        
        // Check if notification is about the teacher's students or classes
        const isAboutTeacher = 
          n.studentId !== undefined ||
          n.classId !== undefined ||
          n.teacherId === currentTeacher.id;
        
        return isForTeacher || isAboutTeacher;
      });
      
      console.log('📬 Teacher notifications:', teacherNotifications.length);
      
      // Sort by date (newest first)
      teacherNotifications.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.time || a.created_at || 0);
        const dateB = new Date(b.createdAt || b.time || b.created_at || 0);
        return dateB - dateA;
      });
      
      setNotifications(teacherNotifications);
      applyFilters(teacherNotifications);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading notifications:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== APPLY FILTERS =====
  const applyFilters = (notifs) => {
    let filtered = [...notifs];

    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        (n.title || '').toLowerCase().includes(term) ||
        (n.message || '').toLowerCase().includes(term)
      );
    }

    setFilteredNotifications(filtered);
  };

  // ===== HANDLE MARK AS READ =====
  const handleMarkAsRead = (id) => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
      const updated = allNotifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem('school_notifications', JSON.stringify(updated));
      
      // Update local state
      const teacherNotifs = updated.filter(n => 
        n.recipientId === teacher?.id || 
        n.recipientRole === 'teacher' ||
        n.recipientRole === 'all' ||
        n.recipientRole === 'teachers'
      );
      setNotifications(teacherNotifs);
      applyFilters(teacherNotifs);
      
      notify(
        isArabic ? 'تم تحديد الإشعار كمقروء' : 'Notification marked as read',
        'info'
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
    }
  };

  // ===== HANDLE MARK ALL AS READ =====
  const handleMarkAllAsRead = () => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
      const updated = allNotifications.map(n => {
        // Only mark notifications for this teacher as read
        const isForTeacher = 
          n.recipientId === teacher?.id || 
          n.recipientRole === 'teacher' ||
          n.recipientRole === 'all' ||
          n.recipientRole === 'teachers';
        return isForTeacher ? { ...n, read: true } : n;
      });
      localStorage.setItem('school_notifications', JSON.stringify(updated));
      
      // Update local state
      const teacherNotifs = updated.filter(n => 
        n.recipientId === teacher?.id || 
        n.recipientRole === 'teacher' ||
        n.recipientRole === 'all' ||
        n.recipientRole === 'teachers'
      );
      setNotifications(teacherNotifs);
      applyFilters(teacherNotifs);
      
      notify(
        isArabic ? 'تم تحديد جميع الإشعارات كمقروءة' : 'All notifications marked as read',
        'success'
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(err.message);
    }
  };

  // ===== HANDLE DELETE =====
  const handleDelete = (id) => {
    if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا الإشعار؟' : 'Are you sure you want to delete this notification?')) {
      try {
        const allNotifications = JSON.parse(localStorage.getItem('school_notifications') || '[]');
        const updated = allNotifications.filter(n => n.id !== id);
        localStorage.setItem('school_notifications', JSON.stringify(updated));
        
        // Update local state
        const teacherNotifs = updated.filter(n => 
          n.recipientId === teacher?.id || 
          n.recipientRole === 'teacher' ||
          n.recipientRole === 'all' ||
          n.recipientRole === 'teachers'
        );
        setNotifications(teacherNotifs);
        applyFilters(teacherNotifs);
        
        notify(
          isArabic ? 'تم حذف الإشعار' : 'Notification deleted',
          'info'
        );
      } catch (err) {
        console.error('Error deleting notification:', err);
        setError(err.message);
      }
    }
  };

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
    setTimeout(() => {
      setRefreshing(false);
      notify(
        isArabic ? 'تم تحديث الإشعارات' : 'Notifications refreshed',
        'info'
      );
    }, 800);
  };

  // ===== GET NOTIFICATION ICON =====
  const getNotificationIcon = (type) => {
    const icons = {
      'announcement': '📢',
      'assignment': '📝',
      'class': '🏫',
      'student': '👨‍🎓',
      'assessment': '📊',
      'reminder': '⏰',
      'registration': '📋',
      'submission': '📤',
      'grade': '📈',
      'attendance': '✅',
      'schedule': '📅',
      'system': '⚙️',
      'general': '📬',
      'teacher': '👨‍🏫',
      'parent': '👨‍👩‍👧',
      'exam': '📝',
      'result': '📊',
      'notification': '🔔'
    };
    return icons[type] || '📬';
  };

  // ===== GET NOTIFICATION COLOR =====
  const getNotificationColor = (type) => {
    const colors = {
      'announcement': '#4a9eff',
      'assignment': '#2ecc71',
      'class': '#f39c12',
      'student': '#3498db',
      'assessment': '#9b59b6',
      'reminder': '#e67e22',
      'registration': '#1abc9c',
      'submission': '#2ecc71',
      'grade': '#e74c3c',
      'attendance': '#2ecc71',
      'schedule': '#3498db',
      'system': '#95a5a6',
      'general': '#6c757d',
      'teacher': '#2d6a4f',
      'parent': '#c49a6c',
      'exam': '#e74c3c',
      'result': '#9b59b6',
      'notification': '#4a9eff'
    };
    return colors[type] || '#6c757d';
  };

  // ===== GET TIME AGO =====
  const getTimeAgo = (date) => {
    if (!date) return '';
    try {
      const now = new Date();
      const past = new Date(date);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return isArabic ? 'الآن' : 'Just now';
      if (diffMins < 60) return isArabic ? `${diffMins} دقيقة` : `${diffMins}m`;
      if (diffHours < 24) return isArabic ? `${diffHours} ساعة` : `${diffHours}h`;
      if (diffDays < 7) return isArabic ? `${diffDays} يوم` : `${diffDays}d`;
      if (diffDays < 30) return isArabic ? `${diffDays} يوم` : `${diffDays}d`;
      return past.toLocaleDateString(isArabic ? 'ar-TN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  };

  // ===== SETUP EFFECT =====
  useEffect(() => {
    loadNotifications();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "school_notifications") {
        console.log("🔄 Notifications storage changed, reloading...");
        loadNotifications();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom events
    const handleNotificationAdded = () => {
      console.log("🔔 Notification added event, reloading...");
      loadNotifications();
    };
    window.addEventListener("notificationAdded", handleNotificationAdded);

    const handleUsersUpdated = () => {
      console.log("👤 Users updated, reloading notifications...");
      loadNotifications();
    };
    window.addEventListener("usersUpdated", handleUsersUpdated);

    const handleStudentAdded = () => {
      console.log("👨‍🎓 Student added, reloading notifications...");
      loadNotifications();
    };
    window.addEventListener("studentAdded", handleStudentAdded);

    const handleClassAssigned = () => {
      console.log("📚 Class assigned, reloading notifications...");
      loadNotifications();
    };
    window.addEventListener("classAssigned", handleClassAssigned);

    const handleAttendanceUpdated = () => {
      console.log("📊 Attendance updated, reloading notifications...");
      loadNotifications();
    };
    window.addEventListener("attendanceUpdated", handleAttendanceUpdated);

    const handleAssessmentChanged = () => {
      console.log("📝 Assessment changed, reloading notifications...");
      loadNotifications();
    };
    window.addEventListener("assessmentChanged", handleAssessmentChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("notificationAdded", handleNotificationAdded);
      window.removeEventListener("usersUpdated", handleUsersUpdated);
      window.removeEventListener("studentAdded", handleStudentAdded);
      window.removeEventListener("classAssigned", handleClassAssigned);
      window.removeEventListener("attendanceUpdated", handleAttendanceUpdated);
      window.removeEventListener("assessmentChanged", handleAssessmentChanged);
    };
  }, []);

  // ===== APPLY FILTERS EFFECT =====
  useEffect(() => {
    applyFilters(notifications);
  }, [filter, searchTerm, notifications]);

  // ===== RENDER STATES =====
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري تحميل الإشعارات...' : 'Loading notifications...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <FaExclamationTriangle size={48} className="text-warning mb-3" />
        <p className="text-danger" style={arabicFontStyle}>{error}</p>
        <Button variant="primary" onClick={loadNotifications} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
          <FaSync className="me-2" /> {isArabic ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="teacher-notifications" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
            ...arabicFontStyle, 
            color: '#4a9eff', 
            fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)' 
          }}>
            <FaBell className="me-2" /> 
            {isArabic ? 'الإشعارات' : 'Notifications'}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {isArabic 
              ? `عرض وإدارة إشعاراتك (${formatNumber(notifications.length)})`
              : `View and manage your notifications (${formatNumber(notifications.length)})`}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap flex-shrink-0">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            style={{ 
              ...arabicFontStyle, 
              borderRadius: '12px',
              fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
              padding: isMobile ? '4px 8px' : '4px 12px'
            }}
          >
            <FaCheckDouble className="me-1" />
            {isArabic ? 'تحديد الكل كمقروء' : 'Mark All Read'}
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ 
              ...arabicFontStyle, 
              borderRadius: '12px',
              fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
              padding: isMobile ? '4px 8px' : '4px 12px'
            }}
          >
            <FaSync className={refreshing ? 'spinning' : ''} /> 
            <span className="d-none d-sm-inline">{isArabic ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* ===== STATS SUMMARY ===== */}
      <Row className="g-2 g-sm-3 mb-3 mb-md-4">
        <Col xs={6} sm={3}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4a9eff' }}>
              {formatNumber(notifications.length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'إجمالي الإشعارات' : 'Total Notifications'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f39c12' }}>
              {formatNumber(unreadCount)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'غير مقروءة' : 'Unread'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2ecc71' }}>
              {formatNumber(notifications.length - unreadCount)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'مقروءة' : 'Read'}
            </div>
          </div>
        </Col>
        <Col xs={6} sm={3}>
          <div className="stat-card-mini" style={{ 
            background: darkMode ? '#1a1a2e' : '#ffffff',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e9ecef'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <div className="stat-number-mini" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#9b59b6' }}>
              {formatNumber(notifications.filter(n => n.type === 'student' || n.type === 'class').length)}
            </div>
            <div className="stat-label-mini" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              {isArabic ? 'طلاب وفصول' : 'Students & Classes'}
            </div>
          </div>
        </Col>
      </Row>

      {/* ===== FILTERS ===== */}
      <Card className="modern-card mb-4" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
        <Card.Body className="p-3 p-md-4">
          <Row className="g-2 g-md-3">
            <Col xs={12} md={4} lg={5}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Form.Control
                  type="text"
                  placeholder={isArabic ? 'بحث في الإشعارات...' : 'Search notifications...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-5"
                  style={{
                    ...arabicFontStyle,
                    background: darkMode ? '#2d2d44' : 'white',
                    color: darkMode ? '#e9ecef' : '#212529',
                    borderRadius: '12px',
                    borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                  }}
                />
              </div>
            </Col>
            <Col xs={6} md={3} lg={3}>
              <Form.Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  ...arabicFontStyle,
                  background: darkMode ? '#2d2d44' : 'white',
                  color: darkMode ? '#e9ecef' : '#212529',
                  borderRadius: '12px',
                  borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                }}
              >
                <option value="all">
                  {isArabic ? 'جميع الإشعارات' : 'All'} ({formatNumber(notifications.length)})
                </option>
                <option value="unread">
                  {isArabic ? 'غير مقروءة' : 'Unread'} ({formatNumber(unreadCount)})
                </option>
                <option value="read">
                  {isArabic ? 'مقروءة' : 'Read'} ({formatNumber(notifications.length - unreadCount)})
                </option>
              </Form.Select>
            </Col>
            <Col xs={6} md={3} lg={3}>
              <span className="text-muted d-flex align-items-center" style={{ ...arabicFontStyle, fontSize: '0.85rem' }}>
                {formatNumber(filteredNotifications.length)} {isArabic ? 'إشعار' : 'notifications'}
              </span>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== NOTIFICATIONS LIST ===== */}
      {filteredNotifications.length === 0 ? (
        <Card className="text-center py-5" style={{ 
          background: darkMode ? '#1a1a2e' : '#ffffff', 
          borderColor: darkMode ? '#2d2d44' : '#e9ecef',
          borderRadius: '16px',
        }}>
          <Card.Body>
            <FaBell size={48} className="text-muted opacity-25 mb-3" />
            <h5 style={arabicFontStyle}>
              {searchTerm || filter !== 'all' 
                ? (isArabic ? 'لا توجد نتائج تطابق البحث' : 'No notifications match your search')
                : (isArabic ? 'لا توجد إشعارات' : 'No notifications')}
            </h5>
            <p className="text-muted" style={arabicFontStyle}>
              {searchTerm || filter !== 'all' 
                ? (isArabic ? 'حاول تعديل كلمات البحث أو الفلاتر' : 'Try adjusting your search terms or filters')
                : (isArabic ? 'أنت على اطلاع كامل! لا توجد إشعارات لعرضها.' : 'You\'re all caught up! No notifications to display.')}
            </p>
            {notifications.length === 0 && teacher && (
              <p className="text-muted small" style={arabicFontStyle}>
                {isArabic 
                  ? 'سيتم عرض الإشعارات هنا عند إضافة طلاب أو فصول جديدة' 
                  : 'Notifications will appear here when new students or classes are added'}
              </p>
            )}
          </Card.Body>
        </Card>
      ) : (
        <div className="notification-list">
          {filteredNotifications.map(notification => {
            const icon = getNotificationIcon(notification.type);
            const color = getNotificationColor(notification.type);
            const timeAgo = getTimeAgo(notification.createdAt || notification.time || notification.created_at);
            
            return (
              <Card 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                style={{ 
                  background: darkMode ? '#1a1a2e' : '#ffffff',
                  borderColor: darkMode ? '#2d2d44' : '#e9ecef',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: darkMode ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.04)',
                  marginBottom: '12px',
                  borderLeft: !notification.read ? `4px solid ${color}` : 'none',
                }}
              >
                <Card.Body className="p-3 p-md-4">
                  <div className="d-flex align-items-start gap-3">
                    <div className="notification-icon" style={{
                      width: isMobile ? '40px' : '50px',
                      height: isMobile ? '40px' : '50px',
                      minWidth: isMobile ? '40px' : '50px',
                      borderRadius: '12px',
                      background: `${color}15`,
                      color: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '1.5rem' : '2rem',
                    }}>
                      {icon}
                    </div>
                    <div className="notification-content flex-grow-1 min-width-0">
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                        <div>
                          <h6 className="fw-bold mb-1" style={{ color: darkMode ? '#e9ecef' : '#212529' }}>
                            {notification.title || notification.message?.substring(0, 50) || 'Notification'}
                            {!notification.read && (
                              <Badge bg="primary" className="ms-2" style={{ fontSize: '0.6rem' }}>
                                {isArabic ? 'جديد' : 'New'}
                              </Badge>
                            )}
                          </h6>
                          <div className="d-flex flex-wrap gap-2 mb-1">
                            <small className="text-muted" style={arabicFontStyle}>
                              <span className="me-2">{timeAgo}</span>
                              {notification.type && (
                                <Badge bg="secondary" style={{ fontSize: '0.55rem' }}>
                                  {notification.type}
                                </Badge>
                              )}
                            </small>
                          </div>
                        </div>
                        <div className="notification-actions d-flex gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              title={isArabic ? 'تحديد كمقروء' : 'Mark as read'}
                              style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px' }}
                            >
                              <FaCheckDouble size={isMobile ? 10 : 14} />
                            </Button>
                          )}
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                            title={isArabic ? 'حذف' : 'Delete'}
                            style={{ borderRadius: '8px', padding: isMobile ? '2px 6px' : '4px 8px' }}
                          >
                            <FaTrash size={isMobile ? 10 : 14} />
                          </Button>
                        </div>
                      </div>
                      <p className="mb-2" style={{ color: darkMode ? '#e9ecef' : '#212529', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
                        {notification.message}
                      </p>
                      {notification.link && (
                        <a 
                          href={notification.link} 
                          className="btn btn-sm btn-link p-0 text-decoration-none"
                          style={{ ...arabicFontStyle, color: '#4a9eff' }}
                        >
                          {isArabic ? 'عرض التفاصيل →' : 'View Details →'}
                        </a>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        .teacher-notifications {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .teacher-notifications * {
          box-sizing: border-box;
        }

        .min-width-0 {
          min-width: 0;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .modern-card {
          border-radius: 16px !important;
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'} !important;
          transition: all 0.3s ease;
          overflow: hidden;
          background: ${darkMode ? '#1a1a2e' : '#ffffff'} !important;
        }

        .stat-card-mini {
          transition: all 0.3s ease;
        }

        .stat-card-mini:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .stat-number-mini {
          transition: color 0.3s ease;
        }

        .stat-card-mini:hover .stat-number-mini {
          transform: scale(1.05);
        }

        .notification-item {
          transition: all 0.3s ease;
          cursor: default;
        }

        .notification-item:hover {
          transform: translateX(4px);
          box-shadow: ${darkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'} !important;
        }

        .notification-item.unread {
          background-color: ${darkMode ? 'rgba(13, 110, 253, 0.05)' : 'rgba(13, 110, 253, 0.02)'};
        }

        [dir="rtl"] .notification-item:hover {
          transform: translateX(-4px);
        }

        .notification-icon {
          transition: transform 0.3s ease;
        }

        .notification-item:hover .notification-icon {
          transform: scale(1.05);
        }

        .notification-content {
          padding: 2px 0;
        }

        .notification-actions {
          display: flex;
          gap: 4px;
        }

        .notification-actions .btn {
          transition: all 0.2s ease;
        }

        .notification-actions .btn:hover {
          transform: scale(1.1);
        }

        /* ===== RTL FIXES ===== */
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
        [dir="rtl"] .ps-5 {
          padding-left: 1rem !important;
          padding-right: 3rem !important;
        }
        [dir="rtl"] .start-0 {
          left: auto !important;
          right: 0 !important;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .stat-card-mini {
            padding: 8px 12px !important;
          }
          .stat-number-mini {
            font-size: 1.2rem !important;
          }
          .stat-label-mini {
            font-size: 0.6rem !important;
          }
          .notification-item .d-flex {
            flex-direction: column;
          }
          .notification-icon {
            align-self: flex-start;
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
          }
          .notification-icon .fs-2 {
            font-size: 1.5rem !important;
          }
          .notification-actions {
            margin-top: 8px;
          }
          .modern-card .p-3 {
            padding: 12px !important;
          }
          .notification-item .p-3 {
            padding: 12px !important;
          }
        }

        @media (max-width: 576px) {
          .stat-number-mini {
            font-size: 1rem !important;
          }
          .stat-label-mini {
            font-size: 0.5rem !important;
          }
          .notification-item .p-3 {
            padding: 8px !important;
          }
          .notification-item h6 {
            font-size: 0.85rem !important;
          }
          .notification-item p {
            font-size: 0.75rem !important;
          }
          .notification-actions .btn {
            padding: 2px 4px !important;
          }
          .notification-actions .btn svg {
            width: 10px !important;
            height: 10px !important;
          }
        }

        @media (max-width: 400px) {
          .stat-number-mini {
            font-size: 0.85rem !important;
          }
          .stat-label-mini {
            font-size: 0.45rem !important;
          }
          .notification-item h6 {
            font-size: 0.75rem !important;
          }
          .notification-item p {
            font-size: 0.65rem !important;
          }
          .notification-icon {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            font-size: 1.2rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherNotifications;