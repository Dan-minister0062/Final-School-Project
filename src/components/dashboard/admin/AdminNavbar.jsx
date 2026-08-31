// src/components/dashboard/admin/AdminNavbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Navbar, Nav, NavDropdown, Badge, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaBell, FaUserCircle, FaCog, FaSignOutAlt, 
  FaUser, FaBars, FaTimes, FaChevronDown,
  FaEnvelope, FaCalendarAlt, FaFileAlt, FaUsers,
  FaGraduationCap, FaChalkboardTeacher, FaBullhorn,
  FaBook, FaHome, FaInfoCircle, FaPhone, FaNewspaper,
  FaClipboardList, FaChartLine, FaSchool, FaUserPlus,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import notificationService from '../../../services/notificationService';

const AdminNavbar = ({ userRole = 'admin' }) => {
  const { language, isArabic } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Translation helper
  const t = (key) => {
    const translations = {
      en: {
        Dashboard: 'Dashboard',
        Students: 'Students',
        Teachers: 'Teachers',
        Classes: 'Classes',
        Parents: 'Parents',
        Announcements: 'Announcements',
        Events: 'Events',
        Academics: 'Academics',
        Notifications: 'Notifications',
        'Mark all as read': 'Mark all as read',
        'No notifications': 'No notifications',
        'View all notifications': 'View all notifications',
        Profile: 'Profile',
        Settings: 'Settings',
        Logout: 'Logout',
        'User menu': 'User menu',
        'Open menu': 'Open menu',
        'Close menu': 'Close menu',
        Admin: 'Admin',
        'New Registration': 'New Registration',
        'New Announcement': 'New Announcement',
        'Registration Approved': 'Registration Approved',
        'Registration Declined': 'Registration Declined',
      },
      ar: {
        Dashboard: 'لوحة التحكم',
        Students: 'التلاميذ',
        Teachers: 'المعلمون',
        Classes: 'الفصول',
        Parents: 'أولياء الأمور',
        Announcements: 'الإعلانات',
        Events: 'الفعاليات',
        Academics: 'المناهج',
        Notifications: 'الإشعارات',
        'Mark all as read': 'تحديد الكل كمقروء',
        'No notifications': 'لا توجد إشعارات',
        'View all notifications': 'عرض جميع الإشعارات',
        Profile: 'الملف الشخصي',
        Settings: 'الإعدادات',
        Logout: 'تسجيل خروج',
        'User menu': 'قائمة المستخدم',
        'Open menu': 'فتح القائمة',
        'Close menu': 'إغلاق القائمة',
        Admin: 'المسؤول',
        'New Registration': 'تسجيل جديد',
        'New Announcement': 'إعلان جديد',
        'Registration Approved': 'تم قبول التسجيل',
        'Registration Declined': 'تم رفض التسجيل',
      }
    };
    return translations[language]?.[key] || translations.en[key] || key;
  };

  // ===== Load notifications =====
  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    // Filter: Only show notifications for announcements and registrations
    const filteredNotifications = allNotifications.filter(n => 
      n.type === 'announcement' || 
      n.type === 'registration' ||
      n.type === 'registration_approved' ||
      n.type === 'registration_declined' ||
      n.type === 'new_registration'
    );
    setNotifications(filteredNotifications);
    setUnreadCount(filteredNotifications.filter(n => !n.read).length);
  };

  // ===== Listen for notification changes =====
  useEffect(() => {
    loadNotifications();

    // Listen for new notifications
    const handleNewNotification = (event) => {
      const newNotif = event.detail;
      if (newNotif && (newNotif.type === 'announcement' || newNotif.type === 'registration' || newNotif.type === 'new_registration')) {
        loadNotifications();
      }
    };

    window.addEventListener('newNotification', handleNewNotification);
    
    // Also listen for storage changes from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'notifications') {
        loadNotifications();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Poll for changes every 5 seconds
    const interval = setInterval(loadNotifications, 5000);

    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // ===== Handle scroll effect =====
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ===== Close dropdowns when clicking outside =====
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== Navigation items =====
  const navItems = [
    { path: '/dashboard/admin', icon: <FaHome />, label: t('Dashboard') },
    { path: '/dashboard/admin/parents', icon: <FaUsers />, label: t('Parents') },
    { path: '/dashboard/admin/students', icon: <FaUser />, label: t('Students') },
    { path: '/dashboard/admin/teachers', icon: <FaChalkboardTeacher />, label: t('Teachers') },
    { path: '/dashboard/admin/classes', icon: <FaGraduationCap />, label: t('Classes') },
    { path: '/dashboard/admin/announcements', icon: <FaBullhorn />, label: t('Announcements') },
    { path: '/dashboard/admin/academics', icon: <FaBook />, label: t('Academics') },
  ];

  // ===== Handle notification click =====
  const handleNotificationClick = (notification) => {
    // Mark as read
    notificationService.markAsRead(notification.id);
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Navigate based on notification type
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.type === 'announcement') {
      navigate('/dashboard/admin/announcements');
    } else if (notification.type === 'registration' || notification.type === 'new_registration') {
      navigate('/dashboard/admin/registrations');
    } else if (notification.type === 'registration_approved' || notification.type === 'registration_declined') {
      navigate('/dashboard/admin/registrations');
    }
    
    setShowNotifications(false);
  };

  // ===== Handle mark all as read =====
  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    setUnreadCount(0);
    setShowNotifications(false);
  };

  // ===== Handle logout =====
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ===== Get notification icon based on type =====
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'announcement':
        return <FaBullhorn />;
      case 'registration':
      case 'new_registration':
        return <FaUserPlus />;
      case 'registration_approved':
        return <FaCheckCircle />;
      case 'registration_declined':
        return <FaExclamationTriangle />;
      default:
        return <FaBell />;
    }
  };

  // ===== Get notification icon color =====
  const getNotificationColor = (type) => {
    switch(type) {
      case 'announcement':
        return '#e74c3c';
      case 'registration':
      case 'new_registration':
        return '#f39c12';
      case 'registration_approved':
        return '#2ecc71';
      case 'registration_declined':
        return '#e74c3c';
      default:
        return '#4a9eff';
    }
  };

  // ===== Notification dropdown =====
  const NotificationDropdown = () => (
    <div 
      ref={notificationRef}
      className={`notification-dropdown-wrapper ${isArabic ? 'rtl' : 'ltr'}`}
    >
      <button
        className={`notification-btn ${showNotifications ? 'active' : ''}`}
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label={t('Notifications')}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <div className={`notification-dropdown ${isArabic ? 'dropdown-rtl' : 'dropdown-ltr'}`}>
          <div className="dropdown-header">
            <span className="dropdown-title">{t('Notifications')}</span>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read"
                onClick={handleMarkAllAsRead}
              >
                {t('Mark all as read')}
              </button>
            )}
          </div>
          <div className="dropdown-body">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <FaBell className="no-notif-icon" />
                <p>{t('No notifications')}</p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notif) => {
                const isUnread = !notif.read;
                const iconColor = getNotificationColor(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`notification-item ${isUnread ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="notif-icon-wrapper" style={{ color: iconColor, background: `${iconColor}15` }}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="notif-content">
                      <div className="notif-title">{notif.title}</div>
                      <div className="notif-message">{notif.message}</div>
                      <div className="notif-time">{notif.time}</div>
                    </div>
                    {isUnread && <div className="notif-dot" style={{ background: iconColor }}></div>}
                  </div>
                );
              })
            )}
          </div>
          {notifications.length > 0 && (
            <div className="dropdown-footer">
              <button onClick={() => { navigate('/dashboard/admin/notifications'); setShowNotifications(false); }}>
                {t('View all notifications')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ===== User menu dropdown =====
  const UserMenuDropdown = () => (
    <div 
      ref={userMenuRef}
      className={`user-menu-wrapper ${isArabic ? 'rtl' : 'ltr'}`}
    >
      <button
        className={`user-menu-btn ${showUserMenu ? 'active' : ''}`}
        onClick={() => setShowUserMenu(!showUserMenu)}
        aria-label={t('User menu')}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="user-avatar" />
        ) : (
          <FaUserCircle className="user-avatar-icon" />
        )}
        <span className="user-name">{user?.name || t('Admin')}</span>
        <FaChevronDown className={`user-chevron ${showUserMenu ? 'rotated' : ''}`} />
      </button>

      {showUserMenu && (
        <div className={`user-dropdown ${isArabic ? 'dropdown-rtl' : 'dropdown-ltr'}`}>
          <div className="user-dropdown-header">
            <div className="user-dropdown-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <FaUserCircle />
              )}
            </div>
            <div className="user-dropdown-info">
              <div className="user-dropdown-name">{user?.name || t('Admin')}</div>
              <div className="user-dropdown-email">{user?.email || 'admin@school.com'}</div>
            </div>
          </div>
          <div className="user-dropdown-body">
            <button onClick={() => { navigate('/dashboard/admin/profile'); setShowUserMenu(false); }}>
              <FaUser /> {t('Profile')}
            </button>
            <button onClick={() => { navigate('/dashboard/admin/settings'); setShowUserMenu(false); }}>
              <FaCog /> {t('Settings')}
            </button>
            <hr />
            <button onClick={handleLogout} className="logout-btn">
              <FaSignOutAlt /> {t('Logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Navbar 
        className={`admin-navbar ${isScrolled ? 'scrolled' : ''} ${isArabic ? 'rtl' : 'ltr'}`}
        expand="lg"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="navbar-container">
          {/* ===== Brand / Logo ===== */}
          <Navbar.Brand as={Link} to="/dashboard/admin" className="navbar-brand">
            <div className="brand-logo">
              <FaSchool className="brand-icon" />
              <span className="brand-text">
                {isArabic ? 'مدرسة الفتح' : 'Al Fath School'}
              </span>
            </div>
          </Navbar.Brand>

          {/* ===== Mobile Menu Toggle ===== */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t('Close menu') : t('Open menu')}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* ===== Desktop Navigation ===== */}
          <Nav className="desktop-nav">
            {navItems.map((item) => (
              <Nav.Link
                key={item.path}
                as={Link}
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                {item.icon}
                <span>{item.label}</span>
              </Nav.Link>
            ))}
          </Nav>

          {/* ===== Right Side Controls ===== */}
          <div className="navbar-controls">
            <NotificationDropdown />
            <UserMenuDropdown />
          </div>
        </div>

        {/* ===== Mobile Navigation ===== */}
        <div 
          ref={mobileMenuRef}
          className={`mobile-nav ${mobileMenuOpen ? 'open' : ''} ${isArabic ? 'rtl' : 'ltr'}`}
        >
          <div className="mobile-nav-inner">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            <hr />
            <Link
              to="/dashboard/admin/profile"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaUser /> {t('Profile')}
            </Link>
            <Link
              to="/dashboard/admin/settings"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaCog /> {t('Settings')}
            </Link>
            <button
              className="mobile-nav-link logout"
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
            >
              <FaSignOutAlt /> {t('Logout')}
            </button>
          </div>
        </div>
      </Navbar>

      <style>{`
        /* ===== ADMIN NAVBAR STYLES ===== */
        .admin-navbar {
          background: #ffffff;
          padding: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          position: sticky;
          top: 0;
          z-index: 1050;
          min-height: 64px;
        }

        .admin-navbar.scrolled {
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }

        .admin-navbar.rtl {
          direction: rtl;
          text-align: right;
        }

        .admin-navbar.ltr {
          direction: ltr;
          text-align: left;
        }

        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          width: 100%;
          max-width: 100%;
          height: 64px;
        }

        /* ===== Brand ===== */
        .navbar-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          padding: 0;
          margin: 0;
          flex-shrink: 0;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-icon {
          font-size: 1.6rem;
          color: #4a9eff;
        }

        .brand-text {
          font-size: 1.1rem;
          font-weight: 700;
          color: #2d3436;
          white-space: nowrap;
        }

        .admin-navbar.rtl .brand-text {
          font-family: 'Traditional Arabic', 'Arabic Typesetting', serif;
        }

        /* ===== Mobile Toggle ===== */
        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          font-size: 1.4rem;
          color: #2d3436;
          padding: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 8px;
        }

        .mobile-toggle:hover {
          background: rgba(0,0,0,0.05);
        }

        /* ===== Desktop Navigation ===== */
        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          padding: 0 16px;
          overflow-x: auto;
        }

        .desktop-nav .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          color: #6c757d;
          font-size: 0.85rem;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.3s ease;
          white-space: nowrap;
          text-decoration: none;
        }

        .desktop-nav .nav-link:hover {
          background: rgba(74, 158, 255, 0.08);
          color: #4a9eff;
        }

        .desktop-nav .nav-link.active {
          background: rgba(74, 158, 255, 0.12);
          color: #4a9eff;
        }

        .desktop-nav .nav-link svg {
          font-size: 1rem;
          flex-shrink: 0;
        }

        .admin-navbar.rtl .desktop-nav .nav-link {
          flex-direction: row-reverse;
        }

        /* ===== Controls ===== */
        .navbar-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* ===== Notification Dropdown ===== */
        .notification-dropdown-wrapper {
          position: relative;
        }

        .notification-btn {
          position: relative;
          background: none;
          border: none;
          padding: 8px 10px;
          font-size: 1.2rem;
          color: #6c757d;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 8px;
        }

        .notification-btn:hover {
          background: rgba(0,0,0,0.05);
          color: #4a9eff;
        }

        .notification-btn.active {
          background: rgba(74, 158, 255, 0.12);
          color: #4a9eff;
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #e74c3c;
          color: white;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 50%;
          min-width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ffffff;
        }

        .admin-navbar.rtl .notification-badge {
          right: auto;
          left: 4px;
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          width: 380px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          border: 1px solid #e9ecef;
          overflow: hidden;
          z-index: 1060;
          max-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .notification-dropdown.dropdown-ltr {
          right: 0;
        }

        .notification-dropdown.dropdown-rtl {
          left: 0;
          right: auto;
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid #e9ecef;
          flex-shrink: 0;
        }

        .admin-navbar.rtl .dropdown-header {
          flex-direction: row-reverse;
        }

        .dropdown-title {
          font-weight: 600;
          font-size: 0.9rem;
          color: #2d3436;
        }

        .mark-all-read {
          background: none;
          border: none;
          color: #4a9eff;
          font-size: 0.75rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .mark-all-read:hover {
          background: rgba(74, 158, 255, 0.08);
        }

        .dropdown-body {
          overflow-y: auto;
          flex: 1;
          padding: 4px 0;
        }

        .dropdown-body::-webkit-scrollbar {
          width: 4px;
        }

        .dropdown-body::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .no-notifications {
          padding: 40px 20px;
          text-align: center;
          color: #6c757d;
        }

        .no-notif-icon {
          font-size: 2rem;
          color: #d1d5db;
          margin-bottom: 12px;
        }

        .no-notifications p {
          margin: 0;
          font-size: 0.85rem;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .admin-navbar.rtl .notification-item {
          flex-direction: row-reverse;
        }

        .notification-item:hover {
          background: rgba(0,0,0,0.02);
        }

        .notification-item.unread {
          background: rgba(74, 158, 255, 0.05);
        }

        .notification-item.unread:hover {
          background: rgba(74, 158, 255, 0.08);
        }

        .notif-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0.9rem;
        }

        .notif-content {
          flex: 1;
          min-width: 0;
        }

        .notif-title {
          font-weight: 600;
          font-size: 0.85rem;
          color: #2d3436;
        }

        .notif-message {
          font-size: 0.78rem;
          color: #6c757d;
          margin-top: 2px;
          word-wrap: break-word;
        }

        .notif-time {
          font-size: 0.65rem;
          color: #adb5bd;
          margin-top: 4px;
        }

        .notif-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .admin-navbar.rtl .notif-dot {
          margin-left: 0;
          margin-right: auto;
        }

        .dropdown-footer {
          padding: 10px 18px;
          border-top: 1px solid #e9ecef;
          text-align: center;
          flex-shrink: 0;
        }

        .dropdown-footer button {
          background: none;
          border: none;
          color: #4a9eff;
          font-size: 0.8rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .dropdown-footer button:hover {
          background: rgba(74, 158, 255, 0.08);
        }

        /* ===== User Menu Dropdown ===== */
        .user-menu-wrapper {
          position: relative;
        }

        .user-menu-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #2d3436;
        }

        .admin-navbar.rtl .user-menu-btn {
          flex-direction: row-reverse;
        }

        .user-menu-btn:hover {
          background: rgba(0,0,0,0.05);
        }

        .user-menu-btn.active {
          background: rgba(74, 158, 255, 0.08);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-avatar-icon {
          font-size: 2rem;
          color: #adb5bd;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .user-chevron {
          font-size: 0.7rem;
          color: #adb5bd;
          transition: transform 0.3s ease;
        }

        .user-chevron.rotated {
          transform: rotate(180deg);
        }

        .admin-navbar.rtl .user-chevron.rotated {
          transform: rotate(-180deg);
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          width: 280px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          border: 1px solid #e9ecef;
          overflow: hidden;
          z-index: 1060;
        }

        .user-dropdown.dropdown-ltr {
          right: 0;
        }

        .user-dropdown.dropdown-rtl {
          left: 0;
          right: auto;
        }

        .user-dropdown-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid #e9ecef;
        }

        .admin-navbar.rtl .user-dropdown-header {
          flex-direction: row-reverse;
        }

        .user-dropdown-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          background: rgba(74, 158, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-dropdown-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-dropdown-avatar svg {
          font-size: 2.2rem;
          color: #adb5bd;
        }

        .user-dropdown-info {
          flex: 1;
          min-width: 0;
        }

        .user-dropdown-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: #2d3436;
        }

        .user-dropdown-email {
          font-size: 0.75rem;
          color: #6c757d;
          word-wrap: break-word;
        }

        .user-dropdown-body {
          padding: 6px 0;
        }

        .user-dropdown-body button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 18px;
          background: none;
          border: none;
          color: #2d3436;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .admin-navbar.rtl .user-dropdown-body button {
          flex-direction: row-reverse;
          text-align: right;
        }

        .user-dropdown-body button:hover {
          background: rgba(0,0,0,0.05);
        }

        .user-dropdown-body button svg {
          font-size: 1rem;
          color: #6c757d;
          flex-shrink: 0;
        }

        .user-dropdown-body hr {
          margin: 6px 0;
          border-color: #e9ecef;
        }

        .user-dropdown-body .logout-btn {
          color: #e74c3c;
        }

        .user-dropdown-body .logout-btn svg {
          color: #e74c3c;
        }

        .user-dropdown-body .logout-btn:hover {
          background: rgba(231, 76, 60, 0.08);
        }

        /* ===== Mobile Navigation ===== */
        .mobile-nav {
          display: none;
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1040;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .mobile-nav.open {
          opacity: 1;
          visibility: visible;
        }

        .mobile-nav-inner {
          background: #ffffff;
          padding: 16px 20px;
          height: 100%;
          overflow-y: auto;
          width: 300px;
          transition: transform 0.3s ease;
          box-shadow: 4px 0 20px rgba(0,0,0,0.1);
        }

        .admin-navbar.rtl .mobile-nav-inner {
          box-shadow: -4px 0 20px rgba(0,0,0,0.1);
        }

        .mobile-nav.ltr .mobile-nav-inner {
          transform: translateX(-100%);
        }

        .mobile-nav.ltr.open .mobile-nav-inner {
          transform: translateX(0);
        }

        .mobile-nav.rtl .mobile-nav-inner {
          transform: translateX(100%);
        }

        .mobile-nav.rtl.open .mobile-nav-inner {
          transform: translateX(0);
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: #2d3436;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
        }

        .admin-navbar.rtl .mobile-nav-link {
          flex-direction: row-reverse;
        }

        .mobile-nav-link:hover {
          background: rgba(0,0,0,0.05);
        }

        .mobile-nav-link.active {
          background: rgba(74, 158, 255, 0.1);
          color: #4a9eff;
        }

        .mobile-nav-link svg {
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .mobile-nav-link.logout {
          color: #e74c3c;
        }

        .mobile-nav-link.logout:hover {
          background: rgba(231, 76, 60, 0.08);
        }

        .mobile-nav-inner hr {
          margin: 8px 0;
          border-color: #e9ecef;
        }

        /* ===== Responsive ===== */
        @media (max-width: 1200px) {
          .desktop-nav .nav-link span {
            display: none;
          }
          .desktop-nav .nav-link {
            padding: 8px 12px;
          }
        }

        @media (max-width: 992px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .mobile-nav {
            display: block !important;
          }
          .navbar-container {
            padding: 0 16px;
          }
          .brand-text {
            font-size: 1rem;
          }
          .user-name {
            display: none;
          }
          .user-menu-btn {
            padding: 6px 8px;
          }
          .notification-dropdown {
            width: 320px;
            right: -60px;
          }
          .admin-navbar.rtl .notification-dropdown {
            right: auto;
            left: -60px;
          }
          .user-dropdown {
            width: 260px;
          }
        }

        @media (max-width: 576px) {
          .navbar-container {
            padding: 0 12px;
            height: 56px;
          }
          .mobile-nav-inner {
            width: 280px;
          }
          .brand-text {
            font-size: 0.9rem;
          }
          .brand-icon {
            font-size: 1.3rem;
          }
          .notification-btn {
            padding: 6px 8px;
            font-size: 1rem;
          }
          .notification-badge {
            font-size: 0.5rem;
            min-width: 16px;
            height: 16px;
            padding: 1px 5px;
          }
          .notification-dropdown {
            width: 290px;
            right: -40px;
            max-height: 400px;
          }
          .admin-navbar.rtl .notification-dropdown {
            right: auto;
            left: -40px;
          }
          .user-menu-btn {
            padding: 4px 6px;
          }
          .user-avatar-icon {
            font-size: 1.6rem;
          }
          .user-dropdown {
            width: 240px;
          }
          .user-dropdown.dropdown-ltr {
            right: -20px;
          }
          .user-dropdown.dropdown-rtl {
            left: -20px;
            right: auto;
          }
          .mobile-nav-link {
            padding: 10px 14px;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 400px) {
          .navbar-container {
            padding: 0 8px;
            height: 50px;
          }
          .brand-text {
            font-size: 0.8rem;
          }
          .brand-icon {
            font-size: 1.1rem;
          }
          .mobile-nav-inner {
            width: 260px;
            padding: 12px 16px;
          }
          .notification-dropdown {
            width: 260px;
            right: -20px;
          }
          .admin-navbar.rtl .notification-dropdown {
            right: auto;
            left: -20px;
          }
          .user-dropdown {
            width: 220px;
          }
          .user-dropdown.dropdown-ltr {
            right: -10px;
          }
          .user-dropdown.dropdown-rtl {
            left: -10px;
            right: auto;
          }
          .notification-item {
            padding: 10px 14px;
          }
          .notif-title {
            font-size: 0.8rem;
          }
          .notif-message {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </>
  );
};

export default AdminNavbar;