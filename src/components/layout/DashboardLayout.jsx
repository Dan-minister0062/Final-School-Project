// src/components/layout/DashboardLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Container, Nav, Navbar, NavDropdown, Button, Badge, Offcanvas } from 'react-bootstrap';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  FaUserGraduate, FaChalkboardTeacher, FaBuilding, FaBullhorn,
  FaCalendarCheck, FaUserPlus, FaFileAlt, FaCog, FaUser, FaSignOutAlt,
  FaBars, FaBell, FaMoon, FaSun, FaSchool,
  FaTachometerAlt,
  FaStar, FaAward,
  FaClock, FaChevronDown,
  FaLanguage, FaCheckDouble, FaTimes, FaUsers, FaUserCog, FaBook, FaMoneyBillWave,
  FaClipboardList // Added for assessments
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { getInitials } from '../../utils/helpers';
import { useNotification } from '../../hooks/useNotification';
import notificationService from '../../services/notificationService';
import logo from "../../assets/images/school logo.jpeg";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { language, toggleLanguage, isArabic } = useLanguage();
  const { notify } = useNotification();

  // ===== Get user role =====
  const getUserRole = () => {
    return user?.role || localStorage.getItem('role') || 'admin';
  };

  // ===== Get role letter for avatar =====
  const getRoleLetter = () => {
    const role = getUserRole();
    const roleMap = {
      admin: 'A',
      teacher: 'T',
      parent: 'P',
      student: 'S'
    };
    return roleMap[role] || 'A';
  };

  // ===== Get role display name =====
  const getRoleDisplayName = () => {
    const role = getUserRole();
    const roleMap = {
      admin: isArabic ? 'مدير' : 'Admin',
      teacher: isArabic ? 'أستاذ' : 'Teacher',
      parent: isArabic ? 'ولي أمر' : 'Parent',
      student: isArabic ? 'طالب' : 'Student'
    };
    return roleMap[role] || 'Admin';
  };

  // ===== Check if user is admin =====
  const isAdmin = () => {
    return getUserRole() === 'admin' || getUserRole() === 'director';
  };

  // ===== Get dashboard base path based on role =====
  const getDashboardBasePath = () => {
    const role = getUserRole();
    const roleMap = {
      admin: '/dashboard/admin',
      teacher: '/dashboard/teacher',
      parent: '/dashboard/parent',
      student: '/dashboard/student'
    };
    return roleMap[role] || '/dashboard/admin';
  };

  // ===== Get profile path based on role =====
  const getProfilePath = () => {
    return `${getDashboardBasePath()}/profile`;
  };

  // ===== Get settings path based on role (only for admin) =====
  const getSettingsPath = () => {
    return `${getDashboardBasePath()}/settings`;
  };

  // ===== Load notifications from localStorage =====
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_notifications');
    let initialNotifications = [];
    if (saved) {
      try {
        initialNotifications = JSON.parse(saved);
        setNotifications(initialNotifications);
      } catch (e) {
        console.error('Error parsing notifications:', e);
      }
    }

    const currentNotifications = notificationService.getNotifications();
    if (currentNotifications.length > 0) {
      setNotifications(currentNotifications);
    } else if (initialNotifications.length > 0) {
      setNotifications(initialNotifications);
    }

    console.log('📊 Initial notifications loaded:',
      currentNotifications.length > 0 ? currentNotifications.length : initialNotifications.length
    );
  }, []);

  // ===== Listen for notification changes =====
  useEffect(() => {
    const unsubscribe = notificationService.addListener((updatedNotifications, newNotification) => {
      console.log('📢 Notification update received:', updatedNotifications.length);
      setNotifications([...updatedNotifications]);
      if (newNotification && notify) {
        notify(
          isArabic ? `🔔 ${newNotification.title}` : `🔔 ${newNotification.title}`,
          'info'
        );
      }
    });

    const handleNotificationAdded = (event) => {
      console.log('📢 Custom event received:', event.detail);
      const saved = localStorage.getItem('dashboard_notifications');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotifications([...parsed]);
        } catch (e) {
          console.error('Error parsing notifications:', e);
        }
      }
    };

    window.addEventListener('notificationAdded', handleNotificationAdded);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('notificationAdded', handleNotificationAdded);
    };
  }, [isArabic]);

  // ===== Make notification service available globally =====
  useEffect(() => {
    window.notificationService = notificationService;
    window.addNotification = (title, message, type, link) => {
      return notificationService.addNotification(title, message, type, link);
    };
    window.getNotifications = () => {
      return notificationService.getNotifications();
    };

    return () => {
      delete window.notificationService;
      delete window.addNotification;
      delete window.getNotifications;
    };
  }, []);

  // ===== Close dropdown when clicking outside =====
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== Force refresh notifications from localStorage =====
  const refreshNotifications = () => {
    const saved = localStorage.getItem('dashboard_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications([...parsed]);
        console.log('🔄 Notifications refreshed:', parsed.length);
      } catch (e) {
        console.error('Error refreshing notifications:', e);
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-bs-theme');
    }
    if (notify) {
      notify(isArabic ? 'تم تغيير السمة' : 'Theme changed', 'info');
    }
  };

  // ===== MENU ITEMS =====
  const getMenuItems = () => {
    const role = getUserRole();

    const baseItems = [
      { path: getDashboardBasePath(), icon: <FaTachometerAlt />, label: isArabic ? 'لوحة التحكم' : 'Dashboard' },
    ];

    if (role === 'admin' || role === 'director') {
      return [
        ...baseItems,
        { path: '/dashboard/admin/users', icon: <FaUserCog />, label: isArabic ? 'المستخدمين' : 'Users' },
        { path: '/dashboard/admin/teachers', icon: <FaChalkboardTeacher />, label: isArabic ? 'المعلمون' : 'Teachers' },
        { path: '/dashboard/admin/parents', icon: <FaUsers />, label: isArabic ? 'أولياء الأمور' : 'Parents' },
        { path: '/dashboard/admin/students', icon: <FaUserGraduate />, label: isArabic ? 'الطلاب' : 'Students' },
        { path: '/dashboard/admin/classes', icon: <FaBuilding />, label: isArabic ? 'الفصول' : 'Classes' },
        { path: '/dashboard/admin/announcements', icon: <FaBullhorn />, label: isArabic ? 'الإعلانات' : 'Announcements' },
        { path: '/dashboard/admin/assessments', icon: <FaClipboardList />, label: isArabic ? 'لوحة التقييمات' : 'Assessments Dashboard' },
        { path: '/dashboard/admin/registrations', icon: <FaUserPlus />, label: isArabic ? 'التسجيلات' : 'Registrations' },
        { path: '/dashboard/admin/settings', icon: <FaCog />, label: isArabic ? 'الإعدادات' : 'Settings' },
        { path: '/dashboard/admin/subjects', icon: <FaBook />, label: isArabic ? 'المواد الدراسية' : 'Subjects' },
        { path: '/dashboard/admin/admissions', icon: <FaBook />, label: isArabic ? 'القبول' : 'Admission' },
        { path: '/dashboard/admin/payments', icon: <FaMoneyBillWave />, label: isArabic ? 'المدفوعات' : 'Payments' },
        { path: '/dashboard/admin/notifications', icon: <FaBell />, label: isArabic ? 'الإشعارات' : 'Notifications' },
      ];
    }

    if (role === 'teacher') {
      return [
        ...baseItems,
        { path: '/dashboard/teacher/my-students', icon: <FaUserGraduate />, label: isArabic ? 'طلابي' : 'My Students' },
        { path: '/dashboard/teacher/classes', icon: <FaBuilding />, label: isArabic ? 'فصولي' : 'My Classes' },
        { path: '/dashboard/teacher/assessments', icon: <FaFileAlt />, label: isArabic ? 'التقييمات' : 'Assessments' },
        { path: '/dashboard/teacher/attendance', icon: <FaClock />, label: isArabic ? 'الحضور' : 'Attendance' },
        { path: '/dashboard/teacher/notifications', icon: <FaBell />, label: isArabic ? 'الإشعارات' : 'Notifications' },
      ];
    }

    if (role === 'parent') {
      return [
        ...baseItems,
        { path: '/dashboard/parent/child-results', icon: <FaAward />, label: isArabic ? 'نتائج طفلي' : 'Child Results' },
        { path: '/dashboard/parent/payments', icon: <FaMoneyBillWave />, label: isArabic ? 'المدفوعات' : 'Payments' },
        { path: '/dashboard/parent/announcements', icon: <FaBullhorn />, label: isArabic ? 'الإعلانات' : 'Announcements' },
      ];
    }

    if (role === 'student') {
      return [
        ...baseItems,
        { path: '/dashboard/student/my-results', icon: <FaAward />, label: isArabic ? 'نتائجي' : 'My Results' },
        { path: '/dashboard/student/announcements', icon: <FaBullhorn />, label: isArabic ? 'الإعلانات' : 'Announcements' },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    try {
      await logout();
      if (notify) {
        notify(
          isArabic ? 'تم تسجيل الخروج' : 'Logged out successfully',
          'info'
        );
      }
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // ===== Mark notification as read =====
  const markAsRead = (id) => {
    notificationService.markAsRead(id);
    const updated = notificationService.getNotifications();
    setNotifications([...updated]);
  };

  // ===== Mark all as read =====
  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    const updated = notificationService.getNotifications();
    setNotifications([...updated]);
    if (notify) {
      notify(
        isArabic ? 'تم تحديد جميع الإشعارات كمقروءة' : 'All notifications marked as read',
        'info'
      );
    }
  };

  // ===== Handle notification click =====
  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // ===== Handle View All Click =====
  const handleViewAll = () => {
    setShowNotifications(false);
    navigate('/dashboard/admin/notifications');
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const logoExists = logo && typeof logo === 'string' && logo.length > 0;

  const getSidebarColor = () => {
    return darkMode ? '#0d1117' : '#ffffff';
  };

  const renderNotificationIcon = (type) => {
    switch (type) {
      case 'registration':
        return <FaUserPlus />;
      case 'announcement':
        return <FaBullhorn />;
      case 'event':
        return <FaCalendarCheck />;
      case 'assessment':
        return <FaFileAlt />;
      case 'attendance':
        return <FaClock />;
      default:
        return <FaBell />;
    }
  };

  // ===== Get role color for avatar =====
  const getRoleColor = () => {
    const role = getUserRole();
    const colorMap = {
      admin: '#1a5f7a',
      teacher: '#2d6a4f',
      parent: '#c49a6c',
      student: '#6c757d'
    };
    return colorMap[role] || '#1a5f7a';
  };

  const SidebarContent = () => (
    <div className="sidebar-content">
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          {logoExists ? (
            <img
              src={logo}
              alt="Madrassat Al Fath"
              className="brand-logo-img"
            />
          ) : (
            <FaSchool className="brand-icon" />
          )}
        </div>
        <div className="brand-text">
          <h5 className="brand-name">{isArabic ? 'مدرسة الفتح' : 'Madrassat Al Fath'}</h5>
          <span className="brand-subtitle">
            {isAdmin() ? (
              isArabic ? 'لوحة الإدارة' : 'Admin Panel'
            ) : (
              getRoleDisplayName()
            )}
          </span>
        </div>
      </div>

      <div className="sidebar-user">
        <div 
          className="user-avatar-large" 
          style={{ background: `linear-gradient(135deg, ${getRoleColor()}, ${getRoleColor()}cc)` }}
        >
          {getRoleLetter()}
        </div>
        <div className="user-info">
          <h6 className="user-name">{user?.name || 'Administrator'}</h6>
          <span className="user-role">{getRoleDisplayName()}</span>
        </div>
        <div className="user-status">
          <span className="status-dot"></span>
        </div>
      </div>

      <Nav className="sidebar-nav flex-column">
        {menuItems.map((item, index) => (
          <React.Fragment key={item.path}>
            <Nav.Link
              as={Link}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => isMobile && setShowOffcanvas(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {isActive(item.path) && <span className="sidebar-indicator"></span>}
            </Nav.Link>
            {index < menuItems.length - 1 && <div className="sidebar-item-separator"></div>}
          </React.Fragment>
        ))}

        <div className="sidebar-divider"></div>
        <div className="sidebar-spacer"></div>

        <div className="sidebar-footer">
          <Nav.Link onClick={handleLogout} className="sidebar-link logout-link">
            <span className="sidebar-icon"><FaSignOutAlt /></span>
            <span className="sidebar-label">{isArabic ? 'تسجيل خروج' : 'Logout'}</span>
            <span className="logout-indicator"></span>
          </Nav.Link>
        </div>
      </Nav>
    </div>
  );

  return (
    <div className={`dashboard-wrapper ${darkMode ? 'dark-theme' : 'light-theme'} ${isArabic ? 'rtl' : 'ltr'}`}>
      {!isMobile && sidebarOpen && (
        <div className="dashboard-sidebar" style={{ background: getSidebarColor() }}>
          <SidebarContent />
        </div>
      )}

      <Offcanvas
        show={showOffcanvas}
        onHide={() => setShowOffcanvas(false)}
        placement={isArabic ? 'end' : 'start'}
        className={`dashboard-offcanvas ${darkMode ? 'dark-theme' : 'light-theme'}`}
        style={{ width: '280px' }}
      >
        <Offcanvas.Header closeButton className="offcanvas-header-custom">
          <Offcanvas.Title>
            <div className="sidebar-brand">
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <SidebarContent />
        </Offcanvas.Body>
      </Offcanvas>

      <div className={`dashboard-main ${!isMobile && sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Navbar className="dashboard-navbar" expand={false} style={{ background: getSidebarColor() }}>
          <Container fluid className="px-3 px-lg-4">
            <div className="d-flex align-items-center">
              <Button
                variant="link"
                className="navbar-toggle"
                onClick={() => {
                  if (isMobile) {
                    setShowOffcanvas(true);
                  } else {
                    setSidebarOpen(!sidebarOpen);
                  }
                }}
              >
                <FaBars />
              </Button>
              <div className="navbar-title-wrapper ms-2">
                <h6 className="navbar-title mb-0">
                  {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
                </h6>
                <span className="navbar-subtitle d-none d-sm-block">
                  {isArabic ? 'مرحباً بعودتك' : 'Welcome back'} 👋
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="link"
                className="navbar-icon-btn"
                onClick={toggleLanguage}
                title={isArabic ? 'English' : 'العربية'}
              >
                <FaLanguage />
                <span className="d-none d-md-inline ms-1" style={{ fontSize: '0.7rem', fontWeight: '600' }}>
                  {isArabic ? 'EN' : 'ع'}
                </span>
              </Button>

              <Button
                variant="link"
                className="navbar-icon-btn"
                onClick={toggleDarkMode}
                title={isArabic ? 'تغيير السمة' : 'Toggle Theme'}
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </Button>

              {/* ===== NOTIFICATION DROPDOWN ===== */}
              <div ref={notificationRef} className="notification-dropdown-wrapper">
                <Button
                  variant="link"
                  className="navbar-icon-btn position-relative"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      refreshNotifications();
                    }
                  }}
                >
                  <FaBell />
                  {unreadCount > 0 && (
                    <Badge pill bg="danger" className="notification-badge">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>

                {showNotifications && (
                  <div className={`notification-dropdown ${isArabic ? 'dropdown-rtl' : 'dropdown-ltr'}`}>
                    <div className="notification-header">
                      <span className="fw-bold">
                        {isArabic ? 'الإشعارات' : 'Notifications'}
                        <span className="ms-2 text-muted" style={{ fontSize: '0.7rem' }}>
                          ({notifications.length})
                        </span>
                      </span>
                      <div className="d-flex gap-2 align-items-center">
                        {unreadCount > 0 && (
                          <Button
                            variant="link"
                            className="mark-all-read-btn p-0"
                            onClick={markAllAsRead}
                            style={{ fontSize: '0.7rem', color: '#1a5f7a', textDecoration: 'none' }}
                          >
                            <FaCheckDouble className="me-1" size={12} />
                            {isArabic ? 'تحديد الكل كمقروء' : 'Mark all read'}
                          </Button>
                        )}
                        <Button
                          variant="link"
                          className="close-notifications-btn p-0"
                          onClick={() => setShowNotifications(false)}
                          style={{ fontSize: '0.7rem', color: '#6c757d', textDecoration: 'none' }}
                        >
                          <FaTimes size={16} />
                        </Button>
                      </div>
                    </div>

                    <div className="notification-body">
                      {notifications.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                          <FaBell className="mb-2" size={30} style={{ opacity: 0.3 }} />
                          <div><small>{isArabic ? 'لا توجد إشعارات' : 'No notifications'}</small></div>
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((notif) => (
                          <div
                            key={notif.id}
                            className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <div className="notification-icon-wrapper">
                              {renderNotificationIcon(notif.type)}
                            </div>
                            <div className="notification-content">
                              <div className="fw-semibold notification-title">{notif.title}</div>
                              <div className="text-muted small notification-message">{notif.message}</div>
                              <div className="text-muted small notification-time">{notif.time}</div>
                            </div>
                            {!notif.read && <div className="notification-dot"></div>}
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="notification-footer">
                        <Button
                          variant="link"
                          className="view-all-link p-0"
                          onClick={handleViewAll}
                          style={{ color: '#1a5f7a', textDecoration: 'none', fontWeight: '500' }}
                        >
                          {isArabic ? 'عرض جميع الإشعارات' : 'View all notifications'}
                          <FaChevronDown className="ms-1" size={10} />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ===== USER DROPDOWN - ROLE BASED ===== */}
              <NavDropdown
                title={
                  <span className="user-dropdown-trigger">
                    <span 
                      className="user-avatar-sm" 
                      style={{ background: `linear-gradient(135deg, ${getRoleColor()}, ${getRoleColor()}cc)` }}
                    >
                      {getRoleLetter()}
                    </span>
                    <span className="d-none d-md-inline ms-2 user-dropdown-name">{user?.name || 'Admin'}</span>
                    <span className="d-none d-md-inline ms-1 user-role-badge" style={{ 
                      fontSize: '0.55rem', 
                      opacity: 0.7,
                      background: `${getRoleColor()}20`,
                      color: getRoleColor(),
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: '600'
                    }}>
                      {getRoleDisplayName()}
                    </span>
                    <FaChevronDown className="ms-1" size={12} />
                  </span>
                }
                align={isArabic ? 'start' : 'end'}
                className={`user-dropdown ${isArabic ? 'dropdown-rtl' : 'dropdown-ltr'}`}
              >
                {/* ===== PROFILE - Always visible for all roles ===== */}
                <NavDropdown.Item as={Link} to={getProfilePath()}>
                  <FaUser className="me-2" /> {isArabic ? 'الملف الشخصي' : 'Profile'}
                </NavDropdown.Item>

                {/* ===== SETTINGS - ONLY for Admin ===== */}
                {isAdmin() && (
                  <NavDropdown.Item as={Link} to={getSettingsPath()}>
                    <FaCog className="me-2" /> {isArabic ? 'الإعدادات' : 'Settings'}
                  </NavDropdown.Item>
                )}

                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> {isArabic ? 'تسجيل خروج' : 'Logout'}
                </NavDropdown.Item>
              </NavDropdown>
            </div>
          </Container>
        </Navbar>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>

      <style>{`
        .dashboard-wrapper {
          display: flex;
          min-height: 100vh;
          transition: all 0.3s ease;
        }

        .dashboard-wrapper.light-theme {
          --bg-primary: #f0f2f5;
          --bg-secondary: #ffffff;
          --bg-card: #ffffff;
          --bg-card-hover: #f8f9fa;
          --text-primary: #1a1a2e;
          --text-secondary: #4a4a6a;
          --text-muted: #6c757d;
          --border-color: #e9ecef;
          --shadow-color: rgba(0,0,0,0.05);
          --shadow-hover: rgba(0,0,0,0.1);
          --hover-bg: rgba(26, 95, 122, 0.04);
          --active-bg: rgba(26, 95, 122, 0.08);
          --active-color: #1a5f7a;
          --separator-color: rgba(0,0,0,0.06);
          --text-light: #6c757d;
        }

        .dashboard-wrapper.dark-theme {
          --bg-primary: #0a0e1a;
          --bg-secondary: #0d1117;
          --bg-card: #161b22;
          --bg-card-hover: #1c2333;
          --text-primary: #f0f6fc;
          --text-secondary: #8b949e;
          --text-muted: #6c7a8a;
          --border-color: #21262d;
          --shadow-color: rgba(0,0,0,0.4);
          --shadow-hover: rgba(0,0,0,0.6);
          --hover-bg: rgba(255,255,255,0.04);
          --active-bg: rgba(74, 158, 255, 0.1);
          --active-color: #4a9eff;
          --separator-color: rgba(255,255,255,0.05);
          --text-light: #6c7a8a;
        }

        .dashboard-wrapper.rtl { direction: rtl; }
        .dashboard-wrapper.ltr { direction: ltr; }

        .dashboard-sidebar {
          width: 270px;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          border-right: 1px solid var(--border-color);
          overflow-y: auto;
          z-index: 1040;
          transition: transform 0.3s ease;
          background: var(--bg-secondary);
        }

        .dashboard-wrapper.rtl .dashboard-sidebar {
          left: auto;
          right: 0;
          border-right: none;
          border-left: 1px solid var(--border-color);
        }

        .dashboard-sidebar::-webkit-scrollbar { width: 4px; }
        .dashboard-sidebar::-webkit-scrollbar-thumb { background: var(--active-color); border-radius: 4px; }

        .sidebar-content { 
          padding: 16px 0 20px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px 20px;
          border-bottom: 1px solid var(--border-color);
        }
        .dashboard-wrapper.rtl .sidebar-brand { flex-direction: row-reverse; }

        .brand-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #1a5f7a, #2a7f9a);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .brand-logo-img {
          width: 50px;
          height: 42px;
          object-fit: cover;
          border-radius: 12px;
        }

        .brand-icon { font-size: 22px; color: white; }

        .brand-text { flex: 1; min-width: 0; }
        .dashboard-wrapper.rtl .brand-text { text-align: right; }
        .brand-name { font-weight: 700; color: var(--text-primary); margin: 0; font-size: 1rem; line-height: 1.2; }
        .brand-subtitle { 
          color: var(--text-secondary); 
          font-size: 0.6rem; 
          opacity: 0.7; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          position: relative;
        }
        .dashboard-wrapper.rtl .sidebar-user { flex-direction: row-reverse; }

        .user-avatar-large {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .user-info { flex: 1; min-width: 0; }
        .dashboard-wrapper.rtl .user-info { text-align: right; }
        .user-name { color: var(--text-primary); margin: 0; font-size: 0.85rem; font-weight: 600; line-height: 1.2; }
        .user-role { color: var(--text-secondary); font-size: 0.65rem; opacity: 0.7; }

        .status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2ecc71;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .sidebar-nav { 
          padding: 8px 0;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.3s ease;
          position: relative;
          border-left: 3px solid transparent;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .dashboard-wrapper.rtl .sidebar-link {
          border-left: none;
          border-right: 3px solid transparent;
        }
        .sidebar-link:hover { 
          background: var(--hover-bg); 
          color: var(--active-color);
          border-left-color: var(--active-color);
        }
        .dashboard-wrapper.rtl .sidebar-link:hover {
          border-left: none;
          border-right-color: var(--active-color);
        }
        .sidebar-link.active {
          background: var(--active-bg);
          color: var(--active-color);
          border-left-color: var(--active-color);
          font-weight: 500;
        }
        .dashboard-wrapper.rtl .sidebar-link.active {
          border-left: none;
          border-right-color: var(--active-color);
        }

        .sidebar-item-separator {
          height: 1px;
          background: var(--separator-color);
          margin: 2px 20px;
        }

        .sidebar-icon { font-size: 1.1rem; width: 24px; text-align: center; flex-shrink: 0; }
        .sidebar-label { flex-grow: 1; }
        .dashboard-wrapper.rtl .sidebar-label { text-align: right; }

        .sidebar-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--active-color);
          animation: pulse-indicator 2s infinite;
        }

        .sidebar-divider { 
          height: 1px; 
          background: var(--border-color); 
          margin: 12px 20px; 
        }

        .sidebar-spacer {
          flex: 1;
        }

        .sidebar-footer {
          border-top: 1px solid var(--border-color);
          margin-top: 4px;
          padding-top: 8px;
          padding-bottom: 4px;
        }

        .logout-link {
          color: #ef4444 !important;
          border-radius: 12px !important;
          margin: 4px 12px !important;
          padding: 10px 16px !important;
          transition: all 0.3s ease !important;
          position: relative;
          overflow: hidden;
          border: none !important;
          background: transparent !important;
        }

        .logout-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(239, 68, 68, 0.08);
          transform: translateX(-100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 12px;
        }

        .logout-link:hover::before {
          transform: translateX(0);
        }

        .logout-link:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          color: #ef4444 !important;
          transform: translateX(4px);
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
        }

        .dashboard-wrapper.rtl .logout-link:hover {
          transform: translateX(-4px);
        }

        .logout-link .sidebar-icon {
          color: #ef4444 !important;
          transition: transform 0.3s ease;
        }

        .logout-link:hover .sidebar-icon {
          transform: translateX(4px) scale(1.1);
        }

        .dashboard-wrapper.rtl .logout-link:hover .sidebar-icon {
          transform: translateX(-4px) scale(1.1);
        }

        .logout-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          display: inline-block;
          margin-left: auto;
          animation: pulse-dot 2s infinite;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
        }

        .dashboard-wrapper.rtl .logout-indicator {
          margin-left: 0;
          margin-right: auto;
        }

        .dashboard-main {
          flex: 1;
          margin-left: 270px;
          transition: margin-left 0.3s ease;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .dashboard-main.sidebar-closed { margin-left: 0; }
        .dashboard-wrapper.rtl .dashboard-main { margin-left: 0; margin-right: 270px; }
        .dashboard-wrapper.rtl .dashboard-main.sidebar-closed { margin-right: 0; }

        .dashboard-navbar {
          padding: 8px 0;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 1030;
          background: var(--bg-secondary);
        }

        .navbar-toggle {
          color: var(--text-primary);
          padding: 4px 8px;
          font-size: 1.2rem;
          border: none;
          background: none;
          transition: color 0.3s ease;
        }
        .navbar-toggle:hover { color: var(--active-color); }
        .dashboard-wrapper.rtl .navbar-title-wrapper { text-align: right; }
        .dashboard-wrapper.rtl .navbar-title-wrapper .ms-2 {
          margin-left: 0 !important;
          margin-right: 0.5rem !important;
        }

        .navbar-title-wrapper { display: flex; flex-direction: column; line-height: 1.2; }
        .navbar-title { color: var(--text-primary); font-weight: 600; font-size: 1rem; }
        .navbar-subtitle { color: var(--text-secondary); font-size: 0.65rem; opacity: 0.7; }

        .navbar-icon-btn {
          color: var(--text-secondary);
          padding: 6px 10px;
          font-size: 1.1rem;
          border: none;
          background: none;
          border-radius: 8px;
          transition: all 0.3s ease;
          position: relative;
        }
        .navbar-icon-btn:hover { color: var(--active-color); background: var(--hover-bg); }

        .dashboard-wrapper.rtl .navbar-icon-btn .ms-1 {
          margin-left: 0 !important;
          margin-right: 0.25rem !important;
        }

        .notification-dropdown-wrapper {
          position: relative;
        }

        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          font-size: 0.5rem;
          padding: 2px 5px;
          min-width: 18px;
          border-radius: 50%;
        }
        .dashboard-wrapper.rtl .notification-badge { right: auto; left: 0; }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          width: 380px;
          max-height: 500px;
          background: var(--bg-secondary);
          border-radius: 16px;
          box-shadow: 0 10px 40px var(--shadow-hover);
          border: 1px solid var(--border-color);
          overflow: hidden;
          z-index: 1060;
          display: flex;
          flex-direction: column;
        }

        .notification-dropdown.dropdown-ltr {
          right: 0;
          left: auto;
        }

        .notification-dropdown.dropdown-rtl {
          left: 0;
          right: auto;
        }

        .notification-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--text-primary);
          flex-shrink: 0;
        }
        .dashboard-wrapper.rtl .notification-header { flex-direction: row-reverse; }

        .mark-all-read-btn {
          transition: all 0.3s ease;
          font-size: 0.7rem !important;
        }
        .mark-all-read-btn:hover {
          color: var(--active-color) !important;
          text-decoration: underline !important;
        }

        .close-notifications-btn {
          transition: all 0.3s ease;
        }
        .close-notifications-btn:hover {
          color: var(--text-primary) !important;
          transform: rotate(90deg);
        }

        .notification-body {
          overflow-y: auto;
          max-height: 350px;
          flex: 1;
        }

        .notification-body::-webkit-scrollbar {
          width: 4px;
        }

        .notification-body::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 4px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .dashboard-wrapper.rtl .notification-item { flex-direction: row-reverse; }

        .notification-item:hover { background: var(--hover-bg); }
        .notification-item.unread { 
          background: var(--active-bg);
          border-left: 3px solid var(--active-color);
        }
        .dashboard-wrapper.rtl .notification-item.unread {
          border-left: none;
          border-right: 3px solid var(--active-color);
        }
        .notification-item.unread:hover { background: var(--active-bg); }

        .notification-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(26, 95, 122, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--active-color);
          flex-shrink: 0;
          font-size: 0.9rem;
        }

        .notification-content { flex: 1; min-width: 0; }
        .notification-title { color: var(--text-primary); font-size: 0.85rem; }
        .notification-message { color: var(--text-secondary); font-size: 0.75rem; margin-top: 2px; }
        .notification-time { color: var(--text-muted); font-size: 0.65rem; margin-top: 4px; }

        .notification-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--active-color);
          flex-shrink: 0;
          margin-top: 4px;
          animation: pulse-dot 2s infinite;
        }
        .dashboard-wrapper.rtl .notification-dot { margin-left: 0; margin-right: auto; }

        .notification-footer {
          padding: 10px 16px;
          text-align: center;
          border-top: 1px solid var(--border-color);
          flex-shrink: 0;
        }

        .view-all-link {
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .view-all-link:hover {
          color: var(--active-color) !important;
          text-decoration: underline !important;
        }

        .user-dropdown-trigger {
          display: flex;
          align-items: center;
          padding: 4px 12px 4px 8px;
          border-radius: 50px;
          background: var(--hover-bg);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }
        .dashboard-wrapper.rtl .user-dropdown-trigger { flex-direction: row-reverse; }
        .user-dropdown-trigger:hover { background: var(--active-bg); border-color: var(--border-color); }

        .user-avatar-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .user-role-badge {
          font-size: 0.55rem;
          opacity: 0.7;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
        }

        .user-dropdown-name { font-weight: 500; font-size: 0.85rem; }

        .dashboard-wrapper.rtl .user-dropdown .ms-1 {
          margin-left: 0 !important;
          margin-right: 0.25rem !important;
        }
        .dashboard-wrapper.rtl .user-dropdown .ms-2 {
          margin-left: 0 !important;
          margin-right: 0.5rem !important;
        }
        .dashboard-wrapper.rtl .user-dropdown .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }

        .user-dropdown.dropdown-ltr .dropdown-menu {
          right: 0;
          left: auto;
        }

        .user-dropdown.dropdown-rtl .dropdown-menu {
          left: 0;
          right: auto;
        }

        .dashboard-content {
          padding: 24px;
          flex: 1;
          background: var(--bg-primary);
        }

        @media (max-width: 991px) {
          .dashboard-sidebar { display: none; }
          .dashboard-main { margin-left: 0 !important; }
          .dashboard-wrapper.rtl .dashboard-main { margin-right: 0 !important; }
          .dashboard-content { padding: 16px; }
        }

        @media (max-width: 768px) {
          .dashboard-content { padding: 12px; }
          .notification-dropdown { 
            width: 320px; 
            max-height: 400px;
            right: -60px !important;
          }
          .dashboard-wrapper.rtl .notification-dropdown {
            right: auto !important;
            left: -60px !important;
          }
          .notification-body {
            max-height: 280px;
          }
        }

        @media (max-width: 576px) {
          .dashboard-content { padding: 8px; }
          .user-dropdown-trigger .d-none { display: none !important; }
          .user-dropdown-trigger { padding: 4px 8px; }
          .user-role-badge { display: none !important; }
          .navbar-title { font-size: 0.85rem; }
          .navbar-subtitle { display: none; }
          .notification-dropdown { 
            width: 290px; 
            max-height: 350px;
            right: -40px !important;
          }
          .dashboard-wrapper.rtl .notification-dropdown {
            right: auto !important;
            left: -40px !important;
          }
          .notification-body {
            max-height: 240px;
          }
          .notification-item {
            padding: 10px 12px;
          }
          .notification-title {
            font-size: 0.8rem;
          }
          .notification-message {
            font-size: 0.7rem;
          }
          .notification-icon-wrapper {
            width: 30px;
            height: 30px;
            font-size: 0.75rem;
          }
          .notification-header {
            flex-wrap: wrap;
            gap: 8px;
          }
          .mark-all-read-btn {
            font-size: 0.6rem !important;
          }
          .logout-link {
            padding: 8px 12px !important;
            margin: 4px 8px !important;
          }
          .logout-link .sidebar-label {
            font-size: 0.75rem !important;
          }
          .logout-indicator {
            width: 6px;
            height: 6px;
          }
        }

        @media (max-width: 400px) {
          .notification-dropdown { 
            width: 260px;
            right: -20px !important;
          }
          .dashboard-wrapper.rtl .notification-dropdown {
            right: auto !important;
            left: -20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;