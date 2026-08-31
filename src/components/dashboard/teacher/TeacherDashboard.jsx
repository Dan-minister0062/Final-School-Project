// src/components/dashboard/teacher/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaUserGraduate,
  FaTasks,
  FaClock,
  FaBell,
  FaCalendarCheck,
  FaPlusCircle,
  FaEdit,
  FaChartLine,
  FaClipboardList,
  FaSync,
  FaArrowRight,
  FaExclamationTriangle, // <-- THIS WAS MISSING
} from "react-icons/fa";
import { useLanguage } from "../../../context/LanguageContext";
import { useNotification } from "../../../hooks/useNotification";
import { teacherService } from "../../../services/teacherService";
import { assessmentService } from "../../../services/assessmentService";
import { attendanceService } from "../../../services/attendanceService";
import notificationService from "../../../services/notificationService";
import LoadingSpinner from "../../common/LoadingSpinner";
import EmptyState from "../../common/EmptyState";

// ===== ALWAYS use English numbers =====
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString();
};

const TeacherDashboard = () => {
  const { isArabic } = useLanguage();
  const { notify } = useNotification();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // ===== LOAD DASHBOARD DATA =====
  const loadDashboardData = () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading teacher dashboard data...');
      
      // Get the current teacher
      const teacher = teacherService.getCurrentTeacher();
      console.log('👨‍🏫 Current teacher:', teacher);
      
      if (!teacher) {
        console.warn('⚠️ No teacher found');
        setError(isArabic ? 'لم يتم العثور على المعلم' : 'Teacher not found');
        setLoading(false);
        return;
      }

      // Get dashboard statistics
      const dashboardStats = teacherService.getDashboardStats(teacher.id);
      console.log("📊 Dashboard stats:", dashboardStats);
      setStats(dashboardStats);

      // Get notifications
      const notifications = teacherService.getTeacherNotifications(teacher.id);
      console.log("🔔 Notifications:", notifications.length);
      setRecentNotifications(notifications.slice(0, 5));

      // Get assessments
      const assessments = teacherService.getTeacherAssessments(teacher.id);
      console.log("📝 Assessments:", assessments.length);
      const upcoming = assessments
        .filter((a) => a.dueDate && new Date(a.dueDate) > new Date())
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
      setUpcomingAssessments(upcoming);

      // Get recent activity
      const activity = getRecentActivity();
      setRecentActivity(activity);

      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading dashboard data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // ===== GET RECENT ACTIVITY =====
  const getRecentActivity = () => {
    const activities = [];

    try {
      const currentTeacher = teacherService.getCurrentTeacher();
      if (!currentTeacher) return activities;
      
      const assessments = teacherService.getTeacherAssessments(currentTeacher.id);
      assessments.slice(0, 3).forEach((a) => {
        activities.push({
          id: `act_${a.id}`,
          type: "assessment",
          description: isArabic
            ? `إنشاء تقييم: ${a.title}`
            : `Created assessment: ${a.title}`,
          timestamp: a.createdAt || new Date().toISOString(),
          icon: "📝",
        });
      });

      const attendanceRecords = attendanceService.getAttendanceHistory ? 
        attendanceService.getAttendanceHistory().slice(0, 3) : [];
      attendanceRecords.forEach((r) => {
        activities.push({
          id: `act_${r.classId}_${r.date}`,
          type: "attendance",
          description: isArabic
            ? `تسجيل الحضور للفصل في ${r.date}`
            : `Marked attendance for class on ${r.date}`,
          timestamp: r.updatedAt || r.createdAt || new Date().toISOString(),
          icon: "✅",
        });
      });
    } catch (err) {
      console.warn('Error getting recent activity:', err);
    }

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  };

  // ===== HANDLE QUICK ACTIONS =====
  const handleQuickAction = (action) => {
    switch (action) {
      case "markAttendance":
        window.location.href = "/dashboard/teacher/attendance";
        break;
      case "createAssessment":
        window.location.href = "/dashboard/teacher/assessments";
        break;
      case "markAssessments":
        window.location.href = "/dashboard/teacher/assessments";
        break;
      case "viewClasses":
        window.location.href = "/dashboard/teacher/classes";
        break;
      default:
        break;
    }
  };

  // ===== HANDLE REFRESH =====
  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    setTimeout(() => {
      setRefreshing(false);
      if (notify) {
        notify(
          isArabic ? 'تم تحديث البيانات بنجاح' : 'Data refreshed successfully',
          'info'
        );
      }
    }, 800);
  };

  // ===== SETUP EFFECT =====
  useEffect(() => {
    // Load initial data
    loadDashboardData();

    // Listen for notification updates
    let unsubscribeNotification = null;
    let unsubscribeTeacher = null;
    let unsubscribeAssessment = null;

    try {
      if (notificationService && typeof notificationService.addListener === 'function') {
        unsubscribeNotification = notificationService.addListener(() => {
          console.log('🔔 Notification updated, refreshing dashboard');
          loadDashboardData();
        });
      }
    } catch (err) {
      console.warn('Could not subscribe to notification service:', err);
    }

    try {
      if (teacherService && typeof teacherService.addListener === 'function') {
        unsubscribeTeacher = teacherService.addListener(() => {
          console.log('👨‍🏫 Teacher data changed, refreshing dashboard');
          loadDashboardData();
        });
      }
    } catch (err) {
      console.warn('Could not subscribe to teacher service:', err);
    }

    try {
      if (assessmentService && typeof assessmentService.addListener === 'function') {
        unsubscribeAssessment = assessmentService.addListener(() => {
          console.log('📝 Assessment changed, refreshing dashboard');
          loadDashboardData();
        });
      }
    } catch (err) {
      console.warn('Could not subscribe to assessment service:', err);
    }

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e) => {
      if (
        e.key === "school_students" ||
        e.key === "school_classes" ||
        e.key === "school_notifications" ||
        e.key === "school_users"
      ) {
        console.log("🔄 Storage changed, refreshing dashboard");
        loadDashboardData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom events
    const handleStudentAdded = () => {
      console.log("👨‍🎓 Student added, refreshing dashboard");
      loadDashboardData();
    };
    window.addEventListener("studentAdded", handleStudentAdded);

    const handleClassAssigned = () => {
      console.log("📚 Class assigned, refreshing dashboard");
      loadDashboardData();
    };
    window.addEventListener("classAssigned", handleClassAssigned);

    const handleNotificationAdded = () => {
      console.log("🔔 Notification added, refreshing dashboard");
      loadDashboardData();
    };
    window.addEventListener("notificationAdded", handleNotificationAdded);

    const handleUsersUpdated = () => {
      console.log("👤 Users updated, refreshing dashboard");
      loadDashboardData();
    };
    window.addEventListener("usersUpdated", handleUsersUpdated);

    // Clean up
    return () => {
      if (unsubscribeNotification) unsubscribeNotification();
      if (unsubscribeTeacher) unsubscribeTeacher();
      if (unsubscribeAssessment) unsubscribeAssessment();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("studentAdded", handleStudentAdded);
      window.removeEventListener("classAssigned", handleClassAssigned);
      window.removeEventListener("notificationAdded", handleNotificationAdded);
      window.removeEventListener("usersUpdated", handleUsersUpdated);
    };
  }, []);

  // ===== RENDER STATES =====
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={arabicFontStyle}>
          {isArabic ? 'جاري تحميل البيانات...' : 'Loading data...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <FaExclamationTriangle size={48} className="text-warning mb-3" />
        <p className="text-danger" style={arabicFontStyle}>{error}</p>
        <Button variant="primary" onClick={loadDashboardData} style={{ ...arabicFontStyle, borderRadius: '12px' }}>
          <FaSync className="me-2" /> {isArabic ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <EmptyState
        title={isArabic ? "لا توجد بيانات" : "No Data Available"}
        message={
          isArabic
            ? "لم يتم العثور على بيانات للعرض"
            : "No data found to display"
        }
        icon="📊"
      />
    );
  }

  // ===== STATS CARDS CONFIGURATION =====
  const statsCards = [
    {
      icon: <FaChalkboardTeacher />,
      number: stats.totalClasses || 0,
      label: isArabic ? 'الفصول' : 'Classes',
      gradientClass: 'total-card',
      iconClass: 'total-icon',
      onClick: () => window.location.href = '/dashboard/teacher/classes'
    },
    {
      icon: <FaUserGraduate />,
      number: stats.totalStudents || 0,
      label: isArabic ? 'الطلاب' : 'Students',
      gradientClass: 'active-card',
      iconClass: 'active-icon',
      onClick: () => window.location.href = '/dashboard/teacher/my-students'
    },
    {
      icon: <FaTasks />,
      number: stats.activeAssessments || 0,
      label: isArabic ? 'تقييمات نشطة' : 'Active Assessments',
      gradientClass: 'children-card',
      iconClass: 'children-icon',
      onClick: () => window.location.href = '/dashboard/teacher/assessments'
    },
    {
      icon: <FaClock />,
      number: stats.pendingMarking || 0,
      label: isArabic ? 'بانتظار التصحيح' : 'Pending Marking',
      gradientClass: 'inactive-card',
      iconClass: 'inactive-icon',
      onClick: () => window.location.href = '/dashboard/teacher/assessments'
    },
    {
      icon: <FaCalendarCheck />,
      number: stats.todayAttendance || 'Pending',
      label: isArabic ? 'حضور اليوم' : "Today's Attendance",
      gradientClass: 'active-card',
      iconClass: 'active-icon',
      onClick: () => window.location.href = '/dashboard/teacher/attendance'
    },
    {
      icon: <FaBell />,
      number: stats.unreadNotifications || 0,
      label: isArabic ? 'إشعارات غير مقروءة' : 'Unread Notifications',
      gradientClass: 'children-card',
      iconClass: 'children-icon',
      onClick: () => window.location.href = '/dashboard/teacher/notifications'
    },
  ];

  return (
    <div className="teacher-dashboard" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* ===== PAGE HEADER ===== */}
      <div className="page-header d-flex flex-wrap flex-sm-nowrap justify-content-between align-items-center gap-2 gap-md-3 mb-3 mb-md-4">
        <div className="flex-grow-1 min-width-0">
          <h4 className="fw-bold mb-0 mb-sm-1" style={{ 
            ...arabicFontStyle, 
            color: '#4a9eff', 
            fontSize: isArabic ? 'clamp(1rem, 2vw, 1.5rem)' : 'clamp(0.95rem, 1.8vw, 1.4rem)' 
          }}>
            <FaChalkboardTeacher className="me-2" /> 
            {isArabic ? 'لوحة المعلم' : 'Teacher Dashboard'}
          </h4>
          <p className="text-muted mb-0 d-none d-sm-block" style={{ 
            ...arabicFontStyle, 
            fontSize: isArabic ? 'clamp(0.8rem, 1vw, 0.95rem)' : 'clamp(0.75rem, 0.9vw, 0.9rem)' 
          }}>
            {isArabic 
              ? 'مرحباً بعودتك! إليك نظرة عامة على نشاطاتك'
              : 'Welcome back! Here\'s an overview of your activities'}
          </p>
        </div>
        <div className="d-flex gap-1 gap-sm-2 flex-wrap flex-shrink-0">
          <Button 
            variant="outline-primary" 
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

      {/* ===== STATS CARDS ===== */}
      <Row className="g-2 g-sm-3 g-md-4 mb-3 mb-md-4">
        {statsCards.map((stat, index) => (
          <Col key={index} xs={6} sm={6} md={4} lg={2}>
            <div 
              className={`stat-card-enhanced ${stat.gradientClass}`}
              onClick={stat.onClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-card-gradient-bar"></div>
              <div className="stat-card-content">
                <div className={`stat-icon-wrapper ${stat.iconClass}`}>
                  {stat.icon}
                </div>
                <div className="stat-info">
                  <span className="stat-number">
                    {formatNumber(stat.number)}
                  </span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              </div>
              <div className="stat-card-shimmer"></div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="quick-actions-wrapper mb-4">
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <Button
            variant="outline-primary"
            size="sm"
            className="quick-action-btn"
            onClick={() => handleQuickAction("markAttendance")}
            style={arabicFontStyle}
          >
            <FaCalendarCheck className="me-1" size={isMobile ? 12 : 14} />
            {isArabic ? 'تسجيل الحضور' : 'Mark Attendance'}
          </Button>
          <Button
            variant="outline-success"
            size="sm"
            className="quick-action-btn"
            onClick={() => handleQuickAction("createAssessment")}
            style={arabicFontStyle}
          >
            <FaPlusCircle className="me-1" size={isMobile ? 12 : 14} />
            {isArabic ? 'إنشاء تقييم' : 'Create Assessment'}
          </Button>
          <Button
            variant="outline-warning"
            size="sm"
            className="quick-action-btn"
            onClick={() => handleQuickAction("markAssessments")}
            style={arabicFontStyle}
          >
            <FaEdit className="me-1" size={isMobile ? 12 : 14} />
            {isArabic ? 'تصحيح التقييمات' : 'Mark Assessments'}
          </Button>
          <Button
            variant="outline-info"
            size="sm"
            className="quick-action-btn"
            onClick={() => handleQuickAction("viewClasses")}
            style={arabicFontStyle}
          >
            <FaChalkboardTeacher className="me-1" size={isMobile ? 12 : 14} />
            {isArabic ? 'عرض فصولي' : 'View My Classes'}
          </Button>
        </div>
      </div>

      {/* ===== THREE COLUMN SECTION ===== */}
      <Row className="g-3 g-md-4">
        {/* Recent Notifications */}
        <Col lg={4} md={12}>
          <Card className="modern-card h-100" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
            <div className="card-top-bar" style={{
              height: '4px',
              background: 'linear-gradient(90deg, #4a9eff, #6ab0ff)'
            }}></div>
            <Card.Header className="modern-card-header d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
              <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: '#4a9eff', fontSize: isArabic ? 'clamp(0.9rem, 1.2vw, 1.1rem)' : 'clamp(0.85rem, 1.1vw, 1.05rem)' }}>
                <FaBell className="me-2" size={isMobile ? 14 : 16} />
                {isArabic ? 'آخر الإشعارات' : 'Recent Notifications'}
              </h6>
              <Link to="/dashboard/teacher/notifications" className="text-decoration-none small" style={arabicFontStyle}>
                {isArabic ? 'عرض الكل' : 'View All'}
                <FaArrowRight className="ms-1" size={isMobile ? 10 : 12} />
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {recentNotifications.length > 0 ? (
                <div className="notification-list">
                  {recentNotifications.map((notification) => (
                    <div key={notification.id} className="notification-item px-2 px-sm-3 py-2 border-bottom d-flex align-items-start gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
                      <div className="notification-icon-wrapper" style={{
                        width: isMobile ? '28px' : '32px',
                        height: isMobile ? '28px' : '32px',
                        borderRadius: '50%',
                        background: !notification.read ? 'rgba(74, 158, 255, 0.15)' : 'rgba(0,0,0,0.05)',
                        color: !notification.read ? '#4a9eff' : '#6c757d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: isMobile ? '0.7rem' : '0.8rem'
                      }}>
                        <FaBell size={isMobile ? 10 : 12} />
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-0 small" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.75rem' : '0.85rem', color: darkMode ? '#e9ecef' : '#212529' }}>
                          {notification.message || notification.title}
                        </p>
                        <small className="text-muted" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.55rem' : '0.65rem' }}>
                          {notification.time || new Date(notification.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      {!notification.read && (
                        <span className="unread-dot" style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#4a9eff',
                          flexShrink: 0,
                          marginTop: '4px'
                        }}></span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <FaBell size={isMobile ? 30 : 40} className="mb-2 opacity-25" />
                  <p style={arabicFontStyle}>
                    {isArabic ? 'لا توجد إشعارات' : 'No notifications'}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Upcoming Assessments */}
        <Col lg={4} md={12}>
          <Card className="modern-card h-100" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
            <div className="card-top-bar" style={{
              height: '4px',
              background: 'linear-gradient(90deg, #f39c12, #e67e22)'
            }}></div>
            <Card.Header className="modern-card-header d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
              <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: '#f39c12', fontSize: isArabic ? 'clamp(0.9rem, 1.2vw, 1.1rem)' : 'clamp(0.85rem, 1.1vw, 1.05rem)' }}>
                <FaClipboardList className="me-2" size={isMobile ? 14 : 16} />
                {isArabic ? 'التقييمات القادمة' : 'Upcoming Assessments'}
              </h6>
              <Link to="/dashboard/teacher/assessments" className="text-decoration-none small" style={arabicFontStyle}>
                {isArabic ? 'عرض الكل' : 'View All'}
                <FaArrowRight className="ms-1" size={isMobile ? 10 : 12} />
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {upcomingAssessments.length > 0 ? (
                upcomingAssessments.map((assessment) => (
                  <div key={assessment.id} className="upcoming-item px-2 px-sm-3 py-2 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
                    <div>
                      <p className="mb-0 small fw-semibold" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.75rem' : '0.85rem', color: darkMode ? '#e9ecef' : '#212529' }}>
                        {assessment.title}
                      </p>
                      <small className="text-muted" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.55rem' : '0.65rem' }}>
                        <FaClock size={isMobile ? 8 : 10} className="me-1" />
                        {isArabic ? 'تاريخ الاستحقاق: ' : 'Due: '}
                        {new Date(assessment.dueDate).toLocaleDateString()}
                      </small>
                    </div>
                    <Badge 
                      style={{ 
                        background: assessment.status === 'published' ? '#2ecc71' : '#f39c12',
                        color: 'white',
                        fontSize: isMobile ? '0.5rem' : '0.6rem',
                        padding: '4px 10px',
                        borderRadius: '50px'
                      }}
                    >
                      {assessment.status === 'published' ? (isArabic ? 'منشور' : 'Published') : (isArabic ? 'مسودة' : 'Draft')}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted">
                  <FaClipboardList size={isMobile ? 30 : 40} className="mb-2 opacity-25" />
                  <p style={arabicFontStyle}>
                    {isArabic ? 'لا توجد تقييمات قادمة' : 'No upcoming assessments'}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col lg={4} md={12}>
          <Card className="modern-card h-100" style={{ background: darkMode ? '#1a1a2e' : '#ffffff', borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
            <div className="card-top-bar" style={{
              height: '4px',
              background: 'linear-gradient(90deg, #2ecc71, #27ae60)'
            }}></div>
            <Card.Header className="modern-card-header d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
              <h6 className="fw-bold mb-0" style={{ ...arabicFontStyle, color: '#2ecc71', fontSize: isArabic ? 'clamp(0.9rem, 1.2vw, 1.1rem)' : 'clamp(0.85rem, 1.1vw, 1.05rem)' }}>
                <FaChartLine className="me-2" size={isMobile ? 14 : 16} />
                {isArabic ? 'النشاطات الأخيرة' : 'Recent Activity'}
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              {recentActivity.length > 0 ? (
                <div className="activity-timeline">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item px-2 px-sm-3 py-2 border-bottom d-flex align-items-center gap-2" style={{ borderColor: darkMode ? '#2d2d44' : '#e9ecef' }}>
                      <div className="activity-icon" style={{
                        width: isMobile ? '28px' : '32px',
                        height: isMobile ? '28px' : '32px',
                        borderRadius: '50%',
                        background: 'rgba(46, 204, 113, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '1.1rem' : '1.3rem',
                        flexShrink: 0
                      }}>
                        {activity.icon}
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-0 small" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.75rem' : '0.85rem', color: darkMode ? '#e9ecef' : '#212529' }}>
                          {activity.description}
                        </p>
                        <small className="text-muted" style={{ ...arabicFontStyle, fontSize: isMobile ? '0.55rem' : '0.65rem' }}>
                          <FaClock size={isMobile ? 8 : 10} className="me-1" />
                          {new Date(activity.timestamp).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <FaChartLine size={isMobile ? 30 : 40} className="mb-2 opacity-25" />
                  <p style={arabicFontStyle}>
                    {isArabic ? 'لا توجد نشاطات حديثة' : 'No recent activity'}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&family=Vazirmatn:wght@100..900&display=swap');

        .teacher-dashboard { 
          padding: 0;
          max-width: 100vw;
          overflow-x: hidden;
        }

        .teacher-dashboard * {
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

        /* ===== ENHANCED STAT CARDS ===== */
        .stat-card-enhanced {
          background: ${darkMode ? '#1a1a2e' : '#ffffff'};
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
          border-radius: 16px;
          padding: 16px 18px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          min-height: 80px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }

        .stat-card-enhanced:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 40px rgba(0,0,0,0.10);
        }

        .stat-card-gradient-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          transition: height 0.4s ease;
        }

        .stat-card-enhanced:hover .stat-card-gradient-bar {
          height: 5px;
        }

        .total-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #4a9eff, #6ab0ff);
        }

        .active-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #2ecc71, #27ae60);
        }

        .children-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #f39c12, #e67e22);
        }

        .inactive-card .stat-card-gradient-bar {
          background: linear-gradient(90deg, #9b59b6, #8e44ad);
        }

        .stat-card-content {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .stat-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .stat-card-enhanced:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(-5deg);
        }

        .total-icon {
          background: rgba(74, 158, 255, 0.15);
          color: #4a9eff;
        }

        .active-icon {
          background: rgba(46, 204, 113, 0.15);
          color: #2ecc71;
        }

        .children-icon {
          background: rgba(243, 156, 18, 0.15);
          color: #f39c12;
        }

        .inactive-icon {
          background: rgba(155, 89, 182, 0.15);
          color: #9b59b6;
        }

        .stat-info {
          flex: 1;
          min-width: 0;
        }

        .stat-number {
          display: block;
          font-size: 1.4rem;
          font-weight: 700;
          color: ${darkMode ? '#e9ecef' : '#1a1a2e'};
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .stat-label {
          font-size: 0.6rem;
          color: ${darkMode ? '#adb5bd' : '#6c757d'};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          margin-top: 2px;
        }

        .stat-card-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          transition: left 0.6s ease;
          pointer-events: none;
        }

        .stat-card-enhanced:hover .stat-card-shimmer {
          left: 100%;
        }

        /* ===== QUICK ACTIONS ===== */
        .quick-actions-wrapper {
          background: ${darkMode ? '#1a1a2e' : '#ffffff'};
          padding: clamp(8px, 1.2vw, 16px);
          border-radius: 12px;
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
        }

        .quick-action-btn {
          border-radius: 50px !important;
          padding: clamp(4px, 0.8vw, 8px) clamp(12px, 2vw, 20px) !important;
          font-size: clamp(0.65rem, 0.8vw, 0.75rem) !important;
          transition: all 0.3s ease !important;
        }
        .quick-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        /* ===== MODERN CARDS ===== */
        .modern-card {
          border-radius: 16px !important;
          border: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'} !important;
          transition: all 0.3s ease;
          overflow: hidden;
          background: ${darkMode ? '#1a1a2e' : '#ffffff'} !important;
        }
        .modern-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.06) !important;
        }

        .modern-card-header {
          background: transparent;
          border-bottom: 1px solid ${darkMode ? '#2d2d44' : '#e9ecef'};
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        [dir="rtl"] .modern-card-header { 
          flex-direction: row-reverse; 
        }
        [dir="rtl"] .modern-card-header .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        [dir="rtl"] .modern-card-header .ms-1 {
          margin-left: 0 !important;
          margin-right: 0.25rem !important;
        }

        .card-top-bar {
          transition: height 0.3s ease;
        }
        .modern-card:hover .card-top-bar {
          height: 5px;
        }

        /* ===== NOTIFICATIONS ===== */
        .notification-list {
          max-height: 280px;
          overflow-y: auto;
        }
        .notification-item {
          transition: background 0.2s ease;
        }
        .notification-item:hover {
          background: rgba(0,0,0,0.02);
        }
        .notification-icon-wrapper {
          transition: transform 0.3s ease;
        }
        .notification-item:hover .notification-icon-wrapper {
          transform: scale(1.1);
        }
        .unread-dot {
          animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ===== UPCOMING ITEMS ===== */
        .upcoming-item {
          transition: background 0.2s ease;
        }
        .upcoming-item:hover {
          background: rgba(0,0,0,0.02);
        }

        /* ===== ACTIVITIES ===== */
        .activity-timeline {
          max-height: 280px;
          overflow-y: auto;
        }
        .activity-item {
          transition: background 0.2s ease;
        }
        .activity-item:hover {
          background: rgba(0,0,0,0.02);
        }
        .activity-icon {
          transition: transform 0.3s ease;
        }
        .activity-item:hover .activity-icon {
          transform: scale(1.1);
        }

        /* ===== RTL FIXES ===== */
        [dir="rtl"] .me-2 {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }
        [dir="rtl"] .me-1 {
          margin-right: 0 !important;
          margin-left: 0.25rem !important;
        }
        [dir="rtl"] .ms-1 {
          margin-left: 0 !important;
          margin-right: 0.25rem !important;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 992px) {
          .stat-card-enhanced {
            min-height: 75px;
            padding: 14px 16px;
          }
          .stat-number {
            font-size: 1.3rem;
          }
          .stat-icon-wrapper {
            width: 36px;
            height: 36px;
            font-size: 0.95rem;
          }
        }

        @media (max-width: 768px) {
          .stat-card-enhanced {
            padding: 12px 14px;
            min-height: 70px;
          }
          .stat-number {
            font-size: 1.2rem;
          }
          .stat-icon-wrapper {
            width: 32px;
            height: 32px;
            font-size: 0.85rem;
          }
          .stat-label {
            font-size: 0.55rem;
          }
          .modern-card-header {
            padding: 10px 14px;
            flex-wrap: wrap;
            gap: 6px;
          }
          [dir="rtl"] .modern-card-header { 
            flex-direction: row-reverse; 
            flex-wrap: wrap; 
          }
          .notification-item {
            padding: 8px 10px !important;
          }
          .upcoming-item {
            padding: 8px 10px !important;
          }
          .activity-item {
            padding: 8px 10px !important;
          }
        }

        @media (max-width: 576px) {
          .stat-card-enhanced {
            padding: 10px 12px;
            min-height: 60px;
            border-radius: 12px;
          }
          .stat-number {
            font-size: 1rem;
          }
          .stat-icon-wrapper {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
            border-radius: 10px;
          }
          .stat-label {
            font-size: 0.5rem;
          }
          .stat-card-content {
            gap: 8px;
          }
          .quick-action-btn {
            font-size: 0.6rem !important;
            padding: 3px 10px !important;
          }
          .teacher-dashboard .row > .col-6 {
            flex: 0 0 50%;
            max-width: 50%;
            padding: 4px;
          }
          .teacher-dashboard .row > .col-4 {
            flex: 0 0 100%;
            max-width: 100%;
          }
          .notification-list {
            max-height: 200px;
          }
          .activity-timeline {
            max-height: 200px;
          }
          .page-header h4 {
            font-size: 0.85rem !important;
          }
        }

        @media (max-width: 400px) {
          .stat-card-enhanced { 
            padding: 8px 10px; 
            min-height: 50px; 
          }
          .stat-number { 
            font-size: 0.85rem; 
          }
          .stat-icon-wrapper { 
            width: 24px; 
            height: 24px; 
            font-size: 0.65rem; 
          }
          .stat-label { 
            font-size: 0.45rem; 
          }
          .stat-card-content { 
            gap: 6px; 
          }
          .quick-action-btn { 
            font-size: 0.5rem !important; 
            padding: 2px 8px !important; 
          }
          .modern-card-header h6 { 
            font-size: 0.7rem !important; 
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;