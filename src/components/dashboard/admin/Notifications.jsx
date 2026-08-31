// src/components/dashboard/admin/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Form, InputGroup, Row, Col, Container } from 'react-bootstrap';
import { 
  FaBell, FaUserPlus, FaBullhorn, FaCog, FaUser, FaCheckCircle,
  FaSync, FaSearch, FaTimesCircle, FaClock, FaTrash,
  FaTasks, FaFileAlt, FaUserGraduate, FaCalendarCheck, FaBook,
  FaEye, FaCheckDouble, FaFilter, FaSpinner
} from 'react-icons/fa';
import { useNotification } from '../../../hooks/useNotification';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loadNotifications } = useNotification();
  const { isArabic } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const locale = isArabic ? ar : enUS;

  // ===== Check mobile =====
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get user role
  const getUserRole = () => {
    return user?.role || localStorage.getItem('role') || 'admin';
  };

  const userRole = getUserRole();

  // Get role-specific notification types
  const getNotificationTypes = () => {
    const types = {
      admin: ['registration', 'system', 'announcement', 'reminder'],
      teacher: ['assignment', 'submission', 'schedule', 'announcement'],
      parent: ['grade', 'attendance', 'announcement'],
      student: ['grade', 'announcement', 'assignment']
    };
    return types[userRole] || ['announcement'];
  };

  // Get role label
  const getRoleLabel = () => {
    const labels = {
      admin: isArabic ? 'المسؤول' : 'Admin',
      teacher: isArabic ? 'المعلم' : 'Teacher',
      parent: isArabic ? 'ولي الأمر' : 'Parent',
      student: isArabic ? 'الطالب' : 'Student'
    };
    return labels[userRole] || 'User';
  };

  // Get type label
  const getTypeLabel = (type) => {
    const labels = {
      registration: isArabic ? 'تسجيل' : 'Registration',
      announcement: isArabic ? 'إعلان' : 'Announcement',
      assignment: isArabic ? 'واجب' : 'Assignment',
      submission: isArabic ? 'تسليم' : 'Submission',
      grade: isArabic ? 'نتيجة' : 'Grade',
      attendance: isArabic ? 'حضور' : 'Attendance',
      schedule: isArabic ? 'جدول' : 'Schedule',
      system: isArabic ? 'نظام' : 'System',
      reminder: isArabic ? 'تذكير' : 'Reminder',
      profile: isArabic ? 'ملف' : 'Profile'
    };
    return labels[type] || type;
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const icons = {
      registration: <FaUserPlus />,
      announcement: <FaBullhorn />,
      assignment: <FaTasks />,
      submission: <FaFileAlt />,
      grade: <FaBook />,
      attendance: <FaCalendarCheck />,
      schedule: <FaClock />,
      system: <FaCog />,
      reminder: <FaBell />,
      profile: <FaUser />
    };
    return icons[type] || <FaBell />;
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
      profile: '#4a9eff'
    };
    return colors[type] || '#6c757d';
  };

  // Get type options for filter
  const getTypeOptions = () => {
    const allTypes = {
      registration: isArabic ? 'تسجيل' : 'Registration',
      announcement: isArabic ? 'إعلان' : 'Announcement',
      assignment: isArabic ? 'واجب' : 'Assignment',
      submission: isArabic ? 'تسليم' : 'Submission',
      grade: isArabic ? 'نتيجة' : 'Grade',
      attendance: isArabic ? 'حضور' : 'Attendance',
      schedule: isArabic ? 'جدول' : 'Schedule',
      system: isArabic ? 'نظام' : 'System',
      reminder: isArabic ? 'تذكير' : 'Reminder'
    };
    const allowedTypes = getNotificationTypes();
    const options = {};
    allowedTypes.forEach(type => {
      if (allTypes[type]) {
        options[type] = allTypes[type];
      }
    });
    return options;
  };

  // Filter notifications
  const getFilteredNotifications = () => {
    const allowedTypes = getNotificationTypes();
    let filtered = notifications.filter(n => allowedTypes.includes(n.type));

    if (searchTerm) {
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    if (filterStatus === 'read') {
      filtered = filtered.filter(n => n.read);
    } else if (filterStatus === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const typeOptions = getTypeOptions();

  // ===== Pagination =====
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const displayedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format time
  const formatTime = (date) => {
    try {
      if (!date) return isArabic ? 'منذ قليل' : 'Just now';
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale });
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
  };

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    loadNotifications();
    setTimeout(() => setLoading(false), 500);
  };

  // ===== Handle Mark All Read =====
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) {
      // Show info if no unread notifications
      return;
    }
    
    setMarkingAllRead(true);
    try {
      await markAllAsRead();
      // Show success message (optional)
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Get empty message
  const getEmptyMessage = () => {
    const messages = {
      admin: isArabic ? 'لا توجد إشعارات إدارية' : 'No admin notifications',
      teacher: isArabic ? 'لا توجد إشعارات للمعلم' : 'No teacher notifications',
      parent: isArabic ? 'لا توجد إشعارات لولي الأمر' : 'No parent notifications',
      student: isArabic ? 'لا توجد إشعارات للطالب' : 'No student notifications'
    };
    return messages[userRole] || messages.admin;
  };

  return (
    <div className="notifications-page" dir={isArabic ? 'rtl' : 'ltr'}>
      <Container fluid className="px-2 px-sm-3 px-md-4">
        {/* Header */}
        <div className="page-header d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-sm-3 mb-3 mb-md-4">
          <div className="flex-grow-1 min-width-0">
            <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
              fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)',
              color: '#1a5f7a'
            }}>
              <FaBell className="me-2" style={{ color: '#1a5f7a' }} />
              {isArabic ? 'جميع الإشعارات' : 'All Notifications'}
              <Badge bg="primary" className="ms-2" style={{ fontSize: isArabic ? 'clamp(0.6rem, 0.8vw, 0.8rem)' : 'clamp(0.55rem, 0.7vw, 0.75rem)' }}>
                {unreadCount} {isArabic ? 'غير مقروء' : 'unread'}
              </Badge>
            </h4>
            <p className="text-muted mb-0 d-none d-sm-block" style={{ 
              fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
            }}>
              {isArabic 
                ? `مرحباً ${getRoleLabel()}! لديك ${notifications.length} إشعار` 
                : `Hello ${getRoleLabel()}! You have ${notifications.length} notifications`}
            </p>
          </div>
          <div className="d-flex gap-1 gap-sm-2 flex-wrap flex-shrink-0">
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={loading}
              style={{ 
                borderRadius: '12px',
                fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
                padding: isMobile ? '4px 8px' : '4px 12px'
              }}
            >
              <FaSync className={loading ? 'spinning' : ''} />
              <span className="d-none d-sm-inline ms-1">{isArabic ? 'تحديث' : 'Refresh'}</span>
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="success" 
                size="sm" 
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
                style={{ 
                  borderRadius: '12px',
                  fontSize: isArabic ? 'clamp(0.65rem, 0.8vw, 0.85rem)' : 'clamp(0.6rem, 0.75vw, 0.8rem)',
                  padding: isMobile ? '4px 8px' : '4px 12px'
                }}
              >
                {markingAllRead ? (
                  <FaSpinner className="spinning" />
                ) : (
                  <FaCheckDouble className="me-1" />
                )}
                <span className="d-none d-sm-inline">
                  {markingAllRead ? (isArabic ? 'جاري...' : 'Processing...') : (isArabic ? 'تحديد الكل كمقروء' : 'Mark All Read')}
                </span>
                <span className="d-inline d-sm-none">
                  {markingAllRead ? (isArabic ? 'جاري...' : '...') : (isArabic ? 'الكل مقروء' : 'All Read')}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards - Responsive */}
        <Row className="g-2 g-sm-3 mb-3 mb-md-4">
          <Col xs={6} sm={3}>
            <div className="stat-card-mini">
              <div className="stat-number text-primary">{notifications.length}</div>
              <div className="stat-label">{isArabic ? 'الإجمالي' : 'Total'}</div>
            </div>
          </Col>
          <Col xs={6} sm={3}>
            <div className="stat-card-mini">
              <div className="stat-number text-success">{notifications.filter(n => n.read).length}</div>
              <div className="stat-label">{isArabic ? 'مقروءة' : 'Read'}</div>
            </div>
          </Col>
          <Col xs={6} sm={3}>
            <div className="stat-card-mini">
              <div className="stat-number text-warning">{unreadCount}</div>
              <div className="stat-label">{isArabic ? 'غير مقروءة' : 'Unread'}</div>
            </div>
          </Col>
          <Col xs={6} sm={3}>
            <div className="stat-card-mini">
              <div className="stat-number text-danger">{notifications.filter(n => n.priority === 'high').length}</div>
              <div className="stat-label">{isArabic ? 'عاجل' : 'Urgent'}</div>
            </div>
          </Col>
        </Row>

        {/* Filters - Responsive */}
        <Card className="shadow-sm border-0 mb-3 mb-md-4" style={{ borderRadius: '12px' }}>
          <Card.Body className="p-2 p-sm-3">
            <Row className="g-2">
              <Col xs={12} md={5}>
                <InputGroup>
                  <InputGroup.Text style={{ borderRadius: '12px 0 0 12px' }}>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder={isArabic ? 'بحث عن إشعار...' : 'Search notifications...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ fontSize: isMobile ? '0.85rem' : 'inherit' }}
                  />
                  {searchTerm && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setSearchTerm('')}
                      style={{ borderRadius: '0 12px 12px 0' }}
                    >
                      <FaTimesCircle />
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col xs={6} md={4}>
                <Form.Select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{ 
                    borderRadius: '12px',
                    fontSize: isMobile ? '0.8rem' : 'inherit'
                  }}
                >
                  <option value="all">{isArabic ? 'جميع الأنواع' : 'All Types'}</option>
                  {Object.entries(typeOptions).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={6} md={3}>
                <Form.Select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ 
                    borderRadius: '12px',
                    fontSize: isMobile ? '0.8rem' : 'inherit'
                  }}
                >
                  <option value="all">{isArabic ? 'الكل' : 'All'}</option>
                  <option value="unread">{isArabic ? 'غير مقروءة' : 'Unread'}</option>
                  <option value="read">{isArabic ? 'مقروءة' : 'Read'}</option>
                </Form.Select>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card className="text-center py-4 py-md-5 shadow-sm border-0" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <FaBell size={isMobile ? 36 : 48} className="text-muted mb-3" style={{ opacity: 0.3 }} />
              <h5 style={{ fontSize: isMobile ? '1rem' : 'inherit' }}>{getEmptyMessage()}</h5>
              <p className="text-muted" style={{ fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                {isArabic ? 'سيتم عرض جميع الإشعارات هنا' : 'All notifications will appear here'}
              </p>
            </Card.Body>
          </Card>
        ) : (
          <>
            <div className="notifications-list">
              {displayedNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`notification-card ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ borderRadius: '12px', marginBottom: '10px' }}
                >
                  <Card.Body className="p-3 p-sm-4">
                    <div className="notification-content">
                      {/* Icon - Hidden on mobile */}
                      <div 
                        className="notification-icon d-none d-sm-flex"
                        style={{ 
                          background: `${getNotificationColor(notification.type)}15`,
                          color: getNotificationColor(notification.type)
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="notification-body">
                        {/* Header */}
                        <div className="notification-header">
                          <div className="notification-title-group">
                            <h6 className="fw-bold mb-0" style={{ fontSize: isMobile ? '0.85rem' : 'inherit' }}>
                              {notification.title}
                            </h6>
                            <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
                              {!notification.read && (
                                <Badge bg="primary" className="rounded-pill" style={{ fontSize: '0.6rem' }}>
                                  {isArabic ? 'جديد' : 'New'}
                                </Badge>
                              )}
                              {notification.priority === 'high' && (
                                <Badge bg="danger" className="rounded-pill" style={{ fontSize: '0.6rem' }}>
                                  {isArabic ? 'عاجل' : 'Urgent'}
                                </Badge>
                              )}
                              <Badge 
                                className="rounded-pill" 
                                style={{ 
                                  background: getNotificationColor(notification.type),
                                  color: 'white',
                                  fontSize: '0.6rem'
                                }}
                              >
                                {getTypeLabel(notification.type)}
                              </Badge>
                            </div>
                          </div>
                          <small className="text-muted notification-time" style={{ fontSize: '0.6rem' }}>
                            <FaClock className="me-1" size={10} />
                            {formatTime(notification.created_at || notification.time)}
                          </small>
                        </div>

                        {/* Message */}
                        <p className="text-muted small mb-1 notification-message" style={{ fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                          {notification.message}
                        </p>

                        {/* Metadata */}
                        {notification.metadata?.student_name && (
                          <small className="text-muted d-block" style={{ fontSize: '0.6rem' }}>
                            👤 {notification.metadata.student_name}
                          </small>
                        )}
                        {notification.link && (
                          <small className="text-muted d-block" style={{ fontSize: '0.6rem' }}>
                            <FaEye size={10} className="me-1" />
                            {isArabic ? 'اضغط للعرض' : 'Click to view'}
                          </small>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="notification-actions">
                        {!notification.read && (
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            title={isArabic ? 'تحديد كمقروء' : 'Mark as read'}
                            style={{ 
                              borderRadius: '8px',
                              padding: isMobile ? '2px 6px' : '4px 8px',
                              fontSize: isMobile ? '0.6rem' : '0.7rem'
                            }}
                          >
                            <FaCheckCircle size={isMobile ? 10 : 12} />
                            <span className="d-none d-sm-inline ms-1">{isArabic ? 'تحديد كمقروء' : 'Mark Read'}</span>
                          </Button>
                        )}
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا الإشعار؟' : 'Are you sure you want to delete this notification?')) {
                              deleteNotification(notification.id);
                            }
                          }}
                          title={isArabic ? 'حذف' : 'Delete'}
                          style={{ 
                            borderRadius: '8px',
                            padding: isMobile ? '2px 6px' : '4px 8px',
                            fontSize: isMobile ? '0.6rem' : '0.7rem'
                          }}
                        >
                          <FaTrash size={isMobile ? 10 : 12} />
                          <span className="d-none d-sm-inline ms-1">{isArabic ? 'حذف' : 'Delete'}</span>
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 border-top gap-2" style={{ borderColor: '#e9ecef' }}>
                <div className="text-muted small" style={{ fontSize: isMobile ? '0.65rem' : 'inherit' }}>
                  {isArabic 
                    ? `عرض ${displayedNotifications.length} من ${filteredNotifications.length} إشعار`
                    : `Showing ${displayedNotifications.length} of ${filteredNotifications.length} notifications`}
                </div>
                <div className="d-flex gap-1">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ borderRadius: '8px', fontSize: isMobile ? '0.7rem' : 'inherit' }}
                  >
                    {isArabic ? 'السابق' : 'Prev'}
                  </Button>
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
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        style={{ 
                          borderRadius: '8px', 
                          fontSize: isMobile ? '0.7rem' : 'inherit',
                          minWidth: isMobile ? '28px' : '36px'
                        }}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ borderRadius: '8px', fontSize: isMobile ? '0.7rem' : 'inherit' }}
                  >
                    {isArabic ? 'التالي' : 'Next'}
                  </Button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-3">
              <small className="text-muted" style={{ fontSize: isMobile ? '0.65rem' : 'inherit' }}>
                {isArabic 
                  ? `عرض ${filteredNotifications.length} من ${notifications.length} إشعار`
                  : `Showing ${filteredNotifications.length} of ${notifications.length} notifications`}
              </small>
            </div>
          </>
        )}
      </Container>

      <style>{`
        .notifications-page {
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .notifications-page * {
          box-sizing: border-box;
        }

        .min-width-0 {
          min-width: 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        [dir="rtl"] .page-header {
          flex-direction: row-reverse;
        }

        @media (max-width: 576px) {
          .page-header {
            flex-direction: column;
            align-items: stretch !important;
          }
          [dir="rtl"] .page-header {
            align-items: stretch !important;
          }
          .page-header .d-flex {
            justify-content: flex-start;
          }
          [dir="rtl"] .page-header .d-flex {
            justify-content: flex-end;
          }
        }

        .stat-card-mini {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-color, #e9ecef);
          border-radius: 12px;
          padding: 14px 16px;
          text-align: center;
          transition: all 0.3s ease;
          height: 100%;
          min-height: 70px;
        }
        .stat-card-mini:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.06);
        }

        .stat-number {
          font-size: clamp(1.2rem, 2vw, 1.8rem);
          font-weight: 700;
        }

        .stat-label {
          font-size: clamp(0.55rem, 0.8vw, 0.7rem);
          color: var(--text-secondary, #6c757d);
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .notification-card {
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid var(--border-color, #e9ecef);
          border-radius: 12px;
          background: var(--bg-card, #ffffff);
          overflow: hidden;
        }
        .notification-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .notification-card.unread {
          border-left: 4px solid #1a5f7a;
          background: rgba(26, 95, 122, 0.03);
        }

        [dir="rtl"] .notification-card.unread {
          border-left: none;
          border-right: 4px solid #1a5f7a;
        }

        .notification-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
        }

        .notification-icon {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notification-body {
          flex: 1;
          min-width: 0;
          width: 100%;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          flex-wrap: wrap;
        }

        .notification-title-group {
          flex: 1;
          min-width: 0;
        }

        .notification-time {
          white-space: nowrap;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notification-message {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .notification-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
          align-items: center;
          margin-top: 4px;
        }

        .action-btn {
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 0.7rem;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        .action-btn:hover {
          transform: scale(1.05);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* RTL Support */
        [dir="rtl"] .me-1 {
          margin-right: 0 !important;
          margin-left: 0.25rem !important;
        }
        [dir="rtl"] .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        [dir="rtl"] .ms-2 {
          margin-left: 0 !important;
          margin-right: 0.5rem !important;
        }
        [dir="rtl"] .ms-1 {
          margin-left: 0 !important;
          margin-right: 0.25rem !important;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 992px) {
          .stat-card-mini {
            padding: 12px 14px;
            min-height: 65px;
          }
          .stat-number {
            font-size: 1.4rem;
          }
        }

        @media (max-width: 768px) {
          .stat-card-mini {
            padding: 10px 12px;
            min-height: 60px;
            border-radius: 10px;
          }
          .stat-number {
            font-size: 1.2rem;
          }
          .notification-content {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          .notification-icon {
            display: none !important;
          }
          .notification-header {
            flex-direction: column;
            align-items: stretch;
          }
          .notification-time {
            white-space: normal;
            margin-top: 2px;
          }
          .notification-actions {
            justify-content: flex-end;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid var(--border-color, #e9ecef);
          }
          .notification-card .p-3.p-sm-4 {
            padding: 12px !important;
          }
          .notification-card.unread {
            border-left-width: 3px;
          }
          [dir="rtl"] .notification-card.unread {
            border-right-width: 3px;
          }
        }

        @media (max-width: 576px) {
          .stat-card-mini {
            padding: 8px 10px;
            min-height: 50px;
            border-radius: 8px;
          }
          .stat-number {
            font-size: 1rem;
          }
          .stat-label {
            font-size: 0.5rem;
          }
          .notification-card .p-3.p-sm-4 {
            padding: 10px !important;
          }
          .notification-card h6 {
            font-size: 0.8rem !important;
          }
          .notification-message {
            font-size: 0.7rem !important;
          }
          .action-btn {
            font-size: 0.55rem !important;
            padding: 2px 6px !important;
          }
          .notification-header .d-flex {
            gap: 4px;
          }
          .notification-header .badge {
            font-size: 0.5rem !important;
          }
          
          /* Stats cards - 2 per row on mobile */
          .notifications-page .row > .col-6 {
            flex: 0 0 50%;
            max-width: 50%;
            padding: 4px;
          }
          
          /* Filter selects - 2 per row on mobile */
          .notifications-page .row > .col-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }
          
          .notification-actions {
            justify-content: flex-start;
            flex-wrap: wrap;
          }
          
          /* Pagination on mobile */
          .d-flex.flex-column.flex-sm-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px;
          }
          .d-flex.flex-column.flex-sm-row .d-flex {
            justify-content: center !important;
          }
        }

        @media (max-width: 400px) {
          .stat-card-mini {
            padding: 6px 8px;
            min-height: 40px;
          }
          .stat-number {
            font-size: 0.85rem;
          }
          .stat-label {
            font-size: 0.45rem;
          }
          .notification-card .p-3.p-sm-4 {
            padding: 8px !important;
          }
          .notification-card h6 {
            font-size: 0.7rem !important;
          }
          .notification-message {
            font-size: 0.65rem !important;
          }
          .action-btn {
            font-size: 0.5rem !important;
            padding: 1px 4px !important;
          }
          .notification-time {
            font-size: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Notifications;